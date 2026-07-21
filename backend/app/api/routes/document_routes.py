from uuid import UUID

from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import (
    get_db,
    get_current_user,
    get_storage_provider
)

from app.models.user_model import User

from app.schemas.document_schema import (
    DocumentUploadResponse,
    ProcessingStatusResponse,
)

from app.services.document_upload_service import DocumentUploadService
from app.services.document_service import DocumentService
from app.services.orchestration_service import OrchestrationService
from app.schemas.retrieval import QueryRequest, QueryResponse
from fastapi.responses import StreamingResponse


router = APIRouter(
    prefix="/api/v1/documents",
    tags=["Documents"]
)


def get_orchestrator():
    return OrchestrationService()



@router.post(
    "/upload",
    response_model=DocumentUploadResponse
)
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    storage=Depends(get_storage_provider),
):

    service = DocumentUploadService(
        db_session=db,
        storage_provider=storage,
    )

    return await service.upload_document(
        user_id=current_user.user_id,
        file=file
    )


@router.post("/query")
async def run_query(
    request: QueryRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    orchestrator: OrchestrationService = Depends(get_orchestrator)
):
    """
    Secure endpoint: only authenticated users can query their own data
    """

    response_stream = orchestrator.run(
        query=request.query,
        user_id=current_user.user_id,
        chat_id=request.chat_id,
        db=db
    )

    return StreamingResponse(
        response_stream,
        media_type="text/event-stream"
    )


@router.get(
    "/status/{document_id}",
    response_model=ProcessingStatusResponse
)
async def get_document_status(
    document_id: UUID,
    db: AsyncSession = Depends(get_db)
):

    document_service = DocumentService()

    status = await document_service.get_doc_processing_status(
        db,
        document_id
    )

    return ProcessingStatusResponse.model_validate(status)