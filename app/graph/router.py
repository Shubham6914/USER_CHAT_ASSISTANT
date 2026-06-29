
from app.graph.state import AgentState


def route_query(state: AgentState) -> str:
    intent = state.get("intent", "direct")
    has_docs = state.get("has_docs", False)

    if intent == "rag":
        if has_docs:
            return "rag_node"
        else:
            return "direct_node   # fallback if no docs"

    elif intent == "tool":
        return "tool_node"

    else:
        return "direct_node"