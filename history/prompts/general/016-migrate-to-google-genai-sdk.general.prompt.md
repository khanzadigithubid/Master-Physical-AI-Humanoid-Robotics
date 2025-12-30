---
id: 016
title: Migrate to New google-genai Python SDK
stage: general
date: 2025-12-30
surface: agent
model: claude-sonnet-4-5-20250929
feature: none
branch: 002-physical-ai-textbook
user: mypc
command: /sp.phr
labels: ["gemini", "sdk-migration", "google-genai", "async"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
 - backend/requirements.txt
 - backend/src/services/gemini_service.py
tests:
 - backend/src/scripts/ingest_book.py
---

## Prompt

I have a FastAPI project using the deprecated package `google.generativeai`. The server shows a warning:

"All support for the `google.generativeai` package has ended. It will no longer receive updates or bug fixes. Please switch to the `google.genai` package."

Please help me:

1. Update all imports and code using `google.generativeai` to `google.genai`.
2. Ensure the FastAPI project works without warnings.
3. Show example usage for the new package in my project setup.

## Response snapshot

Migrated the backend from the deprecated `google-generativeai` package to the modern `google-genai` SDK. Rewrote the `GeminiService` to use `genai.Client` and `client.aio` for async operations, updated `requirements.txt`, and verified the migration with the book ingestion script.

## Outcome

- ✅ Impact: Future-proofed the application by moving to the currently supported Google AI SDK and resolving the deprecation warning.
- 🧪 Tests: Successful execution of `ingest_book.py` (indexed 135 chunks).
- 📁 Files: backend/requirements.txt, backend/src/services/gemini_service.py
- 🔁 Next prompts: none
- 🧠 Reflection: The new `google-genai` SDK has a significantly different structure (Client-based vs class-based). Migrating early avoids long-term maintenance debt.

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): null
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): none
