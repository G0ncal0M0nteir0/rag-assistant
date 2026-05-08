import chromadb
from app.services.embeddings import get_embeddings, chunk_text, get_embedding
from typing import List, Tuple
from rank_bm25 import BM25Okapi

client = chromadb.PersistentClient(path="./chroma_db")

def get_collection():
    return client.get_or_create_collection(
        name="documents",
        metadata={"hnsw:space": "cosine"}
    )

def store_document(doc_id: str, user_id: str, text: str) -> int:
    collection = get_collection()
    chunks = chunk_text(text)

    if not chunks:
        return 0

    embeddings = get_embeddings(chunks)

    ids = [f"{doc_id}_chunk_{i}" for i in range(len(chunks))]
    metadatas = [
        {"user_id": user_id, "doc_id": doc_id, "chunk_index": i}
        for i in range(len(chunks))
    ]

    collection.add(
        ids=ids,
        embeddings=embeddings,
        documents=chunks,
        metadatas=metadatas
    )

    return len(chunks)

def semantic_search(query: str, user_id: str, k: int = 6) -> List[Tuple[str, str, float]]:
    collection = get_collection()
    query_embedding = get_embedding(query)

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=k,
        where={"user_id": user_id},
        include=["documents", "metadatas", "distances"]
    )

    if not results["documents"] or not results["documents"][0]:
        return []

    output = []
    for chunk, meta, dist in zip(
        results["documents"][0],
        results["metadatas"][0],
        results["distances"][0]
    ):
        similarity = 1 - dist
        output.append((chunk, meta.get("doc_id", ""), similarity))

    return output

def keyword_search(query: str, user_id: str, k: int = 6) -> List[Tuple[str, str, float]]:
    collection = get_collection()

    all_results = collection.get(
        where={"user_id": user_id},
        include=["documents", "metadatas"]
    )

    if not all_results["documents"]:
        return []

    chunks = all_results["documents"]
    metadatas = all_results["metadatas"]

    tokenized_chunks = [chunk.lower().split() for chunk in chunks]
    bm25 = BM25Okapi(tokenized_chunks)

    tokenized_query = query.lower().split()
    scores = bm25.get_scores(tokenized_query)

    scored = sorted(
        zip(chunks, metadatas, scores),
        key=lambda x: x[2],
        reverse=True
    )[:k]

    return [(chunk, meta.get("doc_id", ""), score) for chunk, meta, score in scored]

def reciprocal_rank_fusion(
    semantic_results: List[Tuple[str, str, float]],
    keyword_results: List[Tuple[str, str, float]],
    k: int = 60
) -> List[Tuple[str, str]]:
    scores = {}
    chunk_map = {}

    for rank, (chunk, doc_id, _) in enumerate(semantic_results):
        key = chunk[:100]
        scores[key] = scores.get(key, 0) + 1 / (k + rank + 1)
        chunk_map[key] = (chunk, doc_id)

    for rank, (chunk, doc_id, _) in enumerate(keyword_results):
        key = chunk[:100]
        scores[key] = scores.get(key, 0) + 1 / (k + rank + 1)
        chunk_map[key] = (chunk, doc_id)

    sorted_keys = sorted(scores.keys(), key=lambda x: scores[x], reverse=True)
    return [chunk_map[key] for key in sorted_keys]

def retrieve_chunks(query: str, user_id: str, k: int = 4) -> Tuple[List[str], List[str]]:
    semantic_results = semantic_search(query, user_id, k=6)
    keyword_results = keyword_search(query, user_id, k=6)

    if not semantic_results and not keyword_results:
        return [], []

    merged = reciprocal_rank_fusion(semantic_results, keyword_results)

    MIN_SIMILARITY = 0.3
    semantic_chunks = {chunk[:100] for chunk, _, score in semantic_results if score >= MIN_SIMILARITY}
    keyword_chunks = {chunk[:100] for chunk, _, score in keyword_results if score > 0}

    final = []
    for chunk, doc_id in merged:
        key = chunk[:100]
        if key in semantic_chunks or key in keyword_chunks:
            final.append((chunk, doc_id))
        if len(final) >= k:
            break

    if not final:
        return [], []

    chunks = [c for c, _ in final]
    doc_ids = [d for _, d in final]

    return chunks, doc_ids

def delete_document_chunks(doc_id: str):
    collection = get_collection()
    results = collection.get(where={"doc_id": doc_id})
    if results["ids"]:
        collection.delete(ids=results["ids"])
