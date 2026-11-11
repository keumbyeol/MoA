
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.user import User, AuthRefreshToken


def find_user_by_email(
    db: Session,
    email: str,
) -> User | None:
    normalized_email = email.strip().lower()

    return db.scalar(
        select(User).where(
            User.email == normalized_email
        )
    )


def find_user_by_id(
    db: Session,
    user_id: int,
) -> User | None:
    return db.get(User, user_id)


def find_refresh_token(
    db: Session,
    token_hash: str,
) -> AuthRefreshToken | None:
    return db.scalar(
        select(AuthRefreshToken).where(
            AuthRefreshToken.token_hash == token_hash
        )
    )
