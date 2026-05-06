import chromadb
from chromadb.config import Settings
from app.services.embeddings import get_embeddings, chunk_text
from typing import List
import uuid

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
    metadatas = [{"user_id": user_id, "doc_id": doc_id, "chunk_index": i}
                 for i in range(len(chunks))]

    collection.add(
        ids=ids,
        embeddings=embeddings,
        documents=chunks,
        metadatas=metadatas
    )

    return len(chunks)

def retrieve_chunks(query: str, user_id: str, k: int = 4) -> List[str]:
    from app.services.embeddings import get_embedding
    collection = get_collection()

    query_embedding = get_embedding(query)

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=k,
        where={"user_id": user_id}
    )

    if not results["documents"] or not results["documents"][0]:
        return []

    return results["documents"][0]

def delete_document_chunks(doc_id: str):
    collection = get_collection()
    results = collection.get(where={"doc_id": doc_id})
    if results["ids"]:
        collection.delete(ids=results["ids"])