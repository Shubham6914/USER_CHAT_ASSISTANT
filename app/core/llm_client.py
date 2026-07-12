from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from app.core.config import settings
import os

class LLMClient:
    def __init__(self):
        self._llm = ChatOpenAI(
            model="gpt-4.1-mini",
            temperature=0,
            api_key=settings.OPENAI_API_KEY
        )
        self._embedding = None

    def get_llm(self):
        if self._llm is None:
            self._llm = ChatOpenAI(
                model="gpt-4.1-mini",
                temperature=0.2,
                api_key=settings.OPENAI_API_KEY
            )
        return self._llm

    def get_embedding(self):
        if self._embedding is None:
            self._embedding = OpenAIEmbeddings(
                model=settings.EMBEDDING_MODEL,
                api_key=settings.OPENAI_API_KEY
            )
        return self._embedding
    
    
    def chat_completion(self, messages: list) -> str:
        llm = self.get_llm()
        response = llm.invoke(messages)
        return response.content
    
    def stream_chat_completion(self, messages):

        llm = self.get_llm()

        for chunk in llm.stream(messages):

            if chunk.content:
                yield chunk.content
        
        @property
        def llm(self):
            return self._llm


# Singleton instance (IMPORTANT)
llm_client = LLMClient()