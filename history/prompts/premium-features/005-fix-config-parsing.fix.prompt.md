---
id: 005
title: Fix Pydantic Settings ALLOWED_ORIGINS Parsing Error
stage: fix
date: 2025-12-30
surface: agent
model: sonnet 4.5
feature: infrastructure
branch: 002-physical-ai-textbook
user: anonymous
command: Fix config parsing error
labels: ["pydantic", "fastapi", "infrastructure", "bug-fix"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - backend/src/config.py
  - backend/.env
tests:
  - Verify settings parsing script
---

## Prompt

Fix pydantic_settings.sources.SettingsError: error parsing value for field "ALLOWED_ORIGINS" from source "DotEnvSettingsSource". Provide a correct .env template and update config.py.

## Response snapshot

Fixed the Pydantic Settings parsing error for `ALLOWED_ORIGINS`.
1. Root Cause: Pydantic Settings attempts to automatically parse `List[str]` types as JSON when reading from `.env`. Comma-separated strings fail this automatic parsing.
2. Fix: Changed the field type to `Union[str, List[str]]` in `config.py` to prevent premature JSON parsing and added a `mode='before'` validator to manually split the comma-separated string into a list.
3. Template: Updated `.env` to follow standard key=value formatting without redundant quotes for the CORS list.

## Outcome

- ✅ Impact: Backend starts correctly with `uvicorn`. CORS origins are correctly loaded as a Python list.
- 🧪 Tests: Verified with a custom Python script that loads settings and prints the parsed list.
- 📁 Files: Updated `config.py` and `.env`.
- 🔁 Next prompts: None.
- 🧠 Reflection: When using complex types (List, Dict) with Pydantic Settings and .env files, it's often safer to define the type as a Union or use custom validators to handle comma-separated string inputs from the environment.
