"""
Google Gemini API service implementation.
"""

from google import genai
from google.genai import types
from typing import List, Optional, Any
import asyncio
import structlog
import certifi
import ssl

from src.config import settings

logger = structlog.get_logger()


class GeminiService:
    """Service for interacting with Google Gemini API."""

    def __init__(self):
        # Use stable, available models (verified working with this API key)
        self.model_name = "gemini-2.5-flash"  # Latest stable, verified working
        self.fallback_model_name = "gemini-flash-latest"  # Alias to latest flash
        self.embedding_model = "text-embedding-004"  # Stable embedding model
        self.timeout = 60.0  # Increased timeout for network issues
        self.max_retries = 3
        self.base_delay = 1.0  # Base delay for exponential backoff

        # Initialize client
        self.client = None
        self._initialize_client()

    def _initialize_client(self):
        """Initialize or reinitialize the Gemini client."""
        try:
            api_key = getattr(settings, 'GOOGLE_API_KEY', None)
            if api_key:
                # Use environment variable to set SSL CA bundle for the underlying httpx/aiohttp
                import os
                os.environ['SSL_CERT_FILE'] = certifi.where()

                # Initialize client without extra validation-sensitive fields
                self.client = genai.Client(api_key=api_key)
                logger.info("Gemini client initialized successfully", model=self.model_name)
            else:
                logger.warning("GOOGLE_API_KEY not configured")
        except Exception as e:
            logger.error("Failed to initialize Gemini client", error=str(e))
            self.client = None

    def is_available(self) -> bool:
        """Check if the Gemini service is available."""
        return self.client is not None and bool(getattr(settings, 'GOOGLE_API_KEY', None))

    async def _generate_with_retry(
        self,
        prompt: str,
        system_instruction: Optional[str],
        model: str
    ) -> str:
        """
        Generate content with exponential backoff retry logic and model fallback.

        Args:
            prompt: User prompt
            system_instruction: Optional system instruction
            model: Model name to use

        Returns:
            Generated content or error message

        Raises:
            Exception: If all retries fail
        """
        last_error = None

        # Try primary model, then fallback model
        models_to_try = [model, self.fallback_model_name] if model != self.fallback_model_name else [model]

        for model_to_try in models_to_try:
            for attempt in range(self.max_retries):
                try:
                    response = await asyncio.wait_for(
                        self.client.aio.models.generate_content(
                            model=model_to_try,
                            contents=prompt,
                            config=types.GenerateContentConfig(
                                system_instruction=system_instruction,
                                temperature=0.3
                            )
                        ),
                        timeout=self.timeout
                    )

                    if response and response.text:
                        logger.info(f"Gemini generation successful with {model_to_try}")
                        return response.text
                    else:
                        raise Exception("Empty response from API")

                except asyncio.TimeoutError as e:
                    last_error = e
                    delay = self.base_delay * (2 ** attempt)  # Exponential backoff
                    logger.warning(
                        f"Gemini request timeout (attempt {attempt + 1}/{self.max_retries})",
                        model=model_to_try,
                        timeout=self.timeout,
                        retry_delay=delay
                    )
                    if attempt < self.max_retries - 1:
                        await asyncio.sleep(delay)

                except Exception as e:
                    last_error = e
                    error_str = str(e).lower()

                    # Check if this is a model not found error - try fallback model
                    if "model" in error_str and ("not found" in error_str or "not available" in error_str):
                        if model_to_try != self.fallback_model_name:
                            logger.info(f"Model {model_to_try} not available, trying fallback {self.fallback_model_name}")
                            break  # Break inner loop, try fallback model
                        else:
                            # Fallback model also not available
                            logger.error(f"Fallback model {model_to_try} also not available")
                            raise Exception(f"All Gemini models unavailable. Last error: {error_str}")

                    delay = self.base_delay * (2 ** attempt)
                    logger.warning(
                        f"Gemini request failed (attempt {attempt + 1}/{self.max_retries})",
                        model=model_to_try,
                        error=str(e),
                        retry_delay=delay
                    )
                    if attempt < self.max_retries - 1:
                        await asyncio.sleep(delay)

            # If we broke out due to model not found, continue to next model
            if last_error and "model" in str(last_error).lower() and ("not found" in str(last_error).lower() or "not available" in str(last_error).lower()):
                if model_to_try != self.fallback_model_name:
                    continue
            # If we didn't break or continue, this model worked - return
            if last_error is None:
                return None  # Should not happen, but keeps type checker happy
        # End of models loop

        error_type = type(last_error).__name__ if last_error else "Unknown"
        error_msg = str(last_error) if last_error else "No details"
        raise Exception(
            f"Gemini request failed after all retries. "
            f"Last error: {error_type} - {error_msg}. "
            "Check network connectivity or API key validity."
        )

    async def generate_content(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        raise_on_error: bool = False
    ) -> str:
        """
        Generate content using Gemini model with retry logic and error handling.

        Args:
            prompt: User prompt
            system_instruction: Optional system instruction
            raise_on_error: If True, raise exception on failure; if False, return error string

        Returns:
            Generated content or error message

        Raises:
            Exception: If raise_on_error is True and API call fails
        """
        if not self.client:
            error_msg = "Gemini API key not configured. Set GOOGLE_API_KEY in .env"
            if raise_on_error:
                raise Exception(error_msg)
            return f"Error: {error_msg}"

        try:
            # Use retry logic with exponential backoff
            result = await self._generate_with_retry(
                prompt=prompt,
                system_instruction=system_instruction,
                model=self.model_name
            )
            return result

        except Exception as e:
            error_msg = str(e)
            logger.error("Gemini API call failed", error=error_msg)
            if raise_on_error:
                raise Exception(f"Gemini API error: {error_msg}")
            return f"Error: {error_msg}"

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
