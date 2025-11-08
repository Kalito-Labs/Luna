/**
 * Test script to verify eldercare context generation
 * Run with: npx tsx tests/eldercareContext.test.ts
 */

import { EldercareContextService } from '../logic/eldercareContextService'
import type { LLMAdapter } from '../logic/modelRegistry'

// Mock adapter for testing
const mockAdapter: LLMAdapter = {
  id: 'gpt-4.1-nano',
  name: 'GPT-4.1 Nano',
  type: 'cloud',
  generate: async () => ({ reply: 'test', tokenUsage: 0 }),
}

const service = new EldercareContextService()

console.log('='.repeat(80))
console.log('ELDERCARE CONTEXT TEST')
console.log('='.repeat(80))
console.log()

// Test 1: Get full context (no specific patient)
console.log('📊 TEST 1: Full Context (All Patients)')
console.log('-'.repeat(80))
const fullContext = service.getEldercareContext(mockAdapter)
console.log(`\n✅ Patients: ${fullContext.patients.length}`)
fullContext.patients.forEach(p => {
  console.log(`   - ${p.name} (${p.relationship || 'no relationship'}, age ${p.age || 'unknown'})`)
})

console.log(`\n✅ Medications: ${fullContext.medications.length}`)
const medsByPatient = fullContext.medications.reduce((acc, med) => {
  const key = med.patientName || 'Unknown Patient'
  acc[key] = (acc[key] || 0) + 1
  return acc
}, {} as Record<string, number>)
Object.entries(medsByPatient).forEach(([patient, count]) => {
  console.log(`   - ${patient}: ${count} medications`)
})

console.log(`\n✅ Appointments: ${fullContext.recentAppointments.length}`)
fullContext.recentAppointments.forEach(apt => {
  console.log(`   - ${apt.appointmentDate} (${apt.status})`)
})

console.log(`\n✅ Vitals: ${fullContext.vitals.length}`)
const vitalsByPatient = fullContext.vitals.reduce((acc, vital) => {
  const key = vital.patientName || 'Unknown Patient'
  acc[key] = (acc[key] || 0) + 1
  return acc
}, {} as Record<string, number>)
Object.entries(vitalsByPatient).forEach(([patient, count]) => {
  console.log(`   - ${patient}: ${count} vital records`)
})

console.log(`\n✅ Providers: ${fullContext.providers.length}`)
fullContext.providers.forEach(p => {
  console.log(`   - ${p.name} (${p.specialty || 'no specialty'})`)
})

console.log(`\n✅ Caregiver: ${fullContext.caregiver?.name || 'Not set'}`)

console.log('\n' + '='.repeat(80))
console.log('GENERATED AI CONTEXT SUMMARY')
console.log('='.repeat(80))
console.log(fullContext.summary)

console.log('\n' + '='.repeat(80))
console.log('📝 TEST 2: Context for Specific Patient (Aurora Sanchez)')
console.log('-'.repeat(80))

// Find Aurora's patient ID
const aurora = fullContext.patients.find(p => p.name.includes('Aurora'))
if (aurora) {
  const auroraContext = service.getEldercareContext(mockAdapter, aurora.id)
  console.log(`\n✅ Focused on: ${aurora.name}`)
  console.log(`✅ Medications for this patient: ${auroraContext.medications.length}`)
  auroraContext.medications.forEach(med => {
    console.log(`   - ${med.name} ${med.dosage} ${med.frequency}`)
    if (med.notes) console.log(`     Notes: ${med.notes}`)
  })
  console.log(`\n✅ Appointments for this patient: ${auroraContext.recentAppointments.length}`)
  console.log(`✅ Vitals for this patient: ${auroraContext.vitals.length}`)
} else {
  console.log('❌ Aurora Sanchez not found in database')
}

console.log('\n' + '='.repeat(80))
console.log('TEST COMPLETE')
console.log('='.repeat(80))
