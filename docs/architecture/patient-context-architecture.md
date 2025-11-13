# Patient Context Architecture - Query Router & Database Integration

## Current Status: Temporary Hardcoded Solution ⚠️

**Date**: November 13, 2025  
**Status**: Functional but needs refactoring for scalability

## Overview

This document explains how patient context detection works in Luna, the current temporary implementation, and the proper architectural approach for future development.

## Current Implementation (Temporary)

### Location: `backend/logic/queryRouter.ts`

```typescript
export function extractPatientReference(query: string): string | null {
  const lowerQuery = query.toLowerCase()
  
  // Check for specific names (HARDCODED - TEMPORARY)
  if (lowerQuery.includes('caleb')) {
    return 'caleb'
  }
  if (lowerQuery.includes('aurora')) {
    return 'aurora'
  }
  if (lowerQuery.includes('basilio')) {
    return 'basilio'
  }
  
  // Check for relationship references
  if (lowerQuery.match(/\b(mom|mother|mama)\b/i)) {
    return 'mother'
  }
  if (lowerQuery.match(/\b(dad|father|papa)\b/i)) {
    return 'father'
  }
  
  return null
}
```

### Why This is Temporary

1. **Hardcoded Family Members**: Names are directly coded into the router
2. **Not Scalable**: Adding new patients requires code changes
3. **Maintenance Burden**: Every family member needs manual coding
4. **Separation of Concerns**: Router shouldn't know about specific patients

## Proper Architecture (Recommended)

### The Right Data Flow

```
User Query → QueryRouter (pattern detection) → LunaContextService (database lookup) → Patient Match
```

### Recommended Refactor

```typescript
// queryRouter.ts (FUTURE IMPLEMENTATION)
export async function extractPatientReference(
  query: string, 
  lunaContextService: LunaContextService
): Promise<string | null> {
  const lowerQuery = query.toLowerCase()
  
  // Extract potential names from query using NLP patterns
  const potentialNames = extractNamesFromQuery(lowerQuery)
  
  // Use LunaContextService to check against database
  for (const name of potentialNames) {
    const patient = lunaContextService.findPatientByReference(name)
    if (patient) {
      return name  // Return first match
    }
  }
  
  // Check for relationship references (these can stay hardcoded as they're universal)
  if (lowerQuery.match(/\b(mom|mother|mama)\b/i)) {
    return 'mother'
  }
  if (lowerQuery.match(/\b(dad|father|papa)\b/i)) {
    return 'father'
  }
  
  return null
}

function extractNamesFromQuery(query: string): string[] {
  // NLP-based name extraction logic
  // Could use patterns like "my name is X", "I am X", "X's medication", etc.
  const patterns = [
    /(?:my name is|i am|i'm)\s+(\w+)/i,
    /\b([A-Z][a-z]+)\s+(?:medication|appointment|taking)/i,
    // Add more patterns as needed
  ]
  
  const names: string[] = []
  patterns.forEach(pattern => {
    const match = query.match(pattern)
    if (match && match[1]) {
      names.push(match[1].toLowerCase())
    }
  })
  
  return names
}
```

## Current Data Sources

### Database Schema
Patient context lives in the **patients table**:

```sql
-- patients table structure
CREATE TABLE patients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  date_of_birth TEXT,
  gender TEXT,
  phone TEXT,
  city TEXT,
  state TEXT,
  occupation TEXT,
  occupation_description TEXT,
  languages TEXT,
  primary_doctor_id TEXT,
  notes TEXT,
  active INTEGER DEFAULT 1
);
```

### LunaContextService Methods
- `findPatientByReference(reference: string)`: Database lookup for patient names
- `getPatients()`: Get all active patients
- `generateContextualPrompt()`: Session-aware context generation

## Session Management

### Current Flow
1. User mentions name → `extractPatientReference()` detects it
2. `agentService.ts` calls `lunaContextService.findPatientByReference()`
3. If found, updates session: `UPDATE sessions SET patient_id = ? WHERE id = ?`
4. Future queries use session context automatically

### Session Storage
```sql
-- sessions table
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  patient_id TEXT,  -- Links to patients.id
  created_at TEXT,
  updated_at TEXT
);
```

## Family Context Storage

### Where Family Information Lives

**❌ NOT in queryRouter.ts** (current temporary location)  
**✅ IN the database patients table**

```sql
-- Example family data
INSERT INTO patients (id, name, age, relationship_to_caleb) VALUES 
('caleb-1', 'Caleb Sanchez', 39, 'self'),
('aurora-1', 'Aurora Sanchez', 65, 'mother'), 
('basilio-1', 'Basilio Sanchez', 67, 'father');
```

### Relationship Mapping

The proper place for family relationships is either:
1. **Extended patients table** with relationship fields
2. **Separate relationships table**:

```sql
-- Future: relationships table
CREATE TABLE relationships (
  id TEXT PRIMARY KEY,
  patient_id TEXT REFERENCES patients(id),
  related_patient_id TEXT REFERENCES patients(id),
  relationship_type TEXT,  -- 'mother', 'father', 'son', etc.
  notes TEXT
);
```

## Performance Considerations

### Current Approach (Fast but Limited)
- **Hardcoded lookups**: O(1) string matching
- **No database calls** in query router
- **Immediate response** for known names

### Proper Approach (Scalable but Requires Optimization)
- **Database lookups**: Requires database queries
- **Caching strategy** needed for frequently accessed patients
- **Fuzzy matching** capabilities for variations in names

## Migration Path

### Phase 1: Keep Current System (DONE ✅)
- Current hardcoded approach works for immediate family
- Fixes session tracking issue
- Maintains performance

### Phase 2: Database Integration (FUTURE)
1. **Add fuzzy matching** to `LunaContextService.findPatientByReference()`
2. **Implement caching layer** for patient lookups
3. **Refactor queryRouter** to use database lookups
4. **Add relationship table** for complex family structures

### Phase 3: NLP Enhancement (FUTURE)
1. **Advanced name extraction** using NLP libraries
2. **Context-aware matching** (nicknames, variations)
3. **Multi-language support** for patient names

## Testing Strategy

### Current Tests
- **Backend integration tests**: Verify session tracking works
- **Manual testing**: Confirm family name recognition

### Recommended Test Suite
```typescript
// tests/patientContext.test.ts (FUTURE)
describe('Patient Context Detection', () => {
  test('should recognize direct name mentions', async () => {
    const result = await extractPatientReference('Caleb needs medication', lunaService)
    expect(result).toBe('caleb')
  })
  
  test('should handle relationship references', async () => {
    const result = await extractPatientReference('My mom has an appointment', lunaService)
    expect(result).toBe('mother')
  })
  
  test('should query database for unknown names', async () => {
    // Test dynamic database lookup
  })
})
```

## Configuration Management

### Current Configuration
All names hardcoded in `queryRouter.ts` - requires code changes.

### Recommended Configuration
```json
// config/family.json (FUTURE)
{
  "relationships": {
    "mother": ["mom", "mama", "mother", "ma"],
    "father": ["dad", "papa", "father", "pa"],
    "self": ["me", "myself", "I"]
  },
  "aliases": {
    "caleb": ["cal", "calito"],
    "aurora": ["aura", "abuela"]
  }
}
```

## Security Considerations

### Current Security
- **No sensitive data** in queryRouter (just name patterns)
- **Patient data** secured in database with proper access controls

### Future Security
- **Validate all user inputs** before database queries
- **Sanitize extracted names** to prevent SQL injection
- **Audit logging** for patient context changes

## Conclusion

The current hardcoded approach in `queryRouter.ts` is a **functional temporary solution** that:
- ✅ Fixes the immediate session tracking issue
- ✅ Provides fast pattern matching
- ✅ Works for the current family setup
- ❌ Is not scalable for more patients
- ❌ Requires code changes for new family members

**For production scaling**: Migrate to database-driven patient context detection with proper caching and NLP-based name extraction.

---

**Next Steps:**
1. **Keep current system** until user base grows
2. **Monitor performance** of session tracking
3. **Plan migration** when adding non-family patients
4. **Implement proper architecture** as described above