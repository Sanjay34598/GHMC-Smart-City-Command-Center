# LLM Service Architecture (Phase B)

The CityPulse AI Phase B architecture introduces Google Gemini to perform structured emergency intelligence analysis. This document outlines how the system is designed to allow replacing Gemini with any other LLM provider (such as OpenAI, Anthropic, or Azure) in the future.

## Layered Isolation

The application isolates the LLM capability by applying dependency inversion and strict layer boundaries. The architecture flows as follows:

```
FastAPI Routes -> LLMService -> LLMClient (GeminiClient) -> External LLM API
```

### 1. API Routes (`app/api/v1/routes/incidents.py`)
The HTTP controllers are completely unaware of the underlying AI provider. They depend solely on the `LLMService` and return standard Pydantic schemas (`LLMAnalysisResponse`).

### 2. Service Layer (`app/services/llm_service.py`)
The `LLMService` coordinates the business logic:
- Fetches the `Incident` and its existing YOLO detections.
- Invokes the `PromptBuilder` to dynamically create the prompt text without embedding hardcoded strings in the service itself.
- Calls `self.client.generate_emergency_assessment(prompt)`.
- Translates the result into an `LLMAnalysis` database model.

### 3. The Prompt Builder (`app/llm/prompt_builder.py`)
All raw prompt strings are maintained here. This ensures that when the LLM provider changes, the prompts can easily be adjusted for provider-specific nuances without touching the business logic.

### 4. The LLM Client Interface (`app/llm/gemini_client.py`)
The `GeminiClient` implements an implicit interface defined by the single method:
```python
def generate_emergency_assessment(self, prompt: str) -> Tuple[LLMResponseSchema, float, dict]:
```
It handles everything provider-specific, including the official SDK (`google-genai`), authentication (`GEMINI_API_KEY`), and retry logic. 

## How to Swap Providers

To swap Gemini for another provider (e.g., OpenAI):

1. **Create a new client**: Create `app/llm/openai_client.py` with an `OpenAIClient` class that implements `generate_emergency_assessment(prompt)`.
2. **Handle parsing inside the client**: The new client should parse OpenAI's output format, map it to `LLMResponseSchema`, and handle OpenAI-specific retry/error logic (returning `get_fallback_response()` on failure).
3. **Update Dependency Injection**: In `app/services/llm_service.py`, replace:
   ```python
   from app.llm.gemini_client import GeminiClient
   self.client = GeminiClient()
   ```
   with:
   ```python
   from app.llm.openai_client import OpenAIClient
   self.client = OpenAIClient()
   ```
4. **Update Configuration**: Update `app/core/config.py` to accept `OPENAI_API_KEY`.

No changes are required in the API routes, database schema, or frontend application.
