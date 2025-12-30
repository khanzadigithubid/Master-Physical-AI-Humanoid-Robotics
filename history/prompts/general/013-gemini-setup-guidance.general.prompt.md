---
id: 013
title: Provide Gemini API and FastAPI Setup Guidance
stage: general
date: 2025-12-30
surface: agent
model: claude-sonnet-4-5-20250929
feature: none
branch: 002-physical-ai-textbook
user: mypc
command: /sp.phr
labels: ["gemini", "fastapi", "troubleshooting", "python-dotenv"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
 - none
tests:
 - none
---

## Prompt

I am working on a FastAPI backend project that uses the Gemini API via google.generativeai.
When I run my server, I get the following error:

ModuleNotFoundError: No module named 'google.generativeai'

Project details:
- Python version: 3.12
- Virtual environment: active
- Gemini API is used in src/services/gemini_service.py
- GOOGLE_API_KEY is stored in a .env file

Please provide:
1. The correct Python package to install for google.generativeai.
2. The exact pip install command.
3. Any necessary import statement changes.
4. How to safely load GOOGLE_API_KEY from .env using python-dotenv.
5. Steps to ensure the backend runs successfully on uvicorn.
6. Minimal, production-ready instructions.

Also mention any common mistakes that could cause a blank page or failed signup in the browser.

## Response snapshot

Provided comprehensive troubleshooting steps for resolving ModuleNotFoundError with google-generativeai, including installation commands, import syntax, Pydantic-based configuration logic, and uvicorn execution steps. Also addressed common frontend/backend bridge failures like CORS and Pydantic validation.

## Outcome

- ✅ Impact: Clarified installation and configuration steps for the user to resolve environment-related crashes.
- 🧪 Tests: none
- 📁 Files: none
- 🔁 Next prompts: none
- 🧠 Reflection: Users often confuse the import name (google.generativeai) with the package name (google-generativeai). Explicitly highlighting this distinction prevents installation errors.

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): null
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): none
