from types import SimpleNamespace

import pytest
from fastapi import HTTPException
from sqlalchemy import Boolean, String

from app import models, schemas
from app.routers.auth import get_current_admin


def test_user_flags_are_real_booleans():
    assert isinstance(models.User.is_verified.property.columns[0].type, Boolean)
    assert isinstance(models.User.is_admin.property.columns[0].type, Boolean)


def test_document_tracks_original_file_path():
    assert isinstance(models.Document.file_path.property.columns[0].type, String)


def test_user_output_schema_exposes_boolean_verification_flag():
    field = schemas.UserOut.model_fields["is_verified"]

    assert field.annotation is bool


def test_admin_dependency_accepts_admin_user():
    user = SimpleNamespace(is_admin=True)

    assert get_current_admin(user) is user


def test_admin_dependency_rejects_non_admin_user():
    with pytest.raises(HTTPException) as exc_info:
        get_current_admin(SimpleNamespace(is_admin=False))

    assert exc_info.value.status_code == 403
