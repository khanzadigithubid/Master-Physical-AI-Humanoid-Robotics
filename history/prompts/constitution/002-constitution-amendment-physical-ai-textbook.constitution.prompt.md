---
id: 002
title: Constitution amendment for Physical AI textbook platform
stage: constitution
date: 2025-12-28
surface: agent
model: claude-sonnet-4-5-20250929
feature: none
branch: 002-physical-ai-textbook
user: Khanzadi Wazir Ali
command: /sp.constitution
labels: ["constitution", "architecture", "governance", "physical-ai", "robotics"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - .specify/memory/constitution.md
tests:
  - Validated constitution against comprehensive user requirements
  - Verified template consistency with constitutional principles
  - Checked all dependent templates (spec, plan, tasks)
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
Book:
- Docusaurus
- GitHub Pages deployment

Frontend:
- Next.js (App Router)
- TypeScript
- Tailwind CSS
- ChatKit SDK
- better-auth client

Backend:
- FastAPI
- OpenAI Agents SDK
- Qdrant Cloud (Vector DB)
- Neon Serverless Postgres
- better-auth server integration

AI Architecture:
- RAG (Retrieval Augmented Generation)
- Claude Sub-Agents & Agent Skills
- Modular agent design

Deployment:
- Book → GitHub Pages
- Frontend → Vercel
- Backend → Railway / Fly.io

PROJECT FOLDER STRUCTURE (YOU MUST FOLLOW EXACTLY)

physical-ai-textbook/
│
├── spec/
│   ├── specs/<feature>/spec.md
│   ├── specs/<feature>/plan.md
│   └── specs/<feature>/tasks.md
│
├── book/
│   ├── docs/
│   ├── src/
│   ├── docusaurus.config.js
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── lib/
│   │   └── types/
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── api/
│   │   ├── agents/
│   │   ├── services/
│   │   ├── auth/
│   │   └── db/
│   ├── requirements.txt
│   └── Dockerfile
│
├── deployment/
│   ├── vercel.json
│   ├── docker-compose.yml
│   └── github-pages.yml
│
├── .env.example
├── README.md
└── demo/
    └── demo-script.md

STEP-BY-STEP EXECUTION PLAN

STEP 1 — SPEC FILES
Generate all spec documents inside /spec explaining:
- System design
- AI architecture
- Security & auth
- RAG flow
- Personalization logic

STEP 2 — BOOK CREATION
Create Docusaurus textbook with:
- Proper sidebar
- All modules structured
- Technical, university-level language
- Robotics + AI depth

STEP 3 — BACKEND
Implement FastAPI backend with:
- better-auth signup/signin
- User background capture (software + hardware)
- RAG ingestion pipeline
- Qdrant vector search
- Neon Postgres storage
- Selected-text-only answering
- AI agents using OpenAI Agents SDK

STEP 4 — FRONTEND
Build Next.js frontend with:
- Auth pages
- Chapter reader UI
- Personalize button
- Urdu translate button
- Embedded chatbot
- Secure API communication

STEP 5 — BONUS INTELLIGENCE
Create reusable:
- Claude Sub-Agents
- Agent Skills
- Modular AI logic

STEP 6 — DEPLOYMENT
Prepare deployment configs for:
- GitHub Pages (Book)
- Vercel (Frontend)
- Railway/Fly.io (Backend)

STEP 7 — DEMO
Generate a 90-second demo script explaining:
- Problem
- Architecture
- AI features
- Personalization
- RAG chatbot

IMPORTANT FINAL INSTRUCTION
After creating each major section:
- Briefly explain its purpose
- Keep explanations concise
- Maintain startup-grade quality

Begin execution now.

## Response snapshot

Constitution updated successfully with version 1.0.1 (PATCH bump).

**Changes Made:**
1. Updated Sync Impact Report with version bump rationale
2. Corrected ratification date from 2025-12-28 to 2025-12-25 (repository creation date)
3. Updated last amended date to 2025-12-28 (today)
4. Verified all six core principles align with user requirements:
   - I. Separation of Concerns (Frontend/Backend/Book independence)
   - II. Production-Grade Patterns (no placeholders, better-auth, type safety)
   - III. AI-First Architecture (modular RAG, OpenAI Agents SDK, Claude Sub-Agents)
   - IV. User-Triggered Intelligence (explicit buttons for personalization/translation)
   - V. Test-First for Critical Paths (auth, RAG, API contracts)
   - VI. Observability & Debugging (structured logging, error tracing)
5. Validated Architecture Constraints section captures locked tech stack and folder structure
6. Confirmed Development Workflow mandates Spec-Kit Plus adherence
7. Verified Governance section defines amendment process and compliance review

**Template Consistency Check:**
- ✅ spec-template.md: Compatible (prioritized user stories with acceptance scenarios)
- ✅ plan-template.md: Compatible (includes Constitution Check gate)
- ✅ tasks-template.md: Compatible (test-first discipline, user story organization)
- ✅ command files in .claude/commands/: Compatible (reviewed sp.constitution.md, sp.plan.md, sp.tasks.md)

**No Follow-up Actions Required:**
All placeholders filled, all principles declarative and testable, all dependent artifacts aligned.

## Outcome

- ✅ Impact: Constitution v1.0.1 ratified with comprehensive principles for Physical AI & Humanoid Robotics platform. All architectural constraints, tech stack decisions, and governance processes documented.
- 🧪 Tests: Template consistency validated across spec/plan/tasks templates and command files
- 📁 Files: .specify/memory/constitution.md (version 1.0.1)
- 🔁 Next prompts: Ready to proceed with /sp.specify for individual features or begin implementation planning
- 🧠 Reflection: Constitution provides clear boundaries for hackathon-ready, production-grade development. Separation of concerns and AI-first architecture principles will enable parallel development and showcase advanced agent orchestration.

## Evaluation notes (flywheel)

- Failure modes observed: None. Constitution already well-formed from previous session.
- Graders run and results (PASS/FAIL): Manual validation PASS - all principles testable and aligned with user requirements
- Prompt variant (if applicable): N/A - constitution update workflow
- Next experiment (smallest change to try): N/A - constitution complete and validated
