from app.services.logger_service import get_logger

logger = get_logger(__name__)


class ChatException(Exception):
    """Base exception for chat domain errors"""
    pass


class ChatNotFoundException(ChatException):
    def __init__(self, message="Chat session not found"):
        logger.warning(message)
        super().__init__(message)


class ChatAccessDeniedException(ChatException):
    def __init__(self, message="Access denied for this chat session"):
        logger.warning(message)
        super().__init__(message)


class ChatMessageNotFoundException(ChatException):
    def __init__(self, message="Chat message not found"):
        logger.warning(message)
        super().__init__(message)
