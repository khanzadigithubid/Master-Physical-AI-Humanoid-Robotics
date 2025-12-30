"""
RAG (Retrieval Augmented Generation) Service.

Handles:
- Query embedding (Google Gemini text-embedding-004)
- Vector search (Qdrant)
- Answer generation (Google Gemini Pro)
- Citation extraction
- Confidence scoring
"""

from typing import List, Dict, Any, Optional
import structlog
import asyncio

from src.config import settings
from src.db.qdrant_client import qdrant_service
from src.services.gemini_service import gemini_service

logger = structlog.get_logger()


class RAGService:
    """Service for RAG operations."""

    async def embed_query(self, query: str) -> List[float]:
        """
        Embed query using Google Gemini.

        Args:
            query: Text to embed

        Returns:
            Embedding vector
        """
        try:
            return await gemini_service.get_embeddings(query)

        except Exception as e:
            logger.error("Embedding failed", error=str(e))
            raise

    async def search_full_book(
        self,
        query_vector: List[float],
        top_k: int = None,
    ) -> List[Dict[str, Any]]:
        """
        Search entire book corpus.

        Args:
            query_vector: Query embedding
            top_k: Number of chunks to retrieve (default from settings)

        Returns:
            List of relevant chunks with metadata
        """
        top_k = top_k or settings.RAG_TOP_K

        results = await qdrant_service.search(
            query_vector=query_vector,
            top_k=top_k,
            score_threshold=settings.RAG_SCORE_THRESHOLD,
        )

        return results

    async def search_selected_text(
        self,
        query_vector: List[float],
        chapter_filter: str,
        top_k: int = 3,
    ) -> List[Dict[str, Any]]:
        """
        Search within specific chapter (selected-text mode).

        Args:
            query_vector: Query embedding
            chapter_filter: Chapter ID to filter by
            top_k: Number of chunks to retrieve

        Returns:
            List of relevant chunks from the specified chapter
        """
        results = await qdrant_service.search(
            query_vector=query_vector,
            top_k=top_k,
            score_threshold=0.8,  # Higher threshold for precision
            filter_conditions={"chapter": chapter_filter},
        )

        return results

    def build_prompt(self, query: str, chunks: List[Dict[str, Any]], mode: str) -> str:
        """
        Build GPT-4 prompt with retrieved context.

        Args:
            query: User question
            chunks: Retrieved chunks from vector search
            mode: "full-book" or "selected-text"

        Returns:
            Formatted prompt
        """
        # Format context from chunks
        context = "\n\n".join([
            f"[Source: {chunk['chapter']} - {chunk['section']}]\n{chunk['content']}"
            for chunk in chunks
        ])

        if mode == "full-book":
            prompt = f"""You are an expert instructor in Physical AI and Humanoid Robotics.
Answer the student's question using ONLY the provided context from the textbook.

Context from textbook:
{context}

Student question: {query}

Instructions:
- Provide a clear, accurate answer
- Cite relevant chapters/sections
- If context is insufficient, state: "The textbook doesn't cover this topic in detail."
- Use technical language appropriate for university-level learners
- Include examples or equations if present in context

Answer:"""

        else:  # selected-text mode
            prompt = f"""You are a teaching assistant helping a student understand Physical AI concepts.

Context:
{context}

Student question about the context: {query}

Instructions:
- Answer the question specifically in relation to the provided context
- Reference related concepts if helpful
- Keep answer concise and focused
- If the context doesn't contain enough information, suggest where to look

Answer:"""

        return prompt

    async def generate_answer(self, prompt: str) -> Dict[str, Any]:
        """
        Generate answer using Google Gemini.

        Args:
            prompt: Formatted prompt with context

        Returns:
            Dictionary with answer
        """
        try:
            answer = await gemini_service.generate_content(
                prompt=prompt,
                system_instruction="You are an expert in Physical AI and Humanoid Robotics."
            )

            logger.info("Answer generated")

            return {
                "answer": answer,
                "tokens_used": 0, # Gemini service handles cost tracking differently
                "cost_usd": 0,
            }

        except Exception as e:
            logger.error("Answer generation failed", error=str(e))
            return {
                "answer": f"I'm sorry, I encountered an error while generating output: {str(e)}",
                "tokens_used": 0,
                "cost_usd": 0,
            }

    def calculate_confidence(self, chunks: List[Dict[str, Any]]) -> float:
        """
        Calculate confidence score based on retrieval results.

        Args:
            chunks: Retrieved chunks with scores

        Returns:
            Confidence score (0-1)
        """
        if not chunks:
            return 0.0

        top_score = chunks[0]["score"]
        avg_score = sum(chunk["score"] for chunk in chunks) / len(chunks)

        # High confidence: top result >0.85, avg >0.75
        if top_score > 0.85 and avg_score > 0.75:
            return 0.95

        # Medium confidence: top result >0.7, avg >0.6
        if top_score > 0.7 and avg_score > 0.6:
            return 0.75

        # Low confidence: otherwise
        return 0.5

    def extract_citations(self, chunks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Extract unique citations from chunks.

        Args:
            chunks: Retrieved chunks

        Returns:
            List of unique citations with chapter, section, score
        """
        citations = {}

        for chunk in chunks:
            key = f"{chunk['chapter']}:{chunk['section']}"

            if key not in citations or chunk["score"] > citations[key]["score"]:
                citations[key] = {
                    "chapter": chunk["chapter"],
                    "section": chunk["section"],
                    "score": chunk["score"],
                    "url": f"/docs/{chunk['file_path']}"
                }

        return list(citations.values())


# Global RAG service instance
rag_service = RAGService()
