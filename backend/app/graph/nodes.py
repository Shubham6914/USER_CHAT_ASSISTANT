import json
import asyncio
from app.graph.state import AgentState

# import your services
from app.services.retrieval_service import RetrievalService
from app.services.response_service import ResponseService
from app.services.tool_service import ToolService
from app.services.prompt_service import ANALYZE_QUERY_PROMPT, LLM_INSTRUCTIONS
from app.services.tool_selector_service import ToolSelectorService


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
    async def analyze_node(self, state: AgentState) -> AgentState:
        query = state["query"]
        user_id = state.get("user_id")

        prompt = ANALYZE_QUERY_PROMPT.replace("{query}", query)

        try:
            response = await self.llm.ainvoke([
                {"role": "user", "content": prompt}
            ], config={"tags": ["analyze"]})

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
    async def rag_node(self, state: AgentState) -> AgentState:
        query = state["query"]
        user_id = state.get("user_id")

        # RAG database and Pinecone call - wrap in thread executor for non-blocking latency
        docs = await asyncio.to_thread(
            self.retrieval_service.retrieve_similar_chunks,
            query=query,
            user_id=user_id
        )

        return {
            "retrieved_docs": docs
        }

    # ---------------------------
    # 3. TOOL NODE
    # ---------------------------
    async def tool_node(self, state: AgentState) -> AgentState:
        query = state["query"]

        # Fix hardcoded tool selection bug (Extract from state if selected by tool_selector_node)
        tool_name = state.get("selected_tool") or "web_search"
        params = state.get("tool_params") or {"query": query}

        # Wrap tool execution in thread executor as it performs HTTP queries
        tool_result = await asyncio.to_thread(
            self.tool_service.execute_tool,
            tool_name,
            params
        )

        return {
            "tool_response": tool_result
        }

    # ---------------------------
    # 4. DIRECT NODE
    # ---------------------------
    async def direct_node(self, state: AgentState) -> AgentState:
        # no-op node
        return {}

    # ---------------------------
    # 5. Tool Selector Node
    # ---------------------------
    async def tool_selector_node(self, state: AgentState) -> AgentState:
        # Wrap Tool selection LLM call in thread executor since it is synchronous
        result = await asyncio.to_thread(
            self.tool_selector.select_tool,
            query=state["query"],
            user_id=state.get("user_id")
        )

        return {
            "selected_tool": result["tool"],
            "tool_params": result["parameters"]
        }

    # ---------------------------
    # 6. Response Node (Unified LLM stream generation)
    # ---------------------------
    async def response_node(self, state: AgentState) -> AgentState:
        intent = state.get("intent", "direct")
        query = state["query"]

        # Resolve correct async stream generator
        if intent == "rag":
            docs = state.get("retrieved_docs", [])
            context = "\n".join([str(doc) for doc in docs])
            stream = self.response_service.generate_rag_response_async(
                query=query,
                context=context,
                system_instructions=LLM_INSTRUCTIONS
            )
        elif intent == "tool":
            stream = self.response_service.generate_tool_response_async(
                query=query,
                tool_name=state.get("selected_tool"),
                tool_result=state.get("tool_response")
            )
        else:
            stream = self.response_service.generate_direct_response_async(
                query=query,
                system_instructions=LLM_INSTRUCTIONS
            )

        # Consume the async generator inside the node.
        # ChatOpenAI natively triggers on_chat_model_stream events when executed within LangGraph context.
        final_text = []
        async for chunk in stream:
            final_text.append(chunk)

        return {
            "final_response": "".join(final_text)
        }