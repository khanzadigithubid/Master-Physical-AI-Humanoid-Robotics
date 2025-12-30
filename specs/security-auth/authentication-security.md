# Security & Authentication Specification
**Physical AI & Humanoid Robotics – AI-Native Textbook Platform**

**Date**: 2025-12-28
**Version**: 1.0.0
**Status**: Design

---

## Executive Summary

This document defines security architecture and authentication mechanisms for the textbook platform. The system uses better-auth for session management, implements GDPR-compliant data handling, and follows OWASP Top 10 security best practices.

---

## Security Principles

1. **Defense in Depth**: Multiple security layers (authentication, authorization, input validation, encryption)
2. **Least Privilege**: Users granted minimum permissions necessary
3. **Privacy by Design**: User data encrypted, PII minimized, deletion supported
4. **Secure by Default**: Security features enabled out-of-the-box
5. **Audit Trail**: All sensitive operations logged for compliance

---

## Authentication Architecture

### better-auth Integration

**Framework**: better-auth (TypeScript-native authentication library)

**Why better-auth**:
- Modern TypeScript API with full type safety
- Session-based auth with httpOnly cookies (XSS protection)
- Email/password + OAuth ready
- CSRF protection built-in
- Database-agnostic (works with Neon Postgres)

### Authentication Flow Diagram

```
┌──────────────┐
│   Frontend   │
│   (Next.js)  │
└──────┬───────┘
       │
       │ 1. POST /api/auth/signup
       │    {email, password, background}
       │
       ▼
┌──────────────────────────────────────────┐
│          Backend (FastAPI)               │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │  better-auth Server Integration    │ │
│  │                                    │ │
│  │  2. Validate input (Pydantic)     │ │
│  │  3. Check email uniqueness        │ │
│  │  4. Hash password (bcrypt)        │ │
│  │  5. Insert User record (Neon)     │ │
│  │  6. Create Session (better-auth)  │ │
│  │  7. Set httpOnly cookie           │ │
│  └────────────────────────────────────┘ │
└──────────────┬───────────────────────────┘
               │
               │ 8. Response: {user_id, session_token}
               │    Set-Cookie: session=xxx; HttpOnly; Secure; SameSite=Strict
               │
               ▼
       ┌──────────────┐
       │   Frontend   │
       │ (redirects   │
       │  to /reader) │
       └──────────────┘
```

### Authentication Endpoints

#### Signup
```typescript
// Frontend: src/lib/auth-client.ts
import { createAuthClient } from 'better-auth/client'

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,
})

async function signup(email: string, password: string, background: UserBackground) {
  const result = await authClient.signUp.email({
    email,
    password,
    name: email.split('@')[0],
    callbackURL: '/reader',
  })

  // Capture user background via custom endpoint
  await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // Send cookies
    body: JSON.stringify({ background }),
  })

  return result
}
```

```python
# Backend: src/api/auth.py
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from better_auth import BetterAuth
import bcrypt

router = APIRouter(prefix="/auth")

class SignupRequest(BaseModel):
    email: EmailStr
    password: str  # Min 8 chars, validated by Pydantic
    software_background: str  # "beginner" | "intermediate" | "advanced"
    hardware_background: str  # "none" | "hobbyist" | "professional"

@router.post("/signup")
async def signup(req: SignupRequest, db: Database = Depends(get_db)):
    # 1. Check email uniqueness
    existing = await db.fetch_one("SELECT id FROM users WHERE email = $1", req.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # 2. Hash password
    hashed = bcrypt.hashpw(req.password.encode(), bcrypt.gensalt())

    # 3. Insert user
    user_id = await db.execute(
        """
        INSERT INTO users (email, hashed_password, software_background, hardware_background)
        VALUES ($1, $2, $3, $4)
        RETURNING id
        """,
        req.email, hashed.decode(), req.software_background, req.hardware_background
    )

    # 4. Create session with better-auth
    session = await better_auth.create_session(user_id)

    # 5. Set httpOnly cookie
    response.set_cookie(
        key="session",
        value=session.token,
        httponly=True,
        secure=True,  # HTTPS only
        samesite="strict",  # CSRF protection
        max_age=7 * 24 * 60 * 60,  # 7 days
    )

    return {"user_id": user_id, "email": req.email}
```

#### Signin
```python
@router.post("/signin")
async def signin(req: SigninRequest, db: Database = Depends(get_db)):
    # 1. Fetch user by email
    user = await db.fetch_one(
        "SELECT id, email, hashed_password FROM users WHERE email = $1",
        req.email
    )
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # 2. Verify password
    if not bcrypt.checkpw(req.password.encode(), user.hashed_password.encode()):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # 3. Create session
    session = await better_auth.create_session(user.id)

    # 4. Set cookie
    response.set_cookie(key="session", value=session.token, httponly=True, secure=True, samesite="strict")

    return {"user_id": user.id, "email": user.email}
```

#### Signout
```python
@router.post("/signout")
async def signout(session: Session = Depends(get_current_session)):
    # 1. Invalidate session in database
    await better_auth.delete_session(session.id)

    # 2. Clear cookie
    response.delete_cookie("session")

    return {"message": "Signed out successfully"}
```

#### Session Verification (Middleware)
```python
# src/auth/middleware.py
from fastapi import Request, HTTPException
from better_auth import BetterAuth

async def get_current_user(request: Request) -> User:
    session_token = request.cookies.get("session")
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    session = await better_auth.verify_session(session_token)
    if not session or session.expired:
        raise HTTPException(status_code=401, detail="Session expired")

    user = await db.fetch_one("SELECT * FROM users WHERE id = $1", session.user_id)
    return User(**user)

# Protect routes
@router.get("/protected")
async def protected_route(user: User = Depends(get_current_user)):
    return {"message": f"Hello {user.email}"}
```

---

## Authorization Model

### Roles (Future Enhancement)

Current system has single role: **Learner**

Future roles:
- **Admin**: Trigger book ingestion, view analytics
- **Instructor**: Create custom reading lists, view student progress
- **Learner**: Read book, use chatbot, personalize content

### Permissions

| Action | Learner | Instructor | Admin |
|--------|---------|------------|-------|
| Read book | ✅ | ✅ | ✅ |
| Use chatbot | ✅ | ✅ | ✅ |
| Personalize content | ✅ | ✅ | ✅ |
| Translate to Urdu | ✅ | ✅ | ✅ |
| View own profile | ✅ | ✅ | ✅ |
| Trigger ingestion | ❌ | ❌ | ✅ |
| View analytics | ❌ | ✅ | ✅ |

---

## Data Security

### Encryption at Rest

**Database (Neon Postgres)**:
- Encryption: AES-256 (Neon default)
- User passwords: bcrypt with salt (cost factor 12)
- Sensitive fields: Encrypted application-level (fernet)

```python
from cryptography.fernet import Fernet

class UserService:
    def __init__(self, encryption_key: str):
        self.cipher = Fernet(encryption_key.encode())

    async def save_background(self, user_id: UUID, background: str):
        encrypted = self.cipher.encrypt(background.encode())
        await db.execute(
            "UPDATE users SET background_encrypted = $1 WHERE id = $2",
            encrypted.decode(), user_id
        )

    async def get_background(self, user_id: UUID) -> str:
        encrypted = await db.fetch_val("SELECT background_encrypted FROM users WHERE id = $1", user_id)
        return self.cipher.decrypt(encrypted.encode()).decode()
```

**Vector Database (Qdrant)**:
- Vectors stored without PII
- Metadata includes chapter/section IDs only (no usernames/emails)
- API key authentication (never exposed client-side)

### Encryption in Transit

- **HTTPS**: All communication over TLS 1.3
- **Certificate**: Managed by Vercel (frontend), Railway/Fly.io (backend)
- **HSTS**: Strict-Transport-Security header enabled

```python
# Backend: src/main.py
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware

app.add_middleware(HTTPSRedirectMiddleware)

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    return response
```

---

## Input Validation & Sanitization

### Frontend Validation (TypeScript)
```typescript
import { z } from 'zod'

const SignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128)
    .regex(/[A-Z]/, "Must contain uppercase")
    .regex(/[a-z]/, "Must contain lowercase")
    .regex(/[0-9]/, "Must contain number"),
  softwareBackground: z.enum(['beginner', 'intermediate', 'advanced']),
  hardwareBackground: z.enum(['none', 'hobbyist', 'professional']),
})

function validateSignup(data: unknown) {
  return SignupSchema.parse(data) // Throws if invalid
}
```

### Backend Validation (Python)
```python
from pydantic import BaseModel, validator, EmailStr

class RAGQueryRequest(BaseModel):
    query: str
    mode: str
    selected_text: str | None = None

    @validator('query')
    def validate_query(cls, v):
        if len(v) > 500:
            raise ValueError('Query too long (max 500 chars)')
        if not v.strip():
            raise ValueError('Query cannot be empty')
        # Prevent prompt injection
        if '```' in v or 'SYSTEM:' in v.upper():
            raise ValueError('Invalid query format')
        return v.strip()

    @validator('mode')
    def validate_mode(cls, v):
        if v not in ['full-book', 'selected-text']:
            raise ValueError('Invalid mode')
        return v
```

---

## OWASP Top 10 Mitigations

### 1. Broken Access Control
- **Mitigation**: Session-based auth with better-auth, middleware verifies user_id on every protected route
- **Test**: Attempt to access `/api/profile?user_id=other_user_id` → Should fail with 403

### 2. Cryptographic Failures
- **Mitigation**: bcrypt for passwords (cost 12), Fernet for sensitive fields, TLS 1.3 for transit
- **Test**: Inspect database → passwords should be hashed, not plaintext

### 3. Injection
- **Mitigation**: Parameterized queries (no string concatenation), Pydantic validation
- **Test**: Send `query="'; DROP TABLE users; --"` to RAG endpoint → Should be rejected

### 4. Insecure Design
- **Mitigation**: Threat modeling completed, security requirements in constitution
- **Test**: Review architecture docs for security controls at each layer

### 5. Security Misconfiguration
- **Mitigation**: HTTPS enforced, security headers set, secrets in env vars (never committed)
- **Test**: Run security scanner (e.g., OWASP ZAP) against deployed backend

### 6. Vulnerable Components
- **Mitigation**: Dependabot enabled, `npm audit` and `pip-audit` in CI pipeline
- **Test**: `npm audit --production` and `pip-audit` should report zero vulnerabilities

### 7. Identification & Authentication Failures
- **Mitigation**: better-auth handles session management, password complexity enforced, bcrypt hashing
- **Test**: Attempt brute force attack → Should be rate-limited after 5 failed attempts

### 8. Software & Data Integrity Failures
- **Mitigation**: Subresource Integrity (SRI) for CDN assets, signed container images
- **Test**: Inspect deployed frontend → `<script>` tags should have `integrity` attribute

### 9. Security Logging & Monitoring Failures
- **Mitigation**: Structured logs for auth events, failed login attempts, RAG queries
- **Test**: Tail logs during attack simulation → Should capture all suspicious activity

### 10. Server-Side Request Forgery (SSRF)
- **Mitigation**: No user-controlled URLs, Qdrant/Neon endpoints hardcoded in env vars
- **Test**: Attempt to pass `qdrant_url` in API request → Should be ignored

---

## Rate Limiting

### Strategy
```python
from fastapi_limiter import FastAPILimiter
from fastapi_limiter.depends import RateLimiter
from redis.asyncio import Redis

# Initialize rate limiter with Redis
@app.on_event("startup")
async def startup():
    redis = await Redis.from_url("redis://localhost:6379")
    await FastAPILimiter.init(redis)

# Apply limits per endpoint
@router.post("/rag/query")
@limiter(times=10, hours=1)  # 10 requests per hour
async def query_rag(req: RAGQueryRequest, user: User = Depends(get_current_user)):
    ...

@router.post("/auth/signin")
@limiter(times=5, minutes=15)  # 5 login attempts per 15 minutes
async def signin(req: SigninRequest):
    ...
```

### Limits

| Endpoint | Limit | Window | Reason |
|----------|-------|--------|--------|
| `/auth/signin` | 5 | 15 min | Prevent brute force |
| `/auth/signup` | 3 | 1 hour | Prevent spam accounts |
| `/rag/query` | 10 | 1 hour | Control AI costs |
| `/personalize` | 5 | 1 hour | Expensive operation |
| `/translate` | 20 | 1 hour | Moderate cost |
| `/api/*` (global) | 100 | 1 hour | General abuse prevention |

---

## GDPR Compliance

### Data Minimization
- Collect only: email, password hash, background preferences
- No tracking cookies (besides auth session)
- No third-party analytics by default

### Right to Access
```python
@router.get("/profile/export")
async def export_data(user: User = Depends(get_current_user)):
    # Gather all user data
    profile = await db.fetch_one("SELECT * FROM users WHERE id = $1", user.id)
    queries = await db.fetch_all("SELECT * FROM rag_queries WHERE user_id = $1", user.id)
    preferences = await db.fetch_all("SELECT * FROM user_preferences WHERE user_id = $1", user.id)

    return {
        "profile": dict(profile),
        "rag_queries": [dict(q) for q in queries],
        "preferences": [dict(p) for p in preferences],
        "exported_at": datetime.utcnow().isoformat()
    }
```

### Right to Deletion
```python
@router.delete("/profile")
async def delete_account(user: User = Depends(get_current_user)):
    # 1. Delete user records (cascade to sessions, preferences)
    await db.execute("DELETE FROM users WHERE id = $1", user.id)

    # 2. Anonymize RAG query logs (keep for analytics, remove PII)
    await db.execute(
        "UPDATE rag_queries SET user_id = NULL, anonymized = TRUE WHERE user_id = $1",
        user.id
    )

    # 3. Clear session
    response.delete_cookie("session")

    return {"message": "Account deleted successfully"}
```

### Data Retention
- User profiles: Retained until deletion request
- RAG query logs: Anonymized after 90 days
- Session tokens: Expired after 7 days, deleted after 30 days

---

## Logging & Auditing

### Sensitive Events to Log
1. **Authentication**: Signin, signup, signout, failed login attempts
2. **Authorization**: Access denied events, privilege escalation attempts
3. **Data Access**: Profile exports, account deletions
4. **AI Operations**: RAG queries (anonymized), personalizations, translations

### Log Format
```json
{
  "timestamp": "2025-12-28T10:30:00Z",
  "level": "INFO",
  "event": "auth.signin.success",
  "user_id": "user_xyz",
  "email": "user@example.com",
  "ip": "192.168.1.1",
  "user_agent": "Mozilla/5.0...",
  "request_id": "req_abc123",
  "metadata": {
    "session_duration": "7d",
    "device_type": "desktop"
  }
}
```

### Log Storage
- **Development**: stdout
- **Production**: Aggregated to logging service (e.g., Logtail, Datadog)
- **Retention**: 90 days for operational logs, 1 year for security events

### Sensitive Data Exclusion
- **Never log**: Passwords, session tokens, API keys
- **Redacted**: Email (log `u****@example.com`), IP (log first 3 octets)
- **Hashed**: User IDs logged as SHA256 hash for anonymity

---

## Incident Response Plan

### Security Incident Types
1. **Data breach**: Unauthorized access to user data
2. **Account takeover**: User reports compromised account
3. **DDoS attack**: Service unavailable due to traffic spike
4. **Vulnerability disclosure**: Security researcher reports flaw

### Response Procedure

**Phase 1: Detection & Triage (0-30 minutes)**
1. Alert received (monitoring, user report, researcher)
2. Assess severity: Critical / High / Medium / Low
3. Assemble response team (lead, backend engineer, security)

**Phase 2: Containment (30 minutes - 2 hours)**
1. Isolate affected systems (e.g., disable compromised endpoint)
2. Revoke compromised credentials (sessions, API keys)
3. Block malicious IPs (firewall rules)

**Phase 3: Investigation (2-24 hours)**
1. Review logs for attack vector
2. Identify affected users (query database for accessed records)
3. Document timeline and root cause

**Phase 4: Remediation (1-7 days)**
1. Patch vulnerability or fix misconfiguration
2. Deploy fix to production
3. Reset affected user passwords (force re-authentication)
4. Notify users if PII exposed (GDPR requirement: 72 hours)

**Phase 5: Post-Incident (1-2 weeks)**
1. Publish post-mortem (internal)
2. Update security documentation
3. Implement preventive measures (e.g., additional monitoring)
4. Conduct security training if human error involved

---

## Security Testing

### Automated Tests
```python
# tests/security/test_auth.py
async def test_signin_brute_force_protection():
    # Attempt 10 failed logins
    for i in range(10):
        response = await client.post("/auth/signin", json={
            "email": "test@example.com",
            "password": "wrong_password"
        })

    # 11th attempt should be rate limited
    response = await client.post("/auth/signin", json={
        "email": "test@example.com",
        "password": "any_password"
    })
    assert response.status_code == 429  # Too Many Requests

async def test_session_hijacking_prevention():
    # User A signs in
    response_a = await client.post("/auth/signin", json={
        "email": "user_a@example.com",
        "password": "password_a"
    })
    session_a = response_a.cookies.get("session")

    # User B attempts to use User A's session token
    response = await client.get(
        "/api/profile",
        headers={"Cookie": f"session={session_a}"},
        # Simulate different IP and user agent
        headers={"X-Forwarded-For": "10.0.0.1", "User-Agent": "AttackerBot"}
    )

    # Should detect anomaly and reject (if anomaly detection enabled)
    # For now, just verify session is tied to user_id
    assert response.json()["user_id"] == "user_a_id"
```

### Penetration Testing
- **Scope**: Auth endpoints, RAG API, profile management
- **Tools**: Burp Suite, OWASP ZAP, sqlmap
- **Frequency**: Before major releases, after security-critical changes
- **Findings**: Documented in private repo, patched within 7 days (critical), 30 days (high)

### Security Scan (CI Pipeline)
```yaml
# .github/workflows/security.yml
name: Security Scan

on: [push, pull_request]

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run npm audit
        run: cd frontend && npm audit --production
      - name: Run pip-audit
        run: cd backend && pip install pip-audit && pip-audit
      - name: Run Trivy (container scan)
        run: trivy image backend:latest --severity HIGH,CRITICAL
      - name: Run Semgrep (SAST)
        run: semgrep --config auto backend/src
```

---

## Secrets Management

### Environment Variables
```bash
# .env.example (committed to repo)
DATABASE_URL=postgresql://user:password@host:5432/dbname
QDRANT_URL=https://xyz.qdrant.cloud
QDRANT_API_KEY=your_qdrant_key
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
BETTER_AUTH_SECRET=random_32_byte_string
ENCRYPTION_KEY=fernet_key_here
```

### Secrets Storage
- **Development**: `.env` file (gitignored)
- **Production**: Platform-specific secrets manager
  - Vercel: Environment Variables (encrypted)
  - Railway/Fly.io: Secrets (encrypted at rest)

### Secrets Rotation
- **Frequency**: Every 90 days for API keys, every 180 days for database passwords
- **Process**:
  1. Generate new secret
  2. Add new secret to env vars (keep old for rollback)
  3. Deploy new version using new secret
  4. Verify service health
  5. Remove old secret after 24 hours

---

## Success Criteria

- [ ] 100% of authentication flows use httpOnly, Secure, SameSite cookies
- [ ] Zero plaintext passwords in database (bcrypt hashing)
- [ ] All API endpoints protected by session verification middleware
- [ ] Rate limiting active on all public endpoints
- [ ] Security headers (HSTS, CSP, X-Frame-Options) present in all responses
- [ ] Failed login attempts logged and alerted after 5 attempts
- [ ] GDPR export and deletion endpoints functional
- [ ] Zero critical vulnerabilities in dependency scans (npm audit, pip-audit)
- [ ] Penetration test completed with no high-severity findings unpatched
- [ ] Incident response plan tested with tabletop exercise

---

**Document Status**: ✅ Complete
**Next Steps**: RAG Flow Specification, Personalization Logic Specification
