from app.graph.state import AgentState


def route_query(state: AgentState) -> str:
    """
    Route query based on analyzer intent.

    Returns:
        Next graph node name.
    """

    intent = state.get("intent", "direct")
    has_docs = state.get("has_docs", False)

    if intent == "rag":
        if has_docs:
            return "rag_node"
        else:
            return "direct_node"

    elif intent == "tool":
        return "tool_selector_node"

    else:
        return "direct_node"