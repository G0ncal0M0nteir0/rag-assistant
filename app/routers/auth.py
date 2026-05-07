from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.auth import hash_password, verify_password, create_access_token
from app.services.email import send_verification_email
import uuid
import secrets
import os

router = APIRouter()

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
        is_verified="false",
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

    if user.is_verified == "true":
        return {"message": "Email already verified. You can log in."}

    user.is_verified = "true"
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

    if user.is_verified == "false":
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
    if existing.is_verified == "true":
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

    user.is_verified = "true"
    user.verification_token = None
    db.commit()
    return {"message": f"{email} verified successfully."}