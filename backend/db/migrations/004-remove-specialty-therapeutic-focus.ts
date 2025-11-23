/**
 * Migration 004: Remove specialty and therapeutic_focus Columns
 * 
 * This migration removes the specialty and therapeutic_focus columns from:
 * 1. personas table
 * 2. persona_templates table
 * 
 * These fields have been deprecated as they provide no functional value:
 * - Not used in AI behavior or prompt injection
 * - No filtering or search functionality
 * - Purely cosmetic metadata
 * - Add unnecessary complexity
 * 
 * Date: November 23, 2025
 */

import { db } from '../db'

export function migrate004_removeSpecialtyTherapeuticFocus() {
  console.log('🚀 Starting Migration 004: Remove specialty and therapeutic_focus Columns')

  db.transaction(() => {
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
  })()
}

// Run migration if executed directly
if (require.main === module) {
  try {
    migrate004_removeSpecialtyTherapeuticFocus()
    console.log('🎉 Migration completed successfully')
    process.exit(0)
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}
