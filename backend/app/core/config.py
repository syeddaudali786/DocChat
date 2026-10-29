"""All settings come from environment variables / the backend/.env file."""
from functools import lru_cache
from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

ROOT_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=ROOT_DIR / ".env", extra="ignore")

    database_url: str
    db_pool_size: int = 5
    db_max_overflow: int = 5

    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    groq_api_key: str
    groq_model: str = "openai/gpt-oss-20b"
    embedding_model: str = "BAAI/bge-small-en-v1.5"

    upload_dir: Path = Path("uploads")
    max_upload_mb: int = 10
    chunk_size: int = 800
    chunk_overlap: int = 150
    top_k: int = 5

    rate_limit_login: str = "5/minute"
    rate_limit_chat: str = "20/minute"
    cors_origins: str = "http://localhost:5173"  # comma-separated
    log_level: str = "INFO"

    @field_validator("jwt_secret_key")
    @classmethod
    def secret_must_be_real(cls, value: str) -> str:
        if len(value) < 32 or value.startswith("replace-with"):
            raise ValueError("JWT_SECRET_KEY must be a random string of at least 32 characters")
        return value

    @field_validator("upload_dir")
    @classmethod
    def resolve_upload_dir(cls, value: Path) -> Path:
        return value if value.is_absolute() else ROOT_DIR / value

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def max_upload_bytes(self) -> int:
        return self.max_upload_mb * 1024 * 1024


@lru_cache
def get_settings() -> Settings:
    return Settings()
