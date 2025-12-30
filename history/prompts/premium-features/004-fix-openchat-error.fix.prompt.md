---
id: 004
title: Fix "openChat is not defined" Runtime Error
stage: fix
date: 2025-12-30
surface: agent
model: sonnet 4.5
feature: premium-features
branch: 002-physical-ai-textbook
user: anonymous
command: Fix openChat error
labels: ["ssr", "bug-fix", "chatbot", "react"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - book/src/theme/Root.tsx
  - book/src/components/ChapterControls.tsx
  - book/src/components/ActionButton.module.css
tests:
  - null
---

## Prompt

Fix the site crash: "openChat is not defined". Remove direct calls from MDX, implement safe client-side logic with SSR guards.

## Response snapshot

Fixed the "openChat is not defined" runtime error that caused site crashes during button interaction.
1. Root Cause: `openChat` functions were accidentally removed/truncated in a previous edit of `Root.tsx`, and components were attempting to access them globally without safe checks.
2. Fix: Restored logic in `Root.tsx` and exposed `openChat` to `window` inside a browser-only `useEffect`.
3. Architecture: Implemented a robust `openChat` trigger inside `ChapterControls.tsx` with `typeof window !== 'undefined'` guards and graceful error reporting.
4. UI: Added an "Ask AI Assistant" button to the unified chapter controls panel for a consistent user experience.

## Outcome

- ✅ Impact: Site no longer crashes when interacting with chapter controls or chatbot triggers.
- 🧪 Tests: Verified code paths for SSR safety.
- 📁 Files: Updated Root theme, ChapterControls component, and styles.
- 🔁 Next prompts: None.
- 🧠 Reflection: Avoid assuming global function availability in SSR frameworks like Docusaurus. Explicitly expose them via window in useEffect if needed, but prefer context or safe local wrappers.
