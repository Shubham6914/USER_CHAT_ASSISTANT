import uuid

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID

from .base import Base


class RefreshToken(Base):
    """
    RefreshToken model for managing user sessions.

    Attributes:
        id (int): Primary key.
        user_id (int): Foreign key to User.
        refresh_token (str): Token string.
        expires_at (datetime): Expiry timestamp.
        created_at (datetime): Creation timestamp.

    Relationships:
        user (User): Many-to-one relationship with user.
    """

    __tablename__ = "refresh_tokens"

    id = Column(UUID(as_uuid=True), primary_key=True, index=True, default=uuid.uuid4, unique=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="CASCADE"),nullable=False)

    refresh_token = Column(String, nullable=False, unique=True)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="refresh_tokens")
