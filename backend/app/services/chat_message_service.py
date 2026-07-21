from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.exceptions.chat_exceptions import (
    ChatMessageNotFoundException,
    ChatNotFoundException,
)
from app.models.chat_message_model import ChatMessage
from app.models.enums import ContentTypeEnum, MessageRoleEnum, MessageStatusEnum
from app.models.user_chat_model import UserChat
from app.services.logger_service import get_logger

logger = get_logger(__name__)


class ChatMessageService:
    """
    Owner of chat_messages log domain. Manages message persistence, sequence ordering, and streaming state lifecycle.

    Responsibilities:
        - Saving user messages with sequence management
        - Creating assistant response placeholder messages (PENDING state)
        - Updating message streaming status (STREAMING, COMPLETED, FAILED)
        - Finalizing assistant messages with full content or failure details
        - Querying chat message history and recent context windows
    """

    def __init__(self):
        self.logger = logger

    def save_user_message(
        self,
        db: Session,
        chat_id: UUID,
        content: str,
        parent_message_id: Optional[UUID] = None,
        content_type: ContentTypeEnum = ContentTypeEnum.TEXT,
        meta_data: Optional[Dict[str, Any]] = None,
    ) -> ChatMessage:
        """
        Saves a new user message in the specified chat session.

        Atomically increments the chat session's next_sequence number to maintain sequence ordering.

        Args:
            db (Session): Database session.
            chat_id (UUID): Target chat session ID.
            content (str): Text content of the user message.
            parent_message_id (Optional[UUID]): Optional parent message ID for branching/editing.
            content_type (ContentTypeEnum): Format of content (Default: TEXT).
            meta_data (Optional[Dict[str, Any]]): Optional JSON metadata.

        Returns:
            ChatMessage: Created ChatMessage ORM model instance.

        Raises:
            ChatNotFoundException: If the target chat session does not exist.
        """
        try:
            chat = db.query(UserChat).filter(UserChat.chat_id == chat_id).with_for_update().first()
            if not chat:
                self.logger.warning(f"Chat session {chat_id} not found when saving user message")
                raise ChatNotFoundException(f"Chat session {chat_id} not found.")

            seq = int(chat.next_sequence)  # pyright: ignore [reportAttributeAccessIssue]
            chat.next_sequence = seq + 1  # pyright: ignore [reportAttributeAccessIssue]
            now = datetime.now(timezone.utc)
            chat.last_message_at = now  # pyright: ignore [reportAttributeAccessIssue]
            chat.updated_at = now  # pyright: ignore [reportAttributeAccessIssue]

            message = ChatMessage(
                chat_id=chat_id,
                sequence_number=seq,
                parent_message_id=parent_message_id,
                role=MessageRoleEnum.USER,
                content=content,
                content_type=content_type,
                status=MessageStatusEnum.COMPLETED,
                meta_data=meta_data,
                created_at=now,
                updated_at=now,
            )

            db.add(message)
            db.commit()
            db.refresh(message)

            self.logger.info(f"Saved user message {message.message_id} (seq={seq}) in chat {chat_id}")
            return message

        except Exception as e:
            db.rollback()
            self.logger.error(f"Failed to save user message in chat {chat_id}: {str(e)}")
            raise

    def create_assistant_placeholder(
        self,
        db: Session,
        chat_id: UUID,
        parent_message_id: Optional[UUID] = None,
        content_type: ContentTypeEnum = ContentTypeEnum.TEXT,
        meta_data: Optional[Dict[str, Any]] = None,
    ) -> ChatMessage:
        """
        Creates an initial assistant message placeholder with PENDING status before token generation/streaming starts.

        Args:
            db (Session): Database session.
            chat_id (UUID): Target chat session ID.
            parent_message_id (Optional[UUID]): Optional parent message ID.
            content_type (ContentTypeEnum): Format of content (Default: TEXT).
            meta_data (Optional[Dict[str, Any]]): Optional initial metadata.

        Returns:
            ChatMessage: Created assistant placeholder ChatMessage.

        Raises:
            ChatNotFoundException: If target chat session does not exist.
        """
        try:
            chat = db.query(UserChat).filter(UserChat.chat_id == chat_id).with_for_update().first()
            if not chat:
                self.logger.warning(f"Chat session {chat_id} not found when creating assistant placeholder")
                raise ChatNotFoundException(f"Chat session {chat_id} not found.")

            seq = int(chat.next_sequence)  # pyright: ignore [reportAttributeAccessIssue]
            chat.next_sequence = seq + 1  # pyright: ignore [reportAttributeAccessIssue]
            now = datetime.now(timezone.utc)
            chat.last_message_at = now  # pyright: ignore [reportAttributeAccessIssue]
            chat.updated_at = now  # pyright: ignore [reportAttributeAccessIssue]

            message = ChatMessage(
                chat_id=chat_id,
                sequence_number=seq,
                parent_message_id=parent_message_id,
                role=MessageRoleEnum.ASSISTANT,
                content="",
                content_type=content_type,
                status=MessageStatusEnum.PENDING,
                meta_data=meta_data,
                created_at=now,
                updated_at=now,
            )

            db.add(message)
            db.commit()
            db.refresh(message)

            self.logger.info(f"Created assistant placeholder message {message.message_id} (seq={seq}) in chat {chat_id}")
            return message

        except Exception as e:
            db.rollback()
            self.logger.error(f"Failed to create assistant placeholder in chat {chat_id}: {str(e)}")
            raise

    def get_message_by_id(
        self,
        db: Session,
        message_id: UUID,
    ) -> ChatMessage:
        """
        Retrieves a single message by ID.

        Args:
            db (Session): Database session.
            message_id (UUID): Message ID.

        Returns:
            ChatMessage: Matching ChatMessage ORM instance.

        Raises:
            ChatMessageNotFoundException: If message record does not exist.
        """
        message = db.query(ChatMessage).filter(ChatMessage.message_id == message_id).first()
        if not message:
            self.logger.warning(f"Message {message_id} not found")
            raise ChatMessageNotFoundException(f"Message {message_id} not found.")

        return message

    def update_message_status(
        self,
        db: Session,
        message_id: UUID,
        status: MessageStatusEnum,
    ) -> ChatMessage:
        """
        Updates the execution lifecycle status of a message.

        Args:
            db (Session): Database session.
            message_id (UUID): Target message ID.
            status (MessageStatusEnum): New status (e.g., STREAMING, COMPLETED, FAILED).

        Returns:
            ChatMessage: Updated ChatMessage instance.

        Raises:
            ChatMessageNotFoundException: If message record does not exist.
        """
        message = self.get_message_by_id(db, message_id)

        try:
            message.status = status  # pyright: ignore [reportAttributeAccessIssue]
            message.updated_at = datetime.now(timezone.utc)  # pyright: ignore [reportAttributeAccessIssue]

            db.commit()
            db.refresh(message)

            self.logger.info(f"Updated status of message {message_id} to {status.value}")
            return message

        except Exception as e:
            db.rollback()
            self.logger.error(f"Failed to update status for message {message_id}: {str(e)}")
            raise

    def complete_assistant_message(
        self,
        db: Session,
        message_id: UUID,
        content: str,
        meta_data: Optional[Dict[str, Any]] = None,
    ) -> ChatMessage:
        """
        Finalizes an assistant response upon completion of token streaming/generation.

        Args:
            db (Session): Database session.
            message_id (UUID): Target message ID.
            content (str): Full text content generated by the assistant.
            meta_data (Optional[Dict[str, Any]]): Execution metadata (token counts, latency, citations).

        Returns:
            ChatMessage: Updated ChatMessage instance with COMPLETED status.

        Raises:
            ChatMessageNotFoundException: If message record does not exist.
        """
        message = self.get_message_by_id(db, message_id)

        try:
            message.content = content  # pyright: ignore [reportAttributeAccessIssue]
            message.status = MessageStatusEnum.COMPLETED  # pyright: ignore [reportAttributeAccessIssue]
            if meta_data is not None:
                raw_meta = getattr(message, "meta_data", None)
                existing_meta: Dict[str, Any] = dict(raw_meta) if isinstance(raw_meta, dict) else {}
                existing_meta.update(meta_data)
                message.meta_data = existing_meta  # pyright: ignore [reportAttributeAccessIssue]

            message.updated_at = datetime.now(timezone.utc)  # pyright: ignore [reportAttributeAccessIssue]

            db.commit()
            db.refresh(message)

            self.logger.info(f"Completed assistant message {message_id}")
            return message

        except Exception as e:
            db.rollback()
            self.logger.error(f"Failed to complete assistant message {message_id}: {str(e)}")
            raise

    def fail_assistant_message(
        self,
        db: Session,
        message_id: UUID,
        partial_content: str = "",
        error_details: Optional[Dict[str, Any]] = None,
    ) -> ChatMessage:
        """
        Marks an assistant response as FAILED, preserving any partial content and recording error details.

        Args:
            db (Session): Database session.
            message_id (UUID): Target message ID.
            partial_content (str): Content received before stream interruption.
            error_details (Optional[Dict[str, Any]]): Error payload for troubleshooting.

        Returns:
            ChatMessage: Updated ChatMessage instance with FAILED status.

        Raises:
            ChatMessageNotFoundException: If message record does not exist.
        """
        message = self.get_message_by_id(db, message_id)

        try:
            message.content = partial_content  # pyright: ignore [reportAttributeAccessIssue]
            message.status = MessageStatusEnum.FAILED  # pyright: ignore [reportAttributeAccessIssue]

            raw_meta = getattr(message, "meta_data", None)
            existing_meta: Dict[str, Any] = dict(raw_meta) if isinstance(raw_meta, dict) else {}
            if error_details:
                existing_meta["error_details"] = error_details
            message.meta_data = existing_meta  # pyright: ignore [reportAttributeAccessIssue]

            message.updated_at = datetime.now(timezone.utc)  # pyright: ignore [reportAttributeAccessIssue]

            db.commit()
            db.refresh(message)

            self.logger.warning(f"Marked assistant message {message_id} as FAILED")
            return message

        except Exception as e:
            db.rollback()
            self.logger.error(f"Failed to record failure for assistant message {message_id}: {str(e)}")
            raise

    def load_chat_messages(
        self,
        db: Session,
        chat_id: UUID,
        limit: int = 50,
        offset: int = 0,
    ) -> List[ChatMessage]:
        """
        Loads paginated messages for a chat thread ordered by sequence number ascending.

        Args:
            db (Session): Database session.
            chat_id (UUID): Chat session ID.
            limit (int): Maximum number of messages to return (Default: 50).
            offset (int): Pagination offset (Default: 0).

        Returns:
            List[ChatMessage]: List of ChatMessage instances in chronological sequence.
        """
        try:
            messages = (
                db.query(ChatMessage)
                .filter(ChatMessage.chat_id == chat_id)
                .order_by(ChatMessage.sequence_number.asc())
                .offset(offset)
                .limit(limit)
                .all()
            )
            self.logger.debug(f"Loaded {len(messages)} messages for chat {chat_id} (offset={offset}, limit={limit})")
            return messages

        except Exception as e:
            self.logger.error(f"Failed to load messages for chat {chat_id}: {str(e)}")
            raise

    def get_recent_messages(
        self,
        db: Session,
        chat_id: UUID,
        limit: int = 10,
    ) -> List[ChatMessage]:
        """
        Retrieves the N most recent messages for a chat, returned in chronological order for AI context building.

        Args:
            db (Session): Database session.
            chat_id (UUID): Chat session ID.
            limit (int): Maximum number of recent messages to return (Default: 10).

        Returns:
            List[ChatMessage]: Recent messages ordered by sequence_number ascending.
        """
        try:
            recent_desc = (
                db.query(ChatMessage)
                .filter(ChatMessage.chat_id == chat_id)
                .order_by(ChatMessage.sequence_number.desc())
                .limit(limit)
                .all()
            )
            messages = sorted(recent_desc, key=lambda m: m.sequence_number)
            self.logger.debug(f"Retrieved {len(messages)} recent messages for chat {chat_id} (limit={limit})")
            return messages

        except Exception as e:
            self.logger.error(f"Failed to retrieve recent messages for chat {chat_id}: {str(e)}")
            raise
