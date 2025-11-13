# Luna Database Schema Analysis

**Generated:** November 13, 2025  
**Database:** kalito.db (SQLite)  
**File Size:** 208 KB  
**Location:** `/backend/db/kalito.db`  
**Total Tables:** 10  

## Database Statistics

| Table Name | Row Count | Purpose | Status |
|------------|-----------|---------|---------|
| appointments | 1 | Healthcare appointment scheduling | ✅ Active |
| medications | 3 | Patient medication tracking | ✅ Active |
| patients | 1 | Patient profile information | ✅ Active |
| personas | 2 | AI assistant personality configurations | ✅ Active |
| sessions | 0 | Chat session management | ⚪ Ready |
| messages | 0 | Individual chat messages | ⚪ Ready |
| vitals | 0 | Health metrics tracking | ⚠️ Unused |
| conversation_summaries | 0 | AI conversation compression | ⚪ Ready |
| semantic_pins | 0 | Important information extraction | ⚪ Ready |
| sqlite_sequence | 1 | SQLite autoincrement tracking | 🔧 System |

## Entity Relationship Diagram

```mermaid
erDiagram
    patients ||--o{ medications : "has"
    patients ||--o{ appointments : "schedules"
    patients ||--o{ sessions : "creates"
    patients ||--o{ vitals : "records"
    
    sessions ||--o{ messages : "contains"
    sessions ||--o{ conversation_summaries : "summarizes"
    sessions ||--o{ semantic_pins : "creates"
    sessions }o--|| personas : "uses"
    
    appointments }o--|| healthcare_providers : "scheduled_with"
    
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
        TEXT city
        TEXT state
        TEXT occupation
        TEXT occupation_description
        TEXT languages
        TEXT primary_doctor_id
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
        TEXT provider_id FK
        TEXT appointment_date
        TEXT appointment_time
        TEXT appointment_type
        TEXT location
        TEXT notes
        TEXT preparation_notes
        TEXT status
        TEXT outcome_summary
        INTEGER follow_up_required
        TEXT created_at
        TEXT updated_at
        TEXT provider_name
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
```

## Data Flow Diagram

```mermaid
flowchart TB
    subgraph "Patient Management"
        A[patients]
        B[medications]
        C[appointments]
        D[vitals]
    end
    
    subgraph "AI Chat System"
        E[personas]
        F[sessions]
        G[messages]
    end
    
    subgraph "AI Memory System"
        H[conversation_summaries]
        I[semantic_pins]
    end
    
    subgraph "External References"
        J[healthcare_providers]
    end
    
    A --> B
    A --> C
    A --> D
    A --> F
    E --> F
    F --> G
    F --> H
    F --> I
    J -.-> C
    
    style A fill:#4CAF50
    style B fill:#4CAF50
    style C fill:#4CAF50
    style E fill:#4CAF50
    style D fill:#FFC107
    style F fill:#2196F3
    style G fill:#2196F3
    style H fill:#2196F3
    style I fill:#2196F3
    style J fill:#F44336
```

## Table Schemas (Detailed)

### Core Patient Data

#### `patients` (1 record)
**Purpose:** Single-user profile storage for the Luna mental health companion app  
**Status:** ✅ Active with complete patient data

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | Unique patient identifier |
| name | TEXT | NOT NULL | Patient full name |
| date_of_birth | TEXT | | Birth date (YYYY-MM-DD format) |
| relationship | TEXT | | Relationship to user (typically 'self') |
| gender | TEXT | | Patient gender |
| phone | TEXT | | Contact phone number |
| emergency_contact_name | TEXT | | Emergency contact person |
| emergency_contact_phone | TEXT | | Emergency contact phone |
| primary_doctor | TEXT | | Primary doctor name (deprecated) |
| insurance_provider | TEXT | | Health insurance company |
| insurance_id | TEXT | | Insurance member ID |
| notes | TEXT | | General patient notes |
| active | INTEGER | DEFAULT 1 | Record status flag |
| created_at | TEXT | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | TEXT | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |
| doctor_address | TEXT | | Doctor office address (deprecated) |
| doctor_phone | TEXT | | Doctor phone (deprecated) |
| primary_doctor_id | TEXT | | Foreign key to providers table |
| city | TEXT | | Patient city |
| state | TEXT | | Patient state |
| occupation | TEXT | | Patient occupation |
| occupation_description | TEXT | | Detailed occupation description |
| languages | TEXT | | Languages spoken |

**Foreign Keys:** None  
**Indexes:** Primary key index  

**Current Data:**
```json
{
  "id": "1762885449885-vyuzo96qop9",
  "name": "Caleb Sanchez",
  "date_of_birth": "1986-10-09",
  "relationship": "self",
  "gender": "male",
  "phone": "956-324-1560",
  "occupation": "Caregiver \"Palomita\"",
  "occupation_description": "I take care of my elderly Mom Aurora Sanchez.",
  "languages": "English and Spanish",
  "notes": "Mental health companion app user"
}
```

---

#### `medications` (3 records)
**Purpose:** Tracks patient medications with detailed prescription information  
**Status:** ✅ Active with current medication regimen

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | Unique medication record ID |
| patient_id | TEXT | NOT NULL, FK → patients(id) | Patient reference |
| name | TEXT | NOT NULL | Medication brand name |
| generic_name | TEXT | | Generic medication name |
| dosage | TEXT | NOT NULL | Medication strength |
| frequency | TEXT | NOT NULL | Dosing schedule |
| route | TEXT | | Administration route (oral, injection, etc.) |
| prescribing_doctor | TEXT | | Prescribing physician name |
| pharmacy | TEXT | | Filling pharmacy |
| rx_number | TEXT | | Prescription number |
| side_effects | TEXT | | Known side effects |
| notes | TEXT | | Additional medication notes |
| active | INTEGER | DEFAULT 1 | Medication status |
| created_at | TEXT | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | TEXT | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

**Foreign Keys:** patient_id → patients(id) ON DELETE CASCADE  
**Indexes:** idx_medications_patient, idx_medications_active  

**Current Medications:**
```json
[
  {
    "name": "Lithium",
    "generic_name": "Lithium Carb",
    "dosage": "300mg",
    "frequency": "three_times_daily",
    "route": "oral",
    "prescribing_doctor": "Myriam Thiele",
    "pharmacy": "Genoa Healthcare",
    "rx_number": "143801/2"
  },
  {
    "name": "Zyprexa",
    "generic_name": "Olanzapine",
    "dosage": "5mg",
    "frequency": "once_daily",
    "route": "oral",
    "prescribing_doctor": "Myriam Thiele",
    "pharmacy": "Genoa Healthcare",
    "rx_number": "E148193/0N"
  },
  {
    "name": "Hydroxizine",
    "generic_name": "Hydroxizine",
    "dosage": "25mg",
    "frequency": "twice_daily",
    "route": "oral",
    "prescribing_doctor": "Myriam Thiele",
    "pharmacy": "Genoa Healthcare",
    "rx_number": "143799/3"
  }
]
```

---

#### `appointments` (1 record)
**Purpose:** Healthcare appointment scheduling and tracking  
**Status:** ✅ Active with upcoming appointment

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | Unique appointment ID |
| patient_id | TEXT | NOT NULL, FK → patients(id) | Patient reference |
| provider_id | TEXT | FK → healthcare_providers(id) | Provider reference (⚠️ broken FK) |
| appointment_date | TEXT | NOT NULL | Appointment date (YYYY-MM-DD) |
| appointment_time | TEXT | | Appointment time |
| appointment_type | TEXT | | Type of appointment |
| location | TEXT | | Appointment location |
| notes | TEXT | | Appointment notes |
| preparation_notes | TEXT | | Pre-appointment instructions |
| status | TEXT | DEFAULT 'scheduled' | Appointment status |
| outcome_summary | TEXT | | Post-appointment summary |
| follow_up_required | INTEGER | DEFAULT 0 | Follow-up flag |
| created_at | TEXT | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | TEXT | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |
| provider_name | TEXT | | Provider name (denormalized) |

**Foreign Keys:** 
- patient_id → patients(id) ON DELETE CASCADE ✅
- provider_id → healthcare_providers(id) ⚠️ **BROKEN** (table doesn't exist)

**Indexes:** idx_appointments_patient_date, idx_appointments_status_date  

**Current Appointment:**
```json
{
  "appointment_date": "2025-11-17",
  "appointment_time": "14:30",
  "appointment_type": "routine",
  "location": "1500 Pappas St, Laredo, TX 78041",
  "provider_name": "Myriam Thiele",
  "status": "scheduled"
}
```

---

### AI Chat System

#### `personas` (2 records)
**Purpose:** AI assistant personality and behavior configurations  
**Status:** ✅ Active with default personas configured

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | Unique persona identifier |
| name | TEXT | NOT NULL | Persona display name |
| prompt | TEXT | NOT NULL | System prompt for AI behavior |
| description | TEXT | | Persona description |
| icon | TEXT | | Display icon |
| category | TEXT | | Persona category (cloud/local) |
| default_model | TEXT | | Default AI model |
| suggested_models | TEXT | | Recommended models list |
| temperature | REAL | | AI response creativity |
| maxTokens | INTEGER | | Maximum response length |
| topP | REAL | | AI nucleus sampling |
| repeatPenalty | REAL | | Repetition penalty |
| stopSequences | TEXT | | Stop sequences for generation |
| is_default | INTEGER | DEFAULT 0 | Default persona flag |
| created_at | TEXT | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | TEXT | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |
| eldercare_specialty | TEXT | | Eldercare specialization |
| patient_context | INTEGER | DEFAULT 0 | Patient context awareness |

**Foreign Keys:** None  
**Indexes:** Primary key index  

**Current Personas:**
- **Kalito Cloud Assistant** (☁️) - Comprehensive care companion with full database access
- **Kalito Local Assistant** (🤖) - Privacy-focused local AI variant

---

#### `sessions` (0 records)
**Purpose:** Chat session management and organization  
**Status:** ⚪ Ready for use (no conversations yet)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | Unique session identifier |
| name | TEXT | | Session display name |
| model | TEXT | | AI model used |
| recap | TEXT | | Session summary |
| persona_id | TEXT | FK → personas(id) | Associated persona |
| created_at | TEXT | | Creation timestamp |
| updated_at | TEXT | | Last update timestamp |
| saved | INTEGER | DEFAULT 0 | Saved session flag |
| session_type | TEXT | DEFAULT 'chat' | Session type |
| patient_id | TEXT | FK → patients(id) | Associated patient |
| related_record_id | TEXT | | Related record reference |
| care_category | TEXT | | Care category classification |

**Foreign Keys:** 
- persona_id → personas(id)
- patient_id → patients(id)

**Indexes:** idx_sessions_patient_type  

---

#### `messages` (0 records)
**Purpose:** Individual chat messages within sessions  
**Status:** ⚪ Ready for use (no messages yet)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique message ID |
| session_id | TEXT | NOT NULL, FK → sessions(id) | Session reference |
| role | TEXT | | Message role (user/assistant) |
| text | TEXT | | Message content |
| model_id | TEXT | | AI model identifier |
| token_usage | INTEGER | | Token count |
| importance_score | REAL | DEFAULT 0.5 | Importance rating |
| created_at | TEXT | | Creation timestamp |

**Foreign Keys:** session_id → sessions(id) ON DELETE CASCADE  
**Indexes:** idx_messages_session_created  

---

### AI Memory System

#### `conversation_summaries` (0 records)
**Purpose:** Compressed conversation history for context retention  
**Status:** ⚪ Ready for use

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | Unique summary ID |
| session_id | TEXT | NOT NULL, FK → sessions(id) | Session reference |
| summary | TEXT | NOT NULL | Conversation summary |
| message_count | INTEGER | NOT NULL | Messages summarized |
| start_message_id | TEXT | | First message in summary |
| end_message_id | TEXT | | Last message in summary |
| importance_score | REAL | DEFAULT 0.7 | Summary importance |
| created_at | TEXT | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |

**Foreign Keys:** session_id → sessions(id) ON DELETE CASCADE  

---

#### `semantic_pins` (0 records)
**Purpose:** Important information extraction and quick reference  
**Status:** ⚪ Ready for use

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | Unique pin ID |
| session_id | TEXT | NOT NULL, FK → sessions(id) | Session reference |
| content | TEXT | NOT NULL | Pinned content |
| source_message_id | TEXT | | Source message reference |
| importance_score | REAL | DEFAULT 0.8 | Importance rating |
| pin_type | TEXT | DEFAULT 'user' | Pin type |
| created_at | TEXT | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| medical_category | TEXT | | Medical categorization |
| patient_id | TEXT | FK → patients(id) | Patient reference |
| urgency_level | TEXT | DEFAULT 'normal' | Urgency classification |

**Foreign Keys:** 
- session_id → sessions(id) ON DELETE CASCADE
- patient_id → patients(id)

**Indexes:** idx_semantic_pins_patient_medical  

---

### Health Tracking

#### `vitals` (0 records) ⚠️
**Purpose:** Health metrics tracking (weight, glucose, etc.)  
**Status:** ⚠️ **UNUSED** - Table exists but no data, limited code integration

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | Unique vital record ID |
| patient_id | TEXT | NOT NULL, FK → patients(id) | Patient reference |
| weight_lbs | REAL | | Weight in pounds |
| glucose_am | INTEGER | | Morning glucose reading |
| glucose_pm | INTEGER | | Evening glucose reading |
| recorded_date | TEXT | NOT NULL | Recording date |
| notes | TEXT | | Vital notes |
| active | INTEGER | DEFAULT 1 | Record status |
| created_at | TEXT | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | TEXT | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

**Foreign Keys:** patient_id → patients(id) ON DELETE CASCADE  
**Indexes:** Primary key index  

**Code Integration:** 
- ✅ Route exists (`/api/vitals`)
- ✅ Service layer integration in `eldercareContextService.ts`
- ⚠️ No actual data recorded
- ⚠️ Mental health focus may not need detailed vitals tracking

## Index Documentation

```mermaid
graph TB
    subgraph "Performance Indexes"
        A[idx_appointments_patient_date<br/>Patient appointment queries]
        B[idx_appointments_status_date<br/>Status-based filtering]
        C[idx_medications_patient<br/>Patient medication lookup]
        D[idx_medications_active<br/>Active medication filtering]
        E[idx_messages_session_created<br/>Session message ordering]
        F[idx_sessions_patient_type<br/>Patient session filtering]
        G[idx_semantic_pins_patient_medical<br/>Medical pin categorization]
    end
    
    style A fill:#4CAF50
    style B fill:#4CAF50
    style C fill:#4CAF50
    style D fill:#4CAF50
    style E fill:#2196F3
    style F fill:#2196F3
    style G fill:#2196F3
```

### Index Catalog

1. **idx_appointments_patient_date** - Optimizes patient appointment history queries
2. **idx_appointments_status_date** - Enables efficient status-based appointment filtering  
3. **idx_medications_patient** - Fast patient medication lookups
4. **idx_medications_active** - Quick active medication filtering
5. **idx_messages_session_created** - Chronological message retrieval
6. **idx_sessions_patient_type** - Patient session filtering by type
7. **idx_semantic_pins_patient_medical** - Medical categorization queries

## Current Data Summary

### Patient Profile
- **Name:** Caleb Sanchez (Male, DOB: 1986-10-09)
- **Role:** Caregiver for elderly mother Aurora Sanchez
- **Languages:** English and Spanish
- **Phone:** 956-324-1560

### Medical Information
- **Active Medications:** 3 prescriptions from Dr. Myriam Thiele
  - Lithium 300mg (3x daily) - Mood stabilizer
  - Zyprexa 5mg (daily) - Antipsychotic
  - Hydroxizine 25mg (2x daily) - Anti-anxiety
- **Pharmacy:** Genoa Healthcare
- **Upcoming Appointment:** Nov 17, 2025 at 2:30 PM (routine)

### System Status
- **AI Personas:** 2 configured (cloud and local variants)
- **Chat Sessions:** 0 (new user, no conversations)
- **Message Count:** 678 (from sqlite_sequence - likely test data)

```mermaid
pie title Data Distribution
    "Patient Records" : 1
    "Medications" : 3  
    "Appointments" : 1
    "AI Personas" : 2
    "Empty Tables" : 6
```

## Tables to Consider Removing

### High Priority for Removal

#### `vitals` Table ❌
- **Row Count:** 0 records
- **Purpose:** Health vitals tracking (weight, glucose)
- **Code Integration:** Limited (route exists but unused)
- **Recommendation:** **REMOVE**
- **Reasoning:** 
  - Mental health companion app doesn't require detailed vitals tracking
  - No data has been recorded despite table existence
  - Focus is on medication management and appointments, not medical monitoring
  - Table adds complexity without providing value for the use case

### Medium Priority for Review

#### Missing `healthcare_providers` Table ⚠️
- **Issue:** `appointments.provider_id` references non-existent table
- **Impact:** Broken foreign key constraint
- **Options:**
  1. **Create the missing table** for proper provider management
  2. **Remove provider_id column** and rely on `provider_name` field
  3. **Add provider_id constraint as nullable** 
- **Recommendation:** **Option 2** - Remove provider_id column for simplicity

### Low Priority (Keep for Future)

#### AI Memory Tables ✅ KEEP
- `conversation_summaries` - Essential for long conversation management
- `semantic_pins` - Important for extracting key health information
- `sessions` & `messages` - Core chat functionality

**Reasoning:** These tables are fundamental to the AI companion functionality and will be populated as the user begins chatting with the system.

## Database Health Assessment

### ✅ Strengths
- **Foreign key enforcement enabled** - Data integrity maintained
- **WAL journaling mode** - Better concurrency and reliability  
- **Proper indexing** - Performance optimized for common queries
- **Good normalization** - Logical data separation
- **Successful migrations** - Column additions handled cleanly

### ⚠️ Warning Issues
1. **Broken Foreign Key:** `appointments.provider_id` → `healthcare_providers.id`
2. **Unused Table:** `vitals` table has infrastructure but no usage
3. **Schema Drift:** Some documented columns don't match current schema
4. **Mixed Naming:** Inconsistent snake_case vs camelCase in column names

### 📊 Database Statistics
- **File Size:** 208 KB
- **Total Tables:** 10
- **Active Tables:** 4 (patients, medications, appointments, personas)
- **Ready Tables:** 4 (sessions, messages, conversation_summaries, semantic_pins) 
- **Unused Tables:** 1 (vitals)
- **System Tables:** 1 (sqlite_sequence)
- **Foreign Key Constraints:** 8 defined, 1 broken
- **Indexes:** 7 performance indexes

### 🔧 Recommended Actions
1. **Remove `vitals` table** - Unused and unnecessary for mental health focus
2. **Fix `appointments.provider_id` constraint** - Either create providers table or remove column
3. **Update schema documentation** - Sync with current database state
4. **Standardize column naming** - Choose snake_case or camelCase consistently

---

**Analysis completed:** November 13, 2025  
**Next Review:** After schema cleanup implementation  
**Database Status:** ✅ Healthy with minor cleanup needed