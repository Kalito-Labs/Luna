/**
 * Example: How to use StructuredMedicationService with validation
 * 
 * This demonstrates the complete flow:
 * 1. Get structured data from database
 * 2. Send to AI with strict schema
 * 3. Validate AI response
 * 4. Reject if hallucinated/incorrect
 */

import { StructuredMedicationService } from '../logic/structuredMedicationService'
import type { MedicationListResponse } from '../logic/structuredMedicationService'

const service = new StructuredMedicationService()

// Example 1: Get structured data for a patient
console.log('='.repeat(80))
console.log('EXAMPLE 1: Get Structured Medication Data')
console.log('='.repeat(80))

const auroraId = '1762461808765-l42brki7se9'
const structuredData = service.getMedicationsStructured(auroraId)

if (structuredData) {
  console.log('\nDatabase Ground Truth (JSON):')
  console.log(JSON.stringify(structuredData, null, 2))
}

// Example 2: Generate prompt with schema for AI
console.log('\n' + '='.repeat(80))
console.log('EXAMPLE 2: Prompt for AI (with embedded schema)')
console.log('='.repeat(80))
console.log(service.generateStructuredPrompt(auroraId, 'Aurora Sanchez'))

// Example 3: Validate AI response (correct response)
console.log('\n' + '='.repeat(80))
console.log('EXAMPLE 3: Validate CORRECT AI Response')
console.log('='.repeat(80))

const correctAiResponse: MedicationListResponse = {
  patient_name: 'Aurora Sanchez',
  patient_id: auroraId,
  medication_count: 8,
  medications: structuredData!.medications,  // Using real data
}

const validationCorrect = service.validateMedicationResponse(auroraId, correctAiResponse)
console.log('\nValidation Result (should be valid):')
console.log(JSON.stringify(validationCorrect, null, 2))

// Example 4: Validate AI response (WRONG patient - hallucination)
console.log('\n' + '='.repeat(80))
console.log('EXAMPLE 4: Validate WRONG AI Response (Mixed up patients)')
console.log('='.repeat(80))

const wrongAiResponse: Partial<MedicationListResponse> = {
  patient_name: 'Basilio Sanchez',  // WRONG PATIENT!
  medications: [
    {
      name: 'Insulin',  // This is Basilio's medication, not Aurora's
      dosage: '10 units',
      frequency: 'once_daily',
      prescribing_doctor: 'Jose Luis Santos',
      pharmacy: 'Martinez Pharmacy',
      rx_number: '9081111',
    },
  ],
}

const validationWrong = service.validateMedicationResponse(auroraId, wrongAiResponse)
console.log('\nValidation Result (should have errors):')
console.log(JSON.stringify(validationWrong, null, 2))

// Example 5: Validate AI response (missing RX numbers)
console.log('\n' + '='.repeat(80))
console.log('EXAMPLE 5: Validate AI Response (Missing RX Numbers)')
console.log('='.repeat(80))

const missingRxResponse: Partial<MedicationListResponse> = {
  patient_name: 'Aurora Sanchez',
  medications: [
    {
      name: 'Belsomra',
      dosage: '10mg',
      frequency: 'once_daily',
      prescribing_doctor: 'Ana Zertuche',
      pharmacy: 'Martinez Pharmacy',
      rx_number: 'not specified',  // AI trying to say "not specified"
    },
    {
      name: 'Myrbetriq',
      dosage: '50mg',
      frequency: 'once_daily',
      prescribing_doctor: 'Jorge Ramirez',
      pharmacy: 'Martinez Pharmacy',
      rx_number: '',  // Empty RX number
    },
  ],
}

const validationMissingRx = service.validateMedicationResponse(auroraId, missingRxResponse)
console.log('\nValidation Result (should catch missing RX):')
console.log(JSON.stringify(validationMissingRx, null, 2))

console.log('\n' + '='.repeat(80))
console.log('DEMO COMPLETE')
console.log('='.repeat(80))
console.log('\nKey Takeaways:')
console.log('✅ Structured JSON prevents free-text excuses like "not specified"')
console.log('✅ Schema validation catches missing required fields')
console.log('✅ Post-response validation catches patient mix-ups')
console.log('✅ RX number validation catches hallucinations')
console.log('✅ Medication name validation catches invented medications')
