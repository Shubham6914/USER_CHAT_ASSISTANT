from pydantic import BaseModel
from typing import Optional, Any, List


class QueryRequest(BaseModel):
    query: str
    user_id: str
    chat_id: Optional[str] = None
    document_ids: Optional[List[str]] = None


class QueryResponse(BaseModel):
    response: str
    intent: Optional[str] = None

    # useful for debugging (remove later if needed)
    metadata: Optional[Any] = None