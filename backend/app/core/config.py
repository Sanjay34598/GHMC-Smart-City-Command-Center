from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Typed process configuration loaded from environment variables."""

    PROJECT_NAME: str = "DisasterAI API"
    VERSION: str = "0.1.0"
    API_V1_PREFIX: str = "/api/v1"
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "disasterai"
    POSTGRES_USER: str = "disasterai"
    POSTGRES_PASSWORD: str = "change-me"
    BACKEND_CORS_ORIGINS: str = "http://localhost:5173"

    # AI detection module configuration
    # These values flow into MockDetector now and YOLODetector in Phase 3.
    AI_MODEL_NAME: str = "YOLOv11-Disaster"
    AI_MODEL_VERSION: str = "1.0.0"
    AI_CONFIDENCE_THRESHOLD: float = 0.5
    AI_MODEL_PATH: str = "models/best.onnx"
    USE_MOCK_AI: bool = False

    # Gemini LLM configuration
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL_NAME: str = "gemini-1.5-flash"
    GEMINI_TIMEOUT: int = 30

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @property
    def database_url(self) -> str:
        return "sqlite:///./disasterai.db"

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.BACKEND_CORS_ORIGINS.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
