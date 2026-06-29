from typing import TypedDict, List, Optional, Any


class AgentState(TypedDict, total=False):
    # identifiers
    user_id: str
    chat_id: str

    # input
    query: str

    # decision
    intent: str  # "rag" | "tool" | "direct"
    has_docs: bool   # ✅ NEW

    # intermediate data
    retrieved_docs: List[Any]
    tool_response: str

    # output
    final_response: str

    # memory
    chat_history: List[Any]