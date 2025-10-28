# Personas Router Documentation

## Overview

The `personasRouter.ts` file implements the AI persona management system. Personas define distinct AI assistant personalities with custom system prompts, settings, and behaviors. They allow users to create specialized AI assistants for different tasks (e.g., medical advisor, coding assistant, general helper).

**Location**: `/backend/routes/personasRouter.ts`

**Mounted At**: `/api/personas`

**Created**: August 24, 2025

**Purpose**:
- Manage AI persona configurations
- Store custom system prompts and instructions
- Configure model-specific settings (temperature, tokens, etc.)
- Support cloud and local model personas
- Prevent deletion of default personas
- Handle safe session reassignment on persona deletion

**Key Features**:
- **Complete CRUD**: List, get, create, update, delete personas
- **Custom System Prompts**: Define AI behavior and expertise
- **Tunable Settings**: Temperature, max tokens, top-p, repeat penalty
- **Category System**: Separate cloud and local personas
- **Default Personas**: Protected system defaults (one per category)
- **Safe Deletion**: Reassigns sessions to default before deleting
- **Conflict Prevention**: Prevents duplicate persona IDs

---

## Architecture

### Dependencies

```typescript
import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db/db'
import type { Persona } from '../types/personas'
import { okList, okItem, err } from '../utils/apiContract'
import { handleRouterError } from '../utils/routerHelpers'
```

**Key Dependencies**:
- **Zod**: Schema validation for request bodies
- **Database**: Direct SQLite queries
- **Persona Types**: Shared type definitions
- **API Contract**: Standardized response format

---

## Database Schema

### Personas Table

```sql
CREATE TABLE personas (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  prompt TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  category TEXT,                    -- 'cloud' or 'local'
  default_model TEXT,
  suggested_models TEXT,
  temperature REAL,
  maxTokens INTEGER,
  topP REAL,
  repeatPenalty REAL,
  stopSequences TEXT,
  is_default INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  eldercare_specialty TEXT,
  patient_context INTEGER DEFAULT 0
);
```

**Field Explanations**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | TEXT | Yes | Unique persona identifier (user-defined) |
| `name` | TEXT | Yes | Display name (max 100 chars) |
| `prompt` | TEXT | Yes | System prompt defining persona behavior |
| `description` | TEXT | No | User-facing description |
| `icon` | TEXT | No | Icon/emoji for UI display |
| `category` | TEXT | No | 'cloud' or 'local' (for model filtering) |
| `default_model` | TEXT | No | Recommended model ID |
| `suggested_models` | TEXT | No | JSON array of suggested models |
| `temperature` | REAL | No | Sampling temperature (0.1-2.0, default 0.7) |
| `maxTokens` | INTEGER | No | Max output tokens (50-4000, default 1000) |
| `topP` | REAL | No | Nucleus sampling (0.0-1.0, default 0.9) |
| `repeatPenalty` | REAL | No | Repetition penalty (0.8-2.0, default 1.1) |
| `stopSequences` | TEXT | No | JSON array of stop sequences |
| `is_default` | INTEGER | Yes | 1 = default persona, 0 = custom (default 0) |
| `created_at` | TEXT | Yes | Creation timestamp |
| `updated_at` | TEXT | Yes | Last update timestamp |
| `eldercare_specialty` | TEXT | No | Eldercare-specific specialty |
| `patient_context` | INTEGER | No | Include patient context flag (0/1) |

**Purpose**: Store AI persona configurations with custom prompts and settings

**Constraints**:
- `id`: Primary key (unique, user-defined)
- `is_default`: Only one default per category (enforced by application logic)

**Related Tables**:
- `sessions` (persona_id foreign key)

---

## Type Definitions

### Persona Type

**Location**: `/backend/types/personas.ts`

```typescript
interface Persona {
  id: string
  name: string
  prompt: string
  description?: string
  icon?: string
  category: 'cloud' | 'local'
  settings?: PersonaSettings
  is_default: boolean
  created_at: string
  updated_at: string
}

interface PersonaSettings {
  temperature?: number      // 0.0-2.0 (typical 0.1-1.2)
  maxTokens?: number        // 50-4000
  topP?: number            // 0.0-1.0
  repeatPenalty?: number   // 0.8-2.0
}
```

**Category Types**:
- `cloud`: For cloud-based models (GPT-4, Claude, etc.)
- `local`: For local models (Ollama, LM Studio, etc.)

---

## Validation Schemas

### Create Persona Schema

```typescript
const createPersonaSchema = z.object({
  id: z.string().min(1).max(50),
  name: z.string().min(1).max(100),
  prompt: z.string().min(1),
  description: z.string().optional(),
  icon: z.string().optional(),
  category: z.enum(['cloud', 'local']).optional(),
  settings: z.object({
    temperature: z.number().min(0.1).max(2.0).optional(),
    maxTokens: z.number().min(50).max(4000).optional(),
    topP: z.number().min(0.0).max(1.0).optional(),
    repeatPenalty: z.number().min(0.8).max(2.0).optional(),
  }).optional(),
})
```

**Validation Rules**:
- `id`: Required, 1-50 characters
- `name`: Required, 1-100 characters
- `prompt`: Required, minimum 1 character
- `description`: Optional string
- `icon`: Optional string (emoji or icon identifier)
- `category`: Optional enum ('cloud' or 'local')
- `settings`: Optional nested object with validated ranges

**Setting Defaults**:
- `temperature`: 0.7
- `maxTokens`: 1000
- `topP`: 0.9
- `repeatPenalty`: 1.1
- `is_default`: 0 (never default on creation)

### Update Persona Schema

```typescript
const updatePersonaSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  prompt: z.string().min(1).optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
  category: z.enum(['cloud', 'local']).optional(),
  settings: z.object({
    temperature: z.number().min(0.1).max(2.0).optional(),
    maxTokens: z.number().min(50).max(4000).optional(),
    topP: z.number().min(0.0).max(1.0).optional(),
    repeatPenalty: z.number().min(0.8).max(2.0).optional(),
  }).optional(),
})
```

**Validation Rules**:
- All fields optional
- Same validation ranges as create schema
- Dynamic update (only provided fields changed)

---

## Utility Functions

### toPersonaWithSettings

**Purpose**: Transform database row to Persona object with settings

```typescript
function toPersonaWithSettings(row: any) {
  return {
    id: row.id,
    name: row.name,
    prompt: row.prompt,
    description: row.description,
    icon: row.icon,
    category: row.category,
    is_default: !!row.is_default,
    settings: {
      temperature: row.temperature ?? 0.7,
      maxTokens: row.maxTokens ?? 1000,
      topP: row.topP ?? 0.9,
      repeatPenalty: row.repeatPenalty ?? 1.1,
    },
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}
```

**Behavior**:
- Flattens database columns into nested `settings` object
- Applies default values for missing settings
- Converts `is_default` to boolean

### getCategoryDefaultPersonaId

**Purpose**: Get default persona ID for a category (fallback for deletions)

```typescript
function getCategoryDefaultPersonaId(category: 'cloud' | 'local'): string {
  const row = db.prepare(
    `SELECT id FROM personas WHERE category = ? AND is_default = 1 LIMIT 1`
  ).get(category)

  return row?.id ?? (category === 'cloud' ? 'default-cloud' : 'default-local')
}
```

**Behavior**:
- Queries for default persona in specified category
- Falls back to hardcoded default IDs if none found
- Used during persona deletion to reassign sessions

---

## Endpoints

### GET /api/personas

**Purpose**: List all personas, ordered by creation date.

#### Path Parameters

None.

#### Query Parameters

None.

#### Implementation

```typescript
router.get('/', (_req, res) => {
  try {
    const raw = db.prepare(`
      SELECT id, name, prompt, description, icon, category, is_default,
             temperature, maxTokens, topP, repeatPenalty, created_at, updated_at
      FROM personas
      ORDER BY created_at ASC
    `).all()

    const personas = raw.map(toPersonaWithSettings)
    return okList(res, personas)
  } catch (error) {
    return handleRouterError(res, error, 'list personas')
  }
})
```

**Query Details**:
- No filters (returns all personas)
- Ordering: By `created_at` (oldest first)
- Transformation: Applies `toPersonaWithSettings` to each row

#### Response Format (Success)

```typescript
{
  data: [
    {
      id: "default-cloud",
      name: "General Assistant",
      prompt: "You are a helpful AI assistant...",
      description: "General-purpose assistant for everyday tasks",
      icon: "🤖",
      category: "cloud",
      is_default: true,
      settings: {
        temperature: 0.7,
        maxTokens: 1000,
        topP: 0.9,
        repeatPenalty: 1.1
      },
      created_at: "2024-01-01T00:00:00.000Z",
      updated_at: "2024-01-01T00:00:00.000Z"
    },
    {
      id: "medical-advisor",
      name: "Medical Advisor",
      prompt: "You are a knowledgeable medical advisor specializing in eldercare...",
      description: "Specialized in eldercare and medication management",
      icon: "⚕️",
      category: "cloud",
      is_default: false,
      settings: {
        temperature: 0.5,
        maxTokens: 1500,
        topP: 0.9,
        repeatPenalty: 1.1
      },
      created_at: "2024-01-10T10:00:00.000Z",
      updated_at: "2024-01-15T14:30:00.000Z"
    },
    // ... more personas
  ]
}
```

#### Example Request

```typescript
const response = await fetch('/api/personas')
const data = await response.json()

console.log(`Found ${data.data.length} personas`)
data.data.forEach(persona => {
  const defaultFlag = persona.is_default ? '⭐' : ''
  console.log(`- ${persona.icon} ${persona.name} (${persona.category}) ${defaultFlag}`)
})
```

**Use Case**: Populate persona selector, display persona library

---

### GET /api/personas/:id

**Purpose**: Get detailed information about a specific persona.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Persona ID |

#### Implementation

```typescript
router.get('/:id', (req, res) => {
  const { id } = req.params
  try {
    const row = db.prepare(`
      SELECT id, name, prompt, description, icon, category, is_default,
             temperature, maxTokens, topP, repeatPenalty, created_at, updated_at
      FROM personas
      WHERE id = ?
    `).get(id)

    if (!row) {
      return err(res, 404, 'NOT_FOUND', 'Persona not found')
    }

    return okItem(res, toPersonaWithSettings(row))
  } catch (error) {
    return handleRouterError(res, error, 'get persona', { id })
  }
})
```

#### Response Format (Success)

```typescript
{
  data: {
    id: "medical-advisor",
    name: "Medical Advisor",
    prompt: "You are a knowledgeable medical advisor specializing in eldercare. You provide accurate, compassionate guidance on medications, symptoms, and health management for elderly patients.",
    description: "Specialized in eldercare and medication management",
    icon: "⚕️",
    category: "cloud",
    is_default: false,
    settings: {
      temperature: 0.5,
      maxTokens: 1500,
      topP: 0.9,
      repeatPenalty: 1.1
    },
    created_at: "2024-01-10T10:00:00.000Z",
    updated_at: "2024-01-15T14:30:00.000Z"
  }
}
```

#### Response Format (Not Found)

```typescript
{
  success: false,
  error: {
    code: "NOT_FOUND",
    message: "Persona not found"
  }
}
```

**HTTP Status**: 404

#### Example Request

```typescript
const response = await fetch('/api/personas/medical-advisor')
const data = await response.json()

if (data.data) {
  console.log(`Persona: ${data.data.name}`)
  console.log(`Prompt: ${data.data.prompt.substring(0, 100)}...`)
  console.log(`Temperature: ${data.data.settings.temperature}`)
}
```

---

### POST /api/personas

**Purpose**: Create a new custom persona.

#### Request Body

```typescript
{
  id: string;                      // Required (1-50 chars, unique)
  name: string;                    // Required (1-100 chars)
  prompt: string;                  // Required (min 1 char)
  description?: string;            // Optional
  icon?: string;                   // Optional (emoji or icon)
  category?: 'cloud' | 'local';    // Optional
  settings?: {
    temperature?: number;          // 0.1-2.0
    maxTokens?: number;           // 50-4000
    topP?: number;                // 0.0-1.0
    repeatPenalty?: number;       // 0.8-2.0
  };
}
```

#### Implementation

```typescript
router.post('/', (req, res) => {
  try {
    const validated = createPersonaSchema.parse(req.body)

    // Prevent duplicate IDs
    const exists = db.prepare('SELECT 1 FROM personas WHERE id = ?').get(validated.id)
    if (exists) {
      return err(res, 409, 'CONFLICT', 'Persona with this ID already exists')
    }

    db.prepare(`
      INSERT INTO personas (
        id, name, prompt, description, icon, category,
        temperature, maxTokens, topP, repeatPenalty,
        created_at, updated_at, is_default
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0)
    `).run(
      validated.id,
      validated.name,
      validated.prompt,
      validated.description ?? null,
      validated.icon ?? null,
      validated.category ?? null,
      validated.settings?.temperature ?? 0.7,
      validated.settings?.maxTokens ?? 1000,
      validated.settings?.topP ?? 0.9,
      validated.settings?.repeatPenalty ?? 1.1
    )

    const row = db.prepare(`
      SELECT id, name, prompt, description, icon, category, is_default,
             temperature, maxTokens, topP, repeatPenalty, created_at, updated_at
      FROM personas WHERE id = ?
    `).get(validated.id)

    return okItem(res, toPersonaWithSettings(row), 201)
  } catch (error) {
    return handleRouterError(res, error, 'create persona')
  }
})
```

**Auto-Generated Fields**:
- `is_default`: Always 0 (custom personas never default)
- `created_at`: Current timestamp
- `updated_at`: Current timestamp

**Conflict Prevention**: Returns 409 if persona ID already exists

#### Response Format (Success)

```typescript
{
  data: {
    id: "coding-assistant",
    name: "Coding Assistant",
    prompt: "You are an expert programmer specializing in TypeScript, React, and Node.js. Provide clear, well-commented code examples.",
    description: "Helps with programming tasks",
    icon: "💻",
    category: "cloud",
    is_default: false,
    settings: {
      temperature: 0.3,
      maxTokens: 2000,
      topP: 0.9,
      repeatPenalty: 1.1
    },
    created_at: "2024-01-20T15:00:00.000Z",
    updated_at: "2024-01-20T15:00:00.000Z"
  }
}
```

**HTTP Status**: 201 Created

#### Response Format (Conflict)

```typescript
{
  success: false,
  error: {
    code: "CONFLICT",
    message: "Persona with this ID already exists"
  }
}
```

**HTTP Status**: 409

#### Example Requests

```typescript
// Minimal persona (required fields only)
const minimal = await fetch('/api/personas', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    id: 'simple-helper',
    name: 'Simple Helper',
    prompt: 'You are a helpful assistant.'
  })
})

// Complete persona with all options
const complete = await fetch('/api/personas', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    id: 'medical-advisor',
    name: 'Medical Advisor',
    prompt: 'You are a knowledgeable medical advisor specializing in eldercare...',
    description: 'Specialized in eldercare and medication management',
    icon: '⚕️',
    category: 'cloud',
    settings: {
      temperature: 0.5,
      maxTokens: 1500,
      topP: 0.9,
      repeatPenalty: 1.1
    }
  })
})

const data = await complete.json()
console.log('Created persona:', data.data.id)
```

---

### PUT /api/personas/:id

**Purpose**: Update an existing persona's configuration.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Persona ID to update |

#### Request Body

All fields optional. Only provided fields will be updated.

```typescript
{
  name?: string;                   // 1-100 chars
  prompt?: string;                 // Min 1 char
  description?: string;
  icon?: string;
  category?: 'cloud' | 'local';
  settings?: {
    temperature?: number;          // 0.1-2.0
    maxTokens?: number;           // 50-4000
    topP?: number;                // 0.0-1.0
    repeatPenalty?: number;       // 0.8-2.0
  };
}
```

#### Implementation

```typescript
router.put('/:id', (req, res) => {
  const { id } = req.params
  try {
    const validated = updatePersonaSchema.parse(req.body)

    const existing = db.prepare('SELECT * FROM personas WHERE id = ?').get(id)
    if (!existing) {
      return err(res, 404, 'NOT_FOUND', 'Persona not found')
    }

    const updateFields: string[] = []
    const updateValues: any[] = []

    if (validated.name !== undefined) { 
      updateFields.push('name = ?'); 
      updateValues.push(validated.name) 
    }
    if (validated.prompt !== undefined) { 
      updateFields.push('prompt = ?'); 
      updateValues.push(validated.prompt) 
    }
    if (validated.description !== undefined) { 
      updateFields.push('description = ?'); 
      updateValues.push(validated.description) 
    }
    if (validated.icon !== undefined) { 
      updateFields.push('icon = ?'); 
      updateValues.push(validated.icon) 
    }
    if (validated.category !== undefined) { 
      updateFields.push('category = ?'); 
      updateValues.push(validated.category) 
    }
    if (validated.settings?.temperature !== undefined) { 
      updateFields.push('temperature = ?'); 
      updateValues.push(validated.settings.temperature) 
    }
    if (validated.settings?.maxTokens !== undefined) { 
      updateFields.push('maxTokens = ?'); 
      updateValues.push(validated.settings.maxTokens) 
    }
    if (validated.settings?.topP !== undefined) { 
      updateFields.push('topP = ?'); 
      updateValues.push(validated.settings.topP) 
    }
    if (validated.settings?.repeatPenalty !== undefined) { 
      updateFields.push('repeatPenalty = ?'); 
      updateValues.push(validated.settings.repeatPenalty) 
    }

    if (updateFields.length === 0) {
      return err(res, 400, 'VALIDATION_ERROR', 'No valid fields to update')
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP')
    updateValues.push(id)

    db.prepare(`UPDATE personas SET ${updateFields.join(', ')} WHERE id = ?`)
      .run(...updateValues)

    const row = db.prepare(`
      SELECT id, name, prompt, description, icon, category, is_default,
             temperature, maxTokens, topP, repeatPenalty, created_at, updated_at
      FROM personas WHERE id = ?
    `).get(id)

    return okItem(res, toPersonaWithSettings(row))
  } catch (error) {
    return handleRouterError(res, error, 'update persona', { id })
  }
})
```

**Dynamic Update Logic**:
1. Parse request body with schema
2. Check persona exists
3. Build SQL with only provided fields
4. Auto-update `updated_at` timestamp
5. Return updated persona

#### Response Format (Success)

```typescript
{
  data: {
    id: "medical-advisor",
    name: "Medical Advisor",
    prompt: "Updated prompt with new instructions...",  // Updated
    description: "Specialized in eldercare and medication management",
    icon: "⚕️",
    category: "cloud",
    is_default: false,
    settings: {
      temperature: 0.4,  // Updated
      maxTokens: 1500,
      topP: 0.9,
      repeatPenalty: 1.1
    },
    created_at: "2024-01-10T10:00:00.000Z",
    updated_at: "2024-01-21T10:30:00.000Z"  // Updated
  }
}
```

#### Response Format (Not Found)

```typescript
{
  success: false,
  error: {
    code: "NOT_FOUND",
    message: "Persona not found"
  }
}
```

**HTTP Status**: 404

#### Example Requests

```typescript
// Update prompt only
await fetch('/api/personas/medical-advisor', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: 'You are an expert medical advisor with 30 years of experience...'
  })
})

// Update settings only
await fetch('/api/personas/coding-assistant', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    settings: {
      temperature: 0.2,  // Lower for more focused code
      maxTokens: 3000    // More tokens for longer code examples
    }
  })
})

// Update multiple fields
await fetch('/api/personas/medical-advisor', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Senior Medical Advisor',
    icon: '👨‍⚕️',
    settings: {
      temperature: 0.4
    }
  })
})
```

---

### DELETE /api/personas/:id

**Purpose**: Delete a persona with safe session reassignment.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Persona ID to delete |

#### Implementation

```typescript
router.delete('/:id', (req, res) => {
  const { id } = req.params
  try {
    const persona = db.prepare(
      `SELECT id, category, is_default FROM personas WHERE id = ?`
    ).get(id)

    if (!persona) {
      return err(res, 404, 'NOT_FOUND', 'Persona not found')
    }

    // Block deleting defaults
    if (persona.is_default === 1) {
      return err(res, 403, 'FORBIDDEN', 'Cannot delete default persona')
    }

    const category: 'cloud' | 'local' = persona.category || 'cloud'
    const fallbackPersonaId = getCategoryDefaultPersonaId(category)

    // Manual transaction for safety
    db.prepare('BEGIN').run()
    try {
      // Reassign sessions referencing this persona
      db.prepare(`UPDATE sessions SET persona_id = ? WHERE persona_id = ?`)
        .run(fallbackPersonaId, id)

      // Delete persona
      const result = db.prepare(`DELETE FROM personas WHERE id = ?`).run(id)

      if (result.changes === 0) {
        db.prepare('ROLLBACK').run()
        return err(res, 404, 'NOT_FOUND', 'Persona not found')
      }

      db.prepare('COMMIT').run()
      return okItem(res, { ok: true, reassigned_to: fallbackPersonaId })
    } catch (inner) {
      db.prepare('ROLLBACK').run()
      throw inner
    }
  } catch (error) {
    return handleRouterError(res, error, 'delete persona', { id })
  }
})
```

**Safe Deletion Process**:
1. Check persona exists
2. Block deletion of default personas (403)
3. Determine fallback persona (default for same category)
4. **Transaction**: 
   - Reassign all sessions using this persona to default
   - Delete the persona
   - Commit or rollback on error

**Default Protection**: Cannot delete personas with `is_default = 1`

#### Response Format (Success)

```typescript
{
  data: {
    ok: true,
    reassigned_to: "default-cloud"
  }
}
```

**Fields**:
- `ok`: Always `true` on success
- `reassigned_to`: ID of persona that inherited the sessions

#### Response Format (Default Persona)

```typescript
{
  success: false,
  error: {
    code: "FORBIDDEN",
    message: "Cannot delete default persona"
  }
}
```

**HTTP Status**: 403

#### Response Format (Not Found)

```typescript
{
  success: false,
  error: {
    code: "NOT_FOUND",
    message: "Persona not found"
  }
}
```

**HTTP Status**: 404

#### Example Request

```typescript
const response = await fetch('/api/personas/medical-advisor', {
  method: 'DELETE'
})

const data = await response.json()

if (data.data) {
  console.log('Persona deleted successfully')
  console.log(`Sessions reassigned to: ${data.data.reassigned_to}`)
}
```

**Use Case**: Remove unwanted custom personas, cleanup old configurations

---

## Usage Examples

### Create Specialized Personas

```typescript
async function createEldercarPersonas() {
  // Medical Advisor
  await fetch('/api/personas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: 'medical-advisor',
      name: 'Medical Advisor',
      prompt: `You are a knowledgeable medical advisor specializing in eldercare. 
You provide accurate, compassionate guidance on medications, symptoms, and health 
management for elderly patients. Always recommend consulting with healthcare 
professionals for serious concerns.`,
      description: 'Specialized in eldercare and medication management',
      icon: '⚕️',
      category: 'cloud',
      settings: {
        temperature: 0.5,  // Lower for medical accuracy
        maxTokens: 1500,
        topP: 0.9,
        repeatPenalty: 1.1
      }
    })
  })

  // Medication Manager
  await fetch('/api/personas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: 'medication-manager',
      name: 'Medication Manager',
      prompt: `You are a medication management assistant. You help track medications, 
dosages, schedules, and potential interactions. You provide clear reminders and 
safety information about prescription drugs.`,
      description: 'Medication tracking and reminders',
      icon: '💊',
      category: 'cloud',
      settings: {
        temperature: 0.3,  // Very low for medication safety
        maxTokens: 1000
      }
    })
  })

  // Friendly Companion
  await fetch('/api/personas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: 'friendly-companion',
      name: 'Friendly Companion',
      prompt: `You are a warm, friendly companion for elderly individuals. You engage 
in pleasant conversation, share stories, and provide emotional support. You're 
patient, understanding, and always respectful.`,
      description: 'Conversational companion for emotional support',
      icon: '🤗',
      category: 'cloud',
      settings: {
        temperature: 0.8,  // Higher for more creative conversation
        maxTokens: 1200
      }
    })
  })
}
```

### Build Persona Selector

```typescript
async function buildPersonaSelector(category?: 'cloud' | 'local') {
  const response = await fetch('/api/personas')
  const data = await response.json()
  
  let personas = data.data
  
  // Filter by category if specified
  if (category) {
    personas = personas.filter(p => p.category === category)
  }
  
  // Group by default status
  const defaults = personas.filter(p => p.is_default)
  const custom = personas.filter(p => !p.is_default)
  
  console.log('Default Personas:')
  defaults.forEach(p => {
    console.log(`  ⭐ ${p.icon} ${p.name}`)
  })
  
  console.log('\nCustom Personas:')
  custom.forEach(p => {
    console.log(`  ${p.icon} ${p.name}`)
  })
  
  return { defaults, custom }
}
```

### Update Persona Settings

```typescript
async function tunePersonaTemperature(personaId: string, temperature: number) {
  const response = await fetch(`/api/personas/${personaId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      settings: { temperature }
    })
  })
  
  const data = await response.json()
  console.log(`Updated ${data.data.name} temperature to ${temperature}`)
  
  return data.data
}

// Usage
await tunePersonaTemperature('medical-advisor', 0.4)  // More focused
await tunePersonaTemperature('friendly-companion', 0.9)  // More creative
```

### Clone Persona with Modifications

```typescript
async function clonePersona(sourceId: string, newId: string, modifications: any) {
  // 1. Get source persona
  const sourceRes = await fetch(`/api/personas/${sourceId}`)
  const sourceData = await sourceRes.json()
  const source = sourceData.data
  
  // 2. Create clone with modifications
  const clone = {
    id: newId,
    name: modifications.name || `${source.name} (Copy)`,
    prompt: modifications.prompt || source.prompt,
    description: modifications.description || source.description,
    icon: modifications.icon || source.icon,
    category: modifications.category || source.category,
    settings: {
      ...source.settings,
      ...modifications.settings
    }
  }
  
  // 3. Create new persona
  const createRes = await fetch('/api/personas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(clone)
  })
  
  return createRes.json()
}

// Usage
await clonePersona('medical-advisor', 'medical-advisor-v2', {
  name: 'Medical Advisor V2',
  settings: {
    temperature: 0.6,  // Slightly higher
    maxTokens: 2000    // More tokens
  }
})
```

---

## Best Practices

### 1. Use Descriptive Persona IDs

```typescript
// ✅ GOOD: Descriptive, kebab-case IDs
await createPersona({
  id: 'medical-advisor',
  name: 'Medical Advisor'
})

await createPersona({
  id: 'coding-assistant-typescript',
  name: 'TypeScript Coding Assistant'
})

// ❌ BAD: Generic or cryptic IDs
await createPersona({
  id: 'p1',  // What is this?
  name: 'Medical Advisor'
})

await createPersona({
  id: 'abc-123-xyz',  // No semantic meaning
  name: 'Coding Assistant'
})
```

### 2. Set Appropriate Temperature

```typescript
// ✅ GOOD: Temperature matches use case
const personas = {
  'medical-advisor': {
    temperature: 0.3,  // Low for medical accuracy
  },
  'coding-assistant': {
    temperature: 0.2,  // Very low for precise code
  },
  'creative-writer': {
    temperature: 0.9,  // High for creativity
  },
  'friendly-companion': {
    temperature: 0.8,  // High for varied conversation
  }
}

// ❌ BAD: Temperature doesn't match use case
const medicalPersona = {
  temperature: 1.5,  // Too high for medical advice!
}
```

### 3. Write Clear System Prompts

```typescript
// ✅ GOOD: Specific, detailed prompt
const prompt = `You are a medical advisor specializing in eldercare.

Responsibilities:
- Provide accurate medication information
- Explain symptoms and health conditions clearly
- Suggest when to consult a doctor
- Be compassionate and patient

Always:
- Use simple, clear language
- Recommend professional medical consultation for serious issues
- Respect patient privacy and dignity

Never:
- Diagnose conditions
- Prescribe medications
- Give emergency medical advice`

// ❌ BAD: Vague prompt
const prompt = 'You help with medical stuff.'
```

### 4. Use Category Correctly

```typescript
// ✅ GOOD: Category matches model type
await createPersona({
  id: 'gpt-medical',
  name: 'GPT Medical Advisor',
  category: 'cloud',  // Uses GPT-4 (cloud)
  settings: {
    maxTokens: 2000  // Cloud models have larger context
  }
})

await createPersona({
  id: 'local-helper',
  name: 'Local Assistant',
  category: 'local',  // Uses Ollama (local)
  settings: {
    maxTokens: 1000  // Local models may have smaller context
  }
})

// ⚠️ CONFUSING: Category doesn't match usage
await createPersona({
  id: 'gpt-advisor',
  category: 'local',  // Misleading - GPT is cloud-based
})
```

### 5. Don't Delete Default Personas

```typescript
// ✅ GOOD: Check if default before deleting
async function deletePersonaSafely(id: string) {
  const response = await fetch(`/api/personas/${id}`)
  const data = await response.json()
  
  if (data.data.is_default) {
    console.log('Cannot delete default persona')
    return false
  }
  
  await fetch(`/api/personas/${id}`, { method: 'DELETE' })
  return true
}

// ❌ BAD: Try to delete default
await fetch('/api/personas/default-cloud', { method: 'DELETE' })
// Returns 403 Forbidden
```

### 6. Handle Session Reassignment

```typescript
// ✅ GOOD: Inform user about reassignment
async function deletePersonaWithWarning(id: string) {
  const deleteRes = await fetch(`/api/personas/${id}`, { method: 'DELETE' })
  const data = await deleteRes.json()
  
  if (data.data.reassigned_to) {
    console.log(`Persona deleted.`)
    console.log(`${data.data.reassigned_to} is now the default for affected sessions.`)
  }
  
  return data
}

// ⚠️ OKAY: Delete without warning
// Sessions are still safe (reassigned automatically)
```

---

## Frontend Integration

### Vue Persona Selector Component

```vue
<template>
  <div class="persona-selector">
    <label>AI Persona</label>
    <select v-model="selectedPersona" @change="handleChange">
      <optgroup label="⭐ Default Personas">
        <option 
          v-for="persona in defaultPersonas" 
          :key="persona.id"
          :value="persona.id"
        >
          {{ persona.icon }} {{ persona.name }}
        </option>
      </optgroup>
      
      <optgroup label="Custom Personas" v-if="customPersonas.length > 0">
        <option 
          v-for="persona in customPersonas" 
          :key="persona.id"
          :value="persona.id"
        >
          {{ persona.icon }} {{ persona.name }}
        </option>
      </optgroup>
    </select>
    
    <p class="persona-description" v-if="selectedPersonaData">
      {{ selectedPersonaData.description }}
    </p>
    
    <button @click="showSettings = true" class="btn-secondary">
      ⚙️ Persona Settings
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const emit = defineEmits<{
  personaChanged: [personaId: string]
}>()

const personas = ref<any[]>([])
const selectedPersona = ref<string>('')
const showSettings = ref(false)

const defaultPersonas = computed(() => 
  personas.value.filter(p => p.is_default)
)

const customPersonas = computed(() => 
  personas.value.filter(p => !p.is_default)
)

const selectedPersonaData = computed(() => 
  personas.value.find(p => p.id === selectedPersona.value)
)

async function loadPersonas() {
  const response = await fetch('/api/personas')
  const data = await response.json()
  personas.value = data.data
  
  // Default to first persona
  if (data.data.length > 0) {
    selectedPersona.value = data.data[0].id
  }
}

function handleChange() {
  emit('personaChanged', selectedPersona.value)
}

onMounted(loadPersonas)
</script>

<style scoped>
.persona-selector {
  margin-bottom: 1rem;
}

select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 0.5rem;
}

.persona-description {
  font-size: 0.9rem;
  color: #666;
  margin: 0.5rem 0;
}
</style>
```

### Persona Settings Editor Component

```vue
<template>
  <div class="persona-editor">
    <h3>{{ isEdit ? 'Edit' : 'Create' }} Persona</h3>
    
    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label>ID *</label>
        <input 
          v-model="form.id" 
          :disabled="isEdit"
          placeholder="my-custom-persona"
          required
        />
        <small>Unique identifier (lowercase, hyphens allowed)</small>
      </div>
      
      <div class="form-group">
        <label>Name *</label>
        <input 
          v-model="form.name" 
          placeholder="My Custom Persona"
          required
        />
      </div>
      
      <div class="form-group">
        <label>Icon</label>
        <input 
          v-model="form.icon" 
          placeholder="🤖"
          maxlength="2"
        />
      </div>
      
      <div class="form-group">
        <label>Category</label>
        <select v-model="form.category">
          <option value="cloud">☁️ Cloud</option>
          <option value="local">💻 Local</option>
        </select>
      </div>
      
      <div class="form-group">
        <label>System Prompt *</label>
        <textarea 
          v-model="form.prompt" 
          rows="8"
          placeholder="You are a helpful assistant that..."
          required
        ></textarea>
      </div>
      
      <div class="form-group">
        <label>Description</label>
        <input 
          v-model="form.description" 
          placeholder="Brief description for users"
        />
      </div>
      
      <h4>Settings</h4>
      
      <div class="form-group">
        <label>Temperature: {{ form.settings.temperature }}</label>
        <input 
          v-model.number="form.settings.temperature" 
          type="range"
          min="0.1"
          max="2.0"
          step="0.1"
        />
        <small>Lower = focused, Higher = creative</small>
      </div>
      
      <div class="form-group">
        <label>Max Tokens: {{ form.settings.maxTokens }}</label>
        <input 
          v-model.number="form.settings.maxTokens" 
          type="range"
          min="50"
          max="4000"
          step="50"
        />
        <small>Maximum response length</small>
      </div>
      
      <div class="form-actions">
        <button type="submit" class="btn-primary">
          {{ isEdit ? 'Update' : 'Create' }} Persona
        </button>
        <button type="button" @click="$emit('cancel')" class="btn-secondary">
          Cancel
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const props = defineProps<{
  personaId?: string
}>()

const emit = defineEmits<{
  saved: [persona: any]
  cancel: []
}>()

const isEdit = !!props.personaId

const form = ref({
  id: '',
  name: '',
  icon: '🤖',
  category: 'cloud' as 'cloud' | 'local',
  prompt: '',
  description: '',
  settings: {
    temperature: 0.7,
    maxTokens: 1000,
    topP: 0.9,
    repeatPenalty: 1.1
  }
})

async function loadPersona() {
  if (!props.personaId) return
  
  const response = await fetch(`/api/personas/${props.personaId}`)
  const data = await response.json()
  form.value = data.data
}

async function handleSubmit() {
  const url = isEdit 
    ? `/api/personas/${props.personaId}`
    : '/api/personas'
  
  const method = isEdit ? 'PUT' : 'POST'
  
  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(form.value)
  })
  
  if (response.ok) {
    const data = await response.json()
    emit('saved', data.data)
  } else {
    const error = await response.json()
    alert(error.error.message)
  }
}

onMounted(() => {
  if (isEdit) loadPersona()
})
</script>

<style scoped>
.persona-editor {
  max-width: 600px;
  margin: 0 auto;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.form-group small {
  display: block;
  margin-top: 0.25rem;
  color: #666;
  font-size: 0.85rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
}
</style>
```

---

## Performance Considerations

### 1. List Query Performance

**Current**: Full table scan (no filters)
```sql
SELECT * FROM personas ORDER BY created_at ASC
```

**Performance**: Fast for typical persona counts (< 100)

**Future Optimization**: Add index if persona count grows large
```sql
CREATE INDEX idx_personas_created ON personas(created_at);
```

### 2. Deletion Transaction Safety

**Transaction Wrapper**: Ensures atomic reassignment + deletion

```typescript
db.prepare('BEGIN').run()
try {
  // Update sessions
  // Delete persona
  db.prepare('COMMIT').run()
} catch (error) {
  db.prepare('ROLLBACK').run()
  throw error
}
```

**Benefit**: No orphaned sessions if deletion fails

---

## Security Considerations

### 1. SQL Injection Protection

**Status**: ✅ Protected via parameterized queries

```typescript
// Safe
db.prepare('SELECT * FROM personas WHERE id = ?').get(id)

// Vulnerable (not used)
db.exec(`SELECT * FROM personas WHERE id = '${id}'`)
```

### 2. Input Validation

**Status**: ✅ Protected via Zod schemas

**Validates**:
- Required fields (id, name, prompt)
- String lengths (id max 50, name max 100)
- Numeric ranges (temperature 0.1-2.0, etc.)
- Enum values (category: 'cloud' | 'local')

### 3. Default Persona Protection

**Status**: ✅ Cannot delete default personas

```typescript
if (persona.is_default === 1) {
  return err(res, 403, 'FORBIDDEN', 'Cannot delete default persona')
}
```

**Benefit**: System always has fallback personas

### 4. ID Uniqueness

**Status**: ✅ Enforced via primary key + conflict check

```typescript
const exists = db.prepare('SELECT 1 FROM personas WHERE id = ?').get(id)
if (exists) {
  return err(res, 409, 'CONFLICT', 'Persona with this ID already exists')
}
```

---

## Testing Considerations

### Unit Test Scenarios

```typescript
describe('Personas Router', () => {
  describe('GET /api/personas', () => {
    it('should list all personas ordered by creation', async () => {
      await createTestPersona({ id: 'p3', created_at: '2024-03-01' })
      await createTestPersona({ id: 'p1', created_at: '2024-01-01' })
      await createTestPersona({ id: 'p2', created_at: '2024-02-01' })
      
      const response = await request(app).get('/api/personas')
      const ids = response.body.data.map((p: any) => p.id)
      
      expect(ids).toEqual(['p1', 'p2', 'p3'])
    })
  })
  
  describe('POST /api/personas', () => {
    it('should create persona with defaults', async () => {
      const response = await request(app)
        .post('/api/personas')
        .send({
          id: 'test-persona',
          name: 'Test Persona',
          prompt: 'You are a test assistant.'
        })
      
      expect(response.status).toBe(201)
      expect(response.body.data.settings.temperature).toBe(0.7)
      expect(response.body.data.is_default).toBe(false)
    })
    
    it('should prevent duplicate IDs', async () => {
      await createTestPersona({ id: 'duplicate' })
      
      const response = await request(app)
        .post('/api/personas')
        .send({
          id: 'duplicate',
          name: 'Test',
          prompt: 'Test'
        })
      
      expect(response.status).toBe(409)
      expect(response.body.error.code).toBe('CONFLICT')
    })
  })
  
  describe('DELETE /api/personas/:id', () => {
    it('should prevent deleting default personas', async () => {
      const defaultPersona = await createTestPersona({ 
        id: 'default-test', 
        is_default: 1 
      })
      
      const response = await request(app)
        .delete(`/api/personas/${defaultPersona.id}`)
      
      expect(response.status).toBe(403)
      expect(response.body.error.code).toBe('FORBIDDEN')
    })
    
    it('should reassign sessions on deletion', async () => {
      const persona = await createTestPersona({ id: 'to-delete', category: 'cloud' })
      const session = await createTestSession({ persona_id: 'to-delete' })
      
      const response = await request(app)
        .delete(`/api/personas/${persona.id}`)
      
      expect(response.status).toBe(200)
      expect(response.body.data.reassigned_to).toBeTruthy()
      
      // Verify session reassigned
      const updatedSession = db.prepare('SELECT * FROM sessions WHERE id = ?')
        .get(session.id)
      expect(updatedSession.persona_id).toBe(response.body.data.reassigned_to)
    })
  })
})
```

---

## Summary

The **Personas Router** provides complete management of AI assistant personalities:

**Endpoints (5 total)**:
- **GET /api/personas** - List all personas (ordered by creation)
- **GET /api/personas/:id** - Get specific persona details
- **POST /api/personas** - Create custom persona (unique ID required)
- **PUT /api/personas/:id** - Update persona (dynamic field updates)
- **DELETE /api/personas/:id** - Safe delete with session reassignment

**Key Features**:
- Custom system prompts for specialized AI behavior
- Tunable settings (temperature, tokens, top-p, repeat penalty)
- Category system (cloud vs local models)
- Default persona protection (cannot delete)
- Safe deletion (reassigns sessions to default)
- Conflict prevention (unique IDs enforced)

**Settings Ranges**:
- Temperature: 0.1-2.0 (default 0.7)
- Max Tokens: 50-4000 (default 1000)
- Top-P: 0.0-1.0 (default 0.9)
- Repeat Penalty: 0.8-2.0 (default 1.1)

**Use Cases**:
- Create specialized AI assistants (medical, coding, companion)
- Tune AI behavior for specific tasks
- Organize personas by model type (cloud/local)
- Switch between AI personalities mid-conversation
- Maintain consistent AI behavior across sessions

**Integration**:
Personas define AI behavior in sessions. Each session references a persona_id, which determines the system prompt and generation settings used for AI responses.
