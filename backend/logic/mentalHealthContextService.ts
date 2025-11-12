/**
 * Mental Health Context Service
 * 
 * Retrieves and formats mental health data from the database for AI model context.
 * Provides: user profile, mood tracking, journal entries, coping strategies, therapy appointments
 */

import Database from 'better-sqlite3';

// ============================================================================
// Mental Health Context Interfaces
// ============================================================================

/**
 * User profile context
 */
export interface UserContext {
  id: number;
  name: string;
  age: number;
  dateOfBirth: string;
  contactPhone?: string;
  contactEmail?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
  notes?: string;
}

/**
 * Mood tracking entry context
 */
export interface MoodContext {
  id: number;
  date: string;
  mood: string;
  intensity: number; // 1-10 scale
  triggers?: string;
  notes?: string;
  activities?: string;
}

/**
 * Journal entry context
 */
export interface JournalContext {
  id: number;
  date: string;
  title?: string;
  content: string;
  tags?: string[];
  mood?: string;
}

/**
 * Coping strategy context
 */
export interface CopingStrategyContext {
  id: number;
  name: string;
  category: string; // 'grounding', 'breathing', 'cognitive', 'physical', 'social'
  description: string;
  steps?: string[];
  effectiveness?: number; // User-rated 1-10
  lastUsed?: string;
  timesUsed?: number;
}

/**
 * Therapy appointment context
 */
export interface TherapyAppointmentContext {
  id: number;
  date: string;
  time: string;
  type: string; // 'therapy', 'psychiatry', 'group', 'crisis'
  providerName?: string;
  status: string; // 'scheduled', 'completed', 'cancelled'
  notes?: string;
}

/**
 * Medication context (adapted from eldercare version)
 */
export interface MedicationContext {
  id: number;
  name: string;
  dosage: string;
  frequency: string;
  purpose: string;
  startDate: string;
  endDate?: string;
  instructions?: string;
  sideEffects?: string;
  prescribingDoctor?: string;
  pharmacy?: string;
}

/**
 * Aggregated mental health context
 */
export interface MentalHealthContext {
  user: UserContext;
  recentMoods: MoodContext[];
  recentJournalEntries: JournalContext[];
  copingStrategies: CopingStrategyContext[];
  upcomingAppointments: TherapyAppointmentContext[];
  currentMedications: MedicationContext[];
  contextSummary: string;
}

// ============================================================================
// Mental Health Context Service
// ============================================================================

export class MentalHealthContextService {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  /**
   * Check if the model is trusted with full user data
   * Local models and specific cloud models are trusted
   */
  private isTrustedModel(modelId: string): boolean {
    const trustedModels = ['gpt-4.1-nano']; // Minimal trusted cloud models
    const isLocal = !modelId.startsWith('gpt-') && 
                   !modelId.startsWith('claude-') && 
                   !modelId.startsWith('gemini-');
    return isLocal || trustedModels.includes(modelId);
  }

  /**
   * Calculate age from date of birth
   */
  private calculateAge(dateOfBirth: string): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  /**
   * Get user profile (single user system)
   */
  private getUser(includePrivateInfo: boolean = true): UserContext | null {
    try {
      const query = `
        SELECT 
          id,
          name,
          date_of_birth,
          contact_phone,
          contact_email,
          emergency_contact_name,
          emergency_contact_phone,
          emergency_contact_relationship,
          notes
        FROM patients
        LIMIT 1
      `;

      const row = this.db.prepare(query).get() as { 
        id: number;
        name: string;
        date_of_birth: string;
        contact_phone: string | null;
        contact_email: string | null;
        emergency_contact_name: string | null;
        emergency_contact_phone: string | null;
        emergency_contact_relationship: string | null;
        notes: string | null;
      } | undefined;
      
      if (!row) return null;

      const user: UserContext = {
        id: row.id,
        name: row.name,
        age: this.calculateAge(row.date_of_birth),
        dateOfBirth: row.date_of_birth,
        notes: row.notes || undefined
      };

      // Include private info only for trusted models
      if (includePrivateInfo) {
        user.contactPhone = row.contact_phone || undefined;
        user.contactEmail = row.contact_email || undefined;
        user.emergencyContactName = row.emergency_contact_name || undefined;
        user.emergencyContactPhone = row.emergency_contact_phone || undefined;
        user.emergencyContactRelationship = row.emergency_contact_relationship || undefined;
      }

      return user;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  /**
   * Get recent mood tracking entries
   */
  private getMoodHistory(_days: number = 14): MoodContext[] {
    // TODO: Implement when mood_tracking table is created
    // For now, return empty array
    return [];

    /* Future implementation:
    try {
      const query = `
        SELECT 
          id,
          date,
          mood,
          intensity,
          triggers,
          notes,
          activities
        FROM mood_tracking
        WHERE date >= date('now', '-${_days} days')
        ORDER BY date DESC
        LIMIT 50
      `;

      const rows = this.db.prepare(query).all() as Array<{
        id: number;
        date: string;
        mood: string;
        intensity: number;
        triggers: string | null;
        notes: string | null;
        activities: string | null;
      }>;
      return rows.map(row => ({
        id: row.id,
        date: row.date,
        mood: row.mood,
        intensity: row.intensity,
        triggers: row.triggers || undefined,
        notes: row.notes || undefined,
        activities: row.activities || undefined
      }));
    } catch (error) {
      console.error('Error getting mood history:', error);
      return [];
    }
    */
  }

  /**
   * Get recent journal entries
   */
  private getJournalEntries(_limit: number = 10): JournalContext[] {
    // TODO: Implement when journal_entries table is created
    // For now, return empty array
    return [];

    /* Future implementation would look like:
      const query = `SELECT id, date, title, content, tags, mood 
                     FROM journal_entries ORDER BY date DESC LIMIT ?`;
      const rows = this.db.prepare(query).all(_limit);
      return rows.map(row => ({ ...row }));
    */
  }

  /**
   * Get user's coping strategies
   */
  private getCopingStrategies(): CopingStrategyContext[] {
    // TODO: Implement when coping_strategies table is created
    // For now, return empty array
    return [];

    /* Future implementation would look like:
      const query = `SELECT id, name, category, description, steps, 
                     effectiveness, last_used, times_used FROM coping_strategies 
                     ORDER BY effectiveness DESC, times_used DESC`;
      const rows = this.db.prepare(query).all();
      return rows.map(row => ({ ...row }));
    */
  }

  /**
   * Get upcoming therapy appointments
   */
  private getUpcomingAppointments(days: number = 30): TherapyAppointmentContext[] {
    try {
      const query = `
        SELECT 
          id,
          date,
          time,
          type,
          provider_name,
          status,
          notes
        FROM appointments
        WHERE date >= date('now')
          AND date <= date('now', '+${days} days')
        ORDER BY date ASC, time ASC
        LIMIT 10
      `;

      const rows = this.db.prepare(query).all() as Array<{
        id: number;
        date: string;
        time: string;
        type: string | null;
        provider_name: string | null;
        status: string;
        notes: string | null;
      }>;
      return rows.map(row => ({
        id: row.id,
        date: row.date,
        time: row.time,
        type: row.type || 'therapy',
        providerName: row.provider_name || undefined,
        status: row.status,
        notes: row.notes || undefined
      }));
    } catch (error) {
      console.error('Error getting appointments:', error);
      return [];
    }
  }

  /**
   * Get current medications (mental health meds)
   */
  private getMedications(): MedicationContext[] {
    try {
      const query = `
        SELECT 
          id,
          name,
          dosage,
          frequency,
          purpose,
          start_date,
          end_date,
          instructions,
          side_effects,
          prescribing_doctor,
          pharmacy
        FROM medications
        WHERE active = 1
        ORDER BY name ASC
      `;

      const rows = this.db.prepare(query).all() as Array<{
        id: number;
        name: string;
        dosage: string;
        frequency: string;
        purpose: string | null;
        start_date: string;
        end_date: string | null;
        instructions: string | null;
        side_effects: string | null;
        prescribing_doctor: string | null;
        pharmacy: string | null;
      }>;

      return rows.map(row => ({
        id: row.id,
        name: row.name,
        dosage: row.dosage,
        frequency: row.frequency,
        purpose: row.purpose || '',
        startDate: row.start_date,
        endDate: row.end_date || undefined,
        instructions: row.instructions || undefined,
        sideEffects: row.side_effects || undefined,
        prescribingDoctor: row.prescribing_doctor || undefined,
        pharmacy: row.pharmacy || undefined
      }));
    } catch (error) {
      console.error('Error getting medications:', error);
      return [];
    }
  }

  /**
   * Generate a comprehensive mental health context summary
   */
  private generateContextSummary(
    user: UserContext | null,
    moods: MoodContext[],
    journals: JournalContext[],
    copingStrategies: CopingStrategyContext[],
    appointments: TherapyAppointmentContext[],
    medications: MedicationContext[]
  ): string {
    let summary = '# Mental Health Context Summary\n\n';

    // User Profile
    if (user) {
      summary += '## User Profile\n';
      summary += `- Name: ${user.name}\n`;
      summary += `- Age: ${user.age}\n`;
      if (user.notes) {
        summary += `- Notes: ${user.notes}\n`;
      }
      summary += '\n';
    }

    // Recent Mood Patterns
    if (moods.length > 0) {
      summary += '## Recent Mood Patterns (Last 14 Days)\n';
      const moodSummary = moods.slice(0, 7).map(m => 
        `- ${m.date}: ${m.mood} (${m.intensity}/10)${m.triggers ? ` - Triggers: ${m.triggers}` : ''}`
      ).join('\n');
      summary += moodSummary + '\n\n';
    }

    // Recent Journal Entries
    if (journals.length > 0) {
      summary += '## Recent Journal Entries\n';
      const journalSummary = journals.slice(0, 3).map(j => 
        `- ${j.date}${j.title ? `: ${j.title}` : ''}\n  ${j.content.substring(0, 150)}${j.content.length > 150 ? '...' : ''}`
      ).join('\n');
      summary += journalSummary + '\n\n';
    }

    // Coping Strategies
    if (copingStrategies.length > 0) {
      summary += '## Available Coping Strategies\n';
      const strategySummary = copingStrategies.map(s => 
        `- ${s.name} (${s.category})${s.effectiveness ? ` - Effectiveness: ${s.effectiveness}/10` : ''}`
      ).join('\n');
      summary += strategySummary + '\n\n';
    }

    // Upcoming Appointments
    if (appointments.length > 0) {
      summary += '## Upcoming Appointments\n';
      const appointmentSummary = appointments.map(a => 
        `- ${a.date} at ${a.time}: ${a.type}${a.providerName ? ` with ${a.providerName}` : ''}`
      ).join('\n');
      summary += appointmentSummary + '\n\n';
    }

    // Current Medications
    if (medications.length > 0) {
      summary += '## Current Medications\n';
      const medSummary = medications.map(m => 
        `- ${m.name} ${m.dosage} - ${m.frequency}${m.purpose ? ` (${m.purpose})` : ''}`
      ).join('\n');
      summary += medSummary + '\n\n';
    }

    // Important Instructions
    summary += '## Important Instructions\n';
    summary += '- Always reference actual data from this context\n';
    summary += '- Never hallucinate or make up information\n';
    summary += '- If medication details are unclear, ask the user to clarify\n';
    summary += '- Respect user privacy and emotional state\n';
    summary += '- Provide supportive, non-judgmental responses\n';

    return summary;
  }

  /**
   * Get complete mental health context for AI model
   */
  public getMentalHealthContext(modelId: string): MentalHealthContext {
    const isTrusted = this.isTrustedModel(modelId);
    
    const user = this.getUser(isTrusted);
    const moods = this.getMoodHistory(14);
    const journals = this.getJournalEntries(10);
    const copingStrategies = this.getCopingStrategies();
    const appointments = this.getUpcomingAppointments(30);
    const medications = this.getMedications();

    const contextSummary = this.generateContextSummary(
      user,
      moods,
      journals,
      copingStrategies,
      appointments,
      medications
    );

    return {
      user: user!,
      recentMoods: moods,
      recentJournalEntries: journals,
      copingStrategies: copingStrategies,
      upcomingAppointments: appointments,
      currentMedications: medications,
      contextSummary
    };
  }

  /**
   * Generate a contextual prompt for the AI model
   * This adds the mental health context to the system prompt
   */
  public generateContextualPrompt(modelId: string, basePrompt: string): string {
    const context = this.getMentalHealthContext(modelId);
    
    let contextualPrompt = basePrompt + '\n\n';
    contextualPrompt += '---\n\n';
    contextualPrompt += context.contextSummary;
    
    return contextualPrompt;
  }
}
