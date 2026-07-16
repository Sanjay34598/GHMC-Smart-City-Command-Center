"""Gemini client wrapping the official google-genai SDK."""
import time
import logging
from typing import Tuple
from google import genai

from app.core.config import settings
from app.llm.parser import LLMResponseSchema, parse_llm_json, get_fallback_response

logger = logging.getLogger(__name__)

class GeminiClient:
    """Generic interface for LLM emergency assessments."""
    
    def __init__(self):
        # We instantiate the client only if the API key is provided
        self.api_key = settings.GEMINI_API_KEY
        if self.api_key:
            self.client = genai.Client(api_key=self.api_key)
        else:
            self.client = None
            logger.warning("GEMINI_API_KEY is missing. GeminiClient will run in fallback mode.")
            
        self.model_name = settings.GEMINI_MODEL_NAME

    def generate_emergency_assessment(self, prompt: str) -> Tuple[LLMResponseSchema, float, dict]:
        """
        Sends the prompt to Gemini and parses the response.
        Returns:
            Tuple containing:
            - Parsed LLMResponseSchema
            - Response time (in seconds)
            - Token usage dictionary
        """
        start_time = time.perf_counter()
        
        if not self.client:
            logger.error("GeminiClient missing API key. Returning fallback response.")
            response_time = time.perf_counter() - start_time
            return get_fallback_response(), response_time, {}
            
        try:
            return self._call_and_parse(prompt, start_time)
        except Exception as e:
            logger.error(f"First Gemini API call failed or returned malformed JSON: {e}")
            logger.info("Retrying Gemini API call...")
            try:
                # Retry once
                return self._call_and_parse(prompt, start_time)
            except Exception as e2:
                logger.error(f"Second Gemini API call failed: {e2}. Returning fallback response.")
                response_time = time.perf_counter() - start_time
                return get_fallback_response(), response_time, {}

    def _call_and_parse(self, prompt: str, start_time: float) -> Tuple[LLMResponseSchema, float, dict]:
        """Internal helper to call the API and parse the result."""
        # Using the new genai SDK syntax
        # We can enforce JSON response schema using response_schema if desired, 
        # but for compatibility we'll just ask for JSON in the prompt and parse it.
        # Alternatively, response_mime_type="application/json"
        config = genai.types.GenerateContentConfig(
            response_mime_type="application/json",
            temperature=0.2,
        )
        
        response = self.client.models.generate_content(
            model=self.model_name,
            contents=prompt,
            config=config,
        )
        
        response_time = time.perf_counter() - start_time
        
        # Extract token usage if available
        token_usage = {}
        if response.usage_metadata:
            token_usage = {
                "prompt_token_count": getattr(response.usage_metadata, "prompt_token_count", 0),
                "candidates_token_count": getattr(response.usage_metadata, "candidates_token_count", 0),
                "total_token_count": getattr(response.usage_metadata, "total_token_count", 0)
            }
            
        parsed_result = parse_llm_json(response.text)
        return parsed_result, response_time, token_usage
