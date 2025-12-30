# Physical AI & Humanoid Robotics Platform Constitution

<!--
Sync Impact Report:
- Version change: Initial → 1.0.1
- Project: Physical AI & Humanoid Robotics – AI-Native Textbook Platform
- Rationale: PATCH version bump for clarification of folder structure detail
- Modified principles: None (structural clarification only)
- Added sections: Enhanced folder structure detail in Architecture Constraints
- Templates requiring updates:
  ✅ spec-template.md (reviewed - compatible)
  ✅ plan-template.md (reviewed - compatible)
  ✅ tasks-template.md (reviewed - compatible)
  ✅ command files in .claude/commands/ (reviewed - compatible)
- Follow-up TODOs: None
-->

## Core Principles

### I. Separation of Concerns (NON-NEGOTIABLE)

**Frontend, Backend, and Book MUST remain fully separated architecturally and deployable independently.**

- Book (Docusaurus) deploys to GitHub Pages with zero backend dependencies
- Frontend (Next.js) communicates with Backend only via REST APIs
- Backend (FastAPI) exposes well-defined API contracts
- No monolithic architecture patterns permitted
- Each component MUST have clear responsibility boundaries
- Cross-component communication only through documented interfaces

**Rationale**: Independent deployability enables parallel development, isolated testing, and incremental releases. Judges and stakeholders can evaluate each layer independently.

### II. Production-Grade Patterns (NON-NEGOTIABLE)

**Every implementation MUST follow production-ready standards suitable for senior engineering review.**

- No placeholder-only code or TODO-driven implementations
- All authentication via better-auth with proper session management
- Database migrations tracked and versioned
- Error handling comprehensive with structured logging
- Security best practices enforced (input validation, parameterized queries, CORS, secrets management)
- Performance budgets defined and monitored
- Code MUST pass type checking (TypeScript/Python type hints)
- Every folder has documented purpose in README or inline comments

**Rationale**: Project will be judged by senior engineers and startup founders. Production patterns demonstrate engineering maturity and deployment readiness.

### III. AI-First Architecture (NON-NEGOTIABLE)

**All AI features MUST be modular, reusable, and leverage OpenAI Agents SDK + Claude Sub-Agents.**

- RAG pipeline independently testable with clear ingestion/retrieval separation
- Vector database (Qdrant Cloud) abstracted behind service layer
- AI agents designed as composable skills following Claude Agent SDK patterns
- Full-book RAG and selected-text RAG implemented as separate query modes
- Personalization engine context-aware (user background, chapter content)
- Translation service (Urdu) preserves technical terminology accuracy
- All AI prompts versioned and auditable

**Rationale**: Modular AI enables reuse across features, independent testing, and showcases advanced agent orchestration patterns for hackathon differentiation.

### IV. User-Triggered Intelligence

**Personalization and translation MUST be explicit user actions, not automatic.**

- Personalize button triggers background-aware content adaptation
- Urdu translate button triggers translation API call
- User controls AI feature invocation (consent-driven)
- Original content always accessible (no forced transformations)
- User preferences persisted in Neon Postgres with proper schema

**Rationale**: User agency over AI transformations prevents unwanted modifications and demonstrates respect for learner autonomy. Critical for academic contexts.

### V. Test-First for Critical Paths (REQUIRED)

**Authentication, RAG retrieval, and API contracts MUST have tests before implementation.**

- Auth flows tested with better-auth test utilities
- RAG retrieval accuracy validated against known queries
- API endpoint contracts verified with integration tests
- Frontend-backend integration tested with mock servers
- Edge cases documented and tested (empty queries, auth failures, vector search misses)

**Rationale**: Core user journeys (auth, chatbot, personalization) are demo-critical. Test coverage ensures reliability under demo pressure.

### VI. Observability & Debugging

**Structured logging and error tracing MUST be production-ready.**

- FastAPI logs include request IDs, user context, and timing
- Frontend errors captured with stack traces and user session context
- RAG queries logged with retrieved chunks and relevance scores
- Database queries logged with execution time and parameters
- Deployment logs aggregated (Railway/Fly.io → centralized logging)

**Rationale**: Demo environments require rapid debugging. Structured logs enable quick root cause analysis when issues arise.

## Architecture Constraints

### Technology Stack (LOCKED)

**Stack decisions are final and MUST NOT be changed without constitutional amendment.**

- **Book**: Docusaurus (React-based static site generator)
- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS, ChatKit SDK, better-auth client
- **Backend**: FastAPI, Python 3.11+, OpenAI Agents SDK, better-auth server integration
- **Database**: Neon Serverless Postgres (relational), Qdrant Cloud (vector)
- **Deployment**: GitHub Pages (book), Vercel (frontend), Railway/Fly.io (backend)
- **AI Models**: OpenAI GPT-4 (RAG), Claude (sub-agents), custom embeddings for vector search

**Rationale**: Technology choices optimized for hackathon speed, startup-grade quality, and AI-native capabilities. Changing stack mid-project introduces unacceptable risk.

### Folder Structure (IMMUTABLE)

**Project MUST follow prescribed folder layout exactly.**

```
physical-ai-textbook/
├── book/                     # Docusaurus textbook
│   ├── docs/                 # Markdown chapters
│   ├── src/                  # Custom React components
│   └── docusaurus.config.js
├── frontend/                 # Next.js application
│   ├── src/
│   │   ├── app/              # App Router pages
│   │   ├── components/       # Reusable UI components
│   │   ├── lib/              # better-auth client, API client
│   │   └── types/            # TypeScript definitions
│   └── package.json
├── backend/                  # FastAPI application
│   ├── src/
│   │   ├── api/              # Route handlers
│   │   ├── agents/           # OpenAI Agents SDK logic
│   │   ├── services/         # RAG, personalization, translate
│   │   ├── auth/             # better-auth server integration
│   │   └── db/               # Neon + Qdrant clients
│   └── requirements.txt
├── deployment/               # Deployment configurations
├── spec/                     # Feature specifications
└── .env.example
```

**Rationale**: Clear boundaries enable parallel development, isolated testing, and independent deployment. Deviations break build automation and deployment pipelines.

### Data Ownership & Privacy

**User data MUST be handled with GDPR-compliant patterns.**

- User background (software/hardware experience) stored encrypted at rest
- Personalization history associated with user ID, deletable on request
- RAG queries logged anonymously (no PII in vector embeddings)
- Session tokensHttpOnly, Secure, SameSite strict
- No third-party analytics without consent
- Export user data endpoint required

**Rationale**: Academic platforms handle sensitive learner data. Privacy-first design prevents regulatory issues and builds trust.

## Development Workflow

### Spec-Kit Plus Adherence (MANDATORY)

**All features MUST follow Spec-Kit Plus lifecycle.**

1. **Specification**: `/sp.specify` creates `spec.md` with user stories, requirements, success criteria
2. **Planning**: `/sp.plan` generates `plan.md` with architecture decisions, API contracts, technical context
3. **Task Generation**: `/sp.tasks` produces `tasks.md` with dependency-ordered implementation tasks
4. **Implementation**: `/sp.implement` executes tasks with test-first discipline
5. **History Recording**: PHR (Prompt History Record) created after every user interaction
6. **ADR Documentation**: Architectural Decision Records created for significant decisions (with user consent)

**Enforcement**:
- No implementation without approved spec + plan
- All user prompts MUST generate PHR in `history/prompts/` (routed by stage: constitution/feature/general)
- ADRs suggested when three-part test passes (Impact + Alternatives + Scope)
- Constitution violations require explicit justification in Complexity Tracking table

### Git Workflow

**Branch naming**: `###-feature-name` format (e.g., `001-rag-chatbot`, `002-urdu-translation`)
**Commits**: Atomic, referencing task IDs (e.g., "T015: Implement RAG retrieval service")
**PRs**: Require spec link, task checklist, demo screenshots/video
**Review gates**: Type checks pass, tests green, no secrets committed

### Quality Gates

**Pre-merge checklist**:
- [ ] TypeScript/Python type checking passes
- [ ] Integration tests for API contracts pass
- [ ] No hardcoded secrets (all via .env)
- [ ] Structured logging added for new endpoints
- [ ] Frontend-backend contract documented in `contracts/`
- [ ] User story acceptance criteria validated
- [ ] Demo script updated if new user-facing feature

## Governance

### Amendment Process

**Constitution changes require**:
1. Documented rationale for proposed change
2. Impact analysis on templates (spec/plan/tasks)
3. Version bump per semantic versioning:
   - **MAJOR**: Backward-incompatible principle changes (e.g., removing separation of concerns)
   - **MINOR**: New principle added or section expanded (e.g., adding performance budgets)
   - **PATCH**: Clarifications, typo fixes, non-semantic improvements
4. Sync Impact Report prepended to constitution file
5. Update dependent templates and command files
6. Approval from project lead or team consensus

### Compliance & Review

**Every PR MUST verify**:
- Separation of concerns maintained (frontend/backend/book independence)
- Production patterns followed (no placeholder code)
- AI modularity preserved (no hardcoded prompts in business logic)
- User agency respected (no forced AI transformations)
- Tests exist for critical paths (auth, RAG, API contracts)

**Audit triggers**:
- Before demo preparation (full constitution review)
- After major architecture changes (ADR + constitution check)
- When technical debt identified (Complexity Tracking table review)

### Complexity Justification

**Constitution violations MUST be documented in plan.md Complexity Tracking table**:
- Violation description (e.g., "4th deployment target added")
- Why needed (specific technical/business requirement)
- Why simpler alternative rejected (concrete rationale)
- Approval status (awaiting/approved)

**Unjustified complexity is grounds for PR rejection.**

---

**Version**: 1.0.1 | **Ratified**: 2025-12-25 | **Last Amended**: 2025-12-28
