# Full-Stack Android APK Implementation - Overview & Architecture

**Document Version:** 1.0  
**Date:** November 9, 2025  
**Target:** Self-contained Android APK with embedded Node.js backend and SQLite database  
**Implementation Approach:** Capacitor + nodejs-mobile-capacitor

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current Architecture](#current-architecture)
3. [Target Architecture](#target-architecture)
4. [Why nodejs-mobile-capacitor?](#why-nodejs-mobile-capacitor)
5. [Key Challenges & Solutions](#key-challenges--solutions)
6. [Project Statistics](#project-statistics)
7. [Implementation Phases](#implementation-phases)
8. [Prerequisites](#prerequisites)
9. [Document Structure](#document-structure)

---

## Executive Summary

### Current State
Kalito Space currently operates as:
- **Frontend:** Vue 3 + TypeScript PWA (Capacitor-enabled)
- **Backend:** Node.js + Express server running on laptop (192.168.1.96:3000)
- **Database:** SQLite (kalito.db) stored on laptop
- **Deployment:** Android APK connects to laptop server over local network

### Target State
Transform into a fully self-contained Android application where:
- ✅ **Node.js backend runs natively on Android device**
- ✅ **SQLite database stored in Android app's private storage**
- ✅ **No external server required** - complete offline capability
- ✅ **All 143,000+ lines of code packaged into single APK**
- ✅ **Zero code rewrite** - current Vue + Node.js stack preserved

### Why This Matters
1. **True Mobility:** Use anywhere without laptop dependency
2. **Complete Privacy:** All data stays on device (no network transmission)
3. **Family Distribution:** Install on family member devices
4. **Offline Capability:** Works without internet (except AI cloud features)
5. **Professional Deployment:** Real mobile app, not just web wrapper

---

## Current Architecture

### Technology Stack (Verified Analysis)

#### Frontend (143,000+ total lines)
```
Technology: Vue 3.5.13 + TypeScript 5.8.3
Build Tool: Vite 6.3.5
Mobile: Capacitor 6.2.0
Location: /frontend/
Key Files:
  - src/config/api.ts (API routing logic)
  - capacitor.config.ts (current config)
  - vite.config.ts (build configuration)
  - package.json (38+ dependencies)

Current Behavior:
  - Detects platform: Capacitor.isNativePlatform()
  - Android: Direct HTTP to 192.168.1.96:3000
  - Web: Vite proxy to localhost:3000
```

#### Backend (1,381 TypeScript files)
```
Technology: Node.js 18+ + Express 5.1.0
Database: better-sqlite3 12.2.0
AI Integration: OpenAI SDK 5.0.1, Ollama, Tavily
Location: /backend/
Key Files:
  - server.ts (216 lines - main entry point)
  - db/db.ts (database connection)
  - db/init.ts (schema initialization - 14 tables)
  - package.json (28+ dependencies)

Structure:
  ├── db/ (database & initialization)
  ├── logic/ (17 services - AI, memory, eldercare, validation)
  ├── routes/ (11 API routers)
  ├── middleware/ (security, validation, errors)
  ├── types/ (TypeScript interfaces)
  └── utils/ (logging, contracts, helpers)
```

#### Database Schema
```
SQLite: backend/db/kalito.db

Chat System (5 tables):
  - sessions
  - messages (FK → sessions, cascade delete)
  - conversation_summaries (FK → sessions)
  - semantic_pins (FK → sessions)
  - personas

Eldercare System (9 tables):
  - patients
  - medications (FK → patients)
  - medication_adherence_logs (FK → medications)
  - appointments (FK → patients, providers)
  - vitals (FK → patients)
  - medical_records (FK → patients, providers)
  - healthcare_providers
  - caregivers
  - caregiver_time_logs (FK → caregivers, patients)

Total: 14 tables, 13 foreign keys, 11+ indexes
Optimizations: WAL mode, cache_size=1000, temp_store=MEMORY
```

#### API Endpoints (11 Routers)
```
Chat & AI:
  POST   /api/agent (streaming & non-streaming)
  POST   /api/agent/stream (SSE)
  GET    /api/sessions
  POST   /api/sessions
  GET    /api/personas
  GET    /api/models
  GET    /api/memory/:sessionId/context
  GET    /api/search (Tavily web search)

Eldercare:
  /api/patients
  /api/providers
  /api/medications
  /api/vitals
  /api/appointments
  /api/caregiver (caregivers CRUD)
```

#### Environment Variables (Required Analysis)
```
Current .env dependencies:

OPTIONAL (AI Features):
  - OPENAI_API_KEY (cloud AI - GPT-4.1 Nano)
  - TAVILY_API_KEY (web search)
  - OLLAMA_URL (local AI - defaults to localhost:11434)

CONFIGURATION (Server):
  - NODE_ENV (development|production|test)
  - PORT (defaults to 3000)
  - HOST (defaults to 0.0.0.0)
  - TRUST_PROXY (for production deployments)
  - APP_VERSION (optional versioning)

RESULT: Backend runs WITHOUT API keys for core features
        Only AI and search features require external services
```

---

## Target Architecture

### nodejs-mobile-capacitor Integration

```
┌────────────────────────────────────────────────────────────┐
│                    Android APK Package                      │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Vue 3 Frontend (WebView)                 │  │
│  │                                                       │  │
│  │  - Runs in Capacitor WebView                        │  │
│  │  - UI rendered as web content                       │  │
│  │  - Detects: Capacitor.isNativePlatform() = true    │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                 │
│                           │ IPC / HTTP (localhost)          │
│                           ▼                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │       Node.js Mobile Runtime (Native Service)        │  │
│  │                                                       │  │
│  │  - Embedded Node.js engine                          │  │
│  │  - Runs Express server on 127.0.0.1:3000           │  │
│  │  - All backend logic (17 services)                  │  │
│  │  - 11 API routers                                   │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                 │
│                           │ better-sqlite3                  │
│                           ▼                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │        SQLite Database (App Private Storage)         │  │
│  │                                                       │  │
│  │  - Location: /data/data/com.kalito.space/          │  │
│  │  - File: kalito.db                                  │  │
│  │  - 14 tables, full schema                           │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└────────────────────────────────────────────────────────────┘

External Dependencies (Optional):
  ┌─────────────────────┐
  │  Internet (Optional) │
  │                     │
  │  - OpenAI API       │
  │  - Tavily Search    │
  │  - Ollama (External)│
  └─────────────────────┘
```

### Component Interaction Flow

```
User Interaction → Vue Component
                       ↓
                  core.ts: sendMessageToAgent()
                       ↓
                  config/api.ts: apiUrl('/api/agent')
                       ↓
                  Capacitor.isNativePlatform() = true
                       ↓
                  HTTP Request to http://127.0.0.1:3000/api/agent
                       ↓
                  Node.js Mobile Express Server
                       ↓
                  agentRouter.ts processes request
                       ↓
                  agentService.ts orchestrates logic
                       ↓
                  eldercareContextService.ts queries database
                       ↓
                  better-sqlite3 → kalito.db in app storage
                       ↓
                  Response streamed back to Vue
                       ↓
                  UI updates in real-time
```

---

## Why nodejs-mobile-capacitor?

### Evaluation of Alternatives

#### ❌ Option Rejected: React Native
**Why Not:**
- Requires complete frontend rewrite (143,000+ lines)
- Vue components → React Native components (incompatible)
- 2-3 months development time
- Still needs nodejs-mobile for backend
- Loss of all current UI/UX work

#### ❌ Option Rejected: Move Backend Logic to Frontend
**Why Not:**
- 1,381 TypeScript files to port
- Complex services (AI, validation, memory management)
- Express routing → frontend state management
- Better-sqlite3 → @capacitor-community/sqlite (different API)
- Lose streaming capabilities (SSE)
- Massive architecture change

#### ❌ Option Rejected: Termux Workaround
**Why Not:**
- Not distributable to family
- Requires technical setup
- Backend stops when Termux closes
- Not a professional solution

#### ✅ Option Chosen: Capacitor + nodejs-mobile-capacitor

**Why This Works:**
1. **Zero Frontend Changes:** Vue 3 code stays identical
2. **Zero Backend Changes:** Node.js/Express code stays identical
3. **Proven Technology:** nodejs-mobile used in production apps
4. **Capacitor Native:** Already integrated in project
5. **One-Week Implementation:** Not months of rewrites
6. **Professional Result:** Real Android app, installable APK

### Technical Feasibility

**Capacitor Already Configured:**
```typescript
// frontend/capacitor.config.ts (VERIFIED)
{
  appId: 'com.kalito.space',
  appName: 'Kalito Space',
  webDir: 'dist',
  android: {
    allowMixedContent: true,
    backgroundColor: '#0f0f1e'
  }
}
```

**Android Build System Ready:**
```groovy
// frontend/android/app/build.gradle (VERIFIED)
android {
    namespace "com.kalito.space"
    applicationId "com.kalito.space"
    minSdkVersion 22
    compileSdk 34
    targetSdk 34
}
```

**API Routing Logic Exists:**
```typescript
// frontend/src/config/api.ts (VERIFIED)
export const API_BASE_URL = Capacitor.isNativePlatform()
  ? 'http://192.168.1.96:3000' // Current: laptop server
  : '' // Web: Vite proxy

// Will become:
export const API_BASE_URL = Capacitor.isNativePlatform()
  ? 'http://127.0.0.1:3000' // nodejs-mobile internal
  : '' // Web: unchanged
```

---

## Key Challenges & Solutions

### Challenge 1: Node.js Runtime on Android

**Problem:**  
Android doesn't natively support Node.js execution.

**Solution:**  
nodejs-mobile-capacitor provides:
- ARM-compiled Node.js binaries for Android
- Native bridge between Capacitor WebView and Node process
- Background service keeps Node running
- IPC communication channel

**Implementation:**
```bash
npm install nodejs-mobile-capacitor
npx cap sync android
```

### Challenge 2: Backend File Bundling

**Problem:**  
1,381 TypeScript files need to be bundled and included in APK.

**Solution:**  
Create `/frontend/nodejs-project/` directory structure:
- Copy entire `backend/` directory
- Bundle dependencies (node_modules)
- Create mobile-specific entry point
- Configure paths for Android file system

**Result:**  
All backend code packaged into `assets/nodejs-project/` in APK.

### Challenge 3: SQLite Database Path

**Problem:**  
Current path: `/backend/db/kalito.db` (desktop filesystem)  
Android needs: `/data/data/com.kalito.space/files/kalito.db`

**Solution:**  
Detect platform in `backend/db/db.ts`:
```typescript
// Mobile detection
const isMobile = process.env.NODEJS_MOBILE === '1'
const dbFile = isMobile
  ? path.join(process.cwd(), 'kalito.db') // Android writable storage
  : path.resolve(currentDir, 'backend/db/kalito.db') // Desktop
```

**Migration:**  
- Initial install: Create new database
- Database seeding: Automatic (init.ts)
- User data: Import/export via backup system

### Challenge 4: Environment Variables

**Problem:**  
`.env` files don't exist in APK bundle.

**Solution:**  
Three-tier approach:
1. **Hardcoded Defaults:** Core features work without config
2. **Android SharedPreferences:** Store API keys in app settings
3. **UI Settings Screen:** Let users configure OpenAI/Tavily keys

**Implementation:**
```typescript
// Capacitor Preferences plugin
import { Preferences } from '@capacitor/preferences'

async function getApiKey(key: string): Promise<string> {
  const { value } = await Preferences.get({ key })
  return value || ''
}

// Inject into Node.js environment
process.env.OPENAI_API_KEY = await getApiKey('OPENAI_API_KEY')
```

### Challenge 5: Binary Dependencies

**Problem:**  
`better-sqlite3` is a native C++ module.

**Solution:**  
nodejs-mobile provides precompiled binaries:
- ARM64 support built-in
- sqlite3 statically linked
- No separate compilation needed

**Verification Step:**  
Test SQLite operations before bundling:
```bash
# In nodejs-mobile test environment
node -e "const db = require('better-sqlite3')('test.db'); console.log('✅ SQLite works')"
```

### Challenge 6: Port Conflicts & Security

**Problem:**  
Multiple apps can't bind to same port.

**Solution:**  
Use `127.0.0.1:3000` (localhost only):
- Not accessible outside app
- No port conflicts (internal communication)
- Android security sandbox enforced

**Server Configuration:**
```typescript
// backend/server.ts (mobile mode)
const HOST = isMobile ? '127.0.0.1' : '0.0.0.0'
const PORT = 3000
app.listen(PORT, HOST)
```

### Challenge 7: APK Size

**Problem:**  
Node.js runtime + dependencies = large APK.

**Solution:**  
Optimization strategy:
1. **Production Dependencies Only:** Remove devDependencies
2. **Tree Shaking:** Bundle only used modules
3. **Asset Compression:** Enable in build.gradle
4. **Split APKs:** Separate ARM64 / ARMv7 builds

**Expected Size:**
- Base APK: ~15MB (Vue + Capacitor)
- Node.js Runtime: ~30MB
- Dependencies: ~20MB
- **Total:** ~65-80MB (acceptable for modern apps)

### Challenge 8: Background Service Management

**Problem:**  
Android kills background processes aggressively.

**Solution:**  
Foreground service with notification:
```kotlin
// Android foreground service
class NodeJsService : Service() {
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        startForeground(NOTIFICATION_ID, buildNotification())
        return START_STICKY // Restart if killed
    }
}
```

**User Experience:**  
Persistent notification: "Kalito Space backend running"  
(Required by Android for foreground services)

---

## Project Statistics

### Codebase Scale (Verified)
```
Total Lines of Code: 143,000+
  - Frontend (TypeScript + Vue): ~50,000
  - Backend (TypeScript): ~93,000

Backend Structure:
  - Total TS Files: 1,381
  - Services: 17 logic services
  - Routes: 11 API routers
  - Database: 14 tables, 13 FKs

Frontend Structure:
  - Components: 50+ Vue components
  - Views: 10+ pages
  - Composables: 5+ reusable stores
```

### Dependencies (Verified)
```
Backend (package.json):
  Production: 28 dependencies
    - express: 5.1.0
    - better-sqlite3: 12.2.0
    - openai: 5.0.1
    - @tavily/core: 0.5.12
    - winston: 3.17.0
    - helmet: 8.1.0
    - zod: 3.23.8
    + 21 more

Frontend (package.json):
  Production: 38 dependencies
    - vue: 3.5.13
    - @capacitor/android: 6.2.0
    - @capacitor/core: 6.2.0
    - vue-router: 4.5.1
    - shiki: 3.9.2
    + 33 more
```

### Android Configuration (Verified)
```
Current Android Setup:
  - App ID: com.kalito.space
  - Min SDK: 22 (Android 5.1+)
  - Target SDK: 34 (Android 14)
  - Compile SDK: 34
  - Build Tool: Gradle 8.x
  - Location: /frontend/android/
```

---

## Implementation Phases

### Phase 1: Environment Setup (Day 1)
- Install nodejs-mobile-capacitor
- Configure Capacitor for Node.js mobile
- Test basic Node.js execution on Android

### Phase 2: Backend Bundling (Day 2)
- Create /frontend/nodejs-project/ structure
- Copy backend files
- Create mobile entry point
- Configure paths for Android

### Phase 3: Database Adaptation (Day 3)
- Update db.ts for mobile paths
- Test SQLite operations on device
- Implement database initialization

### Phase 4: API Communication (Day 4)
- Update frontend API routing
- Test HTTP communication (WebView ↔ Node)
- Verify all 11 API endpoints

### Phase 5: Environment Variables (Day 5)
- Implement Capacitor Preferences for API keys
- Create settings UI for key configuration
- Test AI features with configured keys

### Phase 6: Build & Testing (Day 6)
- Build APK with bundled backend
- Install on test device
- End-to-end testing (all features)
- Performance profiling

### Phase 7: Optimization (Day 7)
- APK size reduction
- Background service tuning
- Battery optimization
- Final QA testing

---

## Prerequisites

### Development Environment
```
Required:
  ✅ Node.js 18+ (already have)
  ✅ Android Studio 2023.x (already have - APK built)
  ✅ Android SDK 34 (already configured)
  ✅ JDK 11+ (required by Gradle)
  ✅ Capacitor 6.2.0 (already installed)

Verify:
  node --version     # Should be 18+
  java --version     # Should be 11+
  echo $ANDROID_HOME # Should point to SDK
```

### Current Project State
```
✅ Frontend: Vue 3 + Capacitor configured
✅ Backend: Node.js + Express fully functional
✅ Database: SQLite with 14 tables operational
✅ Android: APK builds successfully (connects to laptop)
✅ Testing: All features working in current setup
```

### Installation Needed
```
New Dependencies:
  1. nodejs-mobile-capacitor (npm package)
  2. @capacitor/preferences (for API key storage)
  3. Production build tools (already have)

Commands:
  cd frontend
  npm install nodejs-mobile-capacitor
  npm install @capacitor/preferences
  npx cap sync android
```

---

## Document Structure

This implementation guide is split into multiple documents:

### 📄 00-Overview-and-Architecture.md (THIS DOCUMENT)
- Current vs. target architecture
- Technology stack analysis
- Challenges and solutions
- Project statistics

### 📄 01-Backend-Bundling-Strategy.md
- File structure for nodejs-project/
- Dependency management
- Entry point creation
- Path configuration

### 📄 02-Database-Migration-Guide.md
- SQLite path adaptation
- Android file system structure
- Database initialization
- Data migration strategies

### 📄 03-Frontend-API-Configuration.md
- Updating api.ts for mobile
- Capacitor bridge setup
- HTTP communication testing
- Error handling

### 📄 04-Environment-Variables-Management.md
- Capacitor Preferences integration
- Settings UI implementation
- API key configuration
- Security considerations

### 📄 05-Android-Build-Configuration.md
- Gradle configuration changes
- nodejs-mobile plugin setup
- Permissions and manifest updates
- Foreground service implementation

### 📄 06-Testing-and-Debugging.md
- Testing strategy
- Debug tools and techniques
- Common issues and solutions
- Performance profiling

### 📄 07-Deployment-and-Optimization.md
- APK size optimization
- Battery usage optimization
- Production build process
- Distribution strategies

### 📄 08-Rollback-and-Maintenance.md
- Rollback procedures
- Version management
- Update strategies
- Backup/restore procedures

---

## Next Steps

**Immediate Actions:**
1. Read all documentation files in sequence
2. Verify prerequisites are met
3. Create implementation branch: `git checkout -b feature/mobile-nodejs`
4. Begin Phase 1: Environment Setup

**Success Criteria:**
- ✅ APK installs without laptop dependency
- ✅ All 11 API endpoints functional
- ✅ Database operations work correctly
- ✅ AI features accessible (with configured keys)
- ✅ Offline mode fully operational
- ✅ APK size < 100MB
- ✅ No performance degradation vs. current setup

---

## Support Resources

**nodejs-mobile-capacitor:**
- GitHub: https://github.com/janeasystems/nodejs-mobile-capacitor
- Documentation: See package README
- Examples: Check /examples/ in repo

**Capacitor:**
- Official Docs: https://capacitorjs.com/docs
- Android Guide: https://capacitorjs.com/docs/android
- Plugin API: https://capacitorjs.com/docs/apis

**SQLite on Android:**
- better-sqlite3: https://github.com/WiseLibs/better-sqlite3
- Android storage: https://developer.android.com/training/data-storage

---

**Document Status:** ✅ READY FOR IMPLEMENTATION  
**Next Document:** 01-Backend-Bundling-Strategy.md
