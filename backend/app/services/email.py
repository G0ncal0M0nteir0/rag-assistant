from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from dotenv import load_dotenv
import os
import logging

load_dotenv()

logger = logging.getLogger(__name__)


def _env(name: str, default: str | None = None) -> str | None:
    value = os.getenv(name, default)
    return value.strip() if isinstance(value, str) else value

conf = ConnectionConfig(
    MAIL_USERNAME=_env("MAIL_USERNAME"),
    MAIL_PASSWORD=("".join((_env("MAIL_PASSWORD") or "").split())),
    MAIL_FROM=_env("MAIL_FROM"),
    MAIL_PORT=int(_env("MAIL_PORT", "587") or 587),
    MAIL_SERVER=_env("MAIL_SERVER"),
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True
)

async def send_verification_email(email: str, token: str):
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
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
    try:
        await fm.send_message(message)
    except Exception:
        logger.exception("Failed to send verification email to %s", email)
        raise

async def send_password_reset_email(email: str, token: str):
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:8000")
    reset_link = f"{frontend_url}/auth/reset-password?token={token}"

    message = MessageSchema(
        subject="Reset your RAG Assistant password",
        recipients=[email],
        body=f"""
        <h2>Password Reset Request</h2>
        <p>You requested to reset your password. Click the link below to proceed:</p>
        <a href="{reset_link}">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you did not request this, please ignore this email.</p>
        """,
        subtype=MessageType.html
    )

    fm = FastMail(conf)
    try:
        await fm.send_message(message)
    except Exception:
        logger.exception("Failed to send password reset email to %s", email)
        raise

async def send_security_alert_email(email: str, event_type: str):
    """
    Send a security alert email when account changes occur.
    
    Args:
        email: Email address to send the alert to
        event_type: Type of security event ("password_changed" or "email_changed")
    """
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
    account_settings_link = f"{frontend_url}/main/settings"
    password_reset_link = f"{frontend_url}/forgot-password"
    
    event_titles = {
        "password_changed": "Your Password Has Been Changed",
        "email_changed": "Your Email Address Has Been Changed"
    }
    
    event_descriptions = {
        "password_changed": "We detected that your password was recently changed on your RAG Assistant account.",
        "email_changed": "We detected that your email address was recently changed on your RAG Assistant account."
    }
    
    subject = f"Security Alert: {event_titles.get(event_type, 'Account Activity')}"
    
    message = MessageSchema(
        subject=subject,
        recipients=[email],
        body=f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #ef4444;">⚠️ {event_titles.get(event_type, 'Security Alert')}</h2>
            
            <p>{event_descriptions.get(event_type, 'Your account has been updated.')}</p>
            
            <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <strong>If this wasn't you:</strong>
                <p>Your account security may have been compromised. 
                <a href="{password_reset_link}" style="color: #ef4444; font-weight: bold;">Reset your password immediately</a>.</p>
            </div>
            
            <div style="margin: 25px 0;">
                <a href="{account_settings_link}" style="display: inline-block; background-color: #06b6d4; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Review Account Settings</a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;">
            
            <p style="color: #666; font-size: 12px;">
                If you have any concerns about your account security or did not authorize this change, 
                please contact our support team immediately.
            </p>
            
            <p style="color: #666; font-size: 12px;">
                RAG Assistant Security Team
            </p>
        </div>
        """,
        subtype=MessageType.html
    )

    fm = FastMail(conf)
    try:
        await fm.send_message(message)
        logger.info("Sent security alert email to %s for %s", email, event_type)
    except Exception:
        logger.exception("Failed to send security alert email to %s for %s", email, event_type)
        raise