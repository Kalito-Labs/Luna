/**
 * Migration 005: Remove vitals Table
 * 
 * This migration drops the vitals table as the feature is no longer needed.
 * The vitals feature was designed for health metrics tracking (weight, glucose)
 * but is not being used in the application.
 * 
 * Date: November 23, 2025
 */

import { db } from '../db'

export function migrate005_removeVitals() {
  console.log('🚀 Starting Migration 005: Remove vitals Table')

  db.transaction(() => {
    console.log('  📋 Dropping vitals table...')
    
    // Check if table exists first
    const tableExists = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='vitals'
    `).get()

    if (tableExists) {
      db.exec('DROP TABLE vitals')
      console.log('  ✅ Dropped vitals table')
    } else {
      console.log('  ℹ️  Vitals table does not exist (already removed)')
    }

    console.log('✅ Migration 005 completed successfully!')
  })()
}

// Run migration if executed directly
if (require.main === module) {
  try {
    migrate005_removeVitals()
    console.log('🎉 Migration completed successfully')
    process.exit(0)
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}
