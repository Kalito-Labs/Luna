/**
 * Migration 006: Add mood_scale and sleep_hours to journal_entries
 * 
 * Adds mental health tracking fields to journal entries table
 * to support mood intensity (1-10 scale) and sleep tracking (hours)
 */

import { db } from '../db'

export function migrate() {
  console.log('Running migration 006: Add journal tracking fields...')

  // Check if columns already exist
  const tableInfo = db.prepare('PRAGMA table_info(journal_entries)').all() as any[]
  const columnNames = tableInfo.map(col => col.name)

  // Add mood_scale column if it doesn't exist
  if (!columnNames.includes('mood_scale')) {
    db.exec(`
      ALTER TABLE journal_entries 
      ADD COLUMN mood_scale INTEGER;
    `)
    console.log('✅ Added mood_scale column to journal_entries')
  } else {
    console.log('⏭️  mood_scale column already exists')
  }

  // Add sleep_hours column if it doesn't exist
  if (!columnNames.includes('sleep_hours')) {
    db.exec(`
      ALTER TABLE journal_entries 
      ADD COLUMN sleep_hours REAL;
    `)
    console.log('✅ Added sleep_hours column to journal_entries')
  } else {
    console.log('⏭️  sleep_hours column already exists')
  }

  console.log('✅ Migration 006 completed successfully')
}

// Self-executing migration
migrate()
