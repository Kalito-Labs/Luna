# Luna Journal Feature Implementation Plan

**Created:** November 17, 2025  
**Status:** 📋 Planning Phase  
**Priority:** High  
**Target:** Mental Health Journaling & Mood Tracking

## 🎯 Overview

Implement a comprehensive journaling system for Luna that combines:
- Personal journaling with beautiful, therapeutic UI
- Mood tracking and emotion logging
- Calendar-based entry organization
- Integration with Luna's AI for journaling prompts and insights

## 🎨 Design Reference

Based on user-provided screenshots:
1. **Home Screen** - Warm gradient, welcoming message, primary action buttons
2. **Journal Entry** - Clean writing interface with paper-like aesthetic
3. **Calendar View** - Monthly grid with entry indicators
4. **Diary Style** - Notebook aesthetic with spiral binding and lined paper
5. **Mood Tracker** - Emotion selection grid with therapeutic icons

## 📊 Database Schema Requirements

### New Table: `journal_entries`

```sql
CREATE TABLE journal_entries (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  session_id TEXT,                    -- Optional: Link to AI chat session
  title TEXT,
  content TEXT NOT NULL,
  entry_date TEXT NOT NULL,           -- Date of the journal entry (YYYY-MM-DD)
  entry_time TEXT,                    -- Time of entry creation
  mood TEXT,                          -- Primary mood (happy, sad, anxious, etc.)
  emotions TEXT,                      -- JSON array of emotion tags
  journal_type TEXT DEFAULT 'free',  -- 'free', 'prompted', 'mood_check'
  prompt_used TEXT,                   -- AI prompt if prompted journal
  privacy_level TEXT DEFAULT 'private', -- Future: 'private', 'shared_with_therapist'
  favorite INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE SET NULL
);

CREATE INDEX idx_journal_entries_patient_date ON journal_entries(patient_id, entry_date DESC);
CREATE INDEX idx_journal_entries_mood ON journal_entries(patient_id, mood);
CREATE INDEX idx_journal_entries_favorite ON journal_entries(patient_id, favorite);
```

### Mood/Emotion Schema

```typescript
type MoodType = 
  | 'happy' 
  | 'excited' 
  | 'grateful' 
  | 'relaxed' 
  | 'content'
  | 'tired' 
  | 'unsure' 
  | 'bored' 
  | 'anxious' 
  | 'angry'
  | 'stressed' 
  | 'sad' 
  | 'desperate'

interface JournalEntry {
  id: string
  patient_id: string
  session_id?: string
  title?: string
  content: string
  entry_date: string  // YYYY-MM-DD
  entry_time?: string // HH:MM
  mood?: MoodType
  emotions?: MoodType[]  // Multiple emotions allowed
  journal_type: 'free' | 'prompted' | 'mood_check'
  prompt_used?: string
  privacy_level: 'private' | 'shared_with_therapist'
  favorite: boolean
  created_at: string
  updated_at: string
}
```

## 🏗️ Frontend Components

### 1. **JournalView.vue** (Main Landing Page)
**Route:** `/journal`

**Features:**
- Personalized welcome message: "Is there something on your mind, [Name]?"
- Gradient background (teal to blue transition)
- Two primary action buttons:
  - 🖊️ "Start a new entry" → Navigate to JournalEntryView
  - 💭 "Mood check" → Navigate to MoodCheckView
- Quick link: "Access Care & Support Kit" (future feature)
- Recent entries preview (last 3 entries)
- Navigation to calendar view

**Components to Create:**
```vue
<template>
  <div class="journal-home">
    <header>
      <h1>Welcome, {{ patientName }}</h1>
      <h2>Is there something on your mind?</h2>
    </header>
    
    <div class="action-buttons">
      <button @click="startNewEntry">
        <PlusIcon /> Start a new entry
      </button>
      <button @click="moodCheck">
        <MoodIcon /> Mood check
      </button>
    </div>
    
    <div class="quick-access">
      <router-link to="/care-kit">
        Access Care & Support Kit →
      </router-link>
    </div>
    
    <section class="recent-entries">
      <h3><BarChartIcon /> Insights</h3>
      <p v-if="!hasEntries">Start journaling to see insights here.</p>
      <JournalPreviewCard 
        v-for="entry in recentEntries" 
        :key="entry.id" 
        :entry="entry" 
      />
    </section>
    
    <nav class="bottom-nav">
      <RouterLink to="/journal">Home</RouterLink>
      <RouterLink to="/journal/calendar">Calendar</RouterLink>
      <button @click="startNewEntry">+</button>
      <RouterLink to="/insights">Insights</RouterLink>
      <RouterLink to="/profile">Profile</RouterLink>
    </nav>
  </div>
</template>
```

### 2. **JournalEntryView.vue** (Writing Interface)
**Route:** `/journal/new` and `/journal/:id/edit`

**Features:**
- Two style options:
  - 🎨 **Minimal Mode:** Clean text area on gradient background
  - 📓 **Diary Mode:** Notebook aesthetic with spiral binding, lined paper, sticky notes
- Auto-save functionality (every 30 seconds)
- Character/word count
- Optional title field
- Date/time display
- Mood attachment option
- "Begin writing" placeholder prompt
- Save and Cancel buttons

**Components to Create:**
```vue
<template>
  <div :class="['journal-entry', journalStyle]">
    <header>
      <button @click="cancel">×</button>
      <h2>{{ isEditing ? 'Edit Entry' : 'Choose your journal style' }}</h2>
      <button @click="toggleStyle" v-if="!isEditing">
        <PencilIcon />
      </button>
    </header>
    
    <div class="entry-container">
      <input 
        v-model="entry.title" 
        placeholder="Entry title (optional)"
        class="title-input"
      />
      
      <textarea
        v-model="entry.content"
        :placeholder="placeholder"
        @input="handleInput"
        class="content-area"
      />
      
      <div class="entry-metadata">
        <span>{{ wordCount }} words</span>
        <span>{{ formatDate(entry.entry_date) }}</span>
      </div>
    </div>
    
    <div class="entry-actions">
      <button @click="attachMood">
        <MoodIcon /> Add mood
      </button>
      <button @click="save" class="primary">
        {{ isEditing ? 'Update' : 'Save Entry' }}
      </button>
    </div>
    
    <div v-if="autoSaveStatus" class="auto-save-indicator">
      {{ autoSaveStatus }}
    </div>
  </div>
</template>
```

### 3. **JournalCalendarView.vue** (Monthly Calendar)
**Route:** `/journal/calendar`

**Features:**
- Monthly calendar grid (pink/gradient theme)
- Visual indicators for days with journal entries
- Mood color-coding on calendar dates
- Click date to view/create entries for that day
- Month navigation (< November >)
- View mode toggles: List | Month | Week | Day
- Floating "+" button to create new entry
- Weather integration (optional, like reference image)

**Components to Create:**
```vue
<template>
  <div class="journal-calendar">
    <header>
      <button @click="previousMonth">←</button>
      <h2>{{ currentMonthName }}</h2>
      <button @click="nextMonth">→</button>
    </header>
    
    <nav class="view-toggle">
      <button :class="{active: view === 'list'}" @click="view = 'list'">List</button>
      <button :class="{active: view === 'month'}" @click="view = 'month'">Month</button>
      <button :class="{active: view === 'week'}" @click="view = 'week'">Week</button>
      <button :class="{active: view === 'day'}" @click="view = 'day'">Day</button>
    </nav>
    
    <div class="calendar-grid" v-if="view === 'month'">
      <div class="day-header" v-for="day in ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU']">
        {{ day }}
      </div>
      
      <div 
        v-for="date in calendarDates" 
        :key="date.iso"
        :class="['calendar-date', {
          'has-entry': date.hasEntry,
          'today': date.isToday,
          'other-month': date.isOtherMonth
        }]"
        @click="selectDate(date)"
      >
        <span class="date-number">{{ date.day }}</span>
        <MoodIndicator v-if="date.mood" :mood="date.mood" />
      </div>
    </div>
    
    <button class="fab" @click="createEntry">+</button>
    
    <div class="hint" v-if="!hasEntries">
      Click here to create an event
    </div>
  </div>
</template>
```

### 4. **MoodCheckView.vue** (Quick Mood Logging)
**Route:** `/journal/mood-check`

**Features:**
- Emotion icon grid (matching reference image #5)
- 13 emotion options with icons:
  - Row 1: happy, excited, grateful, relaxed, content
  - Row 2: tired, unsure, bored, anxious, angry
  - Row 3: stressed, sad, desperate
- Multiple emotion selection allowed
- Optional notes field
- Quick save (creates minimal journal entry)
- Visual feedback on selection
- Gradient background matching journal theme

**Components to Create:**
```vue
<template>
  <div class="mood-check">
    <header>
      <h2>Emotions</h2>
      <button @click="addCustomEmotion">+</button>
      <button @click="close">^</button>
    </header>
    
    <div class="emotions-grid">
      <button
        v-for="emotion in emotions"
        :key="emotion.id"
        :class="['emotion-btn', {selected: isSelected(emotion.id)}]"
        @click="toggleEmotion(emotion.id)"
      >
        <component :is="emotion.icon" class="emotion-icon" />
        <span>{{ emotion.label }}</span>
      </button>
    </div>
    
    <textarea
      v-model="notes"
      placeholder="How are you feeling? (optional)"
      class="mood-notes"
    />
    
    <button @click="saveMoodCheck" class="primary">
      Save Mood Check
    </button>
  </div>
</template>
```

### 5. **JournalPreviewCard.vue** (Entry Preview Component)
**Reusable component for displaying journal entry summaries**

```vue
<template>
  <div class="journal-card" @click="openEntry">
    <div class="card-header">
      <h4>{{ entry.title || 'Untitled Entry' }}</h4>
      <span class="date">{{ formatDate(entry.entry_date) }}</span>
    </div>
    
    <p class="preview">{{ truncatedContent }}</p>
    
    <div class="card-footer">
      <MoodBadge v-if="entry.mood" :mood="entry.mood" />
      <span class="word-count">{{ wordCount }} words</span>
    </div>
  </div>
</template>
```

### 6. **MoodIndicator.vue** (Mood Visual Component)
**Reusable component for displaying mood icons/colors**

```vue
<template>
  <div :class="['mood-indicator', moodClass]">
    <component :is="moodIcon" />
  </div>
</template>
```

## 🔧 Backend Implementation

### 1. **Database Migration**
**File:** `/backend/db/migrations/003_create_journal_entries.sql`

```sql
-- Create journal_entries table
-- See schema definition above in Database Schema Requirements section
```

### 2. **Journal Router**
**File:** `/backend/routes/journalRouter.ts`

```typescript
import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db/db'
import { validateRequest } from '../middleware/validation'

const journalRouter = Router()

// Zod schemas
const createJournalEntrySchema = z.object({
  patient_id: z.string(),
  session_id: z.string().optional(),
  title: z.string().optional(),
  content: z.string().min(1),
  entry_date: z.string(), // YYYY-MM-DD
  entry_time: z.string().optional(),
  mood: z.enum(['happy', 'excited', 'grateful', 'relaxed', 'content', 
                'tired', 'unsure', 'bored', 'anxious', 'angry',
                'stressed', 'sad', 'desperate']).optional(),
  emotions: z.array(z.string()).optional(),
  journal_type: z.enum(['free', 'prompted', 'mood_check']).default('free'),
  prompt_used: z.string().optional(),
})

const updateJournalEntrySchema = createJournalEntrySchema.partial()

// Routes
// POST /api/journal - Create new entry
// GET /api/journal - Get all entries for patient
// GET /api/journal/:id - Get specific entry
// PUT /api/journal/:id - Update entry
// DELETE /api/journal/:id - Delete entry
// GET /api/journal/calendar/:year/:month - Get entries for calendar view
// GET /api/journal/insights/:patientId - Get mood insights and statistics

export default journalRouter
```

### 3. **Journal Service**
**File:** `/backend/logic/journalService.ts`

```typescript
export class JournalService {
  // CRUD operations
  createEntry(data: CreateJournalEntryRequest): JournalEntry
  getEntry(id: string): JournalEntry | null
  updateEntry(id: string, data: UpdateJournalEntryRequest): JournalEntry
  deleteEntry(id: string): boolean
  
  // Query operations
  getEntriesByPatient(patientId: string, options?: QueryOptions): JournalEntry[]
  getEntriesByDateRange(patientId: string, start: string, end: string): JournalEntry[]
  getEntriesForMonth(patientId: string, year: number, month: number): CalendarEntries
  
  // Analytics operations
  getMoodStatistics(patientId: string, dateRange?: DateRange): MoodStats
  getJournalStreak(patientId: string): number
  getRecentEntries(patientId: string, limit: number): JournalEntry[]
  
  // AI Integration
  generateJournalPrompt(patientId: string, mood?: MoodType): string
  analyzeEntry(entry: JournalEntry): EntryInsights
}
```

## 🎨 Styling & Theme

### Color Palette
```css
/* Primary Gradient */
--journal-gradient-start: #7dd3c0; /* Teal */
--journal-gradient-end: #7ba3e3;   /* Blue */

/* Mood Colors */
--mood-happy: #FFD700;      /* Gold */
--mood-sad: #6495ED;        /* Blue */
--mood-anxious: #FFA500;    /* Orange */
--mood-angry: #DC143C;      /* Crimson */
--mood-content: #90EE90;    /* Light Green */
--mood-stressed: #FF6347;   /* Tomato */
--mood-grateful: #FFB6C1;   /* Pink */
--mood-tired: #D3D3D3;      /* Gray */

/* UI Elements */
--journal-pink: #ffc4d0;
--journal-card-bg: rgba(255, 255, 255, 0.95);
--journal-text: #2c3e50;
--journal-shadow: rgba(0, 0, 0, 0.1);
```

### Design Principles
- **Calming aesthetics:** Soft gradients, rounded corners, gentle shadows
- **Therapeutic icons:** Use mental health-appropriate iconography
- **Accessibility:** High contrast ratios, readable fonts, touch-friendly buttons
- **Responsive:** Mobile-first design (primary use case)
- **Animations:** Smooth transitions, subtle hover effects

## 🔗 Integration Points

### Luna AI Integration
1. **Journaling Prompts:** AI generates personalized prompts based on:
   - Recent mood patterns
   - Previous journal themes
   - Therapeutic goals
   
2. **Entry Analysis:** AI provides insights:
   - Emotion pattern recognition
   - Therapeutic progress tracking
   - Suggested coping strategies
   
3. **Session Linking:** Connect journal entries to AI chat sessions:
   - Reference journal content in conversations
   - Create journal entries from chat insights
   - Track therapeutic continuity

### Memory System Integration
- Journal entries can be referenced in `semantic_pins`
- Important insights stored for AI context
- Mood trends inform conversation tone

### Calendar Integration
- Show upcoming appointments alongside journal entries
- Medication reminders with journal prompts
- Treatment milestone tracking

## 📱 Mobile Considerations

### PWA Features
- Offline journaling capability
- Local storage before sync
- Push notifications for daily journal prompts
- Home screen installation

### Touch Interactions
- Swipe gestures for navigation
- Pull-to-refresh on calendar
- Long-press for entry options
- Haptic feedback on save

### Performance
- Lazy loading for old entries
- Image optimization (if photos added)
- Efficient calendar rendering
- Minimal bundle size

## 🧪 Testing Strategy

### Unit Tests
- JournalService CRUD operations
- Date utilities and formatting
- Mood calculation logic
- Validation schemas

### Integration Tests
- API endpoints
- Database operations
- AI prompt generation
- Calendar data aggregation

### E2E Tests
- Create journal entry flow
- Mood check workflow
- Calendar navigation
- Entry editing and deletion

## 📊 Success Metrics

### User Engagement
- Daily active journaling rate
- Average entry length
- Mood check frequency
- Calendar view usage

### Therapeutic Value
- Mood trend improvements
- Journaling consistency (streaks)
- AI prompt engagement
- Therapy session correlation

### Technical Performance
- Entry save time < 200ms
- Calendar load time < 500ms
- Offline sync reliability
- Zero data loss incidents

## 🚀 Implementation Phases

### Phase 1: Foundation ✅ COMPLETE
- [x] Create database migration
- [x] Build backend API routes (11 endpoints)
- [x] Implement JournalService (15+ methods)
- [x] Set up Zod validation schemas
- [x] Create basic TypeScript types

### Phase 2: Core UI ✅ COMPLETE
- [x] Build JournalView.vue (landing page)
- [x] Create JournalEntryView.vue (writing interface)
- [x] Implement basic mood check (MoodCheckView.vue)
- [x] Add routing and navigation
- [x] Implement auto-save functionality

### Phase 3: Calendar & Visualization ✅ COMPLETE
- [x] Build JournalCalendarView.vue
- [x] Implement month view with navigation
- [ ] Implement week/day views (deferred - month view sufficient)
- [x] Add mood indicators to calendar
- [x] Create entry preview cards
- [x] Build monthly insights/stats

### Phase 4: Advanced Features 🔄 OPTIONAL (Future)
- [ ] Integrate AI prompt generation
- [ ] Add entry analysis and insights
- [ ] Implement diary theme (minimal theme exists)
- [ ] Add favorite/pin functionality
- [ ] Create export/sharing features

### Phase 5: Polish & Testing 📋 REMAINING
- [ ] Comprehensive E2E testing
- [ ] Performance optimization
- [ ] Accessibility improvements
- [ ] Documentation update
- [ ] User acceptance testing

## 📝 Notes & Considerations

### Privacy & Security
- All journal entries are encrypted at rest
- No cloud backup without explicit consent
- Option to password-protect specific entries
- Secure deletion with overwrite

### Future Enhancements
- Photo/media attachments
- Voice journal entries
- Gratitude journal templates
- Guided journaling exercises
- Therapist sharing (with consent)
- Export to PDF/print
- Journal themes and customization
- Handwriting recognition
- Integration with wearable devices (mood from heart rate, sleep)

### Technical Debt to Avoid
- Use TypeScript strictly (no `any` types)
- Maintain comprehensive test coverage
- Document all API endpoints
- Keep components modular and reusable
- Follow Vue 3 Composition API best practices

---

**Plan Status:** 📋 Ready for Implementation  
**Estimated Timeline:** 5 weeks  
**Priority:** High  
**Dependencies:** None (database and backend already in place)  
**Team Review:** Pending