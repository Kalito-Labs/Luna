/**
 * Query Router - Detects query intent for structured validation
 * 
 * Routes specific query types (medications, appointments, vitals) to 
 * structured services with validation. All other queries use free-text.
 */

export type QueryType = 
  | 'MEDICATIONS'
  | 'APPOINTMENTS' 
  | 'VITALS'
  | 'GENERAL'

/**
 * Detect the type of user query to determine routing
 */
export function detectQueryType(query: string): QueryType {
  const lowerQuery = query.toLowerCase()
  
  // Medication-related keywords
  const medicationPatterns = [
    /\b(medication|medicine|drug|prescription|rx|pill|tablet|dose|dosage)\b/i,
    /\b(taking|prescribed|pharmacy)\b/i,
    /\brx\s*number/i,
    /\bwhat.*take/i,
  ]
  
  if (medicationPatterns.some(pattern => pattern.test(lowerQuery))) {
    return 'MEDICATIONS'
  }
  
  // Appointment-related keywords
  const appointmentPatterns = [
    /\b(appointment|doctor visit|checkup|schedule|upcoming)\b/i,
    /\b(see.*doctor|visit.*doctor)\b/i,
  ]
  
  if (appointmentPatterns.some(pattern => pattern.test(lowerQuery))) {
    return 'APPOINTMENTS'
  }
  
  // Vitals-related keywords
  const vitalsPatterns = [
    /\b(vital|glucose|blood sugar|weight|blood pressure|bp)\b/i,
    /\b(measurement|reading|health metric)\b/i,
  ]
  
  if (vitalsPatterns.some(pattern => pattern.test(lowerQuery))) {
    return 'VITALS'
  }
  
  // Default to general conversation
  return 'GENERAL'
}

/**
 * Extract patient identifier from query
 * Looks for patient names or references
 */
export function extractPatientReference(query: string): string | null {
  const lowerQuery = query.toLowerCase()
  
  // Check for specific names
  if (lowerQuery.includes('aurora')) {
    return 'aurora'
  }
  if (lowerQuery.includes('basilio')) {
    return 'basilio'
  }
  
  // Check for relationship references
  if (lowerQuery.match(/\b(mom|mother|mama)\b/i)) {
    return 'mother'
  }
  if (lowerQuery.match(/\b(dad|father|papa)\b/i)) {
    return 'father'
  }
  
  return null
}

/**
 * Check if query contains pronoun references (he, she, him, her, his)
 * These indicate continuation of previous patient context
 */
export function containsPronounReference(query: string): boolean {
  const lowerQuery = query.toLowerCase()
  const pronounPatterns = [
    /\b(she|her|hers)\b/i,  // feminine
    /\b(he|him|his)\b/i,    // masculine
    /\b(they|them|their)\b/i // neutral
  ]
  
  return pronounPatterns.some(pattern => pattern.test(lowerQuery))
}
