from app.services.logger_service import get_logger
from app.models.processing_status_model import ProcessingStatus
from app.models.enums import ProcessingStatusEnum

from app.exceptions.document_exceptions import (
    InvalidFileTypeException,
    FileTooLargeException,
    FileSaveException,
    DatabaseException,
)
from uuid import UUID
import uuid

class DocumentService:
    """
    Service for handling document-related DB operations,
    including processing status management.
    """

    def __init__(self):
        self.logger = get_logger("document_service")

    def create_processing_status(self, db, document_id):
        """
        Create initial processing status for a document.
        """

        try:
            status = ProcessingStatus(
                document_id=document_id,
                status=ProcessingStatusEnum.PENDING
            )

            db.add(status)
            db.commit()
            db.refresh(status)

            self.logger.info(
                f"Processing status created for document {document_id}"
            )

            return status

        except Exception as e:
            self.logger.error(
                f"Failed to create processing status: {str(e)}"
            )
            db.rollback()
            raise

    def update_processing_status(
        self,
        db,
        document_id,
        status,
        error_message: str = None
    ):
        """
        Update processing status for a document.
        """

        try:
            record = db.query(ProcessingStatus).filter(
                ProcessingStatus.document_id == document_id
            ).first()

            if not record:
                raise ValueError(
                    f"Processing status not found for document {document_id}"
                )

            record.status = status

            if status == ProcessingStatusEnum.FAILED:
                record.error_message = error_message
            else:
                record.error_message = None

            db.commit()
            db.refresh(record)

            self.logger.info(
                f"Updated processing status for document {document_id} → {status}"
            )

            return record

        except Exception as e:
            self.logger.error(
                f"Failed to update processing status: {str(e)}"
            )
            db.rollback()
            raise

    def create_document(self, db, user_id: UUID, file_name: str, file_path: str):
        """
        Create a document record in DB.
        """

        try:
            from app.models.user_document_model import UserDocument

            document = UserDocument(
                user_id=user_id,
                document_name=file_name,
                file_path=file_path,
            )

            db.add(document)
            db.flush()  # important

            self.logger.info(f"Document created: {document.doc_id}")

            return document

        except Exception as e:
            self.logger.error(f"Failed to create document: {str(e)}")
            raise