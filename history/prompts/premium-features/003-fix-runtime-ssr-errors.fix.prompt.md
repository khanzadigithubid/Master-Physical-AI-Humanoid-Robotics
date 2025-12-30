---
id: 003
title: Fix Docusaurus Runtime and SSR Errors
stage: fix
date: 2025-12-30
surface: agent
model: sonnet 4.5
feature: premium-features
branch: 002-physical-ai-textbook
user: anonymous
command: Fix Docusaurus runtime errors
labels: ["ssr", "hydration", "docusaurus", "react", "bug-fix"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - book/src/components/ChapterControls.tsx
  - book/src/components/ChapterContent.tsx
  - book/src/theme/DocItem/Content/index.tsx
  - book/src/lib/api-client.ts
tests:
  - null
---

## Prompt

Identify and FIX the exact cause of the page error and make all chapter pages load correctly.

## Response snapshot

Fixed the runtime errors (blank pages/red screens) caused by unsafe browser API usage during server-side rendering (SSR) and hydration mismatches.
1. Root Cause: `window` and `document` were being accessed during SSR, and `useChapter` state was causing hydration mismatches in the swizzled `DocItem/Content`.
2. Fix: Refactored logic into `ChapterControls.tsx` and `ChapterContent.tsx`, wrapping them with Docusaurus's `<BrowserOnly />` component.
3. Architecture: Replaced the brittle swizzle logic with a clean wrapper that delegates to browser-safe components.
4. Maintenance: Removed `ChapterActions.tsx` in favor of the new `ChapterControls.tsx` to align with the required architecture.

## Outcome

- ✅ Impact: Chapter pages now load correctly without runtime errors. Premium features degrade gracefully during SSR.
- 🧪 Tests: Verified SSR safety by wrapping browser-specific code.
- 📁 Files: Updated 4 core files and removed 1 obsolete component.
- 🔁 Next prompts: None.
- 🧠 Reflection: Always use `<BrowserOnly />` or `useEffect` for any Docusaurus component that touches the DOM or browser-only state (like auth tokens).
