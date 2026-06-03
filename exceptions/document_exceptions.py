import logging
from services.logger_service import get_logger

logger = get_logger(__name__)


class DocumentUploadException(Exception):
    """Base exception for document upload errors"""
    pass


class InvalidFileTypeException(DocumentUploadException):
    def __init__(self, message="Invalid file type"):
        logger.warning(message)
        super().__init__(message)


class FileTooLargeException(DocumentUploadException):
    def __init__(self, message="File size exceeds limit"):
        logger.warning(message)
        super().__init__(message)


class FileSaveException(DocumentUploadException):
    def __init__(self, message="Error saving file"):
        logger.error(message)
        super().__init__(message)


class DatabaseException(DocumentUploadException):
    def __init__(self, message="Database error"):
        logger.error(message)
        super().__init__(message)