from sentence_transformers import SentenceTransformer
from typing import List
import nltk

nltk.download('punkt', quiet=True)
nltk.download('punkt_tab', quiet=True)

model = SentenceTransformer('all-MiniLM-L6-v2')

def get_embedding(text: str) -> List[float]:
    return model.encode(text).tolist()

def get_embeddings(texts: List[str]) -> List[List[float]]:
    return model.encode(texts).tolist()

def chunk_text(text: str, max_words: int = 100, overlap_sentences: int = 1) -> List[str]:
    sentences = nltk.sent_tokenize(text)

    if not sentences:
        return [text] if text.strip() else []

    chunks = []
    current_chunk = []
    current_word_count = 0

    for i, sentence in enumerate(sentences):
        word_count = len(sentence.split())

        if current_word_count + word_count > max_words and current_chunk:
            chunks.append(" ".join(current_chunk))
            current_chunk = current_chunk[-overlap_sentences:]
            current_word_count = sum(len(s.split()) for s in current_chunk)

        current_chunk.append(sentence)
        current_word_count += word_count

    if current_chunk:
        chunks.append(" ".join(current_chunk))

    return chunks
