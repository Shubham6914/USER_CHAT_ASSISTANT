from app.graph.graph_builder import build_graph
from app.graph.state import AgentState
import traceback
from app.services.document_service import DocumentService


class OrchestrationService:
    def __init__(self):
        # compile graph once
        self.graph = build_graph()

    def run(self, query: str, user_id: str | None = None, chat_id: str | None = None, db = None) -> str:
        """
        Entry point for executing the full workflow

        Args:
            query: user query
            user_id: user identifier
            chat_id: conversation id

        Returns:
            final response string
        """
        document_service = DocumentService()

        has_docs = False
        if user_id and db:
            has_docs = document_service.check_user_has_doc(db, user_id)

        # initial state
        state: AgentState = {
            "user_id": user_id,
            # "chat_id": chat_id, now required now will pass later 
            "query": query,
            "chat_history": [],
            "has_docs": has_docs   # ✅ inject here
        }
        # if user_id:
        #     state["user_id"] = user_id

        if chat_id:
            state["chat_id"] = chat_id

        try:
            result = self.graph.invoke(state)
            print("result in orchestration------->",result, type(result))

            return {
                "response": result.get("final_response"),
                "intent": result.get("intent"),
                "metadata": {
                    "tool_used": result.get("tool_used"),
                    "sources": result.get("sources"),
                }
            }

        except Exception as e:
            traceback.print_exc()      # prints full stack trace
            print(e)                   # prints exception message

            raise    