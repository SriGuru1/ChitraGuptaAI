from functools import lru_cache
from typing import Optional

from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application configuration loaded from environment variables."""

    app_name: str = Field(default="AiPapergrader API")
    secret_key: str = Field(default="change-me")
    access_token_expire_minutes: int = Field(default=60 * 6)
    sql_database_url: str = Field(
        default="sqlite:///./data/aipapergrader.db",
        description="SQLModel-supported DB URL",
    )
    google_application_credentials: Optional[str] = Field(
        default=None, description="Path to Google Vision credentials JSON"
    )
    use_mock_ocr: bool = Field(default=True)
    embedding_model_name: str = Field(
        default="sentence-transformers/all-MiniLM-L6-v2"
    )

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache
def get_settings() -> Settings:
    """Return cached settings instance."""
    return Settings()


