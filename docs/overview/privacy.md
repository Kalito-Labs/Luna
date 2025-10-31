# 🔒 Kalito Privacy & Security Architecture

## Executive Summary

Kalito is a **privacy-first, local-first family AI platform** designed with complete data sovereignty. Your family's health data, conversations, and personal information remain on your device under your control. This document details the comprehensive privacy and security architecture that protects your family's sensitive information.

**Core Privacy Principles**:
- 🏠 **Local-First**: All data stored on your device, not in the cloud
- 🔐 **Zero Trust Cloud**: Cloud AI services only receive minimal context needed for responses
- 🛡️ **Defense in Depth**: Multiple security layers protect against common web vulnerabilities
- 📊 **Data Minimization**: Only necessary data transmitted, with privacy filtering
- 🚫 **No Tracking**: No analytics, no telemetry, no third-party data sharing

---

## 1. Data Sovereignty & Storage

### What Stays on Your Device (100% Local)

**Eldercare & Family Data**:
- ✅ Patient records (names, DOB, relationships, medical history)
- ✅ Medications (prescriptions, dosages, schedules, pharmacy info)
- ✅ Appointments (dates, providers, locations, preparation notes)
- ✅ Vital signs (weight, glucose readings, measurements)
- ✅ Healthcare providers (doctors, specialists, contact information)
- ✅ Caregiver profile (your information and preferences)
- ✅ Insurance details (providers, policy numbers)
- ✅ Emergency contacts (names, phone numbers)

**AI & Conversation Data**:
- ✅ Complete conversation history (every message, every session)
- ✅ Semantic pins (important facts extracted from conversations)
- ✅ Conversation summaries (AI-generated session recaps)
- ✅ Session metadata (timestamps, models used, persona configurations)
- ✅ AI persona configurations (custom prompts, settings, specialties)
- ✅ Model preferences and settings

**Database Files**:
- ✅ SQLite database file (`kalito.db`) - never transmitted
- ✅ Database backups (stored locally in `/backups` directory)
- ✅ WAL and journal files (SQLite transaction logs)

**File System Access**:
- Location: `backend/db/kalito.db`
- Permissions: Standard filesystem permissions (chmod 644 recommended)
- Backups: Manual backups via `scripts/backup-db` script
- No cloud sync, no automatic uploads

---

### What Can Leave Your Device

**Cloud AI Requests** (Only When Using Cloud Models):

When you choose to use cloud AI models (like OpenAI GPT-4o Nano), the following data may be transmitted:

- ✉️ Your current question/message
- ✉️ Recent conversation context (last 5-10 messages for continuity)
- ✉️ Relevant eldercare context (if persona has `patient_context` enabled)
  - Patient names and relationships
  - Relevant medications for the current query
  - Upcoming appointments (next 30 days)
  - Recent vitals (if discussing health metrics)
- ✉️ AI responses back to your device

**Important Context Filtering**:
- ❌ Insurance policy numbers - **NEVER sent**
- ❌ Emergency contact phone numbers - **NEVER sent**
- ❌ Full patient addresses - **NEVER sent**
- ❌ Social security numbers - **NEVER sent**
- ❌ Complete medical history - **Only relevant excerpts**
- ✅ Only information needed to answer your specific question

**Web Search Queries** (Tavily API):
- ✉️ Your search query text
- ✉️ Search results (articles, summaries, URLs)
- ❌ Patient names filtered out automatically
- ❌ No session context sent
- ❌ No personal identifiers included

**API Communication Details**:
- Protocol: HTTPS/TLS 1.3 (encrypted in transit)
- Authentication: API keys stored in `.env` (never in code)
- Headers: Standard HTTP headers + User-Agent
- No cookies, no tracking pixels, no fingerprinting

---

### What NEVER Leaves Your Network

**Guaranteed Local-Only Data**:
- 🔒 The actual SQLite database file
- 🔒 Raw patient medical records
- 🔒 Complete medication history with pharmacy details
- 🔒 Insurance policy numbers and insurance IDs
- 🔒 Emergency contact details
- 🔒 Conversation sessions (full transcripts stored locally only)
- 🔒 Semantic pins and summaries (memory system data)
- 🔒 Healthcare provider contact information
- 🔒 Caregiver personal information
- 🔒 Database backups
- 🔒 Local model conversations (Phi3 Mini via Ollama)

**Local-Only Models**:
When using local models (Phi3 Mini via Ollama), **absolutely zero data** leaves your device. The entire AI inference runs on your laptop with no internet connection required.

---

## 2. Privacy Architecture

### Tiered Privacy Model

Kalito implements a sophisticated tiered privacy system based on the AI model you choose:

```
┌─────────────────────────────────────────────────────────────┐
│                     PRIVACY TIERS                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  🔒 TIER 1: LOCAL MODELS (Phi3 Mini)                        │
│     • 100% offline operation                                │
│     • Zero data transmission                                │
│     • Complete privacy guaranteed                           │
│     • No API keys required                                  │
│     • Full eldercare context access                         │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  🔐 TIER 2: TRUSTED CLOUD MODELS (OpenAI GPT-4o Nano)       │
│     • Your own API key (you control costs & logs)           │
│     • Full eldercare context (with privacy filtering)       │
│     • Encrypted transmission (HTTPS/TLS)                    │
│     • No insurance/SSN transmitted                          │
│     • Function calling & tools enabled                      │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ⚠️  TIER 3: FUTURE THIRD-PARTY MODELS (Not Yet Implemented)│
│     • Minimal context only                                  │
│     • No patient names                                      │
│     • No dates or identifiers                               │
│     • Generic health queries only                           │
│     • Heavy privacy filtering                               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Context Privacy Filtering

**EldercareContextService** (`backend/logic/eldercareContextService.ts`) implements intelligent privacy filtering:

**For Local Models (Trusted)**:
```typescript
includePrivateData = true
- Patient phone numbers ✅
- Emergency contacts ✅
- Insurance information ✅
- Full medication details ✅
- Complete appointment history ✅
- Provider contact information ✅
```

**For Cloud Models (Your Controlled APIs)**:
```typescript
includePrivateData = true (with filtering)
- Patient names ✅ (needed for context)
- Medication names ✅ (needed for advice)
- Appointment dates ✅ (needed for scheduling)
- Insurance policy numbers ❌ (filtered out)
- Emergency contact phones ❌ (filtered out)
- Full addresses ❌ (filtered out)
```

**For Unknown/Future Models**:
```typescript
includePrivateData = false
- Generic health categories only
- No personal identifiers
- No specific dates
- No names or relationships
```

---

## 3. Security Architecture

### Defense in Depth: Multiple Security Layers

#### Layer 1: Network Security

**CORS (Cross-Origin Resource Sharing)**:
- **Development**: Restricted to `localhost:5173` (Vite) and `localhost:3000`
- **Production**: Whitelist specific domains only
- **Credentials**: Enabled for authenticated requests
- **Preflight**: OPTIONS requests handled with 24-hour cache

Configuration (`backend/middleware/security.ts`):
```typescript
Development Origins:
- http://localhost:3000
- http://localhost:5173
- http://127.0.0.1:3000
- http://127.0.0.1:5173

Production Origins:
- https://kalito.ai
- https://www.kalito.ai
- https://app.kalito.ai
```

**Local Network Binding**:
- Server binds to localhost by default
- Not exposed to public internet
- No port forwarding required
- Firewall-friendly architecture

---

#### Layer 2: HTTP Security Headers (Helmet.js)

**Content Security Policy (CSP)**:
```typescript
defaultSrc: ["'self'"]                    // Only load resources from same origin
styleSrc: ["'self'", "'unsafe-inline'"]   // Styles from self + inline Vue styles
scriptSrc: ["'self'"]                     // Scripts only from same origin
imgSrc: ["'self'", 'data:', 'https:']     // Images from self + data URLs + HTTPS
connectSrc: ["'self'", 'https://api.openai.com']  // API calls to self + OpenAI
fontSrc: ["'self'"]                       // Fonts from same origin
objectSrc: ["'none'"]                     // No Flash/Java plugins
mediaSrc: ["'self'"]                      // Media from same origin
frameSrc: ["'none'"]                      // No iframes allowed
```

**Additional Security Headers**:
- **HSTS**: Strict-Transport-Security with 1-year max-age + preload
- **X-Content-Type-Options**: nosniff (prevents MIME-type sniffing)
- **X-Frame-Options**: DENY (prevents clickjacking)
- **X-XSS-Protection**: 1; mode=block (legacy XSS protection)
- **Referrer-Policy**: no-referrer (no referrer leakage)

---

#### Layer 3: Rate Limiting

**General API Endpoints**:
- **Window**: 15 minutes
- **Development**: 1,000 requests per window
- **Production**: 500 requests per window
- **Response**: 429 Too Many Requests with retry-after header
- **Applies To**: All routes by default

**AI Agent Endpoints** (Stricter):
- **Window**: 10 minutes
- **Development**: 200 requests per window
- **Production**: 100 requests per window
- **Response**: 429 AI Rate Limit Exceeded
- **Applies To**: `/api/agent/*` routes

**Benefits**:
- Prevents brute-force attacks
- Mitigates denial-of-service attempts
- Protects expensive AI API calls
- Ensures fair resource usage

---

#### Layer 4: Request Validation & Sanitization

**Input Validation** (Zod Schemas):

Every API endpoint validates incoming data using strict TypeScript schemas:

```typescript
// Example: Appointment creation
const createAppointmentSchema = z.object({
  patient_id: z.string().min(1),                    // Required
  appointment_date: z.string().min(1),              // Required YYYY-MM-DD
  appointment_time: z.string().optional(),          // Optional HH:MM
  appointment_type: z.string().optional(),          // Enum validation
  notes: z.string().optional(),                     // Optional text
  follow_up_required: z.boolean().optional(),       // Boolean validation
})
```

**Validation Errors**:
- Returns 400 Bad Request
- Includes specific field errors
- Never executes invalid requests
- Prevents injection attacks

**Request Size Limits**:
- **JSON Body**: 10MB maximum
- **URL-Encoded**: 10MB maximum
- **Prevents**: Denial-of-service via large payloads

**Request Timeouts**:
- **Standard Requests**: 30 seconds
- **AI Requests**: 120 seconds (allows for model inference)
- **Prevents**: Resource exhaustion from hanging connections

---

#### Layer 5: SQL Injection Prevention

**Parameterized Queries** (better-sqlite3):

Every database query uses parameterized statements, making SQL injection impossible:

```typescript
// ❌ VULNERABLE (string concatenation):
db.exec(`SELECT * FROM patients WHERE name = '${userInput}'`)

// ✅ SECURE (parameterized query):
db.prepare(`SELECT * FROM patients WHERE name = ?`).get(userInput)
```

**Benefits**:
- User input never directly embedded in SQL
- SQLite driver handles proper escaping
- Prevents classic injection attacks (`'; DROP TABLE patients;--`)

**All Queries Parameterized**:
- ✅ Patient lookups
- ✅ Medication queries
- ✅ Appointment searches
- ✅ Session retrieval
- ✅ Message history
- ✅ Semantic pin queries

---

#### Layer 6: Security Monitoring

**Suspicious Pattern Detection**:

Monitors requests for common attack patterns:
```typescript
const suspiciousPatterns = [
  /\.\.\//,           // Directory traversal (../../etc/passwd)
  /script>/i,         // Script injection (<script>alert()</script>)
  /union.*select/i,   // SQL injection (UNION SELECT)
  /exec\(/i,          // Code injection (eval(), exec())
  /<iframe/i,         // Iframe injection
]
```

**Security Logging**:
```typescript
{
  ip: "127.0.0.1",
  userAgent: "Mozilla/5.0...",
  method: "POST",
  url: "/api/agent/chat",
  timestamp: "2025-10-30T12:34:56.789Z",
  origin: "http://localhost:5173",
  suspicious: false
}
```

---

## 4. Data Minimization Strategy

### AI Context Management

**Smart Context Selection**:

The `EldercareContextService` implements intelligent context selection to minimize data transmission:

1. **Query Analysis**: Analyzes your question to determine relevant data
2. **Selective Loading**: Only loads necessary patient/medication/appointment data
3. **Token Budget**: Limits context size to prevent over-sharing
4. **Importance Scoring**: Prioritizes most relevant information

**Example Context Filtering**:

**Question**: "When is Mom's next appointment?"
```typescript
// Included in context:
- Patient: Mom's name, relationship
- Appointments: Next 3 upcoming appointments
- Current date for context

// Excluded from context:
- All medications (not relevant to question)
- Vitals history (not relevant)
- Other patients' data (not relevant)
- Insurance information (never needed for this query)
```

**Token Budget Management**:
- Maximum context: ~4,000 tokens (model-dependent)
- Priority: Semantic pins > Summaries > Recent messages
- Truncation: Oldest messages dropped first
- Compression: Summaries used instead of full messages when possible

---

## 5. API Key Management

### Environment Variable Security

**Storage**:
- API keys stored in `.env` file (never committed to git)
- `.gitignore` prevents accidental commits
- File permissions: `chmod 600 .env` (owner read/write only)

**Required API Keys** (Optional - only if using cloud features):
```bash
# OpenAI API Key (optional - only for cloud AI models)
OPENAI_API_KEY=sk-your-key-here

# Tavily API Key (optional - only for web search)
TAVILY_API_KEY=tvly-your-key-here

# Ollama URL (optional - defaults to localhost:11434)
OLLAMA_URL=http://localhost:11434
```

**Key Rotation**:
- You control your own API keys
- Can rotate anytime via OpenAI/Tavily dashboards
- No impact on local data or functionality
- Local models require no API keys

**Key Validation**:
- Server validates API keys on startup
- Invalid keys log warnings but don't crash
- Graceful fallback to local models if cloud unavailable

---

## 6. Database Security

### SQLite Configuration

**File Location**: `backend/db/kalito.db`

**Performance & Security Optimizations**:
```typescript
database.pragma('foreign_keys = ON')      // Referential integrity
database.pragma('journal_mode = WAL')     // Write-Ahead Logging
database.pragma('synchronous = NORMAL')   // Balance durability/speed
database.pragma('cache_size = 1000')      // Memory cache
database.pragma('temp_store = MEMORY')    // Temp tables in RAM
```

**Foreign Key Constraints**:
- Enforced at database level
- Cascade deletes for related data
- Prevents orphaned records
- Data integrity guaranteed

**Backup Strategy**:
```bash
# Manual backup
./scripts/backup-db

# Creates timestamped backup:
backups/kalito.db.2025-10-30_143025.bak

# Restore from backup
./scripts/restore-db backups/kalito.db.2025-10-30_143025.bak
```

---

## 7. Trust Model & Threat Model

### Trusted Components

**✅ Fully Trusted** (No Privacy Concerns):
- Your local device filesystem
- Ollama local inference (runs on your device)
- SQLite database (local storage)
- Your web browser (localhost access)

**✅ Conditionally Trusted** (Your Control):
- OpenAI API (your API key, your account, your logs)
- Tavily Search API (your API key, query logs)
- Your network infrastructure (local network)

**⚠️ Not Trusted** (Defense in Depth):
- User input (validated, sanitized, parameterized)
- Network requests (rate limited, CORS restricted)
- External dependencies (pinned versions, security updates)

---

### Threat Model: What We Protect Against

**✅ Protected**:
- SQL injection attacks (parameterized queries)
- Cross-site scripting (XSS) (CSP headers)
- Cross-site request forgery (CSRF) (CORS restrictions)
- Denial-of-service (rate limiting, timeouts)
- Directory traversal (input validation)
- Code injection (pattern detection)
- Session hijacking (local-only sessions)
- Man-in-the-middle to cloud APIs (HTTPS/TLS)

**⚠️ Partially Protected**:
- Physical device access (filesystem permissions)
- Malicious browser extensions (CSP helps)
- Compromised cloud API providers (minimize data sent)

**❌ Not Protected Against**:
- Full system compromise (malware, root access)
- User giving away API keys
- Screen recording/keylogging malware
- Physical theft of unlocked device

---

## 8. Compliance & Best Practices

### HIPAA Considerations

**Important Note**: Kalito is a **personal family tool**, not a covered entity under HIPAA. However, we follow HIPAA-inspired best practices:

**✅ Privacy Best Practices Followed**:
- **Minimum Necessary**: Only essential data transmitted to AI
- **Access Controls**: Local device access only (no multi-user auth yet)
- **Audit Trails**: Request logging, security monitoring
- **Data Integrity**: Foreign keys, validation, backups
- **Confidentiality**: Encryption in transit (HTTPS), local storage

**❌ HIPAA Not Applicable Because**:
- Personal use only (not a healthcare provider)
- No healthcare transactions
- No insurance billing
- No PHI transmission to covered entities
- Family-only access

**If You Want HIPAA Compliance**:
Consider these additions (not currently implemented):
- User authentication (passwords, 2FA)
- Audit logs (access tracking)
- Encryption at rest (database encryption)
- Business Associate Agreements (with cloud AI providers)
- Access controls (role-based permissions)

---

### Data Retention Policy

**Current Implementation** (Perpetual Local Storage):
- All data stored indefinitely until manually deleted
- No automatic purging or expiration
- No cloud backups (manual backups only)
- Full control over data lifecycle

**Manual Data Management**:
- Delete individual records via UI
- Soft deletes (active=0) for most records
- Hard deletes for sessions (cascade to messages)
- Manual database cleanup via SQL if needed

**Recommendations**:
- Backup before major updates: `./scripts/backup-db`
- Review old data annually
- Export important records before deletion
- Test restore process periodically

---

## 9. Network Architecture

### Local-First Design

```
┌──────────────────────────────────────────────────────────┐
│                    YOUR DEVICE                           │
│                                                          │
│  ┌─────────────────┐         ┌──────────────────┐      │
│  │   Frontend      │────────▶│   Backend        │      │
│  │   (Vue/Vite)    │◀────────│   (Express)      │      │
│  │   Port: 5173    │         │   Port: 3000     │      │
│  └─────────────────┘         └──────────────────┘      │
│                                      │                   │
│                                      ▼                   │
│                              ┌──────────────────┐       │
│                              │   SQLite DB      │       │
│                              │   kalito.db      │       │
│                              └──────────────────┘       │
│                                      │                   │
│                                      ▼                   │
│                              ┌──────────────────┐       │
│                              │   Ollama         │       │
│                              │   (Local AI)     │       │
│                              │   Port: 11434    │       │
│                              └──────────────────┘       │
│                                                          │
└──────────────────────────────────────────────────────────┘
                    │                     │
                    │ (Optional)          │ (Optional)
                    ▼                     ▼
        ┌───────────────────┐   ┌──────────────────┐
        │   OpenAI API      │   │   Tavily API     │
        │   (Cloud AI)      │   │   (Web Search)   │
        └───────────────────┘   └──────────────────┘
              HTTPS/TLS              HTTPS/TLS
```

**Key Points**:
- All core functionality works offline (local models)
- Cloud APIs optional (enable advanced features)
- No data leaves device without user-initiated action
- Browser to backend: localhost (no network exposure)

---

## 10. Privacy-Enhancing Features

### Web Search Privacy

**Tavily Search Integration** (`backend/logic/tavilyService.ts`):

**Privacy Protections**:
- Query truncation in logs (first 100 chars only)
- Patient name filtering before search
- No session context sent to Tavily
- Generic queries only (health topics, not personal details)

**Example**:
```typescript
// User asks: "What are the side effects of Mom's blood pressure medication?"

// Privacy filtering:
1. Extract medication name (no patient name)
2. Generic query: "side effects of [medication name]"
3. Send to Tavily: "side effects lisinopril"
4. Receive results (generic drug information)
5. AI contextualizes with local patient data

// What Tavily receives: "side effects lisinopril"
// What Tavily NEVER sees: "Mom", patient name, dosage, doctor name
```

---

### Memory System Privacy

**Semantic Pins** (Important Facts):
- Stored locally only
- Never transmitted to cloud
- Used for context enrichment
- Fully under your control

**Conversation Summaries**:
- Generated locally or via cloud model
- Stored locally only
- Compress long conversations
- Reduce token usage in future queries

**Session Data**:
- All sessions stored locally
- Cascade delete removes all traces
- No cloud sync
- Full conversation history preserved

---

## 11. Security Recommendations

### For Maximum Privacy

**1. Use Local Models Exclusively**:
```bash
# Start Ollama
ollama run phi3

# Use "Default Local Assistant" persona
# Zero data leaves your device
```

**2. Disable Web Search** (if not needed):
```bash
# Don't configure TAVILY_API_KEY
# Search functionality will gracefully disable
```

**3. Regular Backups**:
```bash
# Weekly backups recommended
./scripts/backup-db

# Store backups on encrypted external drive
```

**4. Filesystem Permissions**:
```bash
# Restrict database access
chmod 600 backend/db/kalito.db

# Restrict .env file
chmod 600 .env
```

**5. Network Security**:
```bash
# Verify server binds to localhost only
netstat -an | grep 3000
# Should show: 127.0.0.1:3000 or ::1:3000

# Enable firewall
sudo ufw enable
sudo ufw allow 3000/tcp  # Only if needed externally
```

---

### For Cloud AI Usage

**1. Use Your Own API Keys**:
- Create accounts directly with OpenAI/Tavily
- Never share API keys
- Monitor usage dashboards
- Set spending limits

**2. Review API Logs**:
- OpenAI: Check usage logs at platform.openai.com
- Tavily: Review query logs at tavily.com dashboard
- Understand what data was sent

**3. API Key Rotation**:
```bash
# Rotate every 90 days
1. Generate new key at provider dashboard
2. Update .env file
3. Restart backend: pnpm dev
4. Revoke old key
```

**4. Least Privilege**:
- Use API keys with minimum required permissions
- Set rate limits at provider level
- Enable request logging at provider level

---

## 12. Incident Response

### If API Key Compromised

**Immediate Actions**:
1. Revoke compromised key at provider dashboard
2. Generate new API key
3. Update `.env` file
4. Restart backend server
5. Monitor usage for unexpected charges
6. Review recent API logs for suspicious activity

**No Patient Data Risk**:
- API key compromise doesn't expose local database
- All family data remains secure on your device
- Worst case: Unauthorized AI usage (financial cost only)

---

### If Device Compromised

**Immediate Actions**:
1. Disconnect from network
2. Change all passwords (cloud API accounts)
3. Revoke all API keys
4. Run malware scan
5. Review system logs for unauthorized access
6. Consider reinstalling OS if severe

**Data Considerations**:
- Local database potentially accessible by attacker
- Backup immediately if possible
- Consider database re-encryption if available
- Review recent file access logs

---

## 13. Future Privacy Enhancements

### Planned Features (Roadmap)

**Database Encryption at Rest**:
- SQLCipher integration
- Password-protected database
- Automatic decryption on startup

**User Authentication**:
- Optional login for multi-user households
- Per-user data isolation
- Audit trails for access

**Enhanced Privacy Tiers**:
- Anonymous mode (no cloud API calls)
- Privacy score for each AI model
- Automatic data minimization levels

**Export & Portability**:
- Export all data as JSON
- FHIR-compatible export for medical records
- Easy migration to other platforms

---

## 14. Summary & Privacy Scorecard

### Privacy Scorecard

| Feature | Privacy Level | Notes |
|---------|--------------|-------|
| Local Model Usage (Phi3) | 🟢 **Perfect** | Zero data transmission |
| Cloud AI (OpenAI) | 🟡 **Good** | Minimal context, your API key |
| Web Search (Tavily) | 🟡 **Good** | Generic queries, name filtering |
| Database Storage | 🟢 **Perfect** | Local filesystem, your control |
| Session Data | 🟢 **Perfect** | Never leaves device |
| API Key Storage | 🟡 **Good** | .env file, recommend encryption |
| Network Exposure | 🟢 **Perfect** | Localhost only, no public access |
| Input Validation | 🟢 **Perfect** | Comprehensive Zod schemas |
| SQL Injection | 🟢 **Perfect** | Fully parameterized queries |
| Rate Limiting | 🟢 **Perfect** | Protects against abuse |

**Overall Privacy Rating**: 🟢 **Excellent for Personal Use**

---

## 15. Contact & Questions

### Privacy Questions

If you have privacy concerns or questions:
1. Review this document thoroughly
2. Check the source code (fully open)
3. Test with local models for maximum privacy
4. Monitor network traffic if skeptical
5. Contribute improvements via GitHub

### Security Vulnerabilities

If you discover a security issue:
1. **Do NOT** open a public GitHub issue
2. Email: security@kalito.ai (if available)
3. Provide detailed reproduction steps
4. Allow reasonable time for fix
5. Responsible disclosure appreciated

---

## Conclusion

Kalito is designed with **privacy at its core**, not as an afterthought. Your family's sensitive health information deserves the highest level of protection, which is why we:

- Store everything locally by default
- Minimize cloud API data transmission
- Give you control over every privacy decision
- Implement defense-in-depth security
- Follow industry best practices
- Maintain full transparency (open source)

**Your data belongs to you.** We built Kalito to keep it that way.

  

  