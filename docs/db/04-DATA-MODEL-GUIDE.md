# Luna Data Model Reference Guide

**Last Updated**: November 21, 2025  
**Purpose**: Field-by-field documentation for all database tables  
**Audience**: Developers and AI models

---

## Table of Contents

1. [Mental Health Core Tables](#mental-health-core-tables)
   - [patients](#patients)
   - [medications](#medications)
   - [appointments](#appointments)
   - [journal_entries](#journal_entries)
   - [vitals](#vitals)
2. [AI Conversation Tables](#ai-conversation-tables)
   - [sessions](#sessions)
   - [messages](#messages)
   - [personas](#personas)
3. [Memory System Tables](#memory-system-tables)
   - [conversation_summaries](#conversation_summaries)
   - [semantic_pins](#semantic_pins)

---

## Mental Health Core Tables

### patients

**Purpose**: Central patient profile for mental health tracking

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | TEXT | ✅ | Generated UUID | Primary key, format: `timestamp-randomstring` |
| `name` | TEXT | ✅ | - | Full patient name |
| `date_of_birth` | TEXT | ❌ | NULL | Format: `YYYY-MM-DD` |
| `gender` | TEXT | ❌ | NULL | Patient gender identity |
| `phone` | TEXT | ❌ | NULL | Contact phone number |
| `city` | TEXT | ❌ | NULL | City of residence |
| `state` | TEXT | ❌ | NULL | State/province |
| `occupation` | TEXT | ❌ | NULL | Current occupation |
| `occupation_description` | TEXT | ❌ | NULL | Detailed work description |
| `languages` | TEXT | ❌ | NULL | Languages spoken |
| `notes` | TEXT | ❌ | NULL | General notes, concerns, history |
| `primary_doctor_id` | TEXT | ❌ | NULL | Reference to primary care provider |
| `active` | INTEGER | ❌ | 1 | Soft delete flag (0=inactive, 1=active) |
| `created_at` | TEXT | ❌ | CURRENT_TIMESTAMP | ISO 8601 timestamp |
| `updated_at` | TEXT | ❌ | CURRENT_TIMESTAMP | ISO 8601 timestamp |

**Relationships**:
- ⬅️ Referenced by: medications, appointments, journal_entries, vitals, sessions

**Usage Patterns**:
```typescript
// Create patient
const id = generateId()
db.prepare(`
  INSERT INTO patients (id, name, date_of_birth, city, state)
  VALUES (?, ?, ?, ?, ?)
`).run(id, 'Kaleb', '1986-10-09', '', 'Texas')

// Get patient with age calculation
const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(patientId)
const age = calculateAge(patient.date_of_birth) // Business logic
```

---

### medications

**Purpose**: Track patient prescriptions and medication management

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | TEXT | ✅ | Generated UUID | Primary key |
| `patient_id` | TEXT | ✅ | - | Foreign key → patients.id |
| `name` | TEXT | ✅ | - | Brand name (e.g., "Zyprexa") |
| `generic_name` | TEXT | ❌ | NULL | Generic name (e.g., "Olanzapine") |
| `dosage` | TEXT | ✅ | - | Dosage strength (e.g., "5mg") |
| `frequency` | TEXT | ✅ | - | How often taken (e.g., "once_daily", "twice_daily") |
| `route` | TEXT | ❌ | NULL | Administration route (oral, injection, etc.) |
| `prescribing_doctor` | TEXT | ❌ | NULL | Doctor who prescribed |
| `pharmacy` | TEXT | ❌ | NULL | Pharmacy name and location |
| `rx_number` | TEXT | ❌ | NULL | Prescription number |
| `side_effects` | TEXT | ❌ | NULL | Known or experienced side effects |
| `notes` | TEXT | ❌ | NULL | Additional medication notes |
| `active` | INTEGER | ❌ | 1 | Currently taking (0=discontinued, 1=active) |
| `created_at` | TEXT | ❌ | CURRENT_TIMESTAMP | ISO 8601 timestamp |
| `updated_at` | TEXT | ❌ | CURRENT_TIMESTAMP | ISO 8601 timestamp |

**Foreign Keys**:
- `patient_id` → patients.id (ON DELETE CASCADE)

**Indexes**:
- `idx_medications_patient` - Fast patient medication lookups
- `idx_medications_active` - Filter active medications

**Usage Patterns**:
```typescript
// Get active medications for patient
const meds = db.prepare(`
  SELECT * FROM medications 
  WHERE patient_id = ? AND active = 1
  ORDER BY name ASC
`).all(patientId)

// AI context: Include in conversation context
const contextMeds = meds.map(m => 
  `${m.name} (${m.generic_name || 'generic unknown'}) - ${m.dosage} ${m.frequency}`
).join('\n')
```

---

### appointments

**Purpose**: Healthcare appointment scheduling and tracking

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | TEXT | ✅ | Generated UUID | Primary key |
| `patient_id` | TEXT | ✅ | - | Foreign key → patients.id |
| `appointment_date` | TEXT | ✅ | - | Format: `YYYY-MM-DD` |
| `appointment_time` | TEXT | ❌ | NULL | Format: `HH:MM` (24-hour) |
| `appointment_type` | TEXT | ❌ | NULL | Type (e.g., "therapy", "psychiatry", "primary_care") |
| `location` | TEXT | ❌ | NULL | Clinic/office location |
| `notes` | TEXT | ❌ | NULL | General appointment notes |
| `preparation_notes` | TEXT | ❌ | NULL | What to prepare/discuss |
| `status` | TEXT | ❌ | NULL | Status (scheduled, completed, cancelled, no_show) |
| `outcome_summary` | TEXT | ❌ | NULL | Post-appointment summary |
| `follow_up_required` | INTEGER | ❌ | NULL | Boolean: 1=needs follow-up, 0=no follow-up |
| `provider_name` | TEXT | ❌ | NULL | Healthcare provider name |
| `created_at` | TEXT | ❌ | CURRENT_TIMESTAMP | ISO 8601 timestamp |
| `updated_at` | TEXT | ❌ | CURRENT_TIMESTAMP | ISO 8601 timestamp |

**Foreign Keys**:
- `patient_id` → patients.id (ON DELETE CASCADE)

**Usage Patterns**:
```typescript
// Get upcoming appointments (last 30 days)
const thirtyDaysAgo = new Date()
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

const appointments = db.prepare(`
  SELECT * FROM appointments 
  WHERE patient_id = ? AND appointment_date >= ?
  ORDER BY appointment_date DESC, appointment_time DESC
`).all(patientId, thirtyDaysAgo.toISOString().split('T')[0])
```

---

### journal_entries

**Purpose**: Daily journaling with mood and emotion tracking

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | TEXT | ✅ | Generated UUID | Primary key |
| `patient_id` | TEXT | ✅ | - | Foreign key → patients.id |
| `session_id` | TEXT | ❌ | NULL | Foreign key → sessions.id (AI conversation link) |
| `title` | TEXT | ❌ | NULL | Journal entry title |
| `content` | TEXT | ✅ | - | Journal entry content/body |
| `entry_date` | TEXT | ✅ | - | Format: `YYYY-MM-DD` |
| `entry_time` | TEXT | ❌ | NULL | Format: `HH:MM` |
| `mood` | TEXT | ❌ | NULL | Primary mood (see mood types below) |
| `emotions` | TEXT | ❌ | NULL | JSON array of emotion tags |
| `journal_type` | TEXT | ❌ | 'free' | Type: 'free', 'prompted', 'mood_check' |
| `prompt_used` | TEXT | ❌ | NULL | If prompted, what prompt was used |
| `privacy_level` | TEXT | ❌ | 'private' | 'private' or 'shared_with_therapist' |
| `favorite` | INTEGER | ❌ | 0 | Favorite flag (0=no, 1=yes) |
| `created_at` | TEXT | ❌ | CURRENT_TIMESTAMP | ISO 8601 timestamp |
| `updated_at` | TEXT | ❌ | CURRENT_TIMESTAMP | ISO 8601 timestamp |

**Mood Types** (13 defined moods):
- Positive: `happy`, `excited`, `grateful`, `relaxed`, `content`
- Neutral: `tired`, `unsure`, `bored`
- Negative: `anxious`, `angry`, `stressed`, `sad`, `desperate`

**Emotions** (JSON array):
```json
["happy", "grateful", "relaxed"]
```

**Foreign Keys**:
- `patient_id` → patients.id (ON DELETE CASCADE)
- `session_id` → sessions.id (ON DELETE SET NULL) - Journal persists even if conversation deleted

**Indexes**:
- `idx_journal_entries_patient_date` - Chronological queries
- `idx_journal_entries_mood` - Mood filtering and analysis
- `idx_journal_entries_favorite` - Quick favorite access

**Usage Patterns**:
```typescript
// Create journal entry
db.prepare(`
  INSERT INTO journal_entries (
    id, patient_id, content, entry_date, mood, emotions, journal_type
  ) VALUES (?, ?, ?, ?, ?, ?, ?)
`).run(
  generateId(),
  patientId,
  'Today was a good day...',
  '2025-11-21',
  'relaxed',
  JSON.stringify(['happy', 'content']),
  'free'
)

// AI context: Recent mood trends
const recentEntries = db.prepare(`
  SELECT entry_date, mood, emotions 
  FROM journal_entries 
  WHERE patient_id = ?
  ORDER BY entry_date DESC
  LIMIT 7
`).all(patientId)
```

---

### vitals

**Purpose**: Health metrics tracking (weight, glucose levels)

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | TEXT | ✅ | Generated UUID | Primary key |
| `patient_id` | TEXT | ✅ | - | Foreign key → patients.id |
| `weight_lbs` | REAL | ❌ | NULL | Weight in pounds |
| `glucose_am` | INTEGER | ❌ | NULL | Morning glucose (mg/dL) |
| `glucose_pm` | INTEGER | ❌ | NULL | Evening glucose (mg/dL) |
| `recorded_date` | TEXT | ✅ | - | Format: `YYYY-MM-DD` |
| `notes` | TEXT | ❌ | NULL | Observation notes |
| `active` | INTEGER | ❌ | 1 | Soft delete flag |
| `created_at` | TEXT | ❌ | CURRENT_TIMESTAMP | ISO 8601 timestamp |
| `updated_at` | TEXT | ❌ | CURRENT_TIMESTAMP | ISO 8601 timestamp |

**Foreign Keys**:
- `patient_id` → patients.id (ON DELETE CASCADE)

**Usage Patterns**:
```typescript
// Track vitals over time
const vitals = db.prepare(`
  SELECT * FROM vitals 
  WHERE patient_id = ? AND active = 1
  ORDER BY recorded_date DESC
  LIMIT 30
`).all(patientId)
```

---

## AI Conversation Tables

### sessions

**Purpose**: Manage AI chat conversations with persistence

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | TEXT | ✅ | Generated UUID | Primary key |
| `name` | TEXT | ❌ | NULL | Session name/title |
| `model` | TEXT | ❌ | NULL | AI model used (e.g., "gpt-4.1-nano") |
| `recap` | TEXT | ❌ | NULL | Session summary/recap |
| `persona_id` | TEXT | ❌ | NULL | Foreign key → personas.id (no explicit FK) |
| `session_type` | TEXT | ❌ | 'chat' | Type: 'chat', 'journal_discussion', etc. |
| `patient_id` | TEXT | ❌ | NULL | Patient associated with session |
| `related_record_id` | TEXT | ❌ | NULL | Link to related record (journal, appointment, etc.) |
| `care_category` | TEXT | ❌ | NULL | Care category tag |
| `saved` | INTEGER | ❌ | 0 | Save status (0=transient, 1=persistent) |
| `created_at` | TEXT | ❌ | NULL | ISO 8601 timestamp |
| `updated_at` | TEXT | ❌ | NULL | ISO 8601 timestamp |

**Relationships**:
- ⬅️ Referenced by: messages, conversation_summaries, semantic_pins, journal_entries

**Indexes**:
- `idx_sessions_patient_type` - Patient session queries

**Usage Patterns**:
```typescript
// Create new chat session
const sessionId = generateId()
db.prepare(`
  INSERT INTO sessions (id, name, model, persona_id, saved, created_at, updated_at)
  VALUES (?, ?, ?, ?, 1, ?, ?)
`).run(sessionId, 'New Chat', 'gpt-4.1-nano', 'default-cloud', now, now)

// Get patient sessions
const sessions = db.prepare(`
  SELECT * FROM sessions 
  WHERE patient_id = ? AND saved = 1
  ORDER BY updated_at DESC
`).all(patientId)
```

---

### messages

**Purpose**: Individual conversation messages in AI chats

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | INTEGER | ✅ | AUTOINCREMENT | Primary key |
| `session_id` | TEXT | ✅ | - | Foreign key → sessions.id |
| `role` | TEXT | ❌ | NULL | 'user', 'assistant', or 'system' |
| `text` | TEXT | ❌ | NULL | Message content |
| `model_id` | TEXT | ❌ | NULL | Model that generated response |
| `token_usage` | INTEGER | ❌ | NULL | Token count for message |
| `importance_score` | REAL | ❌ | 0.5 | Importance score (0.0-1.0) for memory system |
| `created_at` | TEXT | ❌ | NULL | ISO 8601 timestamp |

**Foreign Keys**:
- `session_id` → sessions.id (ON DELETE CASCADE)

**Indexes**:
- `idx_messages_session_created` - Fast reverse chronological retrieval

**Usage Patterns**:
```typescript
// Save user message
db.prepare(`
  INSERT INTO messages (session_id, role, text, created_at)
  VALUES (?, 'user', ?, ?)
`).run(sessionId, userInput, new Date().toISOString())

// Get recent conversation history
const history = db.prepare(`
  SELECT role, text FROM messages
  WHERE session_id = ?
  ORDER BY created_at DESC
  LIMIT 10
`).all(sessionId).reverse() // Oldest to newest
```

---

### personas

**Purpose**: AI personality configurations and behavior

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | TEXT | ✅ | - | Primary key |
| `name` | TEXT | ✅ | - | Persona display name |
| `prompt` | TEXT | ✅ | - | System prompt for AI behavior |
| `description` | TEXT | ❌ | NULL | User-facing description |
| `icon` | TEXT | ❌ | NULL | Emoji or icon identifier |
| `category` | TEXT | ❌ | NULL | Category: 'cloud', 'local', 'custom' |
| `default_model` | TEXT | ❌ | NULL | Preferred AI model |
| `suggested_models` | TEXT | ❌ | NULL | Comma-separated model suggestions |
| `temperature` | REAL | ❌ | NULL | AI temperature (0.0-2.0) |
| `maxTokens` | INTEGER | ❌ | NULL | Max output tokens |
| `topP` | REAL | ❌ | NULL | Nucleus sampling parameter |
| `repeatPenalty` | REAL | ❌ | NULL | Repetition penalty |
| `stopSequences` | TEXT | ❌ | NULL | Stop sequences for generation |
| `is_default` | INTEGER | ❌ | 0 | Default persona flag (1=yes) |
| `created_at` | TEXT | ❌ | CURRENT_TIMESTAMP | ISO 8601 timestamp |
| `updated_at` | TEXT | ❌ | CURRENT_TIMESTAMP | ISO 8601 timestamp |

**Default Personas**:
1. **default-cloud** - Cloud-based general assistant
2. **default-local** - Privacy-focused local assistant

**Usage Patterns**:
```typescript
// Get persona for session
const persona = db.prepare(`
  SELECT * FROM personas WHERE id = ?
`).get(personaId)

// Apply persona settings to AI request
const settings = {
  temperature: persona.temperature || 0.7,
  maxTokens: persona.maxTokens || 1500,
  topP: persona.topP || 0.9
}
```

---

## Memory System Tables

### conversation_summaries

**Purpose**: Compressed conversation history for context management

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | TEXT | ✅ | Generated UUID | Primary key |
| `session_id` | TEXT | ✅ | - | Foreign key → sessions.id |
| `summary` | TEXT | ✅ | - | Condensed summary of conversation segment |
| `message_count` | INTEGER | ✅ | - | Number of messages summarized |
| `start_message_id` | TEXT | ❌ | NULL | First message ID in summary |
| `end_message_id` | TEXT | ❌ | NULL | Last message ID in summary |
| `importance_score` | REAL | ❌ | 0.7 | Importance score (0.0-1.0) |
| `created_at` | TEXT | ❌ | CURRENT_TIMESTAMP | ISO 8601 timestamp |

**Foreign Keys**:
- `session_id` → sessions.id (ON DELETE CASCADE)

**Usage Patterns**:
```typescript
// Auto-summarize after 8 messages
if (messageCount >= 8) {
  const summaryText = await generateSummary(recentMessages)
  db.prepare(`
    INSERT INTO conversation_summaries 
    (id, session_id, summary, message_count, start_message_id, end_message_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(generateId(), sessionId, summaryText, messageCount, firstId, lastId)
}

// Include in context building
const summaries = db.prepare(`
  SELECT summary FROM conversation_summaries
  WHERE session_id = ?
  ORDER BY created_at DESC
  LIMIT 3
`).all(sessionId)
```

---

### semantic_pins

**Purpose**: Extract and store important information from conversations

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | TEXT | ✅ | Generated UUID | Primary key |
| `session_id` | TEXT | ✅ | - | Foreign key → sessions.id |
| `patient_id` | TEXT | ❌ | NULL | Associated patient (extended field) |
| `content` | TEXT | ✅ | - | Pinned information/fact |
| `source_message_id` | TEXT | ❌ | NULL | Message ID where pin originated |
| `medical_category` | TEXT | ❌ | NULL | Medical category tag (extended field) |
| `urgency_level` | TEXT | ❌ | 'normal' | Urgency: 'low', 'normal', 'high', 'urgent' |
| `importance_score` | REAL | ❌ | 0.8 | Importance score (0.0-1.0) |
| `pin_type` | TEXT | ❌ | 'user' | Type: 'user', 'auto', 'code', 'concept', 'system' |
| `created_at` | TEXT | ❌ | CURRENT_TIMESTAMP | ISO 8601 timestamp |

**Foreign Keys**:
- `session_id` → sessions.id (ON DELETE CASCADE)

**Indexes**:
- `idx_semantic_pins_patient_medical` - Medical context queries

**Usage Patterns**:
```typescript
// Auto-extract key information
const keyFacts = await extractSemanticPins(conversationText)
keyFacts.forEach(fact => {
  db.prepare(`
    INSERT INTO semantic_pins 
    (id, session_id, content, importance_score, pin_type)
    VALUES (?, ?, ?, ?, 'auto')
  `).run(generateId(), sessionId, fact.content, fact.score)
})

// Retrieve high-importance pins for context
const pins = db.prepare(`
  SELECT content FROM semantic_pins
  WHERE session_id = ? AND importance_score > 0.7
  ORDER BY importance_score DESC
  LIMIT 5
`).all(sessionId)
```

---

## Common Query Patterns

### Patient Context Building (AI)
```typescript
// Full context for AI conversation
const context = {
  patient: db.prepare('SELECT * FROM patients WHERE id = ?').get(patientId),
  
  medications: db.prepare(`
    SELECT * FROM medications 
    WHERE patient_id = ? AND active = 1
  `).all(patientId),
  
  recentAppointments: db.prepare(`
    SELECT * FROM appointments 
    WHERE patient_id = ? AND appointment_date >= ?
    ORDER BY appointment_date DESC
  `).all(patientId, thirtyDaysAgo),
  
  journalEntries: db.prepare(`
    SELECT * FROM journal_entries
    WHERE patient_id = ?
    ORDER BY entry_date DESC
    LIMIT 10
  `).all(patientId)
}
```

### Conversation Memory Building
```typescript
// Hybrid memory context (used by MemoryManager)
const memoryContext = {
  recentMessages: db.prepare(`
    SELECT * FROM messages
    WHERE session_id = ?
    ORDER BY created_at DESC
    LIMIT 8
  `).all(sessionId).reverse(),
  
  summaries: db.prepare(`
    SELECT summary FROM conversation_summaries
    WHERE session_id = ?
    ORDER BY created_at DESC
    LIMIT 3
  `).all(sessionId),
  
  semanticPins: db.prepare(`
    SELECT content FROM semantic_pins
    WHERE session_id = ? AND importance_score > 0.7
    ORDER BY importance_score DESC
    LIMIT 5
  `).all(sessionId)
}
```

---

## Data Types Reference

### SQLite Type Mapping

| SQLite Type | TypeScript Type | Example Values |
|-------------|-----------------|----------------|
| TEXT | string | 'Kaleb', '2025-11-21', 'active' |
| INTEGER | number | 1, 0, 300, 25 |
| REAL | number | 0.5, 180.5, 98.6 |

### Common Formats

| Field Type | Format | Example |
|------------|--------|---------|
| Date | YYYY-MM-DD | '2025-11-21' |
| Time | HH:MM | '14:30' |
| Timestamp | ISO 8601 | '2025-11-21T14:30:00.000Z' |
| UUID | timestamp-random | '1762885449885-vyuzo96qop9' |
| Boolean | INTEGER | 0 (false), 1 (true) |
| JSON Array | TEXT | '["happy","content"]' |

---

**This completes the data model documentation. All 10 tables are now fully documented with field-by-field details, usage patterns, and relationships.**
