from sentence_transformers import CrossEncoder
from typing import List, Tuple

model = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2')

def rerank(query: str, chunks: List[str], doc_ids: List[str], top_k: int = 4) -> Tuple[List[str], List[str]]:
    if not chunks:
        return [], []

    pairs = [[query, chunk] for chunk in chunks]
    scores = model.predict(pairs)

    scored = sorted(
        zip(chunks, doc_ids, scores),
        key=lambda x: x[2],
        reverse=True
    )

    top = scored[:top_k]
    return [c for c, _, _ in top], [d for _, d, _ in top]
