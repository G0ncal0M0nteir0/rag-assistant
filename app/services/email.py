from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from dotenv import load_dotenv
import os

load_dotenv()

conf = ConnectionConfig(
    MAIL_USERNAME=os.getenv("MAIL_USERNAME"),
    MAIL_PASSWORD=os.getenv("MAIL_PASSWORD"),
    MAIL_FROM=os.getenv("MAIL_FROM"),
    MAIL_PORT=int(os.getenv("MAIL_PORT", 587)),
    MAIL_SERVER=os.getenv("MAIL_SERVER"),
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True
)

async def send_verification_email(email: str, token: str):
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:8000")
    verification_link = f"{frontend_url}/auth/verify?token={token}"

    message = MessageSchema(
        subject="Verify your RAG Assistant account",
        recipients=[email],
        body=f"""
        <h2>Welcome to RAG Assistant!</h2>
        <p>Please verify your email address by clicking the link below:</p>
        <a href="{verification_link}">Verify Email</a>
        <p>This link will expire in 24 hours.</p>
        <p>If you did not create an account, ignore this email.</p>
        """,
        subtype=MessageType.html
    )

    fm = FastMail(conf)
    await fm.send_message(message)