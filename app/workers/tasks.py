from app.services.chunking_service import ChunkingService
from app.services.embedding_service import EmbeddingService
from app.services.document_service import DocumentService
from app.models.user_document_model import UserDocument
from app.services.vector_service import VectorStoreService
from app.models.enums import ProcessingStatusEnum, ProcessingStepEnum
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
        logger.info(
            f"Starting processing for document: {document_id}"
        )


        # Initialize DB
        if database_service._SessionLocal is None:
            database_service.initialize_postgres_connection()

        db = database_service.get_postgres_session()


        # Initialize services
        chunking_service = ChunkingService()


        if database_service._pinecone_index is None:
            database_service.initialize_pinecone_connection()


        pinecone_index = database_service.get_pinecone_index()

        vector_store_service = VectorStoreService(
            pinecone_index
        )

        embedding_service = EmbeddingService()
        

        # 1. Fetch document
        document = db.query(UserDocument).filter(
            UserDocument.doc_id == document_id
        ).first()


        if not document:
            raise ValueError(f"Document not found: {document_id}")


        # Document exists
        current_step = ProcessingStepEnum.DOCUMENT_SAVED

        document_service.update_processing_status(
            db,
            document_id,
            status=ProcessingStatusEnum.PROCESSING,
            current_step=current_step,
            progress=20
        )
        # update progress in db 
        db.commit()


        #  Prepare document dict
        document_data = {
            "doc_id": document.doc_id,
            "user_id": document.user_id,
            "file_path": document.file_path
        }

        # 2. Chunking

        current_step = ProcessingStepEnum.CHUNKING

        document_service.update_processing_status(
            db,
            document_id,
            status=ProcessingStatusEnum.PROCESSING,
            current_step=current_step,
            progress=40
        )
        # update progress in db 
        db.commit()


        logger.info(
            "Starting chunking"
        )


        chunks = chunking_service.process_document(
            document_data
        )


        if not chunks:
            raise ValueError(
                "No chunks generated"
            )


        logger.info(
            f"Chunking completed. Total chunks: {len(chunks)}"
        )




        # 3. Embedding

        current_step = ProcessingStepEnum.EMBEDDING

        document_service.update_processing_status(
            db,
            document_id,
            status=ProcessingStatusEnum.PROCESSING,
            current_step=current_step,
            progress=70
        )
        # update progress in db 
        db.commit()


        logger.info(
            "Starting embedding generation"
        )


        vectors = embedding_service.process_chunks(
            chunks
        )


        logger.info(
            f"Embedding completed. Generated vectors: {len(vectors)}"
        )


         # 4. Vector Store

        current_step = ProcessingStepEnum.VECTOR_STORE

        document_service.update_processing_status(
            db,
            document_id,
            status=ProcessingStatusEnum.PROCESSING,
            current_step=current_step,
            progress=90
        )
        # update progress in db 
        db.commit()


        logger.info(
            "Saving vectors to Pinecone"
        )


        vector_store_service.upsert(
            vectors=vectors,
            namespace=str(document.user_id)
        )


        logger.info(
            "Vectors stored successfully"
        )



        # 5. Completed

        document_service.update_processing_status(
            db,
            document_id,
            status=ProcessingStatusEnum.COMPLETED,
            current_step=ProcessingStepEnum.COMPLETED,
            progress=100
        )
        # update progress in db 
        db.commit()


        logger.info(
            f"Completed processing for document: {document_id}"
        )


    except Exception as e:

        logger.error(
            f"Failed processing {document_id}: {str(e)}"
        )


        try:

            if db:

                document_service.update_processing_status(
                    db,
                    document_id,
                    status=ProcessingStatusEnum.FAILED,
                    current_step=current_step,
                    error_message=str(e)
                )


        except Exception as inner_error:

            logger.error(
                f"Failed to update failed status: {str(inner_error)}"
            )


        raise


    finally:

        if db:
            db.close()