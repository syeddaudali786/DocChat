import uuid

import numpy as np
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Chunk, Document
from app.schemas.chat import SourceOut


def search(
    db: Session,
    user_id: uuid.UUID,
    query_vector: np.ndarray,
    top_k: int,
    document_id: uuid.UUID | None = None,
) -> list[SourceOut]:
    """Top-k cosine search over the user's own chunks only."""
    distance = Chunk.embedding.cosine_distance(query_vector)
    stmt = (
        select(Chunk, Document.filename, distance.label("distance"))
        .join(Document, Document.id == Chunk.document_id)
        .where(Chunk.user_id == user_id)
        .order_by(distance)
        .limit(top_k)
    )
    if document_id is not None:
        stmt = stmt.where(Chunk.document_id == document_id)

    return [
        SourceOut(
            document_id=chunk.document_id,
            filename=filename,
            page_number=chunk.page_number,
            score=round(1 - float(dist), 4),
            content=chunk.content,
        )
        for chunk, filename, dist in db.execute(stmt)
    ]
