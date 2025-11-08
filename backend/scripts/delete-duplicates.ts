import Database from 'better-sqlite3';

const db = new Database('./db/kalito.db');

interface Patient {
  id: string;
  name: string;
  created_at: string;
}

interface CountResult {
  count: number;
}

console.log('=== FINDING ALL PATIENTS ===\n');

const allPatients = db.prepare('SELECT id, name, created_at FROM patients ORDER BY name, created_at').all() as Patient[];

console.log(`Total patients: ${allPatients.length}\n`);

allPatients.forEach((patient: Patient, idx: number) => {
  console.log(`${idx + 1}. ${patient.name}`);
  console.log(`   ID: ${patient.id}`);
  console.log(`   Created: ${patient.created_at}`);
  
  const medCount = db.prepare('SELECT COUNT(*) as count FROM medications WHERE patient_id = ?').get(patient.id) as CountResult;
  const apptCount = db.prepare('SELECT COUNT(*) as count FROM appointments WHERE patient_id = ?').get(patient.id) as CountResult;
  const vitalCount = db.prepare('SELECT COUNT(*) as count FROM vitals WHERE patient_id = ?').get(patient.id) as CountResult;
  
  console.log(`   Medications: ${medCount.count}, Appointments: ${apptCount.count}, Vitals: ${vitalCount.count}`);
  console.log('');
});

console.log('=== IDENTIFYING RECORDS TO DELETE ===\n');

// Group by name and find older duplicates
const patientsByName: Record<string, Patient[]> = {};
allPatients.forEach((p: Patient) => {
  if (!patientsByName[p.name]) {
    patientsByName[p.name] = [];
  }
  patientsByName[p.name].push(p);
});

const toDelete: Patient[] = [];
Object.entries(patientsByName).forEach(([name, patients]) => {
  if (patients.length > 1) {
    // Sort by created_at, keep the newest
    patients.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const keep = patients[0];
    const deleteList = patients.slice(1);
    
    console.log(`${name}:`);
    console.log(`  KEEP: ${keep.id} (created ${keep.created_at})`);
    deleteList.forEach(p => {
      console.log(`  DELETE: ${p.id} (created ${p.created_at})`);
      toDelete.push(p);
    });
    console.log('');
  }
});

if (toDelete.length === 0) {
  console.log('No duplicates to delete.');
  db.close();
  process.exit(0);
}

console.log(`\nTotal records to delete: ${toDelete.length}\n`);
console.log('=== DELETING OLD RECORDS ===\n');

db.prepare('BEGIN TRANSACTION').run();

try {
  toDelete.forEach(patient => {
    console.log(`Deleting ${patient.name} (${patient.id})...`);
    
    // Delete related records first
    const deletedMeds = db.prepare('DELETE FROM medications WHERE patient_id = ?').run(patient.id);
    console.log(`  - Deleted ${deletedMeds.changes} medications`);
    
    const deletedAppts = db.prepare('DELETE FROM appointments WHERE patient_id = ?').run(patient.id);
    console.log(`  - Deleted ${deletedAppts.changes} appointments`);
    
    const deletedVitals = db.prepare('DELETE FROM vitals WHERE patient_id = ?').run(patient.id);
    console.log(`  - Deleted ${deletedVitals.changes} vitals`);
    
    // Delete the patient record
    db.prepare('DELETE FROM patients WHERE id = ?').run(patient.id);
    console.log(`  - Deleted patient record`);
    console.log('');
  });
  
  db.prepare('COMMIT').run();
  console.log('✓ All old duplicate records deleted successfully\n');
  
  // Show final patient list
  console.log('=== FINAL PATIENT LIST ===\n');
  const finalPatients = db.prepare('SELECT id, name, created_at FROM patients ORDER BY name').all() as Patient[];
  finalPatients.forEach((patient: Patient, idx: number) => {
    const medCount = db.prepare('SELECT COUNT(*) as count FROM medications WHERE patient_id = ?').get(patient.id) as CountResult;
    console.log(`${idx + 1}. ${patient.name}`);
    console.log(`   ID: ${patient.id}`);
    console.log(`   Created: ${patient.created_at}`);
    console.log(`   Medications: ${medCount.count}`);
    console.log('');
  });
  
} catch (error) {
  db.prepare('ROLLBACK').run();
  console.error('Error deleting records:', error);
  throw error;
}

db.close();
