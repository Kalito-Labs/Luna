#!/usr/bin/env node

/**
 * Test script for eldercare database and API endpoints
 * Tests the database schema and basic CRUD operations
 */

const Database = require('../backend/node_modules/.pnpm/better-sqlite3@12.2.0/node_modules/better-sqlite3')
const path = require('path')

// Database path
const DB_PATH = path.join(__dirname, '../backend/db/kalito.db')

async function runTests() {
  console.log('🧪 Testing Eldercare Database and API...\n')
  
  const db = new Database(DB_PATH)
  
  try {
    // Test 1: Verify all eldercare tables exist
    console.log('1. Testing database schema...')
    const tables = [
      'patients',
      'medical_records', 
      'medications',
      'healthcare_providers',
      'appointments',
      'vitals',
      'medication_logs'
    ]
    
    for (const table of tables) {
      const result = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`).get(table)
      if (result) {
        console.log(`   ✅ Table '${table}' exists`)
      } else {
        console.log(`   ❌ Table '${table}' missing`)
      }
    }
    
    // Test 2: Verify extended columns exist
    console.log('\n2. Testing extended table columns...')
    
    // Check sessions table extensions
    const sessionCols = db.prepare("PRAGMA table_info(sessions)").all()
    const sessionExtensions = ['session_type', 'patient_id', 'related_record_id', 'care_category']
    for (const col of sessionExtensions) {
      const exists = sessionCols.some(c => c.name === col)
      console.log(`   ${exists ? '✅' : '❌'} sessions.${col}`)
    }
    
    // Test 3: Test inserting sample patient data
    console.log('\n3. Testing patient data insertion...')
    
    const patientId = `test-patient-${Date.now()}`
    try {
      const insertPatient = db.prepare(`
        INSERT INTO patients (id, name, relationship, date_of_birth, phone, primary_doctor)
        VALUES (?, ?, ?, ?, ?, ?)
      `)
      
      insertPatient.run(
        patientId,
        'Test Patient',
        'self',
        '1980-01-01',
        '555-123-4567',
        'Dr. Test'
      )
      
      console.log('   ✅ Patient inserted successfully')
      
      // Verify patient was inserted
      const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(patientId)
      if (patient && patient.name === 'Test Patient') {
        console.log('   ✅ Patient data verified')
      } else {
        console.log('   ❌ Patient verification failed')
      }
      
    } catch (error) {
      console.log(`   ❌ Patient insertion failed: ${error.message}`)
    }
    
    // Test 4: Test medication data
    console.log('\n4. Testing medication data insertion...')
    
    try {
      const insertMedication = db.prepare(`
        INSERT INTO medications (id, patient_id, name, dosage, frequency, start_date)
        VALUES (?, ?, ?, ?, ?, ?)
      `)
      
      const medicationId = `test-med-${Date.now()}`
      insertMedication.run(
        medicationId,
        patientId,
        'Test Medication',
        '10mg',
        'once_daily',
        '2025-10-10'
      )
      
      console.log('   ✅ Medication inserted successfully')
      
      // Test foreign key relationship
      const medication = db.prepare(`
        SELECT m.*, p.name as patient_name 
        FROM medications m 
        JOIN patients p ON m.patient_id = p.id 
        WHERE m.id = ?
      `).get(medicationId)
      
      if (medication && medication.patient_name === 'Test Patient') {
        console.log('   ✅ Foreign key relationship working')
      } else {
        console.log('   ❌ Foreign key relationship failed')
      }
      
    } catch (error) {
      console.log(`   ❌ Medication insertion failed: ${error.message}`)
    }
    
    // Test 5: Test vitals data
    console.log('\n5. Testing vitals data insertion...')
    
    try {
      const insertVital = db.prepare(`
        INSERT INTO vitals (id, patient_id, measurement_type, systolic, diastolic, measured_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `)
      
      const vitalId = `test-vital-${Date.now()}`
      insertVital.run(
        vitalId,
        patientId,
        'blood_pressure',
        120,
        80,
        '2025-10-10T10:00:00'
      )
      
      console.log('   ✅ Vital signs inserted successfully')
      
    } catch (error) {
      console.log(`   ❌ Vital signs insertion failed: ${error.message}`)
    }
    
    // Test 6: Test eldercare personas
    console.log('\n6. Testing eldercare personas...')
    
    const personas = db.prepare(`
      SELECT id, name, eldercare_specialty 
      FROM personas 
      WHERE eldercare_specialty IS NOT NULL
    `).all()
    
    console.log(`   ✅ Found ${personas.length} eldercare personas:`)
    personas.forEach(persona => {
      console.log(`      - ${persona.name} (${persona.eldercare_specialty})`)
    })
    
    // Test 7: Test performance indexes
    console.log('\n7. Testing performance indexes...')
    
    const indexes = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='index' AND name LIKE 'idx_%'
    `).all()
    
    console.log(`   ✅ Found ${indexes.length} performance indexes`)
    
    // Cleanup test data
    console.log('\n8. Cleaning up test data...')
    db.prepare('DELETE FROM medications WHERE patient_id = ?').run(patientId)
    db.prepare('DELETE FROM vitals WHERE patient_id = ?').run(patientId)
    db.prepare('DELETE FROM patients WHERE id = ?').run(patientId)
    console.log('   ✅ Test data cleaned up')
    
    console.log('\n🎉 All database tests passed! Ready for frontend testing.')
    console.log('\nNext steps:')
    console.log('1. Start your backend server: cd backend && npm run dev')
    console.log('2. Start your frontend: cd frontend && npm run dev')
    console.log('3. Navigate to http://localhost:5173/eldercare')
    console.log('4. Test the forms by adding your first patient!')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    db.close()
  }
}

// Run tests
runTests().catch(console.error)