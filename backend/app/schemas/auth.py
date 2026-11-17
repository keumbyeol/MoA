
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field


UserType = Literal[
    "FIRST_JOB",
    "PART_TIME",
    "FOREIGN_WORKER",
    "RETURNING",
    "OTHER",
]


from pydantic import model_validator


class SignupRequest(BaseModel):
    email: EmailStr

    nickname: str = Field(
        min_length=2,
        max_length=60,
    )

    password: str = Field(
        min_length=8,
        max_length=128,
    )

    user_type: UserType = "OTHER"

    # 필수 동의 여부
    terms_agreed: bool
    privacy_agreed: bool

    @model_validator(mode="after")
    def validate_agreements(self):
        if not self.terms_agreed:
            raise ValueError(
                "서비스 이용약관에 동의해야 합니다."
            )

        if not self.privacy_agreed:
            raise ValueError(
                "개인정보 수집 및 이용에 동의해야 합니다."
            )

        return self


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    email: EmailStr
    nickname: str
    user_type: UserType
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str = Field(min_length=1)


class LogoutRequest(BaseModel):
    refresh_token: str = Field(min_length=1)


class MessageResponse(BaseModel):
    message: str


# ==========================================
# 회원 정보 수정
# 닉네임 / 회원 유형
# ==========================================

class UpdateUserRequest(BaseModel):
    nickname: str | None = Field(
        default=None,
        min_length=2,
        max_length=60,
    )

    user_type: UserType | None = None


# ==========================================
# 비밀번호 변경
# ==========================================

class ChangePasswordRequest(BaseModel):
    current_password: str = Field(
        min_length=1,
    )

    new_password: str = Field(
        min_length=8,
        max_length=128,
    )
