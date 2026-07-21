from app.services.logger_service import get_logger
from app.models.processing_status_model import ProcessingStatus
from app.models.enums import ProcessingStatusEnum,ProcessingStepEnum
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.exceptions.document_exceptions import (
    InvalidFileTypeException,
    FileTooLargeException,
    FileSaveException,
    DatabaseException,
)
from uuid import UUID
import uuid

from app.models import UserDocument
from app.models import ProcessingStatus

class DocumentService:
    """
    Service for handling document-related DB operations,
    including processing status management.
    """

    def __init__(self):
        self.logger = get_logger("document_service")


    async def create_processing_status(self, db: AsyncSession, document_id):
        """
        Create initial processing status for a document asynchronously.
        """

        try:
            status = ProcessingStatus(
                document_id=document_id,
                status=ProcessingStatusEnum.PENDING,
                current_step=ProcessingStepEnum.DOCUMENT_SAVED,
                progress=0
            )

            db.add(status)

            await db.commit()
            await db.refresh(status)

            self.logger.info(
                f"Processing status created for document {document_id}"
            )

            return status

        except Exception as e:
            self.logger.error(
                f"Failed to create processing status: {str(e)}"
            )

            await db.rollback()
            raise

    async def update_processing_status(
        self,
        db: AsyncSession,
        document_id,
        status=None,
        current_step=None,
        progress=None,
        error_message=None
        ):
        """ss
        Update processing state for a document asynchronously.
        """

        try:
            result = await db.execute(
                select(ProcessingStatus).filter(
                    ProcessingStatus.document_id == document_id
                )
            )
            record = result.scalars().first()

            if not record:
                raise ValueError(
                    f"Processing status not found for document {document_id}"
                )


            if status is not None:
                record.status = status


            if current_step is not None:
                record.current_step = current_step


            if progress is not None:
                record.progress = progress


            if error_message is not None:
                record.error_message = error_message


            await db.flush()

            self.logger.info(
                f"""
                Updated processing state:
                document={document_id}
                status={record.status}
                step={record.current_step}
                progress={record.progress}
                """
            )

            return record


        except Exception as e:
            self.logger.error(
                f"Failed to update processing status: {str(e)}"
            )

            await db.rollback()
            raise

    async def create_document(self, db: AsyncSession, user_id: UUID, file_name: str, file_path: str):
        """
        Create a document record in DB asynchronously.
        """

        try:
            from app.models.user_document_model import UserDocument

            document = UserDocument(
                user_id=user_id,
                document_name=file_name,
                file_path=file_path,
            )

            db.add(document)
            await db.flush()  # important

            self.logger.info(f"Document created: {document.doc_id}")

            return document

        except Exception as e:
            self.logger.error(f"Failed to create document: {str(e)}")
            raise

    
    async def check_user_has_doc(self, db: AsyncSession, user_id: str) -> bool:
        """
        Check if user has at least one uploaded document asynchronously
        """

        if not user_id:
            return False

        try:
            from app.models.user_document_model import UserDocument

            result = await db.execute(
                select(UserDocument).filter(
                    UserDocument.user_id == user_id
                )
            )
            doc = result.scalars().first()

            return doc is not None

        except Exception as e:
            self.logger.error(f"Error checking user documents: {str(e)}")
            return False
        

    async def get_doc_processing_status(
        self,
        db: AsyncSession,
        document_id: str
    ):
        """
        Fetch the processing status of a document asynchronously.

        Args:
            db: SQLAlchemy database session.
            document_id: UUID of the document.

        Returns:
            ProcessingStatus: ORM object representing the document's processing status.

        Raises:
            ValueError: If the document or its processing status does not exist.
        """

        try:
            from app.models.user_document_model import UserDocument
            from sqlalchemy.orm import joinedload
            result = await db.execute(
                select(UserDocument)
                .options(joinedload(UserDocument.processing_status))
                .filter(
                    UserDocument.doc_id == document_id
                )
            )
            document = result.scalars().first()

            print(f"document status------->{document}")

            if document is None:
                raise ValueError(
                    f"Document not found: {document_id}"
                )

            if document.processing_status is None:
                raise ValueError(
                    f"Processing status not found for document: {document_id}"
                )

            self.logger.info(
                f"Fetched processing status for document: {document_id}"
            )

            return document.processing_status

        except Exception as e:
            self.logger.error(
                f"Failed to fetch processing status for document {document_id}: {str(e)}"
            )
            raise