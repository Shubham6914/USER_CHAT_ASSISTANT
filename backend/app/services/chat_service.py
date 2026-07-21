from datetime import datetime, timezone 
from typing import List, Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.exceptions.chat_exceptions import (
    ChatAccessDeniedException,
    ChatNotFoundException,
)
from app.models.enums import TitleStatusEnum
from app.models.user_chat_model import UserChat
from app.services.logger_service import get_logger

logger = get_logger(__name__)


class ChatService:
    """
    Service responsible for managing chat thread lifecycles and metadata within the user_chats domain.
    
    Responsibilities:
        - Creating new chat sessions (Lazy creation support)
        - Fetching and validating chat ownership per tenant/user
        - Listing user chats sorted by last message activity (sidebar queries)
        - Updating chat titles and title generation lifecycle states
        - Updating timestamps on message activity (touching)
        - Archiving (soft-deletion) and permanently deleting chat sessions
    """

    def __init__(self):
        self.logger = logger

    def create_chat(
        self,
        db: Session,
        user_id: UUID,
        title: str = "New Chat"
    ) -> UserChat:
        """
        Creates a new chat session for a user.

        Args:
            db (Session): Database session.
            user_id (UUID): Owner user ID.
            title (str): Initial chat title (Default: "New Chat").

        Returns:
            UserChat: Created UserChat ORM model instance.
        """
        try:
            now = datetime.now(timezone.utc)
            chat = UserChat(
                user_id=user_id,
                chat_title=title,
                title_status=TitleStatusEnum.PENDING,
                next_sequence=1,
                last_message_at=now,
                is_archived=False,
                created_at=now,
                updated_at=now,
            )

            db.add(chat)
            db.commit()
            db.refresh(chat)

            self.logger.info(f"Created new chat thread {chat.chat_id} for user {user_id}")
            return chat

        except Exception as e:
            db.rollback()
            self.logger.error(f"Failed to create chat for user {user_id}: {str(e)}")
            raise

    def get_chat(
        self,
        db: Session,
        chat_id: UUID,
        user_id: UUID
    ) -> UserChat:
        """
        Fetches a chat thread by ID and verifies user ownership.

        Args:
            db (Session): Database session.
            chat_id (UUID): ID of the chat to retrieve.
            user_id (UUID): Authenticated user ID.

        Returns:
            UserChat: Matching UserChat model.

        Raises:
            ChatNotFoundException: If chat record does not exist.
            ChatAccessDeniedException: If chat belongs to a different user.
        """
        chat = db.query(UserChat).filter(UserChat.chat_id == chat_id).first()

        if not chat:
            self.logger.warning(f"Chat session {chat_id} not found")
            raise ChatNotFoundException(f"Chat session {chat_id} not found.")

        if chat.user_id != user_id:  # type: ignore
            self.logger.warning(f"Access denied: user {user_id} attempted to access chat {chat_id}")
            raise ChatAccessDeniedException(f"User {user_id} does not own chat {chat_id}.")

        return chat

    def list_user_chats(
        self,
        db: Session,
        user_id: UUID,
        include_archived: bool = False
    ) -> List[UserChat]:
        """
        Lists all chat sessions owned by a user, ordered by last message timestamp descending.

        Args:
            db (Session): Database session.
            user_id (UUID): Owner user ID.
            include_archived (bool): Whether to include soft-deleted/archived chats.

        Returns:
            List[UserChat]: List of user chat session records sorted for sidebar display.
        """
        try:
            query = db.query(UserChat).filter(UserChat.user_id == user_id)

            if not include_archived:
                query = query.filter(UserChat.is_archived == False)

            chats = query.order_by(UserChat.last_message_at.desc()).all()
            self.logger.debug(f"Retrieved {len(chats)} chats for user {user_id}")
            return chats

        except Exception as e:
            self.logger.error(f"Failed to list chats for user {user_id}: {str(e)}")
            raise

    def update_chat_title(
        self,
        db: Session,
        chat_id: UUID,
        user_id: UUID,
        title: str,
        status: TitleStatusEnum = TitleStatusEnum.CUSTOM
    ) -> UserChat:
        """
        Updates the title and title generation status of a chat session.

        Args:
            db (Session): Database session.
            chat_id (UUID): Chat session ID.
            user_id (UUID): Owner user ID.
            title (str): New title text.
            status (TitleStatusEnum): Title status (PENDING, GENERATED, CUSTOM).

        Returns:
            UserChat: Updated UserChat instance.
        """
        chat = self.get_chat(db, chat_id, user_id)

        try:
            chat.chat_title = title  # type: ignore
            chat.title_status = status  # type: ignore
            chat.updated_at = datetime.now(timezone.utc)  # type: ignore

            db.commit()
            db.refresh(chat)

            self.logger.info(f"Updated title for chat {chat_id} to '{title}' (status={status})")
            return chat

        except Exception as e:
            db.rollback()
            self.logger.error(f"Failed to update chat title for {chat_id}: {str(e)}")
            raise

    def touch_chat(self, db: Session, chat_id: UUID) -> None:
        """
        Updates the last_message_at and updated_at timestamps for a chat session.

        Args:
            db (Session): Database session.
            chat_id (UUID): Chat session ID to update.
        """
        try:
            chat = db.query(UserChat).filter(UserChat.chat_id == chat_id).first()

            if chat:
                now = datetime.now(timezone.utc)
                chat.last_message_at = now  # type: ignore
                chat.updated_at = now  # type: ignore
                db.commit()
                self.logger.debug(f"Touched chat timestamp for {chat_id}")
            else:
                self.logger.warning(f"Attempted to touch non-existent chat {chat_id}")

        except Exception as e:
            db.rollback()
            self.logger.error(f"Failed to touch chat timestamp for {chat_id}: {str(e)}")
            raise

    def archive_chat(
        self,
        db: Session,
        chat_id: UUID,
        user_id: UUID
    ) -> UserChat:
        """
        Archives (soft-deletes) a chat session so it no longer appears in default sidebar queries.

        Args:
            db (Session): Database session.
            chat_id (UUID): Chat session ID.
            user_id (UUID): Owner user ID.

        Returns:
            UserChat: Archived UserChat instance.
        """
        chat = self.get_chat(db, chat_id, user_id)

        try:
            chat.is_archived = True  # type: ignore
            chat.updated_at = datetime.now(timezone.utc)  # type: ignore

            db.commit()
            db.refresh(chat)

            self.logger.info(f"Archived chat session {chat_id} for user {user_id}")
            return chat

        except Exception as e:
            db.rollback()
            self.logger.error(f"Failed to archive chat session {chat_id}: {str(e)}")
            raise

    def delete_chat(
        self,
        db: Session,
        chat_id: UUID,
        user_id: UUID
    ) -> bool:
        """
        Permanently deletes a chat session and all associated cascade data.

        Args:
            db (Session): Database session.
            chat_id (UUID): Chat session ID.
            user_id (UUID): Owner user ID.

        Returns:
            bool: True if deletion succeeded.
        """
        chat = self.get_chat(db, chat_id, user_id)

        try:
            db.delete(chat)
            db.commit()

            self.logger.info(f"Permanently deleted chat session {chat_id} for user {user_id}")
            return True

        except Exception as e:
            db.rollback()
            self.logger.error(f"Failed to delete chat session {chat_id}: {str(e)}")
            raise
