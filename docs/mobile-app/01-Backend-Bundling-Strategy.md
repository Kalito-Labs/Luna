# Backend Bundling Strategy

**Document:** 01-Backend-Bundling-Strategy.md  
**Prerequisites:** 00-Overview-and-Architecture.md  
**Phase:** 2 - Backend Integration  
**Estimated Time:** 4-6 hours

---

## Table of Contents

1. [Objective](#objective)
2. [nodejs-project Directory Structure](#nodejs-project-directory-structure)
3. [File Copying Strategy](#file-copying-strategy)
4. [Dependency Management](#dependency-management)
5. [Mobile Entry Point](#mobile-entry-point)
6. [Path Configuration](#path-configuration)
7. [Build Script Automation](#build-script-automation)
8. [Verification Steps](#verification-steps)

---

## Objective

Create a `/frontend/nodejs-project/` directory that contains:
- Complete backend codebase (1,381 TypeScript files compiled)
- All production dependencies
- Mobile-specific entry point
- Android filesystem-compatible paths

This directory will be bundled into the APK's `assets/nodejs-project/` folder.

---

## nodejs-project Directory Structure

### Target Structure

```
frontend/
├── nodejs-project/              # ← NEW: Backend bundle for mobile
│   ├── main.js                 # ← Entry point (mobile-specific)
│   ├── server.js               # ← Compiled server.ts
│   ├── package.json            # ← Production dependencies only
│   ├── node_modules/           # ← Bundled dependencies
│   ├── db/
│   │   ├── db.js              # ← Compiled with mobile paths
│   │   ├── init.js            # ← Database initialization
│   │   └── kalito.db          # ← Initial database (optional seed)
│   ├── logic/
│   │   ├── agentService.js
│   │   ├── eldercareContextService.js
│   │   ├── memoryManager.js
│   │   ├── structuredAppointmentService.js
│   │   ├── structuredMedicationService.js
│   │   ├── queryRouter.js
│   │   ├── tavilyService.js
│   │   ├── modelRegistry.js
│   │   ├── tools.js
│   │   └── adapters/
│   │       ├── openai/
│   │       │   ├── adapters.js
│   │       │   ├── factory.js
│   │       │   ├── index.js
│   │       │   ├── models.js
│   │       │   └── types.js
│   │       └── ollama/
│   │           ├── adapters.js
│   │           ├── factory.js
│   │           └── index.js
│   ├── middleware/
│   │   ├── errorMiddleware.js
│   │   ├── security.js
│   │   └── validation.js
│   ├── routes/
│   │   ├── agentRouter.js
│   │   ├── sessionRouter.js
│   │   ├── personasRouter.js
│   │   ├── modelsRouter.js
│   │   ├── memoryRouter.js
│   │   ├── patientsRouter.js
│   │   ├── providersRouter.js
│   │   ├── medicationsRouter.js
│   │   ├── vitalsRouter.js
│   │   ├── appointmentsRouter.js
│   │   ├── caregiversRouter.js
│   │   └── searchRouter.js
│   ├── types/
│   │   ├── agent.js
│   │   ├── api.js
│   │   ├── caregiver.js
│   │   ├── memory.js
│   │   ├── messages.js
│   │   ├── models.js
│   │   ├── personas.js
│   │   ├── search.js
│   │   └── sessions.js
│   └── utils/
│       ├── apiContract.js
│       ├── logger.js
│       └── routerHelpers.js
│
├── src/                        # ← Existing Vue frontend
├── android/                    # ← Existing Android project
├── capacitor.config.ts
├── package.json
└── vite.config.ts
```

### Why This Structure?

1. **Flat Compilation:** TypeScript → JavaScript (no nested dist/)
2. **Android Asset Compatibility:** nodejs-mobile reads from assets/nodejs-project/
3. **Relative Imports Work:** Compiled .js files maintain relative paths
4. **Database Co-location:** kalito.db in same directory as code

---

## File Copying Strategy

### Step 1: Compile Backend TypeScript

```bash
# From project root
cd backend

# Compile TypeScript to JavaScript
npx tsc --project tsconfig.json

# This creates backend/dist/ with compiled .js files
```

**tsconfig.json Settings (Verify):**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",    // ← Required for Node.js
    "outDir": "dist",        // ← Output directory
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

### Step 2: Create nodejs-project Directory

```bash
# From project root
cd frontend

# Create base directory
mkdir -p nodejs-project

# Copy compiled JavaScript files
cp -r ../backend/dist/* nodejs-project/

# Copy package.json (we'll modify it next)
cp ../backend/package.json nodejs-project/
```

### Step 3: Clean Up Non-Production Files

```bash
cd nodejs-project

# Remove development/test files
rm -rf tests/
rm -rf scripts/
rm -f **/*.test.js
rm -f **/*.spec.js

# Remove TypeScript source maps (optional - reduces size)
rm -f **/*.js.map
```

### File Mapping (Verified Paths)

| Source (backend/)              | Destination (nodejs-project/) | Status |
|--------------------------------|-------------------------------|--------|
| dist/server.js                 | server.js                     | Copy   |
| dist/db/*.js                   | db/*.js                       | Copy   |
| dist/logic/**/*.js             | logic/**/*.js                 | Copy   |
| dist/middleware/*.js           | middleware/*.js               | Copy   |
| dist/routes/*.js               | routes/*.js                   | Copy   |
| dist/types/*.js                | types/*.js                    | Copy   |
| dist/utils/*.js                | utils/*.js                    | Copy   |
| package.json                   | package.json (modified)       | Copy + Edit |
| db/kalito.db                   | db/kalito.db (optional)       | Copy or Skip |

---

## Dependency Management

### Problem: Backend has devDependencies

Current `backend/package.json`:
```json
{
  "dependencies": {
    "@anthropic-ai/sdk": "^0.58.0",
    "@tavily/core": "^0.5.12",
    "better-sqlite3": "^12.2.0",
    "cors": "^2.8.5",
    "dotenv": "^16.5.0",
    "express": "^5.1.0",
    "express-rate-limit": "^8.0.1",
    "helmet": "^8.1.0",
    "openai": "^5.0.1",
    "undici": "^7.13.0",
    "winston": "^3.17.0",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.13",
    "@types/cors": "^2.8.18",
    "@types/express": "^4.17.23",
    "@types/node": "^20.19.11",
    "nodemon": "^3.0.2",
    "ts-node": "^10.9.1",
    "tsconfig-paths": "^4.2.0",
    "typescript": "^5.0.0"
  }
}
```

### Solution: Production-Only package.json

**Create `frontend/nodejs-project/package.json`:**

```json
{
  "name": "kalito-backend-mobile",
  "version": "1.0.0",
  "main": "main.js",
  "scripts": {
    "start": "node main.js"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.58.0",
    "@tavily/core": "^0.5.12",
    "better-sqlite3": "^12.2.0",
    "cors": "^2.8.5",
    "dotenv": "^16.5.0",
    "express": "^5.1.0",
    "express-rate-limit": "^8.0.1",
    "helmet": "^8.1.0",
    "openai": "^5.0.1",
    "undici": "^7.13.0",
    "winston": "^3.17.0",
    "zod": "^3.23.8"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

**Key Changes:**
- ✅ Removed all devDependencies
- ✅ Changed main entry point to `main.js` (not `dist/server.js`)
- ✅ Simplified scripts (only `start`)
- ✅ Added Node.js version requirement

### Install Production Dependencies

```bash
cd frontend/nodejs-project

# Install ONLY production dependencies
npm install --production

# This creates node_modules/ with runtime packages only
```

**Expected node_modules Size:**
- Without devDependencies: ~20-30MB
- With all dependencies: ~50-60MB (avoid this)

### Critical Binary: better-sqlite3

**Problem:** Native C++ addon, platform-specific.

**Solution:**  
nodejs-mobile-capacitor handles this automatically:
1. Detects `better-sqlite3` in dependencies
2. Uses precompiled ARM64 binaries
3. Links against bundled SQLite3

**Verification (After APK Build):**
```bash
# Check if better-sqlite3 binary exists
unzip -l app-debug.apk | grep better_sqlite3.node
# Should show: assets/nodejs-project/node_modules/better-sqlite3/build/Release/better_sqlite3.node
```

---

## Mobile Entry Point

### Why a Separate Entry Point?

Current `backend/server.ts`:
- Loads `.env` from `../.env`
- Binds to `0.0.0.0:3000` (external access)
- Uses filesystem paths like `backend/db/kalito.db`

Mobile needs:
- No `.env` file (use hardcoded defaults or Capacitor Preferences)
- Bind to `127.0.0.1:3000` (internal only)
- Android filesystem paths

### Create `frontend/nodejs-project/main.js`

```javascript
/**
 * main.js
 * Mobile-specific entry point for Kalito Space backend
 * Runs on Android via nodejs-mobile-capacitor
 */

// Detect mobile environment
const IS_MOBILE = process.env.NODEJS_MOBILE === '1' || process.env.PLATFORM === 'android'

// Log startup
console.log('[Kalito Mobile] Starting backend...')
console.log('[Kalito Mobile] Platform:', IS_MOBILE ? 'Android' : 'Desktop')
console.log('[Kalito Mobile] Node version:', process.version)
console.log('[Kalito Mobile] Working directory:', process.cwd())

// Set environment variables with mobile defaults
process.env.NODE_ENV = process.env.NODE_ENV || 'production'
process.env.PORT = '3000'
process.env.HOST = '127.0.0.1' // Internal only
process.env.TRUST_PROXY = '0'  // No proxy on mobile

// Database path (Android writable directory)
// process.cwd() on Android = /data/data/com.kalito.space/files/
process.env.DB_PATH = IS_MOBILE 
  ? 'kalito.db'  // Stored in app files directory
  : './db/kalito.db'

// Log environment
console.log('[Kalito Mobile] Environment:', process.env.NODE_ENV)
console.log('[Kalito Mobile] Database path:', process.env.DB_PATH)
console.log('[Kalito Mobile] Server will bind to:', process.env.HOST + ':' + process.env.PORT)

// Optional: Load API keys from Capacitor (if provided by frontend)
// These would be injected via nodejs-mobile channel before server starts
if (process.env.OPENAI_API_KEY) {
  console.log('[Kalito Mobile] OpenAI API key configured ✓')
}
if (process.env.TAVILY_API_KEY) {
  console.log('[Kalito Mobile] Tavily API key configured ✓')
}

// Import and start the Express server
require('./server')

console.log('[Kalito Mobile] Backend startup complete')
```

### Key Features of main.js

1. **Platform Detection:**
   ```javascript
   const IS_MOBILE = process.env.NODEJS_MOBILE === '1'
   ```
   nodejs-mobile sets this automatically.

2. **Mobile-Specific Paths:**
   ```javascript
   process.env.DB_PATH = 'kalito.db' // Relative to cwd()
   ```
   On Android: `/data/data/com.kalito.space/files/kalito.db`

3. **Localhost Binding:**
   ```javascript
   process.env.HOST = '127.0.0.1'
   ```
   Prevents external access, Android security compliant.

4. **Environment Defaults:**
   ```javascript
   process.env.NODE_ENV = 'production'
   ```
   Optimizes performance, disables development features.

---

## Path Configuration

### Update `nodejs-project/db/db.js`

**Current Code (backend/db/db.ts):**
```typescript
const currentDir = process.cwd()
const isInBackendDir = currentDir.endsWith('/backend')
const dbFile = isInBackendDir 
  ? path.resolve(currentDir, 'db/kalito.db')
  : path.resolve(currentDir, 'backend/db/kalito.db')
```

**Mobile-Compatible Version:**

After compilation to JavaScript, modify `nodejs-project/db/db.js`:

```javascript
const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')

// Platform detection
const IS_MOBILE = process.env.NODEJS_MOBILE === '1' || process.env.PLATFORM === 'android'

// Database path logic
let dbFile

if (IS_MOBILE) {
  // Mobile: Use writable app directory
  // process.cwd() = /data/data/com.kalito.space/files/
  dbFile = path.join(process.cwd(), 'kalito.db')
  console.log('[Database] Mobile mode - using app storage:', dbFile)
} else {
  // Desktop: Original logic
  const currentDir = process.cwd()
  const isInBackendDir = currentDir.endsWith('/backend')
  dbFile = isInBackendDir 
    ? path.resolve(currentDir, 'db/kalito.db')
    : path.resolve(currentDir, 'backend/db/kalito.db')
  console.log('[Database] Desktop mode:', dbFile)
}

// Ensure directory exists (mobile may need creation)
const dbDir = path.dirname(dbFile)
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
  console.log('[Database] Created directory:', dbDir)
}

// Create database connection
const db = (() => {
  try {
    const database = new Database(dbFile)
    
    // Enable foreign key constraints
    database.pragma('foreign_keys = ON')
    
    // Performance optimizations
    database.pragma('journal_mode = WAL')
    database.pragma('synchronous = NORMAL')
    database.pragma('cache_size = 1000')
    database.pragma('temp_store = MEMORY')
    
    console.log('[Database] Connected successfully:', dbFile)
    return database
  } catch (error) {
    console.error('[Database] Connection failed:', error.message)
    throw error
  }
})()

module.exports = { db }
```

**Changes Made:**
1. ✅ Mobile detection via `NODEJS_MOBILE` env var
2. ✅ Android path: `${process.cwd()}/kalito.db`
3. ✅ Desktop backward compatibility maintained
4. ✅ Automatic directory creation
5. ✅ Enhanced logging for debugging

### Update `nodejs-project/db/init.js`

Database initialization remains mostly unchanged, but add mobile detection:

```javascript
// At top of init.js
const IS_MOBILE = process.env.NODEJS_MOBILE === '1'

console.log('[DB Init] Platform:', IS_MOBILE ? 'Mobile' : 'Desktop')
console.log('[DB Init] Database file:', dbPath)

// Rest of init.js stays the same - creates 14 tables, seeds personas, etc.
```

### Update Server Binding in `nodejs-project/server.js`

After TypeScript compilation, the server.js will have:

```javascript
const PORT = Number(process.env.PORT) || 3000
const HOST = process.env.HOST || '0.0.0.0'
```

This is already correct! Environment variables set in `main.js` will be used:
- `process.env.HOST = '127.0.0.1'` (mobile)
- `process.env.PORT = '3000'`

No manual modification needed if `main.js` sets them correctly.

---

## Build Script Automation

### Create `frontend/scripts/bundle-backend.sh`

```bash
#!/bin/bash
# bundle-backend.sh
# Automates backend bundling for mobile deployment

set -e  # Exit on error

echo "🔧 Starting backend bundle process..."

# Step 1: Compile backend TypeScript
echo "📦 Step 1/6: Compiling backend TypeScript..."
cd ../backend
npx tsc
echo "✅ TypeScript compilation complete"

# Step 2: Create nodejs-project directory
echo "📦 Step 2/6: Creating nodejs-project directory..."
cd ../frontend
rm -rf nodejs-project
mkdir -p nodejs-project
echo "✅ Directory created"

# Step 3: Copy compiled files
echo "📦 Step 3/6: Copying compiled backend files..."
cp -r ../backend/dist/* nodejs-project/
echo "✅ Files copied"

# Step 4: Clean up non-production files
echo "📦 Step 4/6: Cleaning up development files..."
cd nodejs-project
rm -rf tests/ scripts/
find . -name "*.test.js" -delete
find . -name "*.spec.js" -delete
find . -name "*.js.map" -delete  # Optional: remove source maps
echo "✅ Cleanup complete"

# Step 5: Create production package.json
echo "📦 Step 5/6: Creating production package.json..."
cat > package.json << 'EOF'
{
  "name": "kalito-backend-mobile",
  "version": "1.0.0",
  "main": "main.js",
  "scripts": {
    "start": "node main.js"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.58.0",
    "@tavily/core": "^0.5.12",
    "better-sqlite3": "^12.2.0",
    "cors": "^2.8.5",
    "dotenv": "^16.5.0",
    "express": "^5.1.0",
    "express-rate-limit": "^8.0.1",
    "helmet": "^8.1.0",
    "openai": "^5.0.1",
    "undici": "^7.13.0",
    "winston": "^3.17.0",
    "zod": "^3.23.8"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
EOF
echo "✅ package.json created"

# Step 6: Install production dependencies
echo "📦 Step 6/6: Installing production dependencies..."
npm install --production --quiet
echo "✅ Dependencies installed"

# Summary
echo ""
echo "🎉 Backend bundle complete!"
echo "📁 Location: frontend/nodejs-project/"
echo "📊 Statistics:"
echo "   - JS files: $(find . -name "*.js" | wc -l)"
echo "   - node_modules size: $(du -sh node_modules 2>/dev/null | cut -f1)"
echo "   - Total size: $(du -sh . | cut -f1)"
echo ""
echo "Next steps:"
echo "  1. Create main.js entry point"
echo "  2. Update db/db.js for mobile paths"
echo "  3. Run: npx cap sync android"
```

### Make Script Executable

```bash
chmod +x frontend/scripts/bundle-backend.sh
```

### Run Bundle Script

```bash
cd frontend
./scripts/bundle-backend.sh
```

**Expected Output:**
```
🔧 Starting backend bundle process...
📦 Step 1/6: Compiling backend TypeScript...
✅ TypeScript compilation complete
📦 Step 2/6: Creating nodejs-project directory...
✅ Directory created
📦 Step 3/6: Copying compiled backend files...
✅ Files copied
📦 Step 4/6: Cleaning up development files...
✅ Cleanup complete
📦 Step 5/6: Creating production package.json...
✅ package.json created
📦 Step 6/6: Installing production dependencies...
✅ Dependencies installed

🎉 Backend bundle complete!
📁 Location: frontend/nodejs-project/
📊 Statistics:
   - JS files: 1381
   - node_modules size: 28M
   - Total size: 35M
```

---

## Verification Steps

### 1. Verify Directory Structure

```bash
cd frontend/nodejs-project

# Check main files exist
ls -la main.js server.js package.json

# Check all subdirectories
ls -la db/ logic/ middleware/ routes/ types/ utils/

# Check node_modules
ls node_modules/ | head -10
```

**Expected:**
```
✓ main.js (created manually)
✓ server.js (compiled from backend/server.ts)
✓ package.json (production-only)
✓ node_modules/ (12 packages)
✓ db/db.js, db/init.js
✓ logic/ (17 service files)
✓ routes/ (11 router files)
```

### 2. Test Node.js Execution (Desktop)

```bash
cd frontend/nodejs-project

# Set mobile environment variable for testing
export NODEJS_MOBILE=1

# Test main.js startup
node main.js
```

**Expected Output:**
```
[Kalito Mobile] Starting backend...
[Kalito Mobile] Platform: Android
[Kalito Mobile] Node version: v18.x.x
[Kalito Mobile] Working directory: /path/to/frontend/nodejs-project
[Kalito Mobile] Environment: production
[Kalito Mobile] Database path: kalito.db
[Kalito Mobile] Server will bind to: 127.0.0.1:3000
[Database] Mobile mode - using app storage: /path/to/nodejs-project/kalito.db
[Database] Connected successfully
✅ Database initialized at: kalito.db
Server started successfully
```

### 3. Test API Endpoint

```bash
# In another terminal
curl http://127.0.0.1:3000/api/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "time": "2025-11-09T...",
  "environment": "production",
  "version": "dev"
}
```

### 4. Verify SQLite Database

```bash
# Check database was created
ls -lh kalito.db

# Inspect tables
sqlite3 kalito.db ".tables"
```

**Expected:**
```
kalito.db (150K)

Tables:
appointments
caregiver_time_logs
caregivers
conversation_summaries
healthcare_providers
medication_adherence_logs
medications
medical_records
messages
patients
personas
semantic_pins
sessions
vitals
```

### 5. Check Bundle Size

```bash
cd frontend
du -sh nodejs-project/
```

**Target Size:**
- < 50MB: Excellent (production dependencies only)
- 50-80MB: Good (acceptable for mobile)
- > 80MB: Review dependencies, remove unused packages

### 6. Verify File Counts

```bash
cd nodejs-project

# JavaScript files
find . -name "*.js" | wc -l
# Expected: ~1381 (matches backend TS file count)

# node_modules count
ls node_modules/ | wc -l
# Expected: ~12 direct dependencies
```

---

## Troubleshooting

### Issue: "Cannot find module 'express'"

**Cause:** node_modules not installed or incomplete.

**Fix:**
```bash
cd frontend/nodejs-project
rm -rf node_modules package-lock.json
npm install --production
```

### Issue: "Database locked" Error

**Cause:** Multiple processes accessing kalito.db.

**Fix:**
```bash
# Close all Node processes
pkill -f "node main.js"

# Remove lock files
rm kalito.db-shm kalito.db-wal

# Restart
node main.js
```

### Issue: TypeScript Compilation Errors

**Cause:** Backend code has type errors.

**Fix:**
```bash
cd backend

# Check for errors
npx tsc --noEmit

# Fix errors in source files, then recompile
npx tsc
```

### Issue: better-sqlite3 Binary Missing

**Cause:** Platform-specific binary not built.

**Fix:**
```bash
cd frontend/nodejs-project

# Rebuild native modules for current platform
npm rebuild better-sqlite3

# Verify binary exists
ls node_modules/better-sqlite3/build/Release/
```

**Note:** On mobile, nodejs-mobile handles this automatically. Desktop testing may need manual rebuild.

---

## Next Steps

Once backend bundling is complete and verified:

1. ✅ **Bundled Backend:** nodejs-project/ directory ready
2. ✅ **Dependencies Installed:** Production packages only
3. ✅ **Entry Point Created:** main.js with mobile detection
4. ✅ **Paths Configured:** db.js uses Android filesystem

**Proceed to:** 📄 02-Database-Migration-Guide.md

---

**Document Status:** ✅ COMPLETE  
**Next Document:** 02-Database-Migration-Guide.md
