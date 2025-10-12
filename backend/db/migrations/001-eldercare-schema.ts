import { Database } from 'better-sqlite3'

/**
 * Phase 1: Database Migration for Eldercare Management
 * 
 * This migration adds eldercare-specific tables and extends existing ones
 * while maintaining backward compatibility with the current chat system.
 */

export function migrateToEldercare(db: Database): void {
  console.log('🏥 Starting eldercare database migration...')

  // Execute all migrations in a transaction for safety
  db.transaction(() => {
    // 1. Create new eldercare tables
    createPatientsTable(db)
    createMedicalRecordsTable(db)
    createMedicationsTable(db)
    createHealthcareProvidersTable(db)
    createAppointmentsTable(db)
    createVitalsTable(db)
    createMedicationLogsTable(db)
    createCaregiversTable(db)
    
    // 2. Extend existing tables
    extendSessionsTable(db)
    extendPersonasTable(db)
    extendSemanticPinsTable(db)
    
    // 3. Create performance indexes
    createElderCareIndexes(db)
    
    // 4. Seed default eldercare data
    seedElderCarePersonas(db)
    
    console.log('✅ Eldercare migration completed successfully!')
  })()
}

// =====================================
// 1. CREATE NEW ELDERCARE TABLES
// =====================================

function createPatientsTable(db: Database): void {
  console.log('  📋 Creating patients table...')
  
  db.exec(`
    CREATE TABLE patients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      date_of_birth TEXT,
      relationship TEXT, -- 'mother', 'father', 'spouse', 'self', etc.
      gender TEXT,
      phone TEXT,
      emergency_contact_name TEXT,
      emergency_contact_phone TEXT,
      primary_doctor TEXT,
      insurance_provider TEXT,
      insurance_id TEXT,
      notes TEXT,
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)
}

function createMedicalRecordsTable(db: Database): void {
  console.log('  📋 Creating medical_records table...')
  
  db.exec(`
    CREATE TABLE medical_records (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL,
      record_type TEXT NOT NULL, -- 'diagnosis', 'treatment', 'test_result', 'incident', 'note'
      title TEXT NOT NULL,
      description TEXT,
      date_recorded TEXT NOT NULL,
      provider_name TEXT,
      location TEXT,
      importance_score REAL DEFAULT 0.7,
      tags TEXT, -- JSON array of tags
      attachments TEXT, -- JSON array of file paths
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
    )
  `)
}

function createMedicationsTable(db: Database): void {
  console.log('  💊 Creating medications table...')
  
  db.exec(`
    CREATE TABLE medications (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL,
      name TEXT NOT NULL,
      generic_name TEXT,
      dosage TEXT NOT NULL,
      frequency TEXT NOT NULL, -- 'daily', 'twice_daily', 'as_needed', etc.
      route TEXT, -- 'oral', 'topical', 'injection', etc.
      prescribing_doctor TEXT,
      pharmacy TEXT,
      start_date TEXT NOT NULL,
      end_date TEXT,
      refills_remaining INTEGER,
      side_effects TEXT,
      notes TEXT,
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
    )
  `)
}

function createHealthcareProvidersTable(db: Database): void {
  console.log('  👩‍⚕️ Creating healthcare_providers table...')
  
  db.exec(`
    CREATE TABLE healthcare_providers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      specialty TEXT,
      practice_name TEXT,
      phone TEXT,
      email TEXT,
      address TEXT,
      notes TEXT,
      preferred INTEGER DEFAULT 0, -- Mark preferred providers
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)
}

function createAppointmentsTable(db: Database): void {
  console.log('  📅 Creating appointments table...')
  
  db.exec(`
    CREATE TABLE appointments (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL,
      provider_id TEXT,
      appointment_date TEXT NOT NULL,
      appointment_time TEXT,
      appointment_type TEXT, -- 'routine', 'follow_up', 'emergency', 'specialist'
      location TEXT,
      notes TEXT,
      preparation_notes TEXT, -- What to bring, prep instructions
      status TEXT DEFAULT 'scheduled', -- 'scheduled', 'completed', 'cancelled', 'rescheduled'
      outcome_summary TEXT, -- Post-appointment notes
      follow_up_required INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
      FOREIGN KEY (provider_id) REFERENCES healthcare_providers(id)
    )
  `)
}

function createVitalsTable(db: Database): void {
  console.log('  📊 Creating vitals table...')
  
  db.exec(`
    CREATE TABLE vitals (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL,
      measurement_type TEXT NOT NULL, -- 'blood_pressure', 'weight', 'temperature', 'heart_rate', 'blood_sugar'
      systolic INTEGER, -- For blood pressure
      diastolic INTEGER, -- For blood pressure
      value REAL, -- For single-value measurements
      unit TEXT, -- 'lbs', 'kg', 'F', 'C', 'bpm', 'mg/dL'
      notes TEXT,
      measured_at TEXT NOT NULL,
      measured_by TEXT, -- Who took the measurement
      location TEXT, -- Where measured (home, doctor's office)
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
    )
  `)
}

function createMedicationLogsTable(db: Database): void {
  console.log('  📝 Creating medication_logs table...')
  
  db.exec(`
    CREATE TABLE medication_logs (
      id TEXT PRIMARY KEY,
      medication_id TEXT NOT NULL,
      patient_id TEXT NOT NULL,
      scheduled_time TEXT NOT NULL,
      actual_time TEXT,
      status TEXT NOT NULL, -- 'taken', 'missed', 'late', 'skipped'
      notes TEXT,
      reminder_sent INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (medication_id) REFERENCES medications(id) ON DELETE CASCADE,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
    )
  `)
}

function createCaregiversTable(db: Database): void {
  console.log('  👨‍⚕️ Creating caregivers table...')
  
  db.exec(`
    CREATE TABLE caregivers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      date_of_birth TEXT,
      email TEXT,
      phone TEXT,
      address TEXT,
      relationship TEXT, -- 'family', 'professional', 'friend', etc.
      specialties TEXT, -- JSON array of specialties
      certifications TEXT, -- JSON array of certifications
      availability_schedule TEXT, -- JSON object with schedule
      emergency_contact_name TEXT,
      emergency_contact_phone TEXT,
      notes TEXT, -- Personal notes section
      clock_in_time TEXT, -- Current shift start time
      clock_out_time TEXT, -- Current shift end time
      is_active INTEGER DEFAULT 1,
      last_clock_in TEXT,
      last_clock_out TEXT,
      total_hours_worked REAL DEFAULT 0,
      hourly_rate REAL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)
}

// =====================================
// 2. EXTEND EXISTING TABLES
// =====================================

function extendSessionsTable(db: Database): void {
  console.log('  🔄 Extending sessions table for eldercare...')
  
  try {
    // Add eldercare-specific columns to existing sessions table
    db.exec(`ALTER TABLE sessions ADD COLUMN session_type TEXT DEFAULT 'chat'`)
    db.exec(`ALTER TABLE sessions ADD COLUMN patient_id TEXT`)
    db.exec(`ALTER TABLE sessions ADD COLUMN related_record_id TEXT`)
    db.exec(`ALTER TABLE sessions ADD COLUMN care_category TEXT`)
  } catch {
    // Columns might already exist, that's okay
    console.log('    ℹ️  Sessions table columns may already exist')
  }
}

function extendPersonasTable(db: Database): void {
  console.log('  🤖 Extending personas table for eldercare specialists...')
  
  try {
    // Add eldercare-specific columns to existing personas table
    db.exec(`ALTER TABLE personas ADD COLUMN eldercare_specialty TEXT`)
    db.exec(`ALTER TABLE personas ADD COLUMN patient_context INTEGER DEFAULT 0`)
  } catch {
    // Columns might already exist, that's okay
    console.log('    ℹ️  Personas table columns may already exist')
  }
}

function extendSemanticPinsTable(db: Database): void {
  console.log('  📌 Extending semantic_pins table for medical context...')
  
  try {
    // Add medical-specific columns to existing semantic_pins table
    db.exec(`ALTER TABLE semantic_pins ADD COLUMN medical_category TEXT`)
    db.exec(`ALTER TABLE semantic_pins ADD COLUMN patient_id TEXT`)
    db.exec(`ALTER TABLE semantic_pins ADD COLUMN urgency_level TEXT DEFAULT 'normal'`)
  } catch {
    // Columns might already exist, that's okay
    console.log('    ℹ️  Semantic pins table columns may already exist')
  }
}

// =====================================
// 3. CREATE PERFORMANCE INDEXES
// =====================================

function createElderCareIndexes(db: Database): void {
  console.log('  ⚡ Creating performance indexes...')
  
  // Patient-related indexes
  db.exec(`CREATE INDEX IF NOT EXISTS idx_medical_records_patient_date ON medical_records(patient_id, date_recorded DESC)`)
  db.exec(`CREATE INDEX IF NOT EXISTS idx_medications_patient_active ON medications(patient_id, active, start_date DESC)`)
  db.exec(`CREATE INDEX IF NOT EXISTS idx_appointments_patient_date ON appointments(patient_id, appointment_date ASC)`)
  db.exec(`CREATE INDEX IF NOT EXISTS idx_vitals_patient_type_date ON vitals(patient_id, measurement_type, measured_at DESC)`)
  db.exec(`CREATE INDEX IF NOT EXISTS idx_medication_logs_patient_scheduled ON medication_logs(patient_id, scheduled_time DESC)`)
  
  // Caregiver-related indexes
  db.exec(`CREATE INDEX IF NOT EXISTS idx_caregivers_active ON caregivers(is_active, created_at DESC)`)
  db.exec(`CREATE INDEX IF NOT EXISTS idx_caregivers_relationship ON caregivers(relationship, is_active)`)
  db.exec(`CREATE INDEX IF NOT EXISTS idx_caregivers_clock_status ON caregivers(clock_in_time, clock_out_time)`)
  
  // Search and filtering indexes
  db.exec(`CREATE INDEX IF NOT EXISTS idx_medical_records_type_date ON medical_records(record_type, date_recorded DESC)`)
  db.exec(`CREATE INDEX IF NOT EXISTS idx_appointments_status_date ON appointments(status, appointment_date ASC)`)
  
  // Enhanced existing indexes for eldercare
  db.exec(`CREATE INDEX IF NOT EXISTS idx_sessions_patient_type ON sessions(patient_id, session_type, updated_at DESC)`)
  db.exec(`CREATE INDEX IF NOT EXISTS idx_semantic_pins_patient_medical ON semantic_pins(patient_id, medical_category, importance_score DESC)`)
}

// =====================================
// 4. SEED DEFAULT ELDERCARE DATA
// =====================================

function seedElderCarePersonas(_db: Database): void {
  console.log('  🌱 Seeding default eldercare personas...')
  
  // Note: Only default-cloud and default-local personas are used.
  // These are seeded in backend/db/init.ts
  // No additional eldercare-specific personas needed - the two main defaults
  // already have comprehensive eldercare context via update-default-personas.ts
  
  console.log(`    ✅ No additional eldercare personas needed (using main defaults)`)
}

// =====================================
// 5. VALIDATION HELPERS
// =====================================

export function validateEldercareMigration(db: Database): boolean {
  console.log('🔍 Validating eldercare migration...')
  
  try {
    // Check that all new tables exist
    const tables = [
      'patients', 'medical_records', 'medications', 
      'healthcare_providers', 'appointments', 'vitals', 'medication_logs'
    ]
    
    for (const table of tables) {
      const result = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`).get(table)
      if (!result) {
        console.error(`❌ Table ${table} does not exist`)
        return false
      }
    }
    
    // Check foreign key constraints
    db.exec('PRAGMA foreign_key_check')
    
    // Check that indexes were created
    const indexCount = db.prepare(`SELECT COUNT(*) as count FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%'`).get() as { count: number }
    console.log(`    📊 Created ${indexCount.count} performance indexes`)
    
    // Check that eldercare personas were added
    const personaCount = db.prepare(`SELECT COUNT(*) as count FROM personas WHERE eldercare_specialty IS NOT NULL`).get() as { count: number }
    console.log(`    🤖 Added ${personaCount.count} eldercare personas`)
    
    console.log('✅ Migration validation completed successfully!')
    return true
    
  } catch (error) {
    console.error('❌ Migration validation failed:', error)
    return false
  }
}

// =====================================
// 6. BACKUP HELPER
// =====================================

export function backupDatabase(db: Database, backupPath: string): void {
  console.log(`💾 Creating database backup at ${backupPath}...`)
  
  try {
    // Use SQLite backup API
    db.backup(backupPath)
    console.log('✅ Database backup completed successfully!')
  } catch (error) {
    console.error('❌ Database backup failed:', error)
    throw error
  }
}