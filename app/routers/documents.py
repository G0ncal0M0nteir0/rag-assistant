from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.auth import get_current_user
import fitz
import uuid
import os

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

def extract_text(file_path: str, filename: str) -> str:
    ext = filename.lower().split(".")[-1]
    if ext == "pdf":
        doc = fitz.open(file_path)
        return "\n".join(page.get_text() for page in doc)
    elif ext in ["txt", "md"]:
        with open(file_path, "r", encoding="utf-8") as f:
            return f.read()
    else:
        raise HTTPException(status_code=400, detail="Unsupported file type. Use PDF or TXT.")

@router.post("/upload", response_model=schemas.DocumentOut)
def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    allowed = ["pdf", "txt", "md"]
    ext = file.filename.lower().split(".")[-1]
    if ext not in allowed:
        raise HTTPException(status_code=400, detail="Only PDF, TXT and MD files are supported.")

    file_id = str(uuid.uuid4())
    file_path = os.path.join(UPLOAD_DIR, f"{file_id}_{file.filename}")

    with open(file_path, "wb") as f:
        f.write(file.file.read())

    try:
        text = extract_text(file_path, file.filename)
    except Exception as e:
        os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"Failed to extract text: {str(e)}")

    if not text.strip():
        os.remove(file_path)
        raise HTTPException(status_code=400, detail="Document appears to be empty.")

    doc_record = models.Document(
        id=uuid.uuid4(),
        user_id=current_user.id,
        filename=file.filename
    )
    db.add(doc_record)
    db.commit()
    db.refresh(doc_record)

    text_path = os.path.join(UPLOAD_DIR, f"{str(doc_record.id)}.txt")
    with open(text_path, "w", encoding="utf-8") as f:
        f.write(text)

    return doc_record

@router.get("/", response_model=list[schemas.DocumentOut])
def list_documents(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return db.query(models.Document).filter(
        models.Document.user_id == current_user.id
    ).all()

@router.delete("/{document_id}")
def delete_document(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    doc = db.query(models.Document).filter(
        models.Document.id == document_id,
        models.Document.user_id == current_user.id
    ).first()

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    for path in [
        os.path.join(UPLOAD_DIR, f"{document_id}.txt"),
    ]:
        if os.path.exists(path):
            os.remove(path)

    db.delete(doc)
    db.commit()
    return {"message": "Document deleted successfully"}