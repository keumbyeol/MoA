from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    BigInteger,
    Date,
    DateTime,
    ForeignKey,
    JSON,
    Numeric,
    SmallInteger,
    String,
    Text,
)

from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.financial_guide import utc_now


class SupportPolicy(Base):
    __tablename__ = "support_policies"

    id: Mapped[int] = mapped_column(
        BigInteger, primary_key=True, autoincrement=True
    )

    external_policy_no: Mapped[str] = mapped_column(
        String(100), unique=True, nullable=False
    )

    category_id: Mapped[int | None] = mapped_column(
        BigInteger, nullable=True
    )

    title: Mapped[str] = mapped_column(String(300))
    summary: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )
    support_description: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )

    provider_name: Mapped[str] = mapped_column(String(200))
    operator_name: Mapped[str | None] = mapped_column(
        String(200), nullable=True
    )

    application_method: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )
    application_url: Mapped[str | None] = mapped_column(
        String(1000), nullable=True
    )
    reference_url: Mapped[str | None] = mapped_column(
        String(1000), nullable=True
    )

    application_period_text: Mapped[str | None] = mapped_column(
        String(255), nullable=True
    )
    application_start: Mapped[datetime | None] = mapped_column(
        Date, nullable=True
    )
    application_end: Mapped[datetime | None] = mapped_column(
        Date, nullable=True
    )

    min_age: Mapped[int | None] = mapped_column(
        SmallInteger, nullable=True
    )
    max_age: Mapped[int | None] = mapped_column(
        SmallInteger, nullable=True
    )

    min_income: Mapped[Decimal | None] = mapped_column(
        Numeric(15, 2), nullable=True
    )
    max_income: Mapped[Decimal | None] = mapped_column(
        Numeric(15, 2), nullable=True
    )
    income_condition_text: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )

    eligibility_text: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )
    exclusion_text: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )

    region_codes: Mapped[list | None] = mapped_column(
        JSON, nullable=True
    )
    employment_codes: Mapped[list | None] = mapped_column(
        JSON, nullable=True
    )
    education_codes: Mapped[list | None] = mapped_column(
        JSON, nullable=True
    )

    status: Mapped[str] = mapped_column(
        String(20), default="UNKNOWN"
    )

    source_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("data_sources.id"),
        nullable=False
    )

    source_updated_at: Mapped[datetime | None] = mapped_column(
        DateTime, nullable=True
    )
    synced_at: Mapped[datetime] = mapped_column(
        DateTime, default=utc_now
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=utc_now
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=utc_now, onupdate=utc_now
    )
