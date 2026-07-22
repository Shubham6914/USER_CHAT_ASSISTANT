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

    # Existing non-streaming call
    # def _call_llm(self, messages: list) -> str:
    #     try:
    #         self.logger.info("[LLM] Calling model")

    #         response_text = self.llm_client.chat_completion(messages)

    #         self.logger.debug(
    #             f"[LLM] Response received: {len(response_text)} chars"
    #         )

    #         return response_text

    #     except Exception as e:
    #         self.logger.error(
    #             f"[LLM] Failed: {str(e)}",
    #             exc_info=True
    #         )
    #         raise
    
    # New streaming call
    def _stream_llm(self, messages: list):

        try:
            self.logger.info("[LLM] Starting streaming")

            for chunk in self.llm_client.stream_chat_completion(messages):
                yield chunk

        except Exception as e:
            self.logger.error(
                f"[LLM Streaming] Failed: {str(e)}",
                exc_info=True
            )
            raise

    async def _astream_llm(self, messages: list):
        try:
            self.logger.info("[LLM] Starting async streaming")
            async for chunk in self.llm_client.astream_chat_completion(messages, config={"tags": ["response"]}):
                yield chunk
        except Exception as e:
            self.logger.error(
                f"[LLM Async Streaming] Failed: {str(e)}",
                exc_info=True
            )
            raise



    
    # ------------------------------------------------------------------
    # 1. DIRECT RESPONSE
    # ------------------------------------------------------------------

    def generate_direct_response(
        self,
        query: str,
        system_instructions: str
    ):
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

            yield from self._stream_llm(messages)

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
    ):
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

            yield from self._stream_llm(messages)

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
    ):
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

            yield from self._stream_llm(messages)

        except Exception as e:
            self.logger.error(f"[Response] Tool response failed: {str(e)}")
            raise

    async def generate_direct_response_async(
        self,
        query: str,
        system_instructions: str,
        chat_history: Optional[list] = None
    ):
        try:
            self.logger.info("[Response] Generating direct response async")
            messages = [{"role": "system", "content": system_instructions}]
            if chat_history:
                messages.extend(chat_history)
            messages.append({"role": "user", "content": query})

            async for chunk in self._astream_llm(messages):
                yield chunk
        except Exception as e:
            self.logger.error(f"[Response] Direct async failed: {str(e)}")
            raise

    async def generate_rag_response_async(
        self,
        query: str,
        context: str,
        system_instructions: Optional[str] = None,
        chat_history: Optional[list] = None
    ):
        try:
            self.logger.info("[Response] Generating RAG response async")
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
            messages = [{"role": "system", "content": base_instruction}]
            if chat_history:
                messages.extend(chat_history)
            messages.append({"role": "user", "content": prompt})

            async for chunk in self._astream_llm(messages):
                yield chunk
        except Exception as e:
            self.logger.error(f"[Response] RAG async failed: {str(e)}")
            raise

    def _format_tool_result_for_prompt(self, tool_name: str, tool_result: Any) -> str:
        if isinstance(tool_result, dict):
            data = tool_result.get("data", {})
            results = None
            if isinstance(data, dict):
                res_obj = data.get("results")
                if isinstance(res_obj, dict):
                    results = res_obj.get("results")
                elif isinstance(res_obj, list):
                    results = res_obj
            if not results:
                results = tool_result.get("results")

            if results and isinstance(results, list):
                formatted_items = []
                for idx, item in enumerate(results, 1):
                    if isinstance(item, dict):
                        title = item.get("title", "Source")
                        url = item.get("url", "")
                        content = item.get("content", "")
                        formatted_items.append(f"Source [{idx}] ({title} | {url}):\n{content}")
                if formatted_items:
                    return "\n\n".join(formatted_items)
        return str(tool_result)

    async def generate_tool_response_async(
        self,
        query: str,
        tool_name: str,
        tool_result: Dict[str, Any],
        chat_history: Optional[list] = None
    ):
        try:
            self.logger.info(f"[Response] Generating tool response async for {tool_name}")
            formatted_result = self._format_tool_result_for_prompt(tool_name, tool_result)
            
            prompt = f"""
            User Query:
            {query}

            Tool Used:
            {tool_name}

            Retrieved Tool Results:
            {formatted_result}

            Instructions:
            Answer the user's query thoroughly using the facts, vacancy counts, salary ranges, dates, and details from the Tool Results above.
            """
            
            system_instruction = """
            You are a detail-oriented, accurate AI assistant.
            Answer the User Query using the provided Tool Results as your primary source of truth.
            
            CRITICAL GUIDELINES:
            - Extract and report all specific figures, numbers, vacancy counts, salary ranges, dates, and facts present in the Tool Results.
            - Do NOT state that information is unavailable if facts or figures are present in the Tool Results.
            - Synthesize the details clearly and concisely.
            """

            messages = [
                {
                    "role": "system",
                    "content": system_instruction
                }
            ]
            if chat_history:
                messages.extend(chat_history)
            messages.append({"role": "user", "content": prompt})

            async for chunk in self._astream_llm(messages):
                yield chunk
        except Exception as e:
            self.logger.error(f"[Response] Tool response async failed: {str(e)}")
            raise