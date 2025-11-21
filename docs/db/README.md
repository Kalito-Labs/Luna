# Luna Database Documentation

**Last Updated**: November 21, 2025  
**Status**: Complete analysis and documentation  
**Database**: kalito.db (SQLite)

---

## 📚 Documentation Index

This folder contains comprehensive database documentation for the Luna Mental Health Companion Platform. Each document serves a specific purpose and is optimized for both human developers and AI model understanding.

### 1. [Database Schema Overview](./01-DATABASE-SCHEMA.md)
**Purpose**: High-level schema visualization and quick reference  
**Contents**:
- Entity Relationship Diagram (ERD) with Mermaid
- All 10 tables with relationships
- Foreign key mappings
- Index strategies
- Current data snapshot
- Database configuration

**Best for**: Getting oriented, understanding relationships, quick lookups

---

### 2. [Database Architecture Analysis](./02-DATABASE-ARCHITECTURE.md)
**Purpose**: Technical deep-dive into performance and optimization  
**Contents**:
- SQLite pragma configurations (WAL mode, cache, etc.)
- Index strategy and query optimization
- Foreign key cascade behavior
- Transaction patterns
- Performance benchmarks
- Connection management
- Backup and restore procedures
- Security considerations

**Best for**: Performance tuning, optimization work, understanding technical decisions

---

### 3. [Legacy Cleanup Guide](./03-LEGACY-CLEANUP.md)
**Purpose**: Document discrepancies and cleanup tasks  
**Contents**:
- ⚠️ Eldercare legacy columns in `personas` table
- Schema discrepancies between `init.ts` and actual database
- Extended columns not in base schema (`sessions`, `semantic_pins`)
- Complete remediation plan with SQL scripts
- Verification checklist
- Testing procedures

**Best for**: Database maintenance, cleanup work, understanding technical debt

---

### 4. [Migration 001 - Completed](./04-MIGRATION-001-COMPLETED.md)
**Purpose**: Documentation of the persona enhancement system implementation  
**Contents**:
- ✅ **COMPLETED** - Eldercare legacy cleanup
- Enhanced personas table with therapeutic specialization fields
- New persona_templates table with 5 seeded therapeutic templates
- Updated TypeScript types and API contracts
- Database verification and next steps

**Best for**: Understanding recent changes, persona enhancement feature context

---

### 5. [Data Model Reference Guide](./04-DATA-MODEL-GUIDE.md)
**Purpose**: Complete field-by-field documentation  
**Contents**:
- All 10 tables with every field documented
- Field types, constraints, defaults
- Foreign key relationships
- Usage patterns with code examples
- Common query patterns for AI context
- Data type mappings and format specifications

**Best for**: Development reference, understanding data structures, writing queries

---

## 🎯 Quick Start Guide

### For Developers
1. **New to the project?** Start with [01-DATABASE-SCHEMA.md](./01-DATABASE-SCHEMA.md)
2. **Need to write queries?** Reference [04-DATA-MODEL-GUIDE.md](./04-DATA-MODEL-GUIDE.md)
3. **Performance issues?** Check [02-DATABASE-ARCHITECTURE.md](./02-DATABASE-ARCHITECTURE.md)
4. **Cleanup tasks?** Follow [03-LEGACY-CLEANUP.md](./03-LEGACY-CLEANUP.md)

### For AI Models
- **Context building**: Use 04-DATA-MODEL-GUIDE.md for field-level details
- **Architecture questions**: Reference 02-DATABASE-ARCHITECTURE.md
- **Schema verification**: Cross-check with 01-DATABASE-SCHEMA.md
- **Known issues**: Be aware of items in 03-LEGACY-CLEANUP.md

---

## 📊 Database Quick Stats

| Metric | Value |
|--------|-------|
| **Total Tables** | 10 |
| **Active Patient** | 1 (Kaleb) |
| **Medications** | 4 active |
| **Journal Entries** | 1 |
| **Personas** | 2 (default cloud/local) |
| **Database Size** | ~208 KB |
| **Mode** | WAL (Write-Ahead Logging) |
| **Foreign Keys** | Enforced ✅ |

---

## 🏗️ Table Categories

### Mental Health Core (5 tables)
- `patients` - Patient profiles
- `medications` - Prescription tracking
- `appointments` - Healthcare scheduling
- `journal_entries` - Mood and emotion journaling
- `vitals` - Health metrics

### AI Conversation (3 tables)
- `sessions` - Chat session management
- `messages` - Individual messages
- `personas` - AI personality configs

### Memory System (2 tables)
- `conversation_summaries` - Compressed history
- `semantic_pins` - Important info extraction

---

## ⚠️ Current Issues

### High Priority
- **Eldercare legacy columns** in `personas` table
  - `eldercare_specialty` (NULL but exists)
  - `patient_context` (0 but exists)
  - **Action**: Follow cleanup guide in document 03

### Medium Priority
- **Undocumented extensions** in `sessions` and `semantic_pins`
  - Added via migration but not in `init.ts`
  - **Action**: Sync schema definitions

### Low Priority
- **Missing foreign keys** on some references
  - `sessions.persona_id` → `personas.id`
  - `sessions.patient_id` → `patients.id`

See [03-LEGACY-CLEANUP.md](./03-LEGACY-CLEANUP.md) for complete remediation plan.

---

## 🔍 How to Use This Documentation

### Scenario 1: "I need to understand the database structure"
→ Read [01-DATABASE-SCHEMA.md](./01-DATABASE-SCHEMA.md) for ERD and overview

### Scenario 2: "I'm writing a new query"
→ Reference [04-DATA-MODEL-GUIDE.md](./04-DATA-MODEL-GUIDE.md) for field details

### Scenario 3: "The app is slow"
→ Check [02-DATABASE-ARCHITECTURE.md](./02-DATABASE-ARCHITECTURE.md) for optimization tips

### Scenario 4: "I need to clean up the database"
→ Follow [03-LEGACY-CLEANUP.md](./03-LEGACY-CLEANUP.md) step-by-step

### Scenario 5: "I'm building AI context"
→ Use "Common Query Patterns" section in [04-DATA-MODEL-GUIDE.md](./04-DATA-MODEL-GUIDE.md)

---

## 📝 Documentation Maintenance

### When to Update
- ✅ After schema changes (new tables, columns, indexes)
- ✅ After performance optimizations
- ✅ When cleanup tasks are completed
- ✅ When new patterns emerge in queries

### How to Update
1. Verify changes with `sqlite3 db/kalito.db ".schema table_name"`
2. Update relevant document(s)
3. Update this README if structure changes
4. Commit with message: `docs(db): [description]`

---

## 🛠️ Useful Commands

### Inspect Database
```bash
# List all tables
sqlite3 backend/db/kalito.db ".tables"

# View table schema
sqlite3 backend/db/kalito.db ".schema table_name"

# Check foreign keys
sqlite3 backend/db/kalito.db "PRAGMA foreign_key_list(table_name)"

# View indexes
sqlite3 backend/db/kalito.db "SELECT name FROM sqlite_master WHERE type='index'"

# Row counts
sqlite3 backend/db/kalito.db "SELECT COUNT(*) FROM table_name"
```

### Backup & Restore
```bash
# Create backup
./scripts/backup-db

# Restore from backup
./scripts/restore-db backup_file.bak
```

---

## 📚 Related Documentation

- **Main README**: `/README.md` - Project overview
- **Backend Types**: `/backend/types/` - TypeScript type definitions
- **API Documentation**: `/backend/routes/` - API endpoint reference
- **Task Documentation**: `/docs/Tasks/` - Feature implementation guides

---

## 🙏 Credits

**Analysis Performed**: November 21, 2025  
**Analysis Method**: Direct SQLite database inspection + schema file review  
**Documentation Generated**: AI-assisted comprehensive analysis  
**Project**: Luna Mental Health Companion Platform v1.1.0-beta

---

**Need help?** Open an issue or check the main project README for support options.
