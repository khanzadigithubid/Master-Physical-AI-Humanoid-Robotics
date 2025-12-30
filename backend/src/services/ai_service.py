"""
AI Service for Personalization and Translation.
"""

from typing import List, Dict, Any, Optional
from anthropic import AsyncAnthropic
import structlog
import asyncio

from src.config import settings
from src.services.gemini_service import gemini_service

logger = structlog.get_logger()

# Initialize API clients
anthropic_client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)

class AIService:
    """Service for AI-powered personalization and translation."""

    async def personalize_chapter(
        self,
        original_markdown: str,
        software_background: str,
        hardware_background: str
    ) -> Dict[str, str]:
        """
        Personalize chapter content based on user background.
        Returns a dictionary with 'content' and 'summary'.
        """
        prompt = f"""You are an expert instructor in Physical AI and Humanoid Robotics.
Personalize the following markdown chapter for a student with the following background:
- Software Background: {software_background}
- Hardware Background: {hardware_background}

Instructions:
1. Adjust the depth of explanations.
2. If software background is advanced, use more complex code examples.
3. If hardware background is professional, include more details on sensors and actuators.
4. If beginner, use more analogies and simplify concepts.
5. Preserve all technical accuracy.
6. Provide a concise 2-3 sentence summary of the adaptations made for this specific user.
7. Format the output as follows:
[SUMMARY]
Your summary here...
[CONTENT]
The personalized markdown content...

Original Content:
{original_markdown}

Personalized Content:"""

        try:
            # Using Gemini instead of OpenAI
            raw_output = await gemini_service.generate_content(
                prompt=prompt,
                system_instruction="You are a senior AI educator specializing in robotics."
            )

            # Parse summary and content
            summary = ""
            content = raw_output

            if "[SUMMARY]" in raw_output and "[CONTENT]" in raw_output:
                parts = raw_output.split("[CONTENT]")
                summary = parts[0].replace("[SUMMARY]", "").strip()
                content = parts[1].strip()

            return {
                "content": content,
                "summary": summary
            }
        except Exception as e:
            logger.error("Personalization failed", error=str(e))
            return {
                "content": original_markdown,
                "summary": "Original content provided due to adaptation error."
            }

    async def translate_to_urdu(self, content: str) -> str:
        """
        Translate markdown content to Urdu while preserving technical terms.
        """
        prompt = f"""Translate the following Physical AI and Robotics textbook content to Urdu.

Technical Requirements:
1. Translate English into formal academic Urdu.
2. PRESERVE technical terms in English (e.g., ROS 2, Gazebo, Isaac Sim, Kinematics, VLA, Actuator, SLAM, etc.).
3. Maintain technical accuracy.
4. Avoid literal word-by-word translation; use natural-sounding academic Urdu phrasing.
5. Return ONLY the translated markdown content.

Content to translate:
{content}

Translated Content (Urdu):"""

        try:
            # Using Claude for better multilingual/translation capabilities
            # Wrap in wait_for for timeout
            message = await asyncio.wait_for(
                anthropic_client.messages.create(
                    model=settings.CLAUDE_MODEL,
                    max_tokens=4000,
                    temperature=0,
                    system="You are a professional Urdu translator specializing in technical robotics scientific literature.",
                    messages=[
                        {"role": "user", "content": prompt}
                    ]
                ),
                timeout=20.0
            )
            return message.content[0].text
        except asyncio.TimeoutError:
            logger.error("Translation timed out")
            return "Error: Translation request timed out."
        except Exception as e:
            logger.error("Translation failed", error=str(e))
            return f"Error during translation: {str(e)}"

ai_service = AIService()
