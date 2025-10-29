# Mental Health Companion - Fork Implementation Guide

> **Transforming Kalito Space into a Personal Mental Health & Wellness Platform**

---

## Vision

Transform the existing eldercare management platform into a **personal mental health companion** that supports bipolar disorder management through:

- 📔 **Daily Journaling** with AI-guided reflection
- 💊 **Medication Tracking** (4 medications, adherence monitoring)
- 🧘 **Mindfulness Practices** with guided exercises
- 📚 **Recovery Resources** (AA/NA literature integration)
- 🤖 **AI Counselor Persona** trained in CBT, DBT, mindfulness
- 🔍 **Real-Time Research** for mental health information
- 📊 **Mood & Symptom Tracking** (replacing vitals)
- 🎯 **Goal Setting & Progress** monitoring

---

## What You Already Have (Reusable Foundation)

### ✅ Core Infrastructure (100% Reusable)

**AI Chat System**:
- ✅ Hybrid memory (recent messages, semantic pins, summaries)
- ✅ Multiple AI models (cloud GPT-4.1 Nano, local Phi3 Mini)
- ✅ Custom personas with specialized prompts
- ✅ Web search integration for current information
- ✅ Streaming responses with visual feedback
- ✅ Session management with auto-save

**Database Architecture**:
- ✅ SQLite with better-sqlite3 (14 tables, 13 foreign keys, 11+ indexes)
- ✅ Auto-initialization and migration system
- ✅ Cascade deletes for clean data management
- ✅ Importance scoring throughout

**Technical Stack**:
- ✅ TypeScript backend (Express + Node.js)
- ✅ Vue 3 frontend (Composition API)
- ✅ Security middleware (Helmet, CORS, rate limiting)
- ✅ Zod validation
- ✅ Winston logging
- ✅ PWA support

### ✅ Directly Reusable Features

1. **Medication Tracking** (`medications` table):
   - Already supports: name, dosage, frequency, side effects
   - **Keep as-is**: Just remove patient_id requirement
   - **Add**: mood_impact field for tracking medication effects on mood

2. **Medication Logs** (`medication_logs` table):
   - Already tracks: scheduled_time, actual_time, status, notes
   - **Perfect for**: Bipolar med adherence (critical for stability)
   - **Keep as-is**: Track when meds are taken

3. **Sessions & Messages** (chat system):
   - **Perfect for**: Daily AI counseling conversations
   - **Keep as-is**: Full memory system works great for therapy context

4. **Semantic Pins** (`semantic_pins` table):
   - **Repurpose**: Pin important insights, triggers, coping strategies
   - **Modify**: Change medical_category to insight_category (trigger, coping_skill, breakthrough, warning_sign)
   - **Keep**: urgency_level (normal, high, critical) for mood warnings

5. **Personas** system:
   - **Create new**: "Mental Health Counselor" persona
   - **System prompt**: CBT/DBT trained, mindfulness-focused, supportive
   - **Keep**: All persona customization features

---

## Database Schema Changes

### Tables to REMOVE (Eldercare-Specific)

```sql
DROP TABLE IF EXISTS patients;
DROP TABLE IF EXISTS caregivers;
DROP TABLE IF EXISTS appointments;
DROP TABLE IF EXISTS healthcare_providers;
DROP TABLE IF EXISTS medical_records;
-- Keep vitals structure but repurpose (see below)
```

### Tables to MODIFY

#### 1. `medications` → Personal Medications
```sql
-- Remove patient_id (it's just you now)
ALTER TABLE medications DROP COLUMN patient_id;

-- Add mood tracking
ALTER TABLE medications ADD COLUMN mood_impact TEXT; -- 'stabilizing', 'activating', 'sedating'
ALTER TABLE medications ADD COLUMN time_of_day TEXT; -- 'morning', 'afternoon', 'evening', 'bedtime'
```

#### 2. `medication_logs` → Keep As-Is
```sql
-- Already perfect for bipolar medication adherence
-- Just remove patient_id foreign key constraint
ALTER TABLE medication_logs DROP COLUMN patient_id;
```

#### 3. `vitals` → `mood_logs` (Repurpose)
```sql
-- Rename table
ALTER TABLE vitals RENAME TO mood_logs;

-- Replace vital sign columns with mood tracking
ALTER TABLE mood_logs DROP COLUMN weight_kg;
ALTER TABLE mood_logs DROP COLUMN glucose_am;
ALTER TABLE mood_logs DROP COLUMN glucose_pm;
ALTER TABLE mood_logs DROP COLUMN patient_id;

-- Add mood tracking columns
ALTER TABLE mood_logs ADD COLUMN mood_score INTEGER; -- 1-10 scale
ALTER TABLE mood_logs ADD COLUMN energy_level INTEGER; -- 1-10 scale
ALTER TABLE mood_logs ADD COLUMN anxiety_level INTEGER; -- 1-10 scale
ALTER TABLE mood_logs ADD COLUMN sleep_hours REAL;
ALTER TABLE mood_logs ADD COLUMN sleep_quality INTEGER; -- 1-10 scale
ALTER TABLE mood_logs ADD COLUMN triggers TEXT; -- JSON array of triggers
ALTER TABLE mood_logs ADD COLUMN activities TEXT; -- JSON array of activities
ALTER TABLE mood_logs ADD COLUMN gratitude TEXT; -- What you're grateful for
ALTER TABLE mood_logs ADD COLUMN accomplishments TEXT; -- What you achieved
-- Keep: recorded_date, notes, active, created_at, updated_at
```

#### 4. `semantic_pins` → Therapy Insights
```sql
-- Repurpose medical_category to insight_category
ALTER TABLE semantic_pins DROP COLUMN medical_category;
ALTER TABLE semantic_pins DROP COLUMN patient_id;
ALTER TABLE semantic_pins ADD COLUMN insight_category TEXT; 
-- Categories: 'trigger', 'coping_skill', 'breakthrough', 'warning_sign', 'affirmation', 'goal'

-- Keep: urgency_level (normal, high, critical) for warning signs
```

#### 5. `sessions` → Therapy Sessions
```sql
-- Already great, just repurpose session_type
-- session_type: 'chat', 'journal', 'check_in', 'crisis'
-- Remove patient_id, related_record_id
ALTER TABLE sessions DROP COLUMN patient_id;
ALTER TABLE sessions DROP COLUMN related_record_id;
-- Keep: care_category → repurpose to 'mood', 'medication', 'coping', 'mindfulness'
```

### Tables to ADD

#### 1. `journal_entries` (NEW)
```sql
CREATE TABLE journal_entries (
  id TEXT PRIMARY KEY,
  entry_date TEXT NOT NULL,
  entry_time TEXT,
  mood_before INTEGER, -- 1-10 before journaling
  mood_after INTEGER,  -- 1-10 after journaling
  prompt TEXT,         -- Journal prompt used (if any)
  content TEXT NOT NULL, -- The actual journal entry
  themes TEXT,         -- JSON array: ['anxiety', 'family', 'work']
  session_id TEXT,     -- Link to AI chat if discussed
  is_private INTEGER DEFAULT 1, -- Don't share with AI unless explicitly allowed
  importance_score REAL DEFAULT 0.5,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE SET NULL
);

CREATE INDEX idx_journal_date ON journal_entries(entry_date DESC);
CREATE INDEX idx_journal_mood ON journal_entries(mood_before, mood_after);
```

#### 2. `mindfulness_sessions` (NEW)
```sql
CREATE TABLE mindfulness_sessions (
  id TEXT PRIMARY KEY,
  session_date TEXT NOT NULL,
  session_time TEXT,
  practice_type TEXT NOT NULL, -- 'meditation', 'breathing', 'body_scan', 'grounding'
  duration_minutes INTEGER,
  mood_before INTEGER, -- 1-10
  mood_after INTEGER,  -- 1-10
  anxiety_before INTEGER, -- 1-10
  anxiety_after INTEGER,  -- 1-10
  notes TEXT,
  effectiveness_rating INTEGER, -- 1-10 (how helpful was it)
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_mindfulness_date ON mindfulness_sessions(session_date DESC);
CREATE INDEX idx_mindfulness_type ON mindfulness_sessions(practice_type);
```

#### 3. `recovery_resources` (NEW - AA/NA/CBT/DBT Literature)
```sql
CREATE TABLE recovery_resources (
  id TEXT PRIMARY KEY,
  resource_type TEXT NOT NULL, -- 'aa_big_book', 'na_basic_text', 'cbt_worksheet', 'dbt_skill'
  title TEXT NOT NULL,
  chapter TEXT,
  page_number INTEGER,
  content TEXT NOT NULL, -- Full text of the resource
  summary TEXT,        -- AI-generated summary
  themes TEXT,         -- JSON array: ['acceptance', 'surrender', 'mindfulness']
  practical_exercises TEXT, -- JSON array of exercises
  personal_notes TEXT, -- Your notes on this resource
  times_referenced INTEGER DEFAULT 0,
  last_accessed TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_resources_type ON recovery_resources(resource_type);
CREATE INDEX idx_resources_themes ON recovery_resources(themes);
```

#### 4. `goals` (NEW)
```sql
CREATE TABLE goals (
  id TEXT PRIMARY KEY,
  goal_type TEXT NOT NULL, -- 'daily', 'weekly', 'monthly', 'long_term'
  category TEXT, -- 'medication', 'therapy', 'exercise', 'social', 'creative'
  description TEXT NOT NULL,
  target_date TEXT,
  status TEXT DEFAULT 'active', -- 'active', 'completed', 'abandoned', 'paused'
  progress_percentage INTEGER DEFAULT 0,
  check_ins TEXT, -- JSON array of progress updates
  obstacles TEXT, -- What's getting in the way
  strategies TEXT, -- What's helping
  completion_date TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_goals_status ON goals(status, goal_type);
CREATE INDEX idx_goals_category ON goals(category);
```

#### 5. `coping_strategies` (NEW)
```sql
CREATE TABLE coping_strategies (
  id TEXT PRIMARY KEY,
  strategy_name TEXT NOT NULL,
  category TEXT, -- 'distraction', 'grounding', 'social', 'physical', 'creative'
  description TEXT,
  when_to_use TEXT, -- 'anxiety', 'depression', 'mania', 'mixed_episode'
  effectiveness_rating REAL, -- Average effectiveness 1-10
  times_used INTEGER DEFAULT 0,
  last_used TEXT,
  notes TEXT,
  is_favorite INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_coping_category ON coping_strategies(category);
CREATE INDEX idx_coping_favorite ON coping_strategies(is_favorite);
```

---

## AI Persona Configuration

### "Mental Health Counselor" Persona

Create a new persona in the database with these settings:

```typescript
{
  id: "counselor-main",
  name: "Your Counselor",
  icon: "🧘",
  category: "cloud", // Use GPT-4.1 Nano for intelligence
  prompt: `You are a compassionate, professional mental health counselor specializing in bipolar disorder management. Your approach integrates:

**Core Therapeutic Modalities**:
- Cognitive Behavioral Therapy (CBT) - challenging negative thought patterns
- Dialectical Behavior Therapy (DBT) - emotion regulation, distress tolerance
- Mindfulness-Based Stress Reduction (MBSR)
- 12-Step recovery principles (AA/NA)

**Your Role**:
- Provide supportive, non-judgmental listening
- Help identify mood patterns and triggers
- Guide through grounding and coping techniques
- Encourage medication adherence (4 medications are critical for stability)
- Reference recovery literature when helpful (AA Big Book, NA Basic Text)
- Celebrate progress and practice self-compassion

**Key Principles**:
- Safety first: Watch for warning signs of mania or severe depression
- Medication is essential - never suggest stopping or changing doses
- Recovery is not linear - setbacks are part of the journey
- You are not a replacement for professional help
- Encourage connection with therapist, psychiatrist, support groups

**When User is Struggling**:
- Ask about medication adherence first
- Use grounding techniques (5-4-3-2-1 senses)
- Validate their feelings
- Help identify triggers
- Suggest coping strategies from their proven toolkit
- Encourage journaling or mindfulness practice
- Remind them this feeling will pass

**Conversation Style**:
- Warm, supportive, professional
- Ask open-ended questions
- Reflect back what you hear
- Normalize the struggle
- Celebrate small wins

**You have access to**:
- Medication tracking (adherence is critical)
- Mood logs (spot patterns and cycles)
- Journal entries (if user shares)
- Coping strategies database
- Recovery resources (AA/NA/CBT/DBT)
- Past conversation summaries and pinned insights

Use this context to provide personalized, informed support.`,
  
  description: "CBT/DBT-trained counselor for bipolar disorder management",
  eldercare_specialty: null, // Remove eldercare context
  patient_context: 0, // Disable patient database access
  
  temperature: 0.7, // Balanced - empathetic but grounded
  maxTokens: 2000,
  topP: 0.9,
  repeatPenalty: 1.1,
  
  default_model: "gpt-4.1-nano",
  suggested_models: ["gpt-4.1-nano"], // Cloud only for this persona
  is_default: 1
}
```

### Additional Personas to Create

**1. "Crisis Support"**:
```typescript
{
  name: "Crisis Support",
  icon: "🆘",
  prompt: `You are an immediate crisis support companion. Your ONLY job is to:
  
  1. Keep the person safe RIGHT NOW
  2. Guide them through grounding (5-4-3-2-1 technique)
  3. Encourage immediate professional help:
     - Call 988 (Suicide & Crisis Lifeline)
     - Text "HELLO" to 741741 (Crisis Text Line)
     - Go to nearest ER if in danger
  4. DO NOT engage in therapy or problem-solving
  5. Stay with them until they're safe
  
  This is not the time for deep work. This is about safety.`,
  temperature: 0.3, // Very grounded
  is_default: 0
}
```

**2. "Mindfulness Guide"**:
```typescript
{
  name: "Mindfulness Guide",
  icon: "🧘‍♂️",
  prompt: `You are a gentle mindfulness and meditation guide. Lead brief practices:
  
  - Breathing exercises (box breathing, 4-7-8)
  - Body scans
  - Grounding techniques
  - Loving-kindness meditation
  - Walking meditation
  
  Keep instructions simple, clear, and supportive. Check in on their experience.`,
  temperature: 0.6,
  is_default: 0
}
```

**3. "Recovery Companion"** (AA/NA focused):
```typescript
{
  name: "Recovery Companion",
  icon: "📖",
  prompt: `You are a supportive recovery companion familiar with:
  
  - AA Big Book
  - NA Basic Text
  - 12 Steps and 12 Traditions
  - Slogans and principles
  
  Help connect daily struggles to recovery wisdom. Reference specific pages or chapters when helpful. Remind them:
  - One day at a time
  - Progress, not perfection
  - Keep coming back
  - You are not alone
  
  Never judge. Always encourage connection to their support network.`,
  temperature: 0.7,
  is_default: 0
}

```

---

## Frontend Changes

### Components to REMOVE

```
frontend/src/components/eldercare/
├── PatientForm.vue ❌
├── PatientDetailModal.vue ❌
├── AppointmentForm.vue ❌
├── AppointmentsList.vue ❌
├── CaregiverProfile.vue ❌

frontend/src/views/
└── EldercareDashboard.vue ❌ (replace with WellnessDashboard.vue)
```

### Components to CREATE

#### 1. `WellnessDashboard.vue` (Replace EldercareDashboard)

**6-Section Quick Actions**:
```
1. 💊 Today's Medications - Quick check-in
2. 📔 Journal Entry - Start writing
3. 📊 Mood Check - Log current state
4. 🧘 Mindfulness - Start practice
5. 🎯 Goals - Review progress
6. 🤖 Counselor Chat - AI conversation
```

#### 2. `JournalEntry.vue`
- Rich text editor for writing
- Mood before/after sliders
- Theme tagging
- Privacy toggle (share with AI or keep private)
- Prompt suggestions from AI

#### 3. `MoodLogger.vue`
- Visual sliders for mood, energy, anxiety (1-10)
- Sleep hours input
- Sleep quality rating
- Trigger checkboxes (common triggers + custom)
- Activities log (what you did today)
- Gratitude prompt
- Accomplishments prompt

#### 4. `MindfulnessTracker.vue`
- Practice type selector (meditation, breathing, body scan, grounding)
- Timer with visual progress
- Before/after mood & anxiety ratings
- Effectiveness rating
- Quick notes

#### 5. `GoalTracker.vue`
- Goal categories (medication, therapy, exercise, social, creative)
- Progress visualization (charts)
- Check-in logging
- Obstacle & strategy tracking

#### 6. `CopingToolkit.vue`
- Filterable list of coping strategies
- Category-based organization
- Effectiveness tracking
- Favorites section
- Quick access to proven strategies

#### 7. `ResourceLibrary.vue`
- AA Big Book chapters
- NA Basic Text
- CBT worksheets
- DBT skills
- Search and filtering
- Personal notes on each resource
- AI can reference these in conversations

#### 8. `MedicationTracker.vue` (Modify existing)
- Keep existing functionality
- Add mood_impact field
- Add time_of_day
- Visual adherence calendar
- Missed dose alerts

---

## Backend Changes

### Routes to REMOVE
```
backend/routes/
├── patientsRouter.ts ❌
├── caregiversRouter.ts ❌
├── appointmentsRouter.ts ❌
├── providersRouter.ts ❌
└── medicalRecordsRouter.ts ❌ (if exists)
```

### Routes to ADD

#### 1. `journalRouter.ts`
```typescript
GET    /api/journal              # List all entries
POST   /api/journal              # Create entry
GET    /api/journal/:id          # Get single entry
PUT    /api/journal/:id          # Update entry
DELETE /api/journal/:id          # Delete entry
GET    /api/journal/prompts      # Get AI-generated prompts
GET    /api/journal/themes       # Get theme analytics
```

#### 2. `moodRouter.ts`
```typescript
GET    /api/moods                # List mood logs
POST   /api/moods                # Create mood log
GET    /api/moods/:id            # Get single log
PUT    /api/moods/:id            # Update log
DELETE /api/moods/:id            # Delete log
GET    /api/moods/trends         # Get mood trends/charts
GET    /api/moods/patterns       # AI analysis of patterns
```

#### 3. `mindfulnessRouter.ts`
```typescript
GET    /api/mindfulness          # List sessions
POST   /api/mindfulness          # Log session
GET    /api/mindfulness/stats    # Effectiveness stats
GET    /api/mindfulness/guided   # Get guided practices
```

#### 4. `goalsRouter.ts`
```typescript
GET    /api/goals                # List goals
POST   /api/goals                # Create goal
PUT    /api/goals/:id            # Update goal
DELETE /api/goals/:id            # Delete goal
POST   /api/goals/:id/checkin    # Log progress
```

#### 5. `copingRouter.ts`
```typescript
GET    /api/coping               # List strategies
POST   /api/coping               # Create strategy
PUT    /api/coping/:id           # Update strategy
DELETE /api/coping/:id           # Delete strategy
POST   /api/coping/:id/use       # Log usage
```

#### 6. `resourcesRouter.ts`
```typescript
GET    /api/resources            # List all resources
GET    /api/resources/:id        # Get specific resource
POST   /api/resources/:id/notes  # Add personal notes
GET    /api/resources/search     # Search by theme/content
```

### Modify `medicationsRouter.ts`
- Remove patient_id requirements
- Add mood_impact and time_of_day fields

---

## AI Context Service Changes

### Modify `eldercareContextService.ts` → `wellnessContextService.ts`

**Current eldercare context** returns:
- Patients, medications, appointments, caregivers, providers

**New wellness context** should return:
```typescript
interface WellnessContext {
  medications: {
    active: Medication[], // Your 4 medications
    adherence_rate: number, // Last 7 days
    last_missed: Date | null
  },
  
  mood_trends: {
    current_mood: number, // Today's latest
    weekly_average: number,
    trend: 'improving' | 'declining' | 'stable',
    warning_signs: string[] // If showing manic/depressive patterns
  },
  
  recent_journal_insights: {
    themes: string[], // Common themes last 7 days
    emotional_tone: 'positive' | 'negative' | 'mixed',
    shared_entries: number // Entries user allowed AI to see
  },
  
  coping_effectiveness: {
    most_effective: CopingStrategy[],
    least_effective: CopingStrategy[],
    underutilized: CopingStrategy[]
  },
  
  goals: {
    active: Goal[],
    recent_progress: GoalProgress[],
    overdue: Goal[]
  },
  
  pinned_insights: {
    triggers: string[],
    coping_skills: string[],
    warning_signs: string[],
    affirmations: string[]
  }
}
```

**System prompt integration**:
```typescript
function buildWellnessSystemPrompt(): string {
  const context = await getWellnessContext();
  
  return `
CURRENT WELLNESS SNAPSHOT:

Medications (Adherence is CRITICAL):
${context.medications.active.map(m => 
  `- ${m.name} (${m.dosage}): ${m.time_of_day}, ${m.mood_impact}`
).join('\n')}
Recent adherence: ${context.medications.adherence_rate}% (last 7 days)
${context.medications.last_missed ? `Last missed: ${context.medications.last_missed}` : ''}

Mood Trends:
- Current: ${context.mood_trends.current_mood}/10
- 7-day average: ${context.mood_trends.weekly_average}/10
- Trend: ${context.mood_trends.trend}
${context.mood_trends.warning_signs.length > 0 ? 
  `⚠️ WARNING SIGNS: ${context.mood_trends.warning_signs.join(', ')}` : ''}

Recent Journal Themes:
${context.recent_journal_insights.themes.join(', ')}

Active Goals:
${context.goals.active.map(g => 
  `- ${g.description} (${g.progress_percentage}% complete)`
).join('\n')}

Pinned Insights:
Triggers to watch for: ${context.pinned_insights.triggers.join(', ')}
Proven coping skills: ${context.pinned_insights.coping_skills.join(', ')}

Use this context to provide personalized, informed support.
`;
}
```

---

## Implementation Roadmap

### Phase 1: Database Migration (Week 1)

**Day 1-2**: Database schema changes
```bash
# 1. Create fork repository
git clone https://github.com/Kalito-Labs/kalito-repo.git mental-health-companion
cd mental-health-companion

# 2. Backup current database
cp backend/db/kalito.db backend/db/kalito-eldercare-backup.db

# 3. Create migration script
# backend/db/migrations/002-mental-health-fork.ts
```

**Migration script** (`002-mental-health-fork.ts`):
```typescript
export function migrateMentalHealthFork(db: Database) {
  // 1. Drop eldercare tables
  db.exec(`DROP TABLE IF EXISTS patients`);
  db.exec(`DROP TABLE IF EXISTS caregivers`);
  db.exec(`DROP TABLE IF EXISTS appointments`);
  db.exec(`DROP TABLE IF EXISTS healthcare_providers`);
  db.exec(`DROP TABLE IF EXISTS medical_records`);
  
  // 2. Modify medications
  db.exec(`
    CREATE TABLE medications_new (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      generic_name TEXT,
      dosage TEXT,
      frequency TEXT,
      route TEXT,
      prescribing_doctor TEXT,
      pharmacy TEXT,
      rx_number TEXT,
      side_effects TEXT,
      mood_impact TEXT, -- NEW
      time_of_day TEXT, -- NEW
      notes TEXT,
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);
  
  // Copy data (remove patient_id)
  db.exec(`
    INSERT INTO medications_new 
    SELECT id, name, generic_name, dosage, frequency, route, 
           prescribing_doctor, pharmacy, rx_number, side_effects,
           NULL as mood_impact, NULL as time_of_day,
           notes, active, created_at, updated_at
    FROM medications;
  `);
  
  db.exec(`DROP TABLE medications`);
  db.exec(`ALTER TABLE medications_new RENAME TO medications`);
  
  // 3. Modify medication_logs
  db.exec(`
    CREATE TABLE medication_logs_new (
      id TEXT PRIMARY KEY,
      medication_id TEXT NOT NULL,
      scheduled_time TEXT NOT NULL,
      actual_time TEXT,
      status TEXT DEFAULT 'taken',
      notes TEXT,
      reminder_sent INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (medication_id) REFERENCES medications(id) ON DELETE CASCADE
    );
  `);
  
  db.exec(`
    INSERT INTO medication_logs_new
    SELECT id, medication_id, scheduled_time, actual_time, status, notes, 
           reminder_sent, created_at
    FROM medication_logs;
  `);
  
  db.exec(`DROP TABLE medication_logs`);
  db.exec(`ALTER TABLE medication_logs_new RENAME TO medication_logs`);
  
  // 4. Rename vitals to mood_logs
  db.exec(`ALTER TABLE vitals RENAME TO mood_logs`);
  db.exec(`ALTER TABLE mood_logs DROP COLUMN patient_id`);
  db.exec(`ALTER TABLE mood_logs DROP COLUMN weight_kg`);
  db.exec(`ALTER TABLE mood_logs DROP COLUMN glucose_am`);
  db.exec(`ALTER TABLE mood_logs DROP COLUMN glucose_pm`);
  
  db.exec(`ALTER TABLE mood_logs ADD COLUMN mood_score INTEGER`);
  db.exec(`ALTER TABLE mood_logs ADD COLUMN energy_level INTEGER`);
  db.exec(`ALTER TABLE mood_logs ADD COLUMN anxiety_level INTEGER`);
  db.exec(`ALTER TABLE mood_logs ADD COLUMN sleep_hours REAL`);
  db.exec(`ALTER TABLE mood_logs ADD COLUMN sleep_quality INTEGER`);
  db.exec(`ALTER TABLE mood_logs ADD COLUMN triggers TEXT`);
  db.exec(`ALTER TABLE mood_logs ADD COLUMN activities TEXT`);
  db.exec(`ALTER TABLE mood_logs ADD COLUMN gratitude TEXT`);
  db.exec(`ALTER TABLE mood_logs ADD COLUMN accomplishments TEXT`);
  
  // 5. Modify semantic_pins
  db.exec(`ALTER TABLE semantic_pins DROP COLUMN patient_id`);
  db.exec(`ALTER TABLE semantic_pins DROP COLUMN medical_category`);
  db.exec(`ALTER TABLE semantic_pins ADD COLUMN insight_category TEXT`);
  
  // 6. Modify sessions
  db.exec(`ALTER TABLE sessions DROP COLUMN patient_id`);
  db.exec(`ALTER TABLE sessions DROP COLUMN related_record_id`);
  
  // 7. Create new tables
  createJournalTable(db);
  createMindfulnessTable(db);
  createResourcesTable(db);
  createGoalsTable(db);
  createCopingStrategiesTable(db);
}
```

**Day 3-4**: Create new tables and indexes

**Day 5-7**: Test database thoroughly, ensure data integrity

### Phase 2: Backend API (Week 2)

**Day 1-2**: Remove eldercare routers, create new routers
- Delete: patientsRouter, caregiversRouter, appointmentsRouter, providersRouter
- Create: journalRouter, moodRouter, mindfulnessRouter, goalsRouter, copingRouter, resourcesRouter

**Day 3-4**: Modify context service
- Rename `eldercareContextService.ts` to `wellnessContextService.ts`
- Implement new context generation
- Update agent service to use wellness context

**Day 5-7**: Create seed data
- Add recovery resources (AA/NA excerpts)
- Add DBT/CBT worksheets
- Create default coping strategies
- Set up mindfulness practices

### Phase 3: Frontend UI (Week 3-4)

**Week 3**: Core components
- WellnessDashboard.vue (main hub)
- JournalEntry.vue
- MoodLogger.vue
- MedicationTracker.vue (modify existing)

**Week 4**: Additional features
- MindfulnessTracker.vue
- GoalTracker.vue
- CopingToolkit.vue
- ResourceLibrary.vue

### Phase 4: AI Integration (Week 5)

**Day 1-2**: Create counselor personas
- Mental Health Counselor (main)
- Crisis Support
- Mindfulness Guide
- Recovery Companion

**Day 3-4**: Test AI conversations
- Verify context includes mood trends
- Test medication adherence reminders
- Verify recovery resource references
- Test crisis detection

**Day 5-7**: Fine-tune prompts based on conversations

### Phase 5: Testing & Refinement (Week 6)

- Daily use testing
- Mood tracking accuracy
- Journal workflow
- Medication adherence
- Goal progress
- Crisis scenarios

---

## Prompt for AI When Starting Fork

When you open the forked repository, give the AI this prompt:

```
This is a fork of Kalito Space, originally built for eldercare management. 
I'm adapting it into a personal mental health companion for managing bipolar disorder.

CORE INFRASTRUCTURE TO KEEP (100%):
- AI chat system (hybrid memory, streaming, personas)
- SQLite database architecture
- Express + Vue 3 + TypeScript stack
- Security middleware
- Web search integration
- Session management

ELDERCARE FEATURES TO REMOVE:
- Patient management (patients table)
- Caregiver profiles (caregivers table)
- Healthcare appointments (appointments table)
- Healthcare providers (healthcare_providers table)
- Medical records (medical_records table)

FEATURES TO TRANSFORM:
- medications → personal medication tracking (4 meds for bipolar)
- medication_logs → adherence tracking (keep as-is, just remove patient_id)
- vitals → mood_logs (mood, energy, anxiety, sleep instead of weight/glucose)
- semantic_pins → therapy insights (triggers, coping skills, warning signs)
- sessions → therapy sessions (repurpose session types)

NEW FEATURES TO ADD:
1. Journal entries (daily writing with AI reflection)
2. Mood tracking (1-10 scales for mood, energy, anxiety)
3. Mindfulness sessions (meditation, breathing, grounding)
4. Recovery resources (AA/NA Big Book, CBT/DBT content)
5. Goals tracking (daily, weekly, monthly progress)
6. Coping strategies toolkit (proven techniques)

AI PERSONA TO CREATE:
"Mental Health Counselor" trained in:
- CBT (Cognitive Behavioral Therapy)
- DBT (Dialectical Behavior Therapy)
- Mindfulness-Based Stress Reduction
- 12-Step recovery (AA/NA)
- Bipolar disorder management

The AI should:
- Access mood logs to spot patterns
- Reference recovery literature (AA Big Book, NA Basic Text)
- Suggest coping strategies from proven toolkit
- Encourage medication adherence (critical for stability)
- Guide journaling and mindfulness
- Watch for warning signs (mania, severe depression)

REUSE EVERYTHING POSSIBLE. The chat system, memory, streaming, 
search, personas - all perfect. Just swap eldercare data for 
mental health data and create new UI components.

Follow the implementation guide in: 
/docs/fork/mental-health-companion-fork-guide.md
```

---

## Key Files to Modify

### Critical Path (Start Here)

1. **`backend/db/init.ts`**
   - Remove eldercare table creation
   - Add mental health table creation
   - Run migration on startup

2. **`backend/logic/eldercareContextService.ts`** → **`wellnessContextService.ts`**
   - Complete rewrite of context generation
   - Query mood_logs instead of vitals
   - Include journal insights, coping strategies
   - Build wellness snapshot for AI

3. **`backend/routes/`** (folder)
   - Delete: patientsRouter, caregiversRouter, appointmentsRouter, providersRouter
   - Create: journalRouter, moodRouter, mindfulnessRouter, goalsRouter, copingRouter
   - Modify: medicationsRouter (remove patient_id requirements)

4. **`frontend/src/views/EldercareDashboard.vue`** → **`WellnessDashboard.vue`**
   - Complete redesign with mental health focus
   - 6 sections: Meds, Journal, Mood, Mindfulness, Goals, Chat

5. **`frontend/src/components/eldercare/`** (folder)
   - Delete all
   - Create new mental health components

6. **`frontend/src/router/index.ts`**
   - Change `/eldercare` to `/wellness`
   - Update navigation

---

## Recovery Resources to Add

### AA Big Book (Key Chapters)
```
Chapter 3: More About Alcoholism
Chapter 4: We Agnostics  
Chapter 5: How It Works (The 12 Steps)
Chapter 6: Into Action
```

### NA Basic Text (Key Chapters)
```
Chapter 4: How It Works
Chapter 5: What Can I Do?
Chapter 6: The Twelve Traditions
Chapter 9: Living the Program
```

### CBT Worksheets
```
- Thought Record (Identify cognitive distortions)
- Behavioral Activation (Combat depression)
- Exposure Hierarchy (Manage anxiety)
- Core Beliefs Worksheet
```

### DBT Skills
```
DEAR MAN (Interpersonal Effectiveness)
TIPP (Crisis Survival - Temperature, Intense exercise, Paced breathing, Paired muscle relaxation)
Wise Mind (Balance emotion and reason)
Distress Tolerance techniques
```

---

## Crisis Detection

Add safety monitoring to AI:

```typescript
// In wellnessContextService.ts
function detectCrisisSignals(context: WellnessContext): CrisisLevel {
  const signals = {
    severeDepression: context.mood_trends.current_mood <= 2,
    mania: context.mood_trends.current_mood >= 9 && context.mood_trends.energy_level >= 9,
    missedMeds: context.medications.adherence_rate < 50, // Missing half of meds
    warningKeywords: context.recent_journal_insights.themes.includes('suicide'),
    rapidCycling: context.mood_trends.trend === 'unstable'
  };
  
  if (signals.severeDepression || signals.warningKeywords) {
    return 'IMMEDIATE'; // Show crisis resources immediately
  }
  
  if (signals.mania || signals.missedMeds) {
    return 'ELEVATED'; // Strong encouragement to contact psychiatrist
  }
  
  if (signals.rapidCycling) {
    return 'MONITORED'; // Keep close eye, suggest psychiatrist check-in
  }
  
  return 'STABLE';
}
```

**AI persona should**:
- Never ignore crisis signals
- Immediately provide:
  - 988 (Suicide & Crisis Lifeline)
  - 741741 (Crisis Text Line)
  - Encourage calling psychiatrist
  - Suggest going to ER if in danger
- Document crisis interaction for follow-up

---

## Success Metrics

Track these to measure platform effectiveness:

1. **Medication Adherence**: 
   - Target: >90% weekly adherence
   - Critical for bipolar stability

2. **Mood Stability**:
   - Reduced volatility (smaller mood swings)
   - Longer periods in 4-7 range (stable)

3. **Journal Consistency**:
   - Regular entries = processing emotions
   - Target: 4-5 entries per week

4. **Mindfulness Practice**:
   - Regular practice reduces anxiety
   - Target: 3-4 sessions per week

5. **Goal Achievement**:
   - Completing goals builds self-efficacy
   - Track completion rate by category

6. **Coping Strategy Effectiveness**:
   - Which techniques actually help
   - Build personalized toolkit

---

## Privacy Considerations

**Journal entries** are uniquely sensitive:

```typescript
// In journal_entries table
is_private: INTEGER DEFAULT 1  // Private by default

// User must explicitly share
allowAIAccess: boolean = false  // Toggle in UI

// AI prompt should respect this
if (entry.is_private && !entry.allowAIAccess) {
  // AI knows entry exists but not content
  context += `Journal entry from ${entry.entry_date} (private)\n`;
} else {
  // AI can read and reference
  context += `Journal entry from ${entry.entry_date}:\n${entry.content}\n`;
}
```

**Mood data** is less sensitive but still private:
- Never shared with cloud (stays local)
- AI analysis happens on your device
- Export feature should encrypt

---

## Mobile Considerations

Mental health tools need mobile access:

**PWA Installation**:
- Quick access from home screen
- Medication reminders (push notifications)
- Quick mood check-ins
- Emergency crisis button

**Mobile UI Priority**:
1. Quick medication logging
2. Fast mood check-in (3 taps max)
3. SOS crisis button (always visible)
4. Journal entry (voice-to-text)
5. Mindfulness timer

---

## Final Thoughts

**You're not starting from scratch**. You have:
- ✅ Robust AI chat system
- ✅ Proven database architecture
- ✅ Security and validation
- ✅ Beautiful UI components
- ✅ PWA infrastructure

**You're just changing the data**:
- Eldercare → Mental health
- Patients → You
- Appointments → Mindfulness sessions
- Vitals → Mood logs
- Medical records → Journal entries

**The hard part is already done**. The chat system, memory management, streaming, search - all working perfectly. You're repurposing a solid foundation.

**This fork will help you**:
- Track medication adherence (critical for stability)
- Spot mood patterns early
- Process emotions through journaling
- Practice mindfulness consistently
- Access recovery wisdom (AA/NA/CBT/DBT)
- Have supportive AI counselor available 24/7

**You deserve this tool**. Taking care of yourself is how you can take care of your parents.

---

**Document Version**: 1.0  
**Created**: October 28, 2025  
**Purpose**: Guide for forking Kalito Space into Mental Health Companion  
**For**: Caleb Sanchez - Personal mental health management

*"Technology in service of healing, recovery, and wholeness."*
