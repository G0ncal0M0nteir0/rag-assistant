import uuid

from app import models
from app.auth import create_access_token


def auth_header(user):
    token = create_access_token({"sub": str(user.id)})
    return {"Authorization": f"Bearer {token}"}


def add_ready_document(api_context, filename="source.txt"):
    document = models.Document(
        id=uuid.uuid4(),
        user_id=api_context.user.id,
        filename=filename,
        file_path=None,
        status="ready",
        chunk_count=1,
    )
    api_context.db.add(document)
    return document


def test_ask_creates_session_message_token_usage_and_sources(api_context):
    document = add_ready_document(api_context)

    response = api_context.client.post(
        "/chat/ask",
        headers=auth_header(api_context.user),
        json={"question": "What does the document say?"},
    )

    assert response.status_code == 200
    assert response.json() == {
        "answer": "Answer for: What does the document say?",
        "sources": [document.filename],
        "tokens_used": 15,
    }
    assert len(api_context.db.sessions) == 1
    assert len(api_context.db.messages) == 1
    assert len(api_context.db.token_usage) == 1
    assert api_context.retrieval_calls[-1][0] == "What does the document say?"


def test_ask_reuses_existing_session(api_context):
    add_ready_document(api_context)
    session = models.ConversationSession(
        id=uuid.uuid4(),
        user_id=api_context.user.id,
        title="Existing session",
    )
    api_context.db.add(session)

    response = api_context.client.post(
        "/chat/ask",
        headers=auth_header(api_context.user),
        json={"question": "Follow up?", "session_id": str(session.id)},
    )

    assert response.status_code == 200
    assert len(api_context.db.sessions) == 1
    assert api_context.db.messages[0].session_id == session.id


def test_ask_rejects_unknown_session(api_context):
    response = api_context.client.post(
        "/chat/ask",
        headers=auth_header(api_context.user),
        json={"question": "Hello?", "session_id": "11111111-1111-1111-1111-111111111111"},
    )

    assert response.status_code == 404


def test_usage_history_and_clear_history(api_context):
    add_ready_document(api_context)
    api_context.client.post(
        "/chat/ask",
        headers=auth_header(api_context.user),
        json={"question": "First question"},
    )
    api_context.client.post(
        "/chat/ask",
        headers=auth_header(api_context.user),
        json={"question": "Second question", "session_id": str(api_context.db.sessions[0].id)},
    )

    usage_response = api_context.client.get("/chat/usage", headers=auth_header(api_context.user))
    history_response = api_context.client.get("/chat/history", headers=auth_header(api_context.user))
    clear_response = api_context.client.delete("/chat/history", headers=auth_header(api_context.user))
    empty_history_response = api_context.client.get("/chat/history", headers=auth_header(api_context.user))

    assert usage_response.status_code == 200
    assert usage_response.json()["total_tokens_used"] == 30
    assert usage_response.json()["total_requests"] == 2
    assert usage_response.json()["groq_limits"] == {"requests_per_minute": 30}

    assert history_response.status_code == 200
    assert history_response.json()["total"] == 2
    assert clear_response.status_code == 200
    assert empty_history_response.json()["total"] == 0
