from pydantic import BaseModel
from uuid import UUID

class DocumentUploadResponse(BaseModel):
    """
    Response schema for document upload
    """

    doc_id: UUID
    file_name: str
    file_path: str
    message: str