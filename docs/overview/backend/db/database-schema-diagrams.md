# Kalito Database Schema Diagrams

This document provides comprehensive visual representations of the Kalito database schema using Mermaid diagrams.

---

## Complete Entity Relationship Diagram

This diagram shows all tables and their relationships in the Kalito database:

```mermaid
erDiagram
    %% Chat & AI System Tables
    sessions ||--o{ messages : "has many"
    sessions ||--o{ conversation_summaries : "has many"
    sessions ||--o{ semantic_pins : "has many"
    sessions }o--|| personas : "uses"
    sessions }o--|| patients : "belongs to (optional)"
    
    %% Eldercare Core Tables
    patients ||--o{ medical_records : "has many"
    patients ||--o{ appointments : "has many"
    patients ||--o{ medications : "has many"
    patients ||--o{ medication_logs : "has many"
    patients ||--o{ vitals : "has many"
    patients ||--o{ sessions : "has many"
    patients ||--o{ semantic_pins : "has many"
    
    %% Healthcare Provider Relationships
    healthcare_providers ||--o{ appointments : "schedules"
    
    %% Medication Tracking
    medications ||--o{ medication_logs : "tracked by"
    
    %% Table Definitions
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
        TEXT created_at
        TEXT updated_at
        INTEGER saved
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
        TEXT eldercare_specialty
        REAL temperature
        INTEGER maxTokens
        REAL topP
        REAL repeatPenalty
        TEXT stopSequences
        INTEGER is_default
        INTEGER patient_context
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
        TEXT doctor_address
        TEXT doctor_phone
        TEXT insurance_provider
        TEXT insurance_id
        TEXT notes
        INTEGER active
        TEXT created_at
        TEXT updated_at
    }
    
    medical_records {
        TEXT id PK
        TEXT patient_id FK
        TEXT record_type
        TEXT title
        TEXT description
        TEXT date_recorded
        TEXT provider_name
        TEXT location
        REAL importance_score
        TEXT tags
        TEXT attachments
        TEXT created_at
        TEXT updated_at
    }
    
    healthcare_providers {
        TEXT id PK
        TEXT name
        TEXT specialty
        TEXT practice_name
        TEXT phone
        TEXT email
        TEXT address
        TEXT notes
        INTEGER preferred
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
    
    medication_logs {
        TEXT id PK
        TEXT medication_id FK
        TEXT patient_id FK
        TEXT scheduled_time
        TEXT actual_time
        TEXT status
        TEXT notes
        INTEGER reminder_sent
        TEXT created_at
    }
    
    vitals {
        TEXT id PK
        TEXT patient_id FK
        REAL weight_kg
        INTEGER glucose_am
        INTEGER glucose_pm
        TEXT recorded_date
        TEXT notes
        INTEGER active
        TEXT created_at
        TEXT updated_at
    }
    
    caregivers {
        TEXT id PK
        TEXT name
        TEXT date_of_birth
        TEXT email
        TEXT phone
        TEXT address
        TEXT relationship
        TEXT emergency_contact_name
        TEXT emergency_contact_phone
        TEXT notes
        TEXT created_at
        TEXT updated_at
    }
```

---

## Chat & AI System (Isolated View)

This diagram focuses on the chat, session, and AI persona system:

```mermaid
erDiagram
    sessions ||--o{ messages : "contains"
    sessions ||--o{ conversation_summaries : "summarized by"
    sessions ||--o{ semantic_pins : "has pins"
    sessions }o--|| personas : "uses persona"
    
    sessions {
        TEXT id PK "UUID"
        TEXT name "Session name"
        TEXT model "AI model used"
        TEXT recap "AI summary"
        TEXT persona_id FK "Active persona"
        TEXT session_type "chat or eldercare"
        TEXT patient_id FK "Optional patient context"
        TEXT related_record_id "Related medical record"
        TEXT care_category "Care category"
        INTEGER saved "Bookmarked flag"
        TEXT created_at
        TEXT updated_at
    }
    
    messages {
        INTEGER id PK "Auto-increment"
        TEXT session_id FK "Parent session"
        TEXT role "system user assistant"
        TEXT text "Message content"
        TEXT model_id "Model that generated"
        INTEGER token_usage "Token count"
        REAL importance_score "0.0-1.0 memory score"
        TEXT created_at
    }
    
    personas {
        TEXT id PK "Persona identifier"
        TEXT name "Display name"
        TEXT prompt "System prompt"
        TEXT description "User description"
        TEXT icon "Emoji icon"
        TEXT category "cloud local specialized"
        TEXT default_model "Preferred model"
        TEXT suggested_models "JSON array"
        TEXT eldercare_specialty "Medical specialty"
        REAL temperature "0.0-2.0"
        INTEGER maxTokens "Max response length"
        REAL topP "Nucleus sampling"
        REAL repeatPenalty "1.0+"
        TEXT stopSequences "JSON array"
        INTEGER is_default "Default flag"
        INTEGER patient_context "Patient aware"
        TEXT created_at
        TEXT updated_at
    }
    
    conversation_summaries {
        TEXT id PK
        TEXT session_id FK "Parent session"
        TEXT summary "AI-generated summary"
        INTEGER message_count "Messages summarized"
        TEXT start_message_id "First message"
        TEXT end_message_id "Last message"
        REAL importance_score "Summary importance"
        TEXT created_at
    }
    
    semantic_pins {
        TEXT id PK
        TEXT session_id FK "Parent session"
        TEXT patient_id FK "Related patient"
        TEXT content "Pinned information"
        TEXT source_message_id "Original message"
        TEXT medical_category "Medical classification"
        TEXT urgency_level "normal high critical"
        REAL importance_score "Pin importance"
        TEXT pin_type "user system auto"
        TEXT created_at
    }
```

---

## Eldercare System (Patient-Centric View)

This diagram shows the patient-centric eldercare management system:

```mermaid
erDiagram
    patients ||--o{ medical_records : "has records"
    patients ||--o{ appointments : "has appointments"
    patients ||--o{ medications : "takes medications"
    patients ||--o{ medication_logs : "medication tracking"
    patients ||--o{ vitals : "vital signs"
    patients ||--o{ sessions : "AI sessions"
    patients ||--o{ semantic_pins : "pinned facts"
    
    healthcare_providers ||--o{ appointments : "provides care"
    medications ||--o{ medication_logs : "logged doses"
    
    patients {
        TEXT id PK "Patient UUID"
        TEXT name "Full name"
        TEXT date_of_birth "YYYY-MM-DD"
        TEXT relationship "mother father spouse"
        TEXT gender "male female other"
        TEXT phone "Contact number"
        TEXT emergency_contact_name "Emergency contact"
        TEXT emergency_contact_phone "Emergency phone"
        TEXT primary_doctor "Primary physician"
        TEXT doctor_address "Doctor address"
        TEXT doctor_phone "Doctor phone"
        TEXT insurance_provider "Insurance company"
        TEXT insurance_id "Policy number"
        TEXT notes "Additional notes"
        INTEGER active "Soft delete flag"
        TEXT created_at
        TEXT updated_at
    }
    
    medical_records {
        TEXT id PK
        TEXT patient_id FK "Patient reference"
        TEXT record_type "diagnosis treatment test note"
        TEXT title "Record title"
        TEXT description "Detailed description"
        TEXT date_recorded "Record date"
        TEXT provider_name "Healthcare provider"
        TEXT location "Facility location"
        REAL importance_score "Record importance"
        TEXT tags "JSON tag array"
        TEXT attachments "JSON file paths"
        TEXT created_at
        TEXT updated_at
    }
    
    healthcare_providers {
        TEXT id PK
        TEXT name "Provider name"
        TEXT specialty "Medical specialty"
        TEXT practice_name "Practice name"
        TEXT phone "Contact phone"
        TEXT email "Email address"
        TEXT address "Office address"
        TEXT notes "Provider notes"
        INTEGER preferred "Preferred flag"
        TEXT created_at
        TEXT updated_at
    }
    
    appointments {
        TEXT id PK
        TEXT patient_id FK "Patient reference"
        TEXT provider_id FK "Provider reference"
        TEXT appointment_date "YYYY-MM-DD"
        TEXT appointment_time "HH:MM"
        TEXT appointment_type "routine follow_up emergency"
        TEXT location "Appointment location"
        TEXT notes "Appointment notes"
        TEXT preparation_notes "What to bring prep"
        TEXT status "scheduled completed cancelled"
        TEXT outcome_summary "Post-appointment notes"
        INTEGER follow_up_required "Follow-up flag"
        TEXT created_at
        TEXT updated_at
    }
    
    medications {
        TEXT id PK
        TEXT patient_id FK "Patient reference"
        TEXT name "Medication name"
        TEXT generic_name "Generic name"
        TEXT dosage "Dose amount"
        TEXT frequency "How often"
        TEXT route "oral injection topical"
        TEXT prescribing_doctor "Prescriber"
        TEXT pharmacy "Pharmacy name"
        TEXT rx_number "Prescription number"
        TEXT side_effects "Known side effects"
        TEXT notes "Medication notes"
        INTEGER active "Active flag"
        TEXT created_at
        TEXT updated_at
    }
    
    medication_logs {
        TEXT id PK
        TEXT medication_id FK "Medication reference"
        TEXT patient_id FK "Patient reference"
        TEXT scheduled_time "When to take"
        TEXT actual_time "When taken"
        TEXT status "taken missed late skipped"
        TEXT notes "Log notes"
        INTEGER reminder_sent "Reminder flag"
        TEXT created_at
    }
    
    vitals {
        TEXT id PK
        TEXT patient_id FK "Patient reference"
        REAL weight_kg "Weight in kg"
        INTEGER glucose_am "Morning glucose mg/dL"
        INTEGER glucose_pm "Evening glucose mg/dL"
        TEXT recorded_date "Measurement date"
        TEXT notes "Vital notes"
        INTEGER active "Active flag"
        TEXT created_at
        TEXT updated_at
    }
```

---

## Healthcare Provider Network

This diagram shows the healthcare provider and appointment scheduling system:

```mermaid
erDiagram
    healthcare_providers ||--o{ appointments : "schedules"
    patients ||--o{ appointments : "attends"
    
    healthcare_providers {
        TEXT id PK
        TEXT name "Provider full name"
        TEXT specialty "cardiologist neurologist PCP"
        TEXT practice_name "Medical practice"
        TEXT phone "Office phone"
        TEXT email "Contact email"
        TEXT address "Office address"
        TEXT notes "Provider notes"
        INTEGER preferred "Preferred provider flag"
        TEXT created_at
        TEXT updated_at
    }
    
    appointments {
        TEXT id PK
        TEXT patient_id FK "Patient"
        TEXT provider_id FK "Healthcare provider"
        TEXT appointment_date "YYYY-MM-DD"
        TEXT appointment_time "HH:MM"
        TEXT appointment_type "routine follow_up emergency specialist"
        TEXT location "Office hospital telehealth"
        TEXT notes "Appointment notes"
        TEXT preparation_notes "Prep instructions fasting documents"
        TEXT status "scheduled completed cancelled rescheduled"
        TEXT outcome_summary "Visit summary diagnosis next steps"
        INTEGER follow_up_required "Needs follow-up flag"
        TEXT created_at
        TEXT updated_at
    }
    
    patients {
        TEXT id PK
        TEXT name
        TEXT phone
        TEXT primary_doctor
        TEXT doctor_address
        TEXT doctor_phone
        TEXT insurance_provider
        TEXT insurance_id
        INTEGER active
    }
```

---

## Medication Management System

This diagram focuses on medication tracking and adherence:

```mermaid
erDiagram
    patients ||--o{ medications : "prescribed"
    medications ||--o{ medication_logs : "tracked"
    patients ||--o{ medication_logs : "takes"
    
    patients {
        TEXT id PK
        TEXT name "Patient name"
        TEXT phone "Contact"
        INTEGER active "Active flag"
    }
    
    medications {
        TEXT id PK
        TEXT patient_id FK "Patient"
        TEXT name "Brand name"
        TEXT generic_name "Generic equivalent"
        TEXT dosage "10mg 500mg 5ml"
        TEXT frequency "once daily BID TID PRN"
        TEXT route "oral injection topical sublingual"
        TEXT prescribing_doctor "Prescriber name"
        TEXT pharmacy "Pharmacy name location"
        TEXT rx_number "Prescription number"
        TEXT side_effects "Known side effects warnings"
        TEXT notes "Special instructions"
        INTEGER active "Currently taking"
        TEXT created_at
        TEXT updated_at
    }
    
    medication_logs {
        TEXT id PK
        TEXT medication_id FK "Medication"
        TEXT patient_id FK "Patient"
        TEXT scheduled_time "ISO timestamp scheduled"
        TEXT actual_time "ISO timestamp actual"
        TEXT status "taken missed late skipped"
        TEXT notes "Why missed side effects"
        INTEGER reminder_sent "Reminder notification sent"
        TEXT created_at "Log entry time"
    }
```

---

## Memory & Context System

This diagram shows the AI memory management system:

```mermaid
erDiagram
    sessions ||--o{ messages : "contains"
    sessions ||--o{ conversation_summaries : "compressed to"
    sessions ||--o{ semantic_pins : "important facts"
    patients ||--o{ semantic_pins : "patient facts"
    
    sessions {
        TEXT id PK
        TEXT name "Session name"
        TEXT model "AI model"
        TEXT persona_id FK
        TEXT patient_id FK "Patient context"
        TEXT session_type "chat eldercare"
        TEXT care_category "medication appointment vital"
        INTEGER saved "Bookmarked"
    }
    
    messages {
        INTEGER id PK
        TEXT session_id FK
        TEXT role "system user assistant"
        TEXT text "Message content"
        TEXT model_id "Generator"
        INTEGER token_usage "Tokens used"
        REAL importance_score "0.0-1.0 memory weight"
        TEXT created_at
    }
    
    conversation_summaries {
        TEXT id PK
        TEXT session_id FK
        TEXT summary "AI summary of conversation segment"
        INTEGER message_count "Number of messages compressed"
        TEXT start_message_id "First message in segment"
        TEXT end_message_id "Last message in segment"
        REAL importance_score "Summary importance 0.7 default"
        TEXT created_at "When summarized"
    }
    
    semantic_pins {
        TEXT id PK
        TEXT session_id FK "Source session"
        TEXT patient_id FK "Related patient"
        TEXT content "Pinned fact always remember"
        TEXT source_message_id "Original message"
        TEXT medical_category "allergy medication diagnosis"
        TEXT urgency_level "normal high critical"
        REAL importance_score "0.8 default high priority"
        TEXT pin_type "user system auto"
        TEXT created_at
    }
    
    patients {
        TEXT id PK
        TEXT name
    }
```

---

## Database Indexes Overview

This diagram shows the indexing strategy for query optimization:

```mermaid
graph LR
    subgraph Messages Indexes
        A[idx_messages_session_created]
        A --> A1[session_id, created_at DESC]
        A1 --> A2[Fast conversation history]
    end
    
    subgraph Medical Records Indexes
        B[idx_medical_records_patient_date]
        B --> B1[patient_id, date_recorded DESC]
        B1 --> B2[Patient timeline]
        
        C[idx_medical_records_type_date]
        C --> C1[record_type, date_recorded DESC]
        C1 --> C2[Records by type]
    end
    
    subgraph Appointments Indexes
        D[idx_appointments_patient_date]
        D --> D1[patient_id, appointment_date ASC]
        D1 --> D2[Upcoming appointments]
        
        E[idx_appointments_status_date]
        E --> E1[status, appointment_date ASC]
        E1 --> E2[Scheduled appointments]
    end
    
    subgraph Medications Indexes
        F[idx_medications_patient]
        F --> F1[patient_id]
        F1 --> F2[Patient medications]
        
        G[idx_medications_active]
        G --> G1[active]
        G1 --> G2[Active medications only]
        
        H[idx_medication_logs_patient_scheduled]
        H --> H1[patient_id, scheduled_time DESC]
        H1 --> H2[Medication adherence]
    end
    
    subgraph Sessions Indexes
        I[idx_sessions_patient_type]
        I --> I1[patient_id, session_type, updated_at DESC]
        I1 --> I2[Patient sessions by type]
    end
    
    subgraph Semantic Pins Indexes
        J[idx_semantic_pins_patient_medical]
        J --> J1[patient_id, medical_category, importance_score DESC]
        J1 --> J2[Important patient facts]
    end
    
    subgraph Caregivers Indexes
        K[idx_caregivers_relationship]
        K --> K1[relationship]
        K1 --> K2[Caregivers by relation]
    end
```

---

## Foreign Key Relationships (Cascade Delete)

This diagram shows which deletions cascade to related records:

```mermaid
graph TD
    A[Delete Session] -->|CASCADE| B[Delete All Messages]
    A -->|CASCADE| C[Delete All Summaries]
    A -->|CASCADE| D[Delete All Pins]
    
    E[Delete Patient] -->|CASCADE| F[Delete Medical Records]
    E -->|CASCADE| G[Delete Appointments]
    E -->|CASCADE| H[Delete Medications]
    E -->|CASCADE| I[Delete Medication Logs]
    E -->|CASCADE| J[Delete Vitals]
    
    K[Delete Medication] -->|CASCADE| L[Delete Medication Logs]
    
    M[Delete Healthcare Provider] -.->|NULL| N[Appointments provider_id = NULL]
    
    style A fill:#ff6b6b
    style E fill:#ff6b6b
    style K fill:#ff6b6b
    style M fill:#ffd43b
    
    style B fill:#ffe0e0
    style C fill:#ffe0e0
    style D fill:#ffe0e0
    style F fill:#ffe0e0
    style G fill:#ffe0e0
    style H fill:#ffe0e0
    style I fill:#ffe0e0
    style J fill:#ffe0e0
    style L fill:#ffe0e0
```

**Legend**:
- 🔴 Red = Delete trigger
- 🟡 Yellow = Soft delete (sets to NULL)
- 🟠 Light Red = Cascaded deletions

---

## Data Flow: Patient Care Cycle

This diagram shows how data flows through a typical eldercare workflow:

```mermaid
sequenceDiagram
    participant U as User/Caregiver
    participant S as Sessions/Chat
    participant AI as AI Assistant
    participant P as Patients
    participant M as Medical Records
    participant A as Appointments
    participant Rx as Medications
    participant L as Medication Logs
    
    U->>S: Start eldercare session
    S->>P: Load patient context
    P-->>S: Patient details + history
    S->>M: Fetch recent medical records
    M-->>S: Diagnoses, tests, notes
    S->>A: Check upcoming appointments
    A-->>S: Scheduled appointments
    S->>Rx: Get active medications
    Rx-->>S: Current medication list
    S->>L: Check adherence
    L-->>S: Recent medication logs
    
    S->>AI: Generate context-aware response
    AI-->>S: AI response with patient context
    S->>U: Display comprehensive view
    
    U->>Rx: Log medication taken
    Rx->>L: Create medication log
    L-->>U: Confirm logged
    
    U->>A: Schedule appointment
    A->>P: Link to patient
    A-->>U: Appointment created
    
    U->>M: Add medical note
    M->>P: Link to patient
    M-->>S: Update session context
    S->>AI: Pin important fact
    AI->>S: Create semantic pin
    S-->>U: Fact pinned for future recall
```

---

## Table Size & Complexity Matrix

```mermaid
quadrantChart
    title Database Tables by Complexity & Usage
    x-axis Low Complexity --> High Complexity
    y-axis Low Usage --> High Usage
    quadrant-1 Critical & Complex
    quadrant-2 Heavy Use & Simple
    quadrant-3 Low Priority
    quadrant-4 Reference Data
    
    messages: [0.7, 0.9]
    sessions: [0.5, 0.85]
    semantic_pins: [0.6, 0.7]
    patients: [0.4, 0.8]
    medications: [0.5, 0.75]
    medication_logs: [0.3, 0.7]
    appointments: [0.6, 0.6]
    medical_records: [0.65, 0.5]
    personas: [0.5, 0.4]
    vitals: [0.2, 0.3]
    healthcare_providers: [0.3, 0.25]
    caregivers: [0.25, 0.2]
    conversation_summaries: [0.4, 0.35]
```

---

## Summary Statistics

### Table Count
- **Total Tables**: 13
- **Chat/AI Tables**: 5 (sessions, messages, personas, conversation_summaries, semantic_pins)
- **Eldercare Tables**: 7 (patients, medical_records, appointments, medications, medication_logs, vitals, healthcare_providers)
- **Support Tables**: 1 (caregivers)

### Foreign Keys
- **Total Foreign Keys**: 13
- **Cascade Delete**: 11
- **Set NULL**: 1 (healthcare_providers → appointments)

### Indexes
- **Total Indexes**: 10 (plus auto-created PK indexes)
- **Composite Indexes**: 7
- **Single Column Indexes**: 3

### Key Relationships
1. **Sessions** → Messages (1:N with cascade)
2. **Patients** → Medical Records (1:N with cascade)
3. **Patients** → Appointments (1:N with cascade)
4. **Patients** → Medications (1:N with cascade)
5. **Medications** → Medication Logs (1:N with cascade)
6. **Healthcare Providers** → Appointments (1:N)
7. **Sessions** → Semantic Pins (1:N with cascade)
8. **Patients** → Semantic Pins (1:N)

### Data Integrity Features
- ✅ Foreign key constraints enabled
- ✅ Cascade deletes for related data
- ✅ Soft deletes (active flags)
- ✅ Default values for optional fields
- ✅ Timestamp tracking (created_at, updated_at)
- ✅ Importance scoring for AI memory
