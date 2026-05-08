import importlib
import sys
from types import SimpleNamespace

import pytest
from fastapi import HTTPException


@pytest.fixture()
def documents_module(monkeypatch):
    fake_vectorstore = SimpleNamespace(
        store_document=lambda *args, **kwargs: 1,
        delete_document_chunks=lambda *args, **kwargs: None,
    )
    monkeypatch.setitem(sys.modules, "app.services.vectorstore", fake_vectorstore)

    module = importlib.import_module("app.routers.documents")
    return importlib.reload(module)


def test_extract_text_reads_txt_file(documents_module, tmp_path):
    path = tmp_path / "notes.txt"
    path.write_text("hello from a document", encoding="utf-8")

    assert documents_module.extract_text(str(path), "notes.txt") == "hello from a document"


def test_extract_text_rejects_unsupported_file_type(documents_module, tmp_path):
    path = tmp_path / "image.png"
    path.write_text("not supported", encoding="utf-8")

    with pytest.raises(HTTPException) as exc_info:
        documents_module.extract_text(str(path), "image.png")

    assert exc_info.value.status_code == 400
    assert "Unsupported file type" in exc_info.value.detail


def test_file_size_error_uses_configured_limit(documents_module):
    assert documents_module.MAX_FILE_SIZE == 50 * 1024 * 1024
    assert documents_module.MAX_FILE_SIZE_MB == 50


def test_original_upload_path_prefers_stored_path(documents_module):
    doc = SimpleNamespace(file_path="uploads/original.txt", filename="original.txt")

    assert documents_module.get_original_upload_paths(doc) == ["uploads/original.txt"]


def test_original_upload_path_falls_back_only_for_single_match(documents_module, tmp_path, monkeypatch):
    upload_dir = tmp_path / "uploads"
    upload_dir.mkdir()
    expected = upload_dir / "abc_report.txt"
    expected.write_text("original", encoding="utf-8")
    (upload_dir / "other.txt").write_text("ignore", encoding="utf-8")
    monkeypatch.setattr(documents_module, "UPLOAD_DIR", str(upload_dir))

    doc = SimpleNamespace(file_path=None, filename="report.txt")

    assert documents_module.get_original_upload_paths(doc) == [str(expected)]


def test_original_upload_path_skips_ambiguous_legacy_matches(documents_module, tmp_path, monkeypatch):
    upload_dir = tmp_path / "uploads"
    upload_dir.mkdir()
    (upload_dir / "abc_report.txt").write_text("one", encoding="utf-8")
    (upload_dir / "def_report.txt").write_text("two", encoding="utf-8")
    monkeypatch.setattr(documents_module, "UPLOAD_DIR", str(upload_dir))

    doc = SimpleNamespace(file_path=None, filename="report.txt")

    assert documents_module.get_original_upload_paths(doc) == []
