
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
