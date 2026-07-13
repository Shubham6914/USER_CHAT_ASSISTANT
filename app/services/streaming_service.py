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
            tool_res = state.get("tool_response", {})
            results = None
            if isinstance(tool_res, dict):
                data = tool_res.get("data", {})
                if isinstance(data, dict):
                    res_obj = data.get("results")
                    if isinstance(res_obj, dict):
                        results = res_obj.get("results")
                    elif isinstance(res_obj, list):
                        results = res_obj
                if not results:
                    results = tool_res.get("results")
            
            if results and isinstance(results, list):
                import json
                sources_data = []
                for res in results:
                    sources_data.append({
                        "url": res.get("url"),
                        "title": res.get("title"),
                        "content": res.get("content", "")[:400]
                    })
                yield "data: " + json.dumps({"type": "sources", "sources": sources_data}) + "\n\n"

            yield from self.response_service.generate_tool_response(
                query=query,
                tool_name=state.get("selected_tool"),
                tool_result=state.get("tool_response")
            )

        else:
            yield from self.response_service.generate_direct_response(
                query=query,
                system_instructions=LLM_INSTRUCTIONS
            )
