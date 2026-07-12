from app.services.response_service import ResponseService
from app.services.prompt_service import ANALYZE_QUERY_PROMPT, LLM_INSTRUCTIONS

class StreamingService:
    """
    Responsible for streaming final responses.

    Graph only prepares the state.
    This service converts the state into streamed LLM output.
    """

    def __init__(self):
        self.response_service = ResponseService()


    # def stream_response(self, state):

    #     intent = state.get("intent")

    #     query = state.get("query")


    #     if intent == "rag":

    #         docs = state.get("retrieved_docs", [])

    #         context = "\n".join(
    #             [str(doc) for doc in docs]
    #         )

    #         yield from self.response_service.generate_rag_response(
    #             query=query,
    #             context=context,
    #             system_instructions =LLM_INSTRUCTIONS
    #         )


    #     elif intent == "tool":

    #         yield from self.response_service.generate_tool_response(
    #             query=query,
    #             tool_result=state.get("tool_response")
    #         )


    #     else:

    #         yield from self.response_service.generate_direct_response(
    #             query=query,
    #             system_instructions =LLM_INSTRUCTIONS
    #         )

    def stream_response(self, state):
        intent = state.get("intent")
        query = state.get("query")

        if intent == "rag":
            docs = state.get("retrieved_docs", [])

            # 1. Yield retrieved documents list first as a JSON SSE event
            import json
            sources_data = []
            for doc in docs:
                meta = doc.get("metadata", {})
                sources_data.append({
                    "text": doc.get("text", "")[:400], # Text snippet context
                    "page_number": meta.get("page_number"),
                    "document_id": str(meta.get("document_id")) if meta.get("document_id") else None
                })
            yield "data: " + json.dumps({"type": "sources", "sources": sources_data}) + "\n\n"

            # 2. Yield the actual text stream response from the LLM
            context = "\n".join(
                [str(doc) for doc in docs]
            )
            yield from self.response_service.generate_rag_response(
                query=query,
                context=context,
                system_instructions=LLM_INSTRUCTIONS
            )

        elif intent == "tool":
            yield from self.response_service.generate_tool_response(
                query=query,
                tool_result=state.get("tool_response")
            )

        else:
            yield from self.response_service.generate_direct_response(
                query=query,
                system_instructions=LLM_INSTRUCTIONS
            )
