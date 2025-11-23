/**
 * Migration 003 Runner: Remove color_theme Column
 * 
 * Removes the color_theme column from personas and persona_templates tables.
 * Run with: node backend/db/migrations/run-migration-003.js
 */

const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')

const dbPath = path.join(__dirname, '../kalito.db')

console.log('🔍 Database path:', dbPath)
console.log('📊 Database exists:', fs.existsSync(dbPath))

if (!fs.existsSync(dbPath)) {
  console.error('❌ Database file not found!')
  process.exit(1)
}

const db = new Database(dbPath)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

console.log('🚀 Starting Migration 003: Remove color_theme Column')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

try {
  db.exec('BEGIN TRANSACTION')

  // Step 1: Remove color_theme from personas table
  console.log('\\n📋 Step 1: Removing color_theme from personas table...')
  
  db.pragma('foreign_keys = OFF')

  // Create new personas table without color_theme
  db.exec(`
    CREATE TABLE personas_new (
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
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      
      -- Therapeutic enhancement fields
      specialty TEXT,
      therapeutic_focus TEXT,
      template_id TEXT,
      created_from TEXT DEFAULT 'manual',
      tags TEXT,
      is_favorite INTEGER DEFAULT 0,
      usage_count INTEGER DEFAULT 0,
      last_used_at TEXT,
      builtin_data_access TEXT,
      
      UNIQUE(category, is_default) ON CONFLICT IGNORE
    )
  `)

  // Copy data from old table (excluding color_theme)
  db.exec(`
    INSERT INTO personas_new (
      id, name, prompt, description, icon, category,
      default_model, suggested_models, temperature, maxTokens, topP, repeatPenalty,
      stopSequences, is_default, created_at, updated_at,
      specialty, therapeutic_focus, template_id, created_from,
      tags, is_favorite, usage_count, last_used_at, builtin_data_access
    )
    SELECT 
      id, name, prompt, description, icon, category,
      default_model, suggested_models, temperature, maxTokens, topP, repeatPenalty,
      stopSequences, is_default, created_at, updated_at,
      specialty, therapeutic_focus, template_id, created_from,
      tags, is_favorite, usage_count, last_used_at, builtin_data_access
    FROM personas
  `)

  // Count records migrated
  const personasCount = db.prepare('SELECT COUNT(*) as count FROM personas_new').get()
  console.log(`  ✅ Migrated ${personasCount.count} personas (color_theme column removed)`)

  // Drop old table and rename new one
  db.exec('DROP TABLE personas')
  db.exec('ALTER TABLE personas_new RENAME TO personas')

  // Step 2: Remove color_theme from persona_templates table
  console.log('\\n📋 Step 2: Removing color_theme from persona_templates table...')
  
  db.exec(`
    CREATE TABLE persona_templates_new (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      icon TEXT NOT NULL,
      specialty TEXT NOT NULL,
      therapeutic_focus TEXT,
      category TEXT NOT NULL,
      prompt_template TEXT NOT NULL,
      temperature REAL DEFAULT 0.7,
      maxTokens INTEGER DEFAULT 1000,
      topP REAL DEFAULT 0.9,
      repeatPenalty REAL DEFAULT 1.1,
      tags TEXT,
      key_features TEXT,
      best_for TEXT,
      therapeutic_approaches TEXT,
      example_datasets TEXT,
      is_system INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      usage_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Copy data from old table (excluding color_theme)
  db.exec(`
    INSERT INTO persona_templates_new (
      id, name, description, icon, specialty, therapeutic_focus,
      category, prompt_template, temperature, maxTokens, topP, repeatPenalty,
      tags, key_features, best_for, therapeutic_approaches, example_datasets,
      is_system, is_active, usage_count, created_at, updated_at
    )
    SELECT 
      id, name, description, icon, specialty, therapeutic_focus,
      category, prompt_template, temperature, maxTokens, topP, repeatPenalty,
      tags, key_features, best_for, therapeutic_approaches, example_datasets,
      is_system, is_active, usage_count, created_at, updated_at
    FROM persona_templates
  `)

  // Count records migrated
  const templatesCount = db.prepare('SELECT COUNT(*) as count FROM persona_templates_new').get()
  console.log(`  ✅ Migrated ${templatesCount.count} persona templates (color_theme column removed)`)

  // Drop old table and rename new one
  db.exec('DROP TABLE persona_templates')
  db.exec('ALTER TABLE persona_templates_new RENAME TO persona_templates')

  db.pragma('foreign_keys = ON')

  db.exec('COMMIT')

  console.log('\\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('✅ Migration 003 completed successfully!')
  console.log('🎉 color_theme column has been removed from all tables')
  
  db.close()
  process.exit(0)

} catch (error) {
  console.error('\\n❌ Migration failed:', error.message)
  db.exec('ROLLBACK')
  db.close()
  process.exit(1)
}
