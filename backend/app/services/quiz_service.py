
import hashlib
import hmac
import json
import secrets
import time
from base64 import urlsafe_b64decode, urlsafe_b64encode

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.core.config import settings
from app.models.quiz import QuizQuestion


QUESTION_COUNT = 10
GUEST_TOKEN_EXPIRE_SECONDS = 3600


def available_questions(db: Session, difficulty: int):
    return (
        select(QuizQuestion)
        .where(
            QuizQuestion.difficulty == difficulty,
            QuizQuestion.status == "PUBLISHED",
            QuizQuestion.is_verified.is_(True),
        )
    )


def get_question_count(db: Session, difficulty: int):
    stmt = available_questions(db, difficulty)
    return db.scalar(
        select(func.count()).select_from(
            stmt.subquery()
        )
    ) or 0


def select_questions(db: Session, difficulty: int):
    count = get_question_count(db, difficulty)

    if count < QUESTION_COUNT:
        raise HTTPException(
            status_code=400,
            detail=(
                f"해당 난이도의 검증된 문제가 부족합니다. "
                f"현재 {count}개, 최소 {QUESTION_COUNT}개가 필요합니다."
            ),
        )

    return db.scalars(
        available_questions(db, difficulty)
        .options(selectinload(QuizQuestion.options))
        .order_by(func.rand())
        .limit(QUESTION_COUNT)
    ).all()


def question_to_dict(question: QuizQuestion):
    return {
        "id": question.id,
        "difficulty": question.difficulty,
        "question_type": question.question_type,
        "question_text": question.question_text,
        "options": [
            {
                "id": option.id,
                "option_text": option.option_text,
                "sort_order": option.sort_order,
            }
            for option in question.options
        ],
    }


def load_questions(db: Session, question_ids: list[int]):
    questions = db.scalars(
        select(QuizQuestion)
        .where(QuizQuestion.id.in_(question_ids))
        .options(selectinload(QuizQuestion.options))
    ).all()

    by_id = {question.id: question for question in questions}

    if set(by_id) != set(question_ids):
        raise HTTPException(
            status_code=400,
            detail="출제된 문제를 찾을 수 없습니다.",
        )

    return [by_id[question_id] for question_id in question_ids]


def grade_questions(questions, submitted_answers):
    answers_by_id = {
        answer.question_id: answer.selected_option_id
        for answer in submitted_answers
    }

    expected_ids = {question.id for question in questions}

    if (
        len(answers_by_id) != len(submitted_answers)
        or set(answers_by_id) != expected_ids
    ):
        raise HTTPException(
            status_code=400,
            detail="출제된 모든 문제에 대한 답안을 제출해야 합니다.",
        )

    results = []
    correct_count = 0

    for question in questions:
        correct_options = [
            option
            for option in question.options
            if option.is_correct
        ]

        if len(correct_options) != 1:
            raise HTTPException(
                status_code=500,
                detail="문제의 정답 데이터가 올바르지 않습니다.",
            )

        correct_option = correct_options[0]
        selected_id = answers_by_id[question.id]

        if selected_id is not None and selected_id not in {
            option.id for option in question.options
        }:
            raise HTTPException(
                status_code=400,
                detail="해당 문제에 속하지 않는 선택지가 포함되어 있습니다.",
            )

        is_correct = selected_id == correct_option.id

        if is_correct:
            correct_count += 1

        results.append({
            "question_id": question.id,
            "question_text": question.question_text,
            "selected_option_id": selected_id,
            "correct_option_id": correct_option.id,
            "correct_option_text": correct_option.option_text,
            "is_correct": is_correct,
            "explanation": question.explanation,
            "source_title": question.source_title,
            "source_url": question.source_url,
        })

    return {
        "total_questions": len(questions),
        "correct_count": correct_count,
        "score": round(correct_count / len(questions) * 100),
        "results": results,
    }


def _sign(payload: str):
    return hmac.new(
        settings.JWT_SECRET_KEY.encode("utf-8"),
        payload.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()


def create_guest_token(difficulty: int, question_ids: list[int]):
    payload = json.dumps(
        {
            "difficulty": difficulty,
            "question_ids": question_ids,
            "exp": int(time.time()) + GUEST_TOKEN_EXPIRE_SECONDS,
            "nonce": secrets.token_hex(16),
        },
        separators=(",", ":"),
    )

    encoded = urlsafe_b64encode(
        payload.encode("utf-8")
    ).decode("ascii")

    return f"{encoded}.{_sign(encoded)}"


def verify_guest_token(token: str):
    try:
        encoded, signature = token.split(".", 1)

        if not hmac.compare_digest(
            _sign(encoded), signature
        ):
            raise ValueError("Invalid signature")

        padded = encoded + "=" * (-len(encoded) % 4)
        payload = json.loads(
            urlsafe_b64decode(padded).decode("utf-8")
        )

        if payload["exp"] < time.time():
            raise ValueError("Expired token")

        ids = payload["question_ids"]

        if (
            not isinstance(ids, list)
            or len(ids) != QUESTION_COUNT
            or len(set(ids)) != QUESTION_COUNT
            or not all(type(item) is int for item in ids)
            or payload["difficulty"] not in (1, 2, 3)
        ):
            raise ValueError("Invalid questions")

        return payload

    except (ValueError, KeyError, TypeError, UnicodeError, json.JSONDecodeError):
        raise HTTPException(
            status_code=400,
            detail="퀴즈 응시 정보가 유효하지 않거나 만료되었습니다.",
        )
