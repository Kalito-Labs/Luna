/// <reference types="node" />
import * as path from 'path'
import * as fs from 'fs'
import { db } from './db' // Import the shared database connection
import { migrateToEldercare } from './migrations/001-eldercare-schema'
import { addDoctorContactFields } from './migrations/002-add-doctor-fields'

const dbPath = path.resolve(__dirname, __dirname.includes('dist') ? '../../../db/kalito.db' : 'kalito.db')

// Create DB file if it doesn't exist
if (!fs.existsSync(dbPath)) {
  fs.writeFileSync(dbPath, '')
  console.log(`Created new database file: ${dbPath}`)
}

// ---------------------------------------------------------------------
// Core Tables
// ---------------------------------------------------------------------

// Sessions table (with `saved` flag)
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

// Messages table (with FK to sessions, cascade delete)
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

// Personas table
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

// Conversation summaries
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

// Semantic pins
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

// ---------------------------------------------------------------------
// Migrations
// ---------------------------------------------------------------------

function columnExists(table: string, column: string): boolean {
  try {
    const pragma = db.prepare(`PRAGMA table_info(${table})`).all() as any[]
    return pragma.some(c => c.name === column)
  } catch {
    return false
  }
}

function tableHasFK(table: string, refTable: string): boolean {
  try {
    const fks = db.prepare(`PRAGMA foreign_key_list(${table})`).all() as any[]
    return fks.some(fk => fk.table === refTable)
  } catch {
    return false
  }
}

// Add new columns if missing
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

for (const { column, ddl } of migrations) {
  try {
    db.exec(ddl)
    console.log(`✅ Added ${column} column`)
  } catch {
    // ignore if column exists
  }
}

// Ensure messages has FK to sessions
if (!tableHasFK('messages', 'sessions')) {
  db.transaction(() => {
    db.pragma('foreign_keys = OFF')

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

    db.exec(`
      INSERT INTO messages_new (id, session_id, role, text, model_id, token_usage, importance_score, created_at)
      SELECT id, session_id, role, text, model_id, token_usage, importance_score, created_at FROM messages;
    `)

    db.exec(`DROP TABLE messages;`)
    db.exec(`ALTER TABLE messages_new RENAME TO messages;`)

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

// ---------------------------------------------------------------------
// Seed Default Personas
// ---------------------------------------------------------------------

const ensurePersona = db.prepare('SELECT id FROM personas WHERE id = ?')
const insertPersona = db.prepare(`
  INSERT INTO personas (
    id, name, prompt, description, icon, category,
    temperature, maxTokens, topP, repeatPenalty, is_default
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`)

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

// ---------------------------------------------------------------------

console.log('✅ Database initialized at:', dbPath)

// ---------------------------------------------------------------------
// Run Eldercare Migrations
// ---------------------------------------------------------------------

// Run eldercare migrations if tables don't exist
const eldercareTablesExist = db.prepare(`
  SELECT name FROM sqlite_master 
  WHERE type='table' AND name='patients'
`).get()

if (!eldercareTablesExist) {
  console.log('🏥 Running eldercare migrations for the first time...')
  migrateToEldercare(db)
}

// Always run the doctor fields migration (it checks if columns exist)
addDoctorContactFields(db)

console.log('✅ All migrations completed!')
