import os
from typing import ClassVar

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
    PINECONE_API_KEY: str = os.getenv("PINECONE_API_KEY")
    PINECONE_INDEX: str = os.getenv("PINECONE_INDEX")
    PINECONE_ENVIRONMENT: str = "us-east-1"
    PINECONE_DIMENSION: int = 1536

    # -------------------------
    # App Config
    # -------------------------
    APP_ENV: str = "dev"
    LOG_LEVEL: str = "DEBUG"


    #-------------------------
    # JWT Config   
    #-------------------------
    SECRET_KEY: str = os.getenv("SECRET_KEY", "supersecret")
    ALGORITHM: str = "HS256"

    ACCESS_TOKEN_EXPIRE_MINUTES: int = (os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 15))
    REFRESH_TOKEN_EXPIRE_DAYS: int = (os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", 7))


    #-------------------------
    # document upload config
    #-------------------------
    ALLOWED_TYPES: ClassVar[list[str]] = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ]
    MAX_FILE_SIZE: int = 5 * 1024 * 1024  # 5MB

    #-------------------------
    # chunks config
    #-------------------------
    chunk_size: int = 800
    chunk_overlap: int = 120

    # -------------------------
    # OpenAI       
    # -------------------------
    OPENAI_API_KEY: str =(os.getenv("OPENAI_API_KEY"))
    EMBEDDING_MODEL: str = "text-embedding-3-small"
    EMBEDDING_BATCH_SIZE: int = 50
    EMBEDDING_DIM: int = 1536

    #----------------------
    # redis config
    #---------------------
    REDIS_URL: str = "redis://127.0.0.1:6379/0"

    
    # -------------------------
    # Validation
    # -------------------------
    @field_validator(
        "POSTGRES_HOST",
        "POSTGRES_DB",
        "POSTGRES_USER",
        "POSTGRES_PASSWORD",
        "PINECONE_API_KEY",
        "PINECONE_INDEX",
        "PINECONE_ENVIRONMENT",
        "SECRET_KEY",
        "ALGORITHM",
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