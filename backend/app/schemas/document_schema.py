from pydantic import BaseModel
from uuid import UUID
from app.models.enums import ProcessingStatusEnum,ProcessingStepEnum
from datetime import datetime


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