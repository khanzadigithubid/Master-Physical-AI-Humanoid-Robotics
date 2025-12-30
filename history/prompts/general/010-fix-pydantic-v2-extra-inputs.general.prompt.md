---
id: 010
title: Fix Pydantic V2 Extra Input Settings Validation
stage: general
date: 2025-12-30
surface: agent
model: claude-sonnet-4-5-20250929
feature: none
branch: 002-physical-ai-textbook
user: mypc
command: /sp.phr
labels: ["pydantic", "fastapi", "settings", "validation"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
 - backend/src/config.py
tests:
 - none
---

## Prompt

You are working inside a FastAPI backend using Pydantic v2 and pydantic-settings.

Current error:

pydantic_core._pydantic_core.ValidationError:
GOOGLE_API_KEY
Extra inputs are not permitted [type=extra_forbidden]

Context:
- I added GOOGLE_API_KEY and ANTHROPIC_API_KEY to backend/.env
- Backend crashes when starting uvicorn
- Error originates from src/config.py → Settings()

Root cause:
- Settings model does NOT define GOOGLE_API_KEY / ANTHROPIC_API_KEY
- Pydantic v2 forbids extra env vars by default

Your task:
1. Open `backend/src/config.py`
2. Update the `Settings` class to properly support AI providers
3. Add the following fields to Settings with correct typing:
   - GOOGLE_API_KEY: Optional[str]
   - ANTHROPIC_API_KEY: Optional[str]
   - OPENAI_API_KEY: Optional[str]
4. Ensure:
   - extra env vars do NOT crash the app
   - Use: `model_config = SettingsConfigDict(extra="allow")`
5. Keep ALLOWED_ORIGINS parsing safe (comma-separated string → list)
6. Do NOT remove existing settings
7. Return the FULL

## Response snapshot

Updated `backend/src/config.py` to add `GOOGLE_API_KEY`, made `OPENAI_API_KEY` and `ANTHROPIC_API_KEY` optional, and added `SettingsConfigDict` with `extra="allow"` to prevent validation errors from undefined environment variables.

## Outcome

- ✅ Impact: Fixed application crash on startup caused by Pydantic V2 strictly forbidding extra environment variables.
- 🧪 Tests: none
- 📁 Files: backend/src/config.py
- 🔁 Next prompts: none
- 🧠 Reflection: Pydantic V2's default `extra="forbid"` for `BaseSettings` (via `SettingsConfigDict`) is a breaking change from V1 and frequently causes startup crashes when new environment variables are added to `.env` before the code is updated.

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): null
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): none
