---
id: 001
title: Initial Constitution Physical AI Platform
stage: constitution
date: 2025-12-28
surface: agent
model: claude-sonnet-4-5
feature: none
branch: 002-physical-ai-textbook
user: mypc
command: /sp.constitution
labels: ["constitution", "setup", "governance", "principles"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - .specify/memory/constitution.md
tests:
  - No tests (constitution document)
---

## Prompt

You are Claude Code working under Spec-Kit Plus methodology.

ROLE & RESPONSIBILITY
You are acting as:
- Senior AI Architect
- Robotics Curriculum Designer
- Full-Stack Engineer
- AI-Native Book Author
- Startup-grade System Designer

PROJECT TITLE
Physical AI & Humanoid Robotics – AI-Native Textbook Platform

PRIMARY GOAL
Build a unified, production-ready AI-native textbook platform that:
1. Publishes a Physical AI & Humanoid Robotics textbook using Docusaurus
2. Embeds an intelligent RAG chatbot inside the book
3. Supports user authentication, personalization, and Urdu translation
4. Separates frontend, backend, and book cleanly
5. Is deployable and hackathon-ready

STRICT NON-NEGOTIABLE RULES
1. Follow Spec-Kit Plus structure strictly
2. No monolithic architecture
3. Frontend, Backend, Book must be fully separated
4. Every folder must have a clear purpose
5. No placeholder-only code
6. Use production-grade patterns
7. TypeScript for frontend, Python for backend
8. All AI features must be modular and reusable
9. Authentication must use better-auth
10. RAG chatbot must:
   - Answer questions from the entire book
   - Answer questions ONLY from user-selected text
11. Personalization & Urdu translation must be user-triggered via buttons
12. Assume this project will be judged by senior engineers & startup founders

FIXED TECH STACK
Book: Docusaurus + GitHub Pages
Frontend: Next.js (App Router) + TypeScript + Tailwind CSS + ChatKit SDK + better-auth client
Backend: FastAPI + OpenAI Agents SDK + Qdrant Cloud + Neon Serverless Postgres + better-auth server
AI Architecture: RAG + Claude Sub-Agents + Agent Skills + Modular agent design
Deployment: GitHub Pages (book) + Vercel (frontend) + Railway/Fly.io (backend)

STEP-BY-STEP EXECUTION PLAN
STEP 1 — SPEC FILES: Generate all spec documents inside /spec
STEP 2 — BOOK CREATION: Create Docusaurus textbook with proper sidebar and all modules
STEP 3 — BACKEND: Implement FastAPI backend with better-auth, RAG, agents
STEP 4 — FRONTEND: Build Next.js frontend with auth, chatbot, personalization
STEP 5 — BONUS INTELLIGENCE: Create reusable Claude Sub-Agents and Agent Skills
STEP 6 — DEPLOYMENT: Prepare deployment configs
STEP 7 — DEMO: Generate 90-second demo script

## Response snapshot

Created comprehensive constitution for Physical AI & Humanoid Robotics textbook platform with:

**Core Principles (6 Non-Negotiable)**:
1. Separation of Concerns - Frontend/Backend/Book must remain fully separated and independently deployable
2. Production-Grade Patterns - No placeholder code, proper auth, migrations, error handling, type checking
3. AI-First Architecture - Modular AI with OpenAI Agents SDK + Claude Sub-Agents, RAG pipeline abstracted
4. User-Triggered Intelligence - Personalize and translate buttons (explicit user actions, not automatic)
5. Test-First for Critical Paths - Auth flows, RAG retrieval, API contracts tested before implementation
6. Observability & Debugging - Structured logging with request IDs, timing, RAG chunk tracing

**Architecture Constraints**:
- Technology Stack (LOCKED) - Docusaurus, Next.js 14+, FastAPI, Neon Postgres, Qdrant Cloud
- Folder Structure (IMMUTABLE) - book/, frontend/, backend/, deployment/, spec/ with clear boundaries
- Data Ownership & Privacy - GDPR-compliant patterns, encrypted storage, anonymous RAG queries

**Development Workflow**:
- Spec-Kit Plus Adherence (MANDATORY) - /sp.specify → /sp.plan → /sp.tasks → /sp.implement
- Git Workflow - Branch naming `###-feature-name`, atomic commits with task IDs
- Quality Gates - Type checks, integration tests, no secrets, structured logging, contract documentation

**Governance**:
- Amendment Process - Documented rationale, impact analysis, semantic versioning (MAJOR/MINOR/PATCH)
- Compliance & Review - Every PR verifies separation, production patterns, AI modularity, user agency, tests
- Complexity Justification - Violations documented in Complexity Tracking table with explicit approval

Version 1.0.0 established as initial constitution (ratified 2025-12-28).

## Outcome

- ✅ Impact: Constitution established with 6 core principles, 3 architecture constraint sections, comprehensive governance model. All placeholders filled. Templates reviewed and compatible.
- 🧪 Tests: N/A (governance document)
- 📁 Files: Created `.specify/memory/constitution.md` (235 lines, fully populated)
- 🔁 Next prompts: User can now run `/sp.specify` to create feature specifications that will be validated against these principles
- 🧠 Reflection: Constitution balances startup-grade quality requirements with hackathon speed constraints. Non-negotiable rules prevent architectural drift. Explicit stack lock prevents mid-project pivots.

## Evaluation notes (flywheel)

- Failure modes observed: None (initial creation)
- Graders run and results (PASS/FAIL): Manual validation - PASS (no unresolved placeholders, all sections complete, semantic versioning applied, rationale for each principle documented)
- Prompt variant (if applicable): N/A (first iteration)
- Next experiment (smallest change to try): Validate constitution effectiveness during first `/sp.specify` run - check if Constitution Check section in plan-template.md properly references the 6 principles
