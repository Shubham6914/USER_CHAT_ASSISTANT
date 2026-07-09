import uuid

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID

from .base import Base


class UserChat(Base):
    """
    Chat model representing a conversation session.

    Attributes:
        chat_id (UUID): Primary key.
        user_id (UUID): Foreign key to User.
        chat_title (str): Title of the chat.
        created_at (datetime): Timestamp of chat creation.

    Relationships:
        user (User): Many-to-one relationship with User.
        messages (List[ChatMessage]): One-to-many relationship with messages.
    """

    __tablename__ = "user_chats"

    chat_id = Column(UUID(as_uuid=True), primary_key=True, index=True, default=uuid.uuid4, unique=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id",ondelete="CASCADE"), nullable=False)
    chat_title = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="chats")
    messages = relationship("ChatMessage", back_populates="chat", cascade="all, delete-orphan")