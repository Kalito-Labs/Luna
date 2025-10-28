# Database Initialization Documentation

## Overview

The `init.ts` file handles **database schema initialization, migrations, and seeding** for the Kalito application, ensuring the database structure is created and updated automatically on application startup.

**Location**: `/backend/db/init.ts`

**Primary Responsibilities**:
- Create database file if it doesn't exist
- Define database schema (tables, columns, constraints)
- Run migrations (add new columns, modify structure)
- Add foreign key constraints
- Create indexes for performance
- Seed default data (personas)
- Verify eldercare tables exist

**Design Pattern**: **Schema-as-Code with Migration System**
- Declarative schema definitions
- Incremental migrations (non-destructive)
- Idempotent operations (safe to run multiple times)
- Automatic on startup

---

## Architecture Overview

### Initialization Flow

```
App Startup
    ↓
Import init.ts (side effect module)
    ↓
Check if database file exists
    ↓
Create file if missing
    ↓
Create core tables (IF NOT EXISTS)
    ↓
Run migrations (add columns)
    ↓
Add foreign keys if missing
    ↓
Create indexes
    ↓
Seed default personas
    ↓
Create eldercare tables
    ↓
Verify setup complete
    ↓
Database Ready!
```

### Module Structure

```typescript
/// <reference types="node" />
import * as path from 'path'
import * as fs from 'fs'
import { db } from './db'
```

**Dependencies**:
- `path` - Resolve database file path
- `fs` - File system operations (create file)
- `db` - Shared database connection

**Type Reference**: `/// <reference types="node" />` ensures Node.js types are available.

---

## Database File Creation

### Path Resolution

```typescript
const dbPath = path.resolve(
  __dirname, 
  __dirname.includes('dist') 
    ? '../../../db/kalito.db'   // Production
    : 'kalito.db'                // Development
)
```

**Purpose**: Same logic as `db.ts` - locate database file in dev vs production.

**Paths**:
- **Development**: `/backend/db/kalito.db`
- **Production**: `/db/kalito.db` (project root)

### File Creation

```typescript
if (!fs.existsSync(dbPath)) {
  fs.writeFileSync(dbPath, '')
  console.log(`Created new database file: ${dbPath}`)
}
```

**Purpose**: Create empty database file if it doesn't exist.

**Why Empty String?**:
- better-sqlite3 requires file to exist
- Empty file is valid (SQLite creates structure)
- Avoids "file not found" errors

**When This Runs**:
- First application startup (fresh install)
- After database deletion
- New environment setup

---

## Core Tables

### 1. Sessions Table

```typescript
db.exec(`
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  name TEXT,
  model TEXT,
  recap TEXT,
  persona_id TEXT,
  created_at TEXT,
  updated_at TEXT,
  saved INTEGER DEFAULT 0
);
`)
```

**Purpose**: Store chat sessions/conversations.

**Schema**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | TEXT | PRIMARY KEY | Unique session identifier (UUID) |
| `name` | TEXT | - | User-friendly session name |
| `model` | TEXT | - | Model used for session (e.g., 'gpt-4.1-nano') |
| `recap` | TEXT | - | AI-generated session summary |
| `persona_id` | TEXT | - | Associated persona (optional) |
| `created_at` | TEXT | - | ISO timestamp of creation |
| `updated_at` | TEXT | - | ISO timestamp of last update |
| `saved` | INTEGER | DEFAULT 0 | Bookmark flag (0=unsaved, 1=saved) |

**Relationships**:
- Has many `messages` (1:N)
- Referenced by `conversation_summaries` (1:N)
- Referenced by `semantic_pins` (1:N)

**Example Data**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Eldercare Planning Chat",
  "model": "gpt-4.1-nano",
  "recap": "Discussion about creating a care plan for patient",
  "persona_id": "default-cloud",
  "created_at": "2025-10-28T10:30:00.000Z",
  "updated_at": "2025-10-28T11:45:00.000Z",
  "saved": 1
}
```

### 2. Messages Table

```typescript
db.exec(`
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  role TEXT,
  text TEXT,
  model_id TEXT,
  token_usage INTEGER,
  importance_score REAL DEFAULT 0.5,
  created_at TEXT,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);
`)
```

**Purpose**: Store individual messages within chat sessions.

**Schema**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique message ID (auto-increment) |
| `session_id` | TEXT | NOT NULL, FK → sessions.id | Parent session |
| `role` | TEXT | - | Message role ('system', 'user', 'assistant') |
| `text` | TEXT | - | Message content |
| `model_id` | TEXT | - | Model that generated this message |
| `token_usage` | INTEGER | - | Token count for this message |
| `importance_score` | REAL | DEFAULT 0.5 | Memory importance (0.0-1.0) |
| `created_at` | TEXT | - | ISO timestamp |

**Foreign Key**:
```sql
FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
```

**Cascade Delete**: When session deleted → all messages automatically deleted.

**Importance Score**:
- `0.0-0.3`: Low importance (small talk)
- `0.4-0.6`: Medium importance (normal conversation)
- `0.7-0.9`: High importance (key information)
- `1.0`: Critical (must remember)

**Example Data**:
```json
{
  "id": 1,
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "role": "user",
  "text": "What medications does John Doe need today?",
  "model_id": null,
  "token_usage": null,
  "importance_score": 0.8,
  "created_at": "2025-10-28T10:30:15.000Z"
}
```

### 3. Personas Table

```typescript
db.exec(`
CREATE TABLE IF NOT EXISTS personas (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  prompt TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  category TEXT,
  default_model TEXT,
  suggested_models TEXT,
  temperature REAL,
  maxTokens INTEGER,
  topP REAL,
  repeatPenalty REAL,
  stopSequences TEXT,
  is_default INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
`)
```

**Purpose**: Store AI personas/assistants with custom behavior and settings.

**Schema**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | TEXT | PRIMARY KEY | Unique persona identifier |
| `name` | TEXT | NOT NULL | Display name |
| `prompt` | TEXT | NOT NULL | System prompt for AI |
| `description` | TEXT | - | User-facing description |
| `icon` | TEXT | - | Emoji or icon |
| `category` | TEXT | - | Category ('cloud', 'local', 'specialized') |
| `default_model` | TEXT | - | Preferred model ID |
| `suggested_models` | TEXT | - | JSON array of recommended models |
| `temperature` | REAL | - | Creativity setting (0.0-2.0) |
| `maxTokens` | INTEGER | - | Max response length |
| `topP` | REAL | - | Nucleus sampling (0.0-1.0) |
| `repeatPenalty` | REAL | - | Repetition penalty (1.0+) |
| `stopSequences` | TEXT | - | JSON array of stop sequences |
| `is_default` | INTEGER | DEFAULT 0 | Default persona flag (0/1) |
| `created_at` | TEXT | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| `updated_at` | TEXT | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

**Example Data**:
```json
{
  "id": "eldercare-specialist",
  "name": "Eldercare Specialist",
  "prompt": "You are an expert eldercare assistant...",
  "description": "Specialized in eldercare management",
  "icon": "🏥",
  "category": "specialized",
  "default_model": "gpt-4.1-nano",
  "suggested_models": "[\"gpt-4.1-nano\", \"phi3-mini\"]",
  "temperature": 0.3,
  "maxTokens": 1000,
  "topP": 0.9,
  "repeatPenalty": 1.1,
  "stopSequences": null,
  "is_default": 0
}
```

### 4. Conversation Summaries Table

```typescript
db.exec(`
CREATE TABLE IF NOT EXISTS conversation_summaries (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  summary TEXT NOT NULL,
  message_count INTEGER NOT NULL,
  start_message_id TEXT,
  end_message_id TEXT,
  importance_score REAL DEFAULT 0.7,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);
`)
```

**Purpose**: Store AI-generated summaries of conversation segments for efficient memory recall.

**Schema**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | TEXT | PRIMARY KEY | Unique summary ID |
| `session_id` | TEXT | NOT NULL, FK → sessions.id | Parent session |
| `summary` | TEXT | NOT NULL | AI-generated summary text |
| `message_count` | INTEGER | NOT NULL | Number of messages summarized |
| `start_message_id` | TEXT | - | First message ID in summary |
| `end_message_id` | TEXT | - | Last message ID in summary |
| `importance_score` | REAL | DEFAULT 0.7 | Summary importance |
| `created_at` | TEXT | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |

**Use Case**: Memory Manager creates summaries when conversation exceeds context window.

**Example Data**:
```json
{
  "id": "sum_123",
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "summary": "User inquired about patient's medication schedule. Discussed morning medications including blood pressure pills and afternoon insulin shots.",
  "message_count": 8,
  "start_message_id": "1",
  "end_message_id": "8",
  "importance_score": 0.9,
  "created_at": "2025-10-28T10:45:00.000Z"
}
```

### 5. Semantic Pins Table

```typescript
db.exec(`
CREATE TABLE IF NOT EXISTS semantic_pins (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  content TEXT NOT NULL,
  source_message_id TEXT,
  importance_score REAL DEFAULT 0.8,
  pin_type TEXT DEFAULT 'user',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);
`)
```

**Purpose**: Store important facts/information that should always be remembered (pinned memory).

**Schema**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | TEXT | PRIMARY KEY | Unique pin ID |
| `session_id` | TEXT | NOT NULL, FK → sessions.id | Parent session |
| `content` | TEXT | NOT NULL | Pinned information |
| `source_message_id` | TEXT | - | Original message ID |
| `importance_score` | REAL | DEFAULT 0.8 | Pin importance (high by default) |
| `pin_type` | TEXT | DEFAULT 'user' | Type ('user', 'system', 'auto') |
| `created_at` | TEXT | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |

**Pin Types**:
- **`user`**: Manually pinned by user
- **`system`**: Auto-pinned by system (critical info)
- **`auto`**: Auto-detected important fact

**Example Data**:
```json
{
  "id": "pin_456",
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "content": "Patient John Doe is allergic to penicillin",
  "source_message_id": "42",
  "importance_score": 1.0,
  "pin_type": "system",
  "created_at": "2025-10-28T10:50:00.000Z"
}
```

---

## Migration System

### Migration Utilities

#### columnExists()

```typescript
function columnExists(table: string, column: string): boolean {
  try {
    const pragma = db.prepare(`PRAGMA table_info(${table})`).all() as any[]
    return pragma.some(c => c.name === column)
  } catch {
    return false
  }
}
```

**Purpose**: Check if column exists in table before adding it.

**How It Works**:
1. Execute `PRAGMA table_info(table_name)`
2. Returns array of column metadata
3. Check if any column has matching name
4. Return true if found, false otherwise

**Example Usage**:
```typescript
if (!columnExists('messages', 'importance_score')) {
  db.exec('ALTER TABLE messages ADD COLUMN importance_score REAL DEFAULT 0.5')
}
```

**PRAGMA table_info Output**:
```json
[
  { "cid": 0, "name": "id", "type": "INTEGER", "notnull": 0, "dflt_value": null, "pk": 1 },
  { "cid": 1, "name": "session_id", "type": "TEXT", "notnull": 1, "dflt_value": null, "pk": 0 },
  ...
]
```

#### tableHasFK()

```typescript
function tableHasFK(table: string, refTable: string): boolean {
  try {
    const fks = db.prepare(`PRAGMA foreign_key_list(${table})`).all() as any[]
    return fks.some(fk => fk.table === refTable)
  } catch {
    return false
  }
}
```

**Purpose**: Check if table has foreign key to specific reference table.

**How It Works**:
1. Execute `PRAGMA foreign_key_list(table_name)`
2. Returns array of foreign keys
3. Check if any FK references target table
4. Return true if found, false otherwise

**Example Usage**:
```typescript
if (!tableHasFK('messages', 'sessions')) {
  // Add foreign key constraint
}
```

**PRAGMA foreign_key_list Output**:
```json
[
  {
    "id": 0,
    "seq": 0,
    "table": "sessions",
    "from": "session_id",
    "to": "id",
    "on_update": "NO ACTION",
    "on_delete": "CASCADE"
  }
]
```

### Column Migrations

```typescript
const migrations: { column: string; ddl: string }[] = [
  { column: 'importance_score', ddl: 'ALTER TABLE messages ADD COLUMN importance_score REAL DEFAULT 0.5' },
  { column: 'suggested_models', ddl: 'ALTER TABLE personas ADD COLUMN suggested_models TEXT' },
  { column: 'temperature', ddl: 'ALTER TABLE personas ADD COLUMN temperature REAL' },
  { column: 'maxTokens', ddl: 'ALTER TABLE personas ADD COLUMN maxTokens INTEGER' },
  { column: 'category', ddl: 'ALTER TABLE personas ADD COLUMN category TEXT' },
  { column: 'topP', ddl: 'ALTER TABLE personas ADD COLUMN topP REAL' },
  { column: 'stopSequences', ddl: 'ALTER TABLE personas ADD COLUMN stopSequences TEXT' },
  { column: 'repeatPenalty', ddl: 'ALTER TABLE personas ADD COLUMN repeatPenalty REAL' },
  { column: 'is_default', ddl: 'ALTER TABLE personas ADD COLUMN is_default INTEGER DEFAULT 0' },
  { column: 'saved', ddl: 'ALTER TABLE sessions ADD COLUMN saved INTEGER DEFAULT 0' },
]
```

**Purpose**: Define schema evolution (add new columns over time).

**Structure**:
- **`column`**: Column name (for logging)
- **`ddl`**: SQL ALTER TABLE statement

**Migration Execution**:
```typescript
for (const { column, ddl } of migrations) {
  try {
    db.exec(ddl)
    console.log(`✅ Added ${column} column`)
  } catch {
    // ignore if column exists
  }
}
```

**How It Works**:
1. Try to execute ALTER TABLE
2. If column already exists → SQLite throws error
3. Catch error, silently ignore (idempotent)
4. If column doesn't exist → Successfully added

**Why Try/Catch?**:
- No built-in "ADD COLUMN IF NOT EXISTS"
- Simpler than checking first
- Idempotent (safe to run multiple times)

**Migration History** (inferred from columns):
1. **v1.0**: Base schema (id, session_id, role, text)
2. **v1.1**: Added importance_score to messages
3. **v1.2**: Added persona settings (temperature, maxTokens, etc.)
4. **v1.3**: Added saved flag to sessions

---

## Foreign Key Migration

### Purpose

Add foreign key constraint to existing `messages` table that was created without FK.

**Problem**:
- Old schema: `messages` table without FK to `sessions`
- Need to add FK without losing data
- SQLite doesn't support ALTER TABLE ADD CONSTRAINT

**Solution**: Table recreation pattern

### Implementation

```typescript
if (!tableHasFK('messages', 'sessions')) {
  db.transaction(() => {
    db.pragma('foreign_keys = OFF')

    // Create new table with FK
    db.exec(`
      CREATE TABLE IF NOT EXISTS messages_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        role TEXT,
        text TEXT,
        model_id TEXT,
        token_usage INTEGER,
        importance_score REAL DEFAULT 0.5,
        created_at TEXT,
        FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
      );
    `)

    // Copy data from old table
    db.exec(`
      INSERT INTO messages_new (id, session_id, role, text, model_id, token_usage, importance_score, created_at)
      SELECT id, session_id, role, text, model_id, token_usage, importance_score, created_at FROM messages;
    `)

    // Drop old table
    db.exec(`DROP TABLE messages;`)
    
    // Rename new table
    db.exec(`ALTER TABLE messages_new RENAME TO messages;`)

    // Create indexes
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_messages_session_created
        ON messages(session_id, created_at DESC);
    `)
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_messages_session_importance_created
        ON messages(session_id, importance_score DESC, created_at DESC);
    `)

    db.pragma('foreign_keys = ON')
  })()
}
```

### Migration Steps

**Step 1: Disable Foreign Keys**
```typescript
db.pragma('foreign_keys = OFF')
```
- Required before recreating table
- Allows dropping table with FK references

**Step 2: Create New Table**
```typescript
CREATE TABLE messages_new (...)
```
- Same structure as old table
- **Plus** foreign key constraint

**Step 3: Copy Data**
```typescript
INSERT INTO messages_new (...) SELECT ... FROM messages
```
- Preserve all existing data
- Maintain original IDs (important for references)

**Step 4: Drop Old Table**
```typescript
DROP TABLE messages
```
- Remove table without FK

**Step 5: Rename New Table**
```typescript
ALTER TABLE messages_new RENAME TO messages
```
- Restore original table name

**Step 6: Create Indexes**
```typescript
CREATE INDEX idx_messages_session_created ...
CREATE INDEX idx_messages_session_importance_created ...
```
- Recreate indexes (lost during drop)
- Performance optimization

**Step 7: Re-enable Foreign Keys**
```typescript
db.pragma('foreign_keys = ON')
```
- Restore FK enforcement

### Indexes Created

#### idx_messages_session_created

```sql
CREATE INDEX IF NOT EXISTS idx_messages_session_created
  ON messages(session_id, created_at DESC);
```

**Purpose**: Fast retrieval of messages by session in chronological order.

**Optimizes**:
```sql
SELECT * FROM messages 
WHERE session_id = ? 
ORDER BY created_at DESC
```

**Use Case**: Load conversation history for session.

#### idx_messages_session_importance_created

```sql
CREATE INDEX IF NOT EXISTS idx_messages_session_importance_created
  ON messages(session_id, importance_score DESC, created_at DESC);
```

**Purpose**: Fast retrieval of important messages in chronological order.

**Optimizes**:
```sql
SELECT * FROM messages 
WHERE session_id = ? 
ORDER BY importance_score DESC, created_at DESC
LIMIT 10
```

**Use Case**: Memory Manager selecting most important messages for context.

---

## Default Personas Seeding

### Persona Preparation

```typescript
const ensurePersona = db.prepare('SELECT id FROM personas WHERE id = ?')
const insertPersona = db.prepare(`
  INSERT INTO personas (
    id, name, prompt, description, icon, category,
    temperature, maxTokens, topP, repeatPenalty, is_default
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`)
```

**Purpose**: Prepared statements for efficient persona seeding.

### Default Personas

```typescript
const defaultPersonas = [
  {
    id: 'default-cloud',
    name: 'Default Cloud Assistant',
    prompt: 'You are a helpful, knowledgeable AI assistant. Provide accurate, clear responses.',
    description: 'Versatile cloud-based assistant for general tasks',
    icon: '☁️',
    category: 'cloud',
    temperature: 0.7,
    maxTokens: 1500,
    topP: 0.9,
    repeatPenalty: 1.1,
    is_default: 1,
  },
  {
    id: 'default-local',
    name: 'Default Local Assistant',
    prompt: 'You are a helpful local AI assistant. Provide clear, concise, and private responses.',
    description: 'Privacy-focused assistant that runs locally',
    icon: '⚡',
    category: 'local',
    temperature: 0.6,
    maxTokens: 800,
    topP: 0.8,
    repeatPenalty: 1.0,
    is_default: 1,
  },
]
```

#### Default Cloud Assistant

**Purpose**: General-purpose assistant using cloud models (OpenAI).

**Characteristics**:
- **Category**: `cloud`
- **Temperature**: 0.7 (balanced creativity)
- **Max Tokens**: 1500 (longer responses)
- **Top-p**: 0.9 (diverse vocabulary)
- **Repeat Penalty**: 1.1 (slight penalty)

**Use Cases**:
- Complex reasoning
- Long-form content
- High-quality responses
- General chat

#### Default Local Assistant

**Purpose**: Privacy-focused assistant using local models (Ollama).

**Characteristics**:
- **Category**: `local`
- **Temperature**: 0.6 (more focused)
- **Max Tokens**: 800 (concise responses)
- **Top-p**: 0.8 (focused vocabulary)
- **Repeat Penalty**: 1.0 (no penalty)

**Use Cases**:
- Privacy-sensitive data
- Offline operation
- Quick factual queries
- Cost-sensitive scenarios

### Seeding Logic

```typescript
for (const persona of defaultPersonas) {
  const exists = ensurePersona.get(persona.id)
  if (!exists) {
    insertPersona.run(
      persona.id,
      persona.name,
      persona.prompt,
      persona.description,
      persona.icon,
      persona.category,
      persona.temperature,
      persona.maxTokens,
      persona.topP,
      persona.repeatPenalty,
      persona.is_default
    )
    console.log(`🌱 Seeded default persona: ${persona.id}`)
  }
}
```

**Flow**:
1. Check if persona exists (by ID)
2. If not exists → Insert persona
3. If exists → Skip (idempotent)
4. Log when seeded

**Idempotent**: Safe to run multiple times (won't duplicate).

---

## Eldercare Tables

### Vitals Table

```typescript
db.exec(`
CREATE TABLE IF NOT EXISTS vitals (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  weight_kg REAL,
  glucose_am INTEGER,
  glucose_pm INTEGER,
  recorded_date TEXT NOT NULL,
  notes TEXT,
  active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);
`)
```

**Purpose**: Track patient health metrics over time.

**Schema**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | TEXT | PRIMARY KEY | Unique vital record ID |
| `patient_id` | TEXT | NOT NULL, FK → patients.id | Patient reference |
| `weight_kg` | REAL | - | Weight in kilograms |
| `glucose_am` | INTEGER | - | Morning glucose (mg/dL) |
| `glucose_pm` | INTEGER | - | Evening glucose (mg/dL) |
| `recorded_date` | TEXT | NOT NULL | Date of measurement (YYYY-MM-DD) |
| `notes` | TEXT | - | Additional notes |
| `active` | INTEGER | DEFAULT 1 | Soft delete flag (1=active, 0=deleted) |
| `created_at` | TEXT | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| `updated_at` | TEXT | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

**Foreign Key**:
```sql
FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
```

**Example Data**:
```json
{
  "id": "vital_001",
  "patient_id": "patient_123",
  "weight_kg": 72.5,
  "glucose_am": 95,
  "glucose_pm": 110,
  "recorded_date": "2025-10-28",
  "notes": "Patient feeling well",
  "active": 1,
  "created_at": "2025-10-28T08:00:00.000Z",
  "updated_at": "2025-10-28T08:00:00.000Z"
}
```

### Eldercare Tables Verification

```typescript
const eldercareTablesExist = db.prepare(`
  SELECT name FROM sqlite_master 
  WHERE type='table' AND name='patients'
`).get()

if (eldercareTablesExist) {
  console.log('✅ Eldercare tables found - database is ready!')
} else {
  console.log('⚠️  Eldercare tables not found - they may need to be created manually')
}
```

**Purpose**: Verify that eldercare schema migration has been applied.

**What It Checks**:
- Query `sqlite_master` (SQLite system table)
- Look for `patients` table
- If found → eldercare schema is complete
- If not found → schema migration needed

**Note**: The actual eldercare tables (patients, medications, appointments, etc.) are created by a separate migration file (`001-eldercare-schema.ts`).

---

## Initialization Sequence

### Complete Flow

```
1. Module Import (side effect)
       ↓
2. Resolve database path
       ↓
3. Create database file if missing
       ↓
4. Create sessions table
       ↓
5. Create messages table
       ↓
6. Create personas table
       ↓
7. Create conversation_summaries table
       ↓
8. Create semantic_pins table
       ↓
9. Run column migrations (10 columns)
       ↓
10. Add foreign key to messages (if missing)
       ↓
11. Create indexes on messages
       ↓
12. Seed default personas (2 personas)
       ↓
13. Create vitals table
       ↓
14. Verify eldercare tables exist
       ↓
15. Log completion
       ↓
16. Database ready for use!
```

### Console Output (Fresh Install)

```
Created new database file: /path/to/kalito.db
✅ Added importance_score column
✅ Added suggested_models column
✅ Added temperature column
✅ Added maxTokens column
✅ Added category column
✅ Added topP column
✅ Added stopSequences column
✅ Added repeatPenalty column
✅ Added is_default column
✅ Added saved column
🌱 Seeded default persona: default-cloud
🌱 Seeded default persona: default-local
✅ Database initialized at: /path/to/kalito.db
✅ Eldercare tables found - database is ready!
✅ Database initialization completed!
```

### Console Output (Existing Database)

```
✅ Database initialized at: /path/to/kalito.db
✅ Eldercare tables found - database is ready!
✅ Database initialization completed!
```

**Why Minimal?**
- Tables already exist (IF NOT EXISTS)
- Columns already exist (try/catch)
- Personas already exist (check before insert)
- Idempotent operations

---

## Database Schema Diagram

### Entity Relationship Diagram

```
┌─────────────────┐
│    sessions     │
├─────────────────┤
│ id (PK)         │◄─────────┐
│ name            │          │
│ model           │          │
│ recap           │          │
│ persona_id      │          │
│ created_at      │          │
│ updated_at      │          │
│ saved           │          │
└─────────────────┘          │
        ▲                    │
        │                    │
        │ ON DELETE CASCADE  │
        │                    │
┌───────┴─────────┐          │
│    messages     │          │
├─────────────────┤          │
│ id (PK)         │          │
│ session_id (FK) │──────────┘
│ role            │
│ text            │
│ model_id        │
│ token_usage     │
│ importance_score│
│ created_at      │
└─────────────────┘

┌─────────────────────────┐
│  conversation_summaries │
├─────────────────────────┤
│ id (PK)                 │
│ session_id (FK) ────────┼──► sessions.id
│ summary                 │    (ON DELETE CASCADE)
│ message_count           │
│ start_message_id        │
│ end_message_id          │
│ importance_score        │
│ created_at              │
└─────────────────────────┘

┌─────────────────────┐
│   semantic_pins     │
├─────────────────────┤
│ id (PK)             │
│ session_id (FK) ────┼──► sessions.id
│ content             │    (ON DELETE CASCADE)
│ source_message_id   │
│ importance_score    │
│ pin_type            │
│ created_at          │
└─────────────────────┘

┌─────────────────────┐
│      personas       │
├─────────────────────┤
│ id (PK)             │
│ name                │
│ prompt              │
│ description         │
│ icon                │
│ category            │
│ default_model       │
│ suggested_models    │
│ temperature         │
│ maxTokens           │
│ topP                │
│ repeatPenalty       │
│ stopSequences       │
│ is_default          │
│ created_at          │
│ updated_at          │
└─────────────────────┘

┌─────────────────────┐
│       vitals        │
├─────────────────────┤
│ id (PK)             │
│ patient_id (FK) ────┼──► patients.id
│ weight_kg           │    (ON DELETE CASCADE)
│ glucose_am          │
│ glucose_pm          │
│ recorded_date       │
│ notes               │
│ active              │
│ created_at          │
│ updated_at          │
└─────────────────────┘
```

---

## Best Practices

### 1. Idempotent Migrations

```typescript
// ✅ GOOD: Idempotent (safe to run multiple times)
db.exec('CREATE TABLE IF NOT EXISTS sessions (...)')

try {
  db.exec('ALTER TABLE messages ADD COLUMN importance_score REAL')
} catch {
  // Column already exists, ignore
}

// ❌ BAD: Not idempotent (fails on second run)
db.exec('CREATE TABLE sessions (...)')  // Error if exists
db.exec('ALTER TABLE messages ADD COLUMN importance_score REAL')  // Error if exists
```

### 2. Foreign Key Cascade Deletes

```typescript
// ✅ GOOD: Cascade delete (clean up related data)
FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE

// When session deleted:
// - All messages automatically deleted
// - All summaries automatically deleted
// - All pins automatically deleted

// ❌ BAD: No cascade (orphaned records)
FOREIGN KEY (session_id) REFERENCES sessions(id)

// When session deleted:
// - Messages remain (orphaned)
// - Database inconsistency
```

### 3. Default Values

```typescript
// ✅ GOOD: Provide defaults for optional fields
importance_score REAL DEFAULT 0.5
is_default INTEGER DEFAULT 0
active INTEGER DEFAULT 1

// Benefits:
// - INSERT doesn't need to specify
// - Consistent default behavior
// - Easier queries (no NULL checks)
```

### 4. Timestamps

```typescript
// ✅ GOOD: Track creation and updates
created_at TEXT DEFAULT CURRENT_TIMESTAMP
updated_at TEXT DEFAULT CURRENT_TIMESTAMP

// Benefits:
// - Audit trail
// - Debugging (when was this created?)
// - Sort by recency
```

### 5. Soft Deletes

```typescript
// ✅ GOOD: Soft delete with active flag
active INTEGER DEFAULT 1

// Delete: UPDATE vitals SET active = 0
// Query: SELECT * FROM vitals WHERE active = 1

// Benefits:
// - Recoverable deletions
// - Audit history
// - Data preservation
```

---

## Testing Examples

### Schema Tests

```typescript
describe('Database Schema', () => {
  it('should have sessions table', () => {
    const tables = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='sessions'
    `).all()
    
    expect(tables.length).toBe(1)
  })

  it('should have messages table with FK', () => {
    const fks = db.prepare(`
      PRAGMA foreign_key_list(messages)
    `).all()
    
    const sessionFK = fks.find(fk => fk.table === 'sessions')
    expect(sessionFK).toBeDefined()
    expect(sessionFK.on_delete).toBe('CASCADE')
  })

  it('should have indexes on messages', () => {
    const indexes = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='index' AND tbl_name='messages'
    `).all()
    
    const indexNames = indexes.map(i => i.name)
    expect(indexNames).toContain('idx_messages_session_created')
    expect(indexNames).toContain('idx_messages_session_importance_created')
  })
})
```

### Seeding Tests

```typescript
describe('Default Personas', () => {
  it('should seed default cloud persona', () => {
    const persona = db.prepare(`
      SELECT * FROM personas WHERE id = 'default-cloud'
    `).get()
    
    expect(persona).toBeDefined()
    expect(persona.name).toBe('Default Cloud Assistant')
    expect(persona.category).toBe('cloud')
    expect(persona.is_default).toBe(1)
  })

  it('should seed default local persona', () => {
    const persona = db.prepare(`
      SELECT * FROM personas WHERE id = 'default-local'
    `).get()
    
    expect(persona).toBeDefined()
    expect(persona.name).toBe('Default Local Assistant')
    expect(persona.category).toBe('local')
    expect(persona.is_default).toBe(1)
  })

  it('should not duplicate personas on re-run', () => {
    // Re-import init.ts (runs seeding again)
    require('./init')
    
    const count = db.prepare(`
      SELECT COUNT(*) as count FROM personas 
      WHERE id IN ('default-cloud', 'default-local')
    `).get()
    
    expect(count.count).toBe(2)  // Still only 2, not 4
  })
})
```

### Migration Tests

```typescript
describe('Migrations', () => {
  it('should add importance_score to messages', () => {
    const columns = db.prepare('PRAGMA table_info(messages)').all()
    const hasColumn = columns.some(c => c.name === 'importance_score')
    expect(hasColumn).toBe(true)
  })

  it('should add persona settings columns', () => {
    const columns = db.prepare('PRAGMA table_info(personas)').all()
    const columnNames = columns.map(c => c.name)
    
    expect(columnNames).toContain('temperature')
    expect(columnNames).toContain('maxTokens')
    expect(columnNames).toContain('topP')
    expect(columnNames).toContain('repeatPenalty')
  })

  it('should add saved flag to sessions', () => {
    const columns = db.prepare('PRAGMA table_info(sessions)').all()
    const savedColumn = columns.find(c => c.name === 'saved')
    
    expect(savedColumn).toBeDefined()
    expect(savedColumn.dflt_value).toBe('0')
  })
})
```

---

## Troubleshooting

### Issue 1: Column Already Exists

**Error**: `duplicate column name: importance_score`

**Cause**: Migration trying to add column that already exists

**Solution**: Already handled by try/catch
```typescript
try {
  db.exec('ALTER TABLE messages ADD COLUMN importance_score REAL')
} catch {
  // Silently ignore (column exists)
}
```

### Issue 2: Foreign Key Constraint Failed

**Error**: `FOREIGN KEY constraint failed`

**Cause**: Trying to insert message with non-existent session_id

**Solution**: Create session first
```typescript
// ✅ CORRECT ORDER
db.prepare('INSERT INTO sessions (id, name) VALUES (?, ?)').run('session1', 'Chat')
db.prepare('INSERT INTO messages (session_id, text) VALUES (?, ?)').run('session1', 'Hello')

// ❌ WRONG ORDER
db.prepare('INSERT INTO messages (session_id, text) VALUES (?, ?)').run('session1', 'Hello')
// Error: session1 doesn't exist yet
```

### Issue 3: Database Locked

**Error**: `database is locked`

**Cause**: Another process has exclusive lock

**Solution**: Close other connections or wait
```typescript
// Check for other connections
lsof /path/to/kalito.db

// Or use WAL mode (already configured in db.ts)
db.pragma('journal_mode = WAL')
```

### Issue 4: Missing Eldercare Tables

**Warning**: `⚠️ Eldercare tables not found`

**Cause**: Eldercare migration hasn't been applied

**Solution**: Run eldercare migration
```bash
# Eldercare tables created by migration file
# /backend/db/migrations/001-eldercare-schema.ts
npm run migrate
```

---

## Summary

The **Database Initialization Module** ensures database is properly set up:

**Core Responsibilities**:
- **Schema Creation**: 5 core tables + 1 eldercare table
- **Migrations**: 10 column additions (incremental schema evolution)
- **Foreign Keys**: Add FK constraints with cascade deletes
- **Indexes**: Performance optimization for queries
- **Seeding**: 2 default personas (cloud + local)
- **Verification**: Check eldercare tables exist

**Tables Created**:
1. **sessions** - Chat sessions/conversations
2. **messages** - Individual messages in sessions
3. **personas** - AI assistants with custom behavior
4. **conversation_summaries** - AI-generated summaries
5. **semantic_pins** - Important pinned information
6. **vitals** - Patient health metrics (eldercare)

**Key Features**:
- **Idempotent**: Safe to run multiple times
- **Incremental**: Migrations add new columns without data loss
- **Referential Integrity**: Foreign keys with cascade deletes
- **Performance**: Indexes on frequently queried columns
- **Seeded Data**: Default personas ready to use

**Migration Pattern**:
- Table recreation for FK additions
- Try/catch for column additions
- Utility functions (columnExists, tableHasFK)
- Non-destructive (preserves data)

**Default Personas**:
- **default-cloud**: General-purpose cloud assistant
- **default-local**: Privacy-focused local assistant

**Best Practices**:
- IF NOT EXISTS for tables
- DEFAULT values for optional fields
- CASCADE DELETE for cleanup
- Soft deletes (active flag)
- Timestamps for audit trail

**Production Status**: Complete initialization system with robust migrations, seeded data, and comprehensive schema for both chat and eldercare functionality.
