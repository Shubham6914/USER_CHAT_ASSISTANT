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
├── app/                      # Backend application source code
│   ├── api/                  # API routes, middlewares, and dependencies
│   ├── core/                 # DB, settings, LLM singletons
│   ├── graph/                # LangGraph nodes, routing, state
│   ├── models/               # SQLAlchemy DB models
│   ├── schemas/              # Pydantic schemas
│   ├── services/             # Core services (RAG, upload, tools)
│   └── workers/              # Celery workers & tasks
├── frontend/                 # React SPA (Vite + Tailwind)
├── alembic/                  # Database migration tracks
├── docker-compose.yml        # Docker configuration for Redis
└── .env                      # Global environment variables
```

---

## Configuration Settings

Configure your environment variables in a `.env` file at the root directory:

```env
# PostgreSQL
DATABASE_URL=postgresql+psycopg2://postgres:postgres123@localhost:5432/assistant_db

# Pinecone
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX=text-document

# JWT
SECRET_KEY=your_jwt_secret_key
ACCESS_TOKEN_EXPIRE_MINUTES=15

# OpenAI & Tavily
OPENAI_API_KEY=your_openai_api_key
TAVILY_API_KEY=your_tavily_api_key

# Redis
REDIS_URL=redis://127.0.0.1:6379/0
```

---

## Setup & Running Guide

### 1. Start Redis (Docker)
Ensure Docker is installed and running, then start the Redis instance using Docker Compose:
```bash
docker compose up -d
```
This spins up a background Redis container bound to `6379:6379`.

### 2. Backend Setup
1. **Navigate to the root directory** and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/Scripts/activate  # On Windows (PowerShell): venv\Scripts\Activate.ps1
   ```
2. **Install backend dependencies**:
   ```bash
   pip install -r requirements.txt
   ```
3. **Run database migrations**:
   ```bash
   alembic upgrade head
   ```
4. **Start the FastAPI application**:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
5. **Start Celery background worker**:
   ```bash
   celery -A app.workers.celery_app.celery worker --loglevel=info -P threads
   ```

### 3. Frontend Setup
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
