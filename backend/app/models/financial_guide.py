
from datetime import datetime, timezone

from sqlalchemy import (
    BigInteger,
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


def utc_now():
    return datetime.now(timezone.utc).replace(tzinfo=None)


class DataSource(Base):
    __tablename__ = "data_sources"

    id: Mapped[int] = mapped_column(
        BigInteger, primary_key=True, autoincrement=True
    )
    source_code: Mapped[str] = mapped_column(
        String(40), unique=True, nullable=False
    )
    name: Mapped[str] = mapped_column(String(200))
    base_url: Mapped[str] = mapped_column(String(1000))
    source_type: Mapped[str] = mapped_column(String(20))
    update_policy: Mapped[str | None] = mapped_column(
        String(100), nullable=True
    )
    enabled: Mapped[bool] = mapped_column(
        Boolean, default=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=utc_now
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=utc_now, onupdate=utc_now
    )


class SyncJob(Base):
    __tablename__ = "sync_jobs"

    id: Mapped[int] = mapped_column(
        BigInteger, primary_key=True, autoincrement=True
    )
    data_source_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("data_sources.id"),
        nullable=False
    )
    dataset: Mapped[str] = mapped_column(String(60))
    started_at: Mapped[datetime] = mapped_column(
        DateTime, default=utc_now
    )
    finished_at: Mapped[datetime | None] = mapped_column(
        DateTime, nullable=True
    )
    status: Mapped[str] = mapped_column(
        String(20), default="RUNNING"
    )
    fetched_count: Mapped[int] = mapped_column(
        Integer, default=0
    )
    inserted_count: Mapped[int] = mapped_column(
        Integer, default=0
    )
    updated_count: Mapped[int] = mapped_column(
        Integer, default=0
    )
    error_summary: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )


class SourceRecord(Base):
    __tablename__ = "source_records"

    __table_args__ = (
        UniqueConstraint(
            "data_source_id",
            "external_id",
            "entity_type",
            name="uq_source_record_identity",
        ),
    )

    id: Mapped[int] = mapped_column(
        BigInteger, primary_key=True, autoincrement=True
    )
    data_source_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("data_sources.id"),
        nullable=False
    )
    external_id: Mapped[str] = mapped_column(
        String(150), nullable=False
    )
    entity_type: Mapped[str] = mapped_column(
        String(40), nullable=False
    )
    entity_id: Mapped[int | None] = mapped_column(
        BigInteger, nullable=True
    )
    content_hash: Mapped[str] = mapped_column(
        String(64), nullable=False
    )
    fetched_at: Mapped[datetime] = mapped_column(
        DateTime, default=utc_now
    )
    raw_payload: Mapped[dict | list | None] = mapped_column(
        JSON, nullable=True
    )


class GuideCategory(Base):
    __tablename__ = "guide_categories"

    id: Mapped[int] = mapped_column(
        BigInteger, primary_key=True, autoincrement=True
    )
    parent_id: Mapped[int | None] = mapped_column(
        BigInteger,
        ForeignKey("guide_categories.id"),
        nullable=True
    )
    slug: Mapped[str] = mapped_column(
        String(80), unique=True
    )
    name: Mapped[str] = mapped_column(String(100))
    sort_order: Mapped[int] = mapped_column(
        Integer, default=0
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, default=True
    )


class Guide(Base):
    __tablename__ = "guides"

    id: Mapped[int] = mapped_column(
        BigInteger, primary_key=True, autoincrement=True
    )
    category_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("guide_categories.id"),
        nullable=False
    )
    slug: Mapped[str] = mapped_column(
        String(150), unique=True
    )
    title: Mapped[str] = mapped_column(String(250))
    summary: Mapped[str] = mapped_column(Text)
    body: Mapped[str] = mapped_column(Text)
    audience: Mapped[str | None] = mapped_column(
        String(100), nullable=True
    )
    status: Mapped[str] = mapped_column(
        String(20), default="DRAFT"
    )
    published_at: Mapped[datetime | None] = mapped_column(
        DateTime, nullable=True
    )
    reviewed_at: Mapped[datetime | None] = mapped_column(
        DateTime, nullable=True
    )
    reviewer_note: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=utc_now
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=utc_now, onupdate=utc_now
    )


class GuideReference(Base):
    __tablename__ = "guide_references"

    id: Mapped[int] = mapped_column(
        BigInteger, primary_key=True, autoincrement=True
    )
    guide_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("guides.id"),
        nullable=False
    )
    data_source_id: Mapped[int | None] = mapped_column(
        BigInteger,
        ForeignKey("data_sources.id"),
        nullable=True
    )
    reference_type: Mapped[str] = mapped_column(String(30))
    title: Mapped[str] = mapped_column(String(250))
    url: Mapped[str] = mapped_column(String(1000))
    accessed_at: Mapped[datetime] = mapped_column(
        DateTime, default=utc_now
    )
    effective_on: Mapped[datetime | None] = mapped_column(
        DateTime, nullable=True
    )
    sort_order: Mapped[int] = mapped_column(
        Integer, default=0
    )
