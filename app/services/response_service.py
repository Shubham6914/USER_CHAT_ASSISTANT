from typing import Optional, Dict, Any
from app.services.logger_service import get_logger
from app.core.llm_client import llm_client


class ResponseService:
    """
    ResponseService Responsibilities:

    - Build prompts
    - Call LLM
    - Generate final responses

    IMPORTANT:
    - No tool execution here
    - No orchestration logic here
    """

    def __init__(self):
        """
        Args:
            llm_client: Low-level LLM client (OpenAI, etc.)
        """
        self.logger = get_logger("response_service")
        self.llm_client = llm_client

    # ------------------------------------------------------------------
    # CORE LLM CALL
    # ------------------------------------------------------------------

    def _call_llm(self, messages: list) -> str:
        try:
            self.logger.info("[LLM] Calling model")

            response_text = self.llm_client.chat_completion(messages)

            self.logger.debug(f"[LLM] Response received: {len(response_text)} chars")

            return response_text

        except Exception as e:
            self.logger.error(f"[LLM] Failed: {str(e)}", exc_info=True)
            raise
    # ------------------------------------------------------------------
    # 1. DIRECT RESPONSE
    # ------------------------------------------------------------------

    def generate_direct_response(
        self,
        query: str,
        system_instructions: str
    ) -> str:
        """
        Generate response without retrieval

        Used by:
        - direct_llm tool
        """
        try:
            self.logger.info("[Response] Generating direct response")

            messages = [
                {"role": "system", "content": system_instructions},
                {"role": "user", "content": query}
            ]

            return self._call_llm(messages)

        except Exception as e:
            self.logger.error(f"[Response] Direct failed: {str(e)}")
            raise

    # ------------------------------------------------------------------
    # 2. RAG RESPONSE
    # ------------------------------------------------------------------

    def generate_rag_response(
        self,
        query: str,
        context: str,
        system_instructions: Optional[str] = None
    ) -> str:
        """
        Generate response using retrieved context
        """
        try:
            self.logger.info("[Response] Generating RAG response")

            base_instruction = system_instructions or """
            You are a helpful assistant. Use the provided context to answer the question.
            If the answer is not in the context, say you don't know.
            """

            prompt = f"""
            Context:
            {context}

            User Question:
            {query}

            Answer:
            """

            messages = [
                {"role": "system", "content": base_instruction},
                {"role": "user", "content": prompt}
            ]

            return self._call_llm(messages)

        except Exception as e:
            self.logger.error(f"[Response] RAG failed: {str(e)}")
            raise

    # ------------------------------------------------------------------
    # 3. TOOL RESPONSE
    # ------------------------------------------------------------------

    def generate_tool_response(
        self,
        query: str,
        tool_name: str,
        tool_result: Dict[str, Any]
    ) -> str:
        """
        Convert tool output into natural language response

        Used AFTER tool execution
        """
        try:
            self.logger.info(f"[Response] Generating tool response for {tool_name}")

            prompt = f"""
            User Query:
            {query}

            Tool Used:
            {tool_name}

            Tool Result:
            {tool_result}

            Generate a clear and user-friendly response.
            """

            messages = [
                {
                    "role": "system",
                    "content": "You are a helpful assistant that explains tool results clearly."
                },
                {"role": "user", "content": prompt}
            ]

            return self._call_llm(messages)

        except Exception as e:
            self.logger.error(f"[Response] Tool response failed: {str(e)}")
            raise