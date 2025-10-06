# Quick Reference Guide

## Database File Structure

```
backend/db/
├── db.ts              # Connection manager & configuration
├── init.ts            # Schema initialization & migrations
├── kalito.db          # Main SQLite database file
├── kalito.db-wal      # Write-Ahead Log (WAL) file
└── kalito.db-shm      # Shared memory file for WAL
```

## Table Quick Reference

| Table | Purpose | Records | Key Features |
|-------|---------|---------|--------------|
| `sessions` | Chat sessions | Conversations | Ephemeral/saved flag |
| `messages` | Chat messages | Individual messages | Importance scoring |
| `personas` | AI configurations | Personality presets | Category-based |
| `conversation_summaries` | Historical context | Compressed history | Token optimization |
| `semantic_pins` | Important facts | Flagged information | High priority recall |

## Common Commands Cheat Sheet

### SQLite CLI Commands

```bash
# Open database
sqlite3 backend/db/kalito.db

# Show all tables
.tables

# Show table schema
.schema sessions

# Show table with headers
.mode column
.headers on
SELECT * FROM sessions;

# Export to CSV
.mode csv
.output sessions.csv
SELECT * FROM sessions;
.output stdout

# Check database integrity
PRAGMA integrity_check;

# Show database info
PRAGMA database_list;

# Checkpoint WAL
PRAGMA wal_checkpoint(TRUNCATE);

# Exit
.quit
```

---

## SQL Quick Reference

### Sessions

```sql
-- Get all sessions
SELECT * FROM sessions ORDER BY updated_at DESC;

-- Get saved sessions only
SELECT * FROM sessions WHERE saved = 1;

-- Get session with message count
SELECT s.*, COUNT(m.id) as msg_count
FROM sessions s
LEFT JOIN messages m ON s.id = m.session_id
GROUP BY s.id;

-- Delete old ephemeral sessions
DELETE FROM sessions 
WHERE saved = 0 
  AND updated_at < datetime('now', '-7 days');
```

### Messages

```sql
-- Get recent messages for session
SELECT * FROM messages
WHERE session_id = 'abc-123'
ORDER BY created_at DESC
LIMIT 50;

-- Get important messages
SELECT * FROM messages
WHERE session_id = 'abc-123'
  AND importance_score >= 0.7
ORDER BY importance_score DESC;

-- Count messages by role
SELECT role, COUNT(*) as count
FROM messages
WHERE session_id = 'abc-123'
GROUP BY role;

-- Get token usage statistics
SELECT 
  COUNT(*) as total_messages,
  SUM(token_usage) as total_tokens,
  AVG(token_usage) as avg_tokens,
  MAX(token_usage) as max_tokens
FROM messages
WHERE session_id = 'abc-123';
```

### Personas

```sql
-- Get all personas
SELECT * FROM personas ORDER BY category, name;

-- Get default personas
SELECT * FROM personas WHERE is_default = 1;

-- Get cloud personas
SELECT * FROM personas WHERE category = 'cloud';

-- Count sessions using each persona
SELECT 
  p.name,
  COUNT(s.id) as usage_count
FROM personas p
LEFT JOIN sessions s ON p.id = s.persona_id
GROUP BY p.id
ORDER BY usage_count DESC;
```

### Memory System

```sql
-- Get all summaries for session
SELECT * FROM conversation_summaries
WHERE session_id = 'abc-123'
ORDER BY importance_score DESC;

-- Get all pins for session
SELECT * FROM semantic_pins
WHERE session_id = 'abc-123'
ORDER BY importance_score DESC;

-- Get memory stats
SELECT 
  (SELECT COUNT(*) FROM messages WHERE session_id = 'abc-123') as messages,
  (SELECT COUNT(*) FROM conversation_summaries WHERE session_id = 'abc-123') as summaries,
  (SELECT COUNT(*) FROM semantic_pins WHERE session_id = 'abc-123') as pins;

-- Get user-created pins only
SELECT * FROM semantic_pins
WHERE session_id = 'abc-123'
  AND pin_type = 'user'
ORDER BY created_at DESC;
```

---

## TypeScript API Quick Reference

### Importing

```typescript
import { db } from './db/db'
```

### Basic Operations

```typescript
// Prepare and run
const stmt = db.prepare('INSERT INTO sessions (id, name) VALUES (?, ?)')
stmt.run('session-1', 'My Chat')

// Get single row
const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get('session-1')

// Get all rows
const sessions = db.prepare('SELECT * FROM sessions').all()

// Transaction
const insertMany = db.transaction((items) => {
  for (const item of items) {
    stmt.run(item.id, item.name)
  }
})
insertMany(arrayOfItems)

// Get last inserted row ID
const result = stmt.run('data')
console.log(result.lastInsertRowid)

// Get changes count
const result = stmt.run('data')
console.log(result.changes)
```

---

## Pragma Reference

```typescript
// Set pragma
db.pragma('foreign_keys = ON')

// Get pragma value
const value = db.pragma('journal_mode', { simple: true })
console.log(value) // "wal"

// Get pragma table
const info = db.pragma('table_info(sessions)')
console.log(info) // Array of column info
```

### Useful Pragmas

| Pragma | Purpose | Values |
|--------|---------|--------|
| `foreign_keys` | Enable FK constraints | ON/OFF |
| `journal_mode` | Set journaling mode | DELETE/WAL/MEMORY |
| `synchronous` | Durability vs speed | OFF/NORMAL/FULL |
| `cache_size` | Page cache size | Number of pages |
| `temp_store` | Temp storage location | FILE/MEMORY |
| `busy_timeout` | Lock wait timeout | Milliseconds |
| `wal_checkpoint` | Force WAL checkpoint | PASSIVE/FULL/RESTART/TRUNCATE |

---

## Indexes

### Existing Indexes

```sql
-- Messages by session and time
CREATE INDEX idx_messages_session_created
  ON messages(session_id, created_at DESC);

-- Messages by session, importance, and time
CREATE INDEX idx_messages_session_importance_created
  ON messages(session_id, importance_score DESC, created_at DESC);
```

### Index Management

```sql
-- List all indexes
SELECT name, tbl_name FROM sqlite_master 
WHERE type = 'index';

-- Get index info
PRAGMA index_list(messages);

-- Get index details
PRAGMA index_info(idx_messages_session_created);

-- Drop index
DROP INDEX idx_messages_session_created;

-- Create index
CREATE INDEX idx_name ON table_name(column);
```

---

## Data Types Reference

| SQLite Type | TypeScript Type | Description |
|-------------|----------------|-------------|
| TEXT | string | UTF-8 text |
| INTEGER | number | 64-bit signed integer |
| REAL | number | IEEE 754 floating point |
| BLOB | Buffer | Binary data |
| NULL | null | Null value |

**Note**: SQLite is dynamically typed. Column type is a hint, not a constraint.

---

## Foreign Key Cascade Reference

```sql
-- Cascade behaviors defined in schema
FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE

-- What this means:
-- When parent session is deleted → child records auto-delete
-- When parent session is updated → no action (default)
```

### Cascade Options

| Option | Behavior |
|--------|----------|
| `CASCADE` | Delete/update child records |
| `SET NULL` | Set child FK to NULL |
| `SET DEFAULT` | Set child FK to default value |
| `RESTRICT` | Prevent parent operation |
| `NO ACTION` | Check constraints at end of statement |

---

## Token Estimation

```typescript
// Quick token estimation (rough)
function estimateTokens(text: string): number {
  // ~4 characters per token for English
  return Math.ceil(text.length / 4)
}

// More accurate (for production, use tiktoken library)
import { encoding_for_model } from 'tiktoken'
const enc = encoding_for_model('gpt-4')
const tokens = enc.encode(text).length
```

---

## Importance Score Guide

| Score Range | Category | Usage | Examples |
|-------------|----------|-------|----------|
| 0.0 - 0.3 | Low | Rarely included | Greetings, acknowledgments |
| 0.4 - 0.6 | Normal | Default | General conversation |
| 0.7 - 0.8 | High | Often included | Decisions, important info |
| 0.9 - 1.0 | Critical | Always included | Key facts, constraints |

---

## Backup & Restore

### Manual Backup

```bash
# Checkpoint WAL first
sqlite3 backend/db/kalito.db "PRAGMA wal_checkpoint(TRUNCATE);"

# Copy database
cp backend/db/kalito.db backend/db/kalito.db.backup
```

### Using Provided Scripts

```bash
# Backup (creates timestamped file)
./scripts/backup-db

# Restore
./scripts/restore-db backups/kalito.db.2025-10-06_180932.bak
```

### Programmatic Backup

```typescript
import { db } from './db/db'

// Backup to file
db.backup('path/to/backup.db')

// Backup with progress callback
db.backup('path/to/backup.db', {
  progress: ({ totalPages, remainingPages }) => {
    console.log(`${remainingPages} of ${totalPages} remaining`)
  }
})
```

---

## Troubleshooting

### Database Locked

```typescript
// Set busy timeout (wait up to 5 seconds)
db.pragma('busy_timeout = 5000')
```

### Check Database Health

```bash
sqlite3 backend/db/kalito.db "PRAGMA integrity_check;"
# Should return: ok

sqlite3 backend/db/kalito.db "PRAGMA foreign_key_check;"
# Should return: (empty)
```

### Repair Corrupted Database

```bash
# Dump to SQL
sqlite3 backend/db/kalito.db .dump > dump.sql

# Create new database from dump
sqlite3 backend/db/kalito_new.db < dump.sql

# Backup old and replace
mv backend/db/kalito.db backend/db/kalito_old.db
mv backend/db/kalito_new.db backend/db/kalito.db
```

### View WAL File Size

```bash
ls -lh backend/db/kalito.db*
```

### Force Checkpoint

```bash
sqlite3 backend/db/kalito.db "PRAGMA wal_checkpoint(TRUNCATE);"
```

---

## Performance Tips

### ✅ DO

- Use transactions for multiple operations
- Use prepared statements for repeated queries
- Create indexes for frequently queried columns
- Use WAL mode for concurrent access
- Use appropriate page cache size
- Checkpoint WAL periodically

### ❌ DON'T

- Use string concatenation for SQL (injection risk)
- Forget to enable foreign keys
- Create too many indexes (slows writes)
- Leave large WAL files uncheckpointed
- Use SELECT * in production (specify columns)
- Ignore NULL checks in TypeScript

---

## Environment-Specific Paths

### Development

```typescript
__dirname = '/home/kalito/kalito-labs/kalito-repo/backend/db'
dbPath = '/home/kalito/kalito-labs/kalito-repo/backend/db/kalito.db'
```

### Production (Compiled)

```typescript
__dirname = '/home/kalito/kalito-labs/kalito-repo/dist/backend/db'
dbPath = '/home/kalito/kalito-labs/kalito-repo/backend/db/kalito.db'
```

Path logic in `db.ts`:
```typescript
const dbFile = path.resolve(
  __dirname,
  __dirname.includes('dist') ? '../../../db/kalito.db' : 'kalito.db'
)
```

---

## Connection Configuration Summary

```typescript
// From db.ts
database.pragma('foreign_keys = ON')          // Enforce FK constraints
database.pragma('journal_mode = WAL')         // Write-Ahead Logging
database.pragma('synchronous = NORMAL')       // Balanced durability
database.pragma('cache_size = 1000')          // 4 MB cache
database.pragma('temp_store = MEMORY')        // RAM-based temp storage
```

---

## Useful Queries for Monitoring

### Database Size

```sql
SELECT page_count * page_size as size 
FROM pragma_page_count(), pragma_page_size();
```

### Table Sizes

```sql
SELECT 
  name,
  SUM("pgsize") as size
FROM "dbstat"
GROUP BY name
ORDER BY size DESC;
```

### Recent Activity

```sql
-- Most recent activity across all sessions
SELECT 
  s.name as session,
  m.role,
  substr(m.text, 1, 50) as preview,
  m.created_at
FROM messages m
JOIN sessions s ON m.session_id = s.id
ORDER BY m.created_at DESC
LIMIT 10;
```

### Memory System Health

```sql
-- Check memory system usage per session
SELECT 
  s.name,
  COUNT(DISTINCT m.id) as messages,
  COUNT(DISTINCT cs.id) as summaries,
  COUNT(DISTINCT sp.id) as pins
FROM sessions s
LEFT JOIN messages m ON s.id = m.session_id
LEFT JOIN conversation_summaries cs ON s.id = cs.session_id
LEFT JOIN semantic_pins sp ON s.id = sp.session_id
GROUP BY s.id
ORDER BY messages DESC;
```

---

## Default Values Reference

| Field | Default | Notes |
|-------|---------|-------|
| `sessions.saved` | 0 | Ephemeral by default |
| `messages.importance_score` | 0.5 | Average importance |
| `personas.is_default` | 0 | Not default |
| `conversation_summaries.importance_score` | 0.7 | High importance |
| `semantic_pins.importance_score` | 0.8 | Very high importance |
| `semantic_pins.pin_type` | 'user' | User-created |
| Timestamps | CURRENT_TIMESTAMP | ISO 8601 format |

---

## Migration Checklist

When adding new features:

1. ✅ Add column to `CREATE TABLE` in `init.ts`
2. ✅ Add migration to `migrations` array in `init.ts`
3. ✅ Update TypeScript interfaces in `types/`
4. ✅ Add necessary indexes
5. ✅ Update API endpoints if needed
6. ✅ Test with existing database
7. ✅ Update documentation

---

## Related Documentation

- [01-Database-Overview.md](./01-Database-Overview.md) - High-level architecture
- [02-Table-Schemas.md](./02-Table-Schemas.md) - Detailed schema reference
- [03-Initialization-Process.md](./03-Initialization-Process.md) - Startup & migrations
- [04-Connection-Management.md](./04-Connection-Management.md) - Connection details
- [05-Memory-System.md](./05-Memory-System.md) - Advanced memory features
- [06-Operations-Guide.md](./06-Operations-Guide.md) - Code examples

---

## Getting Help

### Check Logs

```bash
# Application logs (if using logger)
tail -f logs/application.log

# Database errors are logged via logError() utility
```

### Inspect Schema

```bash
sqlite3 backend/db/kalito.db .schema
```

### Test Connection

```typescript
import { db } from './db/db'
console.log(db.prepare('SELECT 1 as test').get())
// Should output: { test: 1 }
```

### Verify Foreign Keys Work

```typescript
// Should fail if foreign keys are working
try {
  db.prepare('INSERT INTO messages (session_id) VALUES (?)').run('nonexistent')
} catch (e) {
  console.log('Foreign keys working!', e.message)
}
```

---

## Quick Start Template

```typescript
import { db } from './db/db'
import { v4 as uuidv4 } from 'uuid'

// Create session
const sessionId = uuidv4()
db.prepare(`
  INSERT INTO sessions (id, name, created_at, updated_at)
  VALUES (?, ?, ?, ?)
`).run(sessionId, 'Test Session', new Date().toISOString(), new Date().toISOString())

// Add message
db.prepare(`
  INSERT INTO messages (session_id, role, text, created_at)
  VALUES (?, ?, ?, ?)
`).run(sessionId, 'user', 'Hello!', new Date().toISOString())

// Query messages
const messages = db.prepare(`
  SELECT * FROM messages WHERE session_id = ?
`).all(sessionId)

console.log(messages)
```

---

**Last Updated**: October 6, 2025  
**Database Version**: SQLite 3.50.2  
**Schema Version**: 4
