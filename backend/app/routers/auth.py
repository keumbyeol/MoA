
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user

from app.models.user import User

from app.schemas.auth import (
    SignupRequest,
    LoginRequest,
    UserResponse,
    TokenResponse,
    RefreshRequest,
    LogoutRequest,
    MessageResponse,
    UpdateUserRequest,
    ChangePasswordRequest,
)

from app.services import auth_service


router = APIRouter(
    prefix="/api/auth",
    tags=["인증"],
)


# ==========================================
# 회원가입
# ==========================================

@router.post(
    "/signup",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def signup(
    data: SignupRequest,
    db: Session = Depends(get_db),
):
    return auth_service.signup(db, data)


# ==========================================
# 로그인
# ==========================================

@router.post(
    "/login",
    response_model=TokenResponse,
)
def login(
    data: LoginRequest,
    db: Session = Depends(get_db),
):
    return auth_service.login(
        db,
        str(data.email),
        data.password,
    )


# ==========================================
# Refresh Token 갱신
# ==========================================

@router.post(
    "/refresh",
    response_model=TokenResponse,
)
def refresh(
    data: RefreshRequest,
    db: Session = Depends(get_db),
):
    return auth_service.refresh_tokens(
        db,
        data.refresh_token,
    )


# ==========================================
# 내 정보 조회
# ==========================================

@router.get(
    "/me",
    response_model=UserResponse,
)
def me(
    current_user: User = Depends(get_current_user),
):
    return current_user


# ==========================================
# 내 정보 수정
# ==========================================

@router.patch(
    "/me",
    response_model=UserResponse,
)
def update_me(
    data: UpdateUserRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return auth_service.update_user(
        db,
        current_user,
        data,
    )


# ==========================================
# 비밀번호 변경
# ==========================================

@router.patch(
    "/me/password",
    response_model=MessageResponse,
)
def update_password(
    data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    auth_service.change_password(
        db,
        current_user,
        data,
    )

    return {
        "message": "비밀번호가 변경되었습니다.",
    }


# ==========================================
# 로그아웃
# ==========================================

@router.post(
    "/logout",
    response_model=MessageResponse,
)
def logout(
    data: LogoutRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    auth_service.logout(
        db,
        data.refresh_token,
        current_user.id,
    )

    return {
        "message": "로그아웃되었습니다.",
    }
