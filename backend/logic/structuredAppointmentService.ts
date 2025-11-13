/**
 * Structured Appointment Service
 * 
 * Provides appointment data in structured format with validation.
 * Prevents AI hallucinations by returning verified database ground truth.
 */

import { db } from '../db/db'

export interface StructuredAppointment {
  appointment_date: string
  appointment_time?: string
  appointment_type?: string
  location?: string
  status: string
}

export interface AppointmentListResponse {
  patient_id: string
  patient_name: string
  upcoming_count: number
  upcoming_appointments: StructuredAppointment[]
  has_appointments: boolean
}

/**
 * Enhanced appointment interface for LunaContextService with additional fields
 */
export interface LunaAppointment {
  id: string
  appointment_date: string
  appointment_time?: string
  appointment_type?: string
  location?: string
  status: string
  preparation_notes?: string
  notes?: string
  outcome_summary?: string
  follow_up_required?: boolean
}

export class StructuredAppointmentService {
  /**
   * Get appointments in strictly structured format
   */
  public getAppointmentsStructured(patientId: string): AppointmentListResponse | null {
    try {
      // Get patient info
      const patient = db.prepare(`
        SELECT id, name FROM patients WHERE id = ? AND active = 1
      `).get(patientId) as { id: string; name: string } | undefined

      if (!patient) {
        return null
      }

      // Get upcoming appointments (today and future)
      const today = new Date().toISOString().split('T')[0]
      const appointmentRows = db.prepare(`
        SELECT 
          a.appointment_date,
          a.appointment_time,
          a.appointment_type,
          a.location,
          a.status
        FROM appointments a
        WHERE a.patient_id = ?
        AND a.appointment_date >= ?
        ORDER BY a.appointment_date ASC, a.appointment_time ASC
      `).all(patientId, today) as Array<{
        appointment_date: string
        appointment_time: string | null
        appointment_type: string | null
        location: string | null
        status: string
      }>

      const appointments: StructuredAppointment[] = appointmentRows.map(row => ({
        appointment_date: row.appointment_date,
        appointment_time: row.appointment_time || undefined,
        appointment_type: row.appointment_type || undefined,
        location: row.location || undefined,
        status: row.status
      }))

      return {
        patient_id: patient.id,
        patient_name: patient.name,
        upcoming_count: appointments.length,
        upcoming_appointments: appointments,
        has_appointments: appointments.length > 0
      }
    } catch (error) {
      console.error('[StructuredAppointmentService] Error fetching appointments:', error)
      return null
    }
  }

  /**
   * Format appointments as definitive text response
   */
  public formatAppointmentsAsText(data: AppointmentListResponse): string {
    if (!data.has_appointments || data.upcoming_count === 0) {
      return `${data.patient_name} has **NO upcoming appointments scheduled**.\n\nThere are currently no appointments in the database. If you'd like to schedule one, please let me know.`
    }

    let text = `${data.patient_name} has **${data.upcoming_count} upcoming appointment${data.upcoming_count > 1 ? 's' : ''}**:\n\n`

    data.upcoming_appointments.forEach((apt, idx) => {
      text += `${idx + 1}. **${apt.appointment_date}**`
      if (apt.appointment_time) {
        text += ` at ${apt.appointment_time}`
      }
      text += `\n`
      
      if (apt.appointment_type) {
        text += `   • Type: ${apt.appointment_type}\n`
      }
      if (apt.location) {
        text += `   • Location: ${apt.location}\n`
      }
      text += `   • Status: ${apt.status}\n`
      text += `\n`
    })

    return text.trim()
  }

  /**
   * Get recent appointments for LunaContextService (both past and upcoming within date range)
   * @param patientId - Optional patient ID, if not provided returns for all patients
   * @param maxRecentDays - Number of days back to include (default 30)
   */
  public getRecentAppointmentsForContext(patientId?: string, maxRecentDays: number = 30): LunaAppointment[] {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - maxRecentDays)
      const cutoffDateStr = cutoffDate.toISOString().split('T')[0]

      let query = `
        SELECT a.id, a.patient_id, a.appointment_date, a.appointment_time, 
               a.appointment_type, a.location, a.status,
               a.preparation_notes, a.notes, a.outcome_summary, a.follow_up_required
        FROM appointments a
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
        preparation_notes: string | null
        notes: string | null
        outcome_summary: string | null
        follow_up_required: number
      }>

      return rows.map(row => ({
        id: row.id,
        appointment_date: row.appointment_date,
        appointment_time: row.appointment_time || undefined,
        appointment_type: row.appointment_type || undefined,
        status: row.status,
        location: row.location || undefined,
        preparation_notes: row.preparation_notes || undefined,
        notes: row.notes || undefined,
        outcome_summary: row.outcome_summary || undefined,
        follow_up_required: row.follow_up_required === 1,
      }))
    } catch (error) {
      console.error('[StructuredAppointmentService] Error fetching recent appointments for context:', error)
      return []
    }
  }
}
