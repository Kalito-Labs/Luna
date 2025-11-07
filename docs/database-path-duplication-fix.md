# Database Path Duplication Issue and Resolution

**Date**: November 6, 2025  
**Project**: Kalito Eldercare App  
**Issue**: Database duplication causing data isolation between development and production environments  
**Status**: ✅ RESOLVED

## Problem Summary

During development of the eldercare app, we encountered a critical database access issue where:
- Development environment (using `ts-node`) accessed one database file
- Compiled/production environment accessed a completely different database file
- This caused data isolation, migration failures, and inconsistent application behavior

## Technical Background

### The Root Cause: `__dirname` vs `process.cwd()`

**What `__dirname` does:**
- Points to the directory where the currently executing file is located
- In development: `/home/kalito/kalito-labs/kalito-repo/backend/db`
- In production: `/home/kalito/kalito-labs/kalito-repo/backend/dist/db` (after TypeScript compilation)

**What `process.cwd()` does:**
- Points to the current working directory where the Node.js process was started
- Consistently: `/home/kalito/kalito-labs/kalito-repo` (project root)

### The Problem in Action

#### Before Fix (Problematic Code):
```typescript
// backend/db/db.ts
const dbFile = path.resolve(__dirname, './kalito.db')
```

This created two different database paths:
- **Development**: `__dirname` = `/backend/db/` → Database at `/backend/db/kalito.db`
- **Production**: `__dirname` = `/backend/dist/db/` → Database at `/backend/dist/db/kalito.db`

## Symptoms We Experienced

1. **Migration Failures**: Database migrations would fail because they tried to access an empty database in `dist/db/`
2. **Data Loss Illusion**: New data entered in production wasn't visible in development
3. **Schema Inconsistencies**: Schema updates applied to one database but not the other
4. **File Size Discrepancies**: Real database (212KB) vs empty database (4KB)

## Diagnosis Process

### Step 1: File Discovery
```bash
find /home/kalito/kalito-labs/kalito-repo -name "*.db" -type f
```
**Result**: Found two database files
- `/backend/db/kalito.db` (212,992 bytes - real data)
- `/backend/dist/db/kalito.db` (4,096 bytes - empty schema only)

### Step 2: Path Analysis
```typescript
// What we had (problematic):
console.log('Dev __dirname:', __dirname) 
// → /home/kalito/kalito-labs/kalito-repo/backend/db

// After compilation, __dirname would be:
// → /home/kalito/kalito-labs/kalito-repo/backend/dist/db
```

### Step 3: Environment Testing
- Development: `npm run dev` accessed `/backend/db/kalito.db`
- Production: `npm run build && npm start` accessed `/backend/dist/db/kalito.db`

## Solution Implementation

### Step 1: Update Database Connection (db.ts)

**Before:**
```typescript
// Path to your SQLite file - always points to db directory relative to this file
// This works in both dev (ts-node) and production (compiled) modes
const dbFile = path.resolve(__dirname, './kalito.db')
```

**After (Final Solution):**
```typescript
// Path to your SQLite file - works whether run from project root or backend directory
// This works consistently in both dev (ts-node) and production (compiled) modes
const currentDir = process.cwd()
const isInBackendDir = currentDir.endsWith('/backend')
const dbFile = isInBackendDir 
  ? path.resolve(currentDir, 'db/kalito.db')
  : path.resolve(currentDir, 'backend/db/kalito.db')
```

### Step 2: Update Database Initialization (init.ts)

**Before:**
```typescript
// Path to database file - relative to this file's location
const dbPath = path.resolve(__dirname, './kalito.db')
```

**After (Final Solution):**
```typescript
// Use the same path resolution as db.ts for consistency
const currentDir = process.cwd()
const isInBackendDir = currentDir.endsWith('/backend')
const dbPath = isInBackendDir 
  ? path.resolve(currentDir, 'db/kalito.db')
  : path.resolve(currentDir, 'backend/db/kalito.db')
```

### Step 3: Clean Up Duplicate Files

```bash
# Remove the duplicate database in dist/
rm -rf /home/kalito/kalito-labs/kalito-repo/backend/dist/db

# Verify only one database remains
find /home/kalito/kalito-labs/kalito-repo -name "*.db" -type f
# Should only show: /backend/db/kalito.db
```

### Step 4: Verification

```javascript
// Test script to verify path resolution
const path = require('path');
console.log('Current working directory:', process.cwd());
console.log('Database path with process.cwd():', path.resolve(process.cwd(), 'backend/db/kalito.db'));
console.log('Database exists:', require('fs').existsSync(path.resolve(process.cwd(), 'backend/db/kalito.db')));
```

## Key Learning Points

### Why This Happens
1. **TypeScript Compilation**: Changes the file structure and `__dirname` context
2. **Development vs Production**: Different execution environments have different directory structures
3. **Relative Path Dependencies**: `__dirname` creates execution-context-dependent paths

### Why `process.cwd()` is Better
1. **Environment Agnostic**: Always points to where the Node.js process started (project root)
2. **Consistent Behavior**: Same path resolution in dev and production
3. **Explicit Project Structure**: Makes database location explicit relative to project root
4. **Runtime Directory Flexible**: Works whether running from project root or backend subdirectory

### Enhanced Solution: Directory-Aware Path Resolution
Our final implementation goes beyond basic `process.cwd()` usage by detecting the runtime directory:
- When running from `/project-root/`: Uses `backend/db/kalito.db`
- When running from `/project-root/backend/`: Uses `db/kalito.db`
- Both resolve to the same physical file: `/project-root/backend/db/kalito.db`

### Best Practices Moving Forward

#### ✅ DO:
```typescript
// Directory-aware database paths (BEST)
const currentDir = process.cwd()
const isInBackendDir = currentDir.endsWith('/backend')
const dbFile = isInBackendDir 
  ? path.resolve(currentDir, 'db/kalito.db')
  : path.resolve(currentDir, 'backend/db/kalito.db')

// Or simple project root anchoring (GOOD)
const dbFile = path.resolve(process.cwd(), 'backend/db/kalito.db')

// Or use environment variables for flexibility (GOOD)
const dbFile = path.resolve(process.cwd(), process.env.DB_PATH || 'backend/db/kalito.db')
```

#### ❌ DON'T:
```typescript
// Avoid execution-context-dependent paths
const dbFile = path.resolve(__dirname, './kalito.db')
const dbFile = './kalito.db' // Relative to current working directory
```

## Prevention Checklist

When setting up database connections in Node.js/TypeScript projects:

- [ ] Use `process.cwd()` for path resolution instead of `__dirname`
- [ ] Test database access in both development and production environments
- [ ] Verify only one database file exists in the project
- [ ] Document the expected database location clearly
- [ ] Consider using environment variables for database paths
- [ ] Test migrations and schema changes in both environments

## Impact Assessment

### Before Fix:
- ❌ Data isolation between environments
- ❌ Migration failures
- ❌ Inconsistent application behavior
- ❌ Development/production parity issues

### After Fix:
- ✅ Single source of truth for data
- ✅ Consistent database access across environments
- ✅ Successful migrations and schema updates
- ✅ Reliable development/production parity

## Related Issues

This same issue was previously encountered and documented in the Luna project fork. The solution pattern is applicable to any Node.js/TypeScript project that:
- Uses SQLite with file-based databases
- Has TypeScript compilation step
- Runs in different environments (dev/prod)
- Uses relative path resolution for database location

## References

- Original Luna project documentation: `database-duplication.md`
- Node.js Path documentation: https://nodejs.org/api/path.html
- TypeScript compilation behavior: https://www.typescriptlang.org/docs/

---

**Note**: This documentation serves as a reference for future projects and team members who might encounter similar database path resolution issues. The key insight is that `__dirname` changes context during compilation, while `process.cwd()` remains consistent.