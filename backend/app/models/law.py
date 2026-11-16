
from datetime import date, datetime

from sqlalchemy import (
    BigInteger,
    Date,
    DateTime,
    ForeignKey,
    String,
    UniqueConstraint,
)
from sqlalchemy.dialects.mysql import LONGTEXT
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.financial_guide import utc_now


class Law(Base):
    __tablename__ = "laws"

    id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
        autoincrement=True,
    )

    external_law_id: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        nullable=False,
    )

    law_name: Mapped[str] = mapped_column(
        String(250),
        nullable=False,
    )

    law_type: Mapped[str | None] = mapped_column(
        String(40),
        nullable=True,
    )

    official_url: Mapped[str | None] = mapped_column(
        String(1000),
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

    versions: Mapped[list["LawVersion"]] = relationship(
        back_populates="law",
    )


class LawVersion(Base):
    __tablename__ = "law_versions"

    id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
        autoincrement=True,
    )

    law_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("laws.id"),
        nullable=False,
    )

    external_version_id: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        nullable=False,
    )

    promulgation_no: Mapped[str | None] = mapped_column(
        String(60),
        nullable=True,
    )

    promulgated_on: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    effective_from: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    effective_to: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    version_label: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    source_checked_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=utc_now,
        nullable=False,
    )

    law: Mapped["Law"] = relationship(
        back_populates="versions",
    )

    articles: Mapped[list["LawArticle"]] = relationship(
        back_populates="version",
    )


class LawArticle(Base):
    __tablename__ = "law_articles"

    __table_args__ = (
        UniqueConstraint(
            "law_version_id",
            "article_key",
            name="uq_law_article_version_key",
        ),
    )

    id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
        autoincrement=True,
    )

    law_version_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("law_versions.id"),
        nullable=False,
    )

    article_key: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    article_no: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
    )

    paragraph_no: Mapped[str | None] = mapped_column(
        String(30),
        nullable=True,
    )

    heading: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    official_text: Mapped[str] = mapped_column(
        LONGTEXT,
        nullable=False,
    )

    version: Mapped["LawVersion"] = relationship(
        back_populates="articles",
    )
