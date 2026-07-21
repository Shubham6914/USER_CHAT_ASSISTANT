from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel

from app.models.enums import ContentTypeEnum, MessageRoleEnum, MessageStatusEnum, TitleStatusEnum


# --- Request Schemas ---

class CreateChatRequest(BaseModel):
    title: Optional[str] = "New Chat"


class UpdateChatTitleRequest(BaseModel):
    title: str
    title_status: Optional[TitleStatusEnum] = TitleStatusEnum.CUSTOM


class GenerateTitleRequest(BaseModel):
    user_query: str
    assistant_response: Optional[str] = None


class SaveUserMessageRequest(BaseModel):
    content: str
    parent_message_id: Optional[UUID] = None
    content_type: Optional[ContentTypeEnum] = ContentTypeEnum.TEXT
    meta_data: Optional[Dict[str, Any]] = None


class CreateAssistantPlaceholderRequest(BaseModel):
    parent_message_id: Optional[UUID] = None
    content_type: Optional[ContentTypeEnum] = ContentTypeEnum.TEXT
    meta_data: Optional[Dict[str, Any]] = None


class CompleteAssistantMessageRequest(BaseModel):
    content: str
    meta_data: Optional[Dict[str, Any]] = None


class FailAssistantMessageRequest(BaseModel):
    partial_content: Optional[str] = ""
    error_details: Optional[Dict[str, Any]] = None


# --- Response Schemas ---

class ChatResponse(BaseModel):
    chat_id: UUID
    user_id: UUID
    chat_title: str
    title_status: TitleStatusEnum
    next_sequence: int
    last_message_at: datetime
    is_archived: bool
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }


class ChatMessageResponse(BaseModel):
    message_id: UUID
    chat_id: UUID
    sequence_number: int
    parent_message_id: Optional[UUID] = None
    role: MessageRoleEnum
    content: str
    content_type: ContentTypeEnum
    status: MessageStatusEnum
    meta_data: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }


class ChatListResponse(BaseModel):
    chats: List[ChatResponse]
    total: int


class MessageListResponse(BaseModel):
    messages: List[ChatMessageResponse]
    total: int
