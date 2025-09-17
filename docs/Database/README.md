# Database Documentation

This directory contains comprehensive documentation for the Kalito database architecture and implementation.

## Documents Overview

### 📊 [Database Schema Charts](./DB-Schema-Charts.md)
Visual documentation with Mermaid diagrams showing:
- Complete Entity Relationship Diagram (current implementation)
- Performance optimization patterns (active vs future)
- Data integrity & protection flows
- Memory system architecture
- Session management workflows

**Best for:** Understanding database structure, sharing with stakeholders, visual learners

### 🔧 [Backend Database Guide](./Backend-DB-Guide.md)
Comprehensive technical reference covering:
- Current implementation status and setup
- Detailed table-by-table analysis
- Memory management system deep dive
- Essential performance optimization (with future roadmap)
- Development workflow guidelines
- Troubleshooting and best practices

**Best for:** Developers, database administration, technical implementation

### 📜 Legacy Documentation
Previous database documentation preserved for reference.

**Best for:** Migration history, comparison with current implementation

## Quick Start

### For New Developers:
1. **Understanding Structure:** Start with [Schema Charts](./DB-Schema-Charts.md) ERD
2. **Implementation Details:** Read [Backend Guide](./Backend-DB-Guide.md) Current Setup Summary
3. **Health Check:** Run maintenance commands from Backend Guide

### For Database Work:
```bash
# Check current status
cd backend && sqlite3 db/kalito.db "PRAGMA foreign_key_check; SELECT COUNT(*) FROM personas;"

# View personas
sqlite3 db/kalito.db "SELECT id, name FROM personas;"

# Create backup
./scripts/backup-db
```

## Quick Navigation

| Need | Document | Section |
|------|----------|---------|
| Visual overview | Schema Charts | Complete ERD |
| Current implementation status | Both | Implementation Status |
| Table details | Backend Guide | Core Tables Deep Dive |
| Essential optimizations | Backend Guide | Performance Optimization |
| Memory system | Both | Memory Management System |
| Development setup | Backend Guide | Development Workflow |
| Maintenance commands | Backend Guide | Current Setup Summary |
| Troubleshooting | Backend Guide | Troubleshooting |

## Current Database Status (Updated: Sep 16, 2025)

### ✅ **Implemented & Active:**
- **5 Core Tables:** sessions, personas, messages, conversation_summaries, semantic_pins
- **Essential Performance Index:** `idx_messages_session_created` for chat optimization
- **Foreign Key Enforcement:** Enabled with CASCADE deletion for data integrity
- **4 Working Personas:** Including specialized coding assistant (restored from backup)
- **Backup System:** Automated backups in `/backups` directory
- **SQLite Configuration:** DELETE mode, reliable and simple

### 📋 **Future Enhancements:**
- Additional performance indexes (add when performance needs arise)
- Protection triggers (currently managed at application level)
- WAL mode (if concurrent access becomes necessary)

### 🎯 **Philosophy:**
Minimal but essential setup - robust foundation with room for growth

