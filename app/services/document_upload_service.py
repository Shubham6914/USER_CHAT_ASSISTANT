import uuid
import os
from uuid import UUID
from fastapi import UploadFile
import re
from app.services.logger_service import get_logger
from app.exceptions.document_exceptions import (
    InvalidFileTypeException,
    FileTooLargeException,
    FileSaveException,
    DatabaseException,
)

from app.core.config import settings
from app.services.document_service import DocumentService
from app.workers.tasks import process_document_pipeline

class DocumentUploadService:
    """
    Service responsible for handling document uploads.

    Responsibilities:
    - Validate file
    - Generate filename
    - Save file (via storage provider)
    - Create DB entry
    """

    ALLOWED_TYPES = settings.ALLOWED_TYPES
    MAX_FILE_SIZE = settings.MAX_FILE_SIZE

    def __init__(self, db_session, storage_provider):
        self.db = db_session
        self.storage = storage_provider
        self.logger = get_logger(__name__)
        self.document = DocumentService()

    # 🔹 MAIN METHOD
    def upload_document(self, user_id: UUID, file: UploadFile):
        file_path = None

        try:
            self.logger.info("Starting document upload process")

            # 1. Validate
            self.validate_document(file)

            # 2. Generate filename
            file_name, file_path = self.generate_file_name(user_id, file)
            print(f"Generated file name: {file_name}, file path: {file_path}")

            # 3. Save file
            saved_path = self.save_file(file, file_path)
            print(f"File saved at: {saved_path}")

            # 4. Create DB entry
            document = self.document.create_document(
                self.db,
                user_id=user_id,
                file_name=file_name,
                file_path=saved_path,
            )

            # create processing status of document in processing table 

            self.document.create_processing_status(
                self.db,
                document.doc_id
            )

            # 5. Commit
            self.db.commit()

            self.logger.info("Document uploaded successfully")

            self.logger.info(f"Triggering processing for doc_id={document.doc_id}")
            # trigger async processing
            process_document_pipeline.delay(str(document.doc_id))


            return {
                "doc_id": document.doc_id,
                "file_name": file_name,
                "file_path": saved_path,
                "message": "Upload successful",
            }

        except Exception as e:
            self.logger.error(f"Upload failed: {str(e)}")

            self.db.rollback()

            if file_path:
                self.storage.delete(file_path)

            raise e

    # 🔹 VALIDATION
    def validate_document(self, file: UploadFile):
        self.logger.debug("Validating document")

        if file.content_type not in self.ALLOWED_TYPES:
            raise InvalidFileTypeException()

        file.file.seek(0, os.SEEK_END)
        size = file.file.tell()
        file.file.seek(0)

        if size > self.MAX_FILE_SIZE:
            raise FileTooLargeException()

    # 🔹 FILE NAME GENERATION
    def generate_file_name(self, user_id: UUID, file: UploadFile):
        """
        Generate a safe, unique file name and relative file path.

        - Sanitizes original filename
        - Appends UUID for uniqueness
        - Organizes files per user
        """

        self.logger.debug(f"Generating file name for user_id={user_id}, original_file={file.filename}")

        # 1. Extract name and extension
        original_name = file.filename
        name, ext = os.path.splitext(original_name)

        # 2. Normalize extension
        ext = ext.lower()

        # 3. Sanitize filename (remove unsafe chars)
        safe_name = re.sub(r"[^a-zA-Z0-9_-]", "_", name)

        # 4. Prevent empty filename
        if not safe_name:
            safe_name = "document"

        # 5. Append UUID
        unique_name = f"{safe_name}_{uuid.uuid4()}{ext}"

        # 6. Create relative path (OS-safe)
        file_path = os.path.join("uploads", str(user_id), unique_name)

        self.logger.debug(f"Generated file_path={file_path}")

        return unique_name, file_path

    # 🔹 SAVE FILE
    def save_file(self, file: UploadFile, file_path: str):
        self.logger.debug("Saving file via storage provider")

        try:
            return self.storage.save(file, file_path)
        except Exception as e:
            raise FileSaveException(str(e))

   