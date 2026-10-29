import logging
import uuid

import groq
from fastapi import HTTPException, status
from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models import ChatSession, Message, User
from app.models.document import READY
from app.schemas.chat import ChatIn, ChatOut
from app.services import document_service, llm, retrieval
from app.services.embedding import get_embedder

logger = logging.getLogger(__name__)


def get_session(db: Session, user: User, session_id: uuid.UUID) -> ChatSession:
    chat_session = db.scalar(
        select(ChatSession).where(ChatSession.id == session_id, ChatSession.user_id == user.id)
    )
    if chat_session is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Session not found")
    return chat_session


def ask(db: Session, user: User, body: ChatIn) -> ChatOut:
    if body.document_id is not None:
        document = document_service.get_document(db, user, body.document_id)
        if document.status != READY:
            raise HTTPException(status.HTTP_409_CONFLICT, f"Document is {document.status}, not ready")
    chat_session = get_session(db, user, body.session_id) if body.session_id else None

    query_vector = get_embedder().embed([body.question])[0]
    sources = retrieval.search(db, user.id, query_vector, get_settings().top_k, body.document_id)

    if not sources:  # no ready documents: nothing to answer from
        answer = llm.NOT_FOUND
    else:
        try:
            answer = llm.generate_answer(body.question, sources)
        except groq.GroqError as exc:
            logger.error("Groq request failed: %s", exc)
            raise HTTPException(status.HTTP_502_BAD_GATEWAY, "The language model is unavailable; try again")

    if chat_session is None:
        chat_session = ChatSession(user_id=user.id, title=body.question[:200])
        db.add(chat_session)
        db.flush()
    else:
        chat_session.updated_at = func.now()

    source_dicts = [source.model_dump(mode="json") for source in sources]
    db.add_all(
        [
            Message(session_id=chat_session.id, role="user", content=body.question),
            Message(session_id=chat_session.id, role="assistant", content=answer, sources=source_dicts),
        ]
    )
    db.commit()
    return ChatOut(session_id=chat_session.id, answer=answer, sources=sources)


def list_sessions(db: Session, user: User, limit: int, offset: int) -> tuple[list[ChatSession], int]:
    total = db.scalar(select(func.count()).select_from(ChatSession).where(ChatSession.user_id == user.id))
    items = db.scalars(
        select(ChatSession)
        .where(ChatSession.user_id == user.id)
        .order_by(ChatSession.updated_at.desc())
        .limit(limit)
        .offset(offset)
    ).all()
    return list(items), total or 0


def list_messages(
    db: Session, user: User, session_id: uuid.UUID, limit: int, offset: int
) -> tuple[list[Message], int]:
    chat_session = get_session(db, user, session_id)  # ownership check
    total = db.scalar(select(func.count()).select_from(Message).where(Message.session_id == chat_session.id))
    items = db.scalars(
        select(Message)
        .where(Message.session_id == chat_session.id)
        .order_by(Message.created_at, Message.id)
        .limit(limit)
        .offset(offset)
    ).all()
    return list(items), total or 0


def delete_session(db: Session, user: User, session_id: uuid.UUID) -> None:
    get_session(db, user, session_id)
    db.execute(delete(ChatSession).where(ChatSession.id == session_id, ChatSession.user_id == user.id))
    db.commit()
