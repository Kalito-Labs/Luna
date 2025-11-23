/**
 * Run Migration 005: Remove vitals Table
 * 
 * This script drops the vitals table from the database.
 */

const path = require('path')
const Database = require('better-sqlite3')

// Connect to database
const dbPath = path.resolve(__dirname, '../kalito.db')
const db = new Database(dbPath)

console.log(`📂 Connected to database at: ${dbPath}`)

// Migration function
function migrate005_removeVitals() {
  console.log('🚀 Starting Migration 005: Remove vitals Table')

  const transaction = db.transaction(() => {
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
  })

  transaction()
}

// Run migration
try {
  migrate005_removeVitals()
  
  // Verify the changes
  console.log('\n📊 Verifying migration results...')
  
  const tables = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name NOT LIKE 'sqlite_%'
    ORDER BY name
  `).all()
  
  console.log('\nRemaining tables:')
  tables.forEach(table => console.log(`  - ${table.name}`))
  
  const vitalsExists = tables.find(t => t.name === 'vitals')
  if (!vitalsExists) {
    console.log('\n✅ Verification passed: vitals table successfully removed')
  } else {
    console.log('\n❌ Verification failed: vitals table still exists')
  }
  
  db.close()
  console.log('\n🎉 Migration completed successfully!')
  process.exit(0)
} catch (error) {
  console.error('\n❌ Migration failed:', error)
  db.close()
  process.exit(1)
}
