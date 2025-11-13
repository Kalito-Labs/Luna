# Luna Context Service Modernization Task

## Overview
Transform the `eldercareContextService.ts` to align with Luna mental health practice, rename to `lunaContextService.ts`, and clean up all eldercare-specific code.

## Key Decisions
- **Full AI Access**: All AI models get full context access (remove privacy filtering)
- **Remove Eldercare**: Replace all eldercare terminology with mental health
- **Remove Provider Logic**: Healthcare providers table was removed
- **Remove Caregiver Logic**: You are the therapist, not a "caregiver"
- **Leverage Structured Services**: Use existing structured services for appointments/medications

## 🔧 CRITICAL FIXES NEEDED

### 1. File Rename & Class Name
- [x] **File**: Rename `eldercareContextService.ts` → `lunaContextService.ts` 
- [x] **Class**: `EldercareContextService` → `LunaContextService`
- [x] **Import References**: Update all imports in other files

### 2. Header Documentation (Lines 1-10)
```typescript
// CURRENT
/**
 * EldercareContextService
 * 
 * Provides read-only access to eldercare database for AI context integration.
 * Enables AI models to reference patient data, medications, and appointments.
 * 
 * Security: Read-only operations only. AI cannot modify eldercare data.
 * Privacy: Trusted models (local + your controlled cloud APIs) get full context.
 *          Unknown cloud models get filtered data for privacy protection.
 */

// CHANGE TO
/**
 * LunaContextService
 * 
 * Provides AI context integration for Luna mental health practice.
 * Enables AI models to reference patient data, medications, and appointments.
 * 
 * Security: Read-only operations only. AI cannot modify patient data.
 * Privacy: All models get full context access for Caleb's practice.
 */
```

### 3. Remove Interfaces Entirely
- **DELETE**: `ProviderContext` interface (Lines 15-25) - healthcare providers removed
- **DELETE**: `CaregiverContext` interface (Lines 76-81) - you're the therapist, not caregiver

### 4. Update MedicationContext Interface (Lines 42-58)
```typescript
// REMOVE these provider-related fields:
  prescribingDoctorProvider?: ProviderContext
  pharmacyProvider?: ProviderContext

// KEEP these simple string fields:
  prescribingDoctor?: string
  pharmacy?: string
```

### 5. Update AppointmentContext Interface (Lines 60-73)
```typescript
// REMOVE these provider-related fields:
  providerId?: string
  provider?: ProviderContext

// KEEP these simple fields (therapist appointments):
  appointmentType?: string
  location?: string
  status: string
```

### 6. Update Context Type (Lines 83-88)
```typescript
// CURRENT
export type EldercareContext = {
  patients: PatientContext[];
  medications: MedicationContext[];
  recentAppointments: AppointmentContext[];
  caregiver: CaregiverContext | null;
  summary: string;
};

// CHANGE TO
export type LunaContext = {
  patients: PatientContext[];
  medications: MedicationContext[];
  recentAppointments: AppointmentContext[];
  summary: string;
};
```

### 7. Remove Privacy System (Lines 101-126)
```typescript
// DELETE ENTIRELY - ALL models get full access
- TRUSTED_MODELS array
- isTrustedModel() method
- All includePrivateData parameters and logic

// REASONING: You're the only user, no need for privacy tiers
```

### 8. Clean getPatients Method (Lines 154-207)
```typescript
// REMOVE:
- includePrivateData parameter
- All privacy conditional logic
- Dead provider lookup comment (Lines 175-176)

// SIMPLIFY: Always return all patient data
```

### 9. Update getMedications Method (Lines 210-263)
```typescript
// REMOVE:
- includePrivateData parameter
- Provider matching logic (already cleaned)

// KEEP: StructuredMedicationService integration (working well)
```

### 10. Fix getRecentAppointments Method (Lines 267-357)
**CRITICAL DATABASE ERROR**: Still joins `healthcare_providers` table that doesn't exist!

```sql
-- CURRENT (BROKEN)
LEFT JOIN healthcare_providers p ON a.provider_id = p.id

-- FIX: Remove provider JOIN entirely
SELECT a.id, a.patient_id, a.appointment_date, a.appointment_time, 
       a.appointment_type, a.location, a.status, 
       a.preparation_notes, a.notes, a.outcome_summary, a.follow_up_required
FROM appointments a
WHERE a.appointment_date >= ?
```

**ALTERNATIVE**: Use `StructuredAppointmentService` instead (but it also has the same JOIN issue!)

### 11. Remove getCaregiver Method Entirely (Lines 362-394)
```typescript
// DELETE: Entire getCaregiver method - you're the therapist
// UPDATE: LunaContext type to remove caregiver field
```

### 12. Update generateContextSummary Method (Lines 404-500)
```typescript
// CHANGES:
- "## Eldercare Context Summary" → "## Mental Health Practice Summary"
- Remove entire caregiver summary section (Lines 485-495)
- Update patient description focus (mental health vs eldercare)
- Keep appointments/medications sections (good as-is)
```

### 13. Rename & Update Main Methods
```typescript
// RENAME METHODS:
getEldercareContext() → getLunaContext()

// UPDATE RETURN TYPES:
EldercareContext → LunaContext

// UPDATE COMMENTS:
"eldercare context" → "mental health context"
"eldercare data" → "patient data"
```

### 14. Clean findPatientByReference Method (Lines 527-548)
```typescript
// PROBLEM: Searches for "relationship" field that doesn't exist in mental health
// FIX: Remove relationship search logic, only search by name

// CURRENT SQL
AND (LOWER(name) LIKE LOWER(?) OR LOWER(relationship) LIKE LOWER(?))

// CHANGE TO  
AND LOWER(name) LIKE LOWER(?)
```

### 15. Update All Comments & Logging
- Line 605: `console.log('[EldercareContext]')` → `console.log('[LunaContext]')`
- Line 656: `"No eldercare data available"` → `"No patient data available"`
- All method comments: Replace "eldercare" with "mental health" or "patient"

## 🚨 STRUCTURAL SERVICE ISSUES

### StructuredAppointmentService.ts Problems
**CRITICAL**: Lines 54-55 still JOIN `healthcare_providers` table that doesn't exist!
```sql
LEFT JOIN healthcare_providers p ON a.provider_id = p.id
```

**FIXES NEEDED**:
1. Remove provider JOIN from SQL query
2. Remove `provider_name` and `provider_specialty` from interface
3. Update `StructuredAppointment` interface to remove provider fields
4. Since you're the therapist, appointments are just with YOU

### Integration Strategy
Rather than duplicate appointment logic, recommend:
1. Fix `StructuredAppointmentService` provider JOIN issue first
2. Use `StructuredAppointmentService` in `LunaContextService` 
3. Keep `StructuredMedicationService` as-is (works perfectly)

## 📋 IMPLEMENTATION PLAN

### Phase 1: Critical Database Fixes
1. **Fix StructuredAppointmentService.ts**: Remove healthcare_providers JOIN
2. **Test**: Verify appointments query works

### Phase 2: Interface Cleanup  
1. Remove `ProviderContext` and `CaregiverContext` interfaces
2. Clean `MedicationContext` and `AppointmentContext` interfaces
3. Rename `EldercareContext` → `LunaContext`

### Phase 3: Method Updates
1. Remove privacy system entirely 
2. Remove `getCaregiver` method
3. Fix `getRecentAppointments` or replace with `StructuredAppointmentService`
4. Update `findPatientByReference` to remove relationship search

### Phase 4: Rename & Terminology
1. Rename file to `lunaContextService.ts`
2. Rename class to `LunaContextService` 
3. Update all method names and comments
4. Replace all "eldercare" with "mental health"

### Phase 5: Testing
1. Check imports in all other files
2. Verify AI context generation works
3. Test patient lookup and session tracking

## 🎯 SUCCESS CRITERIA
- [ ] No eldercare terminology remains
- [ ] No database JOIN errors 
- [ ] All AI models get full patient context
- [ ] Clean mental health practice focus
- [ ] Leverages existing structured services
- [ ] File properly renamed to `lunaContextService.ts`

## ⚠️ RISKS & CONSIDERATIONS
1. **Import Updates**: All files importing this service need updates
2. **Database Queries**: Must not reference removed tables
3. **Router Integration**: Verify routers still work after rename
4. **Session Tracking**: Ensure patient focus logic still works
5. **Structured Services**: Fix appointment service provider issue

---

**Priority**: HIGH - Contains database errors that will break appointment queries
**Estimated Time**: 2-3 hours for complete transformation
**Dependencies**: Must fix StructuredAppointmentService first