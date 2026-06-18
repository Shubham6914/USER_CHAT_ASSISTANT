from enum import Enum


class ProcessingStatusEnum(str, Enum):
    """
    Enum for document processing states.
    """

    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"