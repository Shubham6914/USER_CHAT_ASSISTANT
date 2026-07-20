from celery import Celery
from app.core.config import settings
from app.core.database_service import get_database_service

# ✅ Clean, safe, idempotent
database_service = get_database_service()

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