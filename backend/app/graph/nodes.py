from app.graph.state import AgentState

# import your services
from app.services.retrieval_service import RetrievalService
from app.services.response_service import ResponseService
from app.services.tool_service import ToolService
from app.services.prompt_service import ANALYZE_QUERY_PROMPT, LLM_INSTRUCTIONS
from app.services.tool_selector_service import ToolSelectorService

import json

class GraphNodes:
    def __init__(self):
        self.retrieval_service = RetrievalService()
        self.response_service = ResponseService()
        self.tool_service = ToolService(self.retrieval_service)
        self.tool_selector = ToolSelectorService()

        self.llm = self.response_service.llm_client

    # ---------------------------
    # 1. ANALYZE NODE
    # ---------------------------
    def analyze_node(self, state: AgentState) -> AgentState:
        query = state["query"]
        user_id = state.get("user_id")

        prompt = ANALYZE_QUERY_PROMPT.replace("{query}", query)

        try:
            response = self.llm.chat_completion([
                {"role": "user", "content": prompt}
            ])

            parsed = json.loads(response.strip())
            intent = parsed.get("intent", "direct")

            if intent not in ["rag", "tool", "direct"]:
                intent = "direct"

        except Exception:
            intent = "direct"

        return {
            "intent": intent,
        }


    # ---------------------------
    # 2. RAG NODE
    # ---------------------------
    def rag_node(self, state: AgentState) -> AgentState:
        query = state["query"]

        user_id = state.get("user_id")

        docs = self.retrieval_service.retrieve_similar_chunks(
            query=query,
            user_id=user_id   # ✅ REQUIRED
        )

        return {
            "retrieved_docs": docs
        }

    # ---------------------------
    # 3. TOOL NODE
    # ---------------------------
    def tool_node(self, state: AgentState) -> AgentState:
        query = state["query"]

        # default tool selection (you can improve later)
        tool_name = "web_search"

        params = {
            "query": query
        }

        tool_result = self.tool_service.execute_tool(tool_name, params)

        return {
            "tool_response": tool_result
        }

    # ---------------------------
    # 4. DIRECT NODE
    # ---------------------------
    def direct_node(self, state: AgentState) -> AgentState:
        # no-op node
        return {}
    # ---------------------------
    # 4. Tool Selector Node
    # ---------------------------

    def tool_selector_node(
        self,
        state: AgentState
    ):

        result = self.tool_selector.select_tool(
            query=state["query"],
            user_id=state.get("user_id")
        )


        return {
            "selected_tool": result["tool"],
            "tool_params": result["parameters"]
        }


    