# app/services/database_service.py

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.exc import SQLAlchemyError

from pinecone import Pinecone, ServerlessSpec

from app.core.config import settings
from services.logger_service import get_logger
logger = get_logger(__name__)


class DatabaseService:
    """
    DatabaseService is responsible for managing connections to:
    - PostgreSQL (via SQLAlchemy)
    - Pinecone (vector database)

    It provides:
    - Engine initialization
    - Session management
    - Pinecone index access
    - Basic health checks
    """

    def __init__(self):
        """
        Initialize placeholders for database connections.
        Actual connections are initialized explicitly using init methods.
        """
        self._engine = None
        self._SessionLocal = None
        self._pinecone_client = None
        self._pinecone_index = None

    # ------------------------------------------------------------------
    # PostgreSQL
    # ------------------------------------------------------------------
    def _build_postgres_url(self) -> str:
        """
        Construct PostgreSQL connection URL from individual config values.
        """
        return (
            f"postgresql+psycopg2://{settings.POSTGRES_USER}:"
            f"{settings.POSTGRES_PASSWORD}@{settings.POSTGRES_HOST}:"
            f"{settings.POSTGRES_PORT}/{settings.POSTGRES_DB}"
        )
    

    def initialize_postgres_connection(self) -> None:
        """
        Initialize PostgreSQL connection using SQLAlchemy engine.

        This method:
        - Creates engine
        - Configures session factory

        Should be called once at application startup.
        """
        try:
            self._engine = create_engine(
                self._build_postgres_url(),
                echo=settings.POSTGRES_ECHO,
                pool_pre_ping=True,
            )

            self._SessionLocal = sessionmaker(
                autocommit=False,
                autoflush=False,
                bind=self._engine,
            )

            logger.info("PostgreSQL connection initialized")

        except SQLAlchemyError as e:
            logger.error(f"Failed to initialize PostgreSQL: {str(e)}")
            raise

    def get_postgres_session(self) -> Session:
        """
        Create and return a new database session.

        Returns:
            Session: SQLAlchemy session object

        Usage:
            db = db_service.get_postgres_session()
            try:
                ...
            finally:
                db.close()
        """
        if not self._SessionLocal:
            raise RuntimeError("PostgreSQL not initialized")

        return self._SessionLocal()

    def close_postgres_session(self, session: Session) -> None:
        """
        Safely close a PostgreSQL session.

        Args:
            session (Session): Active SQLAlchemy session
        """
        try:
            session.close()
        except Exception as e:
            logger.warning(f"Error closing session: {str(e)}")

    # ------------------------------------------------------------------
    # Pinecone
    # ------------------------------------------------------------------

    def initialize_pinecone_connection(self) -> None:
        """
        Initialize Pinecone client and index.

        This method:
        - Creates Pinecone client
        - Connects to existing index OR creates new one

        Should be called once at application startup.
        """
        try:
            self._pinecone_client = Pinecone(
                api_key=settings.PINECONE_API_KEY
            )

            index_name = settings.PINECONE_INDEX_NAME

            # Check if index exists
            existing_indexes = [
                index["name"]
                for index in self._pinecone_client.list_indexes()
            ]

            if index_name not in existing_indexes:
                logger.info(f"Creating Pinecone index: {index_name}")

                self._pinecone_client.create_index(
                    name=index_name,
                    dimension=1024,  # as per your embedding plan
                    metric="cosine",
                    spec=ServerlessSpec(
                        cloud="aws",
                        region=settings.PINECONE_ENVIRONMENT,
                    ),
                )

            self._pinecone_index = self._pinecone_client.Index(index_name)

            logger.info("Pinecone connection initialized")

        except Exception as e:
            logger.error(f"Pinecone initialization failed: {str(e)}")
            raise

    def get_pinecone_index(self):
        """
        Return Pinecone index instance.

        Returns:
            Pinecone Index object
        """
        if not self._pinecone_index:
            raise RuntimeError("Pinecone not initialized")

        return self._pinecone_index

    # ------------------------------------------------------------------
    # Health Check
    # ------------------------------------------------------------------

    def check_database_health(self) -> dict:
        """
        Check health of PostgreSQL and Pinecone connections.

        Returns:
            dict: Status of each service
        """
        health_status = {
            "postgres": False,
            "pinecone": False,
        }

        # Check PostgreSQL
        try:
            if self._engine:
                with self._engine.connect() as conn:
                    conn.execute("SELECT 1")
                health_status["postgres"] = True
        except Exception as e:
            logger.error(f"Postgres health check failed: {str(e)}")

        # Check Pinecone
        try:
            if self._pinecone_index:
                # Simple describe index call
                self._pinecone_index.describe_index_stats()
                health_status["pinecone"] = True
        except Exception as e:
            logger.error(f"Pinecone health check failed: {str(e)}")

        return health_status