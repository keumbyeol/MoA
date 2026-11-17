
from datetime import datetime

from sqlalchemy import (
    BigInteger,
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    SmallInteger,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.mysql import BIGINT
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.financial_guide import utc_now


# =========================================================
# 퀴즈 문제
# =========================================================

class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    __table_args__ = (
        Index(
            "ix_quiz_questions_level_status",
            "difficulty",
            "status",
        ),
        CheckConstraint(
            "difficulty BETWEEN 1 AND 3",
            name="ck_quiz_question_difficulty",
        ),
    )

    id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
        autoincrement=True,
    )

    # BEGINNER = 1, INTERMEDIATE = 2, ADVANCED = 3
    difficulty: Mapped[int] = mapped_column(
        SmallInteger,
        nullable=False,
    )

    # MULTIPLE_CHOICE, OX
    question_type: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
    )

    # 문제 내용
    question_text: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    # 정답 해설
    explanation: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    # 출처 금융 가이드
    guide_id: Mapped[int | None] = mapped_column(
        BigInteger,
        ForeignKey("guides.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # 출처 정보
    source_title: Mapped[str | None] = mapped_column(
        String(250),
        nullable=True,
    )

    source_url: Mapped[str | None] = mapped_column(
        String(1000),
        nullable=True,
    )

    # 법령 및 세금 정보 적용 연도
    applicable_year: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    # AI, MANUAL
    generation_type: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="AI",
    )

    # DRAFT, PUBLISHED, ARCHIVED
    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="DRAFT",
    )

    # 검증 여부
    is_verified: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )

    reviewed_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=utc_now,
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=utc_now,
        onupdate=utc_now,
        nullable=False,
    )

    options: Mapped[list["QuizOption"]] = relationship(
        back_populates="question",
        cascade="all, delete-orphan",
        order_by="QuizOption.sort_order",
    )


# =========================================================
# 퀴즈 선택지
# =========================================================

class QuizOption(Base):
    __tablename__ = "quiz_options"

    __table_args__ = (
        UniqueConstraint(
            "question_id",
            "sort_order",
            name="uq_quiz_option_order",
        ),
    )

    id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
        autoincrement=True,
    )

    question_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("quiz_questions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    option_text: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    is_correct: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )

    sort_order: Mapped[int] = mapped_column(
        SmallInteger,
        nullable=False,
    )

    question: Mapped["QuizQuestion"] = relationship(
        back_populates="options",
    )


# =========================================================
# 회원별 퀴즈 응시 기록
# =========================================================

class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    __table_args__ = (
        Index(
            "ix_quiz_attempts_user_created",
            "user_id",
            "created_at",
        ),
        CheckConstraint(
            "difficulty BETWEEN 1 AND 3",
            name="ck_quiz_attempt_difficulty",
        ),
    )

    id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
        autoincrement=True,
    )

    user_id: Mapped[int] = mapped_column(
        BIGINT(unsigned=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    difficulty: Mapped[int] = mapped_column(
        SmallInteger,
        nullable=False,
    )

    total_questions: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    correct_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    # 0~100점
    score: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    # IN_PROGRESS, COMPLETED
    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="IN_PROGRESS",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=utc_now,
        nullable=False,
    )

    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    answers: Mapped[list["QuizAttemptAnswer"]] = relationship(
        back_populates="attempt",
        cascade="all, delete-orphan",
    )


# =========================================================
# 회원별 문제 응답 기록
# =========================================================

class QuizAttemptAnswer(Base):
    __tablename__ = "quiz_attempt_answers"

    __table_args__ = (
        UniqueConstraint(
            "attempt_id",
            "question_id",
            name="uq_quiz_attempt_question",
        ),
    )

    id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
        autoincrement=True,
    )

    attempt_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("quiz_attempts.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    question_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("quiz_questions.id"),
        nullable=False,
    )

    # 사용자가 선택한 답
    selected_option_id: Mapped[int | None] = mapped_column(
        BigInteger,
        ForeignKey("quiz_options.id"),
        nullable=True,
    )

    is_correct: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )

    answered_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=utc_now,
        nullable=False,
    )

    attempt: Mapped["QuizAttempt"] = relationship(
        back_populates="answers",
    )
