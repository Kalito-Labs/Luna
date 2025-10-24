/**
 * EldercareContextService
 * 
 * Provides read-only access to eldercare database for AI context integration.
 * Enables AI models to reference patient data, medications, appointments, and vitals.
 * 
 * Security: Read-only operations only. AI cannot modify eldercare data.
 * Privacy: Trusted models (local + your controlled cloud APIs) get full context.
 *          Unknown cloud models get filtered data for privacy protection.
 */

import { db } from '../db/db'
import type { LLMAdapter } from './modelRegistry'

export interface ProviderContext {
  id: string
  name: string
  specialty?: string
  phone?: string
  address?: string
  notes?: string
}

export interface PatientContext {
  id: string
  name: string
  relationship?: string
  age?: number
  gender?: string
  primaryDoctor?: string
  primaryDoctorProvider?: ProviderContext
  emergencyContact?: string
  notes?: string
}

export interface MedicationContext {
  id: string
  name: string
  genericName?: string
  dosage: string
  frequency: string
  route?: string
  prescribingDoctor?: string
  prescribingDoctorProvider?: ProviderContext
  pharmacy?: string
  pharmacyProvider?: ProviderContext
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
  providerId?: string
  provider?: ProviderContext
  preparationNotes?: string
  notes?: string
}


export interface CaregiverContext {
  id: string
  name: string
  relationship?: string
  specialties: string[]
  certifications: string[]
  isCurrentlyWorking: boolean
  clockedInSince?: string
  totalHoursWorked: number
  availabilityToday?: string
  notes?: string
}


export type EldercareContext = {
  patients: PatientContext[];
  medications: MedicationContext[];
  recentAppointments: AppointmentContext[];
  caregivers: CaregiverContext[];
  providers: ProviderContext[];
  summary: string;
};

export class EldercareContextService {
  private readonly MAX_RECENT_DAYS = 30
  /**
   * Get all healthcare providers
   */
  private getProviders(): ProviderContext[] {
    try {
      const query = `
        SELECT id, name, specialty, phone, address, notes
        FROM healthcare_providers
        ORDER BY name ASC
      `
      const rows = db.prepare(query).all() as Array<{
        id: string
        name: string
        specialty: string | null
        phone: string | null
        address: string | null
        notes: string | null
      }>
      return rows.map(row => ({
        id: row.id,
        name: row.name,
        specialty: row.specialty || undefined,
        phone: row.phone || undefined,
        address: row.address || undefined,
        notes: row.notes || undefined,
      }))
    } catch (error) {
      console.error('Error fetching providers for context:', error)
      return []
    }
  }

  /**
   * Trusted models that get full eldercare data access
   * Includes both:
   * - Local models (type === 'local') - data never leaves your machine
   * - Trusted cloud models (in this array) - your controlled API keys
   */
  private readonly TRUSTED_MODELS = [
    'gpt-4.1-nano',
  ]

  /**
   * Check if a model should get full eldercare context access
   * Local models and trusted cloud models get complete data access
   * All eldercare data stays within your application - no public sharing
   */
  private isTrustedModel(adapter: LLMAdapter): boolean {
    // Local models always get full access (data never leaves your machine)
    if (adapter.type === 'local') {
      return true
    }
    
    // Trusted cloud models (your controlled API keys) get full access
    if (this.TRUSTED_MODELS.includes(adapter.id)) {
      return true
    }
    
    // Unknown cloud models get filtered access
    return false
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
  private getPatients(includePrivateData: boolean): PatientContext[] {
    try {
      const query = `
        SELECT id, name, date_of_birth, relationship, gender, 
               primary_doctor, emergency_contact_name, notes
        FROM patients 
        WHERE active = 1 
        ORDER BY name ASC
      `
      const rows = db.prepare(query).all() as Array<{
        id: string
        name: string
        date_of_birth: string | null
        relationship: string | null
        gender: string | null
        primary_doctor: string | null
        emergency_contact_name: string | null
        notes: string | null
      }>

      // Get all providers for lookup
      const providers = this.getProviders()

      return rows.map(row => {
        const context: PatientContext = {
          id: row.id,
          name: row.name,
          relationship: row.relationship || undefined,
          age: row.date_of_birth ? this.calculateAge(row.date_of_birth) : undefined,
          gender: row.gender || undefined,
        }

        // Include sensitive data only for local models
        if (includePrivateData) {
          context.primaryDoctor = row.primary_doctor || undefined
          context.emergencyContact = row.emergency_contact_name || undefined
          context.notes = row.notes || undefined

          // Link primaryDoctorProvider if match found
          if (row.primary_doctor && typeof row.primary_doctor === 'string') {
            const doctorName = row.primary_doctor ? row.primary_doctor.toLowerCase() : ''
            const providerMatch = providers.find(p => p.name && p.name.toLowerCase() === doctorName)
            if (providerMatch) {
              context.primaryDoctorProvider = providerMatch
            }
          }
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
   */
  private getMedications(patientId?: string, includePrivateData: boolean = true): MedicationContext[] {
    try {
      let query = `
        SELECT id, patient_id, name, generic_name, dosage, frequency, route,
               prescribing_doctor, pharmacy, rx_number,
               side_effects, notes
        FROM medications 
        WHERE active = 1
      `
      const params: (string | number)[] = []
      if (patientId) {
        query += ` AND patient_id = ?`
        params.push(patientId)
      }
      query += ` ORDER BY created_at DESC LIMIT 50`

      const rows = db.prepare(query).all(...params) as Array<{
        id: string
        patient_id: string
        name: string
        generic_name: string | null
        dosage: string
        frequency: string
        route: string | null
        prescribing_doctor: string | null
        pharmacy: string | null
        rx_number: string | null
        side_effects: string | null
        notes: string | null
      }>

      // Get all providers for lookup
      const providers = this.getProviders()

      return rows.map(row => {
        const context: MedicationContext = {
          id: row.id,
          name: row.name,
          genericName: row.generic_name || undefined,
          dosage: row.dosage,
          frequency: row.frequency,
          route: row.route || undefined,
        }

        // Include sensitive data only for local models
        if (includePrivateData) {
          context.prescribingDoctor = row.prescribing_doctor || undefined
          context.pharmacy = row.pharmacy || undefined
          context.rxNumber = row.rx_number || undefined
          context.sideEffects = row.side_effects || undefined
          context.notes = row.notes || undefined

          // Link prescribingDoctorProvider if match found
          if (row.prescribing_doctor && typeof row.prescribing_doctor === 'string') {
            const doctorName = row.prescribing_doctor ? row.prescribing_doctor.toLowerCase() : ''
            const providerMatch = providers.find(p => p.name && p.name.toLowerCase() === doctorName)
            if (providerMatch) {
              context.prescribingDoctorProvider = providerMatch
            }
          }
          // Link pharmacyProvider if match found
          if (row.pharmacy && typeof row.pharmacy === 'string') {
            const pharmacyName = row.pharmacy ? row.pharmacy.toLowerCase() : ''
            const providerMatch = providers.find(p => p.name && p.name.toLowerCase() === pharmacyName)
            if (providerMatch) {
              context.pharmacyProvider = providerMatch
            }
          }
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
   */
  private getRecentAppointments(patientId?: string, includePrivateData: boolean = true): AppointmentContext[] {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - this.MAX_RECENT_DAYS)
      const cutoffDateStr = cutoffDate.toISOString().split('T')[0]

      let query = `
        SELECT a.id, a.patient_id, a.appointment_date, a.appointment_time, 
               a.appointment_type, a.location, a.status, a.provider_id, a.preparation_notes, a.notes,
               p.id as provider_id, p.name as provider_name, p.specialty as provider_specialty, p.phone as provider_phone, p.address as provider_address, p.notes as provider_notes
        FROM appointments a
        LEFT JOIN healthcare_providers p ON a.provider_id = p.id
        WHERE a.appointment_date >= ?
      `

      const params: (string | number)[] = [cutoffDateStr]
      if (patientId) {
        query += ` AND a.patient_id = ?`
        params.push(patientId)
      }

      query += ` ORDER BY a.appointment_date ASC LIMIT 20`

      const rows = db.prepare(query).all(...params) as Array<{
        id: string
        patient_id: string
        appointment_date: string
        appointment_time: string | null
        appointment_type: string | null
        location: string | null
        status: string
        provider_id: string | null
        preparation_notes: string | null
        notes: string | null
        provider_name: string | null
        provider_specialty: string | null
        provider_phone: string | null
        provider_address: string | null
        provider_notes: string | null
      }>

      return rows.map(row => {
        const context: AppointmentContext = {
          id: row.id,
          appointmentDate: row.appointment_date,
          appointmentTime: row.appointment_time || undefined,
          appointmentType: row.appointment_type || undefined,
          status: row.status,
          providerId: row.provider_id || undefined,
        }

        // Attach provider info if available
        if (row.provider_id) {
          context.provider = {
            id: row.provider_id,
            name: row.provider_name || '',
            specialty: row.provider_specialty || undefined,
            phone: row.provider_phone || undefined,
            address: row.provider_address || undefined,
            notes: row.provider_notes || undefined,
          }
        }

        // Include sensitive data only for local models
        if (includePrivateData) {
          context.location = row.location || undefined
          context.preparationNotes = row.preparation_notes || undefined
          context.notes = row.notes || undefined
        }

        return context
      })
    } catch (error) {
      console.error('Error fetching appointments for context:', error)
      return []
    }
  }

  /**
   * Get recent vital signs measurements
   */

  /**
   * Get active caregivers and their current status
   */
  private getCaregivers(includePrivateData: boolean = true): CaregiverContext[] {
    try {
      const query = `
        SELECT id, name, relationship, specialties, certifications, 
               clock_in_time, clock_out_time, total_hours_worked, 
               availability_schedule, notes
        FROM caregivers 
        WHERE is_active = 1 
        ORDER BY name ASC
      `

      const rows = db.prepare(query).all() as Array<{
        id: string
        name: string
        relationship: string | null
        specialties: string | null
        certifications: string | null
        clock_in_time: string | null
        clock_out_time: string | null
        total_hours_worked: number
        availability_schedule: string | null
        notes: string | null
      }>

      const now = new Date()
      const weekday = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() // 'monday', 'tuesday', etc.
      const today = weekday.substring(0, 3) // 'mon', 'tue', etc.

      return rows.map(row => {
        const specialties = row.specialties ? JSON.parse(row.specialties) : []
        const certifications = row.certifications ? JSON.parse(row.certifications) : []
        const availability = row.availability_schedule ? JSON.parse(row.availability_schedule) : {}

        // Determine availability today
        let availabilityToday: string | undefined
        const todaySchedule = availability[today + 'day'] // 'monday', 'tuesday', etc.
        if (todaySchedule?.available) {
          availabilityToday = `${todaySchedule.start} - ${todaySchedule.end}`
        }

        const context: CaregiverContext = {
          id: row.id,
          name: row.name,
          relationship: row.relationship || undefined,
          specialties,
          certifications,
          isCurrentlyWorking: !!row.clock_in_time && !row.clock_out_time,
          clockedInSince: row.clock_in_time || undefined,
          totalHoursWorked: row.total_hours_worked || 0,
          availabilityToday,
        }

        // Include sensitive data only for local models
        if (includePrivateData) {
          context.notes = row.notes || undefined
        }

        return context
      })
    } catch (error) {
      console.error('Error fetching caregivers for context:', error)
      return []
    }
  }

  /**
   * Generate a summary of eldercare context for AI
   */
  private generateContextSummary(context: EldercareContext): string {
  // Use context directly, destructuring removed
    let summary = "## Eldercare Context Summary\n\n";
    // Patients summary
    if (context.patients.length > 0) {
      summary += `### Patients (${context.patients.length})\n`;
      context.patients.forEach((patient: PatientContext) => {
        summary += `- **${patient.name}**`;
        if (patient.relationship) summary += ` (${patient.relationship})`;
        if (patient.age) summary += `, age ${patient.age}`;
        if (patient.gender) summary += `, ${patient.gender}`;
        summary += '\n';
      });
      summary += '\n';
    }
    // Active medications summary
    if (context.medications.length > 0) {
      summary += `### Active Medications (${context.medications.length})\n`;
      const medicationsByPatient = context.medications.reduce((acc: string[], med: MedicationContext) => {
        acc.push(`- ${med.name} ${med.dosage} (${med.frequency})`);
        return acc;
      }, []);
      summary += medicationsByPatient.slice(0, 10).join('\n') + '\n\n';
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
        summary += '\n';
      });
      summary += '\n';
    }
    // Active caregivers summary
    if (context.caregivers.length > 0) {
      summary += `\n### Active Caregivers (${context.caregivers.length})\n`;
      context.caregivers.forEach((caregiver: CaregiverContext) => {
        summary += `- **${caregiver.name}**`;
        if (caregiver.relationship) summary += ` (${caregiver.relationship})`;
        if (caregiver.isCurrentlyWorking) {
          summary += ' - Currently Working';
          if (caregiver.clockedInSince) {
            const clockedIn = new Date(caregiver.clockedInSince);
            const hours = Math.round((Date.now() - clockedIn.getTime()) / (1000 * 60 * 60) * 10) / 10;
            summary += ` (${hours}h)`;
          }
        } else if (caregiver.availabilityToday) {
          summary += ` - Available today: ${caregiver.availabilityToday}`;
        }
        if (caregiver.specialties && caregiver.specialties.length > 0) {
          summary += ` | Specialties: ${caregiver.specialties.slice(0, 2).join(', ')}`;
        }
        summary += '\n';
      });
    }
    return summary;
  }

  /**
   * Get comprehensive eldercare context for AI integration
   * 
   * @param adapter - The AI model adapter (used to determine privacy level)
   * @param patientId - Optional: focus on specific patient
   * @returns Complete eldercare context for AI
   */
  public getEldercareContext(adapter: LLMAdapter, patientId?: string): EldercareContext {
    const includePrivateData = this.isTrustedModel(adapter)

    const patients = this.getPatients(includePrivateData)
    const medications = this.getMedications(patientId, includePrivateData)
    const recentAppointments = this.getRecentAppointments(patientId, includePrivateData)
    const caregivers = this.getCaregivers(includePrivateData)
    const providers = this.getProviders()

    const context: EldercareContext = {
      patients,
      medications,
      recentAppointments,
      caregivers,
      providers,
      summary: '',
    }

    context.summary = this.generateContextSummary(context)

    return context
  }

  /**
   * Find patient by name or relationship (case-insensitive)
   * Used for natural language queries like "my dad" or "John"
   */
  public findPatientByReference(reference: string): PatientContext | null {
    try {
      const query = `
        SELECT id, name, relationship, date_of_birth, gender
        FROM patients 
        WHERE active = 1 
        AND (LOWER(name) LIKE LOWER(?) OR LOWER(relationship) LIKE LOWER(?))
        ORDER BY 
          CASE 
            WHEN LOWER(name) = LOWER(?) THEN 1
            WHEN LOWER(relationship) = LOWER(?) THEN 2
            WHEN LOWER(name) LIKE LOWER(?) THEN 3
            ELSE 4
          END
        LIMIT 1
      `
      
      const searchTerm = `%${reference.trim()}%`
      const exactTerm = reference.trim()
      
      const row = db.prepare(query).get(
        searchTerm, searchTerm, exactTerm, exactTerm, searchTerm
      ) as {
        id: string
        name: string
        relationship: string | null
        date_of_birth: string | null
        gender: string | null
      } | undefined

      if (!row) return null

      return {
        id: row.id,
        name: row.name,
        relationship: row.relationship || undefined,
        age: row.date_of_birth ? this.calculateAge(row.date_of_birth) : undefined,
        gender: row.gender || undefined,
      }
    } catch (error) {
      console.error('Error finding patient by reference:', error)
      return null
    }
  }

  /**
   * Generate contextual prompt addition for AI based on user query
   * This analyzes the user's query and adds relevant eldercare context
   */
  public generateContextualPrompt(adapter: LLMAdapter, userQuery: string): string {
    // Look for patient references in the query
    const patientKeywords = ['dad', 'father', 'mom', 'mother', 'parent', 'spouse', 'wife', 'husband']
    const queryLower = userQuery.toLowerCase()
    
    let foundPatient: PatientContext | null = null
    
    // Check for direct patient references
    for (const keyword of patientKeywords) {
      if (queryLower.includes(keyword)) {
        foundPatient = this.findPatientByReference(keyword)
        break
      }
    }

    // If no direct keyword match, try to extract names from the query
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

    // Get context (focused on found patient if any)
    const context = this.getEldercareContext(adapter, foundPatient?.id)
    
    if (context.patients.length === 0) {
      return "" // No eldercare data available
    }

    let contextPrompt = "\n\n## Available Eldercare Information\n\n"
    contextPrompt += context.summary
    
    // Add specific instructions for AI behavior
    contextPrompt += "\n## Instructions for AI Assistant\n"
    contextPrompt += "- Use the eldercare information above to provide relevant, helpful responses\n"
    contextPrompt += "- When referencing patients, use their names and relationships naturally\n"
    contextPrompt += "- Focus on practical caregiving support and information organization\n"
    
    // Only show privacy note for untrusted cloud models (not your controlled APIs)
    if (!this.isTrustedModel(adapter)) {
      contextPrompt += "- Note: Limited eldercare data provided (untrusted cloud model)\n"
    }

    return contextPrompt
  }
}