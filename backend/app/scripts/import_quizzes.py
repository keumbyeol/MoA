import json
import re
from pathlib import Path
from collections import Counter

from sqlalchemy import select

from app.core.database import SessionLocal
from app.models.quiz import QuizQuestion, QuizOption


# backend/app/data/quizzes.json
JSON_PATH = (
    Path(__file__).resolve().parent.parent
    / "data"
    / "quizzes.json"
)


def normalize_text(text: str) -> str:
    """문제 중복 검사용 문자열 정리"""
    return re.sub(
        r"\s+",
        " ",
        text.strip().casefold()
    )


def validate_question(item: dict, number: int) -> dict:
    """JSON 문제 데이터 검증"""

    if not isinstance(item, dict):
        raise ValueError(
            f"{number}번 문제: JSON 객체가 아닙니다."
        )

    difficulty = item.get("difficulty")
    question_type = item.get("question_type")
    question_text = item.get("question_text")
    explanation = item.get("explanation")
    options = item.get("options")

    # 난이도 검증
    if type(difficulty) is not int or difficulty not in (1, 2, 3):
        raise ValueError(
            f"{number}번 문제: 난이도는 1~3이어야 합니다."
        )

    # 문제 유형 검증
    if question_type not in ("MULTIPLE_CHOICE", "OX"):
        raise ValueError(
            f"{number}번 문제: 지원하지 않는 문제 유형입니다."
        )

    # 문제 내용 검증
    if not isinstance(question_text, str) or not question_text.strip():
        raise ValueError(
            f"{number}번 문제: 문제 내용이 없습니다."
        )

    # 해설 검증
    if not isinstance(explanation, str) or not explanation.strip():
        raise ValueError(
            f"{number}번 문제: 해설이 없습니다."
        )

    # 선택지 개수
    expected_count = (
        4 if question_type == "MULTIPLE_CHOICE"
        else 2
    )

    if not isinstance(options, list) or len(options) != expected_count:
        raise ValueError(
            f"{number}번 문제: 선택지는 "
            f"{expected_count}개여야 합니다."
        )

    cleaned_options = []

    for option in options:

        if not isinstance(option, dict):
            raise ValueError(
                f"{number}번 문제: 선택지 형식 오류"
            )

        text = option.get("text")
        correct = option.get("is_correct")

        if not isinstance(text, str) or not text.strip():
            raise ValueError(
                f"{number}번 문제: 빈 선택지가 있습니다."
            )

        if type(correct) is not bool:
            raise ValueError(
                f"{number}번 문제: is_correct는 "
                "true 또는 false여야 합니다."
            )

        cleaned_options.append({
            "text": text.strip(),
            "is_correct": correct,
        })

    # 정답 1개 확인
    correct_count = sum(
        option["is_correct"]
        for option in cleaned_options
    )

    if correct_count != 1:
        raise ValueError(
            f"{number}번 문제: 정답은 반드시 하나여야 합니다."
        )

    # 선택지 중복 확인
    option_texts = [
        normalize_text(option["text"])
        for option in cleaned_options
    ]

    if len(set(option_texts)) != expected_count:
        raise ValueError(
            f"{number}번 문제: 중복된 선택지가 있습니다."
        )

    # OX 문제 확인
    if question_type == "OX":

        ox_options = [
            option["text"].upper()
            for option in cleaned_options
        ]

        if ox_options != ["O", "X"]:
            raise ValueError(
                f"{number}번 문제: OX 선택지는 "
                "O, X 순서여야 합니다."
            )

    # 출처 정보
    source_title = item.get("source_title")
    source_url = item.get("source_url")
    applicable_year = item.get("applicable_year")

    if source_title is not None:
        if not isinstance(source_title, str) or len(source_title) > 250:
            raise ValueError(
                f"{number}번 문제: 출처 제목 형식 오류"
            )

    if source_url is not None:
        if (
            not isinstance(source_url, str)
            or len(source_url) > 1000
            or not source_url.startswith(("https://", "http://"))
        ):
            raise ValueError(
                f"{number}번 문제: 출처 URL 형식 오류"
            )

    if applicable_year is not None:
        if (
            type(applicable_year) is not int
            or not 1900 <= applicable_year <= 2100
        ):
            raise ValueError(
                f"{number}번 문제: 적용 연도 오류"
            )

    return {
        "difficulty": difficulty,
        "question_type": question_type,
        "question_text": question_text.strip(),
        "explanation": explanation.strip(),
        "options": cleaned_options,
        "source_title": source_title,
        "source_url": source_url,
        "applicable_year": applicable_year,
    }


def import_quizzes():

    if not JSON_PATH.exists():
        raise FileNotFoundError(
            f"퀴즈 JSON 파일이 없습니다: {JSON_PATH}"
        )

    # JSON 파일 읽기
    with open(JSON_PATH, "r", encoding="utf-8-sig") as file:
        data = json.load(file)

    if not isinstance(data, list):
        raise ValueError(
            "quizzes.json의 최상위 구조는 배열이어야 합니다."
        )

    # DB 저장 전 전체 데이터 검증
    questions = [
        validate_question(item, index)
        for index, item in enumerate(data, start=1)
    ]

    # JSON 내부 문제 중복 검사
    normalized_questions = [
        normalize_text(q["question_text"])
        for q in questions
    ]

    if len(set(normalized_questions)) != len(normalized_questions):
        raise ValueError(
            "JSON 파일 내부에 중복된 문제가 있습니다."
        )

    print("=" * 55)
    print("MOA 퀴즈 JSON 가져오기")
    print(f"JSON 파일: {JSON_PATH}")
    print(f"전체 문제: {len(questions)}")
    print("=" * 55)

    db = SessionLocal()

    try:
        # 기존 DB 문제 조회
        existing_questions = {
            normalize_text(text)
            for text in db.scalars(
                select(QuizQuestion.question_text)
            ).all()
        }

        added = 0
        skipped = 0

        for question in questions:

            question_key = normalize_text(
                question["question_text"]
            )

            # 기존 문제 중복 확인
            if question_key in existing_questions:
                skipped += 1

                print(
                    f"[중복 건너뜀] "
                    f"{question['question_text'][:45]}"
                )

                continue

            # 문제 저장
            quiz = QuizQuestion(
                difficulty=question["difficulty"],
                question_type=question["question_type"],
                question_text=question["question_text"],
                explanation=question["explanation"],
                guide_id=None,
                source_title=question["source_title"],
                source_url=question["source_url"],
                applicable_year=question["applicable_year"],
                generation_type="MANUAL",
                status="DRAFT",
                is_verified=False,
            )

            # 선택지 저장
            for order, option in enumerate(
                question["options"],
                start=1
            ):

                quiz.options.append(
                    QuizOption(
                        option_text=option["text"],
                        is_correct=option["is_correct"],
                        sort_order=order,
                    )
                )

            db.add(quiz)

            existing_questions.add(question_key)

            added += 1

        # 모든 문제 한 번에 저장
        db.commit()

        print()
        print("=" * 55)
        print("퀴즈 DB 저장 완료")
        print(f"신규 저장: {added}")
        print(f"중복 건너뜀: {skipped}")
        print("=" * 55)

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    import_quizzes()
