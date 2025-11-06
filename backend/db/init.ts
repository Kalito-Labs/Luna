/// <reference types="node" />
import * as path from 'path'
import * as fs from 'fs'
import { db } from './db' // Import the shared database connection

// Path to database file - relative to this file's location
const dbPath = path.resolve(__dirname, './kalito.db')

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
  { column: 'primary_doctor_id', ddl: 'ALTER TABLE patients ADD COLUMN primary_doctor_id TEXT' },
]

for (const { column, ddl } of migrations) {
  try {
    db.exec(ddl)
    console.log(`✅ Added ${column} column`)
  } catch {
    // ignore if column exists
  }
}

// Migrate patients table to use primary_doctor_id instead of manual doctor fields
if (!columnExists('patients', 'primary_doctor_id')) {
  console.log('🔄 Migrating patients table to use provider references...')
  
  db.transaction(() => {
    db.pragma('foreign_keys = OFF')

    // Create new patients table with correct schema
    db.exec(`
      CREATE TABLE IF NOT EXISTS patients_new (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        date_of_birth TEXT,
        relationship TEXT,
        gender TEXT,
        phone TEXT,
        emergency_contact_name TEXT,
        emergency_contact_phone TEXT,
        primary_doctor_id TEXT,
        insurance_provider TEXT,
        insurance_id TEXT,
        notes TEXT,
        active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (primary_doctor_id) REFERENCES providers(id)
      );
    `)

    // Copy data from old table (excluding the manual doctor fields)
    db.exec(`
      INSERT INTO patients_new (
        id, name, date_of_birth, relationship, gender, phone,
        emergency_contact_name, emergency_contact_phone,
        insurance_provider, insurance_id, notes, active, created_at, updated_at
      )
      SELECT 
        id, name, date_of_birth, relationship, gender, phone,
        emergency_contact_name, emergency_contact_phone,
        insurance_provider, insurance_id, notes, active, created_at, updated_at
      FROM patients;
    `)

    // Drop old table and rename new one
    db.exec(`DROP TABLE patients;`)
    db.exec(`ALTER TABLE patients_new RENAME TO patients;`)

    db.pragma('foreign_keys = ON')
  })()
  
  console.log('✅ Migration completed: patients table now uses provider references')
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
// Eldercare Tables
// ---------------------------------------------------------------------

// Vitals table for tracking patient health metrics
db.exec(`
CREATE TABLE IF NOT EXISTS vitals (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  weight_lbs REAL,
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

// ---------------------------------------------------------------------
// Migrations
// ---------------------------------------------------------------------

// Migration: Rename weight_kg to weight_lbs in vitals table
try {
  // Check if the old column exists
  const columnCheck = db.prepare(`
    SELECT COUNT(*) as count 
    FROM pragma_table_info('vitals') 
    WHERE name='weight_kg'
  `).get() as { count: number }
  
  if (columnCheck.count > 0) {
    console.log('🔄 Migrating weight_kg to weight_lbs...')
    
    // SQLite doesn't support RENAME COLUMN directly in older versions
    // We need to recreate the table
    db.exec(`
      BEGIN TRANSACTION;
      
      -- Create new table with weight_lbs
      CREATE TABLE vitals_new (
        id TEXT PRIMARY KEY,
        patient_id TEXT NOT NULL,
        weight_lbs REAL,
        glucose_am INTEGER,
        glucose_pm INTEGER,
        recorded_date TEXT NOT NULL,
        notes TEXT,
        active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
      );
      
      -- Copy data from old table to new table (renaming weight_kg to weight_lbs)
      INSERT INTO vitals_new (id, patient_id, weight_lbs, glucose_am, glucose_pm, recorded_date, notes, active, created_at, updated_at)
      SELECT id, patient_id, weight_kg, glucose_am, glucose_pm, recorded_date, notes, active, created_at, updated_at
      FROM vitals;
      
      -- Drop old table
      DROP TABLE vitals;
      
      -- Rename new table to original name
      ALTER TABLE vitals_new RENAME TO vitals;
      
      COMMIT;
    `)
    
    console.log('✅ Migration completed: weight_kg → weight_lbs')
  }
} catch (error) {
  console.error('⚠️  Migration error:', error)
}

// ---------------------------------------------------------------------
// Check Eldercare Tables
// ---------------------------------------------------------------------

// Check if eldercare tables exist (they should already be there)
const eldercareTablesExist = db.prepare(`
  SELECT name FROM sqlite_master 
  WHERE type='table' AND name='patients'
`).get()

if (eldercareTablesExist) {
  console.log('✅ Eldercare tables found - database is ready!')
} else {
  console.log('⚠️  Eldercare tables not found - they may need to be created manually')
}

console.log('✅ Database initialization completed!')
