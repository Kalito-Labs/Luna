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

// 3. APPOINTMENTS
console.log('3. APPOINTMENTS TABLE');
console.log('─'.repeat(80));
const appointments = db.prepare(`
  SELECT a.*, p.name as patient_name 
  FROM appointments a 
  LEFT JOIN patients p ON a.patient_id = p.id 
  ORDER BY a.appointment_date DESC
`).all();
console.log(`Total appointments: ${appointments.length}\n`);

const apptsByPatient: Record<string, any[]> = {};
appointments.forEach((a: any) => {
  const patientName = a.patient_name || 'ORPHANED';
  if (!apptsByPatient[patientName]) {
    apptsByPatient[patientName] = [];
  }
  apptsByPatient[patientName].push(a);
});

Object.entries(apptsByPatient).forEach(([patientName, appts]) => {
  console.log(`${patientName}: ${appts.length} appointment(s)`);
  appts.forEach((a: any) => {
    console.log(`   - ${a.appointment_date} ${a.appointment_time || ''} - ${a.appointment_type || 'N/A'}`);
    console.log(`     Status: ${a.status || 'N/A'}`);
  });
  console.log('');
});

// Check for orphaned appointments
const orphanedAppts = appointments.filter((a: any) => !a.patient_name);
if (orphanedAppts.length > 0) {
  console.log(`⚠️  ORPHANED APPOINTMENTS: ${orphanedAppts.length}`);
  orphanedAppts.forEach((a: any) => {
    console.log(`   - ${a.appointment_date} (patient_id: ${a.patient_id})`);
  });
  console.log('');
}

// 4. VITALS
console.log('4. VITALS TABLE');
console.log('─'.repeat(80));
const vitals = db.prepare(`
  SELECT v.*, p.name as patient_name 
  FROM vitals v 
  LEFT JOIN patients p ON v.patient_id = p.id 
  ORDER BY v.recorded_date DESC
`).all();
console.log(`Total vitals records: ${vitals.length}\n`);

const vitalsByPatient: Record<string, any[]> = {};
vitals.forEach((v: any) => {
  const patientName = v.patient_name || 'ORPHANED';
  if (!vitalsByPatient[patientName]) {
    vitalsByPatient[patientName] = [];
  }
  vitalsByPatient[patientName].push(v);
});

Object.entries(vitalsByPatient).forEach(([patientName, vits]) => {
  console.log(`${patientName}: ${vits.length} vital record(s)`);
  vits.slice(0, 3).forEach((v: any) => {
    const measurements = [];
    if (v.weight_lbs) measurements.push(`Weight: ${v.weight_lbs}lbs`);
    if (v.glucose_am) measurements.push(`Glucose AM: ${v.glucose_am}`);
    if (v.glucose_pm) measurements.push(`Glucose PM: ${v.glucose_pm}`);
    console.log(`   - ${v.recorded_date}: ${measurements.join(', ') || 'No measurements'}`);
  });
  if (vits.length > 3) {
    console.log(`   ... and ${vits.length - 3} more`);
  }
  console.log('');
});

// Check for orphaned vitals
const orphanedVitals = vitals.filter((v: any) => !v.patient_name);
if (orphanedVitals.length > 0) {
  console.log(`⚠️  ORPHANED VITALS: ${orphanedVitals.length}`);
  orphanedVitals.forEach((v: any) => {
    console.log(`   - ${v.recorded_date} (patient_id: ${v.patient_id})`);
  });
  console.log('');
}

// SUMMARY
console.log('=== AUDIT SUMMARY ===');
console.log('─'.repeat(80));
console.log(`✓ Patients: ${patients.length}`);
console.log(`✓ Medications: ${allMeds.length}`);
console.log(`✓ Appointments: ${appointments.length}`);
console.log(`✓ Vitals: ${vitals.length}`);
console.log('');

// Issues found
const issues: string[] = [];
if (duplicateNames.length > 0) issues.push('Duplicate patient names');
if (orphanedMeds.length > 0) issues.push(`${orphanedMeds.length} orphaned medications`);
if (orphanedAppts.length > 0) issues.push(`${orphanedAppts.length} orphaned appointments`);
if (orphanedVitals.length > 0) issues.push(`${orphanedVitals.length} orphaned vitals`);

if (issues.length > 0) {
  console.log('⚠️  ISSUES FOUND:');
  issues.forEach(issue => console.log(`   - ${issue}`));
} else {
  console.log('✓ No issues found - database is clean!');
}

db.close();
