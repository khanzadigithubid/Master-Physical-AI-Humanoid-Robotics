# Physical AI Backend (FastAPI)

Production-ready FastAPI backend for the Physical AI & Humanoid Robotics textbook platform.

---

## Features

🔐 **Authentication**: JWT-based auth with bcrypt password hashing
🤖 **RAG System**: OpenAI embeddings + Qdrant vector search + GPT-4 generation
🎨 **Personalization**: Content adaptation based on user background
🌐 **Translation**: Urdu translation with technical term preservation
📊 **Observability**: Structured logging with request IDs
🗄️ **Database**: Neon Serverless Postgres (async SQLAlchemy)
🔍 **Vector Store**: Qdrant Cloud for semantic search

---

## Architecture

```
FastAPI Application
├── API Routes
│   ├── /api/auth (signup, signin, profile)
│   ├── /api/rag (query, stats)
│   ├── /api/personalize (content adaptation)
│   └── /api/translate (Urdu translation)
├── Services
│   ├── RAGService (embedding, search, generation)
│   ├── PersonalizationService (placeholder)
│   └── TranslationService (placeholder)
├── Database
│   ├── Neon Postgres (users, sessions, rag_queries, cache)
│   └── Qdrant Cloud (vector embeddings)
└── Auth
    └── JWT tokens with httpOnly cookies
```

---

## Quick Start

### Prerequisites

- Python 3.11+
- PostgreSQL (or Neon Cloud account)
- Qdrant Cloud account
- OpenAI API key
- Anthropic API key (for translation)

### Installation

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Configuration

Copy `.env.example` to `.env` and fill in values:

```bash
cp .env.example .env
```

Required environment variables:
- `DATABASE_URL`: Neon Postgres connection string
- `QDRANT_URL`, `QDRANT_API_KEY`: Qdrant Cloud credentials
- `OPENAI_API_KEY`: OpenAI API key
- `ANTHROPIC_API_KEY`: Anthropic API key
- `SECRET_KEY`: JWT secret (generate with `openssl rand -hex 32`)
- `ENCRYPTION_KEY`: Fernet key (generate with `python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"`)

### Run Locally

```bash
python -m src.main
```

Server runs at `http://localhost:8000`

API docs at `http://localhost:8000/docs`

### Run with Docker

```bash
docker build -t physical-ai-backend .
docker run -p 8000:8000 --env-file .env physical-ai-backend
```

---

## API Endpoints

### Authentication

#### POST /api/auth/signup
Create new user account.

**Request**:
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "software_background": "intermediate",
  "hardware_background": "hobbyist"
}
```

**Response**:
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "user_id": "uuid",
  "email": "user@example.com"
}
```

#### POST /api/auth/signin
Authenticate user.

**Request**:
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

#### GET /api/auth/me
Get current user profile (requires authentication).

**Response**:
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "software_background": "intermediate",
  "hardware_background": "hobbyist",
  "prefer_urdu": false,
  "personalization_enabled": true
}
```

### RAG

#### POST /api/rag/query
Query the RAG system (requires authentication).

**Request**:
```json
{
  "query": "What is inverse kinematics?",
  "mode": "full-book"
}
```

**Response**:
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

#### GET /api/rag/stats
Get RAG statistics (requires authentication).

**Response**:
```json
{
  "total_chunks": 856,
  "total_queries": 1243,
  "avg_confidence": 0.87
}
```

### Personalization

#### POST /api/personalize
Generate personalized content (requires authentication).

**Request**:
```json
{
  "chapter_id": "02-robotics-fundamentals/kinematics"
}
```

**Response**:
```json
{
  "chapter_id": "02-robotics-fundamentals/kinematics",
  "content": "Adapted content with code examples...",
  "adaptations": [
    {
      "reason": "Code example for beginner software background",
      "content_preview": "Added Python implementation...",
      "type": "code_example"
    }
  ],
  "software_level": "beginner",
  "hardware_level": "hobbyist"
}
```

### Translation

#### POST /api/translate/urdu
Translate content to Urdu (requires authentication).

**Request**:
```json
{
  "content": "Inverse kinematics solves for joint angles...",
  "target_language": "urdu"
}
```

**Response**:
```json
{
  "original": "Inverse kinematics solves...",
  "translated": "الٹا حرکیات...",
  "language": "urdu",
  "preserved_terms": ["Inverse kinematics", "joint angles"],
  "validation_score": 0.95
}
```

---

## Database Schema

### Users
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    software_background VARCHAR(50),
    hardware_background VARCHAR(50),
    prefer_urdu BOOLEAN DEFAULT FALSE,
    personalization_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
);
```

### RAG Queries
```sql
CREATE TABLE rag_queries (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    query TEXT NOT NULL,
    mode VARCHAR(50) NOT NULL,
    answer TEXT,
    chunks_retrieved INTEGER,
    confidence INTEGER,
    sources JSONB,
    latency_ms INTEGER,
    tokens_used INTEGER,
    cost_usd INTEGER,  -- In cents
    created_at TIMESTAMP WITH TIME ZONE
);
```

---

## Development

### Run Tests

```bash
pytest tests/ -v --cov=src
```

### Code Quality

```bash
# Format code
black src/

# Lint
flake8 src/

# Type check
mypy src/
```

### Database Migrations

```bash
# Create migration
alembic revision --autogenerate -m "Add new table"

# Apply migrations
alembic upgrade head
```

---

## Deployment

### Railway

1. Create new project on Railway
2. Add PostgreSQL plugin (or use Neon)
3. Set environment variables
4. Deploy from GitHub

### Fly.io

```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Launch app
fly launch

# Set secrets
fly secrets set OPENAI_API_KEY=sk-...

# Deploy
fly deploy
```

---

## Performance

**Target Metrics**:
- Auth endpoints: <500ms (p95)
- RAG queries: <2s (p95)
- Personalization: <5s (p95)
- Translation: <3s (p95)

**Optimization Strategies**:
- Connection pooling (10-20 connections)
- Async I/O for all external calls
- Caching (Redis for personalized content)
- Rate limiting (100 requests/hour per user)

---

## Security

- ✅ Password hashing with bcrypt (cost factor 12)
- ✅ JWT tokens with 7-day expiration
- ✅ HTTPS enforced (TLS 1.3)
- ✅ Security headers (HSTS, CSP, X-Frame-Options)
- ✅ Input validation with Pydantic
- ✅ Rate limiting per endpoint
- ✅ CORS restricted to frontend domain
- ✅ Structured logging (no PII in logs)

---

## License

MIT License - See LICENSE file

---

## Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/physical-ai-textbook/issues)
- **Docs**: [API Documentation](http://localhost:8000/docs)
- **Email**: support@physical-ai.com
