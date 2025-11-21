// backend/routes/datasetsRouter.ts
// API routes for document upload and dataset management

import express, { Request, Response } from 'express'
import multer from 'multer'
import { documentProcessor, UploadedFile, ProcessingOptions } from '../logic/documentProcessor'
import { okItem, err } from '../utils/apiContract'
import { handleRouterError } from '../utils/routerHelpers'

const router = express.Router()

/**
 * GET /api/datasets
 * List all datasets
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { db } = await import('../db/db')
    const stmt = db.prepare(`
      SELECT id, name, description, file_name, file_type, file_size,
             therapeutic_category, processing_mode, processing_status,
             chunk_count, embedding_model, created_at, processed_at
      FROM datasets 
      ORDER BY created_at DESC
    `)
    
    const datasets = stmt.all()
    return okItem(res, datasets)
    
  } catch (error) {
    return handleRouterError(res, error, 'list_datasets')
  }
})

// Configure multer for file uploads (memory storage for processing)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
    files: 1 // Single file upload
  },
  fileFilter: (req, file, cb) => {
    // Accept PDF, DOCX, TXT, and MD files
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/markdown'
    ]
    
    const allowedExtensions = ['.pdf', '.docx', '.txt', '.md']
    const fileExtension = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf('.'))
    
    if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
      cb(null, true)
    } else {
      cb(new Error(`Unsupported file type. Allowed: PDF, DOCX, TXT, MD. Received: ${file.mimetype}`))
    }
  }
})

/**
 * POST /api/datasets/upload
 * Upload and process a document
 */
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return err(res, 400, 'VALIDATION_ERROR', 'No file provided in upload')
    }

    // Extract processing options from request body
    const options: ProcessingOptions = {
      therapeutic_category: req.body.therapeutic_category,
      processing_mode: req.body.processing_mode || 'local',
      persona_id: req.body.persona_id,
      description: req.body.description || req.body.name
    }

    // Validate processing mode
    if (!['local', 'cloud'].includes(options.processing_mode)) {
      return err(res, 400, 'VALIDATION_ERROR', 'Processing mode must be "local" or "cloud"')
    }

    // Convert multer file to our interface
    const uploadedFile: UploadedFile = {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      buffer: req.file.buffer,
      size: req.file.size
    }

    // Process the document
    const result = await documentProcessor.processDocument(uploadedFile, options)
    
    // Get the created dataset info
    const dataset = await documentProcessor.getDataset(result.dataset_id)
    
    if (!dataset) {
      throw new Error('Dataset was not created properly')
    }

    const responseData = {
      dataset_id: result.dataset_id,
      name: dataset.name,
      file_name: dataset.file_name,
      file_type: dataset.file_type,
      file_size: dataset.file_size,
      therapeutic_category: dataset.therapeutic_category,
      processing_mode: dataset.processing_mode,
      processing_status: result.processing_status,
      created_at: dataset.created_at,
      metadata: JSON.parse(dataset.metadata || '{}')
    }

    return okItem(res, responseData, 201)

  } catch (error) {
    return handleRouterError(res, error, 'upload_dataset')
  }
})

/**
 * GET /api/datasets/:id
 * Get dataset details by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    
    const dataset = await documentProcessor.getDataset(id)
    
    if (!dataset) {
      return err(res, 404, 'NOT_FOUND', `Dataset with ID ${id} not found`)
    }

    const responseData = {
      ...dataset,
      metadata: JSON.parse(dataset.metadata || '{}')
    }

    return okItem(res, responseData)

  } catch (error) {
    return handleRouterError(res, error, 'get_dataset')
  }
})

/**
 * GET /api/datasets/:id/status
 * Get processing status for a dataset
 */
router.get('/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    
    const dataset = await documentProcessor.getDataset(id)
    
    if (!dataset) {
      return err(res, 404, 'NOT_FOUND', `Dataset with ID ${id} not found`)
    }

    const metadata = JSON.parse(dataset.metadata || '{}')
    
    const responseData = {
      dataset_id: id,
      status: dataset.processing_status,
      progress: {
        current_step: dataset.processing_status === 'completed' ? 'completed' : 'processing',
        percentage: dataset.processing_status === 'completed' ? 100 : 50
      },
      results: dataset.processing_status === 'completed' ? {
        chunk_count: dataset.chunk_count,
        processing_mode: dataset.processing_mode,
        word_count: metadata.word_count,
        character_count: metadata.character_count,
        page_count: metadata.page_count
      } : undefined,
      error: dataset.error_message ? {
        message: dataset.error_message,
        code: 'PROCESSING_ERROR',
        retry_possible: true
      } : undefined
    }

    return okItem(res, responseData)

  } catch (error) {
    return handleRouterError(res, error, 'get_dataset_status')
  }
})

/**
 * DELETE /api/datasets/:id
 * Delete a dataset and its associated files
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    
    const dataset = await documentProcessor.getDataset(id)
    
    if (!dataset) {
      return err(res, 404, 'NOT_FOUND', `Dataset with ID ${id} not found`)
    }

    const result = await documentProcessor.deleteDataset(id)
    
    return okItem(res, {
      success: true,
      dataset_id: id,
      chunks_deleted: result.chunks_deleted,
      message: `Dataset "${dataset.name}" and ${result.chunks_deleted} chunks deleted successfully`
    })

  } catch (error) {
    return handleRouterError(res, error, 'delete_dataset')
  }
})

/**
 * GET /api/datasets/:id/chunks
 * Get chunks for a dataset
 */
router.get('/:id/chunks', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const limit = parseInt(req.query.limit as string) || 50
    
    const dataset = await documentProcessor.getDataset(id)
    
    if (!dataset) {
      return err(res, 404, 'NOT_FOUND', `Dataset with ID ${id} not found`)
    }

    const chunks = await documentProcessor.getDatasetChunks(id, limit)
    
    return okItem(res, {
      dataset_id: id,
      dataset_name: dataset.name,
      total_chunks: dataset.chunk_count,
      returned_chunks: chunks.length,
      chunks: chunks
    })

  } catch (error) {
    return handleRouterError(res, error, 'get_dataset_chunks')
  }
})

export default router