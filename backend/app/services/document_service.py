import logging
import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile, status
from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models import Document, User
from app.models.document import PROCESSING
from app.services.pdf_parser import PdfError, extract_pages

logger = logging.getLogger(__name__)

PDF_CONTENT_TYPES = {"application/pdf", "application/x-pdf"}


def create_document(db: Session, user: User, upload: UploadFile) -> tuple[Document, list[tuple[int, str]]]:
    """Validate and store the upload; returns the new document and its extracted pages."""
    settings = get_settings()
    filename = Path(upload.filename or "document.pdf").name[:255]

    if upload.content_type not in PDF_CONTENT_TYPES and not filename.lower().endswith(".pdf"):
        raise HTTPException(status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, "Only PDF files are accepted")
    data = upload.file.read(settings.max_upload_bytes + 1)
    if len(data) > settings.max_upload_bytes:
        raise HTTPException(
            status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, f"File is larger than {settings.max_upload_mb} MB"
        )
    if not data.startswith(b"%PDF-"):
        raise HTTPException(status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, "File is not a valid PDF")
    try:
        page_count, pages = extract_pages(data)
    except PdfError as exc:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, str(exc))

    document_id = uuid.uuid4()
    path = settings.upload_dir / str(user.id) / f"{document_id}.pdf"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)

    document = Document(
        id=document_id,
        user_id=user.id,
        filename=filename,
        storage_path=str(path),
        size_bytes=len(data),
        page_count=page_count,
        status=PROCESSING,
    )
    db.add(document)
    db.commit()
    db.refresh(document)
    logger.info("Document %s uploaded by user %s (%d bytes)", document.id, user.id, len(data))
    return document, pages


def list_documents(db: Session, user: User, limit: int, offset: int) -> tuple[list[Document], int]:
    total = db.scalar(select(func.count()).select_from(Document).where(Document.user_id == user.id))
    items = db.scalars(
        select(Document)
        .where(Document.user_id == user.id)
        .order_by(Document.created_at.desc())
        .limit(limit)
        .offset(offset)
    ).all()
    return list(items), total or 0


def get_document(db: Session, user: User, document_id: uuid.UUID) -> Document:
    document = db.scalar(select(Document).where(Document.id == document_id, Document.user_id == user.id))
    if document is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Document not found")
    return document


def delete_document(db: Session, user: User, document_id: uuid.UUID) -> None:
    document = get_document(db, user, document_id)
    if document.status == PROCESSING:
        raise HTTPException(status.HTTP_409_CONFLICT, "Document is still processing; try again shortly")
    db.execute(delete(Document).where(Document.id == document.id, Document.user_id == user.id))  # chunks cascade
    db.commit()
    Path(document.storage_path).unlink(missing_ok=True)
    logger.info("Document %s deleted by user %s", document.id, user.id)
