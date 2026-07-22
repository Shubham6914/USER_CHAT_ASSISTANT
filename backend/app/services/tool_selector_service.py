from typing import Dict, Any

from app.services.logger_service import get_logger
from app.core.llm_client import llm_client
from app.services.prompt_service import TOOL_SELECTOR_PROMPT


class ToolSelectorService:
    """
    ToolSelectorService Responsibilities:

    - Select the appropriate tool based on user query
    - Extract required tool parameters
    - Return structured tool execution plan

    IMPORTANT:
    - Does not execute tools
    - Does not generate final responses
    """

    def __init__(self):
        """
        Initialize ToolSelectorService
        """

        self.logger = get_logger("tool_selector_service")

    # ---------------------------------------------------------
    # MAIN TOOL SELECTION
    # ---------------------------------------------------------

    async def select_tool(
        self,
        query: str,
        user_id: str = None
    ) -> Dict[str, Any]:
        """
        Select tool for the given query asynchronously.

        Args:
            query:
                User query

            user_id:
                Current user identifier (required for document search)

        Returns:

            {
                "tool": "web_search",
                "parameters": {
                    "query": "latest AI news"
                }
            }

        """

        self.logger.info(
            f"[ToolSelector] Selecting tool for query: {query}"
        )

        if not query:
            raise ValueError("Missing query")

        try:
            prompt = TOOL_SELECTOR_PROMPT.format(query=query)

            response = await llm_client.ainvoke(
                [
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            )

            tool_plan = self._parse_response(response)
            selected_tool = tool_plan.get("tool", "web_search")
            thinking = tool_plan.get("thinking", "")
            parameters = tool_plan.get("parameters", {"query": query})

            # Allowed external tools only
            allowed_tools = ["web_search", "calculator"]
            if selected_tool not in allowed_tools:
                self.logger.warning(f"[ToolSelector] Unexpected tool '{selected_tool}' -> fallback to 'web_search'")
                selected_tool = "web_search"

            if thinking:
                self.logger.info(f"[ToolSelector CoT] Thinking: '{thinking}'")

            self.logger.info(f"[ToolSelector] Selected tool: {selected_tool}")

            return {
                "tool": selected_tool,
                "parameters": parameters
            }

        except Exception as e:
            self.logger.error(f"[ToolSelector] Selection failed: {str(e)} -> defaulting to 'web_search'")
            return {
                "tool": "web_search",
                "parameters": {"query": query}
            }

    # ---------------------------------------------------------
    # RESPONSE PARSER
    # ---------------------------------------------------------

    def _parse_response(self, response: str) -> Dict[str, Any]:
        """
        Parse LLM JSON response cleanly by removing markdown wrappers.
        """
        import json

        cleaned = response.strip()
        if cleaned.startswith("```"):
            lines = cleaned.splitlines()
            if lines and lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].startswith("```"):
                lines = lines[:-1]
            cleaned = "\n".join(lines).strip()

        try:
            return json.loads(cleaned)
        except Exception as e:
            self.logger.error(f"[ToolSelector] Invalid JSON response: {str(e)}")
            return {
                "tool": "web_search",
                "parameters": {}
            }