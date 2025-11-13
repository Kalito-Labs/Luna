/**
 * LunaContextService
 * 
 * Provides AI context integration for Luna mental health practice.
 * Enables AI models to reference patient data, medications, and appointments.
 * 
 * Uses structured services for consistent data validation and error handling.
 * Security: Read-only operations only. AI cannot modify patient data.
 * Privacy: All models get full context access for Caleb's practice.
 */

import { db } from '../db/db'
import type { LLMAdapter } from './modelRegistry'
import { StructuredMedicationService } from './structuredMedicationService'
import { StructuredAppointmentService } from './structuredAppointmentService'

export interface PatientContext {
  id: string
  name: string
  age?: number
  gender?: string
  phone?: string
  city?: string
  state?: string
  occupation?: string
  occupation_description?: string
  languages?: string
  primary_doctor_id?: string
  notes?: string
}

export interface MedicationContext {
  id: string
  patientId: string  // Link to patient
  patientName?: string  // Patient name for easy reference
  name: string
  genericName?: string
  dosage: string
  frequency: string
  route?: string
  prescribingDoctor?: string
  pharmacy?: string
  rxNumber?: string
  sideEffects?: string
  notes?: string
}

export interface AppointmentContext {
  id: string
  appointmentDate: string
  appointmentTime?: string
  appointmentType?: string
  location?: string
  status: string
  preparationNotes?: string
  notes?: string
  outcomeSummary?: string
  followUpRequired?: boolean
}

export type LunaContext = {
  patients: PatientContext[];
  medications: MedicationContext[];
  recentAppointments: AppointmentContext[];
  summary: string;
};

export class LunaContextService {
  private readonly MAX_RECENT_DAYS = 30
  private structuredMedicationService: StructuredMedicationService
  private structuredAppointmentService: StructuredAppointmentService
  
  constructor() {
    this.structuredMedicationService = new StructuredMedicationService()
    this.structuredAppointmentService = new StructuredAppointmentService()
  }

  /**
   * Calculate age from date of birth
   */
  private calculateAge(dateOfBirth: string): number | undefined {
    if (!dateOfBirth) return undefined
    
    try {
      const today = new Date()
      const birthDate = new Date(dateOfBirth)
      let age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }
      
      return age >= 0 ? age : undefined
    } catch {
      return undefined
    }
  }

  /**
   * Get all active patients with their basic information
   */
  private getPatients(): PatientContext[] {
    try {
      const query = `
        SELECT id, name, date_of_birth, gender, 
               phone, city, state, occupation, occupation_description,
               languages, primary_doctor_id, notes
        FROM patients 
        WHERE active = 1 
        ORDER BY name ASC
      `
      const rows = db.prepare(query).all() as Array<{
        id: string
        name: string
        date_of_birth: string | null
        gender: string | null
        phone: string | null
        city: string | null
        state: string | null
        occupation: string | null
        occupation_description: string | null
        languages: string | null
        primary_doctor_id: string | null
        notes: string | null
      }>

      return rows.map(row => {
        const context: PatientContext = {
          id: row.id,
          name: row.name,
          age: row.date_of_birth ? this.calculateAge(row.date_of_birth) : undefined,
          gender: row.gender || undefined,
          phone: row.phone || undefined,
          city: row.city || undefined,
          state: row.state || undefined,
          occupation: row.occupation || undefined,
          occupation_description: row.occupation_description || undefined,
          languages: row.languages || undefined,
          primary_doctor_id: row.primary_doctor_id || undefined,
          notes: row.notes || undefined,
        }

        return context
      })
    } catch (error) {
      console.error('Error fetching patients for context:', error)
      return []
    }
  }

  /**
   * Get active medications for all patients or specific patient
   * Uses StructuredMedicationService for validated data with complete information
   */
  private getMedications(patientId?: string): MedicationContext[] {
    try {
      // If no specific patient, get all patients and fetch their medications
      if (!patientId) {
        const patients = this.getPatients()
        const allMedications: MedicationContext[] = []
        
        for (const patient of patients) {
          const patientMeds = this.getMedications(patient.id)
          allMedications.push(...patientMeds)
        }
        
        return allMedications
      }
      
      // Use structured validation service for specific patient
      const structuredData = this.structuredMedicationService.getMedicationsStructured(patientId)
      
      if (!structuredData) {
        return []
      }
      
      // Convert structured format to MedicationContext format
      return structuredData.medications.map((med, index) => {
        const context: MedicationContext = {
          id: `${patientId}-med-${index}`, // Generate ID from index
          patientId: patientId,
          patientName: structuredData.patient_name,
          name: med.name,
          genericName: med.generic_name || undefined,
          dosage: med.dosage,
          frequency: med.frequency,
          route: undefined, // Not in structured format
          prescribingDoctor: med.prescribing_doctor,
          pharmacy: med.pharmacy,
          rxNumber: med.rx_number,
          sideEffects: undefined, // Not in structured format
          notes: med.notes || undefined,
        }
        
        return context
      })
    } catch (error) {
      console.error('Error fetching medications for context:', error)
      return []
    }
  }

  /**
   * Get recent appointments (upcoming and recent past)
   * Uses StructuredAppointmentService for consistency with medications
   */
  private getRecentAppointments(patientId?: string): AppointmentContext[] {
    try {
      // Use structured appointment service
      const lunaAppointments = this.structuredAppointmentService.getRecentAppointmentsForContext(
        patientId, 
        this.MAX_RECENT_DAYS
      )

      // Convert LunaAppointment format to AppointmentContext format
      return lunaAppointments.map(luna => ({
        id: luna.id,
        appointmentDate: luna.appointment_date,
        appointmentTime: luna.appointment_time,
        appointmentType: luna.appointment_type,
        location: luna.location,
        status: luna.status,
        preparationNotes: luna.preparation_notes,
        notes: luna.notes,
        outcomeSummary: luna.outcome_summary,
        followUpRequired: luna.follow_up_required || false,
      }))
    } catch (error) {
      console.error('Error fetching appointments for context:', error)
      return []
    }
  }



  /**
   * Generate a summary of mental health context for AI
   */
  private generateContextSummary(context: LunaContext): string {
  // Use context directly, destructuring removed
    let summary = "## Mental Health Practice Context Summary\n\n";
    // Patients summary
    if (context.patients.length > 0) {
      summary += `### Patients (${context.patients.length})\n`;
      context.patients.forEach((patient: PatientContext) => {
        summary += `- **${patient.name}**`;
        if (patient.age) summary += `, age ${patient.age}`;
        if (patient.gender) summary += `, ${patient.gender}`;
        if (patient.phone) summary += `\n  Phone: ${patient.phone}`;
        if (patient.city || patient.state) {
          const location = [patient.city, patient.state].filter(Boolean).join(', ');
          summary += `\n  Location: ${location}`;
        }
        if (patient.occupation) {
          summary += `\n  Occupation: ${patient.occupation}`;
          if (patient.occupation_description) summary += `\n  Details: ${patient.occupation_description}`;
        }
        if (patient.languages) summary += `\n  Languages: ${patient.languages}`;
        if (patient.primary_doctor_id) summary += `\n  Primary Doctor ID: ${patient.primary_doctor_id}`;
        summary += '\n';
      });
      summary += '\n';
    }
    // Active medications summary - grouped by patient
    if (context.medications.length > 0) {
      summary += `### Active Medications (${context.medications.length})\n\n`;
      
      // Group medications by patient
      const medsByPatient = new Map<string, MedicationContext[]>();
      context.medications.forEach((med: MedicationContext) => {
        const patientName = med.patientName || 'Unknown Patient';
        if (!medsByPatient.has(patientName)) {
          medsByPatient.set(patientName, []);
        }
        medsByPatient.get(patientName)!.push(med);
      });
      
      // Display medications grouped by patient
      medsByPatient.forEach((meds, patientName) => {
        summary += `**${patientName} (${meds.length} medication${meds.length !== 1 ? 's' : ''})**\n`;
        meds.forEach((med: MedicationContext) => {
          summary += `- ${med.name}`;
          if (med.genericName) summary += ` (${med.genericName})`;
          summary += ` ${med.dosage} - ${med.frequency}\n`;
          if (med.prescribingDoctor) summary += `  Prescribed by: ${med.prescribingDoctor}\n`;
          if (med.pharmacy) {
            summary += `  Pharmacy: ${med.pharmacy}`;
            if (med.rxNumber) summary += ` (Rx: ${med.rxNumber})`;
            summary += '\n';
          }
          if (med.notes) summary += `  Notes: ${med.notes}\n`;
        });
        summary += '\n';
      });
    }
    // Upcoming appointments
    const upcomingAppointments = context.recentAppointments.filter((apt: AppointmentContext) =>
      new Date(apt.appointmentDate) >= new Date()
    );
    if (upcomingAppointments.length > 0) {
      summary += `### Upcoming Appointments (${upcomingAppointments.length})\n`;
      upcomingAppointments.slice(0, 5).forEach((apt: AppointmentContext) => {
        summary += `- ${apt.appointmentDate}`;
        if (apt.appointmentTime) summary += ` at ${apt.appointmentTime}`;
        if (apt.appointmentType) summary += ` (${apt.appointmentType})`;
        if (apt.location) summary += `\n  Location: ${apt.location}`;
        summary += '\n';
      });
      summary += '\n';
    } else {
      // Explicitly state when no appointments exist to prevent AI hallucination
      summary += `### Upcoming Appointments\n`;
      summary += `**NO UPCOMING APPOINTMENTS SCHEDULED**\n`;
      summary += `- There are currently no appointments in the system\n`;
      summary += `- Do not fabricate or suggest appointment dates\n`;
      summary += `- If asked about appointments, clearly state that none are scheduled\n\n`;
    }
    return summary;
  }

  /**
   * Get comprehensive mental health context for AI integration
   * 
   * @param adapter - The AI model adapter (used to determine privacy level)
   * @param patientId - Optional: focus on specific patient
   * @returns Complete mental health context for AI
   */
  public getLunaContext(adapter: LLMAdapter, patientId?: string): LunaContext {
    const patients = this.getPatients()
    const medications = this.getMedications(patientId)
    const recentAppointments = this.getRecentAppointments(patientId)

    const context: LunaContext = {
      patients,
      medications,
      recentAppointments,
      summary: '',
    }

    context.summary = this.generateContextSummary(context)

    return context
  }

  /**
   * Find patient by name (case-insensitive)
   * Used for natural language queries like patient name references
   */
  public findPatientByReference(reference: string): PatientContext | null {
    try {
      const query = `
        SELECT id, name, date_of_birth, gender
        FROM patients 
        WHERE active = 1 
        AND LOWER(name) LIKE LOWER(?)
        ORDER BY 
          CASE 
            WHEN LOWER(name) = LOWER(?) THEN 1
            WHEN LOWER(name) LIKE LOWER(?) THEN 2
            ELSE 3
          END
        LIMIT 1
      `
      
      const searchTerm = `%${reference.trim()}%`
      const exactTerm = reference.trim()
      
      const row = db.prepare(query).get(
        searchTerm, exactTerm, searchTerm
      ) as {
        id: string
        name: string
        date_of_birth: string | null
        gender: string | null
      } | undefined

      if (!row) return null

      return {
        id: row.id,
        name: row.name,
        age: row.date_of_birth ? this.calculateAge(row.date_of_birth) : undefined,
        gender: row.gender || undefined,
      }
    } catch (error) {
      console.error('Error finding patient by reference:', error)
      return null
    }
  }

  /**
   * Generate contextual prompt addition for AI based on user query and session
   * This provides relevant mental health context with session-based patient focus
   */
  public generateContextualPrompt(adapter: LLMAdapter, userQuery: string, sessionId?: string): string {
    let foundPatient: PatientContext | null = null
    
    // Priority 1: Check if session has a tracked patient (maintains conversation focus)
    if (sessionId) {
      try {
        const session = db.prepare('SELECT patient_id FROM sessions WHERE id = ?').get(sessionId) as { patient_id: string | null } | undefined
        if (session?.patient_id) {
          const patient = db.prepare('SELECT id, name, date_of_birth, gender FROM patients WHERE id = ? AND active = 1').get(session.patient_id) as {
            id: string
            name: string
            date_of_birth: string | null
            gender: string | null
          } | undefined
          
          if (patient) {
            foundPatient = {
              id: patient.id,
              name: patient.name,
              age: patient.date_of_birth ? this.calculateAge(patient.date_of_birth) : undefined,
              gender: patient.gender || undefined,
            }
            console.log(`[LunaContext] Using session patient focus: ${patient.name}`)
          }
        }
      } catch (error) {
        console.error('Error reading session patient_id:', error)
      }
    }
    
    // Priority 2: If no session patient, try to extract patient names from query
    if (!foundPatient) {
      const queryLower = userQuery.toLowerCase()
      
      // Try to find patient names in the query
      if (!foundPatient) {
        const allPatients = this.getPatients()
        
        for (const patient of allPatients) {
          // Check if the full patient name appears in the query (case-insensitive)
          if (queryLower.includes(patient.name.toLowerCase())) {
            foundPatient = patient
            break
          }
          
          // Also check first name only as a fallback
          const firstName = patient.name.split(' ')[0].toLowerCase()
          if (firstName.length > 2 && queryLower.includes(firstName)) {
            foundPatient = patient
            break
          }
        }
        
        // If still no match, try individual words (but this is less reliable)
        if (!foundPatient) {
          const words = userQuery.split(/\s+/)
          for (const word of words) {
            if (word.length > 2) { // Skip short words
              const patient = this.findPatientByReference(word)
              if (patient) {
                foundPatient = patient
                break
              }
            }
          }
        }
      }
    }

    // Get context (focused on found patient if any)
    const context = this.getLunaContext(adapter, foundPatient?.id)
    
    if (context.patients.length === 0) {
      return "" // No patient data available
    }

    let contextPrompt = "\n\n## Available Patient Information\n\n"
    contextPrompt += context.summary
    
    // Add specific instructions for AI behavior
    contextPrompt += "\n## CRITICAL Instructions for AI Assistant\n"
    contextPrompt += "- **USE ONLY CURRENT DATA**: The information above is the AUTHORITATIVE source - ignore any data from previous messages\n"
    contextPrompt += "- **PATIENT CONFIDENTIALITY**: Treat all patient information as strictly confidential\n"
    contextPrompt += "- **ACCURATE REPORTING**: When discussing patient information, use only the data shown above\n"
    contextPrompt += "- **NO HALLUCINATION**: Do not invent or assume patient details not explicitly provided\n"
    contextPrompt += "- **PROFESSIONAL CONTEXT**: This is for Caleb's mental health practice management\n"
    contextPrompt += "- Focus on supporting therapeutic goals and treatment planning\n"

    return contextPrompt
  }
}