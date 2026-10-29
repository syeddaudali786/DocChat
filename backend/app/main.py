"""FastAPI entry point. Run from backend/:  uvicorn app.main:app --reload"""
import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.api.routes import auth, chat, documents, health, sessions
from app.core.config import get_settings
from app.core.rate_limit import limiter
from app.services.embedding import get_embedder
from app.services.ingestion import fail_interrupted_documents

settings = get_settings()
logging.basicConfig(
    level=settings.log_level.upper(),
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger("app")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    settings.upload_dir.mkdir(parents=True, exist_ok=True)
    fail_interrupted_documents()
    get_embedder()  # load the embedding model once, before the first request
    logger.info("API ready")
    yield


app = FastAPI(title="Profile RAG API", version="1.0.0", lifespan=lifespan)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
for module in (auth, documents, chat, sessions):
    app.include_router(module.router, prefix="/api/v1")
