from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.concurrency import asynccontextmanager

from app import models
from app.core.database_service import database_service
from app.api.routes.auth_routes import router as auth_router
from app.api.routes.document_routes import router as document_router
from app.services.logger_service import get_logger

logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    database_service.initialize_postgres_connection()
    database_service.initialize_pinecone_connection()
    yield


app = FastAPI(
    title="User Assistant API",
    version="1.0.0",
    lifespan=lifespan
)

# Add this
origins = [
    "http://localhost:3000",  # React
    "http://localhost:5173",  # Vite
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,      # For testing you can use ["*"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers after middleware
# Register routers
app.include_router(auth_router)
app.include_router(document_router)

@app.get("/")
def health_check():
    return {"message": "API is running successfully"}