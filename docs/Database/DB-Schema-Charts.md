# Database Schema Charts

This document provides comprehensive visual diagrams of the Kalito database schema, including entity relationships, indexes, triggers, and optimization patterns.

## Current Implementation Status (Updated: Sep 16, 2025)

**✅ Active (Implemented):**
- Core table structure with proper relationships
- Foreign key constraints enabled
- Essential performance index (`idx_messages_session_created`)
- 4 working personas (including specialized coding assistant)
- Backup and recovery system

**📋 Future Enhancements (Available when needed):**
- Additional performance indexes
- Database triggers for protection
- WAL mode configuration
- Advanced pin typing system

## Complete Entity Relationship Diagram

```mermaid
erDiagram
    sessions {
        text id PK "Primary session identifier"
        text name "Human-readable session name"
        text model "AI model used for session"
        text recap "Session summary/description"
        text persona_id FK "Reference to personas table"
        text created_at "Session creation timestamp"
        text updated_at "Last modification timestamp"
        integer saved "Session save status (0/1)"
    }
    
    personas {
        text id PK "Primary persona identifier"
        text name "Persona display name"
        text prompt "Core personality prompt"
        text description "Persona description"
        text icon "UI icon identifier"
        text default_model "Default AI model for persona"
        text suggested_models "JSON array of model suggestions"
        real temperature "AI temperature setting (0.0-2.0)"
        integer maxTokens "Maximum tokens (100-4000)"
        text created_at "Creation timestamp"
        text updated_at "Last modification timestamp"
        text category "Persona category grouping"
        real topP "Top-P sampling parameter"
        text stopSequences "AI stop sequences"
        real repeatPenalty "Repetition penalty setting"
        integer is_default "Default persona flag (0/1)"
    }
    
    messages {
        integer id PK "Auto-increment message ID"
        text session_id FK "Reference to sessions table"
        text role "Message role (user/assistant/system)"
        text text "Message content"
        text model_id "AI model that generated response"
        integer token_usage "Token count for message"
        real importance_score "Memory importance (0.0-1.0)"
        text created_at "Message timestamp"
    }
    
    conversation_summaries {
        text id PK "Primary summary identifier"
        text session_id FK "Reference to sessions table"
        text summary "Compressed conversation summary"
        integer message_count "Number of messages summarized"
        text start_message_id "First message in summary range"
        text end_message_id "Last message in summary range"
        real importance_score "Summary importance (default 0.7)"
        text created_at "Summary creation timestamp"
    }
    
    semantic_pins {
        text id PK "Primary pin identifier"
        text session_id FK "Reference to sessions table"
        text content "Pinned content/concept"
        text source_message_id "Original message reference"
        real importance_score "Pin importance (default 0.8)"
        text pin_type "Pin type field (default 'user')"
        text created_at "Pin creation timestamp"
    }

    %% Relationships
    sessions ||--o{ messages : "has many"
    sessions ||--o{ conversation_summaries : "has many"
    sessions ||--o{ semantic_pins : "has many"
    personas ||--o{ sessions : "used by"
```

## Database Performance Optimization

```mermaid
graph TB
    subgraph "Current Indexes"
        A["✅ idx_messages_session_created\nmessages(session_id, created_at DESC)"]
        A1["📋 sqlite_autoindex_sessions_1\nsessions(id) - Primary Key"]
        A2["📋 sqlite_autoindex_personas_1\npersonas(id) - Primary Key"] 
        A3["📋 sqlite_autoindex_conversation_summaries_1\nconversation_summaries(id) - Primary Key"]
        A4["📋 sqlite_autoindex_semantic_pins_1\nsemantic_pins(id) - Primary Key"]
    end
    
    subgraph "Future Indexes (Add When Needed)"
        B["idx_messages_session_importance_created\nmessages(session_id, importance_score DESC, created_at DESC)"]
        C["idx_summaries_session_importance_created\nconversation_summaries(session_id, importance_score DESC, created_at DESC)"]
        D["idx_semantic_pins_session_importance_created\nsemantic_pins(session_id, importance_score DESC, created_at DESC)"]
    end
    
    subgraph "Query Patterns"
        H["✅ Message Retrieval\nby Session + Time"]
        I["📋 Importance-Based\nMemory Retrieval"]
        J["📋 Summary Lookup\nby Session"]
        K["📋 Semantic Pin\nQueries"]
    end
    
    A --> H
    B -.-> I
    C -.-> J
    D -.-> K

    style A fill:#90EE90
    style A1 fill:#F0F8FF
    style A2 fill:#F0F8FF
    style A3 fill:#F0F8FF
    style A4 fill:#F0F8FF
    style B fill:#FFE4B5
    style C fill:#FFE4B5
    style D fill:#FFE4B5
```

## Data Integrity & Protection

```mermaid
graph LR
    subgraph "✅ Active Foreign Key Constraints"
        A[sessions.persona_id → personas.id]
        B[messages.session_id → sessions.id<br/>ON DELETE CASCADE]
        C[conversation_summaries.session_id → sessions.id<br/>ON DELETE CASCADE]
        D[semantic_pins.session_id → sessions.id<br/>ON DELETE CASCADE]
    end
    
    subgraph "📋 Future Database Triggers"
        E[trg_no_delete_default_persona<br/>Prevents deletion of default personas]
        F[trg_no_unset_default_persona<br/>Prevents unsetting default flag]
    end
    
    subgraph "✅ Current Protection Strategy"
        G[Application-level validation<br/>Manual default persona management<br/>Backup system in /backups]
    end

    style A fill:#90EE90
    style B fill:#90EE90
    style C fill:#90EE90
    style D fill:#90EE90
    style E fill:#FFE4B5
    style F fill:#FFE4B5
    style G fill:#90EE90
```

## Memory System Architecture

```mermaid
flowchart TD
    A[User Input] --> B[Session Context]
    B --> C{Memory Retrieval}
    
    C --> D["✅ Recent Messages<br/>idx_messages_session_created"]
    C --> E["📋 Important Messages<br/>(future optimization)"]
    C --> F["📋 Conversation Summaries<br/>(future optimization)"]
    C --> G["📋 Semantic Pins<br/>(basic queries)"]
    
    D --> H[Context Assembly]
    E -.-> H
    F -.-> H
    G --> H
    
    H --> I[AI Processing<br/>with Persona]
    I --> J[Response Generation]
    
    J --> K[Store Response<br/>messages table]
    K --> L{Trigger Summary?}
    L -->|Yes| M[Create Summary<br/>conversation_summaries]
    L -->|No| N[End]
    M --> O[Update Importance Scores]
    O --> N

    style D fill:#90EE90
    style E fill:#FFE4B5
    style F fill:#FFE4B5
    style G fill:#F0F8FF
```

## Session Management Flow

```mermaid
stateDiagram-v2
    [*] --> Creating: User starts new session
    Creating --> Active: Session created with persona
    
    Active --> Active: Messages exchanged
    Active --> Saved: User saves session (saved=1)
    Active --> Archived: Session becomes inactive
    
    Saved --> Active: User reopens session
    Saved --> Archived: Long-term storage
    
    Archived --> [*]: Session deleted (CASCADE)
    
    note right of Active
        - Messages accumulate
        - Summaries created
        - Semantic pins added
    end note
    
    note right of Archived
        - All related data deleted
        - Foreign key CASCADE
    end note
```

## Data Storage Patterns

```mermaid
pie title Message Distribution by Role
    "Assistant" : 45
    "User" : 40
    "System" : 15
```

```mermaid
pie title Memory Importance Distribution
    "High (0.8-1.0)" : 20
    "Medium (0.5-0.8)" : 60
    "Low (0.0-0.5)" : 20
```

## Index Usage Optimization

| Query Pattern              | Status | Primary Index                              | Use Case             | Performance |
| -------------------------- | ------ | ------------------------------------------ | -------------------- | ----------- |
| Recent messages by session | ✅ Active | `idx_messages_session_created`            | Chat history display | Optimized   |
| Primary key lookups        | ✅ Active | Auto-generated PKs                         | Record retrieval     | Optimized   |
| Important memory recall    | 📋 Future | `idx_messages_session_importance_created` | AI context building  | Add when needed |
| Summary retrieval          | 📋 Future | `idx_summaries_session_created`           | Session overview     | Add when needed |
| Semantic search            | 📋 Future | `idx_semantic_pins_session_importance_created` | Concept-based recall | Add when needed |

## Schema Statistics

- **Total Tables:** 5 (plus sqlite_sequence)
- **Active Performance Indexes:** 1 (`idx_messages_session_created`)
- **Auto-generated Indexes:** 4 (primary key constraints)
- **Active Triggers:** 0 (managed at application level)
- **Foreign Key Relationships:** 4 with CASCADE delete
- **Foreign Key Enforcement:** ✅ Enabled

## Database File Structure

```
backend/db/
├── kalito.db              # Main database file (DELETE journal mode)
├── db.ts                 # Database connection logic (with FK enforcement)
└── init.ts               # Schema initialization & migrations

backups/
└── kalito.db.2025-09-13_060634.bak  # Database backups
```

## Schema Evolution Notes

- **Auto-increment Messages:** `messages.id` uses INTEGER PRIMARY KEY AUTOINCREMENT
- **Flexible Persona Configuration:** Rich AI model settings per persona (4 active personas)
- **Memory Optimization:** Importance scoring across all content types
- **Data Protection:** Application-level management with backup system
- **Performance Focus:** Essential index implemented, additional indexes ready for future needs
- **Minimal Approach:** Simple, reliable setup with room for growth
