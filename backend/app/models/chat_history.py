from datetime import datetime, timezone
from sqlalchemy import DateTime, ForeignKey, String, Text, Index
from sqlalchemy.dialects.mysql import BIGINT, LONGTEXT
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


def utc_now():
    return datetime.now(timezone.utc).replace(tzinfo=None)


class AIConversation(Base):
    __tablename__ = "ai_conversations"
    __table_args__ = (Index("ix_ai_conversations_user_updated", "user_id", "updated_at"),)

    id: Mapped[int] = mapped_column(BIGINT(unsigned=True), primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(BIGINT(unsigned=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title: Mapped[str | None] = mapped_column(String(200), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)


class AIMessage(Base):
    __tablename__ = "ai_messages"

    id: Mapped[int] = mapped_column(BIGINT(unsigned=True), primary_key=True, autoincrement=True)
    conversation_id: Mapped[int] = mapped_column(BIGINT(unsigned=True), ForeignKey("ai_conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    role: Mapped[str] = mapped_column(String(20), nullable=False)
    content: Mapped[str] = mapped_column(LONGTEXT, nullable=False)
    model_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, nullable=False)
