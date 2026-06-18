from typing import List, Dict
from openai import OpenAI
from app.services.logger_service import get_logger


from app.core.config import settings
from app.api.dependencies import get_pinecone_index





class EmbeddingService:
    """
    Service responsible for generating embeddings and storing them in Pinecone.
    """

    def __init__(self, pinecone_index):
        """
        Initialize EmbeddingService.

        Args:
            pinecone_index: Pinecone index instance
        """
        self.index = get_pinecone_index
        self.logger = get_logger("embedding_service")
        self.batch_size = settings.EMBEDDING_BATCH_SIZE
        self.model = settings.EMBEDDING_MODEL
        self.key = settings.OPENAI_API_KEY

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

                # Step 4: Store in Pinecone
                self.store_embeddings(vectors)

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
            client = OpenAI(api_key=self.key)

            self.logger.debug(f"Generating embeddings for batch of size {len(texts)}")

            response = client.embeddings.create(
                model=self.model,
                input=texts
            )

            embeddings = [item.embedding for item in response.data]

            return embeddings

        except Exception as e:
            self.logger.error(f"Embedding generation failed: {str(e)}")
            raise


    def create_vector_payload(
        self,
        chunks: List[Dict],
        embeddings: List[List[float]]
    ) -> List[Dict]:
        """
        Create Pinecone-compatible vector payload from chunks and embeddings.

        This method:
        - Maps each chunk to its corresponding embedding
        - Prepares data in Pinecone upsert format

        Args:
            chunks (List[Dict]): List of chunk dictionaries
            embeddings (List[List[float]]): Corresponding embedding vectors

        Returns:
            List[Dict]: List of vectors ready for Pinecone upsert
        """

        if not chunks or not embeddings:
            self.logger.warning("Empty chunks or embeddings received")
            return []

        # Strict validation (important)
        if len(chunks) != len(embeddings):
            self.logger.error(
                f"Mismatch: {len(chunks)} chunks vs {len(embeddings)} embeddings"
            )
            raise ValueError("Chunks and embeddings length mismatch")

        try:
            vectors = []

            for chunk, embedding in zip(chunks, embeddings):
                vector = {
                    "id": chunk["id"],
                    "values": embedding,
                    "metadata": chunk["metadata"]
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

    
    def store_embeddings(self, vectors: list) -> None:
        """
        Store embedding vectors in Pinecone.

        This method:
        - Retrieves Pinecone index instance
        - Upserts vectors into the index

        Args:
            vectors (list): List of vector payloads
        """

        if not vectors:
            self.logger.warning("No vectors to store in Pinecone")
            return

        try:
            # Get Pinecone index from dependency
            index = self.index  # already passed via constructor

            self.logger.debug(f"Upserting {len(vectors)} vectors to Pinecone")

            # Upsert vectors
            index.upsert(vectors=vectors)

            self.logger.info(f"Successfully stored {len(vectors)} vectors in Pinecone")

        except Exception as e:
            self.logger.error(f"Pinecone upsert failed: {str(e)}")
            raise