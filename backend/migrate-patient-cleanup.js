const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Use consistent path resolution logic matching the application
const currentDir = process.cwd();
const isInBackendDir = currentDir.endsWith('/backend');
const dbPath = isInBackendDir 
  ? path.resolve(currentDir, 'db/kalito.db')
  : path.resolve(currentDir, 'backend/db/kalito.db');

console.log('🧹 Starting Patient Table Cleanup Migration...');
console.log('Database path:', dbPath);

// Backup database first
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupPath = dbPath.replace('.db', `_backup_${timestamp}.db`);
fs.copyFileSync(dbPath, backupPath);
console.log('✅ Database backed up to:', backupPath);

try {
  const db = new Database(dbPath);
  
  // Disable foreign keys during migration to avoid constraint issues
  db.pragma('foreign_keys = OFF');
  
  console.log('\n📋 Current patients table schema:');
  const currentSchema = db.prepare('PRAGMA table_info(patients)').all();
  currentSchema.forEach(col => {
    console.log(`  - ${col.name}: ${col.type}`);
  });
  
  console.log('\n🔧 Creating cleaned patients table...');
  
  db.transaction(() => {
    // Create new patients table with only the fields used in frontend
    db.exec(`
      CREATE TABLE patients_new (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        date_of_birth TEXT,
        gender TEXT,
        phone TEXT,
        city TEXT,
        state TEXT,
        occupation TEXT,
        occupation_description TEXT,
        languages TEXT,
        notes TEXT,
        active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('✅ New table structure created');
    
    // Copy data from old table to new table (only the fields we're keeping)
    db.exec(`
      INSERT INTO patients_new (
        id, name, date_of_birth, gender, phone, city, state,
        occupation, occupation_description, languages, notes,
        active, created_at, updated_at
      )
      SELECT 
        id, name, date_of_birth, gender, phone, city, state,
        occupation, occupation_description, languages, notes,
        active, created_at, updated_at
      FROM patients;
    `);
    
    console.log('✅ Data migrated to new table');
    
    // Drop old table and rename new one
    db.exec('DROP TABLE patients');
    db.exec('ALTER TABLE patients_new RENAME TO patients');
    
    console.log('✅ Table replacement completed');
  })();
  
  console.log('\n📋 New patients table schema:');
  const newSchema = db.prepare('PRAGMA table_info(patients)').all();
  newSchema.forEach(col => {
    console.log(`  - ${col.name}: ${col.type}`);
  });
  
  // Verify data integrity
  const patientCount = db.prepare('SELECT COUNT(*) as count FROM patients').get();
  console.log(`\n✅ Data verification: ${patientCount.count} patient(s) preserved`);
  
  // Show current patient data
  const patient = db.prepare('SELECT * FROM patients LIMIT 1').get();
  if (patient) {
    console.log('\n📄 Current patient data:');
    Object.keys(patient).forEach(key => {
      const value = patient[key];
      if (value !== null && value !== '') {
        console.log(`  ${key}: ${value}`);
      }
    });
  }
  
  db.close();
  
  // Re-enable foreign keys
  const dbFinal = new Database(dbPath);
  dbFinal.pragma('foreign_keys = ON');
  dbFinal.close();
  
  console.log('\n🎉 Patient table cleanup completed successfully!');
  console.log('\nRemoved fields:');
  console.log('  ❌ relationship (hardcoded as "self")');
  console.log('  ❌ primary_doctor_id (no UI)');
  console.log('  ❌ insurance_provider (no UI)');
  console.log('  ❌ insurance_id (no UI)');
  console.log('  ❌ emergency_contact_name (no UI)');
  console.log('  ❌ emergency_contact_phone (no UI)');
  console.log('  ❌ primary_doctor (legacy field)');
  console.log('  ❌ doctor_address (legacy field)');
  console.log('  ❌ doctor_phone (legacy field)');
  
  console.log('\nKept fields:');
  console.log('  ✅ Core UI fields: name, date_of_birth, gender, phone, city, state');
  console.log('  ✅ Work fields: occupation, occupation_description, languages');
  console.log('  ✅ User data: notes');
  console.log('  ✅ System fields: id, active, created_at, updated_at');
  
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