# Backend Setup & Deployment Guide

Quick guide to set up and run the Physical AI backend.

---

## Prerequisites

- Python 3.11+
- PostgreSQL database (Neon Cloud recommended)
- Qdrant Cloud account
- OpenAI API key
- Anthropic API key (optional, for translation)

---

## Installation

### 1. Clone and Setup Virtual Environment

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Fill in the required values:

```bash
# Database (Neon Postgres)
DATABASE_URL=postgresql+asyncpg://user:password@host:5432/dbname

# Qdrant Cloud
QDRANT_URL=https://your-cluster.qdrant.cloud
QDRANT_API_KEY=your_qdrant_api_key
QDRANT_COLLECTION_NAME=physical-ai-book

# AI APIs
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Authentication
SECRET_KEY=<generate with: openssl rand -hex 32>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# Encryption
ENCRYPTION_KEY=<generate with: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())">

# CORS
ALLOWED_ORIGINS=["http://localhost:3001"]

# Server
HOST=0.0.0.0
PORT=8000
RELOAD=true
LOG_LEVEL=INFO
```

### 3. Run Database Migrations

```bash
# Create initial migration
alembic revision --autogenerate -m "Initial tables"

# Apply migrations
alembic upgrade head
```

### 4. Ingest Book Content

```bash
# Run ingestion pipeline
python -m src.scripts.ingest_book
```

This will:
- Read all markdown files from `../book/docs/`
- Chunk content (512 tokens, 50 overlap)
- Generate embeddings with OpenAI
- Upload to Qdrant Cloud

Expected output:
```
✅ Success: Ingested 6 files, 156 chunks
```

### 5. Start Server

```bash
# Development (with auto-reload)
python -m src.main

# Production (with uvicorn)
uvicorn src.main:app --host 0.0.0.0 --port 8000
```

Server runs at: `http://localhost:8000`

API docs at: `http://localhost:8000/docs`

---

## Testing the Backend

### Health Check

```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "database": "connected",
  "qdrant": "connected"
}
```

### Create User Account

```bash
curl -X POST http://localhost:8000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "securepass123",
    "software_background": "intermediate",
    "hardware_background": "hobbyist"
  }'
```

Expected response:
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "user_id": "uuid",
  "email": "test@example.com"
}
```

Save the `access_token` for subsequent requests.

### Query RAG System

```bash
TOKEN="your_access_token_here"

curl -X POST http://localhost:8000/api/rag/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "query": "What is inverse kinematics?",
    "mode": "full-book"
  }'
```

Expected response:
```json
{
  "answer": "Inverse kinematics (IK) computes joint angles...",
  "sources": [
    {
      "chapter": "02-robotics-fundamentals",
      "section": "kinematics",
      "score": 0.92,
      "url": "/docs/02-robotics-fundamentals/kinematics"
    }
  ],
  "confidence": 0.95,
  "mode": "full-book",
  "cached": false
}
```

### Get User Profile

```bash
curl -X GET http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

---

## Deployment

### Docker

```bash
# Build image
docker build -t physical-ai-backend .

# Run container
docker run -p 8000:8000 --env-file .env physical-ai-backend
```

### Railway

1. Create new project on Railway
2. Add PostgreSQL plugin (or configure Neon)
3. Set environment variables from `.env`
4. Deploy from GitHub
5. Railway will automatically detect and build the Dockerfile

### Fly.io

```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Launch app
fly launch

# Set secrets
fly secrets set OPENAI_API_KEY=sk-...
fly secrets set DATABASE_URL=postgresql+asyncpg://...

# Deploy
fly deploy
```

---

## Troubleshooting

### "Module not found" errors

Ensure you're in the `backend/` directory and virtual environment is activated:
```bash
cd backend
source venv/bin/activate
python -m src.main
```

### Database connection fails

Check your `DATABASE_URL` format:
```
postgresql+asyncpg://user:password@host:5432/dbname
```

For Neon, get the connection string from your dashboard (use the "Pooled connection" string).

### Qdrant connection fails

Verify:
1. `QDRANT_URL` includes `https://`
2. `QDRANT_API_KEY` is correct
3. Cluster is active in Qdrant Cloud dashboard

### Ingestion fails with "No markdown files found"

Check that `book/docs/` directory exists relative to backend:
```bash
ls ../book/docs/
```

If book is in a different location, specify path:
```python
# In ingestion_service.py
ingestion_service = IngestionService(book_docs_path="/path/to/book/docs")
```

### OpenAI rate limit errors

If ingestion fails with rate limits:
1. Add delays between embedding requests
2. Use batch processing
3. Check OpenAI dashboard for rate limits

---

## Development Workflow

### Run Tests

```bash
pytest tests/ -v --cov=src
```

### Code Formatting

```bash
black src/
```

### Linting

```bash
flake8 src/
```

### Type Checking

```bash
mypy src/
```

---

## Next Steps

After backend is running:
1. Proceed to STEP 4: Frontend (Next.js)
2. Connect frontend to backend API
3. Test end-to-end user flow (signup → query RAG → view results)
4. Deploy both to production

---

**Questions?** Check `backend/BACKEND_STATUS.md` for implementation details.
