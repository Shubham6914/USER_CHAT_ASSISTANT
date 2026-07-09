from app.services.logger_service import get_logger
from app.models.processing_status_model import ProcessingStatus
from app.models.enums import ProcessingStatusEnum,ProcessingStepEnum

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
                status=ProcessingStatusEnum.PENDING,
                current_step=ProcessingStepEnum.DOCUMENT_SAVED,
                progress=0
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
        status=None,
        current_step=None,
        progress=None,
        error_message=None
        ):
        """ss
        Update processing state for a document.
        """

        try:
            record = db.query(ProcessingStatus).filter(
                ProcessingStatus.document_id == document_id
            ).first()

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


            db.flush()

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

    
    def check_user_has_doc(self, db, user_id: str) -> bool:
        """
        Check if user has at least one uploaded document
        """

        if not user_id:
            return False

        try:
            from app.models.user_document_model import UserDocument

            doc = db.query(UserDocument).filter(
                UserDocument.user_id == user_id
            ).first()

            return doc is not None

        except Exception as e:
            self.logger.error(f"Error checking user documents: {str(e)}")
            return False