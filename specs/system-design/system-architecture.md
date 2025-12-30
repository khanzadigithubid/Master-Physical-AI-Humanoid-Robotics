# System Architecture Specification
**Physical AI & Humanoid Robotics – AI-Native Textbook Platform**

**Date**: 2025-12-28
**Version**: 1.0.0
**Status**: Design

---

## Executive Summary

This document defines the system architecture for an AI-native textbook platform that publishes Physical AI & Humanoid Robotics content via Docusaurus, embeds intelligent RAG chatbot capabilities, and supports personalized learning through user background adaptation and multilingual translation (Urdu).

The architecture enforces strict separation between three independently deployable components: Book (static content), Frontend (user interface), and Backend (AI services + data layer).

---

## System Overview

### Design Principles

1. **Independent Deployability**: Book, Frontend, Backend deploy to separate environments
2. **API-First**: All inter-component communication via documented REST APIs
3. **Stateless Services**: Backend services horizontally scalable
4. **AI Modularity**: RAG, personalization, translation implemented as pluggable services
5. **Privacy by Design**: User data encrypted, queries anonymized in vector store

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           USER BROWSER                               │
└─────────────────────────────────────────────────────────────────────┘
         │                                    │
         │                                    │
    ┌────▼────────┐                     ┌────▼────────────┐
    │   BOOK      │                     │   FRONTEND      │
    │ (Docusaurus)│                     │   (Next.js)     │
    │             │                     │                 │
    │ Static HTML │                     │ - Auth Pages    │
    │ + MDX       │                     │ - Reader UI     │
    │ + Sidebar   │                     │ - Chatbot       │
    │             │                     │ - Personalize   │
    │ GitHub      │                     │ - Translate     │
    │ Pages       │                     │                 │
    └─────────────┘                     └────┬────────────┘
                                             │
                                             │ REST API
                                             │ (HTTPS)
                                        ┌────▼────────────┐
                                        │   BACKEND       │
                                        │   (FastAPI)     │
                                        │                 │
                                        │ ┌─────────────┐ │
                                        │ │ Auth Routes │ │
                                        │ │(better-auth)│ │
                                        │ └─────────────┘ │
                                        │ ┌─────────────┐ │
                                        │ │ RAG Service │ │
                                        │ │ (Full-book  │ │
                                        │ │  + Selected)│ │
                                        │ └─────────────┘ │
                                        │ ┌─────────────┐ │
                                        │ │Personalize  │ │
                                        │ │Service      │ │
                                        │ └─────────────┘ │
                                        │ ┌─────────────┐ │
                                        │ │ Translate   │ │
                                        │ │ Service     │ │
                                        │ └─────────────┘ │
                                        │                 │
                                        │ Railway/Fly.io  │
                                        └────┬────────────┘
                                             │
                    ┌────────────────────────┼────────────────────────┐
                    │                        │                        │
              ┌─────▼──────┐          ┌─────▼──────┐          ┌──────▼──────┐
              │   Neon     │          │  Qdrant    │          │   OpenAI    │
              │ Postgres   │          │   Cloud    │          │ API / Claude│
              │            │          │            │          │             │
              │ - Users    │          │ - Book     │          │ - GPT-4     │
              │ - Sessions │          │   Vectors  │          │ - Embeddings│
              │ - Prefs    │          │ - Retrieval│          │ - Agents SDK│
              └────────────┘          └────────────┘          └─────────────┘
```

---

## Component Specifications

### 1. Book Component (Docusaurus)

**Purpose**: Serve static textbook content with university-level Physical AI curriculum

**Technology**:
- Docusaurus 3.x (React-based static site generator)
- MDX for interactive content
- GitHub Pages for hosting

**Responsibilities**:
- Render markdown chapters as HTML
- Provide sidebar navigation (modules, chapters, sections)
- Support search (Docusaurus built-in Algolia integration)
- Embed custom React components (diagrams, code playgrounds)
- NO backend dependencies (pure static site)

**Content Structure**:
```
docs/
├── 01-introduction/
│   ├── overview.md
│   ├── physical-ai-definition.md
│   └── curriculum-guide.md
├── 02-robotics-fundamentals/
│   ├── kinematics.md
│   ├── dynamics.md
│   └── control-theory.md
├── 03-perception-systems/
│   ├── computer-vision.md
│   ├── lidar-sensors.md
│   └── sensor-fusion.md
├── 04-ai-for-robotics/
│   ├── reinforcement-learning.md
│   ├── imitation-learning.md
│   └── world-models.md
├── 05-humanoid-robotics/
│   ├── bipedal-locomotion.md
│   ├── manipulation.md
│   └── human-robot-interaction.md
└── 06-deployment-ethics/
    ├── sim-to-real.md
    ├── safety-systems.md
    └── ethical-considerations.md
```

**Deployment**:
- Build: `npm run build` → static HTML in `build/`
- Deploy: GitHub Actions workflow pushes to `gh-pages` branch
- URL: `https://<username>.github.io/physical-ai-textbook/`

**Success Criteria**:
- [ ] All chapters render correctly with LaTeX math support
- [ ] Sidebar navigation functional across all pages
- [ ] Mobile-responsive design (Docusaurus default)
- [ ] Search returns relevant results
- [ ] Build time < 60 seconds

---

### 2. Frontend Component (Next.js)

**Purpose**: Provide interactive learning interface with authentication, chatbot, and AI features

**Technology**:
- Next.js 14+ (App Router)
- TypeScript 5.3+
- Tailwind CSS 3.4+
- ChatKit SDK (for chatbot UI)
- better-auth client

**Responsibilities**:
- User authentication (signup, signin, session management)
- Chapter reader UI (embeds book content or links to book)
- RAG chatbot interface (full-book and selected-text modes)
- Personalization trigger (button → API call → content adaptation)
- Urdu translation trigger (button → API call → translated display)
- User profile management (background preferences)

**Route Structure**:
```
src/app/
├── (auth)/
│   ├── signin/page.tsx
│   ├── signup/page.tsx
│   └── profile/page.tsx
├── reader/
│   ├── [chapter]/page.tsx        # Chapter reader with chatbot
│   └── layout.tsx                # Sidebar + chatbot container
├── api/
│   └── auth/[...all]/route.ts    # better-auth API routes
└── layout.tsx                     # Root layout with Tailwind
```

**Key Components**:
- `<ChatbotPanel>`: Floating chat interface (ChatKit SDK)
- `<PersonalizeButton>`: Triggers personalization API
- `<TranslateButton>`: Triggers Urdu translation API
- `<ChapterReader>`: Displays book content with selection handlers
- `<UserProfileForm>`: Captures software/hardware background

**API Client**:
```typescript
// src/lib/api-client.ts
class BackendClient {
  async personalizeContent(chapterId: string, userBackground: UserBackground): Promise<PersonalizedContent>
  async translateToUrdu(content: string): Promise<Translation>
  async queryRAG(query: string, mode: 'full-book' | 'selected-text', context?: string): Promise<RAGResponse>
  async captureUserBackground(background: UserBackground): Promise<void>
}
```

**Authentication Flow**:
1. User visits `/signin` or `/signup`
2. better-auth client handles form submission → backend
3. Backend validates credentials → issues session token (httpOnly cookie)
4. Frontend redirects to `/reader` with authenticated session

**Deployment**:
- Platform: Vercel
- Environment Variables: `NEXT_PUBLIC_BACKEND_URL`, `BETTER_AUTH_SECRET`
- Build: `npm run build` (Next.js optimized build)
- Domain: `physical-ai-app.vercel.app` (or custom domain)

**Success Criteria**:
- [ ] Auth flows complete in < 3 seconds (signup, signin, signout)
- [ ] Chatbot responds in < 2 seconds (p95 latency)
- [ ] Personalization applied in < 5 seconds
- [ ] Urdu translation renders correctly (RTL support)
- [ ] Mobile-responsive (tested on iOS/Android)

---

### 3. Backend Component (FastAPI)

**Purpose**: Provide AI services (RAG, personalization, translation) and data persistence

**Technology**:
- FastAPI 0.108+
- Python 3.11+
- OpenAI Agents SDK (for agent orchestration)
- better-auth server integration
- Qdrant Cloud (vector database)
- Neon Serverless Postgres (relational database)

**Responsibilities**:
- User authentication and session management (better-auth)
- RAG query processing (full-book and selected-text modes)
- Content personalization based on user background
- Urdu translation with technical term preservation
- User profile and preference storage
- Ingestion pipeline for book content → Qdrant vectors

**Service Architecture**:
```
src/
├── api/
│   ├── auth.py              # better-auth integration routes
│   ├── rag.py               # RAG query endpoints
│   ├── personalization.py   # Personalization endpoints
│   └── translation.py       # Translation endpoints
├── agents/
│   ├── rag_agent.py         # OpenAI Agents SDK RAG orchestration
│   ├── personalize_agent.py # Personalization agent
│   └── translate_agent.py   # Translation agent
├── services/
│   ├── rag_service.py       # Core RAG logic
│   ├── personalize_service.py
│   ├── translate_service.py
│   └── ingestion_service.py # Book content → Qdrant
├── db/
│   ├── neon.py              # Neon Postgres client
│   ├── qdrant_client.py     # Qdrant vector store client
│   └── models.py            # SQLAlchemy models
└── auth/
    └── better_auth_config.py
```

**API Endpoints**:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/auth/signup` | POST | Create user account |
| `/auth/signin` | POST | Authenticate user |
| `/auth/signout` | POST | Invalidate session |
| `/auth/profile` | GET/PUT | Retrieve/update user profile |
| `/rag/query` | POST | Query RAG (full-book or selected-text) |
| `/personalize` | POST | Generate personalized content |
| `/translate/urdu` | POST | Translate content to Urdu |
| `/ingestion/trigger` | POST | Trigger book content ingestion (admin) |
| `/health` | GET | Health check |

**Data Models**:

```python
# User model (Neon Postgres)
class User(Base):
    id: UUID
    email: str (unique, indexed)
    hashed_password: str
    software_background: str  # "beginner" | "intermediate" | "advanced"
    hardware_background: str  # "none" | "hobbyist" | "professional"
    created_at: datetime
    updated_at: datetime

# Session model (better-auth managed)
class Session(Base):
    id: UUID
    user_id: UUID (foreign key)
    token_hash: str
    expires_at: datetime

# UserPreference model
class UserPreference(Base):
    id: UUID
    user_id: UUID (foreign key)
    prefer_urdu: bool
    personalization_enabled: bool
```

**Deployment**:
- Platform: Railway or Fly.io
- Environment Variables: `DATABASE_URL` (Neon), `QDRANT_URL`, `QDRANT_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `BETTER_AUTH_SECRET`
- Health checks: `/health` endpoint monitored
- Scaling: Horizontal (stateless services)

**Success Criteria**:
- [ ] Auth endpoints return < 500ms (p95)
- [ ] RAG queries return < 2 seconds (p95)
- [ ] Personalization completes < 5 seconds
- [ ] Translation maintains 95%+ technical term accuracy
- [ ] Handles 100 concurrent users without degradation

---

## Data Flow Diagrams

### User Signup Flow
```
User → Frontend (/signup)
  → Backend (/auth/signup)
    → Validate email/password
    → Hash password (bcrypt)
    → Insert User record (Neon)
    → Capture background (software/hardware)
    → Return session token (httpOnly cookie)
  → Frontend redirects to /reader
```

### RAG Query Flow (Full-Book Mode)
```
User types question → Frontend chatbot
  → Backend (/rag/query, mode=full-book)
    → OpenAI Agents SDK orchestrates:
      1. Embed query (OpenAI embeddings)
      2. Search Qdrant (top-k=5 chunks)
      3. Retrieve chunk metadata (chapter, section)
      4. Generate answer (GPT-4 with context)
      5. Log query + chunks + response
    → Return RAGResponse{answer, sources[]}
  → Frontend displays answer + cited sources
```

### RAG Query Flow (Selected-Text Mode)
```
User selects text → clicks "Ask about this"
  → Frontend sends query + selected text
    → Backend (/rag/query, mode=selected-text)
      → OpenAI Agents SDK orchestrates:
        1. Embed selected text (context vector)
        2. Search Qdrant near selected text (top-k=3)
        3. Generate answer scoped to selection
        4. Log query + selection + response
      → Return RAGResponse{answer, sources[]}
    → Frontend displays answer in context
```

### Personalization Flow
```
User clicks "Personalize" → Frontend
  → Retrieve user background (local state)
  → Backend (/personalize)
    → Input: chapterId, userBackground
    → OpenAI Agents SDK orchestrates:
      1. Fetch chapter content (from vector store metadata)
      2. Generate personalized version:
         - software_background=beginner → add coding examples
         - hardware_background=professional → skip basics
      3. Cache personalized content (30min TTL)
    → Return PersonalizedContent{text, adaptations[]}
  → Frontend replaces chapter content with personalized version
```

### Urdu Translation Flow
```
User clicks "Translate to Urdu" → Frontend
  → Backend (/translate/urdu)
    → Input: content (markdown text)
    → Claude Sub-Agent orchestrates:
      1. Identify technical terms (preserve English)
      2. Translate narrative text to Urdu
      3. Maintain markdown structure
      4. Validate RTL formatting
    → Return Translation{urduText, preservedTerms[]}
  → Frontend renders Urdu text (RTL CSS applied)
```

---

## Non-Functional Requirements

### Performance

| Metric | Target | Measurement |
|--------|--------|-------------|
| Book page load | < 1 second | Lighthouse |
| Frontend initial load | < 2 seconds | Vercel Analytics |
| RAG query latency (p95) | < 2 seconds | FastAPI logs |
| Personalization latency | < 5 seconds | FastAPI logs |
| Translation latency | < 3 seconds | FastAPI logs |
| Auth operations | < 500ms | FastAPI logs |

### Scalability

- **Book**: Static site scales infinitely (GitHub Pages CDN)
- **Frontend**: Vercel auto-scales (serverless functions)
- **Backend**: Horizontal scaling (Railway/Fly.io multi-instance)
- **Database**: Neon auto-scales (connection pooling), Qdrant Cloud managed

### Security

- **Authentication**: better-auth with httpOnly, Secure, SameSite cookies
- **API**: CORS restricted to frontend domain
- **Database**: Encrypted at rest (Neon default), TLS in transit
- **Secrets**: Environment variables, never committed
- **Input Validation**: Pydantic models enforce schema
- **Rate Limiting**: 100 requests/minute per user (FastAPI middleware)

### Observability

- **Logging**: Structured JSON logs (request_id, user_id, latency, status)
- **Metrics**: Prometheus format (requests, latency histograms, error rates)
- **Tracing**: RAG queries include chunk IDs and relevance scores
- **Alerts**: Error rate > 5% → Slack notification

---

## Deployment Architecture

### Environments

| Environment | Book | Frontend | Backend | Purpose |
|-------------|------|----------|---------|---------|
| Development | Local (localhost:3000) | Local (localhost:3001) | Local (localhost:8000) | Development |
| Staging | GitHub Pages (staging branch) | Vercel (preview) | Railway (staging) | Pre-production testing |
| Production | GitHub Pages (main branch) | Vercel (production) | Railway/Fly.io (production) | Live system |

### CI/CD Pipelines

**Book (GitHub Actions)**:
```yaml
# .github/workflows/deploy-book.yml
on: push to main → build Docusaurus → deploy to gh-pages
```

**Frontend (Vercel)**:
```yaml
# Automatic deployments on push to main
# Preview deployments on PRs
```

**Backend (Railway/Fly.io)**:
```yaml
# Automatic deployments on push to main
# Health checks before promoting
```

---

## Risk Analysis

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| OpenAI API rate limits | Medium | High | Implement request queuing, exponential backoff |
| Qdrant query latency spikes | Low | Medium | Cache frequent queries (Redis), monitor p99 |
| better-auth integration issues | Medium | High | Test auth flows comprehensively, fallback to JWT |
| Urdu translation accuracy | Medium | Medium | Human review sample, maintain term glossary |
| Cost overruns (AI APIs) | High | Medium | Set usage quotas, implement cost alerts |
| Concurrent user bottlenecks | Low | High | Load testing with 500 concurrent users |

---

## Success Metrics

### Technical Metrics
- [ ] 99.9% uptime (backend)
- [ ] < 2s RAG query latency (p95)
- [ ] Zero security vulnerabilities (Snyk scan)
- [ ] 100% type coverage (TypeScript/Python)

### User Metrics
- [ ] 90% authentication success rate
- [ ] 80% chatbot query satisfaction (thumbs up/down)
- [ ] 70% personalization engagement (button clicks)
- [ ] 50% Urdu translation usage (target Urdu-speaking learners)

### Demo Metrics (Hackathon/Judging)
- [ ] 90-second demo completes without errors
- [ ] All features (auth, RAG, personalize, translate) demonstrated live
- [ ] Judges can interact with live deployment
- [ ] Source code reviewed positively for production readiness

---

## Appendices

### A. Technology Justifications

**Docusaurus**: Industry-standard for technical documentation, React-based extensibility, excellent markdown support, built-in search.

**Next.js**: Modern React framework with App Router, excellent TypeScript support, Vercel deployment simplicity, server-side rendering for better SEO.

**FastAPI**: High-performance async Python framework, automatic OpenAPI docs, Pydantic validation, excellent for AI service APIs.

**better-auth**: Modern auth solution with TypeScript support, session management, email/password + OAuth ready, security best practices.

**Qdrant Cloud**: Purpose-built vector database for RAG, managed service (no ops overhead), excellent query performance, filtered search support.

**Neon Serverless Postgres**: Modern Postgres with auto-scaling, generous free tier, branching support for testing, connection pooling.

**OpenAI Agents SDK**: Orchestration for multi-step AI workflows, tool calling, structured outputs, production-ready error handling.

### B. Alternative Architectures Rejected

**Monolithic Next.js (Book + Frontend + API Routes)**: Rejected due to constitution principle I (separation of concerns). Book should deploy independently.

**Self-hosted Qdrant**: Rejected due to operational overhead. Managed service preferred for hackathon speed.

**Firebase Auth**: Rejected in favor of better-auth for better TypeScript integration and backend control.

**Supabase (Postgres + Auth)**: Rejected because better-auth provides more flexibility and Neon offers better serverless characteristics.

---

**Document Status**: ✅ Complete
**Next Steps**: Create AI Architecture Specification, Security & Auth Specification, RAG Flow Specification, Personalization Logic Specification
