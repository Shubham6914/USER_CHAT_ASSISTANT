from typing import Dict, Callable, Any
from app.services.logger_service import get_logger
from app.services.retrieval_service import RetrievalService  
from app.services.prompt_service import LLM_INSTRUCTIONS
from app.core.llm_client import llm_client




class ToolService:
    """
    ToolService Responsibilities:

    - Register tools
    - Execute tools
    - Handle logging & errors
    - Provide standardized outputs

    IMPORTANT:
    - No response generation here
    - No orchestration logic
    """

    def __init__(self, retrieval_service:RetrievalService):
        """:
        Initialize ToolService

        Args:
            retrieval_service: Instance of RetrievalService
        """
        self.logger = get_logger("tool_service")

        self.retrieval_service = retrieval_service

        # Tool registry
        self.tools: Dict[str, Callable] = {}

        self._register_tools()

    # ------------------------------------------------------------------
    # TOOL REGISTRATION
    # ------------------------------------------------------------------

    def _register_tools(self):
        """
        Register all tools here
        """
        self.logger.info("[ToolService] Registering tools...")

        self.tools["web_search"] = self._web_search_tool
        self.tools["calculator"] = self._calculator_tool
        self.tools["search_docs"] = self._search_docs_tool
        self.tools["direct_llm"] = self._direct_llm_tool

        self.logger.info(f"[ToolService] Registered tools: {list(self.tools.keys())}")

    # ------------------------------------------------------------------
    # MAIN EXECUTION
    # ------------------------------------------------------------------

    def execute_tool(self, tool_name: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute a tool

        Args:
            tool_name: Tool name
            params: Tool parameters

        Returns:
            Standardized response
        """
        try:
            self.logger.info(f"[ToolService] Executing tool: {tool_name}")

            if tool_name not in self.tools:
                self.logger.warning(f"[ToolService] Tool not found: {tool_name}")
                return self._error("Tool not found")

            tool_func = self.tools[tool_name]

            result = tool_func(params)

            self.logger.info(f"[ToolService] Tool '{tool_name}' executed successfully")

            return self._success(result)

        except Exception as e:
            self.logger.error(f"[ToolService] Execution failed: {str(e)}")
            return self._error(str(e))

    # ------------------------------------------------------------------
    # RESPONSE HELPERS
    # ------------------------------------------------------------------

    def _success(self, data: Any) -> Dict[str, Any]:
        return {
            "status": "success",
            "data": data
        }

    def _error(self, message: str) -> Dict[str, Any]:
        return {
            "status": "error",
            "message": message
        }

    # ------------------------------------------------------------------
    # TOOL 1: WEB SEARCH (Stub / Replace later)
    # ------------------------------------------------------------------

    def _web_search_tool(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Web search tool

        Expected Input:
            {
                "query": "latest AI news"
            }

        NOTE:
        Replace with real API (SerpAPI, Tavily, etc.)
        """
        self.logger.debug(f"[Tool:web_search] Params: {params}")

        query = params.get("query")

        if not query:
            raise ValueError("Missing 'query' parameter")

        # 🔹 Stub response (replace later)
        results = [
            {"title": "Example Result 1", "snippet": "This is a sample result"},
            {"title": "Example Result 2", "snippet": "Another sample result"}
        ]

        return {
            "query": query,
            "results": results
        }

    # ------------------------------------------------------------------
    # TOOL 2: CALCULATOR (SAFE)
    # ------------------------------------------------------------------

    def _calculator_tool(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Safe calculator tool

        Input:
            {
                "expression": "2 + 2 * 5"
            }
        """
        self.logger.debug(f"[Tool:calculator] Params: {params}")

        import math
        import operator

        expression = params.get("expression")

        if not expression:
            raise ValueError("Missing 'expression'")

        # Allowed operators
        allowed_operators = {
            "+": operator.add,
            "-": operator.sub,
            "*": operator.mul,
            "/": operator.truediv,
        }

        try:
            # VERY basic safe parsing (can upgrade later)
            tokens = expression.split()

            if len(tokens) != 3:
                raise ValueError("Only simple expressions supported (e.g., '2 + 2')")

            a, op, b = tokens
            a, b = float(a), float(b)

            if op not in allowed_operators:
                raise ValueError("Operator not allowed")

            result = allowed_operators[op](a, b)

            return {"result": result}

        except Exception as e:
            self.logger.error(f"[Tool:calculator] Failed: {str(e)}")
            raise

    # ------------------------------------------------------------------
    # TOOL 3: SEARCH DOCS (RAG TOOL)
    # ------------------------------------------------------------------

    def _search_docs_tool(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Retrieval tool using internal vector DB

        Input:
            {
                "query": "...",
                "user_id": "...",
                "top_k": 5
            }
        """
        self.logger.debug(f"[Tool:search_docs] Params: {params}")

        query = params.get("query")
        user_id = params.get("user_id")
        top_k = params.get("top_k", 5)

        if not query or not user_id:
            raise ValueError("Missing 'query' or 'user_id'")

        # 🔹 Call your RetrievalService
        chunks = self.retrieval_service.retrieve_similar_chunks(
            query=query,
            user_id=user_id,
            top_k=top_k
        )

        # Optional: also return context directly
        context = self.retrieval_service.build_context(chunks)

        return {
            "query": query,
            "chunks": chunks,
            "context": context
        }

    def _direct_llm_tool(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Direct LLM call with controlled instructions.

        Input:
            {
                "query": "user question"
            }

        Output:
            {
                "response": "LLM output"
            }
        """
        try:
            self.logger.debug(f"[Tool:direct_llm] Params: {params}")

            query = params.get("query")

            if not query:
                raise ValueError("Missing 'query'")

            # 🔹 Build prompt using instructions
            prompt = f"""
            {LLM_INSTRUCTIONS}

            User Query:
            {query}

            Answer:
            """

            # 🔹 Call LLM Service (you already/will have this)
            response = llm_client.chat_completion([
                {"role": "user", "content": prompt}
            ])

            return {
                "query": query,
                "response": response
            }

        except Exception as e:
            self.logger.error(f"[Tool:direct_llm] Failed: {str(e)}")
            raise