# Database Cleanup Recommendations

**Generated:** November 13, 2025  
**Database:** Luna Mental Health Companion  
**Analysis Based On:** Complete schema analysis and codebase review

## Executive Summary

The Luna database is well-structured and healthy overall, but contains one unused table (`vitals`) and one broken foreign key constraint that should be addressed. The recommendations focus on simplifying the schema to match the mental health companion use case.

## Cleanup Candidates

### 🔴 Priority 1: Remove Unused Table

#### `vitals` Table - RECOMMENDED FOR REMOVAL

**Current State:**
- 0 records
- Complete table structure with 10 columns
- Foreign key to patients table
- Associated indexes and route handlers

**Analysis:**
- **Code References:** Limited integration (route exists, service layer mentions)
- **Use Case Alignment:** Mental health companion doesn't require detailed vitals tracking
- **Data Status:** No data has ever been recorded
- **Maintenance Cost:** Adds complexity without providing value

**Impact Assessment:**
- ✅ **Low Risk** - No data will be lost
- ✅ **Code Impact** - Remove route and service references
- ✅ **Performance** - Reduces database complexity
- ✅ **Maintenance** - Simplifies schema

**Files to Modify:**
```
backend/routes/vitalsRouter.ts - Remove entire file
backend/server.ts - Remove vitals route registration
backend/logic/eldercareContextService.ts - Remove vitals methods
backend/logic/queryRouter.ts - Remove vitals query routing
backend/db/init.ts - Remove vitals table creation
```

**Removal Script:**
```sql
-- Drop vitals table and related indexes
DROP TABLE IF EXISTS vitals;
```

---

### 🟡 Priority 2: Fix Broken Foreign Key

#### `appointments.provider_id` - BROKEN REFERENCE

**Current State:**
- References `healthcare_providers` table that doesn't exist
- Causes foreign key constraint violations
- Currently set to NULL in existing appointment

**Options:**

#### Option A: Remove provider_id Column ✅ RECOMMENDED
**Pros:**
- Simplifies schema
- Uses existing `provider_name` field
- Matches single-user, simple appointment tracking use case
- No additional tables needed

**Cons:**
- Less normalized (provider data in appointment record)
- No provider contact information storage

**Implementation:**
```sql
-- Create new appointments table without provider_id
CREATE TABLE appointments_new (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  appointment_date TEXT NOT NULL,
  appointment_time TEXT,
  appointment_type TEXT,
  location TEXT,
  notes TEXT,
  preparation_notes TEXT,
  status TEXT DEFAULT 'scheduled',
  outcome_summary TEXT,
  follow_up_required INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  provider_name TEXT,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

-- Copy data
INSERT INTO appointments_new SELECT 
  id, patient_id, appointment_date, appointment_time, appointment_type,
  location, notes, preparation_notes, status, outcome_summary, 
  follow_up_required, created_at, updated_at, provider_name
FROM appointments;

-- Replace table
DROP TABLE appointments;
ALTER TABLE appointments_new RENAME TO appointments;

-- Recreate indexes
CREATE INDEX idx_appointments_patient_date ON appointments(patient_id, appointment_date ASC);
CREATE INDEX idx_appointments_status_date ON appointments(status, appointment_date ASC);
```

#### Option B: Create healthcare_providers Table
**Pros:**
- Properly normalized design
- Enables provider contact information
- Future-proof for multiple providers

**Cons:**
- Adds complexity for single-user app
- Requires additional data entry
- Over-engineered for current use case

#### Option C: Make provider_id Nullable
**Pros:**
- Quick fix
- Maintains current structure

**Cons:**
- Broken reference remains a design flaw
- Confusing to have unused foreign key

**Recommendation:** **Option A** - Remove provider_id column for simplicity

---

## Schema Improvements

### 📝 Priority 3: Documentation Updates

#### Update Existing Documentation
- `docs/db/database-schema.md` - Sync with current schema
- TypeScript interfaces - Match database columns
- API documentation - Reflect current endpoints

#### Column Naming Standardization
**Current Mix:**
- Snake_case: `patient_id`, `created_at`, `appointment_date`
- CamelCase: `maxTokens`, `topP`, `repeatPenalty`

**Recommendation:** Stick with **snake_case** for consistency with SQLite conventions

#### Remove Legacy Columns in `patients`
**Candidates for removal:**
- `doctor_address` - NULL and unused
- `doctor_phone` - NULL and unused  
- `primary_doctor` - Redundant with `primary_doctor_id`

**Keep for now:** These don't impact performance and may be useful for data import/migration

---

## Implementation Plan

### Phase 1: Remove Vitals Table ✅
1. **Backup database** 
2. **Remove code references**:
   ```bash
   # Remove route file
   rm backend/routes/vitalsRouter.ts
   
   # Update server.ts (remove import and route registration)
   # Update eldercareContextService.ts (remove vitals methods)
   # Update queryRouter.ts (remove vitals routing)
   ```
3. **Drop table**:
   ```sql
   DROP TABLE IF EXISTS vitals;
   ```
4. **Test application** - Ensure no broken references

### Phase 2: Fix Appointments Foreign Key ✅
1. **Backup database**
2. **Remove provider_id column** (using script above)
3. **Update TypeScript interfaces**
4. **Update appointment service code**
5. **Test appointment functionality**

### Phase 3: Documentation Update ✅
1. **Update schema documentation**
2. **Update TypeScript types** 
3. **Review API documentation**
4. **Update database initialization code**

---

## Safety Checklist

### Before Any Changes
- [ ] **Full database backup created**
- [ ] **Code references identified**
- [ ] **Test environment validated**
- [ ] **Rollback plan prepared**

### For Each Table/Column Removal
- [ ] **Confirmed 0 rows** in table/column
- [ ] **No application code dependencies** found
- [ ] **Foreign key impacts** assessed
- [ ] **Index cleanup** planned
- [ ] **User approval** obtained

### After Changes  
- [ ] **Application starts successfully**
- [ ] **All endpoints respond correctly**
- [ ] **No foreign key violations**
- [ ] **Performance not degraded**
- [ ] **Documentation updated**
- [ ] **Changes committed to git**

---

## Risk Assessment

### Low Risk ✅
- **Removing `vitals` table** - No data, minimal code integration
- **Removing unused columns** - No data dependency

### Medium Risk ⚠️  
- **Modifying `appointments` table** - Has active data, requires careful migration
- **Foreign key changes** - Could impact data integrity

### High Risk ❌
- **Removing core tables** - `patients`, `medications`, `sessions` are essential
- **Changing primary keys** - Would break all references

---

## Expected Benefits

### After Cleanup
1. **Simpler Schema** - Remove unused complexity
2. **Better Performance** - Fewer unused indexes and tables
3. **Clearer Documentation** - Accurate schema representation  
4. **Easier Maintenance** - Fewer components to manage
5. **Focused Design** - Schema matches mental health companion use case

### Metrics
- **Tables:** 10 → 9 (-1)
- **Foreign Keys:** 8 → 6 (-2, fixing 1 broken)
- **Indexes:** 7 → 6 (-1)
- **Database Size:** ~208KB → ~200KB (minimal change)

---

## Alternative: Keep Everything

### If No Cleanup is Performed

**Pros:**
- No risk of breaking anything
- Preserves future extensibility options
- No migration effort required

**Cons:**
- Broken foreign key remains
- Unused table adds confusion
- Schema doesn't match actual use case
- Documentation inaccuracy continues

**Recommendation:** Proceed with cleanup for a cleaner, more maintainable system.

---

## Implementation Scripts

### Complete Cleanup Script
```javascript
// cleanup-database.js
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, 'db/kalito.db');
console.log('🔧 Starting database cleanup...');

try {
  const db = new Database(dbPath);
  
  // Enable foreign keys
  db.pragma('foreign_keys = ON');
  
  console.log('📋 Removing vitals table...');
  db.exec('DROP TABLE IF EXISTS vitals');
  console.log('✅ Vitals table removed');
  
  console.log('📋 Fixing appointments table...');
  db.transaction(() => {
    // Create new appointments table without provider_id
    db.exec(`
      CREATE TABLE appointments_new (
        id TEXT PRIMARY KEY,
        patient_id TEXT NOT NULL,
        appointment_date TEXT NOT NULL,
        appointment_time TEXT,
        appointment_type TEXT,
        location TEXT,
        notes TEXT,
        preparation_notes TEXT,
        status TEXT DEFAULT 'scheduled',
        outcome_summary TEXT,
        follow_up_required INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        provider_name TEXT,
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
      );
    `);
    
    // Copy data (excluding provider_id)
    db.exec(`
      INSERT INTO appointments_new (
        id, patient_id, appointment_date, appointment_time, appointment_type,
        location, notes, preparation_notes, status, outcome_summary,
        follow_up_required, created_at, updated_at, provider_name
      )
      SELECT 
        id, patient_id, appointment_date, appointment_time, appointment_type,
        location, notes, preparation_notes, status, outcome_summary,
        follow_up_required, created_at, updated_at, provider_name
      FROM appointments;
    `);
    
    // Replace table
    db.exec('DROP TABLE appointments');
    db.exec('ALTER TABLE appointments_new RENAME TO appointments');
    
    // Recreate indexes
    db.exec(`
      CREATE INDEX idx_appointments_patient_date 
      ON appointments(patient_id, appointment_date ASC)
    `);
    db.exec(`
      CREATE INDEX idx_appointments_status_date 
      ON appointments(status, appointment_date ASC)
    `);
  })();
  
  console.log('✅ Appointments table fixed');
  
  // Verify foreign keys
  const fkCheck = db.pragma('foreign_key_check');
  if (fkCheck.length > 0) {
    console.error('❌ Foreign key violations found:', fkCheck);
  } else {
    console.log('✅ Foreign key integrity verified');
  }
  
  db.close();
  console.log('🎉 Database cleanup completed successfully!');
  
} catch (error) {
  console.error('❌ Cleanup failed:', error.message);
  process.exit(1);
}
```

**Usage:**
```bash
cd backend
node cleanup-database.js
```

---

**Created:** November 13, 2025  
**Status:** Ready for implementation  
**Estimated Time:** 30 minutes  
**Risk Level:** Low to Medium