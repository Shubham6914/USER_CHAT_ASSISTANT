import os
from fastapi import UploadFile
from app.storage.base_storage import BaseStorage
from app.services.logger_service import get_logger

logger = get_logger(__name__)


class LocalStorage(BaseStorage):
    """
    Local file system storage implementation.

    Used for development and testing.
    """

    def save(self, file: UploadFile, file_path: str) -> str:
        try:
            logger.info(f"Saving file locally at {file_path}")

            os.makedirs(os.path.dirname(file_path), exist_ok=True)

            with open(file_path, "wb") as buffer:
                buffer.write(file.file.read())

            logger.info("File saved successfully")
            return file_path

        except Exception as e:
            logger.error(f"Error saving file: {str(e)}")
            raise

    def delete(self, file_path: str):
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                logger.info(f"Deleted file: {file_path}")
        except Exception as e:
            logger.error(f"Error deleting file: {str(e)}")