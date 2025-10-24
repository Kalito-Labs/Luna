import { Database } from 'better-sqlite3'

/**
 * Migration 002: Add doctor contact fields to patients table
 * 
 * Adds doctor_address and doctor_phone columns to patients table
 * to support storing detailed doctor contact information.
 */

export function addDoctorContactFields(db: Database): void {
  console.log('🏥 Running migration 002: Add doctor contact fields...')

  db.transaction(() => {
    // Check if columns already exist
    const tableInfo = db.prepare('PRAGMA table_info(patients)').all() as Array<{ name: string }>
    const columnNames = tableInfo.map(col => col.name)
    
    if (!columnNames.includes('doctor_address')) {
      console.log('  📋 Adding doctor_address column to patients table...')
      db.exec(`
        ALTER TABLE patients 
        ADD COLUMN doctor_address TEXT
      `)
    } else {
      console.log('  ✓ doctor_address column already exists')
    }
    
    if (!columnNames.includes('doctor_phone')) {
      console.log('  📋 Adding doctor_phone column to patients table...')
      db.exec(`
        ALTER TABLE patients 
        ADD COLUMN doctor_phone TEXT
      `)
    } else {
      console.log('  ✓ doctor_phone column already exists')
    }
    
    console.log('✅ Migration 002 completed successfully!')
  })()
}
