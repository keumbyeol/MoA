
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    hash_refresh_token,
    verify_password,
)
from app.models.user import User, AuthRefreshToken
from app.repositories.user_repository import (
    find_refresh_token,
    find_user_by_email,
)
from app.schemas.auth import SignupRequest


def now_utc() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


# 회원가입
def signup(db: Session, data: SignupRequest) -> User:
    email = str(data.email).lower()

    if find_user_by_email(db, email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="이미 가입된 이메일입니다.",
        )

    user = User(
        email=email,
        nickname=data.nickname,
        password_hash=hash_password(data.password),
    )

    db.add(user)

    try:
        db.commit()
        db.refresh(user)

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="이미 가입된 이메일입니다.",
        )

    return user


# Access Token + Refresh Token 발급
def issue_tokens(db: Session, user: User) -> dict:
    refresh_token = create_refresh_token()
    now = now_utc()

    db.add(
        AuthRefreshToken(
            user_id=user.id,
            token_hash=hash_refresh_token(refresh_token),
            expires_at=now + timedelta(days=7),
        )
    )

    db.commit()

    return {
        "access_token": create_access_token(user.id),
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }


# 로그인
def login(
    db: Session,
    email: str,
    password: str,
) -> dict:
    user = find_user_by_email(db, email.lower())

    if (
        user is None
        or not verify_password(password, user.password_hash)
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="이메일 또는 비밀번호가 올바르지 않습니다.",
        )

    if user.status != "ACTIVE" or user.deleted_at is not None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="사용할 수 없는 계정입니다.",
        )

    user.last_login_at = now_utc()
    db.commit()

    return issue_tokens(db, user)


# Refresh Token 갱신
def refresh_tokens(db: Session, token: str) -> dict:
    saved = find_refresh_token(
        db,
        hash_refresh_token(token),
    )

    now = now_utc()

    if (
        saved is None
        or saved.revoked_at is not None
        or saved.expires_at <= now
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="유효하지 않은 갱신 토큰입니다.",
        )

    user = db.get(User, saved.user_id)

    if (
        user is None
        or user.status != "ACTIVE"
        or user.deleted_at is not None
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="사용할 수 없는 계정입니다.",
        )

    # 기존 Refresh Token 폐기
    saved.revoked_at = now

    # 새로운 Refresh Token 발급
    new_refresh = create_refresh_token()

    db.add(
        AuthRefreshToken(
            user_id=user.id,
            token_hash=hash_refresh_token(new_refresh),
            expires_at=now + timedelta(days=7),
        )
    )

    db.commit()

    return {
        "access_token": create_access_token(user.id),
        "refresh_token": new_refresh,
        "token_type": "bearer",
    }


# 로그아웃
def logout(
    db: Session,
    token: str,
    user_id: int,
) -> None:
    saved = find_refresh_token(
        db,
        hash_refresh_token(token),
    )

    if saved is None or saved.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="유효하지 않은 토큰입니다.",
        )

    if saved.revoked_at is None:
        saved.revoked_at = now_utc()
        db.commit()
