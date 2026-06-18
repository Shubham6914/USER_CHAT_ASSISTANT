from celery import Celery
from app.core.config import settings
from app.core.database_service import DatabaseService

# ✅ This is enough if DB initializes in __init__
database_service = DatabaseService()
# ✅ Initialize postgres  DB (FIXED)
database_service.initialize_postgres_connection()
# # ✅ Initialize pinecone  DB (FIXED)

database_service.initialize_pinecone_connection()

celery_app = Celery(
    "worker",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["app.workers.tasks"]
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="Asia/Kolkata",
    enable_utc=True,
)