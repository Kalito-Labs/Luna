#!/usr/bin/env node

// Migration 002: RAG Document Processing System
// Adds tables for document upload, chunking, and vector storage

const Database = require('better-sqlite3');
const path = require('path');

// Database connection
const dbFile = path.resolve(__dirname, '../kalito.db');
const db = new Database(dbFile);

// Enable pragmas
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

console.log('🚀 Starting Migration 002: RAG Document Processing System');

const transaction = db.transaction(() => {
  // =====================================================================
  // STEP 1: Create datasets table for document storage
  // =====================================================================
  console.log('  📋 Step 1: Creating datasets table...');
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS datasets (
      id TEXT PRIMARY KEY,                    -- UUID for dataset
      name TEXT NOT NULL,                     -- User-friendly name
      description TEXT,                       -- Optional description
      file_name TEXT NOT NULL,                -- Original file name
      file_type TEXT NOT NULL,                -- 'pdf', 'docx', 'txt', 'md'
      file_size INTEGER NOT NULL,             -- Size in bytes
      file_path TEXT NOT NULL,                -- Local storage path
      therapeutic_category TEXT,              -- 'cbt', 'dbt', 'mindfulness', 'general'
      processing_mode TEXT DEFAULT 'local',   -- 'local' or 'cloud'
      processing_status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'error'
      chunk_count INTEGER DEFAULT 0,          -- Number of chunks created
      embedding_model TEXT,                   -- 'local' or 'openai'
      created_by_user BOOLEAN DEFAULT 1,      -- User upload vs system
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      processed_at TEXT,                      -- Processing completion time
      error_message TEXT,                     -- Error details if failed
      metadata TEXT                           -- JSON: page_count, author, etc.
    )
  `);

  // =====================================================================
  // STEP 2: Create document_chunks table for text chunks with embeddings
  // =====================================================================
  console.log('  📋 Step 2: Creating document_chunks table...');
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS document_chunks (
      id TEXT PRIMARY KEY,                    -- Unique chunk ID
      dataset_id TEXT NOT NULL,               -- References datasets(id)
      chunk_index INTEGER NOT NULL,          -- Order within document (0-based)
      content TEXT NOT NULL,                  -- Actual text content
      embedding BLOB,                        -- Vector embedding (binary Float32Array)
      embedding_dim INTEGER DEFAULT 384,     -- Embedding dimensions
      chunk_type TEXT DEFAULT 'body',        -- 'header', 'body', 'instruction', 'example'
      section_title TEXT,                    -- Section/chapter heading
      page_number INTEGER,                   -- Source page number
      char_start INTEGER,                    -- Character start position
      char_end INTEGER,                      -- Character end position
      token_count INTEGER,                   -- Estimated token count
      therapeutic_tags TEXT,                 -- JSON array: cognitive_distortion, etc.
      similarity_threshold REAL DEFAULT 0.7, -- Minimum similarity for retrieval
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      
      FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE
    )
  `);

  // =====================================================================
  // STEP 3: Create persona_datasets table for linking personas to documents
  // =====================================================================
  console.log('  📋 Step 3: Creating persona_datasets table...');
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS persona_datasets (
      id TEXT PRIMARY KEY,                    -- Unique link ID
      persona_id TEXT NOT NULL,               -- References personas(id)
      dataset_id TEXT NOT NULL,               -- References datasets(id)
      enabled BOOLEAN DEFAULT 1,              -- Dataset enabled for this persona
      weight REAL DEFAULT 1.0,                -- Importance weight (0.1 - 2.0)
      access_level TEXT DEFAULT 'full',       -- 'full', 'summary', 'reference_only'
      last_used_at TEXT,                      -- Last time accessed in chat
      usage_count INTEGER DEFAULT 0,          -- Number of times referenced
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      
      FOREIGN KEY (persona_id) REFERENCES personas(id) ON DELETE CASCADE,
      FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE,
      UNIQUE(persona_id, dataset_id)
    )
  `);

  // =====================================================================
  // STEP 4: Create performance indexes
  // =====================================================================
  console.log('  📋 Step 4: Creating performance indexes...');
  
  // Indexes for fast retrieval
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_chunks_dataset 
      ON document_chunks(dataset_id);
  `);
  
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_chunks_type 
      ON document_chunks(chunk_type);
  `);
  
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_chunks_page 
      ON document_chunks(page_number);
  `);
  
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_persona_datasets_persona 
      ON persona_datasets(persona_id);
  `);
  
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_persona_datasets_enabled 
      ON persona_datasets(persona_id, enabled);
  `);
  
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_datasets_status 
      ON datasets(processing_status);
  `);
  
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_datasets_category 
      ON datasets(therapeutic_category);
  `);

  // =====================================================================
  // STEP 5: Create full-text search virtual table
  // =====================================================================
  console.log('  📋 Step 5: Creating full-text search index...');
  
  db.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS document_chunks_fts USING fts5(
      content,                                -- Searchable text content
      section_title,                          -- Searchable section titles
      therapeutic_tags,                       -- Searchable tags
      content='document_chunks',              -- Source table
      content_rowid='id'                      -- Row ID mapping
    )
  `);

  // =====================================================================
  // STEP 6: Create triggers for FTS sync
  // =====================================================================
  console.log('  📋 Step 6: Creating FTS sync triggers...');
  
  // Insert trigger
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS document_chunks_fts_insert AFTER INSERT ON document_chunks
    BEGIN
      INSERT INTO document_chunks_fts(rowid, content, section_title, therapeutic_tags)
      VALUES (NEW.id, NEW.content, NEW.section_title, NEW.therapeutic_tags);
    END
  `);
  
  // Update trigger
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS document_chunks_fts_update AFTER UPDATE ON document_chunks
    BEGIN
      UPDATE document_chunks_fts SET
        content = NEW.content,
        section_title = NEW.section_title,
        therapeutic_tags = NEW.therapeutic_tags
      WHERE rowid = NEW.id;
    END
  `);
  
  // Delete trigger
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS document_chunks_fts_delete AFTER DELETE ON document_chunks
    BEGIN
      DELETE FROM document_chunks_fts WHERE rowid = OLD.id;
    END
  `);

  console.log('  ✅ All RAG tables and indexes created successfully!');
});

try {
  transaction();
  
  // Verify tables were created
  const tables = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name IN ('datasets', 'document_chunks', 'persona_datasets', 'document_chunks_fts')
    ORDER BY name
  `).all();
  
  console.log('\n📊 Migration 002 Summary:');
  console.log('  📋 Tables created:');
  tables.forEach(table => {
    const count = db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get();
    console.log(`    - ${table.name}: ${count.count} records`);
  });
  
  console.log('\n🎯 Ready for RAG document processing!');
  console.log('  Next steps:');
  console.log('    1. Implement document upload API');
  console.log('    2. Create text extraction service');
  console.log('    3. Build chunking algorithms');
  console.log('    4. Add embedding generation');
  
} catch (error) {
  console.error('❌ Migration 002 failed:', error.message);
  process.exit(1);
}

db.close();
console.log('✅ Migration 002 completed successfully!');