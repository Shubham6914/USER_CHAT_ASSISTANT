from enum import Enum


class ProcessingStatusEnum(str, Enum):
    """
    Enum for document processing states.
    """

    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class ProcessingStepEnum(str, Enum):
    """
    Enum representing the processing satge of document ingestion.
    """
    DOCUMENT_SAVED = "document_saved"
    CHUNKING = "chunking"
    EMBEDDING = "embedding"
    VECTOR_STORE = "vector_store"
    COMPLETED = "completed"


class TitleStatusEnum(str, Enum):
    """
    Enum representing the status of chat title generation.
    """
    PENDING = "PENDING"
    GENERATED = "GENERATED"
    CUSTOM = "CUSTOM"


class MessageRoleEnum(str, Enum):
    """
    Enum representing the role of a message sender.
    """
    USER = "USER"
    ASSISTANT = "ASSISTANT"
    SYSTEM = "SYSTEM"
    TOOL = "TOOL"


class ContentTypeEnum(str, Enum):
    """
    Enum representing the format of message content.
    """
    TEXT = "TEXT"
    MARKDOWN = "MARKDOWN"
    JSON = "JSON"


class MessageStatusEnum(str, Enum):
    """
    Enum representing the lifecycle state of a message.
    """
    PENDING = "PENDING"
    STREAMING = "STREAMING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"