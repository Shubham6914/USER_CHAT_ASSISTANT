import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Text, BigInteger, String, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID

from .base import Base


class ConversationSummary(Base):
    """
    ConversationSummary model representing a summarized version of a chat.

    Attributes:
        summary_id (UUID): Primary key uniquely identifying the summary.
        chat_id (UUID): Foreign key referencing the associated chat.
        summary (str): AI-generated summary of the conversation.
        last_summarized_sequence (int): Last message sequence included in summary.
        model_name (str): Name of the model used for generating the summary.
        created_at (datetime): Timestamp when summary was created.
        updated_at (datetime): Timestamp when summary was last updated.

    Relationships:
        chat (UserChat): One-to-one relationship with chat.

    Notes:
        - Ensures one summary per chat (UNIQUE constraint).
        - Used for memory optimization in long conversations.
        - last_summarized_sequence allows incremental summarization.
    """

    __tablename__ = "conversation_summary"

    summary_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, unique=True, index=True)

    chat_id = Column(
        UUID(as_uuid=True),
        ForeignKey("user_chats.chat_id", ondelete="CASCADE"),
        nullable=False,
        unique=True
    )

    summary = Column(Text, nullable=False)

    last_summarized_sequence = Column(BigInteger, nullable=False, default=0)

    model_name = Column(String(100), nullable=True)

    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    chat = relationship("UserChat", back_populates="summary")

    __table_args__ = (
        UniqueConstraint("chat_id", name="uq_summary_chat"),
    )