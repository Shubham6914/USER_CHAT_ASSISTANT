from pydantic import BaseModel
from uuid import UUID
from app.models.enums import ProcessingStatusEnum,ProcessingStepEnum
from datetime import datetime
from typing import Optional, List


class DocumentUploadResponse(BaseModel):
    """
    Response schema for document upload
    """

    doc_id: UUID
    file_name: str
    file_path: str
    message: str



class ProcessingStatusResponse(BaseModel):
    """
    Response schema for document processing status.
    """

    document_id: UUID
    status: ProcessingStatusEnum
    current_step: ProcessingStepEnum
    progress: int
    error_message: str | None = None
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }


class DocumentResponse(BaseModel):
    """
    Response schema representing a user's uploaded document and processing state.
    """
    doc_id: UUID
    document_name: str
    created_at: datetime
    status: Optional[str] = None
    progress: Optional[int] = 0

    @classmethod
    def from_orm(cls, doc):
        status = doc.processing_status.status.value if doc.processing_status else "pending"
        progress = doc.processing_status.progress if doc.processing_status else 0
        return cls(
            doc_id=doc.doc_id,
            document_name=doc.document_name or "Unnamed Document",
            created_at=doc.created_at,
            status=status,
            progress=progress
        )


class DocumentListResponse(BaseModel):
    """
    Response schema listing all user documents.
    """
    documents: List[DocumentResponse]