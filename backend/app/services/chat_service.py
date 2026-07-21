from datetime import datetime, timezone 
from typing import List, Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

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

    async def create_chat(
        self,
        db: AsyncSession,
        user_id: UUID,
        title: str = "New Chat"
    ) -> UserChat:
        """
        Creates a new chat session for a user asynchronously.

        Args:
            db (AsyncSession): Database session.
            user_id (UUID): Owner user ID.
            title (str): Initial chat title (Default: "New Chat").

        Returns:
            UserChat: Created UserChat ORM model instance.
        """
        try:
            now = datetime.now(timezone.utc).replace(tzinfo=None)
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
            await db.commit()
            await db.refresh(chat)

            self.logger.info(f"Created new chat thread {chat.chat_id} for user {user_id}")
            return chat

        except Exception as e:
            await db.rollback()
            self.logger.error(f"Failed to create chat for user {user_id}: {str(e)}")
            raise

    async def get_chat(
        self,
        db: AsyncSession,
        chat_id: UUID,
        user_id: UUID
    ) -> UserChat:
        """
        Fetches a chat thread by ID and verifies user ownership asynchronously.

        Args:
            db (AsyncSession): Database session.
            chat_id (UUID): ID of the chat to retrieve.
            user_id (UUID): Authenticated user ID.

        Returns:
            UserChat: Matching UserChat model.

        Raises:
            ChatNotFoundException: If chat record does not exist.
            ChatAccessDeniedException: If chat belongs to a different user.
        """
        result = await db.execute(select(UserChat).filter(UserChat.chat_id == chat_id))
        chat = result.scalars().first()

        if not chat:
            self.logger.warning(f"Chat session {chat_id} not found")
            raise ChatNotFoundException(f"Chat session {chat_id} not found.")

        if chat.user_id != user_id:  # type: ignore
            self.logger.warning(f"Access denied: user {user_id} attempted to access chat {chat_id}")
            raise ChatAccessDeniedException(f"User {user_id} does not own chat {chat_id}.")

        return chat

    async def list_user_chats(
        self,
        db: AsyncSession,
        user_id: UUID,
        include_archived: bool = False
    ) -> List[UserChat]:
        """
        Lists all chat sessions owned by a user, ordered by last message timestamp descending asynchronously.

        Args:
            db (AsyncSession): Database session.
            user_id (UUID): Owner user ID.
            include_archived (bool): Whether to include soft-deleted/archived chats.

        Returns:
            List[UserChat]: List of user chat session records sorted for sidebar display.
        """
        try:
            stmt = select(UserChat).filter(UserChat.user_id == user_id)

            if not include_archived:
                stmt = stmt.filter(UserChat.is_archived == False)

            stmt = stmt.order_by(UserChat.last_message_at.desc())
            result = await db.execute(stmt)
            chats = list(result.scalars().all())
            self.logger.debug(f"Retrieved {len(chats)} chats for user {user_id}")
            return chats

        except Exception as e:
            self.logger.error(f"Failed to list chats for user {user_id}: {str(e)}")
            raise

    async def update_chat_title(
        self,
        db: AsyncSession,
        chat_id: UUID,
        user_id: UUID,
        title: str,
        status: TitleStatusEnum = TitleStatusEnum.CUSTOM
    ) -> UserChat:
        """
        Updates the title and title generation status of a chat session asynchronously.

        Args:
            db (AsyncSession): Database session.
            chat_id (UUID): Chat session ID.
            user_id (UUID): Owner user ID.
            title (str): New title text.
            status (TitleStatusEnum): Title status (PENDING, GENERATED, CUSTOM).

        Returns:
            UserChat: Updated UserChat instance.
        """
        chat = await self.get_chat(db, chat_id, user_id)

        try:
            chat.chat_title = title  # type: ignore
            chat.title_status = status  # type: ignore
            chat.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)  # type: ignore

            await db.commit()
            await db.refresh(chat)

            self.logger.info(f"Updated title for chat {chat_id} to '{title}' (status={status})")
            return chat

        except Exception as e:
            await db.rollback()
            self.logger.error(f"Failed to update chat title for {chat_id}: {str(e)}")
            raise

    async def touch_chat(self, db: AsyncSession, chat_id: UUID) -> None:
        """
        Updates the last_message_at and updated_at timestamps for a chat session asynchronously.

        Args:
            db (AsyncSession): Database session.
            chat_id (UUID): Chat session ID to update.
        """
        try:
            result = await db.execute(select(UserChat).filter(UserChat.chat_id == chat_id))
            chat = result.scalars().first()

            if chat:
                now = datetime.now(timezone.utc).replace(tzinfo=None)
                chat.last_message_at = now  # type: ignore
                chat.updated_at = now  # type: ignore
                await db.commit()
                self.logger.debug(f"Touched chat timestamp for {chat_id}")
            else:
                self.logger.warning(f"Attempted to touch non-existent chat {chat_id}")

        except Exception as e:
            await db.rollback()
            self.logger.error(f"Failed to touch chat timestamp for {chat_id}: {str(e)}")
            raise

    async def archive_chat(
        self,
        db: AsyncSession,
        chat_id: UUID,
        user_id: UUID
    ) -> UserChat:
        """
        Archives (soft-deletes) a chat session asynchronously.

        Args:
            db (AsyncSession): Database session.
            chat_id (UUID): Chat session ID.
            user_id (UUID): Owner user ID.

        Returns:
            UserChat: Archived UserChat instance.
        """
        chat = await self.get_chat(db, chat_id, user_id)

        try:
            chat.is_archived = True  # type: ignore
            chat.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)  # type: ignore

            await db.commit()
            await db.refresh(chat)

            self.logger.info(f"Archived chat session {chat_id} for user {user_id}")
            return chat

        except Exception as e:
            await db.rollback()
            self.logger.error(f"Failed to archive chat session {chat_id}: {str(e)}")
            raise

    async def delete_chat(
        self,
        db: AsyncSession,
        chat_id: UUID,
        user_id: UUID
    ) -> bool:
        """
        Permanently deletes a chat session and all associated cascade data asynchronously.

        Args:
            db (AsyncSession): Database session.
            chat_id (UUID): Chat session ID.
            user_id (UUID): Owner user ID.

        Returns:
            bool: True if deletion succeeded.
        """
        chat = await self.get_chat(db, chat_id, user_id)

        try:
            await db.delete(chat)
            await db.commit()

            self.logger.info(f"Permanently deleted chat session {chat_id} for user {user_id}")
            return True

        except Exception as e:
            await db.rollback()
            self.logger.error(f"Failed to delete chat session {chat_id}: {str(e)}")
            raise
