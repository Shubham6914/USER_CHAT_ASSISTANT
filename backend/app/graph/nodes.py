import json
import asyncio
from app.graph.state import AgentState

from app.services.logger_service import get_logger
from app.services.retrieval_service import RetrievalService
from app.services.response_service import ResponseService
from app.services.tool_service import ToolService
from app.services.prompt_service import ANALYZE_QUERY_PROMPT, LLM_INSTRUCTIONS
from app.services.tool_selector_service import ToolSelectorService


class GraphNodes:
    def __init__(self):
        self.logger = get_logger("graph_nodes")
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
        chat_history = state.get("chat_history", [])
        self.logger.info(f"[Graph] Executing analyze_node for user: {user_id}, query: '{query}' (history len={len(chat_history)})")

        prompt = ANALYZE_QUERY_PROMPT.replace("{query}", query)

        try:
            analyze_messages = []
            if chat_history:
                analyze_messages.extend(chat_history)
            analyze_messages.append({"role": "user", "content": prompt})

            raw_resp = await self.llm.ainvoke(analyze_messages, config={"tags": ["analyze"]})

            # Clean markdown code blocks (e.g. ```json ... ```)
            cleaned = raw_resp.strip()
            if cleaned.startswith("```"):
                lines = cleaned.splitlines()
                if lines and lines[0].startswith("```"):
                    lines = lines[1:]
                if lines and lines[-1].startswith("```"):
                    lines = lines[:-1]
                cleaned = "\n".join(lines).strip()

            parsed = json.loads(cleaned)
            intent = parsed.get("intent", "tool")
            thinking = parsed.get("thinking", "")
            sub_queries = parsed.get("sub_queries", [])

            if intent not in ["rag", "tool", "direct"]:
                intent = "tool"

            self.logger.info(f"[Graph CoT] Thinking: '{thinking}'")
            if sub_queries:
                self.logger.info(f"[Graph CoT] Sub-queries: {sub_queries}")

        except Exception as e:
            self.logger.warning(f"[Graph] Error parsing analyze response: {str(e)} -> defaulting to 'tool'")
            intent = "tool"

        self.logger.info(f"[Graph] Classified query intent as: '{intent}'")
        return {
            "intent": intent,
        }

    # ---------------------------
    # 2. RAG NODE
    # ---------------------------
    async def rag_node(self, state: AgentState) -> AgentState:
        query = state["query"]
        user_id = state.get("user_id")
        self.logger.info(f"[Graph] Executing rag_node (document retrieval) for user: {user_id}")

        # Check for specific document filtering
        filters = None
        doc_ids = state.get("document_ids")
        if doc_ids:
            if len(doc_ids) == 1:
                filters = {"document_id": {"$eq": doc_ids[0]}}
            else:
                filters = {"document_id": {"$in": doc_ids}}
            self.logger.info(f"[Graph] Applying Pinecone metadata filter for document_ids: {doc_ids}")

        # RAG database and Pinecone call - directly await async retrieval
        docs = await self.retrieval_service.retrieve_similar_chunks(
            query=query,
            user_id=user_id,
            filters=filters
        )

        self.logger.info(f"[Graph] Retrieval complete. Retrieved {len(docs)} document chunks.")
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
        self.logger.info(f"[Graph] Executing tool_node for tool: '{tool_name}' with parameters: {params}")

        try:
            tool_result = await self.tool_service.execute_tool(
                tool_name,
                params
            )
        except Exception as e:
            self.logger.error(f"[Graph] Tool execution exception for '{tool_name}': {str(e)}")
            tool_result = {"status": "error", "message": f"Tool execution error: {str(e)}"}

        self.logger.info(f"[Graph] Tool '{tool_name}' execution completed.")
        return {
            "tool_response": tool_result
        }

    # ---------------------------
    # 4. DIRECT NODE
    # ---------------------------
    async def direct_node(self, state: AgentState) -> AgentState:
        self.logger.info("[Graph] Executing direct_node (routing directly to LLM generator)")
        # no-op node
        return {}

    # ---------------------------
    # 5. Tool Selector Node
    # ---------------------------
    async def tool_selector_node(self, state: AgentState) -> AgentState:
        self.logger.info("[Graph] Executing tool_selector_node (selecting external tool)")
        query = state["query"]
        try:
            result = await self.tool_selector.select_tool(
                query=query,
                user_id=state.get("user_id")
            )
            selected_tool = result.get("tool", "web_search")
            tool_params = result.get("parameters", {"query": query})
        except Exception as e:
            self.logger.warning(f"[Graph] Connection/Selection error in tool_selector_node: {str(e)} -> defaulting to 'web_search'")
            selected_tool = "web_search"
            tool_params = {"query": query}

        self.logger.info(f"[Graph] Selected tool '{selected_tool}' with params: {tool_params}")
        return {
            "selected_tool": selected_tool,
            "tool_params": tool_params
        }

    # ---------------------------
    # 6. Response Node (Unified LLM stream generation)
    # ---------------------------
    async def response_node(self, state: AgentState) -> AgentState:
        intent = state.get("intent", "direct")
        query = state["query"]
        chat_history = state.get("chat_history", [])
        self.logger.info(f"[Graph] Executing response_node (generating unified token stream) for intent: '{intent}' (history len={len(chat_history)})")

        # Resolve correct async stream generator
        if intent == "rag":
            docs = state.get("retrieved_docs", [])
            context = "\n".join([str(doc) for doc in docs])
            stream = self.response_service.generate_rag_response_async(
                query=query,
                context=context,
                system_instructions=LLM_INSTRUCTIONS,
                chat_history=chat_history
            )
        elif intent == "tool":
            stream = self.response_service.generate_tool_response_async(
                query=query,
                tool_name=state.get("selected_tool"),
                tool_result=state.get("tool_response"),
                chat_history=chat_history
            )
        else:
            stream = self.response_service.generate_direct_response_async(
                query=query,
                system_instructions=LLM_INSTRUCTIONS,
                chat_history=chat_history
            )

        # Consume the async generator inside the node.
        # ChatOpenAI natively triggers on_chat_model_stream events when executed within LangGraph context.
        final_text = []
        async for chunk in stream:
            final_text.append(chunk)

        self.logger.info("[Graph] Finished token generation response stream.")
        return {
            "final_response": "".join(final_text)
        }