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
    DOCUMENT_SAVED = "document_saved"
    CHUNKING = "chunking"
    EMBEDDING = "embedding"
    VECTOR_STORE = "vector_store"
    COMPLETED = "completed"