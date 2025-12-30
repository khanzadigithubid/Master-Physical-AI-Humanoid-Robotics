# End-to-End Testing Guide
## Physical AI Textbook Platform

This guide walks through testing the complete application stack (Backend + Frontend + RAG Chatbot).

---

## Prerequisites

### Required Services & API Keys

1. **PostgreSQL Database** (Neon Cloud recommended)
   - Sign up: https://neon.tech
   - Create database: `physical-ai-db`
   - Get connection string (with asyncpg driver)

2. **Qdrant Vector Database** (Cloud)
   - Sign up: https://qdrant.tech/cloud
   - Create cluster (free tier available)
   - Get API URL and API key
   - Collection name: `physical-ai-book`

3. **OpenAI API Key**
   - Sign up: https://platform.openai.com
   - Create API key
   - Required for: embeddings (text-embedding-3-small) and RAG generation (GPT-4)

4. **Anthropic API Key** (Optional)
   - Sign up: https://console.anthropic.com
   - Create API key
   - Required for: Urdu translation feature (Claude)

5. **Python 3.11+** installed
6. **Node.js 20+** installed

---

## Setup Instructions

### Step 1: Backend Setup

#### 1.1 Create Environment File

```bash
cd backend
cp .env.example .env
```

Edit `.env` with your credentials:

```bash
# Database (Neon Postgres)
DATABASE_URL=postgresql+asyncpg://user:password@ep-example-123.us-east-2.aws.neon.tech/physical_ai_db?sslmode=require

# Qdrant Cloud
QDRANT_URL=https://abc123-example.us-east-1-0.aws.cloud.qdrant.io
QDRANT_API_KEY=your_qdrant_api_key_here
QDRANT_COLLECTION_NAME=physical-ai-book

# AI APIs
OPENAI_API_KEY=sk-proj-...
ANTHROPIC_API_KEY=sk-ant-...

# Authentication (generate SECRET_KEY with: openssl rand -hex 32)
SECRET_KEY=your_generated_32_byte_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# Encryption (generate with: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())")
ENCRYPTION_KEY=your_generated_fernet_key_here

# CORS
ALLOWED_ORIGINS=["http://localhost:3001"]

# Server
HOST=0.0.0.0
PORT=8000
RELOAD=true
LOG_LEVEL=INFO
```

#### 1.2 Install Dependencies

```bash
# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Mac/Linux)
source venv/bin/activate

# Install packages
pip install -r requirements.txt
```

#### 1.3 Run Database Migrations

```bash
# Create initial migration
alembic revision --autogenerate -m "Initial tables"

# Apply migrations
alembic upgrade head
```

Expected output:
```
INFO  [alembic.runtime.migration] Context impl PostgresqlImpl.
INFO  [alembic.runtime.migration] Will assume transactional DDL.
INFO  [alembic.runtime.migration] Running upgrade  -> abc123, Initial tables
```

#### 1.4 Ingest Book Content

```bash
python -m src.scripts.ingest_book
```

This process:
- Reads all `.md` files from `../book/docs/`
- Chunks content (512 tokens, 50 overlap)
- Generates embeddings with OpenAI
- Uploads to Qdrant Cloud

Expected output:
```
INFO: Found 6 markdown files
INFO: Processing 01-introduction/overview.md
INFO: Created 24 chunks
INFO: Embedded and uploaded 24 chunks
... (repeat for each file)
✅ Success: Ingested 6 files, 156 chunks
```

**Time estimate**: 2-3 minutes (depends on OpenAI API speed)

#### 1.5 Start Backend Server

```bash
python -m src.main
```

Expected output:
```
INFO:     Started server process [12345]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

**Keep this terminal running.**

---

### Step 2: Frontend Setup

#### 2.1 Install Dependencies

```bash
cd frontend
npm install
```

#### 2.2 Configure Environment

Verify `.env.local` contains:

```bash
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_BOOK_URL=http://localhost:3000
```

#### 2.3 Start Frontend Server

```bash
npm run dev
```

Expected output:
```
▲ Next.js 16.1.1 (Turbopack)
- Local:         http://localhost:3001
- Network:       http://192.168.x.x:3001
- Environments: .env.local

✓ Ready in 4.3s
```

**Keep this terminal running.**

---

## Test Scenarios

### Test 1: Health Check

**Verify backend is running:**

```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "database": "connected",
  "qdrant": "connected"
}
```

✅ **Pass Criteria**: All services return "connected"

---

### Test 2: User Signup

1. Open browser: http://localhost:3001
2. Click "Sign Up"
3. Fill form:
   - Email: `test@example.com`
   - Password: `password123`
   - Software Background: `Intermediate`
   - Hardware Background: `Hobbyist`
   - Prefer Urdu: Unchecked
4. Click "Sign Up"

**Expected Result:**
- Redirect to `/reader` page
- See welcome message
- See user profile card with:
  - Email: test@example.com
  - Software: intermediate
  - Hardware: hobbyist
  - Prefer Urdu: No
- See blue chatbot button in bottom-right corner

**Backend Logs (should show):**
```
INFO: POST /api/auth/signup - 201 Created
INFO: User created: test@example.com
INFO: JWT token generated
```

✅ **Pass Criteria**: Successfully redirected to reader page with chatbot button visible

---

### Test 3: User Signin

1. Click "Sign Out"
2. Click "Sign In" from homepage
3. Enter credentials:
   - Email: `test@example.com`
   - Password: `password123`
4. Click "Sign In"

**Expected Result:**
- Redirect to `/reader` page
- Same user profile displayed
- Chatbot button visible

**Backend Logs:**
```
INFO: POST /api/auth/signin - 200 OK
INFO: User authenticated: test@example.com
```

✅ **Pass Criteria**: Successfully signed in and redirected

---

### Test 4: RAG Chatbot - Basic Query

1. From `/reader` page, click blue chatbot button
2. Chatbot panel opens (right side, 600px tall)
3. Type question: `What is inverse kinematics?`
4. Click send button (or press Enter)

**Expected Result:**
- User message appears (blue bubble, right side)
- Loading animation shows (3 bouncing dots)
- Assistant response appears after 2-5 seconds:
  - White bubble with answer text
  - Sources section below answer:
    - Chapter: "02-robotics-fundamentals"
    - Section: "kinematics"
    - Match score: ~85-95%
    - Clickable link
  - Timestamp at bottom

**Backend Logs:**
```
INFO: POST /api/rag/query - 200 OK
INFO: Query: "What is inverse kinematics?"
INFO: Mode: full-book
INFO: Found 5 relevant chunks
INFO: Generated answer (confidence: 0.92)
INFO: Latency: 2341ms
```

✅ **Pass Criteria**:
- Answer is relevant and accurate
- Sources include chapter "02-robotics-fundamentals"
- No errors displayed

---

### Test 5: RAG Chatbot - Multiple Messages

Continue conversation:

**Query 2:** `Explain forward kinematics`

**Expected Result:**
- Second user message appears
- Second assistant response with sources
- Message history preserved (both Q&A pairs visible)
- Auto-scroll to latest message

**Query 3:** `What's the difference between the two?`

**Expected Result:**
- Third message pair appears
- Context maintained from previous messages
- Sources still relevant to kinematics

✅ **Pass Criteria**: Message history grows correctly, auto-scrolls to new messages

---

### Test 6: RAG Chatbot - Edge Cases

#### 6.1 Empty Query
1. Leave input empty
2. Try to click send

**Expected Result:**
- Send button is disabled (gray)
- No message sent

✅ **Pass Criteria**: Cannot send empty messages

#### 6.2 Error Handling
1. Stop backend server (Ctrl+C)
2. Ask question: `What is a robot?`

**Expected Result:**
- User message appears
- Loading animation shows
- Error message appears:
  - "Sorry, I encountered an error processing your question. Please try again."

✅ **Pass Criteria**: Graceful error handling, no crashes

#### 6.3 Close and Reopen
1. Click X button to close chatbot
2. Click blue button to reopen

**Expected Result:**
- Chatbot closes smoothly
- Message history is preserved when reopened

✅ **Pass Criteria**: State persists across close/reopen

---

### Test 7: Source Citations

1. Ask: `Tell me about DH parameters`
2. Wait for response with sources
3. Click on source link (e.g., "02-robotics-fundamentals → kinematics")

**Expected Result:**
- Link opens in new tab
- Points to book chapter (if deployed)
- Or shows URL in address bar

**Backend Logs:**
```
INFO: Citations extracted: 3 sources
INFO: Top source: 02-robotics-fundamentals/kinematics (score: 0.94)
```

✅ **Pass Criteria**: Source links are properly formatted and clickable

---

### Test 8: Authentication Persistence

1. With chatbot open, refresh page (F5)

**Expected Result:**
- User remains authenticated
- Redirects back to `/reader`
- Chatbot button visible
- Message history cleared (expected behavior)

✅ **Pass Criteria**: JWT token persists in localStorage

---

### Test 9: Protected Routes

1. Sign out
2. Manually navigate to: http://localhost:3001/reader

**Expected Result:**
- Automatic redirect to `/signin` page
- Cannot access reader without authentication

✅ **Pass Criteria**: Protected routes enforce authentication

---

### Test 10: Performance & Responsiveness

**Metrics to observe:**

1. **Signup/Signin Response Time**: < 1 second
2. **RAG Query Latency**: 2-5 seconds (typical)
   - Embedding: ~200ms
   - Vector search: ~100ms
   - GPT-4 generation: 2-4 seconds
3. **UI Responsiveness**:
   - Button clicks instant
   - Animations smooth (60fps)
   - No layout shifts

✅ **Pass Criteria**: All interactions feel responsive

---

## Troubleshooting

### Backend Issues

#### Error: "DATABASE_URL not set"
**Solution**: Check `.env` file exists and contains DATABASE_URL

#### Error: "Connection refused to Qdrant"
**Solution**:
- Verify QDRANT_URL and QDRANT_API_KEY are correct
- Check Qdrant cluster is active in dashboard

#### Error: "OpenAI API key invalid"
**Solution**:
- Verify OPENAI_API_KEY in `.env`
- Check API key has credits available

#### Error: "No collection found: physical-ai-book"
**Solution**:
- Run ingestion script: `python -m src.scripts.ingest_book`
- Collection is auto-created on first ingestion

### Frontend Issues

#### Error: "Failed to fetch" in chatbot
**Solution**:
- Check backend is running on port 8000
- Verify NEXT_PUBLIC_BACKEND_URL in `.env.local`
- Check CORS settings in backend `.env` include `http://localhost:3001`

#### Error: "401 Unauthorized" in chatbot
**Solution**:
- Sign out and sign in again
- Check JWT token expiration (default 7 days)

#### Chatbot button not visible
**Solution**:
- Verify you're on `/reader` page
- Check browser console for errors
- Refresh page

---

## Expected Test Results Summary

| Test | Expected Duration | Pass Criteria |
|------|------------------|---------------|
| Health Check | < 1 sec | All services "connected" |
| Signup | < 2 sec | Redirect to /reader |
| Signin | < 1 sec | Redirect to /reader |
| RAG Query | 2-5 sec | Relevant answer + sources |
| Multiple Messages | 2-5 sec each | History preserved |
| Empty Query | Instant | Send disabled |
| Error Handling | < 1 sec | Graceful error message |
| Close/Reopen | Instant | State persists |
| Source Links | Instant | Links clickable |
| Auth Persistence | < 1 sec | Token persists |
| Protected Routes | < 1 sec | Redirect to signin |

---

## Demo Script (90 seconds)

**For showcasing the platform:**

1. **[0:00-0:15] Signup** - Create account with background selection
2. **[0:15-0:20] Landing** - Show reader page with profile
3. **[0:20-0:25] Open Chatbot** - Click blue button
4. **[0:25-0:40] Query 1** - "What is inverse kinematics?" → Show answer + sources
5. **[0:40-0:55] Query 2** - "How does forward kinematics differ?" → Show context awareness
6. **[0:55-1:10] Citations** - Click source link, highlight chapter reference
7. **[1:10-1:20] Message History** - Scroll up to show conversation
8. **[1:20-1:30] Close/Reopen** - Demonstrate state persistence

---

## Success Metrics

**MVP is considered successful if:**

✅ All 10 test scenarios pass
✅ RAG queries return relevant answers (>80% accuracy)
✅ Source citations link to correct chapters
✅ No crashes or unhandled errors
✅ Response times meet targets (< 5 sec for RAG)
✅ UI is smooth and responsive

---

## Next Steps After Testing

1. **Document Issues**: Log any failed tests in GitHub Issues
2. **Performance Optimization**: If latency > 5 seconds, consider:
   - Caching frequent queries
   - Optimizing embedding dimensions
   - Using faster GPT model (gpt-3.5-turbo)
3. **Deploy to Production**:
   - Backend → Railway/Fly.io
   - Frontend → Vercel
   - Book → GitHub Pages
4. **Phase 4 Implementation**: Personalization & Translation
5. **Phase 5 Implementation**: Polish & Accessibility

---

## Contact & Support

For issues during testing:
- Check backend logs for errors
- Check frontend browser console
- Review BACKEND_STATUS.md for troubleshooting
- Review frontend/README.md for configuration

---

**Testing Status**: Ready to begin (requires API credentials)
**Last Updated**: 2025-12-28
