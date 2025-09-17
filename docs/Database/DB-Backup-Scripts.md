# Database Backup & Restore Scripts

## Overview

Your Kalito Space project includes two critical database management scripts that provide **essential data safety** for your SQLite database. These scripts are your **safety net** against data loss and enable **confident development**.

---

  

## Scripts Location & Access

  

### File Locations

```bash

./scripts/backup-db # Create database backups

./scripts/restore-db # Restore from backups

```

  

### Usage Methods

```bash

# Direct script execution

./scripts/backup-db

./scripts/restore-db

  

# Via npm/pnpm scripts (recommended)

pnpm db:backup

pnpm db:restore

  

# Via npm

npm run db:backup

npm run db:restore

```

  

---

  

## backup-db Script

  

### What It Does

Creates a **proper SQLite backup** using SQLite's native `.backup` command, ensuring data integrity and consistency.

  

### Technical Details

```bash

#!/bin/bash

DB="./backend/db/kalito.db"

BACKUP_DIR="./backups"

TIMESTAMP="$(date +%F_%H%M%S)"

BACKUP_FILE="${BACKUP_DIR}/kalito.db.${TIMESTAMP}.bak"

  

mkdir -p "$BACKUP_DIR"

sqlite3 "$DB" ".backup '$BACKUP_FILE'"

echo "Backup created at $BACKUP_FILE"

```

  

### Why This Approach is Superior

- **Uses SQLite's native backup**: Not just a file copy - handles active connections and WAL mode

- **Atomic operation**: Backup is consistent even if database is being written to

- **Timestamped files**: Never overwrites previous backups

- **Automatic directory creation**: Creates `/backups/` if it doesn't exist

  

### Usage Examples

```bash

# Create backup before risky operations

pnpm db:backup

  

# Expected output:

# Backup created at ./backups/kalito.db.2025-09-13_142530.bak

```

  

---

  

## restore-db Script

  

### What It Does

Provides an **interactive, safe restoration system** with professional-grade safety features.

  

### Key Features

- **Interactive backup selection**: Shows all available backups with dates/sizes

- **Safety backup**: Automatically backs up current database before restoration

- **Integrity checking**: Verifies database integrity after restoration

- **WAL cleanup**: Properly handles SQLite WAL/SHM files

- **Cross-platform**: Works on both GNU/Linux and macOS

  

### Usage Flow

```bash

pnpm db:restore

  

# You'll see:

Select a backup to restore (newest first):

Backup dir: /home/kalito/kalito-labs/kalito-repo/backups

  

1) kalito.db.2025-09-13_142530.bak 160.0KB 2025-09-13 14:25:30

2) kalito.db.2025-09-12_091045.bak 145.2KB 2025-09-12 09:10:45

  

Enter number to restore (or 'q' to quit): 1

  

You chose:

/home/kalito/kalito-labs/kalito-repo/backups/kalito.db.2025-09-13_142530.bak

  

Restore this backup into ./backend/db/kalito.db ? [y/N]: y

  

[✓] Safety backup created → ./backups/kalito.db.SAFETY.2025-09-13_142635.bak

[✓] Restored → ./backend/db/kalito.db

[✓] SQLite integrity_check: ok

  

Done. You may need to restart your backend if it was running.

```

  

---

  

## Critical Safety Scenarios

  

### 🚨 **ALWAYS Backup Before These Operations**

  

#### 1. Database Schema Changes

```bash

# BEFORE modifying backend/db/init.ts

pnpm db:backup

  

# Reason: Schema changes can corrupt data or cause migration issues

# Risk: Loss of all conversation history, personas, and memory data

```

  

#### 2. Development Experiments

```bash

# BEFORE testing new database features

pnpm db:backup

  

# Examples:

# - Adding new tables or columns

# - Testing memory manager changes

# - Experimenting with data structures

# - Debugging database queries

```

  

#### 3. Production Deployments

```bash

# BEFORE any production deployment

pnpm db:backup

  

# Reason: New code might have database bugs

# Safety: Can quickly rollback if deployment fails

```

  

#### 4. Package Updates

```bash

# BEFORE updating database-related packages

pnpm db:backup

  

# Examples:

# - Updating SQLite drivers

# - Changing ORM versions

# - Database utility updates

```

  

#### 5. System Maintenance

```bash

# BEFORE system updates, disk cleanup, or moving project

pnpm db:backup

  

# Reason: System operations can corrupt files

# Safety: Ensure data survives system changes

```

  

---

  

## Development Workflow Integration

  

### Daily Development Pattern

```bash

# Start of development session

pnpm db:backup # Create safety checkpoint

  

# Work on features...

# Test changes...

# Make commits...

  

# Before risky database work

pnpm db:backup # Another checkpoint

  

# If something goes wrong

pnpm db:restore # Quickly recover

```

  

### Feature Development Workflow

```bash

# 1. Create feature branch

git checkout -b feature/new-memory-system

  

# 2. Backup current state

pnpm db:backup

  

# 3. Develop and test

# ... make changes ...

  

# 4. If feature works - great!

# 5. If feature breaks database:

pnpm db:restore # Back to known good state

```

  

### Database Migration Workflow

```bash

# 1. Backup before migration

pnpm db:backup

  

# 2. Update schema in backend/db/init.ts

# 3. Test migration

# 4. If migration fails:

pnpm db:restore # Restore pre-migration state

  

# 5. Fix migration code and repeat

```

  

---

  

## Data You're Protecting

  

### Critical Data in Your Database

```sql

-- Chat sessions and conversation history

sessions, messages

  

-- AI memory system data

memory_entries, memory_pins, memory_summaries

  

-- User personas and configurations

personas

  

-- Model settings and preferences

-- System state and configuration data

```

  

### Impact of Data Loss

Without backups, you could lose:

- **Months of conversation history** with AI models

- **Carefully crafted personas** and their configurations

- **Memory pins and important context** you've saved

- **System preferences** and model settings

- **Development progress** and testing data

  

---

  

## Backup Management Best Practices

  

### Regular Backup Schedule

```bash

# Weekly routine backup

pnpm db:backup

  

# Before major changes

pnpm db:backup

  

# Before system updates

pnpm db:backup

```

  

### Backup Retention Strategy

```bash

# Keep recent backups

ls -la backups/

  

# Clean old backups (keep last 10)

ls -t backups/*.bak | tail -n +11 | xargs rm -f

  

# Or manually remove specific old backups

rm backups/kalito.db.2025-08-15_*.bak

```

  

### Backup Verification

```bash

# Test backup integrity

sqlite3 backups/kalito.db.2025-09-13_142530.bak "PRAGMA integrity_check;"

  

# Expected output: ok

```

  

---

  

## Emergency Recovery Scenarios

  

### Scenario 1: Database Corruption

```bash

# Symptoms: Backend won't start, SQLite errors

# Solution:

pnpm db:restore

# Select most recent working backup

```

  

### Scenario 2: Bad Migration

```bash

# Symptoms: Schema errors, missing data after update

# Solution:

pnpm db:restore

# Select backup from before migration

# Fix migration code

# Try again

```

  

### Scenario 3: Accidental Data Deletion

```bash

# Symptoms: Missing conversations, personas, or memory data

# Solution:

pnpm db:restore

# Select backup from before deletion occurred

```

  

### Scenario 4: Development Environment Reset

```bash

# Need: Fresh start with clean database

# Solution:

pnpm db:restore

# Select oldest backup or create new database

```

  

---

  

## Technical Advantages

  

### Why These Scripts Are Superior

  

#### vs. Simple File Copy

```bash

# ❌ WRONG - Can corrupt data

cp backend/db/kalito.db backups/backup.db

  

# ✅ CORRECT - Uses SQLite's backup command

sqlite3 backend/db/kalito.db ".backup 'backups/backup.db'"

```

  

#### SQLite `.backup` Command Benefits

- **Handles active connections**: Works even if backend is running

- **WAL mode safe**: Properly handles Write-Ahead Logging

- **Atomic operation**: All-or-nothing backup creation

- **Integrity preserved**: Guaranteed consistent database state

  

#### Professional Error Handling

- **Safety backups**: Never lose current state when restoring

- **Integrity checking**: Verifies backup quality

- **User confirmation**: Prevents accidental data loss

- **Clear feedback**: Always know what happened

  

---

  

## Integration with Your Workflow

  

### Git Integration

```bash

# Backups are in .gitignore (as they should be)

# But you can track backup creation in commits:

  

git commit -m "feat: add memory summarization

  

Database backup created before schema changes:

- backup: kalito.db.2025-09-13_142530.bak

- size: 160KB

- tables: added memory_summaries"

```

  

### Documentation Integration

```bash

# In README.md or commit messages, reference backups:

# "Before running this migration, create backup with: pnpm db:backup"

```

  

### CI/CD Integration (Future)

```bash

# In deployment scripts:

echo "Creating pre-deployment backup..."

./scripts/backup-db

echo "Backup created. Proceeding with deployment..."

```

  

---

  

## Monitoring & Maintenance

  

### Check Backup Health

```bash

# List all backups with details

ls -la backups/

  

# Check backup sizes (should be reasonable)

du -h backups/

  

# Verify newest backup integrity

sqlite3 "$(ls -t backups/*.bak | head -1)" "PRAGMA integrity_check;"

```

  

### Cleanup Old Backups

```bash

# Remove backups older than 30 days

find backups/ -name "*.bak" -mtime +30 -delete

  

# Keep only last 20 backups

ls -t backups/*.bak | tail -n +21 | xargs rm -f

```

  

---

  

## Summary: Why These Scripts Keep You Safe

  

### 🛡️ **Data Protection**

- **Never lose work**: Quick recovery from any disaster

- **Confidence in experimentation**: Try risky changes safely

- **Professional workflow**: Enterprise-grade backup practices

  

### ⚡ **Development Velocity**

- **Fast recovery**: Seconds to restore working state

- **Fearless development**: Break things and fix them quickly

- **Easy rollbacks**: Undo problematic changes instantly

  

### 🎯 **Best Practices**

- **Proper SQLite handling**: Uses database-native backup methods

- **Safety features**: Multiple confirmation layers

- **Clear feedback**: Always know backup status

  

### 📈 **Long-term Value**

- **Disaster recovery**: Survive hardware failures, corruption, accidents

- **Development history**: Track database evolution over time

- **Peace of mind**: Sleep well knowing your data is safe

  

**Your backup scripts are not just tools - they're your development safety net and confidence enabler.** Use them liberally! 🚀