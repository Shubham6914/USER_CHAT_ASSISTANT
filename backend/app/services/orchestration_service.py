import asyncio
import json
import traceback
from app.graph.graph_builder import build_graph
from app.graph.state import AgentState
from app.services.document_service import DocumentService


class OrchestrationService:
    def __init__(self):
        # compile graph once
        self.graph = build_graph()

    async def run(self, query: str, user_id: str | None = None, chat_id: str | None = None, db = None):
        """
        Entry point for executing the full workflow asynchronously.

        Args:
            query: user query
            user_id: user identifier
            chat_id: conversation id

        Yields:
            chunks of response (sources metadata JSON, raw LLM tokens)
        """
        document_service = DocumentService()

        # Directly await database lookup since DocumentService is async
        has_docs = False
        if user_id and db:
            has_docs = await document_service.check_user_has_doc(db, user_id)

        # Initial state
        state: AgentState = {
            "user_id": user_id,
            "query": query,
            "chat_history": [],
            "has_docs": has_docs
        }

        if chat_id:
            state["chat_id"] = chat_id

        try:
            # Native async streaming of graph events
            async for event in self.graph.astream_events(state, version="v2"):
                kind = event["event"]
                name = event["name"]

                # 1. Capture completion of the RAG node to yield sources metadata
                if kind == "on_node_end" and name == "rag_node":
                    output = event["data"]["output"]
                    docs = output.get("retrieved_docs", [])
                    
                    if docs:
                        sources_data = []
                        for doc in docs:
                            meta = doc.get("metadata", {})
                            sources_data.append({
                                "text": doc.get("text", "")[:400],
                                "page_number": meta.get("page_number"),
                                "document_id": str(meta.get("document_id")) if meta.get("document_id") else None
                            })
                        yield "data: " + json.dumps({"type": "sources", "sources": sources_data}) + "\n\n"

                # 2. Capture completion of the Tool execution node to yield tool result metadata
                elif kind == "on_node_end" and name == "tool_node":
                    output = event["data"]["output"]
                    tool_res = output.get("tool_response", {})
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
                        sources_data = []
                        for res in results:
                            sources_data.append({
                                "url": res.get("url"),
                                "title": res.get("title"),
                                "content": res.get("content", "")[:400]
                            })
                        yield "data: " + json.dumps({"type": "sources", "sources": sources_data}) + "\n\n"

                # 3. Capture streaming tokens from ChatOpenAI execution
                elif kind == "on_chat_model_stream":
                    tags = event.get("tags", [])
                    if "response" in tags:
                        chunk = event["data"]["chunk"]
                        if chunk.content:
                            yield chunk.content

        except Exception as e:
            traceback.print_exc()
            print(f"Error in async orchestration run: {e}")
            raise