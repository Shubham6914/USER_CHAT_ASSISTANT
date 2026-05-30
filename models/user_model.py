from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime

from .base import Base


class User(Base):
    """
    User model representing application users.

    Attributes:
        user_id (int): Primary key.
        user_name (str): Name of the user.
        user_email (str): Unique email of the user.
        created_at (datetime): Timestamp of user creation.

    Relationships:
        chats (List[UserChat]): One-to-many relationship with chats.
        documents (List[UserDocument]): One-to-many relationship with documents.
    """

    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    user_name = Column(String, nullable=False)
    user_email = Column(String, unique=True, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    chats = relationship("UserChat", back_populates="user", cascade="all, delete-orphan")
    documents = relationship("UserDocument", back_populates="user", cascade="all, delete-orphan")