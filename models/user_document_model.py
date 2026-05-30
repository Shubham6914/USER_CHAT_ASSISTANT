from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from .base import Base


class UserDocument(Base):
    """
    UserDocument model representing uploaded documents.

    Attributes:
        doc_id (int): Primary key.
        user_id (int): Foreign key to User.
        document_name (str): Name of the document.
        file_path (str): Storage path of the document.
        created_at (datetime): Timestamp of upload.

    Relationships:
        user (User): Many-to-one relationship with user.
    """

    __tablename__ = "user_documents"

    doc_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    document_name = Column(String, nullable=True)
    file_path = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="documents")