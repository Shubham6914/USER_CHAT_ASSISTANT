from typing import Dict, Callable, Any
from app.services.logger_service import get_logger
from app.services.retrieval_service import RetrievalService  
from app.services.prompt_service import LLM_INSTRUCTIONS
from app.core.llm_client import llm_client
from langchain_tavily import TavilySearch



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
        self.tavily_search = TavilySearch(
            max_results=3,
            topic="general"
        )

        # Tool registry
        self.tools: Dict[str, Callable] = {}

        self._register_tools()

    # ------------------------------------------------------------------
    # TOOL REGISTRATION
    # ------------------------------------------------------------------

    def _register_tools(self):
        """
        Register external execution tools here.
        Note: Document RAG and direct LLM generation are handled by graph nodes (rag_node / direct_node).
        """
        self.logger.info("[ToolService] Registering external tools...")

        self.tools["web_search"] = self._web_search_tool
        self.tools["calculator"] = self._calculator_tool

        self.logger.info(f"[ToolService] Registered external tools: {list(self.tools.keys())}")

    # ------------------------------------------------------------------
    # MAIN EXECUTION
    # ------------------------------------------------------------------

    async def execute_tool(self, tool_name: str, params: Dict[str, Any]) -> Dict[str, Any]:
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

            result = await tool_func(params)

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

    async def _web_search_tool(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Perform a web search using the Tavily Search API.

        Input:
            {
                "query": "latest AI news"
            }

        Returns:
            {
                "query": "latest AI news",
                "results": [...]
            }
        """
        self.logger.debug(f"[Tool:web_search] Params: {params}")

        query = params.get("query")

        if not query:
            raise ValueError("Missing 'query' parameter")

        try:
            results = await self.tavily_search.ainvoke(query)

            return {
                "query": query,
                "results": results
            }

        except Exception as e:
            self.logger.error(f"[Tool:web_search] Failed: {str(e)}")
            raise

    # ------------------------------------------------------------------
    # TOOL 2: CALCULATOR (SAFE)
    # ------------------------------------------------------------------

    async def _calculator_tool(self, params: Dict[str, Any]) -> Dict[str, Any]:
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
