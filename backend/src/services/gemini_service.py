"""
Google Gemini API service implementation.
"""

from google import genai
from google.genai import types
from typing import List, Optional, Any
import asyncio
from src.config import settings

class GeminiService:
    """Service for interacting with Google Gemini API."""

    def __init__(self):
        self.model_name = "gemini-1.5-flash-002"  # Updated model name
        self.embedding_model = "text-embedding-004"
        self.timeout = 15.0  # seconds

        # Initialize client
        self.client = genai.Client(
            api_key=settings.GOOGLE_API_KEY,
            http_options={'timeout': 15.0}  # seconds
        ) if settings.GOOGLE_API_KEY else None

    async def generate_content(
        self,
        prompt: str,
        system_instruction: Optional[str] = None
    ) -> str:
        """
        Generate content using Gemini model with timeout and error handling.
        """
        if not self.client:
            return "Error: Gemini API key not configured."

        try:
            # Use asyncio.wait_for for explicit timeout handling
            response = await asyncio.wait_for(
                self.client.aio.models.generate_content(
                    model=self.model_name,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        system_instruction=system_instruction,
                        temperature=0.3
                    )
                ),
                timeout=self.timeout
            )

            if response and response.text:
                return response.text
            return "AI failed to generate a response."

        except asyncio.TimeoutError:
            return "Error: AI request timed out."
        except Exception as e:
            return f"Error calling Gemini: {str(e)}"

    async def get_embeddings(self, text: str) -> List[float]:
        """
        Get embeddings for text using Gemini.
        """
        if not self.client:
            raise Exception("Gemini API key not configured.")

        try:
            response = await asyncio.wait_for(
                self.client.aio.models.embed_content(
                    model=self.embedding_model,
                    contents=text,
                    config=types.EmbedContentConfig(
                        task_type="RETRIEVAL_DOCUMENT"
                    )
                ),
                timeout=30.0
            )
            # Accessing embeddings from the new response format
            return response.embeddings[0].values
        except Exception as e:
            raise Exception(f"Failed to get embeddings: {str(e)}")

    async def get_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        """
        Get embeddings for a batch of texts.
        """
        if not self.client:
            raise Exception("Gemini API key not configured.")

        try:
            response = await asyncio.wait_for(
                self.client.aio.models.embed_content(
                    model=self.embedding_model,
                    contents=texts,
                    config=types.EmbedContentConfig(
                        task_type="RETRIEVAL_DOCUMENT"
                    )
                ),
                timeout=60.0
            )
            return [e.values for e in response.embeddings]
        except Exception as e:
            raise Exception(f"Failed to get batch embeddings: {str(e)}")

gemini_service = GeminiService()
