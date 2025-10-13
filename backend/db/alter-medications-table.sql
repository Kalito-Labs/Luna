-- Migration: Update medications table schema
-- Date: 2025-10-13
-- Description: Add rx_number column and remove start_date, end_date, refills_remaining columns

-- SQLite doesn't support DROP COLUMN directly, so we need to recreate the table

BEGIN TRANSACTION;

-- Create new medications table with updated schema
CREATE TABLE medications_new (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  name TEXT NOT NULL,
  generic_name TEXT,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  route TEXT,
  prescribing_doctor TEXT,
  pharmacy TEXT,
  rx_number TEXT,
  side_effects TEXT,
  notes TEXT,
  active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

-- Copy existing data to new table
INSERT INTO medications_new (
  id, patient_id, name, generic_name, dosage, frequency, route,
  prescribing_doctor, pharmacy, side_effects, notes, active, created_at, updated_at
)
SELECT 
  id, patient_id, name, generic_name, dosage, frequency, route,
  prescribing_doctor, pharmacy, side_effects, notes, active, created_at, updated_at
FROM medications;

-- Drop old table
DROP TABLE medications;

-- Rename new table
ALTER TABLE medications_new RENAME TO medications;

-- Recreate indexes (if any existed)
CREATE INDEX IF NOT EXISTS idx_medications_patient ON medications(patient_id);
CREATE INDEX IF NOT EXISTS idx_medications_active ON medications(active);

COMMIT;
