import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Text, BigInteger, Index, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID, ENUM, JSONB

from .base import Base
from .enums import MessageRoleEnum, ContentTypeEnum, MessageStatusEnum


class ChatMessage(Base):
    """
    ChatMessage model representing individual messages within a chat.

    Attributes:
        message_id (UUID): Primary key uniquely identifying the message.
        chat_id (UUID): Foreign key referencing the parent chat.
        sequence_number (int): Strictly increasing number for ordering messages.
        parent_message_id (UUID): Self-referential foreign key for message branching/editing.
        role (MessageRoleEnum): Indicates sender type (USER, ASSISTANT, SYSTEM, TOOL).
        content (str): The actual message text/content.
        content_type (ContentTypeEnum): Format of content (TEXT, MARKDOWN, JSON).
        status (MessageStatusEnum): Lifecycle state (streaming, completed, etc.).
        meta_data(dict): JSON field storing AI meta_data(tokens, citations, tools, etc.).
        created_at (datetime): Timestamp when message was created.
        updated_at (datetime): Timestamp when message was last updated.

    Relationships:
        chat (UserChat): Many-to-one relationship with chat.
        parent_message (ChatMessage): Self-referential parent message.
        child_messages (List[ChatMessage]): Messages derived from this message.

    Notes:
        - sequence_number ensures deterministic ordering within a chat.
        - parent_message_id enables regeneration, editing, and branching.
        - meta_datasupports extensibility for AI features (citations, tools, etc.).
        - status is critical for streaming responses in real-time systems.
    """

    __tablename__ = "chat_messages"

    message_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, unique=True, index=True)

    chat_id = Column(UUID(as_uuid=True), ForeignKey("user_chats.chat_id", ondelete="CASCADE"), nullable=False)

    sequence_number = Column(BigInteger, nullable=False)

    parent_message_id = Column(
        UUID(as_uuid=True),
        ForeignKey("chat_messages.message_id", ondelete="SET NULL"),
        nullable=True
    )

    role = Column(ENUM(MessageRoleEnum, name="message_role_enum"), nullable=False)

    content = Column(Text, nullable=False)

    content_type = Column(
        ENUM(ContentTypeEnum, name="content_type_enum"),
        nullable=False,
        default=ContentTypeEnum.TEXT
    )

    status = Column(
        ENUM(MessageStatusEnum, name="message_status_enum"),
        nullable=False,
        default=MessageStatusEnum.PENDING
    )

    meta_data = Column("metadata", JSONB, nullable=True)

    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    chat = relationship("UserChat", back_populates="messages")

    parent_message = relationship("ChatMessage", remote_side=[message_id], backref="child_messages")

    __table_args__ = (
        UniqueConstraint("chat_id", "sequence_number", name="uq_chat_sequence"),
        Index("idx_message_chat", "chat_id"),
        Index("idx_message_sequence", "chat_id", "sequence_number"),
        Index("idx_message_role", "chat_id", "role"),
        Index("idx_metadata", "metadata", postgresql_using="gin"),
    )