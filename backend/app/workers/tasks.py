import asyncio
from sqlalchemy import select
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

# Document Ingestion Pipeline Logic

async def async_process_document_pipeline_logic(document_id: str):
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
        result = await db.execute(
            select(UserDocument).filter(UserDocument.doc_id == document_id)
        )
        document = result.scalars().first()


        if not document:
            raise ValueError(f"Document not found: {document_id}")


        # Document exists
        current_step = ProcessingStepEnum.DOCUMENT_SAVED

        await document_service.update_processing_status(
            db,
            document_id,
            status=ProcessingStatusEnum.PROCESSING,
            current_step=current_step,
            progress=20
        )
        # update progress in db 
        await db.commit()


        #  Prepare document dict
        document_data = {
            "doc_id": document.doc_id,
            "user_id": document.user_id,
            "file_path": document.file_path
        }

        # 2. Chunking

        current_step = ProcessingStepEnum.CHUNKING

        await document_service.update_processing_status(
            db,
            document_id,
            status=ProcessingStatusEnum.PROCESSING,
            current_step=current_step,
            progress=40
        )
        # update progress in db 
        await db.commit()


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

        await document_service.update_processing_status(
            db,
            document_id,
            status=ProcessingStatusEnum.PROCESSING,
            current_step=current_step,
            progress=70
        )
        # update progress in db 
        await db.commit()


        logger.info(
            "Starting embedding generation"
        )


        vectors = await embedding_service.process_chunks(
            chunks
        )


        logger.info(
            f"Embedding completed. Generated vectors: {len(vectors)}"
        )


         # 4. Vector Store

        current_step = ProcessingStepEnum.VECTOR_STORE

        await document_service.update_processing_status(
            db,
            document_id,
            status=ProcessingStatusEnum.PROCESSING,
            current_step=current_step,
            progress=90
        )
        # update progress in db 
        await db.commit()


        logger.info(
            "Saving vectors to Pinecone"
        )


        await vector_store_service.upsert(
            vectors=vectors,
            namespace=str(document.user_id)
        )


        logger.info(
            "Vectors stored successfully"
        )



        # 5. Completed

        await document_service.update_processing_status(
            db,
            document_id,
            status=ProcessingStatusEnum.COMPLETED,
            current_step=ProcessingStepEnum.COMPLETED,
            progress=100
        )
        # update progress in db 
        await db.commit()


        logger.info(
            f"Completed processing for document: {document_id}"
        )


    except Exception as e:

        logger.error(
            f"Failed processing {document_id}: {str(e)}"
        )


        try:

            if db:

                await document_service.update_processing_status(
                    db,
                    document_id,
                    status=ProcessingStatusEnum.FAILED,
                    current_step=current_step,
                    error_message=str(e)
                )
                await db.commit()

        except Exception as inner_error:

            logger.error(
                f"Failed to update failed status: {str(inner_error)}"
            )


        raise


    finally:

        if db:
            await db.close()

@celery_app.task(
    bind=True,
    autoretry_for=(Exception,),
    retry_kwargs={"max_retries": 3},
    retry_backoff=True
)
def process_document_pipeline(self, document_id: str):
    asyncio.run(async_process_document_pipeline_logic(document_id))