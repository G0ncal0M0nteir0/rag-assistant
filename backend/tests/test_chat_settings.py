import uuid
import sys
from types import SimpleNamespace

from app import models
from app.auth import create_access_token


def auth_header(user):
    token = create_access_token({"sub": str(user.id)})
    return {"Authorization": f"Bearer {token}"}


def test_chat_settings_are_persisted_via_profile_update(api_context):
    response = api_context.client.patch(
        "/auth/me",
        headers=auth_header(api_context.user),
        json={
            "model": "mixtral-8x7b-32768",
            "temperature": 0.9,
            "top_k": 3,
            "chunk_size": 450,
        },
    )

    assert response.status_code == 200
    assert response.json()["model"] == "mixtral-8x7b-32768"
    assert response.json()["temperature"] == 0.9
    assert response.json()["top_k"] == 3
    assert response.json()["chunk_size"] == 450

    assert api_context.user.model == "mixtral-8x7b-32768"
    assert api_context.user.temperature == 0.9
    assert api_context.user.top_k == 3
    assert api_context.user.chunk_size == 450


def test_chat_ask_uses_user_model_and_temperature(api_context, monkeypatch):
    captured = {}

    def fake_generate_answer(question, context_chunks, history=None, model=None, temperature=None):
        captured["model"] = model
        captured["temperature"] = temperature
        return {
            "answer": f"Answer for: {question}",
            "prompt_tokens": 1,
            "answer_tokens": 2,
            "total_tokens": 3,
        }


    from app.routers import chat as chat_mod

    chat_mod.retrieve_chunks = lambda query, user_id, k=8, initial_k=9: ([], [])
    chat_mod.generate_answer = fake_generate_answer

    api_context.user.model = "llama-3.1-70b-versatile"
    api_context.user.temperature = 0.7

    response = api_context.client.post(
        "/chat/ask",
        headers=auth_header(api_context.user),
        json={"question": "How are settings passed?"},
    )

    assert response.status_code == 200
    assert captured["model"] == "llama-3.1-70b-versatile"
    assert captured["temperature"] == 0.7


def test_chat_ask_uses_top_k_for_retrieval_and_sources(api_context, monkeypatch):
    document_one = models.Document(
        id=uuid.uuid4(),
        user_id=api_context.user.id,
        filename="one.txt",
        file_path=None,
        status="ready",
        chunk_count=1,
    )
    document_two = models.Document(
        id=uuid.uuid4(),
        user_id=api_context.user.id,
        filename="two.txt",
        file_path=None,
        status="ready",
        chunk_count=1,
    )
    api_context.db.add(document_one)
    api_context.db.add(document_two)

    retrieved_calls = []

    def fake_retrieve_chunks(query, user_id, k=8, initial_k=8):
        retrieved_calls.append((query, user_id, k, initial_k))
        return ["context one", "context two"], [str(document_one.id), str(document_two.id)]

    def fake_generate_answer(question, context_chunks, history=None, model=None, temperature=None):
        return {
            "answer": f"Answer for: {question}",
            "prompt_tokens": 10,
            "answer_tokens": 5,
            "total_tokens": 15,
        }

    from app.routers import chat as chat_mod
    chat_mod.retrieve_chunks = fake_retrieve_chunks
    chat_mod.rerank = lambda query, chunks, doc_ids, top_k=4: (chunks[:top_k], doc_ids[:top_k])
    chat_mod.generate_answer = fake_generate_answer

    api_context.user.top_k = 2

    response = api_context.client.post(
        "/chat/ask",
        headers=auth_header(api_context.user),
        json={"question": "Which sources should I see?"},
    )

    assert response.status_code == 200
    assert retrieved_calls[-1][2] == 2
    assert retrieved_calls[-1][3] == 3
    assert response.json()["sources"] == ["one.txt", "two.txt"]


def test_document_upload_uses_chunk_size(api_context, monkeypatch):
    captured = {}

    def fake_store_document(doc_id, user_id, text, chunk_size=800):
        captured["chunk_size"] = chunk_size
        return 4

    monkeypatch.setattr("app.routers.documents.store_document", fake_store_document, raising=False)
    api_context.user.chunk_size = 123

    response = api_context.client.post(
        "/documents/upload",
        headers=auth_header(api_context.user),
        files={"file": ("sample.txt", "hello world", "text/plain")},
    )

    assert response.status_code == 200
    assert captured["chunk_size"] == 123
    assert response.json()["chunk_count"] == 4


def test_dark_mode_is_persisted_via_profile_update(api_context):
    # Test setting dark_mode to False (light mode)
    response = api_context.client.patch(
        "/auth/me",
        headers=auth_header(api_context.user),
        json={"dark_mode": False},
    )

    assert response.status_code == 200
    assert response.json()["dark_mode"] is False
    assert api_context.user.dark_mode is False

    # Test setting dark_mode back to True (dark mode)
    response = api_context.client.patch(
        "/auth/me",
        headers=auth_header(api_context.user),
        json={"dark_mode": True},
    )

    assert response.status_code == 200
    assert response.json()["dark_mode"] is True
    assert api_context.user.dark_mode is True

