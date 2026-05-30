from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator


class Settings(BaseSettings):
    """
    Application configuration loaded from environment variables.
    """

    # -------------------------
    # PostgreSQL
    # -------------------------
    POSTGRES_HOST: str
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_ECHO: bool = False

    # -------------------------
    # Pinecone
    # -------------------------
    PINECONE_API_KEY: str
    PINECONE_INDEX_NAME: str
    PINECONE_ENVIRONMENT: str

    # -------------------------
    # App Config
    # -------------------------
    APP_ENV: str = "dev"
    LOG_LEVEL: str = "DEBUG"

    # -------------------------
    # Validation
    # -------------------------
    @field_validator(
        "POSTGRES_HOST",
        "POSTGRES_DB",
        "POSTGRES_USER",
        "POSTGRES_PASSWORD",
        "PINECONE_API_KEY",
        "PINECONE_INDEX_NAME",
        "PINECONE_ENVIRONMENT",
    )
    @classmethod
    def not_empty(cls, v: str):
        if not v or not v.strip():
            raise ValueError("Config value cannot be empty")
        return v

    # -------------------------
    # Pydantic Config
    # -------------------------
    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )


# Singleton
settings = Settings()