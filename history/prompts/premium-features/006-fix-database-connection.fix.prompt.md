---
id: 006
title: Fix asyncpg Connection Error (sslmode unexpected keyword)
stage: fix
date: 2025-12-30
surface: agent
model: sonnet 4.5
feature: infrastructure
branch: 002-physical-ai-textbook
user: anonymous
command: Fix database connection string
labels: ["sqlalchemy", "asyncpg", "postgres", "bug-fix"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - backend/src/db/database.py
tests:
  - init_db() verification script
---

## Prompt

Solve all errors: {"error": "connect() got an unexpected keyword argument 'sslmode'", "event": "Failed to initialize database", "logger": "src.db.database", "level": "error", "timestamp": "2025-12-30T08:34:18.274592Z"}

## Response snapshot

Fixed the database connection error caused by incompatible query parameters in the `asyncpg` connection string.
1. Root Cause: The `asyncpg` driver does not support `sslmode` or `channel_binding` query parameters, which are standard for the synchronous `psycopg2` driver.
2. Fix: Implemented a `prepare_database_url` utility in `src/db/database.py` that strips these unsupported parameters from the `DATABASE_URL` before passing it to `create_async_engine`.
3. Validation: Verified that `init_db()` successfully connects to the database and creates tables using the virtual environment's python.

## Outcome

- ✅ Impact: Backend application starts correctly and connects to Neon Postgres.
- 🧪 Tests: Successfully ran a simulation of `init_db` which confirmed table creation.
- 📁 Files: Updated `backend/src/db/database.py`.
- 🔁 Next prompts: None.
- 🧠 Reflection: When migrating from sync to async PostgreSQL drivers in Python (especially with cloud providers like Neon/Supabase), always ensure the connection string parameters are stripped of driver-specific arguments that aren't shared across DBAPIs.
