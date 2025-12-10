/**
 * Test script to verify Luna context generation
 * Run with: npx tsx tests/eldercareContext.test.ts
 */

import { LunaContextService } from '../logic/lunaContextService'
import type { LLMAdapter } from '../logic/modelRegistry'

// Mock adapter for testing
const mockAdapter: LLMAdapter = {
  id: 'gpt-4.1-nano',
  name: 'GPT-4.1 Nano',
  type: 'cloud',
  generate: async () => ({ reply: 'test', tokenUsage: 0 }),
}

const service = new LunaContextService()

console.log('='.repeat(80))
console.log('LUNA CONTEXT TEST')
console.log('='.repeat(80))
console.log()

// Test 1: Get full context (no specific patient)
console.log('📊 TEST 1: Full Context (All Patients)')
console.log('-'.repeat(80))
const fullContext = service.getLunaContext(mockAdapter)
console.log(`\n✅ Patients: ${fullContext.patients.length}`)
fullContext.patients.forEach(p => {
  console.log(`   - ${p.name} (age ${p.age || 'unknown'}, ${p.gender || 'unknown gender'})`)
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
  const auroraContext = service.getLunaContext(mockAdapter, aurora.id)
  console.log(`\n✅ Focused on: ${aurora.name}`)
  console.log(`✅ Medications for this patient: ${auroraContext.medications.length}`)
  auroraContext.medications.forEach(med => {
    console.log(`   - ${med.name} ${med.dosage} ${med.frequency}`)
    if (med.notes) console.log(`     Notes: ${med.notes}`)
  })
} else {
  console.log('❌ Aurora Sanchez not found in database')
}

console.log('\n' + '='.repeat(80))
console.log('TEST COMPLETE')
console.log('='.repeat(80))
