// backend/logic/documentProcessor.ts
// Service for processing uploaded documents (PDF, DOCX, TXT)

import * as fs from 'fs'
import * as path from 'path'
import { v4 as uuidv4 } from 'uuid'
import * as mammoth from 'mammoth'
import { db } from '../db/db'
import { chunkingService, ChunkingOptions } from './chunkingService'
// import { embeddingService, EmbeddingOptions } from './embeddingService' // TEMPORARILY DISABLED

// Import pdf-parse v2 - PDFParse is a class constructor
import { PDFParse } from 'pdf-parse'

// Types for document processing
export interface UploadedFile {
  originalname: string
  mimetype: string
  buffer: Buffer
  size: number
}

export interface ProcessingOptions {
  therapeutic_category?: string
  processing_mode: 'local' | 'cloud'
  persona_id?: string // Optional: link to specific persona
  description?: string
  chunking?: Partial<ChunkingOptions>
  // embeddings?: Partial<EmbeddingOptions> // TEMPORARILY DISABLED
}

export interface ProcessedDocument {
  id: string
  name: string
  file_type: string
  file_size: number
  file_path: string
  content: string
  metadata: DocumentMetadata
}

export interface DocumentMetadata {
  page_count?: number
  word_count: number
  character_count: number
  author?: string
  title?: string
  creation_date?: string
  extracted_at: string
  processing_mode: string
}

export interface DatasetRecord {
  id: string
  name: string
  description?: string
  file_name: string
  file_type: string
  file_size: number
  file_path: string
  therapeutic_category?: string
  processing_mode: string
  processing_status: string
  chunk_count: number
  embedding_model?: string
  created_by_user: boolean
  created_at: string
  processed_at?: string
  error_message?: string
  metadata: string
}

export interface DatasetWithLink extends DatasetRecord {
  enabled: boolean
  weight: number
  access_level: string
  last_used_at?: string
  usage_count: number
}

export interface PersonaDatasetLink {
  id: string
  persona_id: string
  dataset_id: string
  enabled: boolean
  weight: number
  access_level: string
  last_used_at?: string
  usage_count: number
  created_at: string
}

export class DocumentProcessor {
  private readonly uploadsDir: string

  constructor() {
    // Create uploads directory if it doesn't exist
    this.uploadsDir = path.resolve(process.cwd(), 'uploads')
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true })
    }
  }

  /**
   * Process uploaded file and store in database
   */
  async processDocument(
    file: UploadedFile,
    options: ProcessingOptions
  ): Promise<{ dataset_id: string; processing_status: string }> {
    const dataset_id = uuidv4()
    
    try {
      // 1. Save file to filesystem
      const { file_path, file_type } = await this.saveFile(file, dataset_id)
      
      // 2. Extract text content
      const { content, metadata } = await this.extractText(file, file_type)
      
      // 3. Store dataset record
      await this.storeDataset(dataset_id, {
        name: options.description || this.generateName(file.originalname),
        description: options.description,
        file_name: file.originalname,
        file_type,
        file_size: file.size,
        file_path,
        therapeutic_category: options.therapeutic_category,
        processing_mode: options.processing_mode,
        metadata: JSON.stringify(metadata)
      })

      // 4. Chunk the content
      console.log(`📄 Chunking content: ${metadata.word_count} words from ${file.originalname}`)
      const chunkedDoc = await chunkingService.chunkDocument(dataset_id, content, options.chunking)
      
      // 5. Store chunks in database
      await this.storeChunks(chunkedDoc.chunks)
      
      // 6. Generate embeddings for chunks (TEMPORARILY DISABLED)
      console.log(`🔄 Skipping embedding generation (temporarily disabled)`)
      
      // 7. Store embeddings in database (TEMPORARILY DISABLED)
      console.log(`🔄 Skipping embedding storage (temporarily disabled)`)
      
      // 8. Update dataset with chunk count (no embedding model for now)
      await this.updateDatasetProcessing(dataset_id, {
        chunk_count: chunkedDoc.total_chunks
      })
      
      console.log(`✅ Document processed successfully: ${chunkedDoc.total_chunks} chunks created using ${chunkedDoc.strategy_used} strategy`)

      // 9. If persona_id provided, link the dataset
      if (options.persona_id) {
        await this.linkToPersona(dataset_id, options.persona_id)
      }

      console.log(`✅ Document processed: ${file.originalname} -> ${dataset_id}`)
      
      return {
        dataset_id,
        processing_status: 'completed'
      }
    } catch (error) {
      console.error('❌ Document processing failed:', error)
      
      // Update status to error
      await this.updateProcessingStatus(dataset_id, 'error', (error as Error).message)
      
      throw error
    }
  }

  /**
   * Extract text content from different file types
   */
  private async extractText(
    file: UploadedFile, 
    fileType: string
  ): Promise<{ content: string; metadata: DocumentMetadata }> {
    const extractedAt = new Date().toISOString()
    
    switch (fileType) {
      case 'pdf':
        return this.extractPDF(file.buffer, extractedAt)
      case 'docx':
        return this.extractDOCX(file.buffer, extractedAt)
      case 'txt':
      case 'md':
        return this.extractPlainText(file.buffer, extractedAt)
      default:
        throw new Error(`Unsupported file type: ${fileType}`)
    }
  }

  /**
   * Extract text from PDF files
   */
  private async extractPDF(buffer: Buffer, extractedAt: string): Promise<{ content: string; metadata: DocumentMetadata }> {
    try {
      // Create PDFParse instance with buffer
      const parser = new PDFParse({ data: buffer })
      
      // Extract text using getText method
      const result = await parser.getText()
      
      const metadata: DocumentMetadata = {
        page_count: result.total,
        word_count: this.countWords(result.text),
        character_count: result.text.length,
        extracted_at: extractedAt,
        processing_mode: 'local'
      }

      return {
        content: result.text,
        metadata
      }
    } catch (error) {
      throw new Error(`PDF extraction failed: ${(error as Error).message}`)
    }
  }

  /**
   * Extract text from DOCX files
   */
  private async extractDOCX(buffer: Buffer, extractedAt: string): Promise<{ content: string; metadata: DocumentMetadata }> {
    try {
      const result = await mammoth.extractRawText({ buffer })
      
      const metadata: DocumentMetadata = {
        word_count: this.countWords(result.value),
        character_count: result.value.length,
        extracted_at: extractedAt,
        processing_mode: 'local'
      }

      if (result.messages.length > 0) {
        console.warn('DOCX extraction warnings:', result.messages)
      }

      return {
        content: result.value,
        metadata
      }
    } catch (error) {
      throw new Error(`DOCX extraction failed: ${(error as Error).message}`)
    }
  }

  /**
   * Extract text from plain text files
   */
  private async extractPlainText(buffer: Buffer, extractedAt: string): Promise<{ content: string; metadata: DocumentMetadata }> {
    try {
      const content = buffer.toString('utf-8')
      
      const metadata: DocumentMetadata = {
        word_count: this.countWords(content),
        character_count: content.length,
        extracted_at: extractedAt,
        processing_mode: 'local'
      }

      return {
        content,
        metadata
      }
    } catch (error) {
      throw new Error(`Text extraction failed: ${(error as Error).message}`)
    }
  }

  /**
   * Save file to filesystem
   */
  private async saveFile(file: UploadedFile, dataset_id: string): Promise<{ file_path: string; file_type: string }> {
    // Determine file type from mimetype or extension
    const file_type = this.determineFileType(file.mimetype, file.originalname)
    
    // Generate safe filename
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filename = `${dataset_id}_${sanitizedName}`
    const file_path = path.join(this.uploadsDir, filename)
    
    // Write file to disk
    await fs.promises.writeFile(file_path, file.buffer)
    
    return { file_path, file_type }
  }

  /**
   * Store dataset record in database
   */
  private async storeDataset(dataset_id: string, data: Partial<DatasetRecord>): Promise<void> {
    const stmt = db.prepare(`
      INSERT INTO datasets (
        id, name, description, file_name, file_type, file_size, file_path,
        therapeutic_category, processing_mode, processing_status, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const params = [
      dataset_id,
      data.name,
      data.description,
      data.file_name,
      data.file_type,
      data.file_size,
      data.file_path,
      data.therapeutic_category,
      data.processing_mode,
      'completed',
      data.metadata
    ]

    console.log('📊 Dataset parameters:', params.map((p, i) => `${i}: ${typeof p} = ${p}`))

    try {
      stmt.run(...params)
    } catch (error) {
      console.error('❌ Failed to store dataset:', error)
      console.error('Parameters:', params)
      throw error
    }
  }

  /**
   * Link dataset to persona
   */
  private async linkToPersona(dataset_id: string, persona_id: string): Promise<void> {
    const stmt = db.prepare(`
      INSERT INTO persona_datasets (id, persona_id, dataset_id, enabled, weight, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `)

    stmt.run(
      uuidv4(),
      persona_id,
      dataset_id,
      1, // enabled by default
      1.0, // default weight
      new Date().toISOString()
    )
  }

  /**
   * Store chunks in database with minimal required fields
   */
  private async storeChunks(chunks: import('./chunkingService').DocumentChunk[]): Promise<void> {
    // Only insert required NOT NULL fields, let SQLite handle defaults
    const stmt = db.prepare(`
      INSERT INTO document_chunks (
        id, 
        dataset_id, 
        chunk_index, 
        content
      ) VALUES (?, ?, ?, ?)
    `)

    for (const chunk of chunks) {
      // Only provide the required NOT NULL parameters
      const params = [
        String(chunk.id),                    // TEXT PRIMARY KEY
        String(chunk.dataset_id),           // TEXT NOT NULL  
        Number(chunk.chunk_index),          // INTEGER NOT NULL
        String(chunk.content)               // TEXT NOT NULL
      ]

      try {
        stmt.run(...params)
        console.log(`✅ Stored chunk ${chunk.chunk_index} for dataset ${chunk.dataset_id}`)
      } catch (error) {
        console.error(`❌ Failed to store chunk ${chunk.chunk_index}:`, error)
        console.error('Parameters:', params)
        console.error('Chunk data:', chunk)
        throw error
      }
    }
  }

  /**
   * Update dataset processing information (simplified without embeddings)
   */
  private async updateDatasetProcessing(
    dataset_id: string, 
    updates: { chunk_count?: number }
  ): Promise<void> {
    const stmt = db.prepare(`
      UPDATE datasets 
      SET chunk_count = ?, processed_at = ?
      WHERE id = ?
    `)

    stmt.run(
      updates.chunk_count || 0,
      new Date().toISOString(),
      dataset_id
    )
  }
  private async updateProcessingStatus(
    dataset_id: string, 
    status: string, 
    error_message?: string
  ): Promise<void> {
    const stmt = db.prepare(`
      UPDATE datasets 
      SET processing_status = ?, processed_at = ?, error_message = ?
      WHERE id = ?
    `)

    stmt.run(
      status,
      new Date().toISOString(),
      error_message || null,
      dataset_id
    )
  }

  /**
   * Get dataset by ID
   */
  async getDataset(dataset_id: string): Promise<DatasetRecord | undefined> {
    const stmt = db.prepare(`
      SELECT * FROM datasets WHERE id = ?
    `)
    
    return stmt.get(dataset_id) as DatasetRecord | undefined
  }

  /**
   * Get datasets for persona
   */
  async getPersonaDatasets(persona_id: string): Promise<DatasetWithLink[]> {
    const stmt = db.prepare(`
      SELECT 
        d.*,
        pd.enabled,
        pd.weight,
        pd.access_level,
        pd.last_used_at,
        pd.usage_count
      FROM datasets d
      JOIN persona_datasets pd ON d.id = pd.dataset_id
      WHERE pd.persona_id = ?
      ORDER BY pd.created_at DESC
    `)
    
    return stmt.all(persona_id) as DatasetWithLink[]
  }

  /**
   * Get chunks from a dataset
   */
  async getDatasetChunks(dataset_id: string, limit: number = 50): Promise<any[]> {
    const stmt = db.prepare(`
      SELECT id, chunk_index, content, chunk_type, section_title,
             page_number, char_start, char_end, token_count,
             therapeutic_tags, created_at
      FROM document_chunks
      WHERE dataset_id = ?
      ORDER BY chunk_index ASC
      LIMIT ?
    `)
    
    return stmt.all(dataset_id, limit)
  }

  /**
   * Delete dataset and all associated data
   */
  async deleteDataset(dataset_id: string): Promise<{ success: boolean; chunks_deleted: number }> {
    const dataset = await this.getDataset(dataset_id)
    
    if (!dataset) {
      throw new Error(`Dataset ${dataset_id} not found`)
    }

    // Delete file from filesystem
    if (dataset.file_path && fs.existsSync(dataset.file_path)) {
      try {
        fs.unlinkSync(dataset.file_path)
      } catch (err) {
        console.error(`Failed to delete file ${dataset.file_path}:`, err)
      }
    }

    // Count chunks before deletion
    const chunkCount = db.prepare(`SELECT COUNT(*) as count FROM document_chunks WHERE dataset_id = ?`).get(dataset_id) as { count: number }

    // Delete chunks (foreign key will cascade persona_datasets)
    const deleteChunks = db.prepare(`DELETE FROM document_chunks WHERE dataset_id = ?`)
    deleteChunks.run(dataset_id)

    // Delete dataset
    const deleteDataset = db.prepare(`DELETE FROM datasets WHERE id = ?`)
    deleteDataset.run(dataset_id)

    return {
      success: true,
      chunks_deleted: chunkCount.count
    }
  }

  /**
   * Link dataset to persona
   */
  async linkDatasetToPersona(dataset_id: string, persona_id: string, options?: {
    enabled?: boolean
    weight?: number
    access_level?: string
  }): Promise<void> {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO persona_datasets 
        (id, persona_id, dataset_id, enabled, weight, access_level, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)

    const id = `${persona_id}-${dataset_id}`
    stmt.run(
      id,
      persona_id,
      dataset_id,
      options?.enabled !== undefined ? (options.enabled ? 1 : 0) : 1,
      options?.weight || 1.0,
      options?.access_level || 'read',
      new Date().toISOString()
    )
  }

  /**
   * Unlink dataset from persona
   */
  async unlinkDatasetFromPersona(dataset_id: string, persona_id: string): Promise<void> {
    const stmt = db.prepare(`
      DELETE FROM persona_datasets 
      WHERE persona_id = ? AND dataset_id = ?
    `)
    
    stmt.run(persona_id, dataset_id)
  }

  /**
   * Update persona-dataset link settings
   */
  async updatePersonaDatasetLink(dataset_id: string, persona_id: string, updates: {
    enabled?: boolean
    weight?: number
    access_level?: string
  }): Promise<void> {
    const sets: string[] = []
    const params: any[] = []

    if (updates.enabled !== undefined) {
      sets.push('enabled = ?')
      params.push(updates.enabled ? 1 : 0)
    }
    if (updates.weight !== undefined) {
      sets.push('weight = ?')
      params.push(updates.weight)
    }
    if (updates.access_level !== undefined) {
      sets.push('access_level = ?')
      params.push(updates.access_level)
    }

    if (sets.length === 0) return

    params.push(persona_id, dataset_id)

    const stmt = db.prepare(`
      UPDATE persona_datasets 
      SET ${sets.join(', ')}
      WHERE persona_id = ? AND dataset_id = ?
    `)

    stmt.run(...params)
  }

  /**
   * Utility methods
   */
  private determineFileType(mimetype: string, filename: string): string {
    if (mimetype === 'application/pdf') return 'pdf'
    if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'docx'
    if (mimetype === 'text/plain') return 'txt'
    if (mimetype === 'text/markdown') return 'md'
    
    // Fall back to extension
    const ext = path.extname(filename).toLowerCase()
    if (ext === '.pdf') return 'pdf'
    if (ext === '.docx') return 'docx'
    if (ext === '.txt') return 'txt'
    if (ext === '.md') return 'md'
    
    throw new Error(`Unsupported file type: ${mimetype} (${filename})`)
  }

  private generateName(filename: string): string {
    const name = path.basename(filename, path.extname(filename))
    return name.replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  private countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length
  }
}

// Export singleton instance
export const documentProcessor = new DocumentProcessor()