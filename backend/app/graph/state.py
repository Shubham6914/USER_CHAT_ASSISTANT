from typing import TypedDict, List, Optional, Any, Dict


class AgentState(TypedDict, total=False):
    # identifiers
    user_id: str
    chat_id: str

    # input
    query: str

    # decision
    intent: str  # "rag" | "tool" | "direct"
    has_docs: bool

    # tool routing
    selected_tool: str
    tool_params: Dict[str, Any]

    # intermediate data
    retrieved_docs: List[Any]
    tool_response: Any

    # output
    final_response: str

    # memory
    chat_history: List[Any]