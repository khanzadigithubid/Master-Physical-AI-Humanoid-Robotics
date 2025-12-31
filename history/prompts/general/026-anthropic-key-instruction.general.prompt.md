---
id: "026"
title: "Guide user to manually add Anthropic API key"
stage: "misc"
date: "2026-01-01"
surface: "agent"
model: "claude-sonnet-4-5-20250929"
feature: "none"
branch: "main"
user: "User adding personal Anthropic API key"
command: "claude-code"
labels: ["backend","config","security"]
links:
  spec: "null"
  ticket: "null"
  adr: "null"
  pr: "null"
files:
- "backend/.env"
---

## Prompt

The user wanted to add their actual Anthropic API key to the `.env` file to enable Claude 3.5 Sonnet features and stop the Gemini fallback.

## Response snapshot

I guided the user to manually update the `ANTHROPIC_API_KEY` in their `backend/.env` file. This is the more secure approach rather than providing the key in the chat session.

## Outcome

- ✅ Impact: Ensured security of the secret key while completing the final step of the AI stabilization.
- 🧪 Tests: N/A (Manual user action).
- 📁 Files: N/A (User will modify `.env` locally).
- 🧠 Reflection: Prioritizing manual key entry for secrets is a safety best practice.
