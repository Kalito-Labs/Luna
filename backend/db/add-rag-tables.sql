-- RAG Tables for Luna (No FTS5)

CREATE TABLE IF NOT EXISTS datasets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_path TEXT NOT NULL,
  therapeutic_category TEXT,
  processing_mode TEXT DEFAULT 'local',
  processing_status TEXT DEFAULT 'pending',
  chunk_count INTEGER DEFAULT 0,
  embedding_model TEXT,
  created_by_user BOOLEAN DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  processed_at TEXT,
  error_message TEXT,
  metadata TEXT
);

CREATE TABLE IF NOT EXISTS document_chunks (
  id TEXT PRIMARY KEY,
  dataset_id TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  embedding BLOB,
  embedding_dim INTEGER DEFAULT 384,
  embedding_model TEXT,
  chunk_type TEXT DEFAULT 'body',
  section_title TEXT,
  page_number INTEGER,
  char_start INTEGER,
  char_end INTEGER,
  token_count INTEGER,
  therapeutic_tags TEXT,
  similarity_threshold REAL DEFAULT 0.7,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS persona_datasets (
  id TEXT PRIMARY KEY,
  persona_id TEXT NOT NULL,
  dataset_id TEXT NOT NULL,
  enabled BOOLEAN DEFAULT 1,
  weight REAL DEFAULT 1.0,
  access_level TEXT DEFAULT 'read',
  last_used_at TEXT,
  usage_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (persona_id) REFERENCES personas(id) ON DELETE CASCADE,
  FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE,
  UNIQUE(persona_id, dataset_id)
);
