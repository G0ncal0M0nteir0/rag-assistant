from app.auth import create_access_token, verify_password


def auth_header(user):
    token = create_access_token({"sub": str(user.id)})
    return {"Authorization": f"Bearer {token}"}


def test_register_creates_unverified_user_and_sends_email(api_context):
    response = api_context.client.post(
        "/auth/register",
        json={"email": "new@example.com", "password": "StrongPass1"},
    )

    assert response.status_code == 200
    assert response.json()["email"] == "new@example.com"
    assert response.json()["is_verified"] is False
    assert api_context.db.users[-1].verification_token
    assert api_context.sent_emails[-1][0] == "new@example.com"


def test_register_rejects_weak_passwords_and_duplicate_email(api_context):
    weak_response = api_context.client.post(
        "/auth/register",
        json={"email": "weak@example.com", "password": "short"},
    )
    duplicate_response = api_context.client.post(
        "/auth/register",
        json={"email": api_context.user.email, "password": "StrongPass1"},
    )

    assert weak_response.status_code == 400
    assert duplicate_response.status_code == 400


def test_verify_email_marks_user_verified(api_context):
    response = api_context.client.get("/auth/verify", params={"token": "verify-token"})

    assert response.status_code == 200
    assert api_context.unverified.is_verified is True
    assert api_context.unverified.verification_token is None


def test_login_returns_token_for_verified_user(api_context):
    response = api_context.client.post(
        "/auth/login",
        data={"username": api_context.user.email, "password": "StrongPass1"},
    )

    assert response.status_code == 200
    assert response.json()["token_type"] == "bearer"
    assert response.json()["access_token"]


def test_login_rejects_unverified_or_wrong_credentials(api_context):
    unverified_response = api_context.client.post(
        "/auth/login",
        data={"username": api_context.unverified.email, "password": "StrongPass1"},
    )
    wrong_password_response = api_context.client.post(
        "/auth/login",
        data={"username": api_context.user.email, "password": "WrongPass1"},
    )

    assert unverified_response.status_code == 403
    assert wrong_password_response.status_code == 401


def test_resend_verification_rotates_token_and_sends_email(api_context):
    old_token = api_context.unverified.verification_token

    response = api_context.client.post(
        "/auth/resend-verification",
        json={"email": api_context.unverified.email, "password": "StrongPass1"},
    )

    assert response.status_code == 200
    assert api_context.unverified.verification_token != old_token
    assert api_context.sent_emails[-1][0] == api_context.unverified.email


def test_forgot_and_reset_password_flow(api_context):
    forgot_response = api_context.client.post(
        "/auth/forgot-password",
        json={"email": api_context.reset_user.email},
    )
    token = api_context.reset_user.reset_token
    reset_response = api_context.client.post(
        "/auth/reset-password",
        json={"token": token, "new_password": "NewStrongPass1"},
    )

    assert forgot_response.status_code == 200
    assert api_context.sent_emails[-1][0] == api_context.reset_user.email
    assert reset_response.status_code == 200
    assert api_context.reset_user.reset_token is None
    assert verify_password("NewStrongPass1", api_context.reset_user.password)


def test_me_and_update_me_endpoints(api_context):
    original_email = api_context.user.email
    me_response = api_context.client.get("/auth/me", headers=auth_header(api_context.user))
    update_response = api_context.client.patch(
        "/auth/me",
        headers=auth_header(api_context.user),
        json={"email": "updated@example.com", "password": "UpdatedPass1"},
    )

    assert me_response.status_code == 200
    assert me_response.json()["email"] == original_email
    assert update_response.status_code == 200
    assert update_response.json()["email"] == "updated@example.com"
    assert verify_password("UpdatedPass1", api_context.user.password)


def test_admin_stats_requires_admin_user(api_context):
    forbidden_response = api_context.client.get("/auth/admin/stats", headers=auth_header(api_context.user))
    admin_response = api_context.client.get("/auth/admin/stats", headers=auth_header(api_context.admin))

    assert forbidden_response.status_code == 403
    assert admin_response.status_code == 200
    assert admin_response.json()["total_users"] == len(api_context.db.users)
