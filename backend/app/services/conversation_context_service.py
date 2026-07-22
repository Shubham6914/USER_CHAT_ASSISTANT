from typing import List, Dict, Any, Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import MessageStatusEnum, MessageRoleEnum
from app.services.chat_message_service import ChatMessageService
from app.services.logger_service import get_logger

logger = get_logger(__name__)


class ConversationContextService:
    """
    Read-only AI Context Builder for preparing token budget and history context for LangGraph.
    """

    def __init__(self, message_service: Optional[ChatMessageService] = None):
        self.logger = logger
        self.message_service = message_service or ChatMessageService()

    async def build_context(
        self,
        db: AsyncSession,
        chat_id: str | UUID,
        limit: int = 10,
        max_tokens: int = 4000
    ) -> Dict[str, Any]:
        """
        Retrieves recent chat history from DB, filters completed messages,
        formats them into role/content list, and trims to max token budget.

        Returns:
            Dict[str, Any] containing:
            - formatted_messages: List[Dict[str, str]] (e.g. [{"role": "user", "content": "..."}, ...])
            - raw_messages: List[ChatMessage]
            - total_tokens: int
        """
        try:
            if isinstance(chat_id, str):
                chat_id = UUID(chat_id)

            raw_messages = await self.message_service.get_recent_messages(
                db=db,
                chat_id=chat_id,
                limit=limit
            )

            # Filter for completed user and assistant messages
            completed = [
                m for m in raw_messages
                if m.status == MessageStatusEnum.COMPLETED
                and m.role in [MessageRoleEnum.USER, MessageRoleEnum.ASSISTANT]
            ]

            # Fast exit: if active user query is the latest message without an assistant response, exclude it
            if completed and completed[-1].role == MessageRoleEnum.USER:
                completed = completed[:-1]

            if not completed:
                self.logger.info(f"[ContextService] Fresh chat/No prior completed history for chat {chat_id} -> empty context")
                return {
                    "formatted_messages": [],
                    "raw_messages": [],
                    "total_tokens": 0
                }

            formatted = [
                {
                    "role": m.role.value.lower() if hasattr(m.role, "value") else str(m.role).lower(),
                    "content": m.content
                }
                for m in completed
            ]

            trimmed, total_tokens = self._trim_history(formatted, max_tokens)

            self.logger.info(
                f"[ContextService] Built context for chat {chat_id}: "
                f"{len(trimmed)} messages, ~{total_tokens} estimated tokens"
            )

            return {
                "formatted_messages": trimmed,
                "raw_messages": completed,
                "total_tokens": total_tokens
            }

        except Exception as e:
            self.logger.error(f"[ContextService] Failed to build context for chat {chat_id}: {str(e)}")
            return {
                "formatted_messages": [],
                "raw_messages": [],
                "total_tokens": 0
            }

    def _estimate_tokens(self, text: str) -> int:
        """
        Fast token estimation heuristic (~4 chars per token).
        """
        if not text:
            return 0
        return max(1, len(text) // 4)

    def _trim_history(
        self,
        messages: List[Dict[str, str]],
        max_tokens: int
    ) -> tuple[List[Dict[str, str]], int]:
        """
        Trims older messages from history if total tokens exceed max_tokens limit.
        Always keeps recent messages at the end.
        """
        trimmed = []
        accumulated_tokens = 0

        # Process messages from newest to oldest
        for msg in reversed(messages):
            msg_tokens = self._estimate_tokens(msg.get("content", ""))
            if accumulated_tokens + msg_tokens > max_tokens and trimmed:
                break
            trimmed.append(msg)
            accumulated_tokens += msg_tokens

        # Restore chronological order
        trimmed.reverse()
        return trimmed, accumulated_tokens
