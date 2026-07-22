import asyncio
import json
import traceback
from app.graph.graph_builder import build_graph
from app.graph.state import AgentState
from app.services.document_service import DocumentService
from app.services.conversation_context_service import ConversationContextService


class OrchestrationService:
    def __init__(self):
        # compile graph once
        self.graph = build_graph()
        self.context_service = ConversationContextService()

    async def run(self, query: str, user_id: str | None = None, chat_id: str | None = None, document_ids: list[str] | None = None, db = None):
        """
        Entry point for executing the full workflow asynchronously.

        Args:
            query: user query
            user_id: user identifier
            chat_id: conversation id
            document_ids: optional list of document UUIDs to filter context

        Yields:
            chunks of response (sources metadata JSON, raw LLM tokens)
        """
        document_service = DocumentService()

        # Directly await database lookup since DocumentService is async
        has_docs = False
        if user_id and db:
            has_docs = await document_service.check_user_has_doc(db, user_id)

        # Load conversation context history from DB
        chat_history = []
        if chat_id and db:
            context_res = await self.context_service.build_context(db, chat_id, limit=10)
            chat_history = context_res.get("formatted_messages", [])

        # Initial state
        state: AgentState = {
            "user_id": user_id,
            "query": query,
            "chat_history": chat_history,
            "has_docs": has_docs,
            "document_ids": document_ids or []
        }

        if chat_id:
            state["chat_id"] = chat_id


        try:
            # Native async streaming of graph events
            async for event in self.graph.astream_events(state, version="v2"):
                kind = event["event"]
                name = event["name"]

                # 1. Capture completion of the RAG node to yield sources metadata
                if kind in ["on_node_end", "on_chain_end"] and name == "rag_node":
                    output = event.get("data", {}).get("output", {})
                    if output and isinstance(output, dict):
                        docs = output.get("retrieved_docs", [])
                        
                        if docs:
                            sources_data = []
                            for doc in docs:
                                meta = doc.get("metadata", {}) if isinstance(doc, dict) else getattr(doc, "metadata", {})
                                doc_text = doc.get("text", "") if isinstance(doc, dict) else getattr(doc, "page_content", str(doc))
                                sources_data.append({
                                    "text": doc_text[:400],
                                    "page_number": meta.get("page_number") if isinstance(meta, dict) else None,
                                    "document_id": str(meta.get("document_id")) if isinstance(meta, dict) and meta.get("document_id") else None
                                })
                            yield "data: " + json.dumps({"type": "sources", "sources": sources_data}) + "\n\n"

                # 2. Capture completion of the Tool execution node to yield tool result metadata
                elif kind in ["on_node_end", "on_chain_end"] and name == "tool_node":
                    output = event.get("data", {}).get("output", {})
                    if output and isinstance(output, dict):
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
                                if isinstance(res, dict):
                                    sources_data.append({
                                        "url": res.get("url"),
                                        "title": res.get("title"),
                                        "content": res.get("content", "")[:400]
                                    })
                            if sources_data:
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