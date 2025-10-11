// backend/types/caregiver.ts

export interface CaregiverScheduleDay {
  start: string
  end: string
  available: boolean
}

export interface CaregiverSchedule {
  monday?: CaregiverScheduleDay
  tuesday?: CaregiverScheduleDay
  wednesday?: CaregiverScheduleDay
  thursday?: CaregiverScheduleDay
  friday?: CaregiverScheduleDay
  saturday?: CaregiverScheduleDay
  sunday?: CaregiverScheduleDay
}

export interface CaregiverClockStatus {
  clockedIn: boolean
  clockInTime: string | null
  clockOutTime: string | null
}

export interface CaregiverScheduleResponse {
  availability: CaregiverSchedule
  currentShift: CaregiverClockStatus
}

export interface Caregiver {
  id: string
  name: string
  date_of_birth?: string
  email?: string
  phone?: string
  address?: string
  relationship?: string
  specialties: string[]
  certifications: string[]
  availability_schedule: CaregiverSchedule
  emergency_contact_name?: string
  emergency_contact_phone?: string
  notes?: string
  clock_in_time?: string
  clock_out_time?: string
  is_active: number
  last_clock_in?: string
  last_clock_out?: string
  total_hours_worked: number
  hourly_rate?: number
  created_at: string
  updated_at: string
}

export interface CaregiverDbRow {
  id: string
  name: string
  date_of_birth: string | null
  email: string | null
  phone: string | null
  address: string | null
  relationship: string | null
  specialties: string | null // JSON string
  certifications: string | null // JSON string
  availability_schedule: string | null // JSON string
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  notes: string | null
  clock_in_time: string | null
  clock_out_time: string | null
  is_active: number
  last_clock_in: string | null
  last_clock_out: string | null
  total_hours_worked: number
  hourly_rate: number | null
  created_at: string
  updated_at: string
}

export interface CreateCaregiverRequest {
  name: string
  date_of_birth?: string
  email?: string
  phone?: string
  address?: string
  relationship?: string
  specialties?: string[]
  certifications?: string[]
  availability_schedule?: CaregiverSchedule
  emergency_contact_name?: string
  emergency_contact_phone?: string
  notes?: string
  hourly_rate?: number
}

export interface UpdateCaregiverRequest {
  name?: string
  date_of_birth?: string
  email?: string
  phone?: string
  address?: string
  relationship?: string
  specialties?: string[]
  certifications?: string[]
  availability_schedule?: CaregiverSchedule
  emergency_contact_name?: string
  emergency_contact_phone?: string
  notes?: string
  hourly_rate?: number
  is_active?: number
}

export interface ClockInOutRequest {
  action: 'clock_in' | 'clock_out'
  timestamp?: string
}