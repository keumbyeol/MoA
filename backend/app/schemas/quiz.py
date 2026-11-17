
from typing import Literal

from pydantic import BaseModel, Field


class QuizStartRequest(BaseModel):
    difficulty: Literal[1, 2, 3]


class QuizAnswerInput(BaseModel):
    question_id: int
    selected_option_id: int | None = None


class QuizSubmitRequest(BaseModel):
    attempt_id: int | None = None
    guest_token: str | None = None
    answers: list[QuizAnswerInput] = Field(
        min_length=1,
        max_length=10,
    )
