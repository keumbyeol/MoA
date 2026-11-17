
from app.core.database import Base, engine

# 기존 모델 등록
import app.models  # noqa: F401

# 퀴즈 테이블만 생성
QUIZ_TABLES = [
    Base.metadata.tables["quiz_questions"],
    Base.metadata.tables["quiz_options"],
    Base.metadata.tables["quiz_attempts"],
    Base.metadata.tables["quiz_attempt_answers"],
]


def create_quiz_tables():
    Base.metadata.create_all(
        bind=engine,
        tables=QUIZ_TABLES,
        checkfirst=True,
    )

    print("퀴즈 테이블 생성 완료!")


if __name__ == "__main__":
    create_quiz_tables()
