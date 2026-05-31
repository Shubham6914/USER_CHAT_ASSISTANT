from fastapi import FastAPI

from app.core.database_service import DatabaseService
from api.routes import router as auth_router
from services.logger_service import get_logger

logger = get_logger(__name__)

# -------------------- Initialize Services --------------------

db_service = DatabaseService()

db_service.initialize_postgres_connection()
db_service.initialize_pinecone_connection()

logger.info("Database connections initialized successfully.")

# -------------------- FastAPI App --------------------

app = FastAPI(
    title="User Assistant API",
    version="1.0.0"
)

# -------------------- Include Routers --------------------

app.include_router(auth_router)


# -------------------- Health Check --------------------

@app.get("/")
def health_check():
    """
    Health check endpoint.
    """
    return {"message": "API is running successfully"}