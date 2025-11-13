# Database Path Consolidation: Dual Database Issue Resolution

  

**Date:** November 1, 2025

**Project:** Luna Mental Health App

**Severity:** Critical - Data Isolation Bug

**Status:** ✅ Resolved

  

## 🚨 Issue Summary

  

The Luna application was experiencing a critical data isolation bug where the AI mental health companion could not access user journal entries, despite the data being properly saved to the database. Investigation revealed the application was inadvertently creating and using **two separate database files** in different locations.

  

## 🔍 Root Cause Analysis

  

### The Flawed Path Logic

  

The issue originated from conditional path resolution logic in `/backend/db/db.ts`:

  

```typescript

// PROBLEMATIC CODE (ORIGINAL)

const dbFile = path.resolve(__dirname, __dirname.includes('dist') ? '../db/kalito.db' : './kalito.db')

```

  

This logic attempted to handle different directory structures between development and production environments but created unintended consequences.

  

### How It Created Two Databases

  

**🟢 Development Mode Scenario:**

- **Context:** Running TypeScript source files directly (`npm run dev`)

- **`__dirname` Value:** `/home/kalito/kalito-labs/Luna/backend/db`

- **Condition:** `__dirname.includes('dist')` = `false`

- **Resolved Path:** `/home/kalito/kalito-labs/Luna/backend/db/kalito.db` ✅

- **Result:** Journal entries saved here

  

**🔴 Production/Compiled Mode Scenario:**

- **Context:** Running compiled JavaScript files

- **`__dirname` Value:** `/home/kalito/kalito-labs/Luna/backend/dist/db`

- **Condition:** `__dirname.includes('dist')` = `true`

- **Resolved Path:** `/home/kalito/kalito-labs/Luna/backend/dist/db/kalito.db` ❌

- **Result:** AI looked for data here (empty database)

  

### The Data Isolation Problem

  

1. **User Action:** Save journal entry → Development mode → Data written to `/backend/db/kalito.db`

2. **AI Query:** Request journal data → Compiled service → Reads from `/backend/dist/db/kalito.db`

3. **Result:** AI returns empty context because databases are separate files

  

## 💔 Impact Assessment

  

### Functional Impact

- **AI Context Failure:** Mental health AI companion couldn't reference user's journal entries

- **Personalization Loss:** AI responses were generic instead of personalized based on user data

- **Feature Breakdown:** Mental health context service appeared non-functional

  

### User Experience Impact

- **Expectation Mismatch:** Users expected AI to know their journal content

- **Trust Degradation:** AI appeared "unintelligent" or "broken"

- **Support Failure:** Core mental health companion functionality compromised

  

### Development Impact

- **Debugging Complexity:** Multiple database locations obscured troubleshooting

- **Data Inconsistency:** Different environments seeing different data states

- **Testing Complications:** Test results varied by execution context

  

## 🛠️ Solution Implementation

  

### 1. Path Logic Consolidation

  

**Replaced conditional path logic with absolute path resolution:**

  

```typescript

// OLD (PROBLEMATIC)

const dbFile = path.resolve(__dirname, __dirname.includes('dist') ? '../db/kalito.db' : './kalito.db')

  

// NEW (FIXED)

const dbFile = path.resolve(process.cwd(), 'backend/db/kalito.db')

```

  

### 2. Single Source of Truth

  

**Benefits of `process.cwd()` approach:**

- **Environment Agnostic:** Works consistently in development and production

- **Absolute Reference:** Always resolves from project root directory

- **No Context Dependency:** Immune to compilation directory structure changes

  

### 3. Database Cleanup Process

  

**Systematic removal of duplicate databases:**

  

```bash

# 1. Identify all database files

find /home/kalito/kalito-labs/Luna -name "*.db" -type f

  

# Result showed multiple locations:

# - /backend/db/kalito.db (correct location with user data)

# - /backend/dist/db/kalito.db (empty, AI was reading from here)

  

# 2. Remove incorrect locations

rm -rf backend/dist/db

  

# 3. Update both db.ts and init.ts to use single path

# 4. Rebuild application with corrected logic

```

  

### 4. Data Migration & Validation

  

**Ensured data integrity during consolidation:**

- Verified user journal entries in correct database location

- Updated privacy settings (`is_private = 0`) to enable AI access

- Rebuilt application with new path logic

- Validated single database location across entire project

  

## ✅ Resolution Verification

  

### Post-Fix Validation

  

1. **Single Database Confirmation:**

```bash

find /home/kalito/kalito-labs/Luna -name "*.db" -type f

# Result: Only /backend/db/kalito.db exists

```

  

2. **AI Access Verification:**

- Journal entries marked as non-private (`is_private = 0`)

- MentalHealthContextService can retrieve user data

- AI context generation includes user journal content

  

3. **Backup System Update:**

```bash

./scripts/backup-db

# Shows: 1 journal entry, 0 mindfulness sessions, etc.

# Confirms single database with user data

```

  

## 📚 Lessons Learned

  

### Technical Insights

  

1. **Avoid Context-Dependent Paths:** Using `__dirname` for database location creates deployment environment dependencies

2. **Prefer Absolute References:** `process.cwd()` provides consistent project root reference

3. **Test Across Environments:** Path logic should be validated in both development and production modes

  

### Best Practices Established

  

1. **Single Source of Truth:** Database location should be explicitly defined, not conditionally resolved

2. **Path Consistency:** All database-related code should use identical path resolution logic

3. **Environment Testing:** Critical paths must be verified across development and production builds

  

### Process Improvements

  

1. **Database Verification:** Add startup checks to ensure database exists at expected location

2. **Integration Testing:** Include cross-environment data access tests in CI/CD

3. **Documentation:** Critical path logic should be clearly documented and reviewed

  

## 🔮 Prevention Measures

  

### Code Review Guidelines

- **Database Path Changes:** Require special review attention for any database connection logic

- **Environment Logic:** Conditional logic based on `__dirname` or similar should be scrutinized

- **Path Resolution:** Prefer explicit, absolute paths over conditional resolution

  

### Monitoring & Validation

- **Startup Checks:** Add database connectivity validation during application initialization

- **Health Endpoints:** Include database location verification in health check endpoints

- **Integration Tests:** Automated tests should verify data flow across development and production builds

  

## 📊 Final Status

  

**✅ **Issue Resolved Successfully****

  

- **Single Database Location:** `/backend/db/kalito.db`

- **AI Context Access:** Functional and verified

- **Data Consistency:** Unified across all environments

- **User Experience:** AI can now reference journal entries properly

- **Backup System:** Enhanced scripts targeting single database location

  

**The Luna mental health AI companion is now fully functional with proper access to user mental health data for personalized support.**

  

---

  

*This document serves as both incident post-mortem and prevention guide for future database architecture decisions in the Luna project.*