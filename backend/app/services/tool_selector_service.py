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

    def select_tool(
        self,
        query: str,
        user_id: str = None
    ) -> Dict[str, Any]:
        """
        Select tool for the given query.

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

            prompt = TOOL_SELECTOR_PROMPT.format(
                query=query
            )


            response = llm_client.chat_completion(
                [
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            )


            tool_plan = self._parse_response(response)


            # Add user_id for RAG tool
            if (
                tool_plan.get("tool") == "search_docs"
                and user_id
            ):
                tool_plan["parameters"]["user_id"] = user_id


            self.logger.info(
                f"[ToolSelector] Selected tool: {tool_plan.get('tool')}"
            )


            return tool_plan


        except Exception as e:

            self.logger.error(
                f"[ToolSelector] Failed: {str(e)}"
            )

            raise


    # ---------------------------------------------------------
    # RESPONSE PARSER
    # ---------------------------------------------------------

    def _parse_response(
        self,
        response: str
    ) -> Dict[str, Any]:

        """
        Parse LLM JSON response.
        """

        import json

        try:
            return json.loads(response)

        except Exception:

            self.logger.error(
                "[ToolSelector] Invalid JSON response"
            )

            raise ValueError(
                "Tool selector returned invalid JSON"
            )