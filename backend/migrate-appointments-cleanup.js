const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Use consistent path resolution logic matching the application
const currentDir = process.cwd();
const isInBackendDir = currentDir.endsWith('/backend');
const dbPath = isInBackendDir 
  ? path.resolve(currentDir, 'db/kalito.db')
  : path.resolve(currentDir, 'backend/db/kalito.db');

console.log('🧹 Starting Appointments Table Cleanup...');
console.log('Database path:', dbPath);

// Backup database first
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupPath = dbPath.replace('.db', `_appointments_cleanup_${timestamp}.db`);
fs.copyFileSync(dbPath, backupPath);
console.log('✅ Database backed up to:', backupPath);

try {
  const db = new Database(dbPath);
  
  // Disable foreign keys during migration to avoid constraint issues
  db.pragma('foreign_keys = OFF');

  console.log('\n📋 Current appointments table schema:');
  const currentSchema = db.prepare('PRAGMA table_info(appointments)').all();
  currentSchema.forEach(col => {
    console.log(`  - ${col.name}: ${col.type}`);
  });
  
  console.log('\n🔧 Creating cleaned appointments table...');
  
  db.transaction(() => {
    // Create new appointments table WITHOUT provider_id
    db.exec(`
      CREATE TABLE appointments_new (
        id TEXT PRIMARY KEY,
        patient_id TEXT NOT NULL,
        appointment_date TEXT NOT NULL,
        appointment_time TEXT,
        appointment_type TEXT,
        location TEXT,
        notes TEXT,
        preparation_notes TEXT,
        status TEXT,
        outcome_summary TEXT,
        follow_up_required INTEGER,
        provider_name TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
      );
    `);
    
    console.log('✅ New table structure created');
    
    // Copy data from old table to new table (excluding provider_id)
    db.exec(`
      INSERT INTO appointments_new (
        id, patient_id, appointment_date, appointment_time, appointment_type,
        location, notes, preparation_notes, status, outcome_summary,
        follow_up_required, provider_name, created_at, updated_at
      )
      SELECT 
        id, patient_id, appointment_date, appointment_time, appointment_type,
        location, notes, preparation_notes, status, outcome_summary,
        follow_up_required, provider_name, created_at, updated_at
      FROM appointments;
    `);
    
    console.log('✅ Data migrated to new table');
    
    // Drop old table and rename new one
    db.exec('DROP TABLE appointments');
    db.exec('ALTER TABLE appointments_new RENAME TO appointments');
    
    console.log('✅ Table replacement completed');
  })();
  
  console.log('\n📋 New appointments table schema:');
  const newSchema = db.prepare('PRAGMA table_info(appointments)').all();
  newSchema.forEach(col => {
    console.log(`  - ${col.name}: ${col.type}`);
  });
  
  // Verify data integrity
  const appointmentCount = db.prepare('SELECT COUNT(*) as count FROM appointments').get();
  console.log(`\n✅ Data verification: ${appointmentCount.count} appointment(s) preserved`);
  
  // Show current appointment data
  const appointment = db.prepare('SELECT * FROM appointments LIMIT 1').get();
  if (appointment) {
    console.log('\n📄 Current appointment data:');
    Object.keys(appointment).forEach(key => {
      const value = appointment[key];
      if (value !== null && value !== '') {
        console.log(`  ${key}: ${value}`);
      }
    });
  }
  
  // Re-enable foreign keys
  db.pragma('foreign_keys = ON');
  db.close();
  
  console.log('\n🎉 Appointments table cleanup completed successfully!');
  console.log('\nRemoved field:');
  console.log('  ❌ provider_id (legacy eldercare field - unused)');
  
  console.log('\nKept fields:');
  console.log('  ✅ Core fields: patient_id, appointment_date, appointment_time, appointment_type');
  console.log('  ✅ Details: location, notes, preparation_notes, status, outcome_summary');
  console.log('  ✅ Features: follow_up_required, provider_name');
  console.log('  ✅ System: id, created_at, updated_at');
  
  console.log(`\nBackup saved at: ${backupPath}`);
  
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  console.log('Restoring from backup...');
  try {
    fs.copyFileSync(backupPath, dbPath);
    console.log('✅ Database restored from backup');
  } catch (restoreError) {
    console.error('❌ Failed to restore backup:', restoreError.message);
  }
  process.exit(1);
}