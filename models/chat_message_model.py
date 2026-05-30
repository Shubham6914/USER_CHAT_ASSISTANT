from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime

from .base import Base


class ChatMessage(Base):
    """
    ChatMessage model representing messages in a chat.

    Attributes:
        message_id (int): Primary key.
        chat_id (int): Foreign key to UserChat.
        content (str): Message content.
        role (str): Role of sender ('user' or 'assistant').
        created_at (datetime): Timestamp of message creation.

    Relationships:
        chat (UserChat): Many-to-one relationship with chat.
    """

    __tablename__ = "chat_messages"

    message_id = Column(Integer, primary_key=True, index=True)
    chat_id = Column(Integer, ForeignKey("user_chats.chat_id"), nullable=False)
    content = Column(Text, nullable=False)
    role = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    chat = relationship("UserChat", back_populates="messages")