/**
 * Therapy Records Service
 * Business logic for managing CBT, ACT, and DBT therapy records
 */

import { db } from '../db/db'

export type TherapyType = 'cbt' | 'act' | 'dbt'

/**
 * Base therapy record structure
 */
export interface TherapyRecord {
  id: string
  patient_id: string
  session_id?: string | null
  therapy_type: TherapyType
  record_data: string // JSON string in DB
  created_at: string
  updated_at: string
}

/**
 * Therapy record with parsed JSON data
 */
export interface TherapyRecordWithData<T = Record<string, unknown>> extends Omit<TherapyRecord, 'record_data'> {
  data: T
}

/**
 * CBT Thought Record data structure
 */
export interface CBTThoughtRecordData {
  situation: string
  automaticThought: string
  emotion: string
  emotionIntensity: number
  evidenceFor: string
  evidenceAgainst: string
  alternativeThought: string
  newEmotion: string
  newEmotionIntensity: number
}

/**
 * ACT Record data structure (placeholder)
 */
export interface ACTRecordData {
  [key: string]: unknown
}

/**
 * DBT Record data structure (placeholder)
 */
export interface DBTRecordData {
  [key: string]: unknown
}

/**
 * Create therapy record request
 */
export interface CreateTherapyRecordRequest<T = Record<string, unknown>> {
  patient_id: string
  session_id?: string
  therapy_type: TherapyType
  data: T
}

/**
 * Query options for fetching therapy records
 */
export interface TherapyRecordQueryOptions {
  limit?: number
  offset?: number
  startDate?: string
  endDate?: string
  therapy_type?: TherapyType
  sortOrder?: 'ASC' | 'DESC'
}

/**
 * Service class for managing therapy records
 */
export class TherapyRecordsService {
  /**
   * Generate a unique ID for therapy records
   */
  private generateId(): string {
    return `therapy-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
  }

  /**
   * Parse record data from JSON string
   */
  private parseRecordData<T>(recordData: string): T {
    try {
      return JSON.parse(recordData) as T
    } catch {
      throw new Error('Invalid record data JSON')
    }
  }

  /**
   * Convert TherapyRecord to TherapyRecordWithData
   */
  private toRecordWithData<T>(record: TherapyRecord): TherapyRecordWithData<T> {
    const { record_data, ...rest } = record
    return {
      ...rest,
      data: this.parseRecordData<T>(record_data)
    }
  }

  /**
   * Create a new therapy record
   */
  createRecord<T = Record<string, unknown>>(request: CreateTherapyRecordRequest<T>): TherapyRecordWithData<T> {
    const id = this.generateId()
    const now = new Date().toISOString()
    
    const recordDataJson = JSON.stringify(request.data)

    const stmt = db.prepare(`
      INSERT INTO therapy_records (
        id, patient_id, session_id, therapy_type, record_data, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `)

    stmt.run(
      id,
      request.patient_id,
      request.session_id || null,
      request.therapy_type,
      recordDataJson,
      now,
      now
    )

    const record = this.getRecord<T>(id)
    if (!record) {
      throw new Error('Failed to create therapy record')
    }

    return record
  }

  /**
   * Get a specific therapy record by ID
   */
  getRecord<T = Record<string, unknown>>(id: string): TherapyRecordWithData<T> | null {
    const stmt = db.prepare(`
      SELECT * FROM therapy_records WHERE id = ?
    `)
    
    const record = stmt.get(id) as TherapyRecord | undefined
    return record ? this.toRecordWithData<T>(record) : null
  }

  /**
   * Get all therapy records with optional filtering
   */
  getRecords<T = Record<string, unknown>>(options: TherapyRecordQueryOptions = {}): TherapyRecordWithData<T>[] {
    const {
      limit = 100,
      offset = 0,
      startDate,
      endDate,
      therapy_type,
      sortOrder = 'DESC'
    } = options

    // Build dynamic query
    const conditions: string[] = []
    const params: unknown[] = []

    if (therapy_type) {
      conditions.push('therapy_type = ?')
      params.push(therapy_type)
    }

    if (startDate) {
      conditions.push('DATE(created_at) >= DATE(?)')
      params.push(startDate)
    }

    if (endDate) {
      conditions.push('DATE(created_at) <= DATE(?)')
      params.push(endDate)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const query = `
      SELECT * FROM therapy_records
      ${whereClause}
      ORDER BY created_at ${sortOrder}
      LIMIT ? OFFSET ?
    `

    params.push(limit, offset)

    const stmt = db.prepare(query)
    const records = stmt.all(...params) as TherapyRecord[]

    return records.map(record => this.toRecordWithData<T>(record))
  }

  /**
   * Get therapy records by patient ID
   */
  getRecordsByPatient<T = Record<string, unknown>>(
    patientId: string,
    options: TherapyRecordQueryOptions = {}
  ): TherapyRecordWithData<T>[] {
    const {
      limit = 100,
      offset = 0,
      therapy_type,
      sortOrder = 'DESC'
    } = options

    const conditions: string[] = ['patient_id = ?']
    const params: unknown[] = [patientId]

    if (therapy_type) {
      conditions.push('therapy_type = ?')
      params.push(therapy_type)
    }

    const query = `
      SELECT * FROM therapy_records
      WHERE ${conditions.join(' AND ')}
      ORDER BY created_at ${sortOrder}
      LIMIT ? OFFSET ?
    `

    params.push(limit, offset)

    const stmt = db.prepare(query)
    const records = stmt.all(...params) as TherapyRecord[]

    return records.map(record => this.toRecordWithData<T>(record))
  }

  /**
   * Get therapy records by session ID
   */
  getRecordsBySession<T = Record<string, unknown>>(sessionId: string): TherapyRecordWithData<T>[] {
    const stmt = db.prepare(`
      SELECT * FROM therapy_records
      WHERE session_id = ?
      ORDER BY created_at DESC
    `)

    const records = stmt.all(sessionId) as TherapyRecord[]
    return records.map(record => this.toRecordWithData<T>(record))
  }

  /**
   * Delete a therapy record by ID
   */
  deleteRecord(id: string): boolean {
    const stmt = db.prepare(`
      DELETE FROM therapy_records WHERE id = ?
    `)

    const result = stmt.run(id)
    return result.changes > 0
  }

  /**
   * Get count of therapy records by type
   */
  getRecordCount(therapyType?: TherapyType, patientId?: string): number {
    const conditions: string[] = []
    const params: unknown[] = []

    if (therapyType) {
      conditions.push('therapy_type = ?')
      params.push(therapyType)
    }

    if (patientId) {
      conditions.push('patient_id = ?')
      params.push(patientId)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const stmt = db.prepare(`
      SELECT COUNT(*) as count FROM therapy_records ${whereClause}
    `)

    const result = stmt.get(...params) as { count: number }
    return result.count
  }

  /**
   * Get therapy record statistics by type
   */
  getRecordStats(patientId?: string): Record<TherapyType, number> {
    const conditions = patientId ? 'WHERE patient_id = ?' : ''
    const params = patientId ? [patientId] : []

    const stmt = db.prepare(`
      SELECT therapy_type, COUNT(*) as count
      FROM therapy_records
      ${conditions}
      GROUP BY therapy_type
    `)

    const results = stmt.all(...params) as Array<{ therapy_type: TherapyType; count: number }>

    return {
      cbt: results.find(r => r.therapy_type === 'cbt')?.count || 0,
      act: results.find(r => r.therapy_type === 'act')?.count || 0,
      dbt: results.find(r => r.therapy_type === 'dbt')?.count || 0
    }
  }
}

// Export singleton instance
export const therapyRecordsService = new TherapyRecordsService()
