/**
 * Migration Script: LocalStorage to Database
 * 
 * This script helps migrate therapy records from browser localStorage
 * to the SQLite database so AI models can reference the data.
 * 
 * For single-user app: Automatically maps records to Kaleb's patient ID
 * 
 * Usage:
 * 1. Export localStorage data from browser console:
 *    JSON.stringify(localStorage.getItem('cbt-records'))
 * 2. Save the JSON string to a file or pass as argument
 * 3. Run: pnpm tsx backend/scripts/migrate-localstorage-to-db.ts <json-data>
 */

import { therapyRecordsService } from '../logic/therapyRecordsService'
import { db } from '../db/db'

interface LocalStorageRecord {
  id: string
  patient_id: string
  session_id?: string
  therapy_type: 'cbt' | 'act' | 'dbt'
  data: Record<string, unknown>
  created_at: string
  updated_at: string
}

/**
 * Get Kaleb's patient ID from the database
 */
function getKalebPatientId(): string {
  const stmt = db.prepare(`
    SELECT id FROM patients 
    WHERE LOWER(name) LIKE '%kaleb%' 
    LIMIT 1
  `)
  const result = stmt.get() as { id: string } | undefined
  
  if (!result) {
    throw new Error('Patient "Kaleb" not found in database. Please ensure the patient profile exists.')
  }
  
  console.log(`✅ Found patient: Kaleb (ID: ${result.id})`)
  return result.id
}

async function migrateRecords(jsonData: string) {
  try {
    console.log('🔄 Starting migration...')
    
    // Get Kaleb's actual patient ID from database
    const kalebPatientId = getKalebPatientId()
    
    const records: LocalStorageRecord[] = JSON.parse(jsonData)
    
    if (!Array.isArray(records)) {
      throw new Error('Expected an array of records')
    }

    console.log(`📊 Found ${records.length} records to migrate`)

    let successCount = 0
    let failCount = 0
    let skippedCount = 0

    for (const record of records) {
      try {
        // Check if record already exists in database
        const existing = therapyRecordsService.getRecord(record.id)
        if (existing) {
          console.log(`⏭️  Skipping existing record: ${record.id}`)
          skippedCount++
          continue
        }

        // Override patient_id to use Kaleb's actual ID from database
        const correctPatientId = kalebPatientId

        // For local-* IDs, create with new server-generated ID
        if (record.id.startsWith('local-')) {
          console.log(`🔄 Migrating local record: ${record.id}`)
          const newRecord = therapyRecordsService.createRecord({
            patient_id: correctPatientId,
            session_id: record.session_id,
            therapy_type: record.therapy_type,
            data: record.data
          })
          console.log(`✅ Migrated: ${record.id} → ${newRecord.id}`)
          successCount++
        } else {
          // Non-local ID, create with new server-generated ID
          console.log(`📝 Migrating record: ${record.id}`)
          const newRecord = therapyRecordsService.createRecord({
            patient_id: correctPatientId,
            session_id: record.session_id,
            therapy_type: record.therapy_type,
            data: record.data
          })
          console.log(`✅ Migrated: ${record.id} → ${newRecord.id}`)
          successCount++
        }
      } catch (error) {
        console.error(`❌ Failed to migrate record ${record.id}:`, error)
        failCount++
      }
    }

    console.log('\n📈 Migration Summary:')
    console.log(`   ✅ Successfully migrated: ${successCount}`)
    console.log(`   ⏭️  Skipped (already exists): ${skippedCount}`)
    console.log(`   ❌ Failed: ${failCount}`)
    console.log(`   📊 Total processed: ${records.length}`)
    console.log(`   🆔 All records assigned to: Kaleb (${kalebPatientId})`)

  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

// Main execution
if (process.argv.length < 3) {
  console.log('Usage:')
  console.log('  pnpm tsx backend/scripts/migrate-localstorage-to-db.ts \'<json-data>\'')
  console.log('')
  console.log('Example:')
  console.log('  1. In browser console, run: JSON.stringify(JSON.parse(localStorage.getItem("cbt-records")))')
  console.log('  2. Copy the output')
  console.log('  3. Run: pnpm tsx backend/scripts/migrate-localstorage-to-db.ts \'[{"id":"..."}]\'')
  console.log('')
  console.log('Or save to a file and run:')
  console.log('  pnpm tsx backend/scripts/migrate-localstorage-to-db.ts "$(cat records.json)"')
  process.exit(1)
}

const jsonData = process.argv[2]
migrateRecords(jsonData)
  .then(() => {
    console.log('✅ Migration complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  })
