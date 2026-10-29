import uuid

from fastapi import APIRouter, status

from app.api.deps import CurrentUser, DbSession, PageParams
from app.schemas.chat import MessageOut, SessionOut
from app.schemas.common import Page
from app.services import chat_service

router = APIRouter(prefix="/sessions", tags=["sessions"])


@router.get("", response_model=Page[SessionOut])
def list_sessions(user: CurrentUser, db: DbSession, page: PageParams):
    items, total = chat_service.list_sessions(db, user, page.limit, page.offset)
    return Page(items=items, total=total, limit=page.limit, offset=page.offset)


@router.get("/{session_id}/messages", response_model=Page[MessageOut])
def list_messages(session_id: uuid.UUID, user: CurrentUser, db: DbSession, page: PageParams):
    items, total = chat_service.list_messages(db, user, session_id, page.limit, page.offset)
    return Page(items=items, total=total, limit=page.limit, offset=page.offset)


@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_session(session_id: uuid.UUID, user: CurrentUser, db: DbSession):
    chat_service.delete_session(db, user, session_id)
