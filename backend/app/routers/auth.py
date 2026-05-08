from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.auth import hash_password, verify_password, create_access_token, get_current_user
from app.services.email import send_verification_email, send_password_reset_email
from datetime import datetime, timedelta, timezone
import uuid
import secrets
import os
from sqlalchemy import func

router = APIRouter()

def get_current_admin(current_user: models.User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have administrative privileges."
        )
    return current_user

@router.post("/register", response_model=schemas.UserOut)
async def register(
    user: schemas.UserCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    if len(user.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters.")
    if not any(c.isupper() for c in user.password):
        raise HTTPException(status_code=400, detail="Password must contain at least one uppercase letter.")
    if not any(c.isdigit() for c in user.password):
        raise HTTPException(status_code=400, detail="Password must contain at least one number.")

    existing = db.query(models.User).filter(models.User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered.")

    verification_token = secrets.token_urlsafe(32)

    new_user = models.User(
        id=uuid.uuid4(),
        email=user.email,
        password=hash_password(user.password),
        is_verified=False,
        verification_token=verification_token
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    background_tasks.add_task(
        send_verification_email,
        email=user.email,
        token=verification_token
    )

    return new_user

@router.get("/verify")
def verify_email(token: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(
        models.User.verification_token == token
    ).first()

    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired verification token.")

    if user.is_verified:
        return {"message": "Email already verified. You can log in."}

    user.is_verified = True
    user.verification_token = None
    db.commit()

    return {"message": "Email verified successfully! You can now log in."}

@router.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )

    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email before logging in."
        )

    token = create_access_token(data={"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer"}

@router.post("/resend-verification")
async def resend_verification(
    user: schemas.UserCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    existing = db.query(models.User).filter(models.User.email == user.email).first()
    if not existing:
        raise HTTPException(status_code=404, detail="Email not found.")
    if existing.is_verified:
        return {"message": "Email already verified."}

    new_token = secrets.token_urlsafe(32)
    existing.verification_token = new_token
    db.commit()

    background_tasks.add_task(
        send_verification_email,
        email=existing.email,
        token=new_token
    )

    return {"message": "Verification email resent."}


# Dev purposes only !!! DISABLE after !!!
@router.post("/dev-verify")
def dev_verify(email: str, db: Session = Depends(get_db)):
    if os.getenv("ENVIRONMENT", "development") != "development":
        raise HTTPException(status_code=404, detail="Not found.")

    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    user.is_verified = True
    user.verification_token = None
    db.commit()
    return {"message": f"{email} verified successfully."}


@router.post("/forgot-password")
async def forgot_password(
    body: schemas.PasswordResetRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(models.User.email == body.email).first()
    if not user:
        return {"message": "If this email is registered, you will receive a reset link."}

    token = secrets.token_urlsafe(32)
    user.reset_token = token
    user.reset_token_expires = datetime.now(timezone.utc) + timedelta(hours=1)
    db.commit()

    background_tasks.add_task(send_password_reset_email, email=user.email, token=token)

    return {"message": "If this email is registered, you will receive a reset link."}


@router.post("/reset-password")
def reset_password(body: schemas.PasswordReset, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(
        models.User.reset_token == body.token,
        models.User.reset_token_expires > datetime.now(timezone.utc)
    ).first()

    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired token.")

    if len(body.new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters.")

    user.password = hash_password(body.new_password)
    user.reset_token = None
    user.reset_token_expires = None
    db.commit()

    return {"message": "Password reset successfully. You can now log in."}


@router.get("/me", response_model=schemas.UserOut)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=schemas.UserOut)
def update_me(
    body: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if body.email:
        existing = db.query(models.User).filter(models.User.email == body.email).first()
        if existing and str(existing.id) != str(current_user.id):
            raise HTTPException(status_code=400, detail="Email already in use.")
        current_user.email = body.email

    if body.password:
        if len(body.password) < 8:
            raise HTTPException(status_code=400, detail="Password must be at least 8 characters.")
        current_user.password = hash_password(body.password)

    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/admin/stats", response_model=schemas.AdminStatsResponse)
def get_admin_stats(
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(get_current_admin)
):
    total_users = db.query(func.count(models.User.id)).scalar()
    total_docs = db.query(func.count(models.Document.id)).scalar()
    total_convs = db.query(func.count(models.ConversationSession.id)).scalar()
    
    total_tokens = db.query(func.sum(models.TokenUsage.total_tokens)).scalar() or 0
    
    return {
        "total_users": total_users,
        "total_documents": total_docs,
        "total_tokens_consumed": total_tokens,
        "total_conversations": total_convs
    }
