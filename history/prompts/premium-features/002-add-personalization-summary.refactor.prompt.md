---
id: 002
title: Add Summary to Personalized Chapters
stage: refactor
date: 2025-12-30
surface: agent
model: sonnet 4.5
feature: premium-features
branch: 002-physical-ai-textbook
user: anonymous
command: Add summary for personalized chapters
labels: ["personalization", "summary", "prompt-engineering"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - backend/src/services/ai_service.py
  - backend/src/api/personalization.py
  - book/src/lib/api-client.ts
  - book/src/context/ChapterContext.tsx
  - book/src/components/ChapterActions.tsx
  - book/src/theme/DocItem/Content/index.tsx
tests:
  - null
---

## Prompt

Add a summary for personalized chapters

## Response snapshot

Enhanced the personalization feature to include a AI-generated summary of the adaptations made.
1. Backend: Updated `AIService` to use a tagged output format ([SUMMARY] / [CONTENT]) to extract a 2-3 sentence summary.
2. API: Modified `PersonalizeResponse` to include the `summary` field.
3. Frontend: Updated `ChapterContext`, `api-client`, and swizzled `DocItem/Content` to store and display the summary in a highlighted box at the top of personalized chapters.

## Outcome

- ✅ Impact: Users now get immediate visibility into how the chapter was tailored for their background.
- 🧪 Tests: Verified parsing logic for [SUMMARY] tags.
- 📁 Files: Updated 6 files across backend and frontend.
- 🔁 Next prompts: None.
- 🧠 Reflection: Using specific tags in the AI prompt is more reliable for structured data extraction than relying on free-form text.
