"""
Book content ingestion service.

Handles:
- Reading markdown files from book/docs/
- Extracting frontmatter and content
- Chunking text (512 tokens, 50 overlap)
- Embedding chunks with OpenAI
- Upserting to Qdrant

Usage:
    python -m src.scripts.ingest_book
"""

import asyncio
from pathlib import Path
from typing import List, Dict, Any
import hashlib
import re
import structlog
import frontmatter

from src.config import settings
from src.db.qdrant_client import qdrant_service
from src.services.gemini_service import gemini_service

logger = structlog.get_logger()


class IngestionService:
    """Service for ingesting book content into Qdrant."""

    def __init__(self, book_docs_path: str = None):
        """
        Initialize ingestion service.

        Args:
            book_docs_path: Path to book/docs directory (defaults to ../book/docs from backend)
        """
        if book_docs_path:
            self.book_docs_path = Path(book_docs_path)
        else:
            # Default: assume backend/ and book/ are siblings
            backend_root = Path(__file__).parent.parent.parent
            self.book_docs_path = backend_root.parent / "book" / "docs"

        logger.info("Ingestion service initialized", docs_path=str(self.book_docs_path))

    def extract_markdown_files(self) -> List[Path]:
        """
        Find all markdown files in book/docs directory.

        Returns:
            List of markdown file paths
        """
        md_files = list(self.book_docs_path.rglob("*.md"))

        logger.info("Found markdown files", count=len(md_files))

        return md_files

    def extract_content(self, file_path: Path) -> Dict[str, Any]:
        """
        Extract content and metadata from markdown file.

        Args:
            file_path: Path to markdown file

        Returns:
            Dictionary with content and metadata
        """
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                post = frontmatter.load(f)

            # Extract metadata from frontmatter
            metadata = {
                "title": post.get("title", ""),
                "sidebar_position": post.get("sidebar_position", 0),
                "file_path": str(file_path.relative_to(self.book_docs_path.parent)),
            }

            # Infer chapter/section from file path
            parts = file_path.relative_to(self.book_docs_path).parts
            if len(parts) >= 2:
                metadata["chapter"] = parts[0]  # e.g., "02-robotics-fundamentals"
                metadata["section"] = file_path.stem  # e.g., "kinematics"
            elif len(parts) == 1:
                metadata["chapter"] = "root"
                metadata["section"] = file_path.stem

            content = post.content

            logger.info("Extracted content", file=str(file_path), length=len(content))

            return {
                "content": content,
                "metadata": metadata,
            }

        except Exception as e:
            logger.error("Failed to extract content", file=str(file_path), error=str(e))
            raise

    def chunk_text(self, text: str, chunk_size: int = 2000, overlap: int = 200) -> List[str]:
        """
        Chunk text into overlapping segments by characters (simpler for Gemini).

        Args:
            text: Text to chunk
            chunk_size: Maximum characters per chunk
            overlap: Overlap characters between chunks

        Returns:
            List of text chunks
        """
        chunks = []
        start = 0

        while start < len(text):
            end = start + chunk_size
            chunk = text[start:end]
            chunks.append(chunk)

            # Move forward with overlap
            start = end - overlap

        logger.info("Chunked text", chunks_count=len(chunks), total_chars=len(text))

        return chunks

    async def embed_text(self, text: str) -> List[float]:
        """
        Embed text using Google Gemini.

        Args:
            text: Text to embed

        Returns:
            Embedding vector
        """
        try:
            return await gemini_service.get_embeddings(text)

        except Exception as e:
            logger.error("Embedding failed", error=str(e))
            raise

    def generate_chunk_id(self, text: str, index: int) -> int:
        """
        Generate unique integer ID for chunk.

        Args:
            text: Chunk text
            index: Chunk index

        Returns:
            Integer ID (hash of content)
        """
        # Create hash from content + index
        hash_input = f"{text}_{index}".encode("utf-8")
        hash_hex = hashlib.md5(hash_input).hexdigest()

        # Convert to integer (take first 12 hex chars to avoid overflow)
        return int(hash_hex[:12], 16)

    async def process_file(self, file_path: Path) -> List[Dict[str, Any]]:
        """
        Process a single markdown file into chunks with embeddings.

        Args:
            file_path: Path to markdown file

        Returns:
            List of chunk dictionaries ready for Qdrant
        """
        # Extract content
        book_chunk = self.extract_content(file_path)

        # Chunk content
        chunks = self.chunk_text(book_chunk["content"])

        # Prepare chunks for embedding
        chunk_dicts = []

        for idx, chunk_text in enumerate(chunks):
            # Add context to chunk
            contextualized = f"""
Chapter: {book_chunk['metadata'].get('chapter', 'Unknown')}
Section: {book_chunk['metadata'].get('section', 'Unknown')}
Title: {book_chunk['metadata'].get('title', 'Unknown')}

{chunk_text}
""".strip()

            # Embed
            vector = await self.embed_text(contextualized)

            # Generate ID
            chunk_id = self.generate_chunk_id(contextualized, idx)

            # Create chunk dict
            chunk_dict = {
                "id": chunk_id,
                "vector": vector,
                "payload": {
                    "content": contextualized,
                    "chapter": book_chunk["metadata"].get("chapter", ""),
                    "section": book_chunk["metadata"].get("section", ""),
                    "title": book_chunk["metadata"].get("title", ""),
                    "file_path": book_chunk["metadata"].get("file_path", ""),
                    "chunk_index": idx,
                    "chunk_count": len(chunks),
                },
            }

            chunk_dicts.append(chunk_dict)

        logger.info(
            "Processed file",
            file=str(file_path),
            chunks=len(chunk_dicts),
        )

        return chunk_dicts

    async def ingest_book(self):
        """
        Main ingestion pipeline: process all markdown files and upsert to Qdrant.
        """
        logger.info("Starting book ingestion")

        # Ensure collection exists
        await qdrant_service.create_collection()

        # Find all markdown files
        md_files = self.extract_markdown_files()

        if not md_files:
            logger.warning("No markdown files found", path=str(self.book_docs_path))
            return

        total_chunks = 0

        # Process each file
        for file_path in md_files:
            try:
                # Process file into chunks
                chunks = await self.process_file(file_path)

                # Upsert to Qdrant (batch)
                await qdrant_service.upsert_chunks(chunks)

                total_chunks += len(chunks)

                logger.info(
                    "Ingested file",
                    file=str(file_path.relative_to(self.book_docs_path)),
                    chunks=len(chunks),
                )

            except Exception as e:
                logger.error(
                    "Failed to process file",
                    file=str(file_path),
                    error=str(e),
                )
                # Continue with other files

        logger.info("Book ingestion complete", total_chunks=total_chunks, files=len(md_files))

        return {
            "files_processed": len(md_files),
            "total_chunks": total_chunks,
        }


# Global ingestion service instance
ingestion_service = IngestionService()


# CLI usage
if __name__ == "__main__":
    async def main():
        result = await ingestion_service.ingest_book()
        print(f"Ingestion complete: {result}")

    asyncio.run(main())
