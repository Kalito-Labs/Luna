# Project Luna Database Schema

This document visualizes the current database structure for Project Luna - a single-user mental health companion app.

## Database Overview

```mermaid
erDiagram
    patients ||--o{ medications : "has"
    patients ||--o{ sessions : "creates"
    patients ||--o{ semantic_pins : "relates to"
    patients ||--o{ vitals : "tracks"
    
    sessions ||--o{ messages : "contains"
    sessions ||--o{ conversation_summaries : "summarizes"
    sessions ||--o{ semantic_pins : "creates"
    sessions }o--|| personas : "uses"

    patients {
        TEXT id PK
        TEXT name
        TEXT date_of_birth
        TEXT relationship
        TEXT gender
        TEXT phone
        TEXT emergency_contact_name
        TEXT emergency_contact_phone
        TEXT primary_doctor
        TEXT insurance_provider
        TEXT insurance_id
        TEXT notes
        INTEGER active
        TEXT created_at
        TEXT updated_at
        TEXT doctor_address
        TEXT doctor_phone
        TEXT primary_doctor_id
        TEXT city
        TEXT state
        TEXT occupation
        TEXT occupation_description
        TEXT languages
    }

    medications {
        TEXT id PK
        TEXT patient_id FK
        TEXT name
        TEXT generic_name
        TEXT dosage
        TEXT frequency
        TEXT route
        TEXT prescribing_doctor
        TEXT pharmacy
        TEXT rx_number
        TEXT side_effects
        TEXT notes
        INTEGER active
        TEXT created_at
        TEXT updated_at
    }

    sessions {
        TEXT id PK
        TEXT name
        TEXT model
        TEXT recap
        TEXT persona_id FK
        TEXT created_at
        TEXT updated_at
        INTEGER saved
        TEXT session_type
        TEXT patient_id FK
        TEXT related_record_id
        TEXT care_category
    }

    messages {
        INTEGER id PK
        TEXT session_id FK
        TEXT role
        TEXT text
        TEXT model_id
        INTEGER token_usage
        REAL importance_score
        TEXT created_at
    }

    personas {
        TEXT id PK
        TEXT name
        TEXT prompt
        TEXT description
        TEXT icon
        TEXT category
        TEXT default_model
        TEXT suggested_models
        REAL temperature
        INTEGER maxTokens
        REAL topP
        REAL repeatPenalty
        TEXT stopSequences
        INTEGER is_default
        TEXT created_at
        TEXT updated_at
        TEXT eldercare_specialty
        INTEGER patient_context
    }

    conversation_summaries {
        TEXT id PK
        TEXT session_id FK
        TEXT summary
        INTEGER message_count
        TEXT start_message_id
        TEXT end_message_id
        REAL importance_score
        TEXT created_at
    }

    semantic_pins {
        TEXT id PK
        TEXT session_id FK
        TEXT content
        TEXT source_message_id
        REAL importance_score
        TEXT pin_type
        TEXT created_at
        TEXT medical_category
        TEXT patient_id FK
        TEXT urgency_level
    }

    vitals {
        TEXT id PK
        TEXT patient_id FK
        REAL weight_lbs
        INTEGER glucose_am
        INTEGER glucose_pm
        TEXT recorded_date
        TEXT notes
        INTEGER active
        TEXT created_at
        TEXT updated_at
    }
```

## Table Descriptions

### Core User Data
- **patients**: Single user profile (Caleb Sanchez) with personal and health information
- **medications**: Tracks medications with dosage, frequency, and prescription details
- **vitals**: Records health vitals like weight and glucose readings

### AI Chat System
- **sessions**: Chat sessions with AI companions, can be linked to patient records
- **messages**: Individual messages within chat sessions
- **personas**: AI personality configurations with different specialties and behaviors

### AI Memory System
- **conversation_summaries**: Compressed summaries of long conversations for context retention
- **semantic_pins**: Important information extracted from conversations for quick reference

## Recent Changes

**Updated (November 12, 2025):**
- Added `doctor_address`, `doctor_phone`, and `primary_doctor_id` fields to `patients` table
- Confirmed `vitals` table is still present in the database
- **REMOVED `appointments` table** - Feature no longer needed

**Removed Tables (November 11, 2025):**
- `caregivers` - Multi-user eldercare concept (not needed for single-user app)
- `healthcare_providers` - Eldercare-specific provider management
- `medication_logs` - Medication adherence tracking (user decided not to track)

## Current Record Counts
- patients: 1
- medications: 3
- sessions: 0
- messages: 0
- personas: 2
- conversation_summaries: 0
- semantic_pins: 0
- vitals: 0
