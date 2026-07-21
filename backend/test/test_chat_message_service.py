import unittest
from unittest.mock import MagicMock
from uuid import uuid4
from datetime import datetime

from app.exceptions.chat_exceptions import (
    ChatMessageNotFoundException,
    ChatNotFoundException,
)
from app.models.chat_message_model import ChatMessage
from app.models.enums import ContentTypeEnum, MessageRoleEnum, MessageStatusEnum
from app.models.user_chat_model import UserChat
from app.services.chat_message_service import ChatMessageService


class TestChatMessageService(unittest.TestCase):
    def setUp(self):
        self.service = ChatMessageService()
        self.db = MagicMock()
        self.chat_id = uuid4()
        self.user_id = uuid4()
        self.now = datetime.utcnow()

        self.mock_chat = UserChat(
            chat_id=self.chat_id,
            user_id=self.user_id,
            chat_title="Test Chat",
            next_sequence=1,
            last_message_at=self.now,
            created_at=self.now,
            updated_at=self.now,
        )

    def test_save_user_message_success(self):
        # Mock DB query filter for UserChat
        query_mock = MagicMock()
        query_mock.filter.return_value.with_for_update.return_value.first.return_value = self.mock_chat
        self.db.query.return_value = query_mock

        msg = self.service.save_user_message(
            db=self.db,
            chat_id=self.chat_id,
            content="Hello AI",
            meta_data={"source": "test"},
        )

        self.assertEqual(msg.chat_id, self.chat_id)
        self.assertEqual(msg.role, MessageRoleEnum.USER)
        self.assertEqual(msg.content, "Hello AI")
        self.assertEqual(msg.status, MessageStatusEnum.COMPLETED)
        self.assertEqual(msg.sequence_number, 1)
        self.assertEqual(self.mock_chat.next_sequence, 2)
        self.db.add.assert_called_once()
        self.db.commit.assert_called_once()

    def test_save_user_message_chat_not_found(self):
        query_mock = MagicMock()
        query_mock.filter.return_value.with_for_update.return_value.first.return_value = None
        self.db.query.return_value = query_mock

        with self.assertRaises(ChatNotFoundException):
            self.service.save_user_message(
                db=self.db,
                chat_id=self.chat_id,
                content="Hello AI",
            )
        self.db.rollback.assert_called_once()

    def test_create_assistant_placeholder(self):
        query_mock = MagicMock()
        query_mock.filter.return_value.with_for_update.return_value.first.return_value = self.mock_chat
        self.db.query.return_value = query_mock

        msg = self.service.create_assistant_placeholder(
            db=self.db,
            chat_id=self.chat_id,
        )

        self.assertEqual(msg.chat_id, self.chat_id)
        self.assertEqual(msg.role, MessageRoleEnum.ASSISTANT)
        self.assertEqual(msg.content, "")
        self.assertEqual(msg.status, MessageStatusEnum.PENDING)
        self.assertEqual(msg.sequence_number, 1)
        self.assertEqual(self.mock_chat.next_sequence, 2)
        self.db.add.assert_called_once()
        self.db.commit.assert_called_once()

    def test_update_message_status(self):
        msg_id = uuid4()
        mock_msg = ChatMessage(
            message_id=msg_id,
            chat_id=self.chat_id,
            sequence_number=1,
            role=MessageRoleEnum.ASSISTANT,
            content="",
            status=MessageStatusEnum.PENDING,
        )
        query_mock = MagicMock()
        query_mock.filter.return_value.first.return_value = mock_msg
        self.db.query.return_value = query_mock

        res = self.service.update_message_status(
            db=self.db,
            message_id=msg_id,
            status=MessageStatusEnum.STREAMING,
        )

        self.assertEqual(res.status, MessageStatusEnum.STREAMING)
        self.db.commit.assert_called_once()

    def test_complete_assistant_message(self):
        msg_id = uuid4()
        mock_msg = ChatMessage(
            message_id=msg_id,
            chat_id=self.chat_id,
            sequence_number=2,
            role=MessageRoleEnum.ASSISTANT,
            content="",
            status=MessageStatusEnum.STREAMING,
            meta_data={"model": "nexus-v1"},
        )
        query_mock = MagicMock()
        query_mock.filter.return_value.first.return_value = mock_msg
        self.db.query.return_value = query_mock

        res = self.service.complete_assistant_message(
            db=self.db,
            message_id=msg_id,
            content="Full AI response content",
            meta_data={"tokens": 150},
        )

        self.assertEqual(res.status, MessageStatusEnum.COMPLETED)
        self.assertEqual(res.content, "Full AI response content")
        self.assertEqual(res.meta_data, {"model": "nexus-v1", "tokens": 150})
        self.db.commit.assert_called_once()

    def test_fail_assistant_message(self):
        msg_id = uuid4()
        mock_msg = ChatMessage(
            message_id=msg_id,
            chat_id=self.chat_id,
            sequence_number=2,
            role=MessageRoleEnum.ASSISTANT,
            content="Partial...",
            status=MessageStatusEnum.STREAMING,
            meta_data={},
        )
        query_mock = MagicMock()
        query_mock.filter.return_value.first.return_value = mock_msg
        self.db.query.return_value = query_mock

        res = self.service.fail_assistant_message(
            db=self.db,
            message_id=msg_id,
            partial_content="Partial output before crash",
            error_details={"code": "TIMEOUT", "message": "Stream timed out"},
        )

        self.assertEqual(res.status, MessageStatusEnum.FAILED)
        self.assertEqual(res.content, "Partial output before crash")
        self.assertEqual(res.meta_data["error_details"]["code"], "TIMEOUT")
        self.db.commit.assert_called_once()

    def test_load_chat_messages(self):
        msg1 = ChatMessage(message_id=uuid4(), sequence_number=1, content="Hello")
        msg2 = ChatMessage(message_id=uuid4(), sequence_number=2, content="Hi")

        query_mock = MagicMock()
        (
            query_mock.filter.return_value
            .order_by.return_value
            .offset.return_value
            .limit.return_value
            .all.return_value
        ) = [msg1, msg2]
        self.db.query.return_value = query_mock

        messages = self.service.load_chat_messages(db=self.db, chat_id=self.chat_id, limit=10, offset=0)
        self.assertEqual(len(messages), 2)
        self.assertEqual(messages[0].content, "Hello")

    def test_get_recent_messages_order(self):
        msg1 = ChatMessage(message_id=uuid4(), sequence_number=1, content="First")
        msg2 = ChatMessage(message_id=uuid4(), sequence_number=2, content="Second")
        msg3 = ChatMessage(message_id=uuid4(), sequence_number=3, content="Third")

        query_mock = MagicMock()
        # Mock database returning recent messages in descending sequence order
        (
            query_mock.filter.return_value
            .order_by.return_value
            .limit.return_value
            .all.return_value
        ) = [msg3, msg2, msg1]
        self.db.query.return_value = query_mock

        recent = self.service.get_recent_messages(db=self.db, chat_id=self.chat_id, limit=3)
        # Should be sorted chronologically (sequence 1, 2, 3)
        self.assertEqual([m.sequence_number for m in recent], [1, 2, 3])


if __name__ == "__main__":
    unittest.main()
