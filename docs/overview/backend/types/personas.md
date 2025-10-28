# personas.ts - AI Persona Type Definitions

## Overview
`personas.ts` defines TypeScript interfaces for managing AI personas in Kalito. Personas are reusable configurations that customize AI behavior, tone, and expertise through system prompts and settings. This file uses shared API contract types for consistent response formats.

---

## Imports

### Shared API Types (Lines 4-9)

```typescript
import {
  API_CONTRACT_VERSION,
  type ApiErrorResponse,
  type ApiSuccessItem,
  type ApiSuccessList,
} from './api'
```

**What it imports:**
- `API_CONTRACT_VERSION`: Version constant ('1')
- `ApiErrorResponse`: Standard error envelope
- `ApiSuccessItem<T>`: Single resource response
- `ApiSuccessList<T>`: Collection response

**Why:** Ensures persona API responses follow same contract as all other endpoints

---

## Core Types

### PersonaCategory (Line 12)

```typescript
export type PersonaCategory = 'cloud' | 'local'
```

**Purpose:**
Categorize personas by which model family they're designed for.

---

#### 'cloud'

```typescript
category: 'cloud'
```

**What it means:** Persona designed for cloud AI models (OpenAI, Anthropic, etc.)

**Characteristics:**
- Advanced capabilities (function calling, vision, etc.)
- Higher token limits
- More sophisticated instructions

**Examples:**
```typescript
// Persona for GPT-4
{
  name: "Medical Expert",
  category: "cloud",
  prompt: "You are a board-certified physician with expertise in geriatric medicine. Provide evidence-based medical advice, cite current guidelines, and explain complex medical concepts clearly."
}
```

---

#### 'local'

```typescript
category: 'local'
```

**What it means:** Persona designed for local AI models (Ollama, LM Studio, etc.)

**Characteristics:**
- Simpler instructions (local models less capable)
- Lower token limits
- More constrained responses

**Examples:**
```typescript
// Persona for Llama 3
{
  name: "Helpful Assistant",
  category: "local",
  prompt: "You are a helpful assistant. Be clear and concise."  // Simpler prompt
}
```

---

### Why Category Matters

**Problem:** Same prompt may not work well on all models

```typescript
// Complex prompt works well on GPT-4 (cloud)
prompt: "You are a board-certified physician specializing in geriatric care with 20 years of experience. When responding, follow this structure: 1) Acknowledge the question, 2) Provide evidence-based answer citing current medical guidelines, 3) Explain potential risks/benefits, 4) Suggest follow-up questions. Use empathetic language and avoid medical jargon unless necessary."

// Same prompt overwhelms Llama 2 (local) - gets confused
// Better for local:
prompt: "You are a helpful medical assistant. Answer questions clearly and simply."
```

**Solution:** Separate personas by category, UI filters by active model type

```typescript
// User selects GPT-4 → show only 'cloud' personas
// User selects Llama 3 → show only 'local' personas
const personas = allPersonas.filter(p => p.category === currentModel.type)
```

---

## Settings

### PersonaSettings (Lines 15-24)

```typescript
export interface PersonaSettings {
  temperature?: number
  maxTokens?: number
  topP?: number
  repeatPenalty?: number
}
```

**Purpose:**
Optional model parameters bundled with the persona.

---

#### Property: temperature
```typescript
temperature?: number
```

**What it is:** Creativity/randomness control (0.0 - 2.0)

**Examples:**
```typescript
// Factual medical persona
temperature: 0.3  // Low temp = focused, consistent

// Creative storytelling persona
temperature: 0.9  // High temp = creative, varied
```

**Range:** Typically 0.1 - 1.2 (UI can constrain)

---

#### Property: maxTokens
```typescript
maxTokens?: number
```

**What it is:** Response length limit

**Examples:**
```typescript
// Concise answers persona
maxTokens: 500

// Detailed explanations persona
maxTokens: 2000
```

**Range:** 50 - 4000 (depends on model)

---

#### Property: topP
```typescript
topP?: number
```

**What it is:** Nucleus sampling (0.0 - 1.0)

**Examples:**
```typescript
topP: 0.9  // Balanced
topP: 0.5  // More focused
```

---

#### Property: repeatPenalty
```typescript
repeatPenalty?: number
```

**What it is:** Discourage repetition (typically 0.8 - 1.5)

**Examples:**
```typescript
repeatPenalty: 1.2  // Reduce repetition
```

**Note:** Mainly for local models (Ollama); OpenAI uses `frequency_penalty` instead

---

### Complete PersonaSettings Example

```typescript
const settings: PersonaSettings = {
  temperature: 0.7,
  maxTokens: 1500,
  topP: 0.9,
  repeatPenalty: 1.1
}
```

---

## Templates

### PromptTemplate (Lines 27-33)

```typescript
export interface PromptTemplate {
  id: string
  name: string
  content: string
  category: PersonaCategory
  icon: string
  settings?: PersonaSettings
}
```

**Purpose:**
Optional entity for pre-built persona templates (like persona presets).

---

#### Why Templates?

**Use case:** Provide starter personas for new users

**Example templates:**
```typescript
const templates: PromptTemplate[] = [
  {
    id: 'template-medical',
    name: 'Medical Expert',
    content: 'You are a board-certified physician...',
    category: 'cloud',
    icon: '🩺',
    settings: { temperature: 0.3, maxTokens: 2000 }
  },
  {
    id: 'template-caregiver',
    name: 'Compassionate Caregiver',
    content: 'You are a caring eldercare specialist...',
    category: 'cloud',
    icon: '❤️',
    settings: { temperature: 0.7, maxTokens: 1500 }
  }
]
```

**Usage flow:**
1. User clicks "Create from template"
2. Select template
3. Creates new persona with template's content/settings
4. User can customize further

---

## Core Persona Type

### Persona (Lines 42-54)

```typescript
export interface Persona {
  id: string
  name: string
  prompt: string
  description?: string
  icon?: string
  category: PersonaCategory
  settings?: PersonaSettings
  is_default: boolean
  created_at: string
  updated_at: string
}
```

**Purpose:**
Complete persona record (database + API wire format).

---

#### Property: id
```typescript
id: string
```

**What it is:** Unique persona identifier

**Examples:**
```typescript
id: 'persona-doctor'
id: 'persona-caregiver'
id: '1698501234567-abc123'
```

**Note:** UI provides ID (not auto-generated by backend) for predictable/memorable IDs

---

#### Property: name
```typescript
name: string
```

**What it is:** Display name

**Examples:**
```typescript
name: 'Medical Expert'
name: 'Compassionate Caregiver'
name: 'Pharmacist Assistant'
```

---

#### Property: prompt
```typescript
prompt: string
```

**What it is:** The system prompt (instructions for AI)

**Examples:**
```typescript
prompt: "You are a board-certified physician specializing in geriatric medicine. Provide evidence-based advice, explain medical concepts clearly, and show empathy for elderly patients and their caregivers."
```

**This becomes:**
```typescript
{
  role: 'system',
  content: persona.prompt  // ← System message to AI
}
```

**Best practices:**
- Be specific about role/expertise
- Include behavioral guidelines
- Mention tone/style
- Set boundaries (what NOT to do)

---

#### Property: description
```typescript
description?: string
```

**What it is:** User-facing description of persona

**Examples:**
```typescript
description: 'Expert medical advice for managing chronic conditions in elderly patients'
description: 'Warm, supportive guidance for family caregivers'
```

**Use cases:**
- Persona selection UI
- Tooltips
- Help users choose appropriate persona

---

#### Property: icon
```typescript
icon?: string
```

**What it is:** Emoji or icon identifier

**Examples:**
```typescript
icon: '🩺'  // Medical
icon: '❤️'  // Caregiver
icon: '💊'  // Pharmacist
icon: '🧓'  // Eldercare
```

**Use cases:**
- Visual persona identification
- Persona buttons in UI
- Chat header display

---

#### Property: category
```typescript
category: PersonaCategory
```

**What it is:** 'cloud' or 'local' (REQUIRED)

**Example:**
```typescript
category: 'cloud'
```

**Enforcement:** UI shows only personas matching current model type

---

#### Property: settings
```typescript
settings?: PersonaSettings
```

**What it is:** Default model parameters for this persona

**Example:**
```typescript
settings: {
  temperature: 0.3,  // Factual medical persona
  maxTokens: 2000
}
```

**Override priority:**
1. User's manual settings (highest)
2. Persona settings (medium)
3. Model defaults (lowest)

---

#### Property: is_default
```typescript
is_default: boolean
```

**What it is:** Flag for default persona in each category

**Examples:**
```typescript
is_default: true   // Default cloud persona
is_default: false  // Custom persona
```

**Constraint:** Only ONE default per category

**Database enforcement:**
```sql
CREATE UNIQUE INDEX idx_personas_default_category 
ON personas(category) 
WHERE is_default = 1;
-- Ensures only one default per category
```

**Use cases:**
- Auto-select default persona on session creation
- "Reset to default" button
- System-provided personas

---

#### Property: created_at & updated_at
```typescript
created_at: string
updated_at: string
```

**What it is:** Timestamps (REQUIRED on wire)

**Examples:**
```typescript
created_at: '2025-10-28T10:30:45.123Z'
updated_at: '2025-10-28T15:45:12.456Z'
```

**Use cases:**
- Sort personas by age
- Track modifications
- Audit trail

---

### Complete Persona Example

```typescript
const persona: Persona = {
  id: 'persona-doctor',
  name: 'Medical Expert',
  prompt: 'You are a board-certified physician specializing in geriatric medicine with 20 years of experience. Provide evidence-based medical advice following current clinical guidelines. Be empathetic and explain complex concepts in simple terms.',
  description: 'Expert medical guidance for managing elderly patient health',
  icon: '🩺',
  category: 'cloud',
  settings: {
    temperature: 0.3,
    maxTokens: 2000,
    topP: 0.9
  },
  is_default: true,
  created_at: '2025-10-01T08:00:00.000Z',
  updated_at: '2025-10-28T10:30:45.123Z'
}
```

---

## Request Types

### CreatePersonaRequest (Lines 57-66)

```typescript
export interface CreatePersonaRequest {
  id: string
  name: string
  prompt: string
  description?: string
  icon?: string
  category?: PersonaCategory
  settings?: PersonaSettings
}
```

**Purpose:**
Client → Server payload for creating new persona.

---

#### Property: id (REQUIRED)
```typescript
id: string
```

**Note:** UI provides ID (not auto-generated)

**Why?**
- Predictable/memorable IDs ('persona-doctor')
- Easier debugging
- URL-friendly

**Validation:**
```typescript
// Backend validates ID format
if (!/^[a-z0-9-]+$/.test(request.id)) {
  return err(res, 'VALIDATION_ERROR', 'Invalid ID format')
}
```

---

#### Property: category (optional)
```typescript
category?: PersonaCategory
```

**Note:** If omitted, backend may infer from active model

**Best practice:** Send explicitly
```typescript
// ✅ Good - explicit category
{ id: 'persona-doc', name: '...', prompt: '...', category: 'cloud' }

// ⚠️ Acceptable - backend infers
{ id: 'persona-doc', name: '...', prompt: '...' }
// Backend sets category based on current model
```

---

### Complete CreatePersonaRequest Example

```typescript
const request: CreatePersonaRequest = {
  id: 'persona-pharmacist',
  name: 'Pharmacist Assistant',
  prompt: 'You are a licensed pharmacist. Provide medication information, explain drug interactions, and answer questions about prescriptions.',
  description: 'Expert guidance on medications and pharmacy topics',
  icon: '💊',
  category: 'cloud',
  settings: {
    temperature: 0.4,
    maxTokens: 1500
  }
}

const response = await fetch('/api/personas', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(request)
})

const persona: Persona = (await response.json()).data
```

---

### UpdatePersonaRequest (Lines 69-76)

```typescript
export interface UpdatePersonaRequest {
  name?: string
  prompt?: string
  description?: string
  icon?: string
  category?: PersonaCategory
  settings?: PersonaSettings
}
```

**Purpose:**
Client → Server payload for updating persona (sparse/partial).

**All fields optional** - only send what you want to change.

---

### Complete UpdatePersonaRequest Example

```typescript
// Update just the prompt
const request: UpdatePersonaRequest = {
  prompt: 'Updated system prompt with new instructions...'
}

await fetch('/api/personas/persona-doctor', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(request)
})

// Update multiple fields
const request2: UpdatePersonaRequest = {
  name: 'Senior Medical Expert',
  description: 'Updated description',
  settings: {
    temperature: 0.5  // Adjust temperature
  }
}
```

---

## Response Envelopes

### PersonaItemResponse (Line 82)

```typescript
export type PersonaItemResponse = ApiSuccessItem<Persona>
```

**What it is:** Type alias for single persona response

**Expands to:**
```typescript
{
  version: '1',
  data: Persona
}
```

**Example:**
```json
{
  "version": "1",
  "data": {
    "id": "persona-doctor",
    "name": "Medical Expert",
    "prompt": "You are a physician...",
    "category": "cloud",
    "is_default": true,
    "created_at": "2025-10-01T08:00:00Z",
    "updated_at": "2025-10-28T10:30:45Z"
  }
}
```

---

### PersonaListResponse (Line 83)

```typescript
export type PersonaListResponse = ApiSuccessList<Persona>
```

**What it is:** Type alias for persona collection response

**Expands to:**
```typescript
{
  version: '1',
  data: Persona[]
}
```

**Example:**
```json
{
  "version": "1",
  "data": [
    { "id": "persona-doctor", "name": "Medical Expert", ... },
    { "id": "persona-caregiver", "name": "Compassionate Caregiver", ... }
  ]
}
```

---

### PersonaDeletedResponse (Lines 85-88)

```typescript
export interface PersonaDeletedResponse {
  version: typeof API_CONTRACT_VERSION
  ok: true
}
```

**What it is:** Deletion confirmation response

**Example:**
```json
{
  "version": "1",
  "ok": true
}
```

---

## Type Guards

### isApiErrorResponse (Lines 95-103)

```typescript
export function isApiErrorResponse(x: unknown): x is ApiErrorResponse {
  return !!(
    x &&
    typeof x === 'object' &&
    'error' in (x as any) &&
    typeof (x as any).error?.message === 'string' &&
    'version' in (x as any)
  )
}
```

**Purpose:**
Runtime check if response is an error.

**Usage:**
```typescript
const response = await fetch('/api/personas/persona-123')
const data = await response.json()

if (isApiErrorResponse(data)) {
  console.error(data.error.message)
  showErrorToast(data.error.message)
} else {
  // data is PersonaItemResponse
  const persona = data.data
  console.log(persona.name)
}
```

---

### isPersonaItemResponse (Lines 105-115)

```typescript
export function isPersonaItemResponse(x: unknown): x is PersonaItemResponse {
  return !!(
    x &&
    typeof x === 'object' &&
    'data' in (x as any) &&
    (x as any).data &&
    typeof (x as any).data.id === 'string' &&
    typeof (x as any).data.name === 'string' &&
    typeof (x as any).data.prompt === 'string' &&
    typeof (x as any).data.category === 'string' &&
    'version' in (x as any)
  )
}
```

**Purpose:**
Runtime check if response is a single persona.

**Usage:**
```typescript
if (isPersonaItemResponse(data)) {
  displayPersona(data.data)
}
```

---

### isPersonaListResponse (Lines 117-123)

```typescript
export function isPersonaListResponse(x: unknown): x is PersonaListResponse {
  return !!(
    x &&
    typeof x === 'object' &&
    Array.isArray((x as any).data) &&
    'version' in (x as any)
  )
}
```

**Purpose:**
Runtime check if response is a persona list.

**Usage:**
```typescript
if (isPersonaListResponse(data)) {
  renderPersonaList(data.data)
}
```

---

## Database Schema

```sql
CREATE TABLE personas (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  prompt TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  category TEXT NOT NULL,  -- 'cloud' or 'local'
  settings TEXT,  -- JSON string: PersonaSettings
  is_default INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Ensure only one default per category
CREATE UNIQUE INDEX idx_personas_default_category 
ON personas(category) 
WHERE is_default = 1;

CREATE INDEX idx_personas_category ON personas(category);
```

---

## API Endpoints

### GET /api/personas

```typescript
router.get('/api/personas', (req, res) => {
  const category = req.query.category as PersonaCategory | undefined
  
  let query = 'SELECT * FROM personas'
  const params: any[] = []
  
  if (category) {
    query += ' WHERE category = ?'
    params.push(category)
  }
  
  query += ' ORDER BY is_default DESC, name ASC'
  
  const personas = db.prepare(query).all(...params).map(row => ({
    ...row,
    settings: row.settings ? JSON.parse(row.settings) : undefined,
    is_default: Boolean(row.is_default)
  }))
  
  return okList(res, personas)
})
```

---

### POST /api/personas

```typescript
router.post('/api/personas', (req, res) => {
  const request: CreatePersonaRequest = req.body
  
  // Check if ID already exists
  const existing = db.prepare('SELECT id FROM personas WHERE id = ?').get(request.id)
  if (existing) {
    return err(res, 'CONFLICT', 'Persona ID already exists')
  }
  
  const persona: Persona = {
    id: request.id,
    name: request.name,
    prompt: request.prompt,
    description: request.description || null,
    icon: request.icon || null,
    category: request.category || 'cloud',
    settings: request.settings,
    is_default: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
  
  db.prepare(`
    INSERT INTO personas 
    (id, name, prompt, description, icon, category, settings, is_default, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    persona.id,
    persona.name,
    persona.prompt,
    persona.description,
    persona.icon,
    persona.category,
    JSON.stringify(persona.settings),
    persona.is_default ? 1 : 0,
    persona.created_at,
    persona.updated_at
  )
  
  return okItem(res, persona, 201)
})
```

---

## Usage Patterns

### Pattern 1: Persona Selector UI

```typescript
function PersonaSelector({ category }: { category: PersonaCategory }) {
  const [personas, setPersonas] = useState<Persona[]>([])
  
  useEffect(() => {
    fetch(`/api/personas?category=${category}`)
      .then(res => res.json())
      .then(data => {
        if (isPersonaListResponse(data)) {
          setPersonas(data.data)
        }
      })
  }, [category])
  
  return (
    <div>
      {personas.map(persona => (
        <button key={persona.id} onClick={() => selectPersona(persona.id)}>
          <span className="icon">{persona.icon}</span>
          <span className="name">{persona.name}</span>
          <span className="desc">{persona.description}</span>
          {persona.is_default && <span className="badge">Default</span>}
        </button>
      ))}
    </div>
  )
}
```

---

### Pattern 2: Apply Persona to Session

```typescript
async function applyPersona(sessionId: string, personaId: string) {
  // Load persona
  const response = await fetch(`/api/personas/${personaId}`)
  const data = await response.json()
  
  if (isApiErrorResponse(data)) {
    throw new Error(data.error.message)
  }
  
  const persona = data.data
  
  // Update session
  await updateSession(sessionId, {
    persona_id: persona.id
  })
  
  // Send initial system message with persona prompt
  await sendMessage(sessionId, {
    role: 'system',
    content: persona.prompt
  })
}
```

---

## Best Practices

### 1. One Default Per Category
```sql
-- ✅ Enforced by unique index
CREATE UNIQUE INDEX idx_personas_default_category 
ON personas(category) 
WHERE is_default = 1;
```

### 2. Validate Category
```typescript
// ✅ Good
const validCategories = ['cloud', 'local']
if (!validCategories.includes(request.category)) {
  return err(res, 'VALIDATION_ERROR', 'Invalid category')
}
```

### 3. Store Settings as JSON
```typescript
// ✅ Good - flexible settings
settings: JSON.stringify({ temperature: 0.7, maxTokens: 2000 })

// ❌ Bad - separate columns
temperature: 0.7,
max_tokens: 2000,
// (Hard to extend with new settings)
```

### 4. Filter Personas by Model Type
```typescript
// ✅ Good - show relevant personas
const currentModelType = getCurrentModel().type  // 'cloud' or 'local'
const personas = await getPersonas({ category: currentModelType })

// ❌ Bad - show all personas
const personas = await getPersonas()
// (User confused why cloud persona doesn't work with local model)
```

---

## Summary

**personas.ts defines AI persona system types:**

### Core Types
- **PersonaCategory**: 'cloud' | 'local'
- **PersonaSettings**: Model parameters (temperature, maxTokens, etc.)
- **PromptTemplate**: Pre-built persona templates
- **Persona**: Complete persona record

### Request Types
- **CreatePersonaRequest**: Create new persona (ID required)
- **UpdatePersonaRequest**: Update persona (sparse)

### Response Envelopes
- **PersonaItemResponse**: Single persona
- **PersonaListResponse**: Collection
- **PersonaDeletedResponse**: Deletion confirmation

### Type Guards
- **isApiErrorResponse**: Check for errors
- **isPersonaItemResponse**: Check for single persona
- **isPersonaListResponse**: Check for collection

**Key features:**
- Category-based filtering (cloud/local)
- Default persona per category
- Optional settings override
- Reusable system prompts
- Type-safe API responses

**Enables:**
- Consistent AI behavior
- User customization
- Model-appropriate personas
- Quick persona switching
