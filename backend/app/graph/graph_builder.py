from langgraph.graph import StateGraph, END

from app.graph.state import AgentState
from app.graph.nodes import GraphNodes
from app.graph.router import route_query


def build_graph():

    nodes = GraphNodes()

    graph = StateGraph(AgentState)

    # Nodes
    graph.add_node("analyze_node", nodes.analyze_node)
    graph.add_node("rag_node", nodes.rag_node)
    graph.add_node("tool_selector_node", nodes.tool_selector_node)
    graph.add_node("tool_node", nodes.tool_node)
    graph.add_node("direct_node", nodes.direct_node)
    graph.add_node("response_node", nodes.response_node)

    # Entry
    graph.set_entry_point("analyze_node")

    # Routing
    graph.add_conditional_edges(
        "analyze_node",
        route_query,
        {
            "rag_node": "rag_node",
            "tool_selector_node": "tool_selector_node",
            "direct_node": "direct_node",
        },
    )

    # Tool selection -> execution
    graph.add_edge("tool_selector_node", "tool_node")

    # Connect execution branches to the unified response node
    graph.add_edge("rag_node", "response_node")
    graph.add_edge("tool_node", "response_node")
    graph.add_edge("direct_node", "response_node")

    # End after response generation
    graph.add_edge("response_node", END)

    return graph.compile()