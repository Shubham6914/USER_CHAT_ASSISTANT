import uuid

from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID

from .base import Base


class User(Base):
    """
    User model representing application users.

    Attributes:
        user_id (int): Primary key.
        user_name (str): Name of the user.
        user_email (str): Unique email of the user.
        password_hash (str): Hashed password.
        created_at (datetime): Creation timestamp.
        updated_at (datetime): Last update timestamp.

    Relationships:
        chats (List[UserChat])
        documents (List[UserDocument])
        refresh_tokens (List[RefreshToken])
    """

    __tablename__ = "users"

    user_id = Column(UUID(as_uuid=True), primary_key=True, index=True, default=uuid.uuid4, unique=True)
    user_name = Column(String, nullable=False)
    user_email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    chats = relationship("UserChat", back_populates="user", cascade="all, delete-orphan",passive_deletes=True)
    documents = relationship("UserDocument", back_populates="user", cascade="all, delete-orphan",passive_deletes=True)
    refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan", passive_deletes=True)