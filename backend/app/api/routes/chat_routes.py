from uuid import UUID
from typing import Dict, Any, List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, get_current_user
from app.models.user_model import User
from app.models.enums import TitleStatusEnum, ContentTypeEnum
from app.exceptions.chat_exceptions import (
    ChatNotFoundException,
    ChatAccessDeniedException,
    ChatMessageNotFoundException
)
from app.schemas.chat_schema import (
    CreateChatRequest,
    UpdateChatTitleRequest,
    GenerateTitleRequest,
    SaveUserMessageRequest,
    CreateAssistantPlaceholderRequest,
    CompleteAssistantMessageRequest,
    FailAssistantMessageRequest,
    ChatResponse,
    ChatMessageResponse,
    ChatListResponse,
    MessageListResponse
)
from app.services.chat_service import ChatService
from app.services.chat_message_service import ChatMessageService
from app.services.chat_title_service import ChatTitleService
from app.services.logger_service import get_logger

logger = get_logger(__name__)

router = APIRouter(
    prefix="/api/v1/chats",
    tags=["Chats"]
)

# Instantiate services at router module level
chat_service = ChatService()
chat_message_service = ChatMessageService()
chat_title_service = ChatTitleService()


# -------------------- Chat Session Routes --------------------

@router.post("/", response_model=ChatResponse, status_code=status.HTTP_201_CREATED)
def create_chat(
    request: CreateChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Creates a new chat session for the authenticated user.
    """
    try:
        chat = chat_service.create_chat(db, current_user.user_id, request.title or "New Chat")
        return chat
    except Exception as e:
        logger.error(f"Error creating chat: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create chat: {str(e)}"
        )


@router.get("/", response_model=ChatListResponse)
def list_chats(
    include_archived: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Lists all chat sessions owned by the authenticated user.
    """
    try:
        chats = chat_service.list_user_chats(db, current_user.user_id, include_archived=include_archived)
        return ChatListResponse(chats=chats, total=len(chats))
    except Exception as e:
        logger.error(f"Error listing chats: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list chats: {str(e)}"
        )


@router.get("/{chat_id}", response_model=ChatResponse)
def get_chat(
    chat_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Retrieves details of a specific chat session if owned by the current user.
    """
    try:
        chat = chat_service.get_chat(db, chat_id, current_user.user_id)
        return chat
    except ChatNotFoundException as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except ChatAccessDeniedException as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Unexpected error retrieving chat {chat_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.patch("/{chat_id}/title", response_model=ChatResponse)
def update_chat_title(
    chat_id: UUID,
    request: UpdateChatTitleRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Updates the title of a chat thread manually.
    """
    try:
        status_enum = request.title_status or TitleStatusEnum.CUSTOM
        chat = chat_service.update_chat_title(db, chat_id, current_user.user_id, request.title, status_enum)
        return chat
    except ChatNotFoundException as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except ChatAccessDeniedException as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error updating title for chat {chat_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.patch("/{chat_id}/archive", response_model=ChatResponse)
def archive_chat(
    chat_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Archives a chat session (soft delete).
    """
    try:
        chat = chat_service.archive_chat(db, chat_id, current_user.user_id)
        return chat
    except ChatNotFoundException as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except ChatAccessDeniedException as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error archiving chat {chat_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete("/{chat_id}", status_code=status.HTTP_200_OK)
def delete_chat(
    chat_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Permanently deletes a chat session and cascade deletes associated data.
    """
    try:
        chat_service.delete_chat(db, chat_id, current_user.user_id)
        return {"message": "Chat session permanently deleted", "chat_id": chat_id}
    except ChatNotFoundException as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except ChatAccessDeniedException as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error deleting chat {chat_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# -------------------- Chat Title Generation Routes --------------------

@router.post("/{chat_id}/generate-title", response_model=ChatResponse)
async def generate_chat_title(
    chat_id: UUID,
    request: GenerateTitleRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Generates a 3-6 word summary title using ChatTitleService (LLM-based) and updates the chat title.
    """
    # Verify chat ownership and existence first
    try:
        chat_service.get_chat(db, chat_id, current_user.user_id)
    except ChatNotFoundException as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except ChatAccessDeniedException as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )

    try:
        generated_title = await chat_title_service.generate_title(
            user_query=request.user_query,
            assistant_response=request.assistant_response or ""
        )
        updated_chat = chat_service.update_chat_title(
            db, chat_id, current_user.user_id, generated_title, TitleStatusEnum.GENERATED
        )
        return updated_chat
    except Exception as e:
        logger.error(f"Error generating title for chat {chat_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate title: {str(e)}"
        )


# -------------------- Chat Message Routes --------------------

@router.post("/{chat_id}/messages", response_model=ChatMessageResponse, status_code=status.HTTP_201_CREATED)
def save_user_message(
    chat_id: UUID,
    request: SaveUserMessageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Saves a user message to the specified chat session.
    """
    # Verify ownership
    try:
        chat_service.get_chat(db, chat_id, current_user.user_id)
    except ChatNotFoundException as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except ChatAccessDeniedException as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )

    try:
        message = chat_message_service.save_user_message(
            db=db,
            chat_id=chat_id,
            content=request.content,
            parent_message_id=request.parent_message_id,
            content_type=request.content_type or ContentTypeEnum.TEXT,
            meta_data=request.meta_data
        )
        return message
    except Exception as e:
        logger.error(f"Error saving message in chat {chat_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/{chat_id}/messages", response_model=MessageListResponse)
def load_chat_messages(
    chat_id: UUID,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Loads messages for a chat thread ordered by sequence number ascending.
    """
    # Verify ownership
    try:
        chat_service.get_chat(db, chat_id, current_user.user_id)
    except ChatNotFoundException as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except ChatAccessDeniedException as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )

    try:
        messages = chat_message_service.load_chat_messages(db, chat_id, limit, offset)
        return MessageListResponse(messages=messages, total=len(messages))
    except Exception as e:
        logger.error(f"Error loading messages for chat {chat_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/{chat_id}/messages/recent", response_model=MessageListResponse)
def get_recent_messages(
    chat_id: UUID,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Retrieves the N most recent messages for a chat in chronological order.
    """
    # Verify ownership
    try:
        chat_service.get_chat(db, chat_id, current_user.user_id)
    except ChatNotFoundException as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except ChatAccessDeniedException as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )

    try:
        messages = chat_message_service.get_recent_messages(db, chat_id, limit)
        return MessageListResponse(messages=messages, total=len(messages))
    except Exception as e:
        logger.error(f"Error getting recent messages for chat {chat_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/messages/{message_id}", response_model=ChatMessageResponse)
def get_message_by_id(
    message_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Retrieves a single message by ID and verifies the caller owns the chat it belongs to.
    """
    try:
        message = chat_message_service.get_message_by_id(db, message_id)
        # Verify ownership of the parent chat
        chat_service.get_chat(db, message.chat_id, current_user.user_id)
        return message
    except ChatMessageNotFoundException as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except ChatNotFoundException as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except ChatAccessDeniedException as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error fetching message {message_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/{chat_id}/messages/assistant-placeholder", response_model=ChatMessageResponse, status_code=status.HTTP_201_CREATED)
def create_assistant_placeholder(
    chat_id: UUID,
    request: CreateAssistantPlaceholderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Creates an initial assistant message placeholder in PENDING state before streaming.
    """
    # Verify ownership
    try:
        chat_service.get_chat(db, chat_id, current_user.user_id)
    except ChatNotFoundException as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except ChatAccessDeniedException as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )

    try:
        message = chat_message_service.create_assistant_placeholder(
            db=db,
            chat_id=chat_id,
            parent_message_id=request.parent_message_id,
            content_type=request.content_type or ContentTypeEnum.TEXT,
            meta_data=request.meta_data
        )
        return message
    except Exception as e:
        logger.error(f"Error creating assistant placeholder for chat {chat_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.patch("/messages/{message_id}/complete", response_model=ChatMessageResponse)
def complete_assistant_message(
    message_id: UUID,
    request: CompleteAssistantMessageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Finalizes an assistant response upon completion of token streaming/generation.
    """
    try:
        message = chat_message_service.get_message_by_id(db, message_id)
        # Verify ownership of parent chat
        chat_service.get_chat(db, message.chat_id, current_user.user_id)
    except ChatMessageNotFoundException as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except (ChatNotFoundException, ChatAccessDeniedException) as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access to complete this message is denied."
        )

    try:
        updated_msg = chat_message_service.complete_assistant_message(
            db=db,
            message_id=message_id,
            content=request.content,
            meta_data=request.meta_data
        )
        return updated_msg
    except Exception as e:
        logger.error(f"Error completing assistant message {message_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.patch("/messages/{message_id}/fail", response_model=ChatMessageResponse)
def fail_assistant_message(
    message_id: UUID,
    request: FailAssistantMessageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Marks an assistant response as FAILED, preserving partial content and recording error details.
    """
    try:
        message = chat_message_service.get_message_by_id(db, message_id)
        # Verify ownership of parent chat
        chat_service.get_chat(db, message.chat_id, current_user.user_id)
    except ChatMessageNotFoundException as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except (ChatNotFoundException, ChatAccessDeniedException) as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access to mark this message as failed is denied."
        )

    try:
        updated_msg = chat_message_service.fail_assistant_message(
            db=db,
            message_id=message_id,
            partial_content=request.partial_content or "",
            error_details=request.error_details
        )
        return updated_msg
    except Exception as e:
        logger.error(f"Error marking message {message_id} as failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
