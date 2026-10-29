import uuid

from fastapi import APIRouter, BackgroundTasks, File, UploadFile, status

from app.api.deps import CurrentUser, DbSession, PageParams
from app.schemas.common import Page
from app.schemas.document import DocumentOut
from app.services import document_service
from app.services.ingestion import ingest_document

router = APIRouter(prefix="/documents", tags=["documents"])


@router.post("", response_model=DocumentOut, status_code=status.HTTP_202_ACCEPTED)
def upload_document(
    user: CurrentUser, db: DbSession, background: BackgroundTasks, file: UploadFile = File(...)
):
    document, pages = document_service.create_document(db, user, file)
    background.add_task(ingest_document, document.id, pages)
    return document


@router.get("", response_model=Page[DocumentOut])
def list_documents(user: CurrentUser, db: DbSession, page: PageParams):
    items, total = document_service.list_documents(db, user, page.limit, page.offset)
    return Page(items=items, total=total, limit=page.limit, offset=page.offset)


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(document_id: uuid.UUID, user: CurrentUser, db: DbSession):
    document_service.delete_document(db, user, document_id)
