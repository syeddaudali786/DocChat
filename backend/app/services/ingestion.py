"""Background ingestion: chunk -> embed -> store, then mark the document ready or failed."""
import logging
import uuid

from sqlalchemy import update

from app.core.config import get_settings
from app.db.session import SessionLocal
from app.models import Chunk, Document
from app.models.document import FAILED, PROCESSING, READY
from app.services.chunker import chunk_pages
from app.services.embedding import get_embedder

logger = logging.getLogger(__name__)


def ingest_document(document_id: uuid.UUID, pages: list[tuple[int, str]]) -> None:
    settings = get_settings()
    with SessionLocal() as db:
        doc = db.get(Document, document_id)
        if doc is None:
            return
        try:
            chunks = chunk_pages(pages, settings.chunk_size, settings.chunk_overlap)
            vectors = get_embedder().embed([content for _, content in chunks])
            db.add_all(
                Chunk(
                    document_id=doc.id,
                    user_id=doc.user_id,
                    chunk_index=index,
                    page_number=page_number,
                    content=content,
                    embedding=vector,
                )
                for index, ((page_number, content), vector) in enumerate(zip(chunks, vectors))
            )
            doc.status = READY
            doc.chunk_count = len(chunks)
            db.commit()
            logger.info("Document %s ingested: %d chunks", doc.id, len(chunks))
        except Exception:
            logger.exception("Ingestion failed for document %s", document_id)
            db.rollback()
            doc.status = FAILED
            doc.error_message = "Processing failed. Please try uploading the file again."
            db.commit()


def fail_interrupted_documents() -> None:
    """Background tasks die with the process; on startup, unstick anything left 'processing'."""
    with SessionLocal() as db:
        result = db.execute(
            update(Document)
            .where(Document.status == PROCESSING)
            .values(status=FAILED, error_message="Processing was interrupted. Please upload the file again.")
        )
        db.commit()
        if result.rowcount:
            logger.warning("Marked %d interrupted document(s) as failed", result.rowcount)
