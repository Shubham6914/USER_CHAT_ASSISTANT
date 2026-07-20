import logging
from abc import ABC, abstractmethod
from fastapi import UploadFile
from app.services.logger_service import get_logger

logger = get_logger(__name__)


class BaseStorage(ABC):
    """
    Abstract base class for storage providers.

    This ensures all storage implementations (Local, S3, etc.)
    follow a consistent interface.
    """

    @abstractmethod
    def save(self, file: UploadFile, file_path: str) -> str:
        """
        Save file to storage.

        Args:
            file (UploadFile): Incoming file
            file_path (str): Destination path

        Returns:
            str: Stored file path or URL
        """
        logger.debug("BaseStorage.save() called")
        pass

    @abstractmethod
    def delete(self, file_path: str):
        """
        Delete file from storage.

        Args:
            file_path (str): Path of file to delete
        """
        logger.debug("BaseStorage.delete() called")
        pass