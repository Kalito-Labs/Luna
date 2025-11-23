import Database from 'better-sqlite3';

const db = new Database('./db/kalito.db');

console.log('=== COMPLETE DATABASE AUDIT ===\n');

// 1. PATIENTS
console.log('1. PATIENTS TABLE');
console.log('─'.repeat(80));
const patients = db.prepare('SELECT * FROM patients ORDER BY created_at').all();
console.log(`Total patients: ${patients.length}\n`);

patients.forEach((p: any, idx: number) => {
  console.log(`${idx + 1}. ${p.name}`);
  console.log(`   ID: ${p.id}`);
  console.log(`   Created: ${p.created_at}`);
  console.log(`   Phone: ${p.phone || '(none)'}`);
  console.log(`   Relationship: ${p.relationship || '(none)'}`);
  console.log(`   Age: ${p.age || '(none)'}`);
  console.log('');
});

// Check for duplicate names
const nameCount: Record<string, number> = {};
patients.forEach((p: any) => {
  const name = p.name.trim().toLowerCase();
  nameCount[name] = (nameCount[name] || 0) + 1;
});
const duplicateNames = Object.entries(nameCount).filter(([_, count]) => count > 1);
if (duplicateNames.length > 0) {
  console.log('⚠️  DUPLICATE PATIENT NAMES FOUND:');
  duplicateNames.forEach(([name, count]) => {
    console.log(`   - "${name}": ${count} records`);
  });
  console.log('');
} else {
  console.log('✓ No duplicate patient names\n');
}

// 2. MEDICATIONS
console.log('2. MEDICATIONS TABLE');
console.log('─'.repeat(80));
const allMeds = db.prepare(`
  SELECT m.*, p.name as patient_name 
  FROM medications m 
  LEFT JOIN patients p ON m.patient_id = p.id 
  ORDER BY m.patient_id, m.name
`).all();
console.log(`Total medications: ${allMeds.length}\n`);

// Group by patient
const medsByPatient: Record<string, any[]> = {};
allMeds.forEach((m: any) => {
  const patientName = m.patient_name || 'ORPHANED (no patient)';
  if (!medsByPatient[patientName]) {
    medsByPatient[patientName] = [];
  }
  medsByPatient[patientName].push(m);
});

Object.entries(medsByPatient).forEach(([patientName, meds]) => {
  console.log(`${patientName}: ${meds.length} medication(s)`);
  meds.forEach((m: any) => {
    const rx = m.rx_number || 'NULL';
    const active = m.active ? '✓' : '✗ INACTIVE';
    console.log(`   - ${m.name} (RX: ${rx}) ${active}`);
  });
  console.log('');
});

// Check for orphaned medications
const orphanedMeds = allMeds.filter((m: any) => !m.patient_name);
if (orphanedMeds.length > 0) {
  console.log(`⚠️  ORPHANED MEDICATIONS (no matching patient): ${orphanedMeds.length}`);
  orphanedMeds.forEach((m: any) => {
    console.log(`   - ${m.name} (patient_id: ${m.patient_id})`);
  });
  console.log('');
}

// Check for duplicate medications per patient
Object.entries(medsByPatient).forEach(([patientName, meds]) => {
  const medNames: Record<string, number> = {};
  meds.forEach((m: any) => {
    const name = m.name.trim().toLowerCase();
    medNames[name] = (medNames[name] || 0) + 1;
  });
  const duplicates = Object.entries(medNames).filter(([_, count]) => count > 1);
  if (duplicates.length > 0) {
    console.log(`⚠️  DUPLICATE MEDICATIONS for ${patientName}:`);
    duplicates.forEach(([name, count]) => {
      console.log(`   - "${name}": ${count} records`);
    });
    console.log('');
  }
});

// SUMMARY
console.log('=== AUDIT SUMMARY ===');
console.log('─'.repeat(80));
console.log(`✓ Patients: ${patients.length}`);
console.log(`✓ Medications: ${allMeds.length}`);
console.log('');

// Issues found
const issues: string[] = [];
if (duplicateNames.length > 0) issues.push('Duplicate patient names');
if (orphanedMeds.length > 0) issues.push(`${orphanedMeds.length} orphaned medications`);

if (issues.length > 0) {
  console.log('⚠️  ISSUES FOUND:');
  issues.forEach(issue => console.log(`   - ${issue}`));
} else {
  console.log('✓ No issues found - database is clean!');
}

db.close();
