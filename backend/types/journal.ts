/**
 * Journal Entry Types
 * Types for Luna's journaling and mood tracking system
 */

/**
 * Supported mood types matching the emotion tracker UI
 */
export type MoodType = 
  | 'happy' 
  | 'excited' 
  | 'grateful' 
  | 'relaxed' 
  | 'content'
  | 'tired' 
  | 'unsure' 
  | 'bored' 
  | 'anxious' 
  | 'angry'
  | 'stressed' 
  | 'sad' 
  | 'desperate'

/**
 * Journal entry types
 */
export type JournalType = 'free' | 'prompted' | 'mood_check'

/**
 * Privacy levels for journal entries
 */
export type PrivacyLevel = 'private' | 'shared_with_therapist'

/**
 * Main journal entry interface
 */
export interface JournalEntry {
  id: string
  patient_id: string
  session_id?: string
  title?: string
  content: string
  entry_date: string  // YYYY-MM-DD
  entry_time?: string // HH:MM
  mood?: MoodType
  emotions?: string   // JSON string array of MoodType[]
  journal_type: JournalType
  prompt_used?: string
  privacy_level: PrivacyLevel
  favorite: number    // SQLite boolean (0 or 1)
  created_at: string
  updated_at: string
}

/**
 * Journal entry with parsed emotions array
 */
export interface JournalEntryWithEmotions extends Omit<JournalEntry, 'emotions'> {
  emotions?: MoodType[]
}

/**
 * Request to create a new journal entry
 */
export interface CreateJournalEntryRequest {
  patient_id: string
  session_id?: string
  title?: string
  content: string
  entry_date: string
  entry_time?: string
  mood?: MoodType
  emotions?: MoodType[]
  journal_type?: JournalType
  prompt_used?: string
  privacy_level?: PrivacyLevel
}

/**
 * Request to update an existing journal entry
 */
export interface UpdateJournalEntryRequest {
  title?: string
  content?: string
  entry_date?: string
  entry_time?: string
  mood?: MoodType
  emotions?: MoodType[]
  journal_type?: JournalType
  prompt_used?: string
  privacy_level?: PrivacyLevel
  favorite?: boolean
}

/**
 * Query options for retrieving journal entries
 */
export interface JournalQueryOptions {
  limit?: number
  offset?: number
  startDate?: string
  endDate?: string
  mood?: MoodType
  journal_type?: JournalType
  favorite?: boolean
  sortBy?: 'entry_date' | 'created_at' | 'updated_at'
  sortOrder?: 'ASC' | 'DESC'
}

/**
 * Calendar entry data for a specific date
 */
export interface CalendarEntry {
  date: string // YYYY-MM-DD
  entries: JournalEntryWithEmotions[]
  primaryMood?: MoodType
  entryCount: number
}

/**
 * Mood statistics for analytics
 */
export interface MoodStats {
  patient_id: string
  totalEntries: number
  moodBreakdown: Record<MoodType, number>
  mostCommonMood?: MoodType
  moodTrend?: 'improving' | 'stable' | 'declining'
  journalingStreak: number
  lastEntryDate?: string
}

/**
 * Entry insights from AI analysis
 */
export interface EntryInsights {
  entry_id: string
  emotionalTone: 'positive' | 'neutral' | 'negative'
  keyThemes: string[]
  suggestedFollowUp?: string
  therapeuticNotes?: string
}

/**
 * Date range for queries
 */
export interface DateRange {
  start: string // YYYY-MM-DD
  end: string   // YYYY-MM-DD
}
