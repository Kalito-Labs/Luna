# Database Migration Guide

**Document:** 02-Database-Migration-Guide.md  
**Prerequisites:** 01-Backend-Bundling-Strategy.md  
**Phase:** 3 - Database Adaptation  
**Estimated Time:** 3-4 hours

---

## Table of Contents

1. [Objective](#objective)
2. [Android File System Overview](#android-file-system-overview)
3. [Database Path Strategy](#database-path-strategy)
4. [Initial Database Setup](#initial-database-setup)
5. [Data Migration Options](#data-migration-options)
6. [Backup & Restore](#backup--restore)
7. [Testing Database Operations](#testing-database-operations)

---

## Objective

Adapt SQLite database (`kalito.db`) to work on Android's file system:
- Use Android app private storage (`/data/data/com.kalito.space/files/`)
- Maintain all 14 tables and foreign key relationships
- Support initial database creation and seeding
- Enable data import/export for user migrations

---

## Android File System Overview

### Android Storage Locations

Android apps have several storage options:

| Location | Path | Permissions | Use Case |
|----------|------|-------------|----------|
| **App Private (Internal)** | `/data/data/com.kalito.space/files/` | App-only | ✅ **USE THIS** |
| App Cache | `/data/data/com.kalito.space/cache/` | App-only, volatile | Temp files |
| External Storage | `/sdcard/Android/data/com.kalito.space/` | User accessible | Backups |
| Public Storage | `/sdcard/` | All apps | ❌ Security risk |

### Why App Private Storage?

**Security:**
- Only Kalito app can access
- Encrypted on device (if device encrypted)
- Deleted when app uninstalled

**Reliability:**
- Always available (no SD card required)
- Fast I/O (internal NAND flash)
- No permission prompts needed

**nodejs-mobile Access:**
- `process.cwd()` returns `/data/data/com.kalito.space/files/`
- Full read/write access
- No special permissions required

---

## Database Path Strategy

### Platform Detection Logic

**File:** `nodejs-project/db/db.js` (already modified in Phase 2)

```javascript
const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')

// Platform detection
const IS_MOBILE = process.env.NODEJS_MOBILE === '1' || process.env.PLATFORM === 'android'

// Database path resolution
let dbFile

if (IS_MOBILE) {
  // Android: App private storage
  // process.cwd() = /data/data/com.kalito.space/files/
  dbFile = path.join(process.cwd(), 'kalito.db')
  
  console.log('[Database] Mobile platform detected')
  console.log('[Database] Using app private storage:', dbFile)
} else {
  // Desktop/Development: Original logic
  const currentDir = process.cwd()
  const isInBackendDir = currentDir.endsWith('/backend')
  
  dbFile = isInBackendDir 
    ? path.resolve(currentDir, 'db/kalito.db')
    : path.resolve(currentDir, 'backend/db/kalito.db')
  
  console.log('[Database] Desktop platform detected')
  console.log('[Database] Using project directory:', dbFile)
}

// Ensure parent directory exists (critical on mobile)
const dbDir = path.dirname(dbFile)
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
  console.log('[Database] Created database directory:', dbDir)
}

// Check if database file exists
const isNewDatabase = !fs.existsSync(dbFile)
if (isNewDatabase) {
  console.log('[Database] Database file does not exist, will be created')
} else {
  const stats = fs.statSync(dbFile)
  console.log('[Database] Existing database found, size:', Math.round(stats.size / 1024), 'KB')
}

// Create database connection
const db = (() => {
  try {
    const database = new Database(dbFile)
    
    // Enable foreign key constraints (critical for data integrity)
    database.pragma('foreign_keys = ON')
    
    // Performance optimizations
    database.pragma('journal_mode = WAL')      // Write-Ahead Logging
    database.pragma('synchronous = NORMAL')    // Balance durability vs performance
    database.pragma('cache_size = 1000')       // 1000 pages (~4MB cache)
    database.pragma('temp_store = MEMORY')     // Temp tables in RAM
    
    // Mobile-specific optimizations
    if (IS_MOBILE) {
      database.pragma('mmap_size = 30000000')  // 30MB memory-mapped I/O
      database.pragma('page_size = 4096')      // Match Android filesystem
    }
    
    console.log('[Database] Connection established successfully')
    console.log('[Database] SQLite version:', database.prepare('SELECT sqlite_version()').pluck().get())
    
    return database
  } catch (error) {
    console.error('[Database] FATAL: Connection failed')
    console.error('[Database] Error:', error.message)
    console.error('[Database] Stack:', error.stack)
    
    // On mobile, crash is appropriate - database is critical
    if (IS_MOBILE) {
      process.exit(1)
    }
    throw error
  }
})()

// Log connection success with database info
console.log('[Database] Configuration:')
console.log('  - Foreign Keys:', database.pragma('foreign_keys', { simple: true }))
console.log('  - Journal Mode:', database.pragma('journal_mode', { simple: true }))
console.log('  - Page Size:', database.pragma('page_size', { simple: true }), 'bytes')
console.log('  - Cache Size:', database.pragma('cache_size', { simple: true }), 'pages')

module.exports = { db }
```

### Key Features

1. **Automatic Platform Detection:**
   ```javascript
   const IS_MOBILE = process.env.NODEJS_MOBILE === '1'
   ```
   Set by nodejs-mobile runtime automatically.

2. **Android Path:**
   ```javascript
   dbFile = path.join(process.cwd(), 'kalito.db')
   // Result: /data/data/com.kalito.space/files/kalito.db
   ```

3. **Directory Creation:**
   ```javascript
   if (!fs.existsSync(dbDir)) {
     fs.mkdirSync(dbDir, { recursive: true })
   }
   ```
   Critical for first launch on Android.

4. **Mobile Optimizations:**
   ```javascript
   database.pragma('mmap_size = 30000000')  // Memory-mapped I/O
   database.pragma('page_size = 4096')      // Android filesystem alignment
   ```

---

## Initial Database Setup

### Scenario 1: Fresh Install (No Existing Data)

**Flow:**
1. App installed on Android device
2. First launch: `kalito.db` doesn't exist
3. `db/init.js` runs automatically
4. Creates 14 tables + foreign keys + indexes
5. Seeds default personas (2 personas)
6. Database ready for use

**File:** `nodejs-project/db/init.js` (no modifications needed)

The existing `init.ts` (compiled to `init.js`) already handles:
- ✅ Table creation with IF NOT EXISTS
- ✅ Foreign key setup
- ✅ Index creation
- ✅ Default persona seeding
- ✅ Migration handling

**Verification:**
```javascript
// At end of init.js
console.log('[DB Init] Setup complete:')
console.log('  - Tables created: 14')
console.log('  - Foreign keys: 13')
console.log('  - Indexes: 11+')
console.log('  - Default personas: 2')
console.log('  - Database ready for use ✓')
```

### Scenario 2: Migrating from Laptop Database

**User Story:**  
"I've been using Kalito on my laptop. Now I want to move all my data to the Android app."

**Solution: Export → Import Flow**

#### Step 1: Create Database Export API

**Add to `nodejs-project/routes/patientsRouter.js`:**

```javascript
// Export entire database as JSON
router.get('/export-all', (req, res) => {
  try {
    console.log('[Export] Starting full database export...')
    
    const data = {
      version: '1.0',
      exported_at: new Date().toISOString(),
      patients: db.prepare('SELECT * FROM patients').all(),
      medications: db.prepare('SELECT * FROM medications').all(),
      medication_logs: db.prepare('SELECT * FROM medication_adherence_logs').all(),
      appointments: db.prepare('SELECT * FROM appointments').all(),
      vitals: db.prepare('SELECT * FROM vitals').all(),
      medical_records: db.prepare('SELECT * FROM medical_records').all(),
      providers: db.prepare('SELECT * FROM healthcare_providers').all(),
      caregivers: db.prepare('SELECT * FROM caregivers').all(),
      caregiver_logs: db.prepare('SELECT * FROM caregiver_time_logs').all(),
      sessions: db.prepare('SELECT * FROM sessions').all(),
      messages: db.prepare('SELECT * FROM messages').all(),
      personas: db.prepare('SELECT * FROM personas WHERE is_default = 0').all(), // User-created only
      summaries: db.prepare('SELECT * FROM conversation_summaries').all(),
      pins: db.prepare('SELECT * FROM semantic_pins').all()
    }
    
    console.log('[Export] Exported:')
    console.log('  - Patients:', data.patients.length)
    console.log('  - Medications:', data.medications.length)
    console.log('  - Appointments:', data.appointments.length)
    console.log('  - Sessions:', data.sessions.length)
    console.log('  - Messages:', data.messages.length)
    
    res.json(data)
  } catch (error) {
    console.error('[Export] Error:', error)
    res.status(500).json({ error: 'Export failed', message: error.message })
  }
})

// Import database from JSON
router.post('/import-all', (req, res) => {
  try {
    const data = req.body
    
    console.log('[Import] Starting full database import...')
    console.log('[Import] Import version:', data.version)
    console.log('[Import] Exported at:', data.exported_at)
    
    // Wrap in transaction for atomicity
    const importTransaction = db.transaction(() => {
      // Clear existing data (except default personas)
      db.prepare('DELETE FROM medication_adherence_logs').run()
      db.prepare('DELETE FROM medications').run()
      db.prepare('DELETE FROM appointments').run()
      db.prepare('DELETE FROM vitals').run()
      db.prepare('DELETE FROM medical_records').run()
      db.prepare('DELETE FROM caregiver_time_logs').run()
      db.prepare('DELETE FROM caregivers').run()
      db.prepare('DELETE FROM healthcare_providers').run()
      db.prepare('DELETE FROM patients').run()
      db.prepare('DELETE FROM semantic_pins').run()
      db.prepare('DELETE FROM conversation_summaries').run()
      db.prepare('DELETE FROM messages').run()
      db.prepare('DELETE FROM sessions').run()
      db.prepare('DELETE FROM personas WHERE is_default = 0').run()
      
      // Import patients first (referenced by other tables)
      const patientInsert = db.prepare(`
        INSERT INTO patients VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      data.patients.forEach(p => patientInsert.run(Object.values(p)))
      
      // Import providers (referenced by appointments, medical_records)
      const providerInsert = db.prepare(`
        INSERT INTO healthcare_providers VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      data.providers.forEach(p => providerInsert.run(Object.values(p)))
      
      // Import medications (referenced by logs)
      const medicationInsert = db.prepare(`
        INSERT INTO medications VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      data.medications.forEach(m => medicationInsert.run(Object.values(m)))
      
      // Import medication logs
      const logInsert = db.prepare(`
        INSERT INTO medication_adherence_logs VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `)
      data.medication_logs.forEach(l => logInsert.run(Object.values(l)))
      
      // Import appointments, vitals, medical_records, caregivers, etc.
      // (Similar pattern for each table)
      
      // Import chat data
      const sessionInsert = db.prepare(`
        INSERT INTO sessions VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `)
      data.sessions.forEach(s => sessionInsert.run(Object.values(s)))
      
      const messageInsert = db.prepare(`
        INSERT INTO messages VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `)
      data.messages.forEach(m => messageInsert.run(Object.values(m)))
      
      // Import user personas
      const personaInsert = db.prepare(`
        INSERT INTO personas VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      data.personas.forEach(p => personaInsert.run(Object.values(p)))
    })
    
    // Execute transaction
    importTransaction()
    
    console.log('[Import] Import successful!')
    res.json({ success: true, message: 'Database imported successfully' })
    
  } catch (error) {
    console.error('[Import] Error:', error)
    res.status(500).json({ error: 'Import failed', message: error.message })
  }
})
```

#### Step 2: Frontend Export UI

**Add to FamilyHub.vue:**

```vue
<template>
  <div class="database-tools">
    <button @click="exportDatabase">📦 Export All Data</button>
    <button @click="importDatabase">📥 Import Data</button>
  </div>
</template>

<script setup lang="ts">
async function exportDatabase() {
  try {
    const response = await fetch(apiUrl('/api/patients/export-all'))
    const data = await response.json()
    
    // Download as JSON file
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `kalito-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    
    alert('✅ Database exported successfully!')
  } catch (error) {
    alert('❌ Export failed: ' + error.message)
  }
}

async function importDatabase() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return
    
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      
      const confirmed = confirm(
        '⚠️ This will replace ALL current data. Continue?'
      )
      if (!confirmed) return
      
      const response = await fetch(apiUrl('/api/patients/import-all'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      if (!response.ok) throw new Error('Import failed')
      
      alert('✅ Database imported successfully! Please refresh the app.')
      location.reload()
      
    } catch (error) {
      alert('❌ Import failed: ' + error.message)
    }
  }
  
  input.click()
}
</script>
```

#### Step 3: Migration Workflow

**User Steps:**
1. On laptop (desktop app):
   - Open Eldercare Dashboard
   - Click "📦 Export All Data"
   - Save `kalito-backup-2025-11-09.json` to Downloads

2. Transfer file to Android:
   - Email to self / Google Drive / USB transfer
   - Download on Android device

3. On Android app:
   - Open Eldercare Dashboard
   - Click "📥 Import Data"
   - Select downloaded JSON file
   - Confirm replacement
   - App refreshes with all data

**Data Preserved:**
- ✅ All 2 patients (Aurora, Basilio)
- ✅ All 16 medications
- ✅ All appointments and vitals
- ✅ All chat sessions and messages
- ✅ All custom personas

---

## Backup & Restore

### Automatic Backup Strategy

**File:** `nodejs-project/utils/databaseBackup.js` (create new)

```javascript
const fs = require('fs')
const path = require('path')
const { db } = require('../db/db')

const IS_MOBILE = process.env.NODEJS_MOBILE === '1'

/**
 * Create database backup
 * On Android: Saves to external storage (if available) or app cache
 */
function createBackup() {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupName = `kalito-backup-${timestamp}.db`
    
    let backupPath
    if (IS_MOBILE) {
      // Android: Try external storage first, fallback to cache
      const externalPath = path.join('/sdcard/Android/data/com.kalito.space/files/', backupName)
      const cachePath = path.join(process.cwd(), '../cache/', backupName)
      
      // Check if external storage is available
      const externalDir = path.dirname(externalPath)
      if (fs.existsSync(externalDir)) {
        backupPath = externalPath
      } else {
        backupPath = cachePath
        fs.mkdirSync(path.dirname(backupPath), { recursive: true })
      }
    } else {
      // Desktop: project backups/ directory
      backupPath = path.join(process.cwd(), '../backups/', backupName)
      fs.mkdirSync(path.dirname(backupPath), { recursive: true })
    }
    
    // Use SQLite backup API (safer than file copy)
    db.backup(backupPath)
    
    const stats = fs.statSync(backupPath)
    console.log('[Backup] Created successfully:', backupPath)
    console.log('[Backup] Size:', Math.round(stats.size / 1024), 'KB')
    
    return { success: true, path: backupPath, size: stats.size }
    
  } catch (error) {
    console.error('[Backup] Failed:', error.message)
    return { success: false, error: error.message }
  }
}

/**
 * Restore database from backup
 */
function restoreBackup(backupPath) {
  try {
    if (!fs.existsSync(backupPath)) {
      throw new Error('Backup file not found: ' + backupPath)
    }
    
    // Close current database connection
    db.close()
    
    // Copy backup to active database location
    const currentDbPath = IS_MOBILE 
      ? path.join(process.cwd(), 'kalito.db')
      : path.join(process.cwd(), 'backend/db/kalito.db')
    
    fs.copyFileSync(backupPath, currentDbPath)
    
    console.log('[Restore] Database restored from:', backupPath)
    console.log('[Restore] Please restart the application')
    
    return { success: true, message: 'Database restored successfully' }
    
  } catch (error) {
    console.error('[Restore] Failed:', error.message)
    return { success: false, error: error.message }
  }
}

/**
 * List available backups
 */
function listBackups() {
  try {
    let backupDir
    if (IS_MOBILE) {
      const externalDir = '/sdcard/Android/data/com.kalito.space/files/'
      const cacheDir = path.join(process.cwd(), '../cache/')
      backupDir = fs.existsSync(externalDir) ? externalDir : cacheDir
    } else {
      backupDir = path.join(process.cwd(), '../backups/')
    }
    
    if (!fs.existsSync(backupDir)) {
      return []
    }
    
    const files = fs.readdirSync(backupDir)
      .filter(f => f.startsWith('kalito-backup-') && f.endsWith('.db'))
      .map(f => {
        const filepath = path.join(backupDir, f)
        const stats = fs.statSync(filepath)
        return {
          name: f,
          path: filepath,
          size: stats.size,
          created: stats.mtime
        }
      })
      .sort((a, b) => b.created - a.created) // Newest first
    
    return files
    
  } catch (error) {
    console.error('[Backup] List failed:', error.message)
    return []
  }
}

module.exports = {
  createBackup,
  restoreBackup,
  listBackups
}
```

### Backup API Endpoints

**Add to `nodejs-project/routes/patientsRouter.js`:**

```javascript
const { createBackup, restoreBackup, listBackups } = require('../utils/databaseBackup')

// Create database backup
router.post('/backup', (req, res) => {
  const result = createBackup()
  if (result.success) {
    res.json({ success: true, backup: result })
  } else {
    res.status(500).json({ success: false, error: result.error })
  }
})

// List available backups
router.get('/backups', (req, res) => {
  const backups = listBackups()
  res.json({ backups })
})

// Restore from backup
router.post('/restore', (req, res) => {
  const { backupPath } = req.body
  const result = restoreBackup(backupPath)
  if (result.success) {
    res.json(result)
  } else {
    res.status(500).json(result)
  }
})
```

### Scheduled Backups (Optional)

**Add to `nodejs-project/main.js`:**

```javascript
const { createBackup } = require('./utils/databaseBackup')

// Schedule daily backups at 3 AM
const BACKUP_INTERVAL = 24 * 60 * 60 * 1000 // 24 hours
setInterval(() => {
  const now = new Date()
  if (now.getHours() === 3) { // 3 AM
    console.log('[Backup] Running scheduled backup...')
    createBackup()
  }
}, 60 * 60 * 1000) // Check hourly
```

---

## Testing Database Operations

### Test 1: Database Creation on First Launch

**Simulate fresh install:**

```bash
cd frontend/nodejs-project

# Remove existing database
rm kalito.db kalito.db-shm kalito.db-wal

# Set mobile environment
export NODEJS_MOBILE=1

# Start server
node main.js
```

**Expected Output:**
```
[Database] Mobile platform detected
[Database] Database file does not exist, will be created
[Database] Connection established successfully
[Database] SQLite version: 3.45.0
[DB Init] Creating tables...
[DB Init] Creating foreign keys...
[DB Init] Creating indexes...
[DB Init] Seeding default personas...
[DB Init] Setup complete:
  - Tables created: 14
  - Foreign keys: 13
  - Indexes: 11+
  - Default personas: 2
  - Database ready for use ✓
Server started successfully
```

**Verify:**
```bash
sqlite3 kalito.db ".tables"
# Should show all 14 tables

sqlite3 kalito.db "SELECT COUNT(*) FROM personas"
# Should show: 2 (default personas)
```

### Test 2: CRUD Operations

**Test patient creation:**

```bash
curl -X POST http://127.0.0.1:3000/api/patients \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Patient",
    "date_of_birth": "1950-01-01",
    "relationship": "parent",
    "gender": "male"
  }'
```

**Expected:**
```json
{
  "success": true,
  "patient": {
    "id": "1234567890-abc123",
    "name": "Test Patient",
    ...
  }
}
```

**Verify in database:**
```bash
sqlite3 kalito.db "SELECT * FROM patients WHERE name='Test Patient'"
```

### Test 3: Foreign Key Constraints

**Test cascade delete:**

```bash
# Create patient with medication
curl -X POST http://127.0.0.1:3000/api/patients -d '{"name":"Test"}'
# Note patient ID from response

curl -X POST http://127.0.0.1:3000/api/medications -d '{
  "patient_id":"<patient_id>",
  "medication_name":"Aspirin"
}'

# Delete patient (should cascade to medications)
curl -X DELETE http://127.0.0.1:3000/api/patients/<patient_id>

# Verify medication was deleted
sqlite3 kalito.db "SELECT COUNT(*) FROM medications WHERE patient_id='<patient_id>'"
# Should show: 0
```

### Test 4: Database Performance

**Benchmark query performance:**

```javascript
// Add to main.js for testing
const { db } = require('./db/db')

function benchmarkQueries() {
  console.log('[Benchmark] Testing database performance...')
  
  // Test 1: Simple SELECT
  const start1 = Date.now()
  for (let i = 0; i < 1000; i++) {
    db.prepare('SELECT * FROM patients').all()
  }
  const time1 = Date.now() - start1
  console.log('[Benchmark] 1000 patient queries:', time1, 'ms')
  
  // Test 2: JOIN query
  const start2 = Date.now()
  for (let i = 0; i < 1000; i++) {
    db.prepare(`
      SELECT p.*, m.medication_name 
      FROM patients p 
      LEFT JOIN medications m ON p.id = m.patient_id
    `).all()
  }
  const time2 = Date.now() - start2
  console.log('[Benchmark] 1000 JOIN queries:', time2, 'ms')
  
  // Test 3: INSERT with transaction
  const start3 = Date.now()
  const insertMany = db.transaction(() => {
    const stmt = db.prepare('INSERT INTO vitals VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    for (let i = 0; i < 1000; i++) {
      stmt.run(`test-${i}`, 'patient-1', 150.5, 120, 95, '2025-11-09', null, 1, new Date().toISOString(), new Date().toISOString())
    }
  })
  insertMany()
  const time3 = Date.now() - start3
  console.log('[Benchmark] 1000 INSERTs (transaction):', time3, 'ms')
  
  // Cleanup
  db.prepare('DELETE FROM vitals WHERE id LIKE ?').run('test-%')
}

// Run on startup (mobile only, for testing)
if (IS_MOBILE) {
  setTimeout(benchmarkQueries, 5000)
}
```

**Expected Performance (Android Mid-Range Device):**
- 1000 SELECT queries: < 100ms
- 1000 JOIN queries: < 200ms
- 1000 INSERT transaction: < 50ms

### Test 5: Database Backup & Restore

**Test backup creation:**

```bash
curl -X POST http://127.0.0.1:3000/api/patients/backup
```

**Expected:**
```json
{
  "success": true,
  "backup": {
    "path": "/data/data/com.kalito.space/files/../cache/kalito-backup-2025-11-09T12-30-00.db",
    "size": 153600
  }
}
```

**Test backup list:**

```bash
curl http://127.0.0.1:3000/api/patients/backups
```

**Expected:**
```json
{
  "backups": [
    {
      "name": "kalito-backup-2025-11-09T12-30-00.db",
      "path": "/data/data/com.kalito.space/files/../cache/kalito-backup-2025-11-09T12-30-00.db",
      "size": 153600,
      "created": "2025-11-09T12:30:00.000Z"
    }
  ]
}
```

---

## Troubleshooting

### Issue: "Database disk image is malformed"

**Cause:** Corruption from improper shutdown or storage errors.

**Fix:**
```bash
# Try SQLite recovery
sqlite3 kalito.db ".recover" | sqlite3 recovered.db

# Replace corrupted database
mv kalito.db kalito.db.corrupted
mv recovered.db kalito.db

# Restart server
```

### Issue: "SQLITE_CANTOPEN: unable to open database file"

**Cause:** Permission issues or missing directory.

**Fix:**
```javascript
// Ensure directory exists and is writable
const dbDir = path.dirname(dbFile)
fs.mkdirSync(dbDir, { recursive: true })

// Check permissions (Android)
try {
  fs.accessSync(dbDir, fs.constants.W_OK)
  console.log('[Database] Directory is writable ✓')
} catch (err) {
  console.error('[Database] Directory not writable:', err)
}
```

### Issue: "FOREIGN KEY constraint failed"

**Cause:** Trying to insert child record before parent exists.

**Fix:**
```javascript
// Always insert in correct order:
// 1. patients
// 2. providers
// 3. medications (references patients)
// 4. appointments (references patients, providers)
// 5. medication_logs (references medications)

// Or use transactions to ensure atomicity
const importWithForeignKeys = db.transaction(() => {
  // Insert parents first
  insertPatients()
  insertProviders()
  
  // Then children
  insertMedications()
  insertAppointments()
})

importWithForeignKeys()
```

---

## Next Steps

Once database migration is complete and tested:

1. ✅ **Database Path:** Android app private storage configured
2. ✅ **Tables Created:** All 14 tables with foreign keys
3. ✅ **Backup System:** Export/import functionality working
4. ✅ **Performance:** Queries optimized for mobile

**Proceed to:** 📄 03-Frontend-API-Configuration.md

---

**Document Status:** ✅ COMPLETE  
**Next Document:** 03-Frontend-API-Configuration.md
