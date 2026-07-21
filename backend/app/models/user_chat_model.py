import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean, BigInteger, Index
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID, ENUM

from .base import Base
from .enums import TitleStatusEnum


class UserChat(Base):
    """
    Chat model representing a conversation session.

    Attributes:
        chat_id (UUID): Primary key uniquely identifying the chat.
        user_id (UUID): Foreign key referencing the owner (User).
        chat_title (str): Display title shown in UI (default: "New Chat").
        title_status (TitleStatusEnum): Indicates whether title is generated or custom.
        next_sequence (int): Tracks next message sequence number for ordering.
        last_message_at (datetime): Timestamp of last message for sorting chats.
        is_archived (bool): Soft delete flag to archive chats.
        created_at (datetime): Timestamp when chat was created.
        updated_at (datetime): Timestamp when chat metadata was last updated.

    Relationships:
        user (User): Many-to-one relationship with User.
        messages (List[ChatMessage]): One-to-many relationship with chat messages.
        summary (ConversationSummary): One-to-one relationship with conversation summary.

    Notes:
        - Supports multi-tenant chat isolation via user_id.
        - next_sequence ensures strict ordering of messages.
        - last_message_at is used for efficient chat list sorting.
        - is_archived enables soft delete instead of hard deletion.
    """

    __tablename__ = "user_chats"

    chat_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, unique=True, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)

    chat_title = Column(String(255), nullable=False, default="New Chat")
    title_status = Column(ENUM(TitleStatusEnum, name="title_status_enum"), nullable=False, default=TitleStatusEnum.PENDING)

    next_sequence = Column(BigInteger, nullable=False, default=1)
    last_message_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    is_archived = Column(Boolean, nullable=False, default=False)

    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="chats")
    messages = relationship("ChatMessage", back_populates="chat", cascade="all, delete-orphan")
    summary = relationship("ConversationSummary", back_populates="chat", uselist=False, cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_chat_user", "user_id"),
        Index("idx_chat_last_message", "user_id", "last_message_at"),
        Index("idx_chat_archive", "user_id", "is_archived"),
    )