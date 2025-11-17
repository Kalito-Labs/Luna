/**
 * Frontend Journal Types
 * Type definitions for Luna's journaling system (frontend)
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

export type JournalType = 'free' | 'prompted' | 'mood_check'
export type PrivacyLevel = 'private' | 'shared_with_therapist'

export interface JournalEntry {
  id: string
  patient_id: string
  session_id?: string
  title?: string
  content: string
  entry_date: string  // YYYY-MM-DD
  entry_time?: string // HH:MM
  mood?: MoodType
  emotions?: MoodType[]
  journal_type: JournalType
  prompt_used?: string
  privacy_level: PrivacyLevel
  favorite: number    // 0 or 1
  created_at: string
  updated_at: string
}

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

export interface CalendarEntry {
  date: string
  entries: JournalEntry[]
  primaryMood?: MoodType
  entryCount: number
}

export interface MoodStats {
  patient_id: string
  totalEntries: number
  moodBreakdown: Record<MoodType, number>
  mostCommonMood?: MoodType
  moodTrend?: 'improving' | 'stable' | 'declining'
  journalingStreak: number
  lastEntryDate?: string
}
