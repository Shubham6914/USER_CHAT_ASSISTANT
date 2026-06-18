from sqlalchemy import text

from app.core.database_service import DatabaseService
from app.services.logger_service import get_logger

logger = get_logger(__name__)


def test_connections():
    """
    Test both PostgreSQL and Pinecone connections.
    """

    db_service = DatabaseService()

    # Initialize connections
    db_service.initialize_postgres_connection()
    db_service.initialize_pinecone_connection()

    session = None

    try:
        # -------------------------
        # Test PostgreSQL
        # -------------------------
        session = db_service.get_postgres_session()

        print(f"Postgres URL: {db_service._build_postgres_url()}")

        result = session.execute(text("SELECT 1"))
        value = result.scalar()

        if value == 1:
            logger.info("✅ PostgreSQL connection successful")
        else:
            logger.error("❌ PostgreSQL returned unexpected result")

        # -------------------------
        # Test Pinecone
        # -------------------------
        index = db_service.get_pinecone_index()

        stats = index.describe_index_stats()

        if stats is not None:
            logger.info("✅ Pinecone connection successful")
        else:
            logger.error("❌ Pinecone returned empty stats")

    except Exception as e:
        logger.error(f"❌ Connection test failed: {str(e)}")

    finally:
        if session:
            db_service.close_postgres_session(session)


if __name__ == "__main__":
    test_connections()