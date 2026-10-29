import uuid
from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, ConfigDict, StringConstraints

Question = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=2000)]


class ChatIn(BaseModel):
    question: Question
    session_id: uuid.UUID | None = None  # omit to start a new session
    document_id: uuid.UUID | None = None  # omit to search all your documents


class SourceOut(BaseModel):
    document_id: uuid.UUID
    filename: str
    page_number: int
    score: float
    content: str


class ChatOut(BaseModel):
    session_id: uuid.UUID
    answer: str
    sources: list[SourceOut]


class SessionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    created_at: datetime
    updated_at: datetime


class MessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    role: str
    content: str
    sources: list[SourceOut]
    created_at: datetime
