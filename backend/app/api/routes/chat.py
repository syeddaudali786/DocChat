from fastapi import APIRouter, Request

from app.api.deps import CurrentUser, DbSession
from app.core.config import get_settings
from app.core.rate_limit import limiter, user_or_ip
from app.schemas.chat import ChatIn, ChatOut
from app.services import chat_service

router = APIRouter(tags=["chat"])


@router.post("/chat", response_model=ChatOut)
@limiter.limit(get_settings().rate_limit_chat, key_func=user_or_ip)
def chat(request: Request, body: ChatIn, user: CurrentUser, db: DbSession):
    return chat_service.ask(db, user, body)
