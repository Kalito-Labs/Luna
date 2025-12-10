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
import type { LLMAdapter } from './modelRegistry'
import { StructuredMedicationService } from './structuredMedicationService'

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
  primary_doctor_id?: string
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
  private structuredMedicationService: StructuredMedicationService
  
  constructor() {
    this.structuredMedicationService = new StructuredMedicationService()
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
               languages, primary_doctor_id, notes
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
        primary_doctor_id: string | null
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
          primary_doctor_id: row.primary_doctor_id || undefined,
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
   * Uses StructuredMedicationService for validated data with complete information
   */
  private getMedications(patientId?: string): MedicationContext[] {
    try {
      // If no specific patient, get all patients and fetch their medications
      if (!patientId) {
        const patients = this.getPatients()
        const allMedications: MedicationContext[] = []
        
        for (const patient of patients) {
          const patientMeds = this.getMedications(patient.id)
          allMedications.push(...patientMeds)
        }
        
        return allMedications
      }
      
      // Use structured validation service for specific patient
      const structuredData = this.structuredMedicationService.getMedicationsStructured(patientId)
      
      if (!structuredData) {
        return []
      }
      
      // Convert structured format to MedicationContext format
      return structuredData.medications.map((med, index) => {
        const context: MedicationContext = {
          id: `${patientId}-med-${index}`, // Generate ID from index
          patientId: patientId,
          patientName: structuredData.patient_name,
          name: med.name,
          genericName: med.generic_name || undefined,
          dosage: med.dosage,
          frequency: med.frequency,
          route: undefined, // Not in structured format
          prescribingDoctor: med.prescribing_doctor,
          pharmacy: med.pharmacy,
          rxNumber: med.rx_number,
          sideEffects: undefined, // Not in structured format
          notes: med.notes || undefined,
        }
        
        return context
      })
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
          j.mood, j.emotions, j.journal_type,
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
        if (patient.primary_doctor_id) summary += `\n  Primary Doctor ID: ${patient.primary_doctor_id}`;
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

    // CBT Thought Records - provides therapeutic progress and cognitive pattern insights
    if (context.cbtThoughtRecords.length > 0) {
      summary += `### CBT Thought Records (Last 30 Days: ${context.cbtThoughtRecords.length} records)\n\n`;
      
      // Calculate overall progress metrics
      const recordsWithImprovement = context.cbtThoughtRecords.filter(record => 
        record.improvementScore !== undefined && record.improvementScore > 0
      );
      const averageImprovement = recordsWithImprovement.length > 0 
        ? recordsWithImprovement.reduce((sum, record) => sum + (record.improvementScore || 0), 0) / recordsWithImprovement.length
        : 0;
      
      summary += `**THERAPEUTIC PROGRESS OVERVIEW**\n`;
      summary += `- ${recordsWithImprovement.length}/${context.cbtThoughtRecords.length} records show emotional improvement\n`;
      if (averageImprovement > 0) {
        summary += `- Average emotional intensity reduction: ${averageImprovement.toFixed(1)} points\n`;
      }
      summary += `\n`;
      
      // Group CBT records by patient
      const cbtByPatient = new Map<string, CBTThoughtRecordContext[]>();
      context.cbtThoughtRecords.forEach((record: CBTThoughtRecordContext) => {
        const patientName = record.patientName || 'Unknown Patient';
        if (!cbtByPatient.has(patientName)) {
          cbtByPatient.set(patientName, []);
        }
        cbtByPatient.get(patientName)!.push(record);
      });
      
      // Display CBT records grouped by patient
      cbtByPatient.forEach((records, patientName) => {
        summary += `**${patientName} (${records.length} thought record${records.length !== 1 ? 's' : ''})**\n`;
        
        records.slice(0, 5).forEach((record: CBTThoughtRecordContext) => {
          summary += `- ${record.createdAt.split('T')[0]}`;
          if (record.sessionId) summary += ` (Session: ${record.sessionId})`;
          summary += `\n`;
          
          // Show the cognitive pattern and emotional journey
          summary += `  Situation: ${record.recordData.situation}\n`;
          summary += `  Initial thought: "${record.recordData.automaticThought}"\n`;
          summary += `  Emotion: ${record.recordData.emotion} (intensity: ${record.recordData.emotionIntensity}/100)\n`;
          
          // Show therapeutic work done
          if (record.recordData.evidenceFor && record.recordData.evidenceAgainst) {
            summary += `  Evidence work: Examined thoughts objectively\n`;
          }
          
          // Show progress/outcome
          if (record.recordData.alternativeThought) {
            summary += `  Alternative thought: "${record.recordData.alternativeThought}"\n`;
          }
          if (record.recordData.newEmotion && record.recordData.newEmotionIntensity !== undefined) {
            summary += `  Result: ${record.recordData.newEmotion} (intensity: ${record.recordData.newEmotionIntensity}/100)`;
            if (record.improvementScore !== undefined) {
              const change = record.improvementScore > 0 ? 'improved' : 
                           record.improvementScore < 0 ? 'increased' : 'unchanged';
              summary += ` - ${change} by ${Math.abs(record.improvementScore)} points`;
            }
            summary += `\n`;
          }
          summary += `\n`;
        });
        
        // Show summary if more than 5 records
        if (records.length > 5) {
          summary += `  ... and ${records.length - 5} more records\n\n`;
        } else {
          summary += `\n`;
        }
      });
    } else {
      summary += `### CBT Thought Records\n`;
      summary += `**NO RECENT CBT THOUGHT RECORDS**\n`;
      summary += `- No thought records found in the last 30 days\n`;
      summary += `- Consider encouraging the use of CBT tools for emotional regulation\n\n`;
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
   * @param adapter - The AI model adapter (used to determine privacy level)
   * @param patientId - Optional: focus on specific patient
   * @param personaId - Optional: fetch datasets linked to specific persona
   * @returns Complete mental health context for AI
   */
  public getLunaContext(adapter: LLMAdapter, patientId?: string, personaId?: string): LunaContext {
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
  public generateContextualPrompt(adapter: LLMAdapter, userQuery: string, sessionId?: string): string {
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
    const context = this.getLunaContext(adapter, foundPatient?.id, personaId)
    
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