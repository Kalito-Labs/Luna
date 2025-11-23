/**
 * Run Migration 004: Remove specialty and therapeutic_focus Columns
 * 
 * This script runs the migration to remove specialty and therapeutic_focus
 * from the personas and persona_templates tables.
 */

const path = require('path')
const Database = require('better-sqlite3')

// Connect to database
const dbPath = path.resolve(__dirname, '../kalito.db')
const db = new Database(dbPath)

console.log(`📂 Connected to database at: ${dbPath}`)

// Migration function
function migrate004_removeSpecialtyTherapeuticFocus() {
  console.log('🚀 Starting Migration 004: Remove specialty and therapeutic_focus Columns')

  const transaction = db.transaction(() => {
    console.log('  📋 Removing specialty and therapeutic_focus from personas table...')
    
    db.pragma('foreign_keys = OFF')

    // Step 1: Recreate personas table without specialty and therapeutic_focus
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
        
        -- Therapeutic enhancement fields (reduced)
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

    // Copy data from old table (excluding specialty and therapeutic_focus)
    db.exec(`
      INSERT INTO personas_new (
        id, name, prompt, description, icon, category,
        default_model, suggested_models, temperature, maxTokens, topP, repeatPenalty,
        stopSequences, is_default, created_at, updated_at,
        template_id, created_from,
        tags, is_favorite, usage_count, last_used_at, builtin_data_access
      )
      SELECT 
        id, name, prompt, description, icon, category,
        default_model, suggested_models, temperature, maxTokens, topP, repeatPenalty,
        stopSequences, is_default, created_at, updated_at,
        template_id, created_from,
        tags, is_favorite, usage_count, last_used_at, builtin_data_access
      FROM personas
    `)

    // Drop old table and rename new one
    db.exec('DROP TABLE personas')
    db.exec('ALTER TABLE personas_new RENAME TO personas')

    console.log('  ✅ Removed specialty and therapeutic_focus from personas table')

    // Step 2: Recreate persona_templates table without specialty and therapeutic_focus
    console.log('  📋 Removing specialty and therapeutic_focus from persona_templates table...')
    
    db.exec(`
      CREATE TABLE persona_templates_new (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        icon TEXT NOT NULL,
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

    // Copy data from old table (excluding specialty and therapeutic_focus)
    db.exec(`
      INSERT INTO persona_templates_new (
        id, name, description, icon,
        category, prompt_template, temperature, maxTokens, topP, repeatPenalty,
        tags, key_features, best_for, therapeutic_approaches, example_datasets,
        is_system, is_active, usage_count, created_at, updated_at
      )
      SELECT 
        id, name, description, icon,
        category, prompt_template, temperature, maxTokens, topP, repeatPenalty,
        tags, key_features, best_for, therapeutic_approaches, example_datasets,
        is_system, is_active, usage_count, created_at, updated_at
      FROM persona_templates
    `)

    // Drop old table and rename new one
    db.exec('DROP TABLE persona_templates')
    db.exec('ALTER TABLE persona_templates_new RENAME TO persona_templates')

    console.log('  ✅ Removed specialty and therapeutic_focus from persona_templates table')

    db.pragma('foreign_keys = ON')

    console.log('✅ Migration 004 completed successfully!')
  })

  transaction()
}

// Run migration
try {
  migrate004_removeSpecialtyTherapeuticFocus()
  
  // Verify the changes
  console.log('\n📊 Verifying migration results...')
  
  const personasSchema = db.pragma('table_info(personas)')
  console.log('\npersonas table columns:', personasSchema.map(c => c.name).join(', '))
  
  const templatesSchema = db.pragma('table_info(persona_templates)')
  console.log('persona_templates table columns:', templatesSchema.map(c => c.name).join(', '))
  
  const personaCount = db.prepare('SELECT COUNT(*) as count FROM personas').get()
  const templateCount = db.prepare('SELECT COUNT(*) as count FROM persona_templates').get()
  
  console.log(`\n✅ Data integrity check:`)
  console.log(`   - ${personaCount.count} personas preserved`)
  console.log(`   - ${templateCount.count} templates preserved`)
  
  db.close()
  console.log('\n🎉 Migration completed successfully!')
  process.exit(0)
} catch (error) {
  console.error('\n❌ Migration failed:', error)
  db.close()
  process.exit(1)
}
