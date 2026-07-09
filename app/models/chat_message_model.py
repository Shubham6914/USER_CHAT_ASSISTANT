from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID
from .base import Base
import uuid

class ChatMessage(Base):
    """
    ChatMessage model representing messages in a chat.

    Attributes:
        message_id (UUID): Primary key.
        chat_id (UUID): Foreign key to UserChat.
        content (str): Message content.
        role (str): Role of sender ('user' or 'assistant').
        created_at (datetime): Timestamp of message creation.

    Relationships:
        chat (UserChat): Many-to-one relationship with chat.
    """

    __tablename__ = "chat_messages"

    message_id = Column(UUID(as_uuid=True), primary_key=True, index=True, default=uuid.uuid4, unique=True)
    chat_id = Column(UUID(as_uuid=True), ForeignKey("user_chats.chat_id",ondelete="CASCADE"), nullable=False)
    content = Column(Text, nullable=False)
    role = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    chat = relationship("UserChat", back_populates="messages")