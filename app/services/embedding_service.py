from typing import List, Dict
from openai import OpenAI
from app.services.logger_service import get_logger
from app.services.vector_service import VectorStoreService

from app.core.config import settings
from app.api.dependencies import get_pinecone_index





class EmbeddingService:
    """
    Service responsible for generating embeddings and storing them in Pinecone.
    """

    def __init__(self,vector_store:VectorStoreService):
        """
        Initialize EmbeddingService.

        Args:
            pinecone_index: Pinecone index instance
        """
        self.logger = get_logger("embedding_service")
        self.vector_store = vector_store
        self.batch_size = settings.EMBEDDING_BATCH_SIZE
        self.model = settings.EMBEDDING_MODEL
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)

    def process_chunks(self, chunks: List[Dict]) -> Dict:
        """
        Main entry point for embedding pipeline.

        This method:
        1. Batches chunks
        2. Generates embeddings
        3. Stores vectors in Pinecone

        Args:
            chunks (List[Dict]): List of chunk dictionaries

        Returns:
            Dict: Status response with processed count
        """

        if not chunks:
            self.logger.warning("No chunks received for embedding")
            return {"status": "no_data", "processed": 0}

        self.logger.info(f"Starting embedding for {len(chunks)} chunks")

        total_processed = 0

        try:
            # Batch processing
            for i in range(0, len(chunks), self.batch_size):
                batch = chunks[i:i + self.batch_size]

                self.logger.debug(f"Processing batch {i // self.batch_size + 1}")

                # Step 1: Extract texts
                texts = [chunk["text"] for chunk in batch]

                # Step 2: Generate embeddings
                embeddings = self.generate_embeddings(texts)

                # Step 3: Create vector payload
                vectors = self.create_vector_payload(batch, embeddings)

                user_ids = set(chunk["metadata"].get("user_id", "default") for chunk in batch)

                if len(user_ids) != 1:
                    raise ValueError("Batch contains multiple user_ids")

                namespace = user_ids.pop()

                # Step 4: Store in Pinecone
                self.vector_store.upsert(vectors=vectors, namespace=namespace)  

                total_processed += len(batch)

            self.logger.info(f"Embedding completed. Total processed: {total_processed}")

            return {
                "status": "success",
                "processed": total_processed
            }

        except Exception as e:
            self.logger.error(f"Embedding process failed: {str(e)}")
            raise

    from openai import OpenAI


    def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        """
        Generate embeddings for a batch of text inputs using OpenAI.

        Args:
            texts (List[str]): List of text strings

        Returns:
            List[List[float]]: List of embedding vectors
        """

        if not texts:
            self.logger.warning("Empty text list received for embedding")
            return []

        try:
            # Initialize OpenAI client (can be moved to __init__ later)

            self.logger.debug(f"Generating embeddings for batch of size {len(texts)}")

            response = self.client.embeddings.create(
                model=self.model,
                input=texts
            )

            embeddings = [item.embedding for item in response.data]

            return embeddings

        except Exception as e:
            self.logger.error(f"Embedding generation failed: {str(e)}")
            raise


    def create_vector_payload(self,chunks: List[Dict],embeddings: List[List[float]]) -> List[Dict]:

        if not chunks or not embeddings:
            self.logger.warning("Empty chunks or embeddings received")
            return []

        if len(chunks) != len(embeddings):
            self.logger.error(
                f"Mismatch: {len(chunks)} chunks vs {len(embeddings)} embeddings"
            )
            raise ValueError("Chunks and embeddings length mismatch")

        try:
            vectors = []

            for chunk, embedding in zip(chunks, embeddings):
                metadata = chunk.get("metadata", {})

                # ✅ Safe extraction
                text = chunk.get("text", "")
                user_id = str(metadata.get("user_id", ""))
                document_id = metadata.get("document_id", "")
                page_number = metadata.get("page_number", 0)
                chunk_index = metadata.get("chunk_index", 0)

                # ✅ Build vector
                vector = {
                    "id": chunk.get("id"),
                    "values": embedding,
                    "metadata": {
                        "text": text,  # 🔥 REQUIRED for retrieval
                        "user_id": user_id,
                        "document_id": document_id,
                        "page_number": page_number,
                        "chunk_index": chunk_index,
                    },
                }

                vectors.append(vector)

            self.logger.debug(f"Created {len(vectors)} vector payloads")
            return vectors

        except KeyError as e:
            self.logger.error(f"Missing key in chunk data: {str(e)}")
            raise

        except Exception as e:
            self.logger.error(f"Vector payload creation failed: {str(e)}")
            raise

        