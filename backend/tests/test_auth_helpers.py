from datetime import datetime, timezone

from jose import jwt

from app import auth


def test_password_hash_round_trip():
    hashed = auth.hash_password("StrongPass1")

    assert hashed != "StrongPass1"
    assert auth.verify_password("StrongPass1", hashed)
    assert not auth.verify_password("WrongPass1", hashed)


def test_access_token_contains_subject_and_expiration():
    token = auth.create_access_token({"sub": "user-123"})
    payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])

    assert payload["sub"] == "user-123"
    assert datetime.fromtimestamp(payload["exp"], tz=timezone.utc) > datetime.now(timezone.utc)
