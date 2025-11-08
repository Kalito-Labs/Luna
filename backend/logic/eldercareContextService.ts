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
  practiceName?: string
  phone?: string
  email?: string
  address?: string
  notes?: string
  preferred?: boolean
}

export interface PatientContext {
  id: string
  name: string
  relationship?: string
  age?: number
  gender?: string
  phone?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
  primaryDoctor?: string
  primaryDoctorProvider?: ProviderContext
  doctorAddress?: string
  doctorPhone?: string
  insuranceProvider?: string
  insuranceId?: string
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
  outcomeSummary?: string
  followUpRequired?: boolean
}


export interface CaregiverContext {
  id: string
  name: string
  relationship?: string
  notes?: string
}

export interface VitalContext {
  id: string
  patientId: string
  patientName?: string
  weightLbs?: number
  glucoseAm?: number
  glucosePm?: number
  recordedDate: string
  notes?: string
}

export type EldercareContext = {
  patients: PatientContext[];
  medications: MedicationContext[];
  recentAppointments: AppointmentContext[];
  vitals: VitalContext[];
  caregiver: CaregiverContext | null;  // Singleton - only one caregiver (you)
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
        SELECT id, name, specialty, practice_name, phone, email, address, notes, preferred
        FROM healthcare_providers
        ORDER BY name ASC
      `
      const rows = db.prepare(query).all() as Array<{
        id: string
        name: string
        specialty: string | null
        practice_name: string | null
        phone: string | null
        email: string | null
        address: string | null
        notes: string | null
        preferred: number
      }>
      return rows.map(row => ({
        id: row.id,
        name: row.name,
        specialty: row.specialty || undefined,
        practiceName: row.practice_name || undefined,
        phone: row.phone || undefined,
        email: row.email || undefined,
        address: row.address || undefined,
        notes: row.notes || undefined,
        preferred: row.preferred === 1,
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
               phone, emergency_contact_name, emergency_contact_phone,
               primary_doctor, doctor_address, doctor_phone,
               insurance_provider, insurance_id, notes
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
        phone: string | null
        emergency_contact_name: string | null
        emergency_contact_phone: string | null
        primary_doctor: string | null
        doctor_address: string | null
        doctor_phone: string | null
        insurance_provider: string | null
        insurance_id: string | null
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
          context.phone = row.phone || undefined
          context.emergencyContactName = row.emergency_contact_name || undefined
          context.emergencyContactPhone = row.emergency_contact_phone || undefined
          context.primaryDoctor = row.primary_doctor || undefined
          context.doctorAddress = row.doctor_address || undefined
          context.doctorPhone = row.doctor_phone || undefined
          context.insuranceProvider = row.insurance_provider || undefined
          context.insuranceId = row.insurance_id || undefined
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
        SELECT m.id, m.patient_id, m.name, m.generic_name, m.dosage, m.frequency, m.route,
               m.prescribing_doctor, m.pharmacy, m.rx_number,
               m.side_effects, m.notes,
               p.name as patient_name
        FROM medications m
        LEFT JOIN patients p ON m.patient_id = p.id
        WHERE m.active = 1
      `
      const params: (string | number)[] = []
      if (patientId) {
        query += ` AND m.patient_id = ?`
        params.push(patientId)
      }
      query += ` ORDER BY m.created_at DESC LIMIT 50`

      const rows = db.prepare(query).all(...params) as Array<{
        id: string
        patient_id: string
        patient_name: string
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
          patientId: row.patient_id,
          patientName: row.patient_name || undefined,
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
               a.appointment_type, a.location, a.status, a.provider_id, 
               a.preparation_notes, a.notes, a.outcome_summary, a.follow_up_required,
               p.id as provider_id, p.name as provider_name, p.specialty as provider_specialty, 
               p.practice_name as provider_practice_name, p.phone as provider_phone, 
               p.email as provider_email, p.address as provider_address, 
               p.notes as provider_notes, p.preferred as provider_preferred
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
        outcome_summary: string | null
        follow_up_required: number
        provider_name: string | null
        provider_specialty: string | null
        provider_practice_name: string | null
        provider_phone: string | null
        provider_email: string | null
        provider_address: string | null
        provider_notes: string | null
        provider_preferred: number
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
            practiceName: row.provider_practice_name || undefined,
            phone: row.provider_phone || undefined,
            email: row.provider_email || undefined,
            address: row.provider_address || undefined,
            notes: row.provider_notes || undefined,
            preferred: row.provider_preferred === 1,
          }
        }

        // Include sensitive data only for local models
        if (includePrivateData) {
          context.location = row.location || undefined
          context.preparationNotes = row.preparation_notes || undefined
          context.notes = row.notes || undefined
          context.outcomeSummary = row.outcome_summary || undefined
          context.followUpRequired = row.follow_up_required === 1
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
  private getVitals(patientId?: string, includePrivateData: boolean = true): VitalContext[] {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - this.MAX_RECENT_DAYS)
      const cutoffDateStr = cutoffDate.toISOString().split('T')[0]

      let query = `
        SELECT v.id, v.patient_id, v.weight_lbs, v.glucose_am, v.glucose_pm,
               v.recorded_date, v.notes,
               p.name as patient_name
        FROM vitals v
        LEFT JOIN patients p ON v.patient_id = p.id
        WHERE v.active = 1 AND v.recorded_date >= ?
      `

      const params: (string | number)[] = [cutoffDateStr]
      if (patientId) {
        query += ` AND v.patient_id = ?`
        params.push(patientId)
      }

      query += ` ORDER BY v.recorded_date DESC LIMIT 50`

      const rows = db.prepare(query).all(...params) as Array<{
        id: string
        patient_id: string
        patient_name: string
        weight_lbs: number | null
        glucose_am: number | null
        glucose_pm: number | null
        recorded_date: string
        notes: string | null
      }>

      return rows.map(row => {
        const context: VitalContext = {
          id: row.id,
          patientId: row.patient_id,
          patientName: row.patient_name || undefined,
          recordedDate: row.recorded_date,
        }

        // Include data based on privacy setting
        if (includePrivateData) {
          context.weightLbs = row.weight_lbs || undefined
          context.glucoseAm = row.glucose_am || undefined
          context.glucosePm = row.glucose_pm || undefined
          context.notes = row.notes || undefined
        }

        return context
      })
    } catch (error) {
      console.error('Error fetching vitals for context:', error)
      return []
    }
  }

  /**
   * Get caregiver profile (singleton - there's only one caregiver: you)
   */
  private getCaregiver(includePrivateData: boolean = true): CaregiverContext | null {
    try {
      const query = `
        SELECT id, name, relationship, notes
        FROM caregivers 
        LIMIT 1
      `

      const row = db.prepare(query).get() as {
        id: string
        name: string
        relationship: string | null
        notes: string | null
      } | undefined

      if (!row) {
        return null
      }

      const context: CaregiverContext = {
        id: row.id,
        name: row.name,
        relationship: row.relationship || undefined,
      }

      // Include sensitive data only for local models
      if (includePrivateData && row.notes) {
        context.notes = row.notes
      }

      return context
    } catch (error) {
      console.error('Error fetching caregiver for context:', error)
      return null
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
        if (patient.phone) summary += `\n  Phone: ${patient.phone}`;
        if (patient.primaryDoctor) {
          summary += `\n  Primary Doctor: ${patient.primaryDoctor}`;
          if (patient.doctorPhone) summary += ` (${patient.doctorPhone})`;
          if (patient.doctorAddress) summary += `\n  Doctor Address: ${patient.doctorAddress}`;
        }
        if (patient.emergencyContactName) {
          summary += `\n  Emergency Contact: ${patient.emergencyContactName}`;
          if (patient.emergencyContactPhone) summary += ` (${patient.emergencyContactPhone})`;
        }
        if (patient.insuranceProvider) {
          summary += `\n  Insurance: ${patient.insuranceProvider}`;
          if (patient.insuranceId) summary += ` (ID: ${patient.insuranceId})`;
        }
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
        if (apt.provider) {
          summary += `\n  Provider: ${apt.provider.name}`;
          if (apt.provider.specialty) summary += ` (${apt.provider.specialty})`;
          if (apt.provider.phone) summary += `\n  Phone: ${apt.provider.phone}`;
          if (apt.location) summary += `\n  Location: ${apt.location}`;
        }
        summary += '\n';
      });
      summary += '\n';
    }
    // Recent vitals
    if (context.vitals.length > 0) {
      summary += `### Recent Vital Signs (${context.vitals.length})\n`;
      context.vitals.slice(0, 10).forEach((vital: VitalContext) => {
        summary += `- ${vital.recordedDate}`;
        if (vital.patientName) summary += ` - ${vital.patientName}`;
        const measurements = []
        if (vital.weightLbs) measurements.push(`Weight: ${vital.weightLbs} lbs`)
        if (vital.glucoseAm) measurements.push(`Glucose AM: ${vital.glucoseAm} mg/dL`)
        if (vital.glucosePm) measurements.push(`Glucose PM: ${vital.glucosePm} mg/dL`)
        if (measurements.length > 0) {
          summary += `\n  ${measurements.join(', ')}`
        }
        if (vital.notes) summary += `\n  Notes: ${vital.notes}`
        summary += '\n';
      });
      summary += '\n';
    }
    // Healthcare providers summary
    if (context.providers.length > 0) {
      summary += `### Healthcare Providers (${context.providers.length})\n`;
      context.providers.slice(0, 10).forEach((provider: ProviderContext) => {
        summary += `- **${provider.name}**`;
        if (provider.specialty) summary += ` (${provider.specialty})`;
        if (provider.practiceName) summary += `\n  Practice: ${provider.practiceName}`;
        if (provider.phone) summary += `\n  Phone: ${provider.phone}`;
        if (provider.address) summary += `\n  Address: ${provider.address}`;
        if (provider.email) summary += `\n  Email: ${provider.email}`;
        summary += '\n';
      });
      summary += '\n';
    }
    // Caregiver summary (singleton)
    if (context.caregiver) {
      summary += `### Caregiver\n`;
      summary += `- **${context.caregiver.name}**`;
      if (context.caregiver.relationship) {
        summary += ` (${context.caregiver.relationship})`;
      }
      summary += '\n\n';
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
    const vitals = this.getVitals(patientId, includePrivateData)
    const caregiver = this.getCaregiver(includePrivateData)
    const providers = this.getProviders()

    const context: EldercareContext = {
      patients,
      medications,
      recentAppointments,
      vitals,
      caregiver,
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

    // If no direct keyword match, try to find patient names in the query
    if (!foundPatient) {
      // First, try to match full patient names (handles "Aurora Sanchez", "Basilio Sanchez", etc.)
      // Get all active patients to search through their names
      const allPatients = this.getPatients(true) // We just need names, so includePrivateData can be true for this search
      
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

    // Get context (focused on found patient if any)
    const context = this.getEldercareContext(adapter, foundPatient?.id)
    
    if (context.patients.length === 0) {
      return "" // No eldercare data available
    }

    let contextPrompt = "\n\n## Available Eldercare Information\n\n"
    contextPrompt += context.summary
    
    // Add specific instructions for AI behavior
    contextPrompt += "\n## CRITICAL Instructions for AI Assistant\n"
    contextPrompt += "- **USE ONLY CURRENT DATA**: The medication list above is the AUTHORITATIVE source - ignore any medication data from previous messages\n"
    contextPrompt += "- **MEDICATION LISTING REQUIREMENTS**: When asked about medications, you MUST list ONLY the medications shown above for the requested patient\n"
    contextPrompt += "- **MANDATORY FIELDS**: ALWAYS include ALL details for every medication: name, dosage, frequency, prescribing doctor, pharmacy, and RX number\n"
    contextPrompt += "- **RX NUMBERS ARE PROVIDED**: Every medication above includes an RX number in format '(Rx: XXXXX)' - NEVER say 'not specified' or 'not provided'\n"
    contextPrompt += "- **DO NOT HALLUCINATE**: Only use medication data shown above - do not invent or recall medications from memory or previous conversations\n"
    contextPrompt += "- **PATIENT ACCURACY**: Verify you are listing medications for the correct patient - do not mix up patients\n"
    contextPrompt += "- When referencing patients, use their names and relationships naturally\n"
    contextPrompt += "- Focus on practical caregiving support and information organization\n"
    
    // Only show privacy note for untrusted cloud models (not your controlled APIs)
    if (!this.isTrustedModel(adapter)) {
      contextPrompt += "- Note: Limited eldercare data provided (untrusted cloud model)\n"
    }

    return contextPrompt
  }
}