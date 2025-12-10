/**
 * LunaContextService
 * 
 * Provides AI context integration for Luna mental health practice.
 * Enables AI models to reference patient data, medications, and journal entries.
 * 
 * Uses structured services for consistent data validation and error handling.
 * Security: Read-only operations only. AI cannot modify patient data.
 * Privacy: All models get full context access for Caleb's practice.
 */

import { db } from '../db/db'

export interface PatientContext {
  id: string
  name: string
  age?: number
  gender?: string
  phone?: string
  city?: string
  state?: string
  occupation?: string
  occupation_description?: string
  languages?: string
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
  pharmacy?: string
  rxNumber?: string
  sideEffects?: string
  notes?: string
}

export interface JournalContext {
  id: string
  patientId: string
  patientName?: string
  title?: string
  content: string
  entryDate: string
  entryTime?: string
  mood?: string
  moodScale?: number
  sleepHours?: number
  emotions?: string[]
  journalType?: string
  wordCount: number
}

export interface TherapyRecordContext {
  id: string
  patientId: string
  patientName?: string
  therapyType: 'cbt' | 'act' | 'dbt'
  recordData: Record<string, unknown>
  createdAt: string
  sessionId?: string
}

export interface CBTThoughtRecordContext extends TherapyRecordContext {
  therapyType: 'cbt'
  recordData: {
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
  improvementScore?: number  // Calculate emotional improvement (before vs after)
}

export interface DatasetContext {
  id: string
  name: string
  description?: string
  chunkCount: number
  accessLevel: 'read' | 'summary' | 'reference_only'
  enabled: boolean
  chunks: DatasetChunk[]
}

export interface DatasetChunk {
  id: string
  content: string
  chunkIndex: number
  sectionTitle?: string
  pageNumber?: number
  tokenCount?: number
}

export type LunaContext = {
  patients: PatientContext[];
  medications: MedicationContext[];
  journalEntries: JournalContext[];
  therapyRecords: TherapyRecordContext[];
  cbtThoughtRecords: CBTThoughtRecordContext[];
  datasets: DatasetContext[];
  summary: string;
};

export class LunaContextService {
  private readonly MAX_RECENT_DAYS = 30
  
  constructor() {
    // No services needed - using direct database queries
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
  private getPatients(): PatientContext[] {
    try {
      const query = `
        SELECT id, name, date_of_birth, gender, 
               phone, city, state, occupation, occupation_description,
               languages, notes
        FROM patients 
        WHERE active = 1 
        ORDER BY name ASC
      `
      const rows = db.prepare(query).all() as Array<{
        id: string
        name: string
        date_of_birth: string | null
        gender: string | null
        phone: string | null
        city: string | null
        state: string | null
        occupation: string | null
        occupation_description: string | null
        languages: string | null
        notes: string | null
      }>

      return rows.map(row => {
        const context: PatientContext = {
          id: row.id,
          name: row.name,
          age: row.date_of_birth ? this.calculateAge(row.date_of_birth) : undefined,
          gender: row.gender || undefined,
          phone: row.phone || undefined,
          city: row.city || undefined,
          state: row.state || undefined,
          occupation: row.occupation || undefined,
          occupation_description: row.occupation_description || undefined,
          languages: row.languages || undefined,
          notes: row.notes || undefined,
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
   * Uses direct database query for efficiency with all medication fields
   */
  private getMedications(patientId?: string): MedicationContext[] {
    try {
      let query = `
        SELECT 
          m.id,
          m.patient_id,
          m.name,
          m.generic_name,
          m.dosage,
          m.frequency,
          m.route,
          m.prescribing_doctor,
          m.pharmacy,
          m.rx_number,
          m.side_effects,
          m.notes,
          p.name as patient_name
        FROM medications m
        LEFT JOIN patients p ON m.patient_id = p.id
        WHERE m.active = 1
      `
      
      const params: string[] = []
      
      if (patientId) {
        query += ' AND m.patient_id = ?'
        params.push(patientId)
      }
      
      query += ' ORDER BY p.name ASC, m.name ASC'
      
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
        patient_name: string | null
      }>
      
      return rows.map(row => ({
        id: row.id,
        patientId: row.patient_id,
        patientName: row.patient_name || undefined,
        name: row.name,
        genericName: row.generic_name || undefined,
        dosage: row.dosage,
        frequency: row.frequency,
        route: row.route || undefined,
        prescribingDoctor: row.prescribing_doctor || undefined,
        pharmacy: row.pharmacy || undefined,
        rxNumber: row.rx_number || undefined,
        sideEffects: row.side_effects || undefined,
        notes: row.notes || undefined,
      }))
    } catch (error) {
      console.error('Error fetching medications for context:', error)
      return []
    }
  }

  /**
   * Get recent journal entries for AI context
   * Returns entries from the past 30 days to provide emotional/mental health insights
   */
  private getRecentJournalEntries(patientId?: string, maxEntries: number = 10): JournalContext[] {
    try {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - this.MAX_RECENT_DAYS)
      const dateThreshold = thirtyDaysAgo.toISOString().split('T')[0]

      let query = `
        SELECT 
          j.id, j.patient_id, j.title, j.content, j.entry_date, j.entry_time,
          j.mood, j.mood_scale, j.sleep_hours, j.emotions, j.journal_type,
          p.name as patient_name
        FROM journal_entries j
        LEFT JOIN patients p ON j.patient_id = p.id
        WHERE j.entry_date >= ?
      `
      
      const params: (string | number)[] = [dateThreshold]
      
      if (patientId) {
        query += ' AND j.patient_id = ?'
        params.push(patientId)
      }
      
      query += ' ORDER BY j.entry_date DESC, j.entry_time DESC LIMIT ?'
      params.push(maxEntries)

      const rows = db.prepare(query).all(...params) as Array<{
        id: string
        patient_id: string
        patient_name: string | null
        title: string | null
        content: string
        entry_date: string
        entry_time: string | null
        mood: string | null
        mood_scale: number | null
        sleep_hours: number | null
        emotions: string | null
        journal_type: string | null
      }>

      return rows.map(row => {
        // Parse emotions if present
        let emotionsArray: string[] | undefined
        if (row.emotions) {
          try {
            emotionsArray = JSON.parse(row.emotions) as string[]
          } catch {
            emotionsArray = undefined
          }
        }

        const wordCount = row.content.trim().split(/\s+/).length

        return {
          id: row.id,
          patientId: row.patient_id,
          patientName: row.patient_name || undefined,
          title: row.title || undefined,
          content: row.content,
          entryDate: row.entry_date,
          entryTime: row.entry_time || undefined,
          mood: row.mood || undefined,
          moodScale: row.mood_scale !== null ? row.mood_scale : undefined,
          sleepHours: row.sleep_hours !== null ? row.sleep_hours : undefined,
          emotions: emotionsArray,
          journalType: row.journal_type || undefined,
          wordCount,
        }
      })
    } catch (error) {
      console.error('Error fetching journal entries for context:', error)
      return []
    }
  }

  /**
   * Get recent therapy records (CBT, ACT, DBT) for AI context and progress analysis
   * Returns records from the past 30 days to provide therapeutic insights
   */
  private getRecentTherapyRecords(patientId?: string, maxRecords: number = 20): TherapyRecordContext[] {
    try {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - this.MAX_RECENT_DAYS)
      const dateThreshold = thirtyDaysAgo.toISOString().split('T')[0]

      let query = `
        SELECT 
          tr.id, tr.patient_id, tr.session_id, tr.therapy_type, tr.record_data,
          tr.created_at,
          p.name as patient_name
        FROM therapy_records tr
        LEFT JOIN patients p ON tr.patient_id = p.id
        WHERE DATE(tr.created_at) >= ?
      `
      
      const params: (string | number)[] = [dateThreshold]
      
      if (patientId) {
        query += ' AND tr.patient_id = ?'
        params.push(patientId)
      }
      
      query += ' ORDER BY tr.created_at DESC LIMIT ?'
      params.push(maxRecords)

      const rows = db.prepare(query).all(...params) as Array<{
        id: string
        patient_id: string
        session_id: string | null
        therapy_type: 'cbt' | 'act' | 'dbt'
        record_data: string
        created_at: string
        patient_name: string | null
      }>

      return rows.map(row => {
        // Parse the JSON record data
        let recordData: Record<string, unknown> = {}
        try {
          recordData = JSON.parse(row.record_data) as Record<string, unknown>
        } catch (error) {
          console.error('Error parsing therapy record data:', error)
        }

        return {
          id: row.id,
          patientId: row.patient_id,
          patientName: row.patient_name || undefined,
          therapyType: row.therapy_type,
          recordData: recordData,
          createdAt: row.created_at,
          sessionId: row.session_id || undefined,
        }
      })
    } catch (error) {
      console.error('Error fetching therapy records for context:', error)
      return []
    }
  }

  /**
   * Get recent CBT thought records for AI context and progress analysis
   * Returns CBT-specific records from the past 30 days
   */
  private getRecentCBTThoughtRecords(patientId?: string, maxRecords: number = 15): CBTThoughtRecordContext[] {
    try {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - this.MAX_RECENT_DAYS)
      const dateThreshold = thirtyDaysAgo.toISOString().split('T')[0]

      let query = `
        SELECT 
          tr.id, tr.patient_id, tr.session_id, tr.record_data,
          tr.created_at,
          p.name as patient_name
        FROM therapy_records tr
        LEFT JOIN patients p ON tr.patient_id = p.id
        WHERE DATE(tr.created_at) >= ?
        AND tr.therapy_type = 'cbt'
      `
      
      const params: (string | number)[] = [dateThreshold]
      
      if (patientId) {
        query += ' AND tr.patient_id = ?'
        params.push(patientId)
      }
      
      query += ' ORDER BY tr.created_at DESC LIMIT ?'
      params.push(maxRecords)

      const rows = db.prepare(query).all(...params) as Array<{
        id: string
        patient_id: string
        session_id: string | null
        record_data: string
        created_at: string
        patient_name: string | null
      }>

      return rows.map(row => {
        // Parse the JSON record data
        let data: Record<string, unknown> = {}
        try {
          data = JSON.parse(row.record_data) as Record<string, unknown>
        } catch (error) {
          console.error('Error parsing CBT record data:', error)
        }

        // Calculate improvement score (emotional intensity reduction)
        const emotionIntensity = typeof data.emotionIntensity === 'number' ? data.emotionIntensity : 0
        const newEmotionIntensity = typeof data.newEmotionIntensity === 'number' ? data.newEmotionIntensity : 0
        const improvementScore = emotionIntensity - newEmotionIntensity

        return {
          id: row.id,
          patientId: row.patient_id,
          patientName: row.patient_name || undefined,
          therapyType: 'cbt' as const,
          recordData: {
            situation: typeof data.situation === 'string' ? data.situation : '',
            automaticThought: typeof data.automaticThought === 'string' ? data.automaticThought : '',
            emotion: typeof data.emotion === 'string' ? data.emotion : '',
            emotionIntensity: emotionIntensity,
            evidenceFor: typeof data.evidenceFor === 'string' ? data.evidenceFor : '',
            evidenceAgainst: typeof data.evidenceAgainst === 'string' ? data.evidenceAgainst : '',
            alternativeThought: typeof data.alternativeThought === 'string' ? data.alternativeThought : '',
            newEmotion: typeof data.newEmotion === 'string' ? data.newEmotion : '',
            newEmotionIntensity: newEmotionIntensity,
          },
          improvementScore: improvementScore,
          createdAt: row.created_at,
          sessionId: row.session_id || undefined,
        }
      })
    } catch (error) {
      console.error('Error fetching CBT thought records for context:', error)
      return []
    }
  }

  /**
   * Get datasets linked to a specific persona with their document chunks
   * Returns all enabled datasets for RAG/knowledge base integration
   */
  private getPersonaDatasets(personaId: string): DatasetContext[] {
    try {
      // Query persona_datasets to find enabled datasets for this persona
      const query = `
        SELECT 
          pd.dataset_id,
          pd.enabled,
          pd.access_level,
          pd.weight,
          d.name,
          d.description,
          d.file_type,
          d.file_size
        FROM persona_datasets pd
        JOIN datasets d ON pd.dataset_id = d.id
        WHERE pd.persona_id = ? AND pd.enabled = 1
        ORDER BY pd.weight DESC, d.name ASC
      `
      
      const datasets = db.prepare(query).all(personaId) as Array<{
        dataset_id: string
        enabled: number
        access_level: 'read' | 'summary' | 'reference_only'
        weight: number
        name: string
        description: string | null
        file_type: string
        file_size: number
      }>

      if (datasets.length === 0) {
        return []
      }

      // For each dataset, fetch its document chunks
      return datasets.map(dataset => {
        const chunkQuery = `
          SELECT 
            id,
            chunk_index,
            content,
            section_title,
            page_number,
            token_count
          FROM document_chunks
          WHERE dataset_id = ?
          ORDER BY chunk_index ASC
        `
        
        const chunks = db.prepare(chunkQuery).all(dataset.dataset_id) as Array<{
          id: string
          chunk_index: number
          content: string
          section_title: string | null
          page_number: number | null
          token_count: number | null
        }>

        console.log(`[LunaContext] Dataset "${dataset.name}": fetched ${chunks.length} chunks`)
        chunks.forEach(chunk => {
          console.log(`  - Chunk ${chunk.chunk_index}: ${chunk.content.length} chars`)
        })

        return {
          id: dataset.dataset_id,
          name: dataset.name,
          description: dataset.description || undefined,
          chunkCount: chunks.length,
          accessLevel: dataset.access_level,
          enabled: Boolean(dataset.enabled),
          chunks: chunks.map(chunk => ({
            id: chunk.id,
            content: chunk.content,
            chunkIndex: chunk.chunk_index,
            sectionTitle: chunk.section_title || undefined,
            pageNumber: chunk.page_number || undefined,
            tokenCount: chunk.token_count || undefined,
          })),
        }
      })
    } catch (error) {
      console.error('Error fetching persona datasets for context:', error)
      return []
    }
  }
  private generateContextSummary(context: LunaContext): string {
  // Use context directly, destructuring removed
    let summary = "## Mental Health Practice Context Summary\n\n";
    // Patients summary
    if (context.patients.length > 0) {
      summary += `### Patients (${context.patients.length})\n`;
      context.patients.forEach((patient: PatientContext) => {
        summary += `- **${patient.name}**`;
        if (patient.age) summary += `, age ${patient.age}`;
        if (patient.gender) summary += `, ${patient.gender}`;
        if (patient.phone) summary += `\n  Phone: ${patient.phone}`;
        if (patient.city || patient.state) {
          const location = [patient.city, patient.state].filter(Boolean).join(', ');
          summary += `\n  Location: ${location}`;
        }
        if (patient.occupation) {
          summary += `\n  Occupation: ${patient.occupation}`;
          if (patient.occupation_description) summary += `\n  Details: ${patient.occupation_description}`;
        }
        if (patient.languages) summary += `\n  Languages: ${patient.languages}`;
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

    // Recent journal entries - provides emotional context and mental health insights
    if (context.journalEntries.length > 0) {
      summary += `### Recent Journal Entries (Last 30 Days: ${context.journalEntries.length} entries)\n\n`;
      
      // Group journal entries by patient
      const journalByPatient = new Map<string, JournalContext[]>();
      context.journalEntries.forEach((entry: JournalContext) => {
        const patientName = entry.patientName || 'Unknown Patient';
        if (!journalByPatient.has(patientName)) {
          journalByPatient.set(patientName, []);
        }
        journalByPatient.get(patientName)!.push(entry);
      });
      
      // Display journal entries grouped by patient
      journalByPatient.forEach((entries, patientName) => {
        summary += `**${patientName} (${entries.length} recent entr${entries.length !== 1 ? 'ies' : 'y'})**\n`;
        entries.forEach((entry: JournalContext) => {
          summary += `- ${entry.entryDate}`;
          if (entry.entryTime) summary += ` ${entry.entryTime}`;
          if (entry.title) summary += `: "${entry.title}"`;
          summary += `\n`;
          
          // Show mood/emotions if present
          if (entry.mood || (entry.emotions && entry.emotions.length > 0)) {
            summary += `  Emotional state: `;
            if (entry.mood) summary += entry.mood;
            if (entry.emotions && entry.emotions.length > 0) {
              summary += ` (also feeling: ${entry.emotions.join(', ')})`;
            }
            summary += '\n';
          }
          
          // Show content preview (first 150 characters)
          const contentPreview = entry.content.length > 150 
            ? entry.content.substring(0, 150) + '...' 
            : entry.content;
          summary += `  Content: ${contentPreview}\n`;
          summary += `  (${entry.wordCount} words)\n`;
        });
        summary += '\n';
      });
    } else {
      summary += `### Recent Journal Entries\n`;
      summary += `**NO RECENT JOURNAL ENTRIES**\n`;
      summary += `- No journal entries found in the last 30 days\n\n`;
    }

    // All Therapy Records (CBT, ACT, DBT) - Comprehensive therapeutic work overview
    if (context.therapyRecords.length > 0) {
      summary += `### All Therapy Records (Last 30 Days: ${context.therapyRecords.length} total)\n\n`;
      
      // Group by therapy type
      const cbtRecords = context.therapyRecords.filter(r => r.therapyType === 'cbt');
      const actRecords = context.therapyRecords.filter(r => r.therapyType === 'act');
      const dbtRecords = context.therapyRecords.filter(r => r.therapyType === 'dbt');
      
      summary += `**THERAPY TYPE BREAKDOWN**\n`;
      summary += `- CBT (Cognitive Behavioral Therapy): ${cbtRecords.length} records\n`;
      summary += `- ACT (Acceptance & Commitment Therapy): ${actRecords.length} records\n`;
      summary += `- DBT (Dialectical Behavior Therapy): ${dbtRecords.length} records\n`;
      summary += `\n`;
      
      // Show recent therapy work from all types
      const recentRecords = context.therapyRecords.slice(0, 10);
      summary += `**RECENT THERAPEUTIC WORK (Latest 10)**\n`;
      recentRecords.forEach((record: TherapyRecordContext) => {
        summary += `- ${record.createdAt.split('T')[0]} - ${record.therapyType.toUpperCase()}`;
        if (record.sessionId) summary += ` (Session: ${record.sessionId})`;
        summary += `\n`;
        
        // Show type-specific preview based on therapy type
        if (record.therapyType === 'cbt' && record.recordData.situation) {
          summary += `  Situation: ${record.recordData.situation}\n`;
        } else if (record.therapyType === 'act') {
          summary += `  ACT exercise completed\n`;
        } else if (record.therapyType === 'dbt') {
          summary += `  DBT skill practice completed\n`;
        }
        summary += `\n`;
      });
    } else {
      summary += `### Therapy Records\n`;
      summary += `**NO RECENT THERAPY RECORDS**\n`;
      summary += `- No therapy exercises (CBT/ACT/DBT) found in the last 30 days\n`;
      summary += `- Consider encouraging the use of therapy tools for emotional regulation\n\n`;
    }

    // Knowledge Base / RAG Datasets
    if (context.datasets.length > 0) {
      summary += `### Knowledge Base Documents (${context.datasets.length})\n`;
      summary += `**AVAILABLE REFERENCE MATERIALS**\n\n`;
      
      let totalChunkContent = 0;
      
      context.datasets.forEach((dataset: DatasetContext) => {
        summary += `#### 📚 ${dataset.name}\n`;
        if (dataset.description) {
          summary += `${dataset.description}\n`;
        }
        summary += `- Access Level: ${dataset.accessLevel}\n`;
        summary += `- Content: ${dataset.chunkCount} section${dataset.chunkCount !== 1 ? 's' : ''}\n\n`;
        
        // Include all chunks for this dataset
        if (dataset.chunks.length > 0) {
          dataset.chunks.forEach((chunk: DatasetChunk) => {
            summary += `**Section ${chunk.chunkIndex + 1}**`;
            if (chunk.sectionTitle) {
              summary += `: ${chunk.sectionTitle}`;
            }
            if (chunk.pageNumber) {
              summary += ` (Page ${chunk.pageNumber})`;
            }
            summary += `\n`;
            summary += `${chunk.content}\n\n`;
            totalChunkContent += chunk.content.length;
          });
        }
      });
      
      console.log(`[LunaContext] Knowledge Base summary: ${totalChunkContent} chars of chunk content added`);
    }

    return summary;
  }

  /**
   * Get comprehensive mental health context for AI integration
   * 
   * @param patientId - Optional: focus on specific patient
   * @param personaId - Optional: fetch datasets linked to specific persona
   * @returns Complete mental health context for AI
   */
  public getLunaContext(patientId?: string, personaId?: string): LunaContext {
    const patients = this.getPatients()
    const medications = this.getMedications(patientId)
    const journalEntries = this.getRecentJournalEntries(patientId)
    const therapyRecords = this.getRecentTherapyRecords(patientId)
    const cbtThoughtRecords = this.getRecentCBTThoughtRecords(patientId)
    const datasets = personaId ? this.getPersonaDatasets(personaId) : []

    const context: LunaContext = {
      patients,
      medications,
      journalEntries,
      therapyRecords,
      cbtThoughtRecords,
      datasets,
      summary: '',
    }

    context.summary = this.generateContextSummary(context)

    return context
  }

  /**
   * Find patient by name (case-insensitive)
   * Used for natural language queries like patient name references
   */
  public findPatientByReference(reference: string): PatientContext | null {
    try {
      const query = `
        SELECT id, name, date_of_birth, gender
        FROM patients 
        WHERE active = 1 
        AND LOWER(name) LIKE LOWER(?)
        ORDER BY 
          CASE 
            WHEN LOWER(name) = LOWER(?) THEN 1
            WHEN LOWER(name) LIKE LOWER(?) THEN 2
            ELSE 3
          END
        LIMIT 1
      `
      
      const searchTerm = `%${reference.trim()}%`
      const exactTerm = reference.trim()
      
      const row = db.prepare(query).get(
        searchTerm, exactTerm, searchTerm
      ) as {
        id: string
        name: string
        date_of_birth: string | null
        gender: string | null
      } | undefined

      if (!row) return null

      return {
        id: row.id,
        name: row.name,
        age: row.date_of_birth ? this.calculateAge(row.date_of_birth) : undefined,
        gender: row.gender || undefined,
      }
    } catch (error) {
      console.error('Error finding patient by reference:', error)
      return null
    }
  }

  /**
   * Generate contextual prompt addition for AI based on user query and session
   * This provides relevant mental health context with session-based patient focus
   */
  public generateContextualPrompt(userQuery: string, sessionId?: string): string {
    let foundPatient: PatientContext | null = null
    let personaId: string | undefined
    
    // Priority 1: Check if session has a tracked patient and persona (maintains conversation focus)
    if (sessionId) {
      try {
        const session = db.prepare('SELECT patient_id, persona_id FROM sessions WHERE id = ?').get(sessionId) as { 
          patient_id: string | null
          persona_id: string | null 
        } | undefined
        
        if (session?.patient_id) {
          const patient = db.prepare('SELECT id, name, date_of_birth, gender FROM patients WHERE id = ? AND active = 1').get(session.patient_id) as {
            id: string
            name: string
            date_of_birth: string | null
            gender: string | null
          } | undefined
          
          if (patient) {
            foundPatient = {
              id: patient.id,
              name: patient.name,
              age: patient.date_of_birth ? this.calculateAge(patient.date_of_birth) : undefined,
              gender: patient.gender || undefined,
            }
            console.log(`[LunaContext] Using session patient focus: ${patient.name}`)
          }
        }
        
        // Capture persona_id for dataset retrieval
        if (session?.persona_id) {
          personaId = session.persona_id
          console.log(`[LunaContext] Using session persona: ${personaId}`)
        }
      } catch (error) {
        console.error('Error reading session data:', error)
      }
    }
    
    // Priority 2: If no session patient, try to extract patient names from query
    if (!foundPatient) {
      const queryLower = userQuery.toLowerCase()
      
      // Try to find patient names in the query
      if (!foundPatient) {
        const allPatients = this.getPatients()
        
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
    }

    // Get context (focused on found patient if any, with persona datasets)
    console.log(`[LunaContext] Fetching context - PersonaId: ${personaId}, PatientId: ${foundPatient?.id}`)
    const context = this.getLunaContext(foundPatient?.id, personaId)
    
    console.log(`[LunaContext] Context retrieved - Patients: ${context.patients.length}, Datasets: ${context.datasets.length}`)
    if (context.datasets.length > 0) {
      context.datasets.forEach(ds => {
        console.log(`  - Dataset: "${ds.name}" (${ds.chunkCount} chunks, access: ${ds.accessLevel})`)
      })
    }
    
    if (context.patients.length === 0 && context.datasets.length === 0) {
      console.log('[LunaContext] No context available - returning empty')
      return "" // No patient data or datasets available
    }

    let contextPrompt = "\n\n## Available Patient Information\n\n"
    contextPrompt += context.summary
    
    // Add specific instructions for AI behavior
    contextPrompt += "\n## CRITICAL Instructions for AI Assistant\n"
    contextPrompt += "- **USE ONLY CURRENT DATA**: The information above is the AUTHORITATIVE source - ignore any data from previous messages\n"
    contextPrompt += "- **PATIENT CONFIDENTIALITY**: Treat all patient information as strictly confidential\n"
    contextPrompt += "- **ACCURATE REPORTING**: When discussing patient information, use only the data shown above\n"
    contextPrompt += "- **NO HALLUCINATION**: Do not invent or assume patient details not explicitly provided\n"
    contextPrompt += "- **JOURNAL INSIGHTS**: Use journal entries to understand emotional state, concerns, and therapy progress\n"
    contextPrompt += "- **THERAPEUTIC SUPPORT**: Help identify patterns in mood, emotions, and themes from journal entries\n"
    
    // Add RAG-specific instructions if datasets are available
    if (context.datasets.length > 0) {
      contextPrompt += "- **KNOWLEDGE BASE ACCESS**: You have access to reference documents shown in the Knowledge Base section above\n"
      contextPrompt += "- **CITE SOURCES**: When using information from knowledge base documents, reference the document name\n"
      contextPrompt += "- **APPLY EXPERTISE**: Use the knowledge base to provide evidence-based therapeutic guidance\n"
      contextPrompt += "- **DATASET PRIORITY**: Information from knowledge base documents should supplement, not replace, patient-specific data\n"
    }
    
    contextPrompt += "- **PROFESSIONAL CONTEXT**: This is for Caleb's mental health practice management\n"
    contextPrompt += "- Focus on supporting therapeutic goals and treatment planning\n"

    return contextPrompt
  }
}