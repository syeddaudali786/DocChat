from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.models import User

# Checked when the email is unknown, so both login failures take the same time.
_DUMMY_HASH = hash_password("not-a-real-password")


def register(db: Session, email: str, password: str) -> User:
    email = email.lower()
    if db.scalar(select(User.id).where(User.email == email)):
        raise HTTPException(status.HTTP_409_CONFLICT, "Email is already registered")
    user = User(email=email, hashed_password=hash_password(password))
    db.add(user)
    try:
        db.commit()
    except IntegrityError:  # two registrations with the same email at once
        db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "Email is already registered")
    db.refresh(user)
    return user


def authenticate(db: Session, email: str, password: str) -> User:
    user = db.scalar(select(User).where(User.email == email.lower()))
    valid = verify_password(password, user.hashed_password if user else _DUMMY_HASH)
    if user is None or not valid or not user.is_active:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Incorrect email or password")
    return user
