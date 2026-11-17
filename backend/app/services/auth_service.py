
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

from app.schemas.auth import (
    SignupRequest,
    UpdateUserRequest,
    ChangePasswordRequest,
)


def now_utc() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


# ==========================================
# 회원가입
# ==========================================

# ==========================================
# 회원가입 약관 버전
# ==========================================

TERMS_VERSION = "1.0"
PRIVACY_VERSION = "1.0"


# ==========================================
# 회원가입
# ==========================================

def signup(db: Session, data: SignupRequest) -> User:
    email = str(data.email).lower()

    if find_user_by_email(db, email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="이미 가입된 이메일입니다.",
        )

    # 동의 여부는 SignupRequest에서 검증됨
    agreed_at = now_utc()

    user = User(
        email=email,
        nickname=data.nickname.strip(),
        password_hash=hash_password(data.password),
        user_type=data.user_type,

        # 필수 약관 동의 기록
        terms_agreed_at=agreed_at,
        privacy_agreed_at=agreed_at,
        terms_version=TERMS_VERSION,
        privacy_version=PRIVACY_VERSION,
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

# ==========================================
# Access Token + Refresh Token 발급
# ==========================================

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


# ==========================================
# 로그인
# ==========================================

def login(
    db: Session,
    email: str,
    password: str,
) -> dict:
    user = find_user_by_email(db, email.lower())

    if (
        user is None
        or not verify_password(
            password,
            user.password_hash,
        )
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="이메일 또는 비밀번호가 올바르지 않습니다.",
        )

    if (
        user.status != "ACTIVE"
        or user.deleted_at is not None
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="사용할 수 없는 계정입니다.",
        )

    user.last_login_at = now_utc()
    db.commit()

    return issue_tokens(db, user)


# ==========================================
# Refresh Token 갱신
# ==========================================

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


# ==========================================
# 로그아웃
# ==========================================

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


# ==========================================
# 회원 정보 수정
# 닉네임 / 회원 유형
# ==========================================

def update_user(
    db: Session,
    user: User,
    data: UpdateUserRequest,
) -> User:
    if (
        data.nickname is None
        and data.user_type is None
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="수정할 정보를 입력해 주세요.",
        )

    if data.nickname is not None:
        nickname = data.nickname.strip()

        if len(nickname) < 2:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="닉네임은 2자 이상 입력해 주세요.",
            )

        user.nickname = nickname

    if data.user_type is not None:
        user.user_type = data.user_type

    try:
        db.commit()
        db.refresh(user)

    except Exception:
        db.rollback()
        raise

    return user


# ==========================================
# 비밀번호 변경
# ==========================================

def change_password(
    db: Session,
    user: User,
    data: ChangePasswordRequest,
) -> None:
    # 현재 비밀번호 확인
    if not verify_password(
        data.current_password,
        user.password_hash,
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="현재 비밀번호가 올바르지 않습니다.",
        )

    # 기존 비밀번호와 동일한지 확인
    if verify_password(
        data.new_password,
        user.password_hash,
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="기존 비밀번호와 다른 비밀번호를 입력해 주세요.",
        )

    user.password_hash = hash_password(
        data.new_password,
    )

    try:
        db.commit()

    except Exception:
        db.rollback()
        raise
