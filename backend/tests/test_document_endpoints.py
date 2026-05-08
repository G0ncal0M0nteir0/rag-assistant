from pathlib import Path

from app.auth import create_access_token


def auth_header(user):
    token = create_access_token({"sub": str(user.id)})
    return {"Authorization": f"Bearer {token}"}


def test_document_routes_require_authentication(api_context):
    response = api_context.client.get("/documents/")

    assert response.status_code == 401


def test_upload_list_and_delete_document(api_context):
    upload_response = api_context.client.post(
        "/documents/upload",
        headers=auth_header(api_context.user),
        files={"file": ("notes.txt", b"These are useful notes.", "text/plain")},
    )

    assert upload_response.status_code == 200
    document = upload_response.json()
    assert document["filename"] == "notes.txt"
    assert document["status"] == "ready"
    assert document["chunk_count"] == 2

    db_document = api_context.db.documents[0]
    original_path = Path(db_document.file_path)
    extracted_path = api_context.upload_dir / f"{db_document.id}.txt"
    assert original_path.exists()
    assert extracted_path.exists()

    list_response = api_context.client.get("/documents/", headers=auth_header(api_context.user))

    assert list_response.status_code == 200
    assert [doc["filename"] for doc in list_response.json()] == ["notes.txt"]

    delete_response = api_context.client.delete(
        f"/documents/{db_document.id}",
        headers=auth_header(api_context.user),
    )

    assert delete_response.status_code == 200
    assert api_context.db.documents == []
    assert not original_path.exists()
    assert not extracted_path.exists()
    assert api_context.deleted_chunks == [str(db_document.id)]


def test_upload_rejects_duplicate_and_unsupported_documents(api_context):
    first_response = api_context.client.post(
        "/documents/upload",
        headers=auth_header(api_context.user),
        files={"file": ("notes.txt", b"first", "text/plain")},
    )
    duplicate_response = api_context.client.post(
        "/documents/upload",
        headers=auth_header(api_context.user),
        files={"file": ("notes.txt", b"second", "text/plain")},
    )
    unsupported_response = api_context.client.post(
        "/documents/upload",
        headers=auth_header(api_context.user),
        files={"file": ("image.png", b"fake", "image/png")},
    )

    assert first_response.status_code == 200
    assert duplicate_response.status_code == 400
    assert unsupported_response.status_code == 400


def test_delete_document_rejects_unknown_id(api_context):
    response = api_context.client.delete(
        "/documents/11111111-1111-1111-1111-111111111111",
        headers=auth_header(api_context.user),
    )

    assert response.status_code == 404
