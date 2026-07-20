from typing import List, Dict, Optional
from app.services.logger_service import get_logger
from app.core.database_service import get_database_service
from app.services.embedding_service import EmbeddingService
from app.services.vector_service import VectorStoreService
class RetrievalService:
    """
    RetrievalService handles:
    - Query embedding generation
    - Similarity search in Pinecone
    - Metadata filtering
    - Optional reranking
    - Context building for LLM
    """

    def __init__(self,):
        """
        Initialize RetrievalService

        Args:
            db_service: DatabaseService instance (to access Pinecone index)
            embedding_service: EmbeddingService instance
            logger: Logger instance (from logger_service)
        """
        self.logger = get_logger("retrieval_service")
        db_service = get_database_service()

        # Get Pinecone index instance
        index = db_service.get_pinecone_index()  # ✅ GET INDEX

        self.vector_store = VectorStoreService(index=index)  # ✅ PASS IT
        self.embedding_service = EmbeddingService()


    def retrieve_similar_chunks(
        self,
        query: str,
        user_id: str,
        top_k: int = 5,
        filters: Optional[Dict] = None
    ) -> List[Dict]:
        """
        Main entry point for retrieval.

        Steps:
        1. Generate embedding for query
        2. Query Pinecone
        3. Parse results
        4. Rerank results
        5. Return final chunks

        Args:
            query: User query
            user_id: Used as namespace (data isolation)
            top_k: Number of results to return
            filters: Optional metadata filters

        Returns:
            List of relevant chunks with text, score, metadata
        """
        try:
            self.logger.info(f"[Retrieval] Started for user_id={user_id}")

            # Step 1: Generate query embedding
            query_embedding = self.embedding_service.generate_embeddings(query)

            self.logger.debug(f"[Retrieval] Query embedding generated")

            # Step 2: Query Pinecone
            results = self._query_pinecone(
                embedding=query_embedding,
                user_id=user_id,
                top_k=top_k,
                filters=filters
            )

            self.logger.info(f"[Retrieval] Pinecone returned {len(results)} results")

            # Step 3: Rerank (simple for now)
            reranked_results = self.rerank_chunks(results)

            return reranked_results

        except Exception as e:
            self.logger.error(f"[Retrieval] Failed: {str(e)}")
            raise

    def _query_pinecone(
        self,
        embedding: List[float],
        user_id: str,
        top_k: int,
        filters: Optional[Dict]
    ) -> List[Dict]:
        """
        Internal method to query Pinecone.

        Args:
            embedding: Query embedding vector
            user_id: Namespace for isolation
            top_k: Number of results
            filters: Metadata filters

        Returns:
            Parsed list of chunks
        """
        try:
            self.logger.info(f"[Pinecone] Querying index for user_id={user_id}")

            # response = self.vector_store.query(
            #     vector=embedding,
            #     top_k=top_k,
            #     namespace=str(user_id),
            #     filter=filters,
            #     include_metadata=True
            # )
            response = self.vector_store.query(
                embedding=embedding,
                top_k=top_k,
                namespace=str(user_id),
                filters=filters,
                
            )

            matches = response.get("matches", [])

            parsed_results = []

            for match in matches:
                metadata = match.get("metadata", {})
        

                parsed_results.append({
                    "text": metadata.get("text", ""),
                    "score": match.get("score", 0.0),
                    "metadata": metadata
                })

            self.logger.debug(f"[Pinecone] Parsed {len(parsed_results)} matches")

            return parsed_results

        except Exception as e:
            self.logger.error(f"[Pinecone] Query failed: {str(e)}")
            raise

    def rerank_chunks(self, chunks: List[Dict]) -> List[Dict]:
        """
        Rerank retrieved chunks.

        Current Implementation:
        - Sort by similarity score (descending)

        Future:
        - Can add cross-encoder / LLM reranking

        Args:
            chunks: Retrieved chunks

        Returns:
            Reranked chunks
        """
        try:
            self.logger.info("[Rerank] Reranking chunks")

            # Sort by score (highest first)
            reranked = sorted(chunks, key=lambda x: x["score"], reverse=True)

            return reranked

        except Exception as e:
            self.logger.error(f"[Rerank] Failed: {str(e)}")
            raise

    def build_context(self, chunks: List[Dict]) -> str:
        """
        Convert retrieved chunks into LLM-ready context.

        Example Output:
        Context:
        1. ...
        2. ...
        3. ...

        Args:
            chunks: Retrieved chunks

        Returns:
            Formatted context string
        """
        try:
            self.logger.info("[Context] Building context from chunks")

            context_parts = []

            for idx, chunk in enumerate(chunks, start=1):
                text = chunk.get("text", "")
                context_parts.append(f"{idx}. {text}")

            context = "\n\n".join(context_parts)

            self.logger.debug(f"[Context] Context length: {len(context)} characters")

            return context

        except Exception as e:
            self.logger.error(f"[Context] Failed: {str(e)}")
            raise