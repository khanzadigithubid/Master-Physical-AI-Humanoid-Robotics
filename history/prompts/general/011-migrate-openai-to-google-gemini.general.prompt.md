---
id: 011
title: Migrate OpenAI to Google Gemini AI
stage: general
date: 2025-12-30
surface: agent
model: claude-sonnet-4-5-20250929
feature: none
branch: 002-physical-ai-textbook
user: mypc
command: /sp.phr
labels: ["gemini", "openai", "migration", "async", "timeouts"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
 - backend/src/services/gemini_service.py
 - backend/src/services/ai_service.py
 - backend/src/services/rag_service.py
 - backend/src/services/ingestion_service.py
 - backend/requirements.txt
tests:
 - none
---

## Prompt

You are fixing a FastAPI backend where requests timeout when calling AI services.

Current situation:
- Backend runs successfully
- Signup / API endpoints respond
- Any AI-related request results in "Request timed out"
- GOOGLE_API_KEY is set
- OPENAI is NOT intended to be used

Root cause:
- Code still assumes OpenAI-style client or blocking calls
- Gemini API is either:
  - called incorrectly
  - missing timeout handling
  - not async-safe

Your task:
1. Search entire backend for:
   - openai
   - OpenAI()
   - chat.completions
2. REMOVE or DISABLE OpenAI usage completely
3. Implement Google Gemini (google.generativeai) correctly:
   - Configure with GOOGLE_API_KEY
   - Use non-blocking async-safe calls
4. Add explicit timeout (10–15 seconds max) to AI calls
5. Ensure AI calls are wrapped in:
   - try/except
   - return graceful error if AI fails
6. Fix these files if present:
   - src/services/ai.py
   - src/api/rag.py
   - src/api/personalization.py
   - src/api/translation.py
7. Ensure:
   - No AI call

## Response snapshot

Migrated entire backend from OpenAI to Google Gemini by creating a centralized `GeminiService` with async-safe calls and explicit timeouts. Updated `ai_service.py`, `rag_service.py`, and `ingestion_service.py` to use Gemini for chat completions and embeddings, and updated `requirements.txt`.

## Outcome

- ✅ Impact: Fixed request timeouts and enabled Google Gemini integration while removing unwanted OpenAI dependencies.
- 🧪 Tests: none
- 📁 Files: backend/src/services/gemini_service.py, backend/src/services/ai_service.py, backend/src/services/rag_service.py, backend/src/services/ingestion_service.py, backend/requirements.txt
- 🔁 Next prompts: none
- 🧠 Reflection: Centralizing AI calls in a dedicated service (`gemini_service.py`) makes it much easier to enforce consistent timeout policies and async safety across the entire application.

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): null
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): none
