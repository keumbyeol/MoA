
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.security import decode_access_token
from app.models.user import User
from app.models.quiz import (
    QuizAttempt,
    QuizAttemptAnswer,
)
from app.schemas.quiz import (
    QuizStartRequest,
    QuizSubmitRequest,
)
from app.services import quiz_service


router = APIRouter(
    prefix="/api/quiz",
    tags=["금융 퀴즈"],
)

bearer = HTTPBearer(auto_error=False)


# =========================================================
# 1. 선택적 사용자 인증
# 비회원은 None 반환, 회원은 사용자 정보 반환
# =========================================================

def optional_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(
        bearer
    ),
    db: Session = Depends(get_db),
) -> User | None:

    if credentials is None:
        return None

    user_id = decode_access_token(
        credentials.credentials
    )

    if user_id is None:
        raise HTTPException(
            status_code=401,
            detail="유효하지 않은 인증 토큰입니다.",
        )

    user = db.get(User, user_id)

    if (
        user is None
        or user.status != "ACTIVE"
        or user.deleted_at is not None
    ):
        raise HTTPException(
            status_code=401,
            detail="사용할 수 없는 계정입니다.",
        )

    return user


# =========================================================
# 2. 응시 기록 변환
# =========================================================

def attempt_to_dict(attempt: QuizAttempt):
    return {
        "id": attempt.id,
        "difficulty": attempt.difficulty,
        "total_questions": attempt.total_questions,
        "correct_count": attempt.correct_count,
        "score": attempt.score,
        "status": attempt.status,
        "created_at": attempt.created_at,
        "completed_at": attempt.completed_at,
    }


# =========================================================
# 3. 난이도별 문제 수 조회
# GET /api/quiz/levels
# =========================================================

@router.get("/levels")
def get_levels(
    db: Session = Depends(get_db),
):
    levels = [
        (1, "초급"),
        (2, "중급"),
        (3, "고급"),
    ]

    return {
        "question_count_per_quiz": quiz_service.QUESTION_COUNT,
        "levels": [
            {
                "difficulty": difficulty,
                "name": name,
                "question_count": quiz_service.get_question_count(
                    db,
                    difficulty,
                ),
            }
            for difficulty, name in levels
        ],
    }


# =========================================================
# 4. 퀴즈 시작
# POST /api/quiz/start
# =========================================================

@router.post("/start")
def start_quiz(
    data: QuizStartRequest,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(optional_user),
):
    questions = quiz_service.select_questions(
        db,
        data.difficulty,
    )

    question_ids = [
        question.id
        for question in questions
    ]

    response = {
        "difficulty": data.difficulty,
        "total_questions": len(questions),
        "questions": [
            quiz_service.question_to_dict(question)
            for question in questions
        ],
        "attempt_id": None,
        "guest_token": None,
    }

    # 비회원: DB 기록 없이 퀴즈 시작
    if current_user is None:
        response["guest_token"] = (
            quiz_service.create_guest_token(
                data.difficulty,
                question_ids,
            )
        )
        return response

    # 회원: 응시 기록 생성
    attempt = QuizAttempt(
        user_id=current_user.id,
        difficulty=data.difficulty,
        total_questions=len(questions),
        correct_count=0,
        score=0,
        status="IN_PROGRESS",
    )

    db.add(attempt)
    db.flush()

    # 출제된 문제 10개를 미리 저장
    for question in questions:
        db.add(
            QuizAttemptAnswer(
                attempt_id=attempt.id,
                question_id=question.id,
                selected_option_id=None,
                is_correct=False,
            )
        )

    db.commit()

    response["attempt_id"] = attempt.id

    return response


# =========================================================
# 5. 퀴즈 답안 제출 및 채점
# POST /api/quiz/submit
# =========================================================

@router.post("/submit")
def submit_quiz(
    data: QuizSubmitRequest,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(optional_user),
):

    # -----------------------------------------------------
    # 비회원 채점
    # -----------------------------------------------------
    if current_user is None:

        if (
            data.attempt_id is not None
            or not data.guest_token
        ):
            raise HTTPException(
                status_code=400,
                detail="비회원 퀴즈 응시 정보가 필요합니다.",
            )

        payload = quiz_service.verify_guest_token(
            data.guest_token
        )

        questions = quiz_service.load_questions(
            db,
            payload["question_ids"],
        )

        result = quiz_service.grade_questions(
            questions,
            data.answers,
        )

        return {
            "attempt_id": None,
            "difficulty": payload["difficulty"],
            "saved": False,
            **result,
        }

    # -----------------------------------------------------
    # 회원 채점
    # -----------------------------------------------------
    if data.attempt_id is None:
        raise HTTPException(
            status_code=400,
            detail="회원 응시 번호가 필요합니다.",
        )

    attempt = db.scalar(
        select(QuizAttempt)
        .where(
            QuizAttempt.id == data.attempt_id,
            QuizAttempt.user_id == current_user.id,
        )
        .with_for_update()
    )

    if attempt is None:
        raise HTTPException(
            status_code=404,
            detail="퀴즈 응시 기록을 찾을 수 없습니다.",
        )

    if attempt.status != "IN_PROGRESS":
        raise HTTPException(
            status_code=400,
            detail="이미 제출한 퀴즈입니다.",
        )

    if attempt.created_at < (
        datetime.utcnow() - timedelta(hours=1)
    ):
        raise HTTPException(
            status_code=400,
            detail="퀴즈 응시 시간이 만료되었습니다.",
        )

    answer_records = db.scalars(
        select(QuizAttemptAnswer)
        .where(
            QuizAttemptAnswer.attempt_id == attempt.id
        )
        .order_by(QuizAttemptAnswer.id)
    ).all()

    question_ids = [
        answer.question_id
        for answer in answer_records
    ]

    questions = quiz_service.load_questions(
        db,
        question_ids,
    )

    result = quiz_service.grade_questions(
        questions,
        data.answers,
    )

    submitted = {
        answer.question_id: answer.selected_option_id
        for answer in data.answers
    }

    graded = {
        item["question_id"]: item
        for item in result["results"]
    }

    # 문제별 답안 기록
    for answer in answer_records:
        answer.selected_option_id = submitted[
            answer.question_id
        ]
        answer.is_correct = graded[
            answer.question_id
        ]["is_correct"]
        answer.answered_at = datetime.utcnow()

    # 최종 점수 저장
    attempt.correct_count = result["correct_count"]
    attempt.score = result["score"]
    attempt.status = "COMPLETED"
    attempt.completed_at = datetime.utcnow()

    db.commit()

    return {
        "attempt_id": attempt.id,
        "difficulty": attempt.difficulty,
        "saved": True,
        **result,
    }


# =========================================================
# 6. 회원 퀴즈 응시 기록 목록
# GET /api/quiz/history
# =========================================================

@router.get("/history")
def get_quiz_history(
    page: int = Query(default=1, ge=1),
    size: int = Query(default=10, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conditions = [
        QuizAttempt.user_id == current_user.id,
        QuizAttempt.status == "COMPLETED",
    ]

    total = db.scalar(
        select(func.count(QuizAttempt.id))
        .where(*conditions)
    ) or 0

    attempts = db.scalars(
        select(QuizAttempt)
        .where(*conditions)
        .order_by(
            QuizAttempt.completed_at.desc()
        )
        .offset((page - 1) * size)
        .limit(size)
    ).all()

    return {
        "items": [
            attempt_to_dict(attempt)
            for attempt in attempts
        ],
        "pagination": {
            "page": page,
            "size": size,
            "total": total,
            "total_pages": (
                total + size - 1
            ) // size,
            "has_next": page * size < total,
            "has_previous": page > 1,
        },
    }


# =========================================================
# 7. 회원 퀴즈 응시 기록 상세
# GET /api/quiz/history/{attempt_id}
# =========================================================

@router.get("/history/{attempt_id}")
def get_quiz_history_detail(
    attempt_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    attempt = db.scalar(
        select(QuizAttempt)
        .where(
            QuizAttempt.id == attempt_id,
            QuizAttempt.user_id == current_user.id,
            QuizAttempt.status == "COMPLETED",
        )
    )

    if attempt is None:
        raise HTTPException(
            status_code=404,
            detail="응시 기록을 찾을 수 없습니다.",
        )

    answer_records = db.scalars(
        select(QuizAttemptAnswer)
        .where(
            QuizAttemptAnswer.attempt_id == attempt.id
        )
        .order_by(QuizAttemptAnswer.id)
    ).all()

    questions = quiz_service.load_questions(
        db,
        [
            answer.question_id
            for answer in answer_records
        ],
    )

    question_map = {
        question.id: question
        for question in questions
    }

    results = []

    for answer in answer_records:
        question = question_map[
            answer.question_id
        ]

        correct_option = next(
            option
            for option in question.options
            if option.is_correct
        )

        results.append({
            "question_id": question.id,
            "question_text": question.question_text,
            "selected_option_id": answer.selected_option_id,
            "correct_option_id": correct_option.id,
            "correct_option_text": correct_option.option_text,
            "is_correct": answer.is_correct,
            "explanation": question.explanation,
            "source_title": question.source_title,
            "source_url": question.source_url,
        })

    return {
        **attempt_to_dict(attempt),
        "results": results,
    }
