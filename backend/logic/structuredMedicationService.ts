/**
 * Structured Medication Service
 * 
 * Provides medication data in structured JSON format with validation.
 * Prevents AI hallucinations by enforcing schema requirements and post-response validation.
 */

import { db } from '../db/db'

export interface StructuredMedication {
  name: string
  generic_name?: string
  dosage: string
  frequency: string
  prescribing_doctor: string
  pharmacy: string
  rx_number: string  // REQUIRED - no nulls allowed
  notes?: string
}

export interface MedicationListResponse {
  patient_id: string
  patient_name: string
  medication_count: number
  medications: StructuredMedication[]
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export class StructuredMedicationService {
  /**
   * Get medications in strictly structured format
   */
  public getMedicationsStructured(patientId: string): MedicationListResponse | null {
    try {
      // Get patient info
      const patient = db.prepare(`
        SELECT id, name FROM patients WHERE id = ? AND active = 1
      `).get(patientId) as { id: string; name: string } | undefined

      if (!patient) {
        return null
      }

      // Get medications
      const medicationRows = db.prepare(`
        SELECT 
          m.name,
          m.generic_name,
          m.dosage,
          m.frequency,
          m.prescribing_doctor,
          m.pharmacy,
          m.rx_number,
          m.notes
        FROM medications m
        WHERE m.patient_id = ? AND m.active = 1
        ORDER BY m.name ASC
      `).all(patientId) as Array<{
        name: string
        generic_name: string | null
        dosage: string
        frequency: string
        prescribing_doctor: string | null
        pharmacy: string | null
        rx_number: string | null
        notes: string | null
      }>

      // Transform to structured format (strict - no nulls in required fields)
      const medications: StructuredMedication[] = medicationRows.map(row => ({
        name: row.name,
        generic_name: row.generic_name || undefined,
        dosage: row.dosage,
        frequency: row.frequency,
        prescribing_doctor: row.prescribing_doctor || 'Unknown',
        pharmacy: row.pharmacy || 'Unknown',
        rx_number: row.rx_number || 'N/A',  // Fallback if truly missing
        notes: row.notes || undefined,
      }))

      return {
        patient_id: patient.id,
        patient_name: patient.name,
        medication_count: medications.length,
        medications,
      }
    } catch (error) {
      console.error('Error fetching structured medications:', error)
      return null
    }
  }

  /**
   * Validate AI response against database reality
   */
  public validateMedicationResponse(
    requestedPatientId: string,
    aiResponse: Partial<MedicationListResponse>
  ): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    try {
      // Get ground truth from database
      const truthData = this.getMedicationsStructured(requestedPatientId)

      if (!truthData) {
        errors.push('Requested patient not found in database')
        return { valid: false, errors, warnings }
      }

      // Validation 1: Patient name match
      if (!aiResponse.patient_name) {
        errors.push('AI response missing patient_name field')
      } else if (aiResponse.patient_name.toLowerCase() !== truthData.patient_name.toLowerCase()) {
        errors.push(
          `Patient mismatch: AI returned "${aiResponse.patient_name}" but should be "${truthData.patient_name}"`
        )
      }

      // Validation 2: Medication count
      if (!aiResponse.medications || !Array.isArray(aiResponse.medications)) {
        errors.push('AI response missing or invalid medications array')
        return { valid: false, errors, warnings }
      }

      if (aiResponse.medications.length !== truthData.medication_count) {
        warnings.push(
          `Medication count mismatch: AI returned ${aiResponse.medications.length} but database has ${truthData.medication_count}`
        )
      }

      // Validation 3: RX numbers exist and match
      const truthRxNumbers = new Set(truthData.medications.map(m => m.rx_number))
      const aiRxNumbers = aiResponse.medications
        .map(m => m.rx_number)
        .filter(rx => rx && rx !== 'N/A' && rx.toLowerCase() !== 'not specified')

      for (const aiRx of aiRxNumbers) {
        if (!truthRxNumbers.has(aiRx)) {
          errors.push(`Hallucinated RX number: ${aiRx} does not exist for this patient`)
        }
      }

      // Validation 4: Check for missing required fields
      aiResponse.medications.forEach((med, index) => {
        if (!med.name) errors.push(`Medication ${index}: missing name`)
        if (!med.dosage) errors.push(`Medication ${index}: missing dosage`)
        if (!med.frequency) errors.push(`Medication ${index}: missing frequency`)
        if (!med.rx_number || med.rx_number === 'not specified' || med.rx_number === 'N/A') {
          errors.push(`Medication ${index} (${med.name}): missing or invalid RX number`)
        }
      })

      // Validation 5: Check for hallucinated medications
      const truthMedNames = new Set(truthData.medications.map(m => m.name.toLowerCase()))
      aiResponse.medications.forEach(med => {
        if (med.name && !truthMedNames.has(med.name.toLowerCase())) {
          errors.push(`Hallucinated medication: "${med.name}" not in database for this patient`)
        }
      })

    } catch (error) {
      errors.push(`Validation error: ${error}`)
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    }
  }

  /**
   * Get JSON schema for AI to follow
   */
  public getMedicationSchema(): object {
    return {
      type: 'object',
      required: ['patient_name', 'medications'],
      properties: {
        patient_name: {
          type: 'string',
          description: 'Full name of the patient - must match the patient in the query',
        },
        medication_count: {
          type: 'number',
          description: 'Total number of medications',
        },
        medications: {
          type: 'array',
          description: 'List of all active medications for this patient',
          items: {
            type: 'object',
            required: ['name', 'dosage', 'frequency', 'prescribing_doctor', 'pharmacy', 'rx_number'],
            properties: {
              name: {
                type: 'string',
                description: 'Medication name (brand or generic)',
              },
              generic_name: {
                type: 'string',
                description: 'Generic name if different from brand name',
              },
              dosage: {
                type: 'string',
                description: 'Dosage amount with units (e.g., "10mg", "50mg")',
              },
              frequency: {
                type: 'string',
                description: 'How often to take (e.g., "once_daily", "twice_daily")',
              },
              prescribing_doctor: {
                type: 'string',
                description: 'Name of the doctor who prescribed this medication - REQUIRED',
              },
              pharmacy: {
                type: 'string',
                description: 'Pharmacy name - REQUIRED',
              },
              rx_number: {
                type: 'string',
                description: 'Prescription number - REQUIRED, NEVER use "not specified" or leave empty',
              },
              notes: {
                type: 'string',
                description: 'Special instructions or notes',
              },
            },
          },
        },
      },
    }
  }

  /**
   * Generate structured prompt with schema enforcement
   */
  public generateStructuredPrompt(patientId: string, patientName: string): string {
    const data = this.getMedicationsStructured(patientId)

    if (!data) {
      return 'Patient not found in database.'
    }

    const prompt = `You are providing medication information in STRICT JSON format.

## CRITICAL REQUIREMENTS
1. Your response MUST be valid JSON matching the schema below
2. NEVER say "not specified" or "N/A" for RX numbers - they are ALL provided
3. NEVER mix up patients - only return medications for ${patientName}
4. NEVER invent medications - only use the data provided below

## JSON SCHEMA (You must match this exactly)
\`\`\`json
${JSON.stringify(this.getMedicationSchema(), null, 2)}
\`\`\`

## PATIENT DATA (Copy this EXACTLY into your response)
\`\`\`json
${JSON.stringify(data, null, 2)}
\`\`\`

## YOUR TASK
Return the above JSON data in a well-formatted response. Include ALL medications with ALL fields.
`

    return prompt
  }
}
