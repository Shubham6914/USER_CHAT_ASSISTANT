import uuid
from datetime import datetime

from sqlalchemy import Column, Enum, String, DateTime, ForeignKey, Enum as SqlEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from .base import Base
from .enums import ProcessingStatusEnum


class ProcessingStatus(Base):
    """
    Tracks processing state of a document pipeline.

    Each document has exactly one processing status.

    Attributes:
        processing_id (UUID): Primary key
        document_id (UUID): Foreign key to UserDocument
        status (str): Current processing state
        error_message (str): Error details if failed
        created_at (datetime)
        updated_at (datetime)
    """

    __tablename__ = "processing_status"

    processing_id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        unique=True,
        index=True
    )

    document_id = Column(
        UUID(as_uuid=True),
        ForeignKey("user_documents.doc_id", ondelete="CASCADE"),
        nullable=False,
        unique=True  # ensures 1:1 relationship
    )

    status = Column(
            SqlEnum(ProcessingStatusEnum),
            nullable=False,
            default=ProcessingStatusEnum.PENDING
        )
    error_message = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship
    document = relationship("UserDocument", back_populates="processing_status")