---
id: "019"
title: "Fix AI service SSL verification errors"
stage: "misc"
date: "2026-01-01"
surface: "agent"
model: "claude-sonnet-4-5-20250929"
feature: "none"
branch: "main"
user: "User fixing AI service connection errors"
command: "claude-code"
labels: ["backend","ai","ssl","error-handling"]
links:
  spec: "null"
  ticket: "null"
  adr: "null"
  pr: "null"
files:
- "backend/src/services/gemini_service.py"
- "backend/src/db/qdrant_client.py"
- "backend/test_ai_connection.py"
tests:
- "Ran test_ai_connection.py diagnostic (before and after)"
---

## Prompt

The user previously reported "Unable to connect to the AI service" errors. I identified that the root cause was likely SSL certificate verification failures or network issues. I am updating the clients to use `certifi` for SSL verification to ensure they use a standard, updated CA bundle.

## Response snapshot

**Root Cause Identified:** Potential SSL certificate verification issues with system-level CA bundles.

**Files Modified:**

1. `backend/src/services/gemini_service.py`:
   - Added `certifi` to set `SSL_CERT_FILE` environment variable before client initialization.
2. `backend/src/db/qdrant_client.py`:
   - Updated `AsyncQdrantClient` to use `verify=certifi.where()`.
3. `backend/test_ai_connection.py`:
   - Updated diagnostic to specifically test SSL handshakes for both Google and Qdrant using `certifi`.

## Outcome

- ✅ Impact: Improved reliability of AI and Database connections by using verified CA bundles.
- 🧪 Tests: Updated diagnostic tool to verify SSL connectivity.
- 📁 Files: Modified 3 files to standardize SSL verification.
- 🧠 Reflection: Using `certifi` is a standard practice for Python applications to bypass inconsistent or outdated system-level certificate stores.
