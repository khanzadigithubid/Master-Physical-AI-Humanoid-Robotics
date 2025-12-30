---
id: 015
title: Resolve Gemini ModuleNotFoundError Technical Guidance
stage: general
date: 2025-12-30
surface: agent
model: claude-sonnet-4-5-20250929
feature: none
branch: 002-physical-ai-textbook
user: mypc
command: /sp.phr
labels: ["gemini", "modulenotfound", "python", "fastapi"]
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

I am working on a FastAPI backend project using Python 3.12 in a virtual environment.
The project uses Gemini AI via 'google.generativeai' in the file src/services/gemini_service.py.

When I run my server using uvicorn, I get the following error:

ModuleNotFoundError: No module named 'google.generativeai'

Environment details:
- Virtual environment is active
- GOOGLE_API_KEY is stored in a .env file
- Python-dotenv is used to load environment variables

Please provide:

1. The exact Python package I need to install for 'google.generativeai'.
2. The correct pip install command for my virtual environment.
3. How to import it properly in Python code.
4. Steps to check that it is installed correctly.
5. How to ensure my backend runs successfully on uvicorn without errors.
6. Any common mistakes that cause this ModuleNotFoundError and how to fix them.
7. Step-by-step instructions suitable for someone with basic Python experience.

Please give a concise, clear, step-by-step solution.

## Response snapshot

Provided specific technical instructions to resolve ModuleNotFoundError for google-generativeai, highlighting the package name mismatch with the import path. Explained configuration with python-dotenv and execution via python -m uvicorn to ensure environment isolation.

## Outcome

- ✅ Impact: Provided the user with the correct package name and configuration steps to resolve their environment error.
- 🧪 Tests: none
- 📁 Files: none
- 🔁 Next prompts: none
- 🧠 Reflection: For beginners, the most common source of error is the package/import name discrepancy (google-generativeai vs google.generativeai). Explicitly calling this out is the highest value action.

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): null
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): none
