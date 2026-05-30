
from app.core.database_service import DatabaseService


db_service = DatabaseService()

db_service.initialize_postgres_connection()
db_service.initialize_pinecone_connection()