# NexusAI Full-Stack Assistant

NexusAI is a powerful, multi-tenant Generative AI Assistant featuring Document Retrieval-Augmented Generation (RAG), external tool integration (e.g., Web Search), and asynchronous background document ingestion.

---

## Key Features

- **ChatGPT-like Web UI**: Modern, sleek chat interface supporting dark and light themes, collapsible sidebars, and real-time streaming text answers.
- **RAG Ingestion Pipeline**: Asynchronously processes uploaded PDFs/DOCX, chunks them, creates vector embeddings, and stores them in Pinecone namespaces.
- **Extensible Agent Engine**: Powered by LangGraph, routing queries dynamically to RAG search, Web Search tools, or direct responses.
- **Citations & References**: Renders clickable source badges linking directly to web results, including page numbers for PDF citations, with Perplexity-style hover details.
- **Asynchronous Workers**: Document chunking, embedding generation, and indexing are handled in the background by Celery workers.
- **Redis Cache & Broker**: Redis runs via Docker and is used as the message broker for Celery tasks, allowing high-performance queuing.

---

## Tech Stack

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM (with protected auth route layers)
- **HTTP Client**: Axios (with interceptors for JWT injection)

### Backend
- **Framework**: FastAPI (REST & Server-Sent Events/SSE streaming)
- **Database**: PostgreSQL (with SQLAlchemy ORM & Alembic migrations)
- **Vector DB**: Pinecone (for semantic vector search)
- **Task Queue**: Celery (with Redis as message broker)
- **Workflow Orchestration**: LangGraph (agent state management)
- **LLM Engine**: OpenAI API (embeddings and text completions)

---

## Directory Structure

```text
NexusAI/
├── backend/                  # FastAPI backend service
│   ├── app/                  # Application source code (api, core, graph, models, schemas, services, workers)
│   ├── alembic/              # Database migration tracks
│   ├── alembic.ini           # Alembic configuration
│   ├── PLANS/                # Backend architecture design documents
│   ├── test/                 # Test suites
│   ├── uploads/              # Document upload storage
│   ├── .env                  # Environment configuration
│   ├── Dockerfile            # Backend Docker setup
│   ├── docker-compose.yml    # Docker configuration for Redis
│   └── requirements.txt      # Python dependencies
└── frontend/                 # React SPA (Vite + Tailwind CSS)
```

---

## Setup & Running Guide

### 1. Backend Setup
1. **Navigate to the `backend` directory**:
   ```bash
   cd backend
   ```
2. **Start Redis container (Docker)**:
   ```bash
   docker compose up -d
   ```
3. **Activate virtual environment & install dependencies**:
   ```bash
   python -m venv venv
   source venv/Scripts/activate  # On Windows (PowerShell): ..\venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   ```
4. **Run database migrations**:
   ```bash
   alembic upgrade head
   ```
5. **Start the FastAPI application**:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
6. **Start Celery background worker**:
   ```bash
   celery -A app.workers.celery_app worker --loglevel=info -P threads
   ```

### 2. Frontend Setup
1. **Navigate to the frontend directory**:
   ```bash
   cd frontend
   ```
2. **Install npm packages**:
   ```bash
   npm install
   ```
3. **Start the development server**:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:5173](http://localhost:5173) in your browser to access the application.
