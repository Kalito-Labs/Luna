# AI Model Onboarding - Mental Health Companion Fork

> **For the AI Assistant**: This document brings you up to speed on transforming Kalito Space (eldercare platform) into a personal mental health companion for bipolar disorder management.

---

## 🎯 Mission Overview

**What You're Inheriting**: A fully functional eldercare management platform with AI chat, hybrid memory, web search, and comprehensive database architecture.

**What We're Building**: A personal mental health companion focused on bipolar disorder management through journaling, mood tracking, medication adherence, mindfulness, and recovery resources.

**Key Principle**: **SALVAGE 80%+ OF EXISTING CODE**. We're not rebuilding - we're transforming.

---

## 📊 Current State (What Exists Now)

### ✅ Working Infrastructure (KEEP 100%)

**AI Chat System** (`backend/logic/`):
- ✅ `agentService.ts` - Orchestrates AI conversations, streaming, tool calling
- ✅ `memoryManager.ts` - Hybrid memory (recent messages + semantic pins + summaries)
- ✅ `modelRegistry.ts` - Multi-model support (GPT-4.1 Nano, Phi3 Mini)
- ✅ `adapters/openai/` - OpenAI integration with streaming
- ✅ `adapters/ollama/` - Local model support
- ✅ Web search integration (Tavily API)
- ✅ Persona system with custom prompts

**Database** (`backend/db/`):
- ✅ SQLite with better-sqlite3 (14 tables, 13 FKs, 11+ indexes)
- ✅ Auto-initialization system (`init.ts`)
- ✅ Migration framework (`migrations/`)
- ✅ Cascade deletes throughout
- ✅ Importance scoring on key tables

**Backend API** (`backend/`):
- ✅ Express 5.1.0 + TypeScript 5.0
- ✅ Security middleware (Helmet, CORS, rate limiting)
- ✅ Zod validation (`middleware/validation.ts`)
- ✅ Winston logging (`utils/logger.ts`)
- ✅ API contract system (`utils/apiContract.ts`)

**Frontend** (`frontend/src/`):
- ✅ Vue 3.5.13 + Composition API
- ✅ TypeScript 5.8.3
- ✅ Vite 6.3.5
- ✅ PWA support
- ✅ Chat components (ChatPanel, ChatWorkspace, SessionSidebar)
- ✅ Syntax highlighting, markdown rendering

### 📋 Current Database Schema (14 Tables)

#### Chat System (5 tables) - **KEEP AS-IS**
1. **sessions** - AI conversation sessions
2. **messages** - Chat messages with streaming
3. **session_summaries** - Conversation summaries
4. **semantic_pins** - Important insights (will MODIFY)
5. **personas** - AI persona configurations

#### Eldercare System (9 tables) - **TRANSFORM or REMOVE**
6. **patients** ❌ REMOVE
7. **caregivers** ❌ REMOVE
8. **appointments** ❌ REMOVE
9. **healthcare_providers** ❌ REMOVE
10. **medical_records** ❌ REMOVE
11. **medications** ✏️ MODIFY (remove patient_id, add mood_impact)
12. **medication_logs** ✏️ MODIFY (remove patient_id)
13. **vitals** ✏️ TRANSFORM → **mood_logs**
14. **semantic_pins** (already listed above) ✏️ MODIFY (repurpose for therapy insights)

---

## 🔄 Transformation Plan

### Phase 1: Database Migration

#### STEP 1: Remove Eldercare Tables
```sql
DROP TABLE IF EXISTS patients;
DROP TABLE IF EXISTS caregivers;
DROP TABLE IF EXISTS appointments;
DROP TABLE IF EXISTS healthcare_providers;
DROP TABLE IF EXISTS medical_records;
```

**Why**: User doesn't need patient management - this is for personal use only.

#### STEP 2: Modify Existing Tables

**medications** (personal medication tracking):
```sql
-- Remove patient foreign key
ALTER TABLE medications DROP COLUMN patient_id;

-- Add mood tracking
ALTER TABLE medications ADD COLUMN mood_impact TEXT; 
-- Values: 'stabilizing', 'activating', 'sedating'

ALTER TABLE medications ADD COLUMN time_of_day TEXT; 
-- Values: 'morning', 'afternoon', 'evening', 'bedtime'
```

**medication_logs** (adherence tracking):
```sql
-- Just remove patient reference (keep everything else)
ALTER TABLE medication_logs DROP COLUMN patient_id;
```

**vitals → mood_logs** (mood/energy/anxiety tracking):
```sql
-- Rename table
ALTER TABLE vitals RENAME TO mood_logs;

-- Remove vital sign columns
ALTER TABLE mood_logs DROP COLUMN patient_id;
ALTER TABLE mood_logs DROP COLUMN weight_kg;
ALTER TABLE mood_logs DROP COLUMN glucose_am;
ALTER TABLE mood_logs DROP COLUMN glucose_pm;

-- Add mental health tracking
ALTER TABLE mood_logs ADD COLUMN mood_score INTEGER; -- 1-10
ALTER TABLE mood_logs ADD COLUMN energy_level INTEGER; -- 1-10
ALTER TABLE mood_logs ADD COLUMN anxiety_level INTEGER; -- 1-10
ALTER TABLE mood_logs ADD COLUMN sleep_hours REAL;
ALTER TABLE mood_logs ADD COLUMN sleep_quality INTEGER; -- 1-10
ALTER TABLE mood_logs ADD COLUMN triggers TEXT; -- JSON array
ALTER TABLE mood_logs ADD COLUMN activities TEXT; -- JSON array
ALTER TABLE mood_logs ADD COLUMN gratitude TEXT;
ALTER TABLE mood_logs ADD COLUMN accomplishments TEXT;

-- Keep: recorded_date, notes, active, created_at, updated_at
```

**semantic_pins** (therapy insights):
```sql
-- Repurpose for mental health
ALTER TABLE semantic_pins DROP COLUMN patient_id;
ALTER TABLE semantic_pins DROP COLUMN medical_category;
ALTER TABLE semantic_pins ADD COLUMN insight_category TEXT;
-- Values: 'trigger', 'coping_skill', 'breakthrough', 'warning_sign', 'affirmation', 'goal'

-- Keep: urgency_level (normal, high, critical) for mood warnings
```

**sessions** (therapy sessions):
```sql
-- Remove eldercare references
ALTER TABLE sessions DROP COLUMN patient_id;
ALTER TABLE sessions DROP COLUMN related_record_id;

-- Repurpose session_type: 'chat', 'journal', 'check_in', 'crisis'
-- Repurpose care_category: 'mood', 'medication', 'coping', 'mindfulness'
```

#### STEP 3: Add New Tables

**journal_entries** (daily writing with AI reflection):
```sql
CREATE TABLE journal_entries (
  id TEXT PRIMARY KEY,
  entry_date TEXT NOT NULL,
  entry_time TEXT,
  mood_before INTEGER, -- 1-10 before writing
  mood_after INTEGER,  -- 1-10 after writing
  prompt TEXT,         -- AI-generated prompt (optional)
  content TEXT NOT NULL,
  themes TEXT,         -- JSON: ['anxiety', 'family', 'work']
  session_id TEXT,     -- Link to AI chat if discussed
  is_private INTEGER DEFAULT 1, -- Don't share with AI unless user allows
  importance_score REAL DEFAULT 0.5,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE SET NULL
);

CREATE INDEX idx_journal_date ON journal_entries(entry_date DESC);
CREATE INDEX idx_journal_mood ON journal_entries(mood_before, mood_after);
```

**mindfulness_sessions** (meditation, breathing, grounding):
```sql
CREATE TABLE mindfulness_sessions (
  id TEXT PRIMARY KEY,
  session_date TEXT NOT NULL,
  session_time TEXT,
  practice_type TEXT NOT NULL, -- 'meditation', 'breathing', 'body_scan', 'grounding'
  duration_minutes INTEGER,
  mood_before INTEGER,
  mood_after INTEGER,
  anxiety_before INTEGER,
  anxiety_after INTEGER,
  notes TEXT,
  effectiveness_rating INTEGER, -- 1-10
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_mindfulness_date ON mindfulness_sessions(session_date DESC);
CREATE INDEX idx_mindfulness_type ON mindfulness_sessions(practice_type);
```

**recovery_resources** (AA/NA/CBT/DBT library):
```sql
CREATE TABLE recovery_resources (
  id TEXT PRIMARY KEY,
  resource_type TEXT NOT NULL, -- 'aa_big_book', 'na_basic_text', 'cbt_worksheet', 'dbt_skill'
  title TEXT NOT NULL,
  chapter TEXT,
  page_number INTEGER,
  content TEXT NOT NULL, -- Full text
  summary TEXT,        -- AI-generated
  themes TEXT,         -- JSON: ['acceptance', 'mindfulness']
  practical_exercises TEXT, -- JSON array
  personal_notes TEXT,
  times_referenced INTEGER DEFAULT 0,
  last_accessed TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_resources_type ON recovery_resources(resource_type);
CREATE INDEX idx_resources_themes ON recovery_resources(themes);
```

**goals** (progress tracking):
```sql
CREATE TABLE goals (
  id TEXT PRIMARY KEY,
  goal_type TEXT NOT NULL, -- 'daily', 'weekly', 'monthly', 'long_term'
  category TEXT, -- 'medication', 'therapy', 'exercise', 'social', 'creative'
  description TEXT NOT NULL,
  target_date TEXT,
  status TEXT DEFAULT 'active', -- 'active', 'completed', 'abandoned', 'paused'
  progress_percentage INTEGER DEFAULT 0,
  check_ins TEXT, -- JSON array of updates
  obstacles TEXT,
  strategies TEXT,
  completion_date TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_goals_status ON goals(status, goal_type);
CREATE INDEX idx_goals_category ON goals(category);
```

**coping_strategies** (proven techniques toolkit):
```sql
CREATE TABLE coping_strategies (
  id TEXT PRIMARY KEY,
  strategy_name TEXT NOT NULL,
  category TEXT, -- 'distraction', 'grounding', 'social', 'physical', 'creative'
  description TEXT,
  when_to_use TEXT, -- 'anxiety', 'depression', 'mania', 'mixed_episode'
  effectiveness_rating REAL, -- Average 1-10
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

### Phase 2: Backend Transformation

#### FILES TO DELETE
```
backend/routes/
├── patientsRouter.ts ❌
├── caregiversRouter.ts ❌
├── appointmentsRouter.ts ❌
└── providersRouter.ts ❌
```

#### FILES TO CREATE

**backend/routes/journalRouter.ts**:
```typescript
GET    /api/journal              # List entries
POST   /api/journal              # Create entry
GET    /api/journal/:id          # Get single entry
PUT    /api/journal/:id          # Update entry
DELETE /api/journal/:id          # Delete entry
GET    /api/journal/prompts      # AI-generated prompts
GET    /api/journal/themes       # Theme analytics
```

**backend/routes/moodRouter.ts**:
```typescript
GET    /api/moods                # List logs
POST   /api/moods                # Create log
GET    /api/moods/:id            # Single log
PUT    /api/moods/:id            # Update log
DELETE /api/moods/:id            # Delete log
GET    /api/moods/trends         # Trend analysis
GET    /api/moods/patterns       # AI pattern detection
```

**backend/routes/mindfulnessRouter.ts**:
```typescript
GET    /api/mindfulness          # List sessions
POST   /api/mindfulness          # Log session
GET    /api/mindfulness/stats    # Effectiveness
GET    /api/mindfulness/guided   # Guided practices
```

**backend/routes/goalsRouter.ts**:
```typescript
GET    /api/goals                # List goals
POST   /api/goals                # Create goal
PUT    /api/goals/:id            # Update goal
DELETE /api/goals/:id            # Delete goal
POST   /api/goals/:id/checkin    # Log progress
```

**backend/routes/copingRouter.ts**:
```typescript
GET    /api/coping               # List strategies
POST   /api/coping               # Create strategy
PUT    /api/coping/:id           # Update strategy
DELETE /api/coping/:id           # Delete strategy
POST   /api/coping/:id/use       # Log usage
```

**backend/routes/resourcesRouter.ts**:
```typescript
GET    /api/resources            # List all
GET    /api/resources/:id        # Single resource
POST   /api/resources/:id/notes  # Add notes
GET    /api/resources/search     # Search by theme
```

#### CRITICAL FILE TO TRANSFORM

**backend/logic/eldercareContextService.ts** → **wellnessContextService.ts**

**Current function**: Builds eldercare context (patients, medications, appointments, caregivers)

**New function**: Build wellness context for AI
```typescript
interface WellnessContext {
  // Medication adherence (CRITICAL for bipolar)
  medications: {
    active: Medication[],
    adherence_rate: number, // Last 7 days %
    last_missed: Date | null
  },
  
  // Mood patterns
  mood_trends: {
    current_mood: number,
    weekly_average: number,
    trend: 'improving' | 'declining' | 'stable' | 'unstable',
    warning_signs: string[] // Mania or severe depression indicators
  },
  
  // Journal insights
  recent_journal_insights: {
    themes: string[],
    emotional_tone: 'positive' | 'negative' | 'mixed',
    shared_entries: number // How many user allowed AI to see
  },
  
  // Coping effectiveness
  coping_effectiveness: {
    most_effective: CopingStrategy[],
    least_effective: CopingStrategy[],
    underutilized: CopingStrategy[]
  },
  
  // Goal progress
  goals: {
    active: Goal[],
    recent_progress: GoalProgress[],
    overdue: Goal[]
  },
  
  // Pinned therapy insights
  pinned_insights: {
    triggers: string[],
    coping_skills: string[],
    warning_signs: string[],
    affirmations: string[]
  }
}
```

**This context gets injected into every AI conversation** so the counselor persona has full awareness of:
- Medication adherence status
- Current mood state and trends
- Recent journal themes
- What coping strategies work
- Active goals and progress
- Known triggers and warning signs

### Phase 3: AI Persona Configuration

#### CREATE NEW PERSONA: "Mental Health Counselor"

Insert into `personas` table:
```typescript
{
  id: "counselor-main",
  name: "Your Counselor",
  icon: "🧘",
  category: "cloud", // Use GPT-4.1 Nano
  
  prompt: `You are a compassionate mental health counselor specializing in bipolar disorder.

Core Modalities: CBT, DBT, MBSR, 12-Step recovery (AA/NA)

Your Role:
- Supportive, non-judgmental listening
- Help identify mood patterns and triggers
- Guide through grounding and coping techniques
- Encourage medication adherence (4 meds are CRITICAL)
- Reference recovery literature (AA Big Book, NA Basic Text)
- Celebrate progress and practice self-compassion

Key Principles:
- Safety first: Watch for mania/severe depression
- Medication is essential - never suggest stopping
- Recovery is not linear - setbacks are normal
- You're not a replacement for professionals
- Encourage connection with therapist, psychiatrist, support groups

When User is Struggling:
- Ask about medication adherence FIRST
- Use grounding (5-4-3-2-1 senses)
- Validate feelings
- Identify triggers
- Suggest coping strategies
- Encourage journaling/mindfulness
- Remind them this will pass

You have access to:
- Medication tracking (adherence rates)
- Mood logs (patterns and cycles)
- Journal entries (if user shares)
- Coping strategies database
- Recovery resources (AA/NA/CBT/DBT)
- Past conversation summaries and pinned insights

Use this context to provide personalized, informed support.`,

  description: "CBT/DBT-trained counselor for bipolar disorder management",
  temperature: 0.7, // Balanced
  maxTokens: 2000,
  topP: 0.9,
  repeatPenalty: 1.1,
  default_model: "gpt-4.1-nano",
  is_default: 1
}
```

#### ADDITIONAL PERSONAS

**"Crisis Support"** (temperature: 0.3):
- Immediate safety focus
- Grounding techniques
- Professional help referral (988, 741741, ER)
- No therapy - just safety

**"Mindfulness Guide"** (temperature: 0.6):
- Guided breathing
- Body scans
- Meditation
- Grounding exercises

**"Recovery Companion"** (temperature: 0.7):
- AA/NA focused
- 12-Step wisdom
- Recovery literature references
- Support network encouragement

### Phase 4: Frontend Transformation

#### COMPONENTS TO DELETE
```
frontend/src/components/eldercare/
├── PatientForm.vue ❌
├── PatientDetailModal.vue ❌
├── AppointmentForm.vue ❌
├── AppointmentsList.vue ❌
├── CaregiverProfile.vue ❌
└── ... (all eldercare components)

frontend/src/views/
└── EldercareDashboard.vue ❌
```

#### COMPONENTS TO CREATE

**frontend/src/views/WellnessDashboard.vue**:
- Main hub with 6 quick action cards:
  1. 💊 Today's Medications
  2. 📔 Journal Entry
  3. 📊 Mood Check
  4. 🧘 Mindfulness
  5. 🎯 Goals
  6. 🤖 Counselor Chat

**frontend/src/components/wellness/** (new folder):
- **JournalEntry.vue** - Rich text editor, mood sliders, privacy toggle
- **MoodLogger.vue** - Mood/energy/anxiety scales, sleep, triggers, gratitude
- **MindfulnessTracker.vue** - Practice selector, timer, before/after ratings
- **GoalTracker.vue** - Progress visualization, check-ins, obstacles
- **CopingToolkit.vue** - Filterable strategies, effectiveness tracking
- **ResourceLibrary.vue** - AA/NA/CBT/DBT content, search, notes
- **MedicationTracker.vue** (modify existing) - Add mood_impact, time_of_day

#### UPDATE ROUTER
```typescript
// frontend/src/router/index.ts
{
  path: '/wellness', // Change from /eldercare
  name: 'Wellness',
  component: WellnessDashboard
}
```

---

## 🎯 Your First Steps (Priority Order)

### 1. Database Migration (FOUNDATION)
```bash
# Create migration file
# backend/db/migrations/002-mental-health-fork.ts

# Implement the SQL transformations above
# Run: pnpm run build (auto-applies migrations)
```

### 2. Context Service Transformation (CRITICAL)
```bash
# Rename and rewrite
mv backend/logic/eldercareContextService.ts backend/logic/wellnessContextService.ts

# Implement WellnessContext interface
# Update agentService.ts to import from new file
```

### 3. Backend Routes
```bash
# Delete eldercare routers
rm backend/routes/{patients,caregivers,appointments,providers}Router.ts

# Create mental health routers
# journal, mood, mindfulness, goals, coping, resources

# Update server.ts to register new routes
```

### 4. AI Persona
```bash
# Create counselor persona in database
# Test conversations
# Verify wellness context is being injected
```

### 5. Frontend UI
```bash
# Delete eldercare components
# Create WellnessDashboard.vue
# Create wellness components one by one
# Update router
```

---

## 🚨 Critical Safety Features

### Crisis Detection Algorithm

Implement in `wellnessContextService.ts`:
```typescript
function detectCrisisSignals(context: WellnessContext): CrisisLevel {
  const signals = {
    severeDepression: context.mood_trends.current_mood <= 2,
    mania: context.mood_trends.current_mood >= 9 && energy >= 9,
    missedMeds: context.medications.adherence_rate < 50,
    suicideKeywords: themes.includes('suicide'),
    rapidCycling: trend === 'unstable'
  };
  
  if (severeDepression || suicideKeywords) return 'IMMEDIATE';
  if (mania || missedMeds) return 'ELEVATED';
  if (rapidCycling) return 'MONITORED';
  return 'STABLE';
}
```

**AI must respond to crisis signals**:
- IMMEDIATE: Show 988, 741741, ER immediately
- ELEVATED: Strong encouragement to contact psychiatrist
- MONITORED: Suggest psychiatrist check-in soon
- STABLE: Normal supportive conversation

### Privacy Protection

**Journal entries** are uniquely sensitive:
```typescript
// Default: is_private = 1
// User must explicitly toggle to share with AI

if (entry.is_private && !entry.allowAIAccess) {
  // AI knows entry exists but not content
  context += `Journal entry from ${date} (private)\n`;
} else {
  context += `Journal entry from ${date}:\n${content}\n`;
}
```

---

## 📚 Recovery Resources to Seed

### AA Big Book (Key Chapters)
- Chapter 3: More About Alcoholism
- Chapter 5: How It Works (The 12 Steps)
- Chapter 6: Into Action

### NA Basic Text
- Chapter 4: How It Works
- Chapter 9: Living the Program

### CBT Worksheets
- Thought Record
- Behavioral Activation
- Core Beliefs

### DBT Skills
- DEAR MAN
- TIPP (Crisis Survival)
- Wise Mind
- Distress Tolerance

Add these to `recovery_resources` table with full text so AI can reference them.

---

## 💡 Key Insights for You

### What Makes This Easy
- **Chat system is perfect** - Don't touch it
- **Database architecture is solid** - Just swap data
- **Security is done** - Reuse all middleware
- **Frontend infrastructure works** - Just create new components
- **AI integration is proven** - Just new personas

### What Makes This Hard
- **Context service rewrite** - Most critical file
- **UI/UX for mental health** - Different emotional tone than eldercare
- **Crisis detection** - Safety is paramount
- **Privacy boundaries** - Journal sensitivity

### Success Metrics
1. **Medication adherence** >90% (critical for bipolar)
2. **Mood stability** - Fewer extreme swings
3. **Journal consistency** - Regular processing
4. **Mindfulness practice** - Anxiety reduction
5. **Goal achievement** - Building self-efficacy
6. **Coping effectiveness** - Personalized toolkit

---

## 🗺️ Mental Model

**Think of it this way**:

**Before** (Eldercare):
```
User → manages patients → each has vitals, meds, appointments
AI → helps coordinate family care
```

**After** (Mental Health):
```
User → is the patient → tracks own mood, meds, journal
AI → is the counselor → supportive, therapeutic, safety-focused
```

**What changes**: The data and UI
**What stays**: Everything under the hood (chat, memory, search, streaming, security)

---

## 🎬 Final Prompt Template

When starting work, user will say:

> "This is the Kalito Space fork. I want to transform it from eldercare to mental health. Follow the onboarding guide in `/docs/fork/AI-ONBOARDING.md` and the detailed implementation guide in `/docs/fork/mental-health-companion-fork-guide.md`. Start with database migration."

You respond:

> "Understood. I'm working with the Kalito Space fork to create a personal mental health companion for bipolar disorder management. I'll start with Phase 1: Database Migration. I see we need to:
> 
> 1. Remove 5 eldercare tables
> 2. Modify 4 existing tables (medications, medication_logs, vitals→mood_logs, semantic_pins)
> 3. Add 5 new tables (journal, mindfulness, resources, goals, coping)
> 
> I'm preserving 100% of: chat system, memory, security, frontend infrastructure
> 
> Let me create the migration script..."

---

## 📋 Checklist for Completion

- [ ] **Database**: All 5 eldercare tables removed
- [ ] **Database**: medications, medication_logs, vitals→mood_logs, semantic_pins modified
- [ ] **Database**: 5 new tables created (journal, mindfulness, resources, goals, coping)
- [ ] **Backend**: eldercareContextService → wellnessContextService rewritten
- [ ] **Backend**: Eldercare routers deleted
- [ ] **Backend**: 6 new mental health routers created
- [ ] **Backend**: server.ts updated with new routes
- [ ] **AI**: "Mental Health Counselor" persona created
- [ ] **AI**: 3 additional personas created (Crisis, Mindfulness, Recovery)
- [ ] **AI**: Wellness context properly injected into conversations
- [ ] **Frontend**: Eldercare components deleted
- [ ] **Frontend**: WellnessDashboard.vue created
- [ ] **Frontend**: 7 wellness components created
- [ ] **Frontend**: Router updated (/wellness)
- [ ] **Safety**: Crisis detection implemented
- [ ] **Privacy**: Journal privacy toggle implemented
- [ ] **Testing**: Daily use validation
- [ ] **Testing**: Crisis scenarios verified
- [ ] **Testing**: Medication adherence tracking works

---

## 🤝 Working with the User

**User's Background**:
- Bipolar disorder, takes 4 medications
- Caring for elderly parents (Aurora & Basilio)
- Needs personal mental health tool
- Wants to salvage existing working code

**User's Vision**:
- Daily journaling with AI reflection
- Mood/energy/anxiety tracking
- Medication adherence monitoring
- Mindfulness practices
- Recovery resources (AA/NA/CBT/DBT)
- AI counselor available 24/7

**Communication Style**:
- Direct and clear
- Focus on practical implementation
- Prioritize safety features
- Respect privacy boundaries

**When Stuck**:
- Reference: `/docs/fork/mental-health-companion-fork-guide.md` for detailed specs
- Reference: `/docs/overview/ks-overview.md` for current system understanding
- Ask user for clarification on mental health features
- Prioritize medication adherence (critical for bipolar stability)

---

## 📖 Additional Documentation

**Must Read**:
1. `/docs/fork/mental-health-companion-fork-guide.md` - Comprehensive implementation details
2. `/docs/overview/ks-overview.md` - Current system architecture
3. `/docs/overview/backend/db/database-schema-diagrams.md` - Current database ERDs

**Reference as Needed**:
- `/docs/overview/logic/` - Understanding existing AI services
- `/README.md` - Technology stack and setup
- `/backend/db/migrations/001-eldercare-schema.ts` - Current schema (for comparison)

---

## ✨ Remember

**You're not starting from scratch**. This is a **transformation**, not a rebuild.

**80%+ of the code is perfect** - Chat, memory, search, streaming, security, database architecture, PWA, frontend infrastructure.

**20% needs changing** - Data model (eldercare → mental health) and UI components (care management → wellness tracking).

**The hard part is done**. You're inheriting a solid, working foundation.

**This tool matters**. It helps the user take care of himself so he can take care of his parents.

---

**Document Version**: 1.0  
**Created**: October 28, 2025  
**Purpose**: AI Model Onboarding for Mental Health Companion Fork  
**For**: Next AI assistant inheriting this project  
**Original Platform**: Kalito Space (Eldercare Management)  
**Target Platform**: Mental Health Companion (Bipolar Disorder Management)

*"Bring the next AI up to speed so they can help transform this platform with full context and confidence."*

---

## 🚀 Quick Start Command

```bash
# After copying the repo
cd mental-health-companion

# Give this to the AI:
"I'm working on the Kalito Space fork to create a mental health companion. 
Read /docs/fork/AI-ONBOARDING.md for context. Start with Phase 1: Database Migration."
```

That's it. You're ready. 💙
