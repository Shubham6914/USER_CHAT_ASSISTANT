from typing import List, Dict
from app.core.config import settings  # assuming config is here
from app.services.logger_service import get_logger

import fitz  # PyMuPDF
from docx import Document
import os

import tiktoken  # for token counting

class ChunkingService:
    """
    Service responsible for processing documents into chunks
    for downstream embedding and retrieval.
    """

    def __init__(self):
        """
        Initialize ChunkingService with configuration and logger.
        """
        self.chunk_size = settings.chunk_size
        self.chunk_overlap = settings.chunk_overlap
        self.encoding = tiktoken.get_encoding("cl100k_base")
        self.logger = get_logger("chunking_service")

    def process_document(self, document: Dict) -> List[Dict]:
        """
        Main entry point for chunking a document.

        This method orchestrates the full pipeline:
        1. Extract text from document
        2. Handle small document case
        3. Build chunks using hybrid strategy
        4. Apply overlap
        5. Return structured chunk output

        Args:
            document (Dict): Document metadata containing:
                - doc_id (UUID)
                - user_id (int)
                - file_path (str)

        Returns:
            List[Dict]: List of chunks with text and metadata
        """

        self.logger.info(f"Starting chunking for document: {document['doc_id']}")

        try:
            # Step 1: Extract text (page-wise)
            pages = self.extract_text(document["file_path"])
            self.logger.info(f"Extracted {len(pages)} pages from document")

            # Step 2: Combine all text for small doc check
            full_text = " ".join([page["text"] for page in pages])

            total_tokens = self.count_tokens(full_text)
            self.logger.info(f"Total tokens in document: {total_tokens}")

            # Step 3: Small document handling
            if total_tokens <= self.chunk_size:
                self.logger.info("Document is small, creating single chunk")

                chunk = {
                    "id": f"{document['doc_id']}_0",
                    "text": full_text,
                    "metadata": self.build_metadata(
                        document=document,
                        page_number=1,
                        chunk_index=0
                    )
                }

                return [chunk]

            # Step 4: Build chunks
            chunks = self.build_chunks(pages, document)
            self.logger.info(f"Built {len(chunks)} chunks before overlap")

            # Step 5: Apply overlap
            chunks = self.apply_overlap(chunks)
            self.logger.info(f"Final chunks after overlap: {len(chunks)}")

            return chunks

        except Exception as e:
            self.logger.error(f"Chunking failed for document {document['doc_id']}: {str(e)}")
            raise
    
    def extract_text(self, file_path: str) -> list:
        """
        Extract text from a document (PDF or DOCX) and return page-wise content.

        Supports:
        - PDF via PyMuPDF
        - DOCX via python-docx

        Args:
            file_path (str): Path to the document file

        Returns:
            List[Dict]: List of pages with structure:
                [
                    {"page_number": 1, "text": "..."},
                    ...
                ]

        Raises:
            ValueError: If file type is unsupported
            Exception: If extraction fails
        """

        self.logger.info(f"Starting text extraction for file: {file_path}")

        if not os.path.exists(file_path):
            self.logger.error(f"File not found: {file_path}")
            raise FileNotFoundError(f"File not found: {file_path}")

        pages = []

        try:
            # -------- PDF Handling --------
            if file_path.lower().endswith(".pdf"):
                self.logger.info("Detected PDF file")

                doc = fitz.open(file_path)

                for page_num, page in enumerate(doc, start=1):
                    text = page.get_text("text").strip()

                    if text:  # avoid empty pages
                        pages.append({
                            "page_number": page_num,
                            "text": text
                        })

                doc.close()

                self.logger.info(f"Extracted {len(pages)} non-empty pages from PDF")

            # -------- DOCX Handling --------
            elif file_path.lower().endswith(".docx"):
                self.logger.info("Detected DOCX file")

                doc = Document(file_path)

                full_text = []

                for para in doc.paragraphs:
                    text = para.text.strip()
                    if text:
                        full_text.append(text)

                combined_text = "\n\n".join(full_text)

                if combined_text:
                    pages.append({
                        "page_number": 1,
                        "text": combined_text
                    })

                self.logger.info("Extracted text from DOCX as single page")

            else:
                self.logger.error("Unsupported file type")
                raise ValueError("Unsupported file type. Only PDF and DOCX are allowed.")

            if not pages:
                self.logger.warning("No text extracted from document")

            return pages

        except Exception as e:
            self.logger.error(f"Text extraction failed: {str(e)}")
            raise


    def count_tokens(self, text: str) -> int:
        """
        Count the number of tokens in a given text using tiktoken.

        This ensures accurate token measurement aligned with embedding models.

        Args:
            text (str): Input text

        Returns:
            int: Number of tokens
        """

        if not text:
            return 0

        try:
            # Using cl100k_base (used by OpenAI embeddings like text-embedding-3)
            encoding = tiktoken.get_encoding("cl100k_base")
            tokens = encoding.encode(text)
            return len(tokens)

        except Exception as e:
            self.logger.error(f"Token counting failed: {str(e)}")
            raise

    def split_into_paragraphs(self, text: str) -> list:
        """
        Split raw text into cleaned paragraphs.

        This method performs:
        1. Basic normalization of text (line endings, trimming)
        2. Splitting based on double newline (\n\n)
        3. Cleaning and filtering empty paragraphs

        Args:
            text (str): Raw extracted text

        Returns:
            List[str]: List of cleaned paragraphs
        """

        if not text:
            self.logger.warning("Empty text received for paragraph splitting")
            return []

        try:
            # Step 1: Normalize line endings
            normalized_text = text.replace("\r\n", "\n").strip()

            # Step 2: Split into paragraphs
            raw_paragraphs = normalized_text.split("\n\n")

            # Step 3: Clean and filter
            paragraphs = [
                para.strip()
                for para in raw_paragraphs
                if para.strip()
            ]

            self.logger.debug(f"Split text into {len(paragraphs)} paragraphs")

            return paragraphs

        except Exception as e:
            self.logger.error(f"Paragraph splitting failed: {str(e)}")
            raise
    
    def build_chunks(self, pages: list, document: dict) -> list:
        """
        Build chunks from extracted pages using hybrid chunking strategy.

        Process:
        1. Iterate page by page
        2. Split each page into paragraphs
        3. Merge paragraphs until token limit is reached
        4. Handle large paragraphs via fallback splitting
        5. Attach metadata to each chunk

        Args:
            pages (list): List of page dictionaries
            document (dict): Document metadata (doc_id, user_id, file_path)

        Returns:
            List[Dict]: List of chunks (without overlap applied)
        """

        chunks = []
        chunk_index = 0

        try:
            for page in pages:
                page_number = page["page_number"]
                text = page["text"]

                paragraphs = self.split_into_paragraphs(text)

                current_chunk = ""
                current_tokens = 0

                for para in paragraphs:
                    para_tokens = self.count_tokens(para)

                    # Case 1: Paragraph fits in current chunk
                    if current_tokens + para_tokens <= self.chunk_size:
                        current_chunk += " " + para if current_chunk else para
                        current_tokens += para_tokens

                    else:
                        # Save current chunk if not empty
                        if current_chunk:
                            chunks.append({
                                "id": f"{document['doc_id']}_{chunk_index}",
                                "text": current_chunk.strip(),
                                "metadata": self.build_metadata(
                                    document=document,
                                    page_number=page_number,
                                    chunk_index=chunk_index
                                )
                            })
                            chunk_index += 1

                        # Case 2: Paragraph itself is too large → split it
                        if para_tokens > self.chunk_size:
                            split_parts = self.split_large_text(para)

                            for part in split_parts:
                                chunks.append({
                                    "id": f"{document['doc_id']}_{chunk_index}",
                                    "text": part.strip(),
                                    "metadata": self.build_metadata(
                                        document=document,
                                        page_number=page_number,
                                        chunk_index=chunk_index
                                    )
                                })
                                chunk_index += 1

                            current_chunk = ""
                            current_tokens = 0

                        else:
                            # Start new chunk with this paragraph
                            current_chunk = para
                            current_tokens = para_tokens

                # After finishing page → flush remaining chunk
                if current_chunk:
                    chunks.append({
                        "id": f"{document['doc_id']}_{chunk_index}",
                        "text": current_chunk.strip(),
                        "metadata": self.build_metadata(
                            document=document,
                            page_number=page_number,
                            chunk_index=chunk_index
                        )
                    })
                    chunk_index += 1

            self.logger.info(f"Built {len(chunks)} chunks from document")

            return chunks

        except Exception as e:
            self.logger.error(f"Chunk building failed: {str(e)}")
            raise

    def split_large_text(self, text: str) -> list:
        """
        Split large text into smaller chunks based on token limits.

        Uses fixed token window with overlap to ensure:
        - No chunk exceeds chunk_size
        - Context continuity is preserved via overlap

        Args:
            text (str): Large text (paragraph) exceeding chunk size

        Returns:
            List[str]: List of smaller text chunks
        """

        if not text:
            return []

        try:
            encoding = self.encoding  # assume initialized in __init__
            tokens = encoding.encode(text)

            chunks = []
            start = 0
            total_tokens = len(tokens)

            while start < total_tokens:
                end = start + self.chunk_size
                chunk_tokens = tokens[start:end]

                chunk_text = encoding.decode(chunk_tokens)
                chunks.append(chunk_text)

                # move window with overlap
                start += self.chunk_size - self.chunk_overlap

            self.logger.debug(f"Split large text into {len(chunks)} chunks")

            return chunks

        except Exception as e:
            self.logger.error(f"Large text splitting failed: {str(e)}")
            raise

    def apply_overlap(self, chunks: list) -> list:
        """
        Apply overlap between consecutive chunks to preserve context continuity.

        This function modifies chunk text by prepending overlap tokens
        from the previous chunk.

        Args:
            chunks (list): List of chunk dictionaries

        Returns:
            List[Dict]: Updated chunks with overlap applied
        """

        if not chunks:
            return []

        try:
            updated_chunks = []

            for i, chunk in enumerate(chunks):
                # First chunk → no overlap
                if i == 0:
                    updated_chunks.append(chunk)
                    continue

                prev_chunk = updated_chunks[i - 1]

                prev_tokens = self.encoding.encode(prev_chunk["text"])

                # Take last N tokens from previous chunk
                overlap_tokens = prev_tokens[-self.chunk_overlap:]

                overlap_text = self.encoding.decode(overlap_tokens)

                # Prepend overlap to current chunk
                new_text = overlap_text + " " + chunk["text"]

                updated_chunk = {
                    "id": chunk["id"],
                    "text": new_text.strip(),
                    "metadata": chunk["metadata"]
                }

                updated_chunks.append(updated_chunk)

            self.logger.debug(f"Applied overlap to {len(updated_chunks)} chunks")

            return updated_chunks

        except Exception as e:
            self.logger.error(f"Overlap application failed: {str(e)}")
            raise
    
    def build_metadata(
        self,
        document: dict,
        page_number: int,
        chunk_index: int
    ) -> dict:
        """
        Build metadata for a given chunk.

        Metadata is used for:
        - filtering in vector DB (Pinecone)
        - traceability of chunks
        - future retrieval and citation

        Args:
            document (dict): Document info containing:
                - doc_id (UUID)
                - user_id (int)
            page_number (int): Page number of the chunk
            chunk_index (int): Index of the chunk within the document

        Returns:
            dict: Metadata dictionary
        """

        try:
            metadata = {
                "user_id": document["user_id"],
                "document_id": str(document["doc_id"]),  # ensure string for Pinecone
                "page_number": page_number,
                "chunk_index": chunk_index
            }

            return metadata

        except KeyError as e:
            self.logger.error(f"Missing key in document metadata: {str(e)}")
            raise

        except Exception as e:
            self.logger.error(f"Metadata building failed: {str(e)}")
            raise