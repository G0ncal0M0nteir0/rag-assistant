import chromadb
from app.services.embeddings import get_embeddings, chunk_text, get_embedding
from typing import List, Tuple
from rank_bm25 import BM25Okapi
import uuid
import logging

logger = logging.getLogger(__name__)

client = chromadb.PersistentClient(path="./chroma_db")

def get_collection():
    return client.get_or_create_collection(
        name="documents",
        metadata={"hnsw:space": "cosine"}
    )

def store_document(doc_id: str, user_id: str, text: str) -> int:
    logger.info(f"Storing document {doc_id} for user {user_id}")
    collection = get_collection()
    chunks = chunk_text(text)

    if not chunks:
        logger.warning(f"No chunks created for document {doc_id}")
        return 0

    logger.info(f"Created {len(chunks)} chunks for document {doc_id}")
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
    logger.info(f"Successfully stored {len(chunks)} chunks in vector store")

    return len(chunks)

def semantic_search(query: str, user_id: str, k: int = 6) -> List[Tuple[str, str, float]]:
    logger.info(f"Performing semantic search for user {user_id} (k={k})")
    collection = get_collection()
    query_embedding = get_embedding(query)

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=k,
        where={"user_id": user_id},
        include=["documents", "metadatas", "distances"]
    )

    if not results["documents"] or not results["documents"][0]:
        logger.info("Semantic search returned no results")
        return []

    output = []
    for chunk, meta, dist in zip(
        results["documents"][0],
        results["metadatas"][0],
        results["distances"][0]
    ):
        similarity = 1 - dist
        output.append((chunk, meta.get("doc_id", ""), similarity))
    
    logger.info(f"Semantic search found {len(output)} results")
    return output

def keyword_search(query: str, user_id: str, k: int = 6) -> List[Tuple[str, str, float]]:
    logger.info(f"Performing keyword search for user {user_id} (k={k})")
    collection = get_collection()

    all_results = collection.get(
        where={"user_id": user_id},
        include=["documents", "metadatas"]
    )

    if not all_results["documents"]:
        logger.info("No documents found for user in keyword search")
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

    logger.info(f"Keyword search found {len(scored)} results")
    return [(chunk, meta.get("doc_id", ""), score) for chunk, meta, score in scored]

def reciprocal_rank_fusion(
    semantic_results: List[Tuple[str, str, float]],
    keyword_results: List[Tuple[str, str, float]],
    k: int = 60
) -> List[Tuple[str, str]]:
    logger.info("Performing Reciprocal Rank Fusion")
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
    logger.info(f"RRF merged into {len(sorted_keys)} unique chunks")
    return [chunk_map[key] for key in sorted_keys]

def retrieve_chunks(query: str, user_id: str, k: int = 4) -> Tuple[List[str], List[str]]:
    logger.info(f"Retrieving chunks for query: '{query[:50]}...'")
    semantic_results = semantic_search(query, user_id, k=6)
    keyword_results = keyword_search(query, user_id, k=6)

    if not semantic_results and not keyword_results:
        logger.warning("No results found in both semantic and keyword search")
        return [], []

    merged = reciprocal_rank_fusion(semantic_results, keyword_results)

    MIN_SIMILARITY = 0.3
    semantic_chunks = {chunk[:100] for chunk, _, score in semantic_results if score >= MIN_SIMILARITY}
    logger.info(f"Semantic chunks above threshold (0.3): {len(semantic_chunks)}")

    final = []
    for chunk, doc_id in merged:
        key = chunk[:100]
        # Include if it has semantic similarity OR if we are relying on keyword matches
        if key in semantic_chunks or keyword_results:
            final.append((chunk, doc_id))
        if len(final) >= k:
            break

    logger.info(f"Final retrieval returned {len(final)} chunks")
    chunks = [c for c, _ in final]
    doc_ids = [d for _, d in final]

    return chunks, doc_ids

def delete_document_chunks(doc_id: str):
    logger.info(f"Deleting chunks for document {doc_id}")
    collection = get_collection()
    results = collection.get(where={"doc_id": doc_id})
    if results["ids"]:
        collection.delete(ids=results["ids"])
        logger.info(f"Deleted {len(results['ids'])} chunks")