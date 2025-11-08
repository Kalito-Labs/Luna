# Structured JSON Output Implementation Guide

**Date:** November 8, 2025  
**Purpose:** Prevent AI hallucinations with schema validation and post-response verification

---

## Why This Works

### The Problem
- ❌ Free-text responses allow AI to say "RX number not specified" even when it exists
- ❌ AI can mix up patients and claim it didn't
- ❌ No automatic way to verify correctness
- ❌ Conversation history contaminates responses

### The Solution
- ✅ Enforce strict JSON schema with required fields
- ✅ Validate AI response against database ground truth
- ✅ Automatically reject hallucinations
- ✅ Catch patient mix-ups with post-response validation

---

## Implementation

### 1. New Service: StructuredMedicationService

**File:** `backend/logic/structuredMedicationService.ts`

**Key Methods:**

```typescript
// Get ground truth data in structured format
getMedicationsStructured(patientId: string): MedicationListResponse | null

// Generate prompt with embedded schema and data
generateStructuredPrompt(patientId: string, patientName: string): string

// Validate AI response against database
validateMedicationResponse(
  requestedPatientId: string,
  aiResponse: Partial<MedicationListResponse>
): ValidationResult

// Get JSON schema for OpenAI function calling
getMedicationSchema(): object
```

### 2. Response Schema

```typescript
interface MedicationListResponse {
  patient_name: string              // REQUIRED - must match query
  patient_id: string                // Internal ID
  medication_count: number          // Total count
  medications: StructuredMedication[]  // Array with strict schema
}

interface StructuredMedication {
  name: string                     // REQUIRED
  generic_name?: string            // Optional
  dosage: string                   // REQUIRED
  frequency: string                // REQUIRED
  prescribing_doctor: string       // REQUIRED
  pharmacy: string                 // REQUIRED
  rx_number: string                // REQUIRED - no "not specified" allowed
  notes?: string                   // Optional
}
```

---

## Usage Example

### Basic Usage

```typescript
import { StructuredMedicationService } from './logic/structuredMedicationService'

const service = new StructuredMedicationService()

// 1. Get ground truth
const groundTruth = service.getMedicationsStructured('patient-id-123')

// 2. Generate prompt for AI with embedded schema
const prompt = service.generateStructuredPrompt('patient-id-123', 'Aurora Sanchez')

// 3. Send prompt to AI (AI must respond with JSON matching schema)
const aiResponse = await callAI(prompt)

// 4. Parse AI response
const parsedResponse = JSON.parse(aiResponse)

// 5. Validate against ground truth
const validation = service.validateMedicationResponse('patient-id-123', parsedResponse)

if (validation.valid) {
  // Response is correct - send to user
  return parsedResponse
} else {
  // Response has errors - reject and retry or show errors
  console.error('Validation failed:', validation.errors)
  return { error: 'AI response validation failed', details: validation.errors }
}
```

### Integration with OpenAI Function Calling

```typescript
import OpenAI from 'openai'

const openai = new OpenAI()
const service = new StructuredMedicationService()

async function getMedicationsWithValidation(patientId: string, patientName: string) {
  const prompt = service.generateStructuredPrompt(patientId, patientName)
  
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },  // Force JSON mode
  })
  
  const aiResponse = JSON.parse(completion.choices[0].message.content || '{}')
  
  // Validate response
  const validation = service.validateMedicationResponse(patientId, aiResponse)
  
  if (!validation.valid) {
    throw new Error(`Validation failed: ${validation.errors.join(', ')}`)
  }
  
  return aiResponse
}
```

---

## Validation Rules

### Automatic Checks

1. **Patient Name Match**
   - AI response `patient_name` must match database patient name
   - Case-insensitive comparison
   - Error if mismatch detected

2. **Medication Count**
   - Warning if AI returns different count than database
   - Helps catch partial responses

3. **RX Number Validation**
   - All RX numbers must exist in database for that patient
   - Error if AI invents RX numbers
   - Error if AI says "not specified", "N/A", or leaves empty

4. **Required Fields**
   - All medications must have: name, dosage, frequency, prescribing_doctor, pharmacy, rx_number
   - Error for any missing required field

5. **Medication Name Validation**
   - All medication names must exist in database for that patient
   - Error if AI invents medications
   - Catches hallucinations from conversation history

---

## Test Results

Run the example:
```bash
npx tsx backend/tests/structuredMedication.example.ts
```

### Example 3: Valid Response ✅
```json
{
  "valid": true,
  "errors": [],
  "warnings": []
}
```

### Example 4: Patient Mix-up ❌
```json
{
  "valid": false,
  "errors": [
    "Patient mismatch: AI returned \"Basilio Sanchez\" but should be \"Aurora Sanchez\"",
    "Hallucinated RX number: 9081111 does not exist for this patient",
    "Hallucinated medication: \"Insulin\" not in database for this patient"
  ],
  "warnings": [
    "Medication count mismatch: AI returned 1 but database has 8"
  ]
}
```

### Example 5: Missing RX Numbers ❌
```json
{
  "valid": false,
  "errors": [
    "Medication 0 (Belsomra): missing or invalid RX number",
    "Medication 1 (Myrbetriq): missing or invalid RX number"
  ]
}
```

---

## Advantages Over Free Text

| Issue | Free Text | Structured JSON |
|-------|-----------|-----------------|
| AI says "not specified" | ❌ Allowed | ✅ Caught by validation |
| Missing RX numbers | ❌ No detection | ✅ Error raised |
| Patient mix-up | ❌ AI can deny | ✅ Automatic detection |
| Hallucinated meds | ❌ Hard to catch | ✅ Validated against DB |
| Conversation contamination | ❌ No prevention | ✅ Schema enforces fresh data |
| Parsing errors | ❌ Manual checking | ✅ Automatic JSON validation |

---

## Migration Path

### Phase 1: Parallel Testing (Current)
- Keep existing free-text responses
- Add structured endpoint for testing
- Compare results

### Phase 2: Gradual Rollout
- Use structured for medication queries only
- Keep free-text for other queries
- Monitor error rates

### Phase 3: Full Migration
- Replace free-text with structured for all medical data
- Extend to appointments, vitals, etc.
- Add structured response for complex queries

---

## API Endpoint Example

```typescript
// backend/routes/medicationsRouter.ts

import { StructuredMedicationService } from '../logic/structuredMedicationService'

router.get('/medications/structured/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params
    const service = new StructuredMedicationService()
    
    const data = service.getMedicationsStructured(patientId)
    
    if (!data) {
      return res.status(404).json({ error: 'Patient not found' })
    }
    
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/medications/validate-response/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params
    const aiResponse = req.body
    const service = new StructuredMedicationService()
    
    const validation = service.validateMedicationResponse(patientId, aiResponse)
    
    res.json(validation)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})
```

---

## Next Steps

1. **Test in Production**
   - Try structured approach for medication queries
   - Compare with free-text results
   - Measure validation error rates

2. **Extend to Other Data**
   - Appointments (structured)
   - Vitals (structured)
   - Patient info (structured)

3. **Add Retry Logic**
   ```typescript
   async function getMedicationsWithRetry(patientId: string, maxRetries = 3) {
     for (let i = 0; i < maxRetries; i++) {
       const response = await getMedicationsWithValidation(patientId)
       const validation = service.validateMedicationResponse(patientId, response)
       
       if (validation.valid) {
         return response
       }
       
       console.log(`Attempt ${i + 1} failed, retrying...`, validation.errors)
     }
     
     throw new Error('Max retries exceeded')
   }
   ```

4. **UI Integration**
   - Show validation errors to user
   - Offer "regenerate" button if validation fails
   - Display confidence score based on validation

---

## Limitations

### What This Solves
- ✅ RX number omissions
- ✅ Patient mix-ups
- ✅ Hallucinated medications
- ✅ Missing required fields
- ✅ Invalid RX numbers

### What This Doesn't Solve
- ❌ AI still needs good base model (gpt-4o, Claude 3.5)
- ❌ Requires JSON mode support (not all models have it)
- ❌ Adds latency (parsing + validation)
- ❌ More complex than free-text

### When to Use
- ✅ Critical medical data (medications, dosages)
- ✅ Data with strict requirements (RX numbers mandatory)
- ✅ When accuracy > conversational tone
- ✅ When automatic validation needed

### When to Avoid
- ❌ Casual conversations
- ❌ Subjective questions ("How are they feeling?")
- ❌ Open-ended advice
- ❌ When speed > accuracy

---

## Files Created

1. `backend/logic/structuredMedicationService.ts` - Main service
2. `backend/tests/structuredMedication.example.ts` - Demo and tests
3. `docs/fixes/structured-json-implementation.md` - This guide
