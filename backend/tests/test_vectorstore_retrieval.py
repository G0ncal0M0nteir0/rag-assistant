import importlib
import sys
from types import SimpleNamespace

import pytest


@pytest.fixture()
def vectorstore_module(monkeypatch, tmp_path):
    fake_embeddings = SimpleNamespace(
        get_embeddings=lambda texts: [[0.1] for _ in texts],
        get_embedding=lambda text: [0.1],
        chunk_text=lambda text: [text],
    )
    monkeypatch.setitem(sys.modules, "app.services.embeddings", fake_embeddings)
    monkeypatch.chdir(tmp_path)

    module = importlib.import_module("app.services.vectorstore")
    return importlib.reload(module)


def test_retrieve_chunks_rejects_low_semantic_and_zero_keyword_scores(vectorstore_module, monkeypatch):
    monkeypatch.setattr(
        vectorstore_module,
        "semantic_search",
        lambda query, user_id, k=6: [("weak semantic match", "doc-1", 0.1)],
    )
    monkeypatch.setattr(
        vectorstore_module,
        "keyword_search",
        lambda query, user_id, k=6: [("zero keyword match", "doc-2", 0.0)],
    )

    chunks, doc_ids = vectorstore_module.retrieve_chunks("question", "user-1")

    assert chunks == []
    assert doc_ids == []


def test_retrieve_chunks_keeps_high_similarity_semantic_matches(vectorstore_module, monkeypatch):
    monkeypatch.setattr(
        vectorstore_module,
        "semantic_search",
        lambda query, user_id, k=6: [("strong semantic match", "doc-1", 0.8)],
    )
    monkeypatch.setattr(vectorstore_module, "keyword_search", lambda query, user_id, k=6: [])

    chunks, doc_ids = vectorstore_module.retrieve_chunks("question", "user-1")

    assert chunks == ["strong semantic match"]
    assert doc_ids == ["doc-1"]


def test_retrieve_chunks_keeps_positive_keyword_matches(vectorstore_module, monkeypatch):
    monkeypatch.setattr(vectorstore_module, "semantic_search", lambda query, user_id, k=6: [])
    monkeypatch.setattr(
        vectorstore_module,
        "keyword_search",
        lambda query, user_id, k=6: [("positive keyword match", "doc-2", 1.2)],
    )

    chunks, doc_ids = vectorstore_module.retrieve_chunks("question", "user-1")

    assert chunks == ["positive keyword match"]
    assert doc_ids == ["doc-2"]
