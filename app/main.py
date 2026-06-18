from fastapi import FastAPI
from fastapi.concurrency import asynccontextmanager
from app import models
from app.core.database_service import database_service
from app.api.routes import router as auth_router
from app.services.logger_service import get_logger

logger = get_logger(__name__)



# -------------------- Initialize db services --------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    database_service.initialize_postgres_connection()
    database_service.initialize_pinecone_connection()
    yield

logger.info("Database connections initialized successfully.")

# -------------------- FastAPI App --------------------

app = FastAPI(
    title="User Assistant API",
    version="1.0.0",
    lifespan=lifespan
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


from app.workers.tasks import add

if __name__ == "__main__":
    result = add.delay(5, 7)
    print("Task sent!")
    print("Task result:", result.get(timeout=10))