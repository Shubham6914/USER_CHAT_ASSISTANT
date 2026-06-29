from app.services.chunking_service import ChunkingService
from app.services.embedding_service import EmbeddingService
from app.services.document_service import DocumentService
from app.models.user_document_model import UserDocument
from app.models.enums import ProcessingStatusEnum
from app.api.dependencies import get_pinecone_index
from app.services.logger_service import get_logger
logger = get_logger(__name__)

from app.workers.celery_app import celery_app, database_service



@celery_app.task
def add(x, y):
    return x + y

@celery_app.task(
    bind=True,
    autoretry_for=(Exception,),
    retry_kwargs={"max_retries": 3},
    retry_backoff=True
)
def process_document_pipeline(self, document_id: str):

    document_service = DocumentService()
    db = None

    try:
        logger.info(f"Starting processing for document: {document_id}")

        # ✅ SAFETY INIT (recommended)
        if database_service._SessionLocal is None:
            database_service.initialize_postgres_connection()

        db = database_service.get_postgres_session()

        chunking_service = ChunkingService()
        if database_service._pinecone_index is None:
            database_service.initialize_pinecone_connection()  
        
        pinecone_index = database_service.get_pinecone_index()
        embedding_service = EmbeddingService(pinecone_index)

        # 1. Fetch document
        document = db.query(UserDocument).filter(
            UserDocument.doc_id == document_id
        ).first()

        if not document:
            raise ValueError(f"Document not found: {document_id}")

        # 2. Update status → PROCESSING
        document_service.update_processing_status(
            db,
            document_id,
            ProcessingStatusEnum.PROCESSING
        )

        # 3. Prepare document dict
        document_data = {
            "doc_id": document.doc_id,
            "user_id": document.user_id,
            "file_path": document.file_path
        }

        # 4. Chunking
        logger.info("🔥 ENTERED process_document()")
        chunks = chunking_service.process_document(document_data)
        
        if chunks:
            logger.info(f"CHUNK Found")
        else:
            logger.error("❌ No chunks returned from chunking service")

        logger.info(f"Chunking completed")
        # 5. Embedding
        embedding_service.process_chunks(chunks)
        logger.info("Embedding + Pinecone storage completed")

        # 6. Update status → COMPLETED
        document_service.update_processing_status(
            db,
            document_id,
            ProcessingStatusEnum.COMPLETED
        )

        logger.info(f"Completed processing for document: {document_id}")

    except Exception as e:
        logger.error(f"Failed processing {document_id}: {str(e)}")

        try:
            if db:
                document_service.update_processing_status(
                    db,
                    document_id,
                    ProcessingStatusEnum.FAILED,
                    error_message=str(e)
                )
        except Exception as inner_error:
            logger.error(f"Failed to update status: {str(inner_error)}")

        raise

    finally:
        if db:
            db.close()