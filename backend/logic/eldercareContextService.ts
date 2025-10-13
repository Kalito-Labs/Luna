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

export interface PatientContext {
  id: string
  name: string
  relationship?: string
  age?: number
  gender?: string
  primaryDoctor?: string
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
}

export interface VitalContext {
  id: string
  measurementType: string
  systolic?: number
  diastolic?: number
  value?: number
  unit?: string
  measuredAt: string
  measuredBy?: string
  location?: string
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

export interface EldercareContext {
  patients: PatientContext[]
  medications: MedicationContext[]
  recentAppointments: AppointmentContext[]
  recentVitals: VitalContext[]
  caregivers: CaregiverContext[]
  summary: string
}

export class EldercareContextService {
  private readonly MAX_RECENT_DAYS = 30

  /**
   * Trusted cloud models that get full eldercare data access
   * These are your controlled API keys, data stays within your application
   */
  private readonly TRUSTED_CLOUD_MODELS = [
    'gpt-4.1-nano',
  ]

  /**
   * Check if a model should get full eldercare context access
   * Local models and trusted cloud models get complete data access
   * All eldercare data stays within your application - no public sharing
   */
  private isLocalModel(adapter: LLMAdapter): boolean {
    // Local models always get full access
    if (adapter.type === 'local') {
      return true
    }
    
    // Trusted cloud models (your controlled API keys) get full access
    if (this.TRUSTED_CLOUD_MODELS.includes(adapter.id)) {
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
        SELECT id, patient_id, appointment_date, appointment_time, 
               appointment_type, location, status, preparation_notes, notes
        FROM appointments 
        WHERE appointment_date >= ?
      `
      
      const params: (string | number)[] = [cutoffDateStr]
      if (patientId) {
        query += ` AND patient_id = ?`
        params.push(patientId)
      }
      
      query += ` ORDER BY appointment_date ASC LIMIT 20`

      const rows = db.prepare(query).all(...params) as Array<{
        id: string
        patient_id: string
        appointment_date: string
        appointment_time: string | null
        appointment_type: string | null
        location: string | null
        status: string
        preparation_notes: string | null
        notes: string | null
      }>

      return rows.map(row => {
        const context: AppointmentContext = {
          id: row.id,
          appointmentDate: row.appointment_date,
          appointmentTime: row.appointment_time || undefined,
          appointmentType: row.appointment_type || undefined,
          status: row.status,
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
  private getRecentVitals(patientId?: string, includePrivateData: boolean = true): VitalContext[] {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - this.MAX_RECENT_DAYS)
      const cutoffDateStr = cutoffDate.toISOString()

      let query = `
        SELECT id, patient_id, measurement_type, systolic, diastolic, 
               value, unit, measured_at, measured_by, location, notes
        FROM vitals 
        WHERE measured_at >= ?
      `
      
      const params: (string | number)[] = [cutoffDateStr]
      if (patientId) {
        query += ` AND patient_id = ?`
        params.push(patientId)
      }
      
      query += ` ORDER BY measured_at DESC LIMIT 50`

      const rows = db.prepare(query).all(...params) as Array<{
        id: string
        patient_id: string
        measurement_type: string
        systolic: number | null
        diastolic: number | null
        value: number | null
        unit: string | null
        measured_at: string
        measured_by: string | null
        location: string | null
        notes: string | null
      }>

      return rows.map(row => {
        const context: VitalContext = {
          id: row.id,
          measurementType: row.measurement_type,
          systolic: row.systolic || undefined,
          diastolic: row.diastolic || undefined,
          value: row.value || undefined,
          unit: row.unit || undefined,
          measuredAt: row.measured_at,
        }

        // Include sensitive data only for local models
        if (includePrivateData) {
          context.measuredBy = row.measured_by || undefined
          context.location = row.location || undefined
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
    const { patients, medications, recentAppointments, recentVitals, caregivers } = context
    
    let summary = "## Eldercare Context Summary\n\n"
    
    // Patients summary
    if (patients.length > 0) {
      summary += `### Patients (${patients.length})\n`
      patients.forEach(patient => {
        summary += `- **${patient.name}**`
        if (patient.relationship) summary += ` (${patient.relationship})`
        if (patient.age) summary += `, age ${patient.age}`
        if (patient.gender) summary += `, ${patient.gender}`
        summary += '\n'
      })
      summary += '\n'
    }

    // Active medications summary
    if (medications.length > 0) {
      summary += `### Active Medications (${medications.length})\n`
      const medicationsByPatient = medications.reduce((acc, med) => {
        // Note: We'll need patient lookup for this, simplified for now
        acc.push(`- ${med.name} ${med.dosage} (${med.frequency})`)
        return acc
      }, [] as string[])
      summary += medicationsByPatient.slice(0, 10).join('\n') + '\n\n'
    }

    // Upcoming appointments
    const upcomingAppointments = recentAppointments.filter(apt => 
      new Date(apt.appointmentDate) >= new Date()
    )
    if (upcomingAppointments.length > 0) {
      summary += `### Upcoming Appointments (${upcomingAppointments.length})\n`
      upcomingAppointments.slice(0, 5).forEach(apt => {
        summary += `- ${apt.appointmentDate}`
        if (apt.appointmentTime) summary += ` at ${apt.appointmentTime}`
        if (apt.appointmentType) summary += ` (${apt.appointmentType})`
        summary += '\n'
      })
      summary += '\n'
    }

    // Recent vitals summary
    if (recentVitals.length > 0) {
      summary += `### Recent Vitals (last ${this.MAX_RECENT_DAYS} days)\n`
      const vitalsByType = recentVitals.reduce((acc, vital) => {
        if (!acc[vital.measurementType]) acc[vital.measurementType] = []
        acc[vital.measurementType].push(vital)
        return acc
      }, {} as Record<string, VitalContext[]>)

      Object.entries(vitalsByType).forEach(([type, vitals]) => {
        const latest = vitals[0] // Already sorted by date DESC
        summary += `- **${type}**: `
        if (type === 'blood_pressure' && latest.systolic && latest.diastolic) {
          summary += `${latest.systolic}/${latest.diastolic}`
        } else if (latest.value) {
          summary += `${latest.value}${latest.unit || ''}`
        }
        summary += ` (${new Date(latest.measuredAt).toLocaleDateString()})\n`
      })
    }

    // Active caregivers summary
    if (caregivers.length > 0) {
      summary += `\n### Active Caregivers (${caregivers.length})\n`
      caregivers.forEach(caregiver => {
        summary += `- **${caregiver.name}**`
        if (caregiver.relationship) summary += ` (${caregiver.relationship})`
        if (caregiver.isCurrentlyWorking) {
          summary += ' - Currently Working'
          if (caregiver.clockedInSince) {
            const clockedIn = new Date(caregiver.clockedInSince)
            const hours = Math.round((Date.now() - clockedIn.getTime()) / (1000 * 60 * 60) * 10) / 10
            summary += ` (${hours}h)`
          }
        } else if (caregiver.availabilityToday) {
          summary += ` - Available today: ${caregiver.availabilityToday}`
        }
        if (caregiver.specialties && caregiver.specialties.length > 0) {
          summary += ` | Specialties: ${caregiver.specialties.slice(0, 2).join(', ')}`
        }
        summary += '\n'
      })
    }

    return summary
  }

  /**
   * Get comprehensive eldercare context for AI integration
   * 
   * @param adapter - The AI model adapter (used to determine privacy level)
   * @param patientId - Optional: focus on specific patient
   * @returns Complete eldercare context for AI
   */
  public getEldercareContext(adapter: LLMAdapter, patientId?: string): EldercareContext {
    const includePrivateData = this.isLocalModel(adapter)

    const patients = this.getPatients(includePrivateData)
    const medications = this.getMedications(patientId, includePrivateData)
    const recentAppointments = this.getRecentAppointments(patientId, includePrivateData)
    const recentVitals = this.getRecentVitals(patientId, includePrivateData)
    const caregivers = this.getCaregivers(includePrivateData)

    const context: EldercareContext = {
      patients,
      medications,
      recentAppointments,
      recentVitals,
      caregivers,
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
    contextPrompt += "- For medical advice, always recommend consulting healthcare professionals\n"
    contextPrompt += "- Focus on practical caregiving support and information organization\n"
    contextPrompt += "- Maintain a compassionate, family-focused tone\n"
    
    // Only show privacy note for untrusted cloud models (not your controlled APIs)
    if (!this.isLocalModel(adapter)) {
      contextPrompt += "- Note: Limited eldercare data provided (untrusted cloud model)\n"
    }

    return contextPrompt
  }
}