from fastapi import APIRouter, Request, status

from app.api.deps import CurrentUser, DbSession
from app.core.config import get_settings
from app.core.rate_limit import limiter
from app.core.security import create_access_token
from app.schemas.auth import LoginIn, RegisterIn, TokenOut, UserOut
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(body: RegisterIn, db: DbSession):
    return auth_service.register(db, body.email, body.password)


@router.post("/login", response_model=TokenOut)
@limiter.limit(settings.rate_limit_login)
def login(request: Request, body: LoginIn, db: DbSession):
    user = auth_service.authenticate(db, body.email, body.password)
    return TokenOut(
        access_token=create_access_token(user.id),
        expires_in=settings.access_token_expire_minutes * 60,
    )


@router.get("/me", response_model=UserOut)
def me(user: CurrentUser):
    return user
