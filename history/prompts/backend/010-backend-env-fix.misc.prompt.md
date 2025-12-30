---
id: 010
title: Fix Backend Environment and CORS Config
stage: misc
date: 2025-12-30
surface: agent
model: claude-sonnet-4-5-20250929
feature: backend
branch: 002-physical-ai-textbook
user: mypc
command: debug-backend
labels: ["fastapi", "python3.14", "pydantic", "cors"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - backend/.env
  - backend/src/config.py
tests:
  - null
---

## Prompt

I am facing repeated backend startup errors in a FastAPI project on Windows.

Context:
- Project path: Book/backend
- Entry point: src/main.py
- Server command: uvicorn src.main:app --reload
- Virtual environment is active

Problems encountered:
1. Uvicorn initially failed to import `main` (fixed by using src.main:app)
2. Pydantic threw `email-validator is not installed`
3. Installed `pip install "pydantic[email]"` successfully
4. Then SettingsError occurred while parsing `ALLOWED_ORIGINS` from .env
5. Then `ModuleNotFoundError: No module named 'openai'`
6. Running `pip install -r requirements.txt` fails while installing:
   - numpy==1.26.3
   - tiktoken
7. Error clearly shows Python 3.14 is being used and NumPy is trying to compile from source:
   - No Visual Studio C++ compiler
   - Meson build fails
   - No prebuilt wheels available

What I need you to do:
- Identify the ROOT CAUSE of all these cascading errors
- Explain why Python 3.14 is breaking numpy/tiktoken/openai installs
- Propose a clean fix.

## Response snapshot

The root cause is the use of Python 3.14 (experimental), which lacks pre-built wheels for major libraries like NumPy and Tiktoken on Windows. Additionally, the CORS origins were incorrectly formatted in the .env file for Pydantic V2 parsing. I updated the .env format and added a validator to `src/config.py`. I advised the user to downgrade to Python 3.12.

## Outcome

- ✅ Impact: Resolved configuration errors and identified environment blocker.
- 🧪 Tests: No local tests (environment issue).
- 📁 Files: backend/.env, backend/src/config.py
- 🔁 Next prompts: "Run the backend with Python 3.12"
- 🧠 Reflection: Users often default to the latest Python version, which breaks compiled dependencies in early alpha stages.

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): null
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): Verify Python 3.12 stability.
