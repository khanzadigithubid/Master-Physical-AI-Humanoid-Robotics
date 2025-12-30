# Correct Hackathon Architecture

**Date**: 2025-12-28
**Status**: Architecture Correction Document

---

## HACKATHON RULE VIOLATIONS FOUND

### ❌ WRONG: Current Implementation
```
Book (Docusaurus) → Static content only
Frontend (Next.js) → Auth + Chatbot + UI
Backend (FastAPI) → APIs
```

**Violation**: Hackathon explicitly forbids Next.js and separate frontend apps.

### ✅ CORRECT: Required Implementation
```
Book (Docusaurus ONLY) → Content + Auth UI + Chatbot + All Features
Backend (FastAPI) → APIs for RAG/Auth/Personalization/Translation
```

---

## Mandatory Tech Stack (From Hackathon Rules)

### Frontend (ONLY)
- **Docusaurus** (standalone - the book IS the frontend)
- Markdown / MDX
- Docusaurus React components inside `/src`

### Backend (ONLY where required)
- **FastAPI** (for RAG chatbot, auth APIs)
- Neon Serverless Postgres
- Qdrant Cloud (Free Tier)

### Deployment
- **GitHub Pages** (for the book)

### ❌ FORBIDDEN
- Next.js
- App Router
- Any React framework (except Docusaurus)
- Separate frontend applications

---

## Correct Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                     USER BROWSER                         │
└─────────────────────────────────────────────────────────┘
                         │
                         │
                    ┌────▼─────────────────────────┐
                    │    DOCUSAURUS BOOK           │
                    │  (GitHub Pages)              │
                    │                              │
                    │  CONTENT:                    │
                    │  - /docs/* (Markdown/MDX)    │
                    │  - Sidebar navigation        │
                    │  - Math rendering (KaTeX)    │
                    │                              │
                    │  UI COMPONENTS (React):      │
                    │  - /src/components/          │
                    │    ├─ ChatbotPanel.tsx       │
                    │    ├─ AuthForm.tsx           │
                    │    ├─ PersonalizeButton.tsx  │
                    │    └─ TranslateButton.tsx    │
                    │                              │
                    │  PAGES:                      │
                    │  - /src/pages/               │
                    │    ├─ signin.tsx             │
                    │    └─ signup.tsx             │
                    │                              │
                    └────┬─────────────────────────┘
                         │
                         │ REST API (HTTPS)
                         │
                    ┌────▼─────────────────────────┐
                    │    BACKEND (FastAPI)         │
                    │  (Railway / Fly.io)          │
                    │                              │
                    │  ROUTES:                     │
                    │  - POST /api/auth/signup     │
                    │  - POST /api/auth/signin     │
                    │  - GET  /api/auth/me         │
                    │  - POST /api/rag/query       │
                    │  - POST /api/personalize     │
                    │  - POST /api/translate       │
                    │                              │
                    └────┬─────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
    ┌────▼────┐    ┌─────▼─────┐   ┌────▼────┐
    │  Neon   │    │  Qdrant   │   │ OpenAI  │
    │Postgres │    │   Cloud   │   │   API   │
    └─────────┘    └───────────┘   └─────────┘
```

---

## What Must Be Built

### 1. Docusaurus Book Structure
```
book/
├── docs/                          # All textbook content
│   ├── intro.md                   # Welcome page
│   ├── 01-introduction/           # Module 1
│   ├── 02-robotics-fundamentals/  # Module 2
│   ├── 03-perception-systems/     # Module 3
│   ├── 04-ai-for-robotics/        # Module 4
│   ├── 05-humanoid-robotics/      # Module 5
│   └── 06-deployment-ethics/      # Module 6
│
├── src/
│   ├── components/                # Embedded React components
│   │   ├── ChatbotPanel.tsx       # RAG chatbot UI
│   │   ├── ChatbotButton.tsx      # Floating chat button
│   │   ├── AuthForm.tsx           # Signin/Signup form
│   │   ├── PersonalizeButton.tsx  # Adjust depth button
│   │   ├── TranslateButton.tsx    # English ↔ Urdu toggle
│   │   └── ApiClient.ts           # API helper
│   │
│   ├── pages/                     # Custom pages
│   │   ├── signin.tsx             # Signin page
│   │   └── signup.tsx             # Signup page with background questions
│   │
│   └── css/
│       └── custom.css             # Styling
│
├── docusaurus.config.ts           # Config (already set up)
├── sidebars.ts                    # Navigation (already set up)
└── package.json                   # Dependencies
```

### 2. Backend APIs (Already Built)
- ✅ FastAPI with JWT auth
- ✅ RAG query endpoint
- ✅ Qdrant vector store
- ✅ OpenAI embeddings + GPT-4

**Status**: Backend is complete and follows hackathon rules.

### 3. Features to Embed in Docusaurus

#### A. RAG Chatbot
- **UI**: Floating button (bottom-right)
- **Panel**: Slide-in chat panel
- **Modes**:
  - Full-book search
  - Selected-text search (user highlights text, asks question)
- **Backend**: POST /api/rag/query

#### B. Authentication
- **Signup Page** (`/src/pages/signup.tsx`):
  - Email, password fields
  - Background questions:
    - Software experience (Beginner/Intermediate/Advanced)
    - Hardware experience (None/Hobbyist/Professional)
  - POST /api/auth/signup
- **Signin Page** (`/src/pages/signin.tsx`):
  - Email, password
  - POST /api/auth/signin
- **Nav**: Show "Sign In" button when logged out, "Profile" when logged in

#### C. Personalization Button
- **Location**: Start of each chapter (MDX component)
- **Function**:
  - Reads user background from auth profile
  - Adjusts explanation depth
  - API: POST /api/personalize
- **UI**: Button "Adjust for my level"

#### D. Translation Button
- **Location**: Start of each chapter (MDX component)
- **Function**:
  - Toggle English ↔ Urdu
  - Technical terms preserved
  - API: POST /api/translate
- **UI**: Button "اردو | English"

---

## Implementation Plan

### Phase 1: Core Components (HIGH PRIORITY)
1. ✅ Docusaurus setup (DONE)
2. ✅ Backend APIs (DONE)
3. ⏳ Create ChatbotPanel.tsx
4. ⏳ Create ChatbotButton.tsx
5. ⏳ Create ApiClient.ts helper

### Phase 2: Authentication (HIGH PRIORITY)
6. ⏳ Create signin.tsx page
7. ⏳ Create signup.tsx page with background questions
8. ⏳ Add AuthContext for session management
9. ⏳ Update navbar with signin/profile links

### Phase 3: Personalization (MEDIUM PRIORITY)
10. ⏳ Create PersonalizeButton.tsx
11. ⏳ Integrate into chapter MDX files
12. ⏳ Backend personalization API

### Phase 4: Translation (MEDIUM PRIORITY)
13. ⏳ Create TranslateButton.tsx
14. ⏳ Integrate into chapter MDX files
15. ⏳ Backend translation API

### Phase 5: Cleanup (HIGH PRIORITY)
16. ⏳ Delete `frontend/` directory completely
17. ⏳ Update PROJECT_STATUS.md
18. ⏳ Test all features embedded in Docusaurus
19. ⏳ Deploy to GitHub Pages

---

## Technical Details

### React Components in Docusaurus

Docusaurus supports React components in two ways:

1. **In MDX files** (for chapter-embedded features):
```mdx
import PersonalizeButton from '@site/src/components/PersonalizeButton';
import TranslateButton from '@site/src/components/TranslateButton';

<PersonalizeButton chapterId="kinematics" />
<TranslateButton chapterId="kinematics" />

# Chapter Content...
```

2. **In custom pages** (for signin/signup):
```tsx
// src/pages/signin.tsx
import React from 'react';
import Layout from '@theme/Layout';
import AuthForm from '@site/src/components/AuthForm';

export default function SignIn() {
  return (
    <Layout title="Sign In">
      <AuthForm mode="signin" />
    </Layout>
  );
}
```

### API Client Pattern

```tsx
// src/components/ApiClient.ts
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export async function ragQuery(query: string, mode: 'full' | 'selected', selectedText?: string) {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_BASE}/api/rag/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    },
    body: JSON.stringify({ query, mode, selected_text: selectedText }),
  });
  return response.json();
}
```

### State Management

Use React hooks (no Redux):
- `useState` for component state
- `useEffect` for API calls
- `localStorage` for JWT token persistence
- Context API for global auth state (optional)

---

## Success Criteria

### Minimum Viable Product (MVP)
- [ ] User can browse book content in Docusaurus
- [ ] Chatbot button visible on all pages
- [ ] User can ask questions and get RAG answers
- [ ] User can signup/signin via Docusaurus pages
- [ ] Citations link back to book chapters
- [ ] No Next.js frontend exists

### Bonus Features
- [ ] Personalization button works (adjusts depth)
- [ ] Translation button works (English ↔ Urdu)
- [ ] Mobile responsive
- [ ] Accessible (ARIA labels, keyboard nav)

### Deployment
- [ ] Book deployed to GitHub Pages
- [ ] Backend deployed to Railway/Fly.io
- [ ] All API calls work cross-origin (CORS configured)

---

## Why This Matters

The hackathon judges will specifically look for:
1. **Docusaurus-only frontend** (no separate web apps)
2. **All features embedded** in the book itself
3. **Simplicity** (no over-engineering)
4. **Following constraints** (tech stack adherence)

Creating a separate Next.js app **disqualifies** the submission, even if it works perfectly.

---

## Next Steps

1. Create ChatbotPanel and ChatbotButton components
2. Create signin/signup pages in Docusaurus
3. Test embedded features
4. Delete frontend/ directory
5. Deploy to GitHub Pages

**Status**: Ready to implement correct architecture.
