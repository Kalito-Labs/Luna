#!/usr/bin/env ts-node

import path from 'path'
import fs from 'fs'
import Database from 'better-sqlite3'
import { migrateToEldercare, validateEldercareMigration, backupDatabase } from './migrations/001-eldercare-schema'

/**
 * Script to run the eldercare database migration
 * 
 * Usage:
 *   npm run migrate:eldercare
 *   or
 *   npx ts-node run-eldercare-migration.ts
 */

const DB_PATH = path.join(__dirname, 'kalito.db')
const BACKUP_PATH = path.join(__dirname, '../../backups', `kalito.db.eldercare-migration-${new Date().toISOString().replace(/[:.]/g, '-')}.bak`)

async function runEldercareMigration() {
  console.log('🏥 Starting Eldercare Database Migration')
  console.log('=====================================')
  
  // Check if database file exists
  if (!fs.existsSync(DB_PATH)) {
    console.error(`❌ Database file not found at: ${DB_PATH}`)
    console.error('Please make sure your database exists before running the migration.')
    process.exit(1)
  }
  
  console.log(`📂 Database path: ${DB_PATH}`)
  
  try {
    // Open database connection
    const db = new Database(DB_PATH)
    
    // Enable foreign keys
    db.pragma('foreign_keys = ON')
    
    // Create backup directory if it doesn't exist
    const backupDir = path.dirname(BACKUP_PATH)
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true })
    }
    
    // Create backup before migration
    console.log('💾 Creating backup before migration...')
    backupDatabase(db, BACKUP_PATH)
    
    // Run the migration
    console.log('🔄 Running eldercare migration...')
    migrateToEldercare(db)
    
    // Validate the migration
    console.log('🔍 Validating migration...')
    const isValid = validateEldercareMigration(db)
    
    if (!isValid) {
      console.error('❌ Migration validation failed!')
      console.error('Please check the errors above and restore from backup if needed.')
      console.error(`Backup location: ${BACKUP_PATH}`)
      process.exit(1)
    }
    
    // Close database connection
    db.close()
    
    console.log('')
    console.log('🎉 Eldercare Migration Completed Successfully!')
    console.log('=============================================')
    console.log('')
    console.log('✅ New tables created:')
    console.log('   • patients - Core patient information')
    console.log('   • medical_records - Health records and notes')
    console.log('   • medications - Medication tracking')
    console.log('   • healthcare_providers - Doctor directory')
    console.log('   • appointments - Appointment scheduling')
    console.log('   • vitals - Vital signs measurements')
    console.log('   • medication_logs - Medication adherence tracking')
    console.log('')
    console.log('✅ Extended existing tables:')
    console.log('   • sessions - Added eldercare session types')
    console.log('   • personas - Added eldercare specialist personas')
    console.log('   • semantic_pins - Added medical context pins')
    console.log('')
    console.log('✅ Added eldercare personas:')
    console.log('   • Medical Documentation Assistant 📋')
    console.log('   • Medication Manager 💊')
    console.log('   • Care Coordinator 🗓️')
    console.log('   • Emergency Information Assistant 🚨')
    console.log('')
    console.log(`💾 Backup saved to: ${BACKUP_PATH}`)
    console.log('')
    console.log('🚀 You can now start using the eldercare features!')
    console.log('   Next: Create Vue.js components for data entry forms')
    
  } catch (error) {
    console.error('❌ Migration failed with error:', error)
    console.error(`💾 Backup is available at: ${BACKUP_PATH}`)
    console.error('You can restore from backup if needed.')
    process.exit(1)
  }
}

// Run the migration when this script is executed directly
runEldercareMigration().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})

export { runEldercareMigration }