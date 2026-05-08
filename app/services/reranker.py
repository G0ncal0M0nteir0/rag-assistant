from sentence_transformers import CrossEncoder
from typing import List, Tuple
import logging

logger = logging.getLogger(__name__)

model = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2')

def rerank(query: str, chunks: List[str], doc_ids: List[str], top_k: int = 4) -> Tuple[List[str], List[str]]:
    if not chunks:
        logger.warning("No chunks provided for re-ranking")
        return [], []

    logger.info(f"Re-ranking {len(chunks)} chunks for query: '{query[:50]}...'")
    pairs = [[query, chunk] for chunk in chunks]
    scores = model.predict(pairs)

    scored = sorted(
        zip(chunks, doc_ids, scores),
        key=lambda x: x[2],
        reverse=True
    )

    for i, (chunk, doc_id, score) in enumerate(scored[:top_k]):
        logger.info(f"Top {i+1} chunk (Score: {score:.4f}): {chunk[:100]}...")

    top = scored[:top_k]
    return [c for c, _, _ in top], [d for _, d, _ in top]