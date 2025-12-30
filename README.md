# Physical AI & Humanoid Robotics - AI-Native Textbook

**Panaversity Hackathon Submission**

A complete Docusaurus-based textbook platform with embedded AI features for teaching Physical AI and Humanoid Robotics.

---

## 🎯 Project Overview

This project follows **Panaversity Hackathon rules**:
- ✅ **Docusaurus** is the ONLY frontend (the book itself)
- ✅ All features embedded inside Docusaurus (no separate web app)
- ✅ FastAPI backend for RAG chatbot and auth APIs
- ✅ Neon Postgres + Qdrant Cloud + OpenAI

**No Next.js. No App Router. The book IS the interface.**

---

## 🏗️ Architecture

```
┌─────────────────────────────────────┐
│   DOCUSAURUS BOOK                   │  ← GitHub Pages
│   (The ONLY Frontend)               │
│                                     │
│  📚 Content: 14/24 chapters         │
│  🤖 Chatbot: Floating button        │
│  🔐 Auth: /signin, /signup pages    │
│  🎨 Personalize: Chapter buttons    │
│  🌐 Translate: EN ↔ UR toggle       │
└──────────────┬──────────────────────┘
               │ REST API
               ▼
┌─────────────────────────────────────┐
│   FASTAPI BACKEND                   │  ← Railway / Fly.io
│   - Auth (signup, signin)           │
│   - RAG (full-book + selected text) │
│   - Personalize (adjust depth)      │
│   - Translate (EN ↔ UR)             │
└──────────────┬──────────────────────┘
               │
    ┌──────────┼──────────┐
    ▼          ▼          ▼
  Neon      Qdrant     OpenAI
Postgres    Cloud       API
```

---

## 📁 Project Structure

```
Book/
├── book/                          # Docusaurus application
│   ├── docs/                      # Textbook content (Markdown/MDX)
│   │   ├── intro.md
│   │   ├── 01-introduction/       # Module 1 (4 chapters) ✅
│   │   ├── 02-robotics-fundamentals/  # Module 2 (4 chapters) ✅
│   │   ├── 03-perception-systems/ # Module 3 (4 chapters) ✅
│   │   ├── 04-ai-for-robotics/    # Module 4 (0/4 chapters) 🔲
│   │   ├── 05-humanoid-robotics/  # Module 5 (0/4 chapters) 🔲
│   │   └── 06-deployment-ethics/  # Module 6 (0/4 chapters) 🔲
│   │
│   ├── src/
│   │   ├── components/            # Embedded UI components
│   │   │   ├── ChatbotButton.tsx  # Floating chat button
│   │   │   ├── ChatbotPanel.tsx   # RAG chat interface
│   │   │   ├── PersonalizeButton.tsx  # Adjust content depth
│   │   │   └── TranslateButton.tsx    # EN ↔ UR toggle
│   │   │
│   │   ├── pages/                 # Custom pages
│   │   │   ├── signin.tsx         # Login page
│   │   │   └── signup.tsx         # Registration with background Q's
│   │   │
│   │   ├── theme/
│   │   │   └── Root.tsx           # Global wrapper (embeds chatbot)
│   │   │
│   │   └── lib/
│   │       └── api-client.ts      # Backend API client
│   │
│   ├── docusaurus.config.ts       # Docusaurus config
│   ├── sidebars.ts                # Navigation structure
│   └── package.json
│
├── backend/                       # FastAPI application
│   ├── src/
│   │   ├── routes/                # API endpoints
│   │   │   ├── auth.py            # /api/auth/*
│   │   │   └── rag.py             # /api/rag/*
│   │   ├── services/
│   │   │   ├── rag_service.py     # RAG pipeline
│   │   │   └── auth_service.py    # JWT auth
│   │   ├── models/                # Database models
│   │   └── scripts/
│   │       └── ingest_book.py     # Embed book chapters
│   │
│   ├── requirements.txt
│   └── README_SETUP.md
│
├── CORRECT_ARCHITECTURE.md        # Architecture explanation
├── PROJECT_STATUS.md              # Detailed status
└── README.md                      # This file
```

---

## ✨ Features

### 1. 📚 Textbook Content
- **14 chapters complete** (58% of total 24)
  - Module 1: Introduction to Physical AI (4/4) ✅
  - Module 2: Robotics Fundamentals (4/4) ✅
  - Module 3: Perception Systems (4/4) ✅
- LaTeX math rendering (KaTeX)
- Code examples with syntax highlighting
- Responsive sidebar navigation

### 2. 🤖 RAG Chatbot
- **Floating button** on all pages (bottom-right)
- **Two modes**:
  - Full-book search: Query entire textbook
  - Selected-text search: Highlight text, ask questions about it
- **Features**:
  - Streaming responses
  - Source citations with links
  - Confidence scores
  - Message history

### 3. 🔐 Authentication
- **Signup page** (`/signup`):
  - Email + password
  - Background questions (software + hardware experience)
  - Stored for personalization
- **Signin page** (`/signin`):
  - JWT tokens
  - Auto-redirect after login

### 4. 🎨 Personalization
- **Button at chapter start** (embedded via MDX)
- Adjusts explanation depth based on user background
- Example: Beginner gets more detail, Advanced gets concise
- API: `POST /api/personalize`

### 5. 🌐 Translation
- **Button at chapter start** (embedded via MDX)
- Toggle English ↔ Urdu
- Preserves technical terms
- API: `POST /api/translate`

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (for Docusaurus)
- Python 3.11+ (for FastAPI backend)
- Git

### 1. Clone Repository
```bash
git clone <your-repo-url>
cd Book
```

### 2. Run Docusaurus Book Locally
```bash
cd book
npm install
npm start
# Opens http://localhost:3000
```

### 3. Run Backend (Optional, for API testing)
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Set environment variables
export DATABASE_URL="<neon-postgres-url>"
export QDRANT_URL="<qdrant-url>"
export QDRANT_API_KEY="<qdrant-key>"
export OPENAI_API_KEY="<openai-key>"
export SECRET_KEY="<generate-secret>"

# Run migrations
alembic upgrade head

# Ingest book content
python -m src.scripts.ingest_book

# Start server
uvicorn src.main:app --reload
# Opens http://localhost:8000
```

---

## 📖 How to Use Embedded Features

### Using the Chatbot
1. Navigate to any page in the book
2. Click the floating purple button (bottom-right)
3. Ask questions like:
   - "What is kinematics?"
   - "Explain inverse kinematics"
   - "How does SLAM work?"
4. For selected-text mode:
   - Highlight any text
   - Open chatbot
   - Toggle "Selected Text" mode
   - Ask questions about the highlighted text

### Using Personalization
1. Sign up at `/signup` with your background
2. Navigate to any chapter (e.g., Kinematics)
3. Click "Adjust for My Level" button
4. Content adapts to your experience level

### Using Translation
1. Navigate to any chapter
2. Click "اردو میں پڑھیں" button
3. Content translates to Urdu
4. Click "Read in English" to switch back

---

## 🛠️ Development

### Adding New Chapters
1. Create Markdown file in appropriate module folder:
   ```bash
   book/docs/04-ai-for-robotics/reinforcement-learning.md
   ```

2. Add frontmatter:
   ```markdown
   ---
   sidebar_position: 1
   title: Reinforcement Learning
   ---

   import PersonalizeButton from '@site/src/components/PersonalizeButton';
   import TranslateButton from '@site/src/components/TranslateButton';

   # Reinforcement Learning

   <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
     <PersonalizeButton chapterId="reinforcement-learning" content="..." />
     <TranslateButton chapterId="reinforcement-learning" content="..." />
   </div>

   ## Introduction
   ...
   ```

3. Update `sidebars.ts`:
   ```typescript
   {
     type: 'category',
     label: 'Module 4: AI for Robotics',
     items: [
       'ai-for-robotics/reinforcement-learning',  // Add this
       // ...
     ],
   }
   ```

### Adding New Components
1. Create component in `book/src/components/`
2. Import and use in MDX or pages
3. Test build: `npm run build`

---

## 🧪 Testing

### Build Test
```bash
cd book
npm run build
# Should complete without errors
```

### Local Preview
```bash
npm run serve
# Opens http://localhost:3000 (production build)
```

### Component Tests
1. Open dev server: `npm start`
2. Test chatbot:
   - Click floating button
   - Type a question
   - Verify response (requires backend running)
3. Test auth:
   - Navigate to `/signup`
   - Fill form
   - Submit (requires backend running)

---

## 🚢 Deployment

### Deploy Book to GitHub Pages
```bash
cd book
npm run deploy
# Deploys to https://<username>.github.io/physical-ai-textbook/
```

### Deploy Backend to Railway
1. Create Railway project
2. Add environment variables:
   - `DATABASE_URL`
   - `QDRANT_URL`
   - `QDRANT_API_KEY`
   - `OPENAI_API_KEY`
   - `SECRET_KEY`
3. Deploy:
   ```bash
   railway up
   ```

### Configure CORS
Update `backend/src/main.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://<your-username>.github.io"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 📊 Project Status

- **Architecture**: ✅ Hackathon-compliant (Docusaurus-only)
- **Embedded Components**: ✅ 100% complete
- **Backend APIs**: ✅ Auth + RAG complete, Personalize/Translate pending
- **Content**: 🟡 58% complete (14/24 chapters)
- **Build**: ✅ Production build succeeds
- **Deployment**: 🔲 Pending (requires API credentials)

**See `PROJECT_STATUS.md` for detailed breakdown.**

---

## 📚 Documentation

- **`CORRECT_ARCHITECTURE.md`** - Architecture explanation and design decisions
- **`PROJECT_STATUS.md`** - Detailed component status and metrics
- **`book/BOOK_STATUS.md`** - Content creation roadmap
- **`backend/README_SETUP.md`** - Backend setup instructions
- **`TESTING_GUIDE.md`** - Testing scenarios and troubleshooting

---

## 🎓 Course Outline

### Module 1: Introduction to Physical AI
1. Overview of Physical AI
2. Physical AI Definition
3. Curriculum Guide
4. Prerequisites

### Module 2: Robotics Fundamentals
1. Robot Kinematics (Forward/Inverse Kinematics, DH Parameters)
2. Robot Dynamics (Newton-Euler, Lagrangian)
3. Control Theory (PID, LQR, MPC)
4. Actuators & Sensors (Motors, IMUs, Encoders)

### Module 3: Perception Systems
1. Computer Vision (CNNs, Object Detection, Depth Estimation)
2. LiDAR Sensors (Point Clouds, ICP, Segmentation)
3. Sensor Fusion (Kalman Filters, EKF, UKF)
4. SLAM (Visual SLAM, LiDAR SLAM, Loop Closure)

### Module 4: AI for Robotics (TO DO)
1. Reinforcement Learning
2. Imitation Learning
3. World Models
4. Foundation Models (RT-1, RT-2, VIMA)

### Module 5: Humanoid Robotics (TO DO)
1. Bipedal Locomotion
2. Manipulation
3. Human-Robot Interaction
4. Whole-Body Control

### Module 6: Deployment & Ethics (TO DO)
1. Sim-to-Real Transfer
2. Safety Systems
3. Ethical Considerations
4. Future Directions

---

## 🤝 Contributing

This is a hackathon project. Future contributions welcome after initial submission.

---

## 📄 License

Educational use only. See LICENSE file.

---

## 🙏 Acknowledgments

- **Panaversity** for organizing the hackathon
- **Docusaurus** team for the amazing static site generator
- **FastAPI** for the backend framework
- **OpenAI** for GPT-4 and embeddings
- **Qdrant** for vector search

---

## 📞 Contact

For questions about this implementation:
- Review documentation files in root directory
- Check component source code for implementation details
- See `TESTING_GUIDE.md` for troubleshooting

---

**Status**: ✅ Hackathon-Compliant | 🚀 Ready for Testing | 📊 58% Content Complete

**Built with**: Docusaurus 3.9.2, FastAPI 0.108.0, React 18, TypeScript 5
