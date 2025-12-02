/**
 * Journal Service
 * Business logic for Luna's journaling and mood tracking system
 */

import { db } from '../db/db'
import type {
  JournalEntry,
  JournalEntryWithEmotions,
  CreateJournalEntryRequest,
  UpdateJournalEntryRequest,
  JournalQueryOptions,
  CalendarEntry,
  MoodStats,
  MoodType,
  DateRange
} from '../types/journal'

/**
 * Service class for managing journal entries
 */
export class JournalService {
  /**
   * Generate a unique ID for journal entries
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
  }

  /**
   * Parse emotions JSON string to array
   */
  private parseEmotions(emotionsJson?: string): MoodType[] | undefined {
    if (!emotionsJson) return undefined
    try {
      return JSON.parse(emotionsJson) as MoodType[]
    } catch {
      return undefined
    }
  }

  /**
   * Convert JournalEntry to JournalEntryWithEmotions
   */
  private toEntryWithEmotions(entry: JournalEntry): JournalEntryWithEmotions {
    const { emotions, ...rest } = entry
    return {
      ...rest,
      emotions: this.parseEmotions(emotions)
    }
  }

  /**
   * Create a new journal entry
   */
  createEntry(data: CreateJournalEntryRequest): JournalEntryWithEmotions {
    const id = this.generateId()
    const now = new Date().toISOString()
    
    const emotionsJson = data.emotions ? JSON.stringify(data.emotions) : null

    const stmt = db.prepare(`
      INSERT INTO journal_entries (
        id, patient_id, session_id, title, content, entry_date, entry_time,
        mood, mood_scale, sleep_hours, emotions, journal_type, prompt_used, privacy_level,
        favorite, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
    `)

    stmt.run(
      id,
      data.patient_id,
      data.session_id || null,
      data.title || null,
      data.content,
      data.entry_date,
      data.entry_time || null,
      data.mood || null,
      data.mood_scale || null,
      data.sleep_hours || null,
      emotionsJson,
      data.journal_type || 'free',
      data.prompt_used || null,
      data.privacy_level || 'private',
      now,
      now
    )

    const entry = this.getEntry(id)
    if (!entry) {
      throw new Error('Failed to create journal entry')
    }

    return entry
  }

  /**
   * Get a specific journal entry by ID
   */
  getEntry(id: string): JournalEntryWithEmotions | null {
    const stmt = db.prepare(`
      SELECT * FROM journal_entries WHERE id = ?
    `)
    
    const entry = stmt.get(id) as JournalEntry | undefined
    return entry ? this.toEntryWithEmotions(entry) : null
  }

  /**
   * Update an existing journal entry
   */
  updateEntry(id: string, data: UpdateJournalEntryRequest): JournalEntryWithEmotions {
    const now = new Date().toISOString()
    
    // Build dynamic update query
    const updates: string[] = []
    const values: unknown[] = []

    if (data.title !== undefined) {
      updates.push('title = ?')
      values.push(data.title)
    }
    if (data.content !== undefined) {
      updates.push('content = ?')
      values.push(data.content)
    }
    if (data.entry_date !== undefined) {
      updates.push('entry_date = ?')
      values.push(data.entry_date)
    }
    if (data.entry_time !== undefined) {
      updates.push('entry_time = ?')
      values.push(data.entry_time)
    }
    if (data.mood !== undefined) {
      updates.push('mood = ?')
      values.push(data.mood)
    }
    if (data.mood_scale !== undefined) {
      updates.push('mood_scale = ?')
      values.push(data.mood_scale)
    }
    if (data.sleep_hours !== undefined) {
      updates.push('sleep_hours = ?')
      values.push(data.sleep_hours)
    }
    if (data.emotions !== undefined) {
      updates.push('emotions = ?')
      values.push(JSON.stringify(data.emotions))
    }
    if (data.journal_type !== undefined) {
      updates.push('journal_type = ?')
      values.push(data.journal_type)
    }
    if (data.prompt_used !== undefined) {
      updates.push('prompt_used = ?')
      values.push(data.prompt_used)
    }
    if (data.privacy_level !== undefined) {
      updates.push('privacy_level = ?')
      values.push(data.privacy_level)
    }
    if (data.favorite !== undefined) {
      updates.push('favorite = ?')
      values.push(data.favorite ? 1 : 0)
    }

    updates.push('updated_at = ?')
    values.push(now)
    values.push(id)

    const stmt = db.prepare(`
      UPDATE journal_entries 
      SET ${updates.join(', ')}
      WHERE id = ?
    `)

    stmt.run(...values)

    const entry = this.getEntry(id)
    if (!entry) {
      throw new Error('Entry not found after update')
    }

    return entry
  }

  /**
   * Delete a journal entry
   */
  deleteEntry(id: string): boolean {
    const stmt = db.prepare(`
      DELETE FROM journal_entries WHERE id = ?
    `)
    
    const result = stmt.run(id)
    return result.changes > 0
  }

  /**
   * Get all entries for a patient with optional filtering
   */
  getEntriesByPatient(
    patientId: string, 
    options: JournalQueryOptions = {}
  ): JournalEntryWithEmotions[] {
    const {
      limit = 50,
      offset = 0,
      startDate,
      endDate,
      mood,
      journal_type,
      favorite,
      sortBy = 'entry_date',
      sortOrder = 'DESC'
    } = options

    const conditions: string[] = ['patient_id = ?']
    const values: unknown[] = [patientId]

    if (startDate) {
      conditions.push('entry_date >= ?')
      values.push(startDate)
    }
    if (endDate) {
      conditions.push('entry_date <= ?')
      values.push(endDate)
    }
    if (mood) {
      conditions.push('mood = ?')
      values.push(mood)
    }
    if (journal_type) {
      conditions.push('journal_type = ?')
      values.push(journal_type)
    }
    if (favorite !== undefined) {
      conditions.push('favorite = ?')
      values.push(favorite ? 1 : 0)
    }

    const stmt = db.prepare(`
      SELECT * FROM journal_entries
      WHERE ${conditions.join(' AND ')}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT ? OFFSET ?
    `)

    values.push(limit, offset)

    const entries = stmt.all(...values) as JournalEntry[]
    return entries.map(entry => this.toEntryWithEmotions(entry))
  }

  /**
   * Get entries for a specific date range
   */
  getEntriesByDateRange(
    patientId: string, 
    start: string, 
    end: string
  ): JournalEntryWithEmotions[] {
    return this.getEntriesByPatient(patientId, {
      startDate: start,
      endDate: end,
      sortBy: 'entry_date',
      sortOrder: 'ASC'
    })
  }

  /**
   * Get entries organized by date for calendar view
   */
  getEntriesForMonth(
    patientId: string, 
    year: number, 
    month: number
  ): CalendarEntry[] {
    // Calculate first and last day of month
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const lastDay = new Date(year, month, 0).getDate()
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

    const entries = this.getEntriesByDateRange(patientId, startDate, endDate)

    // Group by date
    const grouped = new Map<string, JournalEntryWithEmotions[]>()
    
    for (const entry of entries) {
      const date = entry.entry_date
      if (!grouped.has(date)) {
        grouped.set(date, [])
      }
      grouped.get(date)!.push(entry)
    }

    // Convert to CalendarEntry array
    const calendarEntries: CalendarEntry[] = []
    
    for (const [date, dateEntries] of grouped.entries()) {
      // Find most common mood for the day
      const moodCounts = new Map<MoodType, number>()
      for (const entry of dateEntries) {
        if (entry.mood) {
          moodCounts.set(entry.mood, (moodCounts.get(entry.mood) || 0) + 1)
        }
      }
      
      let primaryMood: MoodType | undefined
      let maxCount = 0
      for (const [mood, count] of moodCounts.entries()) {
        if (count > maxCount) {
          maxCount = count
          primaryMood = mood
        }
      }

      calendarEntries.push({
        date,
        entries: dateEntries,
        primaryMood,
        entryCount: dateEntries.length
      })
    }

    return calendarEntries.sort((a, b) => a.date.localeCompare(b.date))
  }

  /**
   * Get recent entries (for dashboard/homepage)
   */
  getRecentEntries(
    patientId: string, 
    limit: number = 3
  ): JournalEntryWithEmotions[] {
    return this.getEntriesByPatient(patientId, {
      limit,
      sortBy: 'created_at',
      sortOrder: 'DESC'
    })
  }

  /**
   * Get mood statistics for a patient
   */
  getMoodStatistics(
    patientId: string, 
    dateRange?: DateRange
  ): MoodStats {
    const options: JournalQueryOptions = {
      limit: 1000, // Get all for statistics
      sortBy: 'entry_date',
      sortOrder: 'DESC'
    }

    if (dateRange) {
      options.startDate = dateRange.start
      options.endDate = dateRange.end
    }

    const entries = this.getEntriesByPatient(patientId, options)

    // Calculate mood breakdown
    const moodBreakdown: Record<string, number> = {}
    const moodTypes: MoodType[] = [
      'happy', 'excited', 'grateful', 'relaxed', 'content',
      'tired', 'unsure', 'bored', 'anxious', 'angry',
      'stressed', 'sad', 'desperate'
    ]
    
    for (const mood of moodTypes) {
      moodBreakdown[mood] = 0
    }

    for (const entry of entries) {
      if (entry.mood) {
        moodBreakdown[entry.mood]++
      }
    }

    // Find most common mood
    let mostCommonMood: MoodType | undefined
    let maxCount = 0
    for (const [mood, count] of Object.entries(moodBreakdown)) {
      if (count > maxCount) {
        maxCount = count
        mostCommonMood = mood as MoodType
      }
    }

    // Calculate journaling streak
    const streak = this.getJournalStreak(patientId)

    // Get last entry date
    const lastEntry = entries.length > 0 ? entries[0] : null

    return {
      patient_id: patientId,
      totalEntries: entries.length,
      moodBreakdown: moodBreakdown as Record<MoodType, number>,
      mostCommonMood,
      journalingStreak: streak,
      lastEntryDate: lastEntry?.entry_date
    }
  }

  /**
   * Calculate current journaling streak (consecutive days)
   */
  getJournalStreak(patientId: string): number {
    const stmt = db.prepare(`
      SELECT DISTINCT entry_date 
      FROM journal_entries 
      WHERE patient_id = ?
      ORDER BY entry_date DESC
      LIMIT 365
    `)

    const entries = stmt.all(patientId) as { entry_date: string }[]
    
    if (entries.length === 0) return 0

    let streak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let i = 0; i < entries.length; i++) {
      const entryDate = new Date(entries[i].entry_date)
      entryDate.setHours(0, 0, 0, 0)
      
      const expectedDate = new Date(today)
      expectedDate.setDate(today.getDate() - i)
      
      if (entryDate.getTime() === expectedDate.getTime()) {
        streak++
      } else {
        break
      }
    }

    return streak
  }

  /**
   * Search entries by content
   */
  searchEntries(
    patientId: string,
    searchTerm: string,
    limit: number = 20
  ): JournalEntryWithEmotions[] {
    const stmt = db.prepare(`
      SELECT * FROM journal_entries
      WHERE patient_id = ? 
      AND (content LIKE ? OR title LIKE ?)
      ORDER BY entry_date DESC
      LIMIT ?
    `)

    const pattern = `%${searchTerm}%`
    const entries = stmt.all(patientId, pattern, pattern, limit) as JournalEntry[]
    return entries.map(entry => this.toEntryWithEmotions(entry))
  }

  /**
   * Toggle favorite status
   */
  toggleFavorite(id: string): JournalEntryWithEmotions {
    const entry = this.getEntry(id)
    if (!entry) {
      throw new Error('Entry not found')
    }

    const newFavoriteStatus = entry.favorite === 1 ? 0 : 1
    
    return this.updateEntry(id, { favorite: newFavoriteStatus === 1 })
  }

  /**
   * Get favorite entries
   */
  getFavoriteEntries(patientId: string): JournalEntryWithEmotions[] {
    return this.getEntriesByPatient(patientId, {
      favorite: true,
      sortBy: 'entry_date',
      sortOrder: 'DESC'
    })
  }
}

// Export singleton instance
export const journalService = new JournalService()
