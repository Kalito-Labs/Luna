# Luna Database Schema

**Last Updated**: November 21, 2025  
**Database**: kalito.db (SQLite)  
**Location**: `/backend/db/kalito.db`  
**Total Tables**: 10  
**Status**: Active production database

---

## Quick Stats

| Metric | Value |
|--------|-------|
| **Database Type** | SQLite with WAL mode |
| **Active Patients** | 1 (Kaleb) |
| **Medications** | 4 active |
| **Journal Entries** | 1 |
| **Personas** | 2 (default cloud/local) |
| **Sessions** | 0 (ready for use) |
| **Messages** | 0 (ready for use) |

---

## Entity Relationship Diagram

```mermaid
erDiagram
    patients ||--o{ medications : "has"
    patients ||--o{ appointments : "schedules"
    patients ||--o{ journal_entries : "writes"
    patients ||--o{ vitals : "tracks"
    patients ||--o{ sessions : "creates"
    
    sessions ||--o{ messages : "contains"
    sessions ||--o{ conversation_summaries : "generates"
    sessions ||--o{ semantic_pins : "extracts"
    sessions }o--|| personas : "uses"
    sessions ||--o{ journal_entries : "links"
    
    patients {
        TEXT id PK
        TEXT name
        TEXT date_of_birth
        TEXT gender
        TEXT phone
        TEXT city
        TEXT state
        TEXT occupation
        TEXT occupation_description
        TEXT languages
        TEXT notes
        INTEGER active
        TEXT primary_doctor_id
        TEXT created_at
        TEXT updated_at
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
    
    appointments {
        TEXT id PK
        TEXT patient_id FK
        TEXT appointment_date
        TEXT appointment_time
        TEXT appointment_type
        TEXT location
        TEXT notes
        TEXT preparation_notes
        TEXT status
        TEXT outcome_summary
        INTEGER follow_up_required
        TEXT provider_name
        TEXT created_at
        TEXT updated_at
    }
    
    journal_entries {
        TEXT id PK
        TEXT patient_id FK
        TEXT session_id FK
        TEXT title
        TEXT content
        TEXT entry_date
        TEXT entry_time
        TEXT mood
        TEXT emotions
        TEXT journal_type
        TEXT prompt_used
        TEXT privacy_level
        INTEGER favorite
        TEXT created_at
        TEXT updated_at
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
    
    sessions {
        TEXT id PK
        TEXT name
        TEXT model
        TEXT recap
        TEXT persona_id FK
        TEXT session_type
        TEXT patient_id FK
        TEXT related_record_id
        TEXT care_category
        INTEGER saved
        TEXT created_at
        TEXT updated_at
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
        TEXT patient_id FK
        TEXT content
        TEXT source_message_id
        TEXT medical_category
        TEXT urgency_level
        REAL importance_score
        TEXT pin_type
        TEXT created_at
    }
```

---

## Table Categories

### 🧠 Mental Health Core
- **patients** - Patient profiles (mental health focused)
- **medications** - Prescription tracking with side effects
- **appointments** - Healthcare scheduling with preparation
- **journal_entries** - Daily journaling with mood tracking
- **vitals** - Health metrics (weight, glucose)

### 🤖 AI Conversation System
- **sessions** - Chat session management
- **messages** - Individual conversation messages
- **personas** - AI personality configurations

### 💾 Memory System
- **conversation_summaries** - Compressed conversation history
- **semantic_pins** - Important information extraction

---

## Foreign Key Relationships (Verified)

| Child Table | Parent Table | FK Column | On Delete |
|-------------|--------------|-----------|-----------|
| medications | patients | patient_id | CASCADE |
| appointments | patients | patient_id | CASCADE |
| journal_entries | patients | patient_id | CASCADE |
| journal_entries | sessions | session_id | SET NULL |
| vitals | patients | patient_id | CASCADE |
| messages | sessions | session_id | CASCADE |
| conversation_summaries | sessions | session_id | CASCADE |
| semantic_pins | sessions | session_id | CASCADE |

**Note**: `sessions.persona_id` and `sessions.patient_id` do not have explicit foreign key constraints.

---

## Indexes (Performance Optimized)

| Index Name | Table | Columns | Purpose |
|------------|-------|---------|---------|
| `idx_medications_patient` | medications | patient_id | Fast medication lookups |
| `idx_medications_active` | medications | active | Filter active meds |
| `idx_journal_entries_patient_date` | journal_entries | patient_id, entry_date DESC | Chronological journal queries |
| `idx_journal_entries_mood` | journal_entries | patient_id, mood | Mood filtering |
| `idx_journal_entries_favorite` | journal_entries | patient_id, favorite | Favorite entries |
| `idx_messages_session_created` | messages | session_id, created_at DESC | Message history retrieval |
| `idx_sessions_patient_type` | sessions | patient_id, session_type, updated_at DESC | Session queries |
| `idx_semantic_pins_patient_medical` | semantic_pins | patient_id, medical_category, importance_score DESC | Medical pin queries |

---

## Current Data Snapshot

### Active Patient: Kaleb
- **ID**: `1762885449885-vyuzo96qop9`
- **DOB**: 1986-10-09 (Age 39)
- **Location**: Texas
- **Status**: Active mental health patient

### Active Medications (4)
1. **Lithium** - 300mg, 3x daily (mood stabilizer)
2. **Zyprexa** - 5mg, 1x daily (antipsychotic)
3. **Hydroxizine** - 25mg, 2x daily (anxiolytic)
4. **Naltrexone** - 50mg, 1x daily (addiction treatment)

### Journal Entry (1)
- **Date**: 2025-11-21
- **Mood**: Relaxed
- **Type**: Free journaling

### Default Personas (2)
- **default-cloud** - Cloud-based AI assistant
- **default-local** - Privacy-focused local AI

---

## Database Configuration

```sql
-- Performance optimizations applied
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA cache_size = 1000;
PRAGMA temp_store = MEMORY;
```

**Benefits**:
- **WAL mode**: Better concurrency for read/write operations
- **Synchronous NORMAL**: Balanced durability and performance
- **Large cache**: Improved query performance
- **Memory temp store**: Faster temporary operations

---

## Schema Files

| File | Purpose |
|------|---------|
| `/backend/db/db.ts` | Database connection and configuration |
| `/backend/db/init.ts` | Table creation and migrations |
| `/backend/db/kalito.db` | SQLite database file |

---

## Next Steps

1. Review [Database Architecture](./02-DATABASE-ARCHITECTURE.md) for technical details
2. Check [Legacy Issues](./03-LEGACY-CLEANUP.md) for cleanup tasks
3. See [Data Model Guide](./04-DATA-MODEL-GUIDE.md) for field-by-field reference

---

**Documentation Generated**: AI Analysis on November 21, 2025  
**For**: Luna Mental Health Companion Platform  
**Version**: 1.1.0-beta
