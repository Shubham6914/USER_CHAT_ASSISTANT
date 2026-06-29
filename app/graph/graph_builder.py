from langgraph.graph import StateGraph, END

from app.graph.state import AgentState
from app.graph.nodes import GraphNodes
from app.graph.router import route_query


def build_graph():
    # initialize nodes
    nodes = GraphNodes()

    # create graph
    graph = StateGraph(AgentState)

    # ---------------------------
    # ADD NODES
    # ---------------------------
    graph.add_node("analyze_node", nodes.analyze_node)
    graph.add_node("rag_node", nodes.rag_node)
    graph.add_node("tool_node", nodes.tool_node)
    graph.add_node("direct_node", nodes.direct_node)
    graph.add_node("response_node", nodes.response_node)

    # ---------------------------
    # ENTRY POINT
    # ---------------------------
    graph.set_entry_point("analyze_node")

    # ---------------------------
    # CONDITIONAL ROUTING
    # ---------------------------
    graph.add_conditional_edges(
        "analyze_node",
        route_query,
        {
            "rag_node": "rag_node",
            "tool_node": "tool_node",
            "direct_node": "direct_node",
        },
    )

    # ---------------------------
    # COMMON FLOW → RESPONSE
    # ---------------------------
    graph.add_edge("rag_node", "response_node")
    graph.add_edge("tool_node", "response_node")
    graph.add_edge("direct_node", "response_node")

    # ---------------------------
    # END
    # ---------------------------
    graph.add_edge("response_node", END)

    # compile graph
    return graph.compile()