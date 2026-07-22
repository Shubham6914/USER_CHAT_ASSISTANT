import unittest
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

from app.models.enums import MessageRoleEnum, MessageStatusEnum
from app.models.chat_message_model import ChatMessage
from app.services.conversation_context_service import ConversationContextService


class TestConversationContextService(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.mock_message_service = MagicMock()
        self.service = ConversationContextService(message_service=self.mock_message_service)
        self.db = AsyncMock()
        self.chat_id = uuid4()

    async def test_fresh_chat_active_query_excluded(self):
        # On Turn 1, only the active USER message exists in DB with no assistant response yet
        msg1 = ChatMessage(
            message_id=uuid4(),
            chat_id=self.chat_id,
            sequence_number=1,
            role=MessageRoleEnum.USER,
            content="what is this document about?",
            status=MessageStatusEnum.COMPLETED
        )

        self.mock_message_service.get_recent_messages = AsyncMock(return_value=[msg1])

        result = await self.service.build_context(db=self.db, chat_id=self.chat_id, limit=10)

        # Should return empty history (0 messages) because msg1 is the active query
        self.assertEqual(len(result["formatted_messages"]), 0)
        self.assertEqual(result["total_tokens"], 0)

    async def test_build_context_completed_turns(self):
        # Turn 1 pair + active Turn 2 user query
        msg1 = ChatMessage(
            message_id=uuid4(),
            chat_id=self.chat_id,
            sequence_number=1,
            role=MessageRoleEnum.USER,
            content="Hello AI",
            status=MessageStatusEnum.COMPLETED
        )
        msg2 = ChatMessage(
            message_id=uuid4(),
            chat_id=self.chat_id,
            sequence_number=2,
            role=MessageRoleEnum.ASSISTANT,
            content="Hello user, how can I help you today?",
            status=MessageStatusEnum.COMPLETED
        )
        msg3 = ChatMessage(
            message_id=uuid4(),
            chat_id=self.chat_id,
            sequence_number=3,
            role=MessageRoleEnum.USER,
            content="Active Turn 2 query",
            status=MessageStatusEnum.COMPLETED
        )

        self.mock_message_service.get_recent_messages = AsyncMock(return_value=[msg1, msg2, msg3])

        result = await self.service.build_context(db=self.db, chat_id=self.chat_id, limit=10)

        # Should include msg1 and msg2, but exclude msg3 (the active query)
        self.assertEqual(len(result["formatted_messages"]), 2)
        self.assertEqual(result["formatted_messages"][0], {"role": "user", "content": "Hello AI"})
        self.assertEqual(result["formatted_messages"][1], {"role": "assistant", "content": "Hello user, how can I help you today?"})
        self.assertGreater(result["total_tokens"], 0)

    async def test_trim_history_limit(self):
        msg1 = {"role": "user", "content": "A" * 100}  # ~25 tokens
        msg2 = {"role": "assistant", "content": "B" * 100}  # ~25 tokens
        messages = [msg1, msg2]

        trimmed, total_tokens = self.service._trim_history(messages, max_tokens=30)
        self.assertEqual(len(trimmed), 1)
        self.assertEqual(trimmed[0], msg2)


if __name__ == "__main__":
    unittest.main()
