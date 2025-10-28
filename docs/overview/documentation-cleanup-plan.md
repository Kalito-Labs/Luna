# Kalito Space - Documentation Cleanup & Update Plan

**Branch**: `fix`  
**Date**: October 28, 2025  
**Objective**: Trim unused/legacy code, remove bloat, eliminate redundancies, and ensure all documentation accurately reflects the current state of the repository.

---

## 📋 Overview

This plan outlines a systematic approach to reviewing and updating all documentation and code across the Kalito Space repository. We'll work section by section, reviewing files line by line to identify:

- **Unused/Legacy Code**: Functions, components, or features that are no longer used
- **Bloat**: Redundant comments, over-documentation, unnecessary complexity
- **Redundant Code**: Duplicate logic, copy-pasted functions, unnecessary abstractions
- **Outdated Documentation**: Information that no longer matches current implementation
- **Missing Documentation**: Critical features or changes that aren't documented

---

## 🗺️ Cleanup Strategy

### Phase Order
1. **Documentation (Root & `/docs`)** - Establish ground truth first
2. **Backend Core** - Server, database, middleware
3. **Backend Logic** - AI services, adapters, business logic
4. **Backend Routes** - API endpoints and handlers
5. **Frontend Core** - Main app, router, utilities
6. **Frontend Components** - UI components, views
7. **Configuration Files** - Build configs, linters, env files
8. **Final Review** - Cross-references, consistency check

---

## 📝 PHASE 1: Documentation Review

**Objective**: Ensure all documentation accurately reflects current implementation and remove outdated information.

### 1.1 Root Documentation (2-3 hours)

**Files to Review:**
- ✅ `/README.md` (296 lines)
- ✅ `/docs/overview/ks-overview.md` (1603 lines)

**Review Checklist:**

**README.md** - Quick Start Guide & Marketing:
- [ ] Verify Quick Start steps still work (installation, setup, run)
- [ ] Check all feature descriptions match current implementation
- [ ] Validate API endpoint list is complete and accurate
- [ ] Confirm technology stack versions are current
- [ ] Test all code examples and commands
- [ ] Remove references to unimplemented features
- [ ] Verify project structure diagram matches reality
- [ ] Check troubleshooting section is relevant
- [ ] Update dependencies and prerequisites
- [ ] Validate all links work (internal and external)

**ks-overview.md** - Comprehensive Platform Documentation:
- [ ] **Section: Core Platform Features** - Verify each feature exists and works as described
- [ ] **Section: Internet Search Capability** - Confirm implementation details (Tavily API, function calling)
- [ ] **Section: Eldercare Dashboard** - Validate all database tables and UI components exist
- [ ] **Section: Persona System** - Check if persona features match current code
- [ ] **Section: Hybrid Memory System** - Verify memory architecture is accurate
- [ ] **Section: Session Management** - Confirm session features are implemented
- [ ] **Section: Model Registry** - Validate supported models and adapters
- [ ] **Section: Technical Architecture** - Backend/Frontend structure review
- [ ] **Section: Data Flow** - Verify flow diagrams match actual implementation
- [ ] **Section: Technology Stack** - Update all version numbers
- [ ] **Section: Privacy & Security** - Confirm security measures are implemented
- [ ] **Section: Current Status & Roadmap** - Update completed features, remove voice (removed on Oct 27)
- [ ] **Section: Database Schema** - Verify all 11 tables match actual schema
- [ ] **Section: Cost Analysis** - Update API costs and usage estimates
- [ ] Remove any outdated sections or deprecated features
- [ ] Add missing recent features (if any)

**Deliverables:**
- Updated `README.md` with accurate, current information
- Updated `ks-overview.md` reflecting true system state
- List of discrepancies found (features documented but not implemented, or vice versa)

---

### 1.2 AI Protocols Documentation (1-2 hours)

**Files to Review:**
- ✅ `/docs/00-Ai-Protocols/01-Ai-Protocols.md`
- ✅ `/docs/00-Ai-Protocols/02-Self-Audit-Questions.md`

**Review Checklist:**
- [ ] Verify AI protocol rules are still followed in current code
- [ ] Check if self-audit questions are relevant to current development
- [ ] Remove outdated protocols or guidelines
- [ ] Add new protocols if development patterns have evolved
- [ ] Ensure consistency with actual AI integration approach

**Deliverables:**
- Cleaned AI protocols documentation
- Note any protocol violations in current code

---

### 1.3 Create New Documentation Structure (Optional)

**Potential New Documents** (to be created if needed):
- [ ] `/docs/backend/api-reference.md` - Complete API endpoint documentation
- [ ] `/docs/backend/database-schema.md` - Detailed schema with relationships
- [ ] `/docs/frontend/component-guide.md` - Component hierarchy and props
- [ ] `/docs/architecture/data-flow.md` - Visual data flow diagrams
- [ ] `/docs/architecture/system-diagrams.md` - Mermaid architecture charts
- [ ] `/docs/development/setup-guide.md` - Detailed dev environment setup
- [ ] `/docs/development/testing-guide.md` - Testing strategies and examples

---

## 🖥️ PHASE 2: Backend Core Review

**Objective**: Review core server, database, and middleware for unused code and redundancies.

### 2.1 Server & Configuration (2-3 hours)

**Files to Review:**
- `/backend/server.ts` (~200-300 lines)
- `/backend/tsconfig.json`
- `/backend/package.json`
- `/backend/nodemon.json`

**Review Checklist:**

**server.ts**:
- [ ] Remove unused imports
- [ ] Check for dead middleware (registered but not doing anything)
- [ ] Verify all routes are still used
- [ ] Remove commented-out code
- [ ] Check for redundant error handlers
- [ ] Validate environment variable usage
- [ ] Remove unused Express configurations

**package.json**:
- [ ] Identify unused dependencies (`npm-check` or manual review)
- [ ] Remove dev dependencies not used in development
- [ ] Update outdated packages (security & features)
- [ ] Check for duplicate functionality packages

**tsconfig.json**:
- [ ] Remove unnecessary compiler options
- [ ] Validate paths and includes
- [ ] Check if strict mode settings are optimal

**Deliverables:**
- Cleaned `server.ts` with only active code
- Updated `package.json` with necessary dependencies only
- Optimized TypeScript configuration

---

### 2.2 Database Layer (3-4 hours)

**Files to Review:**
- `/backend/db/db.ts` (database connection & helper functions)
- `/backend/db/init.ts` (schema initialization)
- `/backend/db/migrations/001-eldercare-schema.ts`

**Review Checklist:**

**db.ts**:
- [ ] Remove unused helper functions
- [ ] Check for redundant database queries
- [ ] Verify connection pooling is optimal
- [ ] Remove commented-out queries
- [ ] Check if all exported functions are actually used

**init.ts**:
- [ ] Verify all tables are still needed
- [ ] Check for redundant indexes
- [ ] Remove legacy table definitions
- [ ] Validate foreign key constraints are all necessary
- [ ] Check if default values are appropriate

**migrations/**:
- [ ] Confirm migration file matches actual schema
- [ ] Remove unused columns or tables
- [ ] Check for redundant migrations
- [ ] Validate all relationships are documented

**Deliverables:**
- Streamlined database layer with no dead code
- Documentation of actual schema (if creating schema doc)
- List of unused tables/columns (if any)

---

### 2.3 Middleware & Utilities (2 hours)

**Files to Review:**
- `/backend/middleware/errorMiddleware.ts`
- `/backend/middleware/security.ts`
- `/backend/middleware/validation.ts`
- `/backend/utils/apiContract.ts`
- `/backend/utils/logger.ts`
- `/backend/utils/routerHelpers.ts`

**Review Checklist:**

**Middleware**:
- [ ] Remove unused error handlers
- [ ] Check for redundant security middleware
- [ ] Validate all validation schemas are used
- [ ] Remove duplicate CORS or Helmet configurations

**Utils**:
- [ ] Identify unused utility functions
- [ ] Check for duplicate helper functions across files
- [ ] Validate logger is actually used throughout app
- [ ] Remove commented-out code
- [ ] Check if all exported functions are imported somewhere

**Deliverables:**
- Clean middleware with only active functions
- Streamlined utilities with no redundant helpers

---

## 🧠 PHASE 3: Backend Logic Review

**Objective**: Review AI services, adapters, and business logic for redundancies and outdated code.

### 3.1 AI Services (4-5 hours)

**Files to Review:**
- `/backend/logic/agentService.ts` (433 lines)
- `/backend/logic/memoryManager.ts` (759 lines)
- `/backend/logic/eldercareContextService.ts` (753 lines)
- `/backend/logic/modelRegistry.ts`

**Review Checklist:**

**agentService.ts**:
- [ ] Remove unused functions (runAgent, runAgentStream, etc.)
- [ ] Check for dead code paths (if statements never reached)
- [ ] Validate all tool integrations are active
- [ ] Remove commented-out streaming implementations
- [ ] Check for redundant error handling
- [ ] Verify all imports are used
- [ ] Remove legacy function calling code (if any)

**memoryManager.ts**:
- [ ] Check if all memory features are actually used
- [ ] Remove unused context building functions
- [ ] Validate cache management is necessary
- [ ] Check for redundant database queries
- [ ] Remove dead code in token estimation
- [ ] Verify all exported functions are called

**eldercareContextService.ts**:
- [ ] Check if all context formatters are used
- [ ] Remove unused database query functions
- [ ] Validate privacy filtering logic
- [ ] Check for redundant patient/medication/appointment formatters
- [ ] Remove legacy context building code

**modelRegistry.ts**:
- [ ] Verify all registered models are actually used
- [ ] Remove unused adapter factory functions
- [ ] Check for redundant model alias logic
- [ ] Validate model capability detection

**Deliverables:**
- Streamlined AI services with no dead code
- Documentation of actual AI flow (if creating flow diagram)
- List of unused AI features to potentially remove

---

### 3.2 Model Adapters (3-4 hours)

**Files to Review:**
- `/backend/logic/adapters/openai/adapters.ts`
- `/backend/logic/adapters/openai/factory.ts`
- `/backend/logic/adapters/openai/index.ts`
- `/backend/logic/adapters/openai/models.ts`
- `/backend/logic/adapters/openai/types.ts`
- `/backend/logic/adapters/ollama/adapters.ts`
- `/backend/logic/adapters/ollama/factory.ts`
- `/backend/logic/adapters/ollama/index.ts`

**Review Checklist:**

**OpenAI Adapters**:
- [ ] Remove unused model configurations
- [ ] Check for redundant streaming implementations
- [ ] Validate tool support code is active
- [ ] Remove legacy adapter code
- [ ] Check for duplicate type definitions

**Ollama Adapters**:
- [ ] Verify local model support is still used
- [ ] Remove unused model aliases
- [ ] Check for redundant adapter logic
- [ ] Validate connection handling

**Both**:
- [ ] Check for code duplication between adapters
- [ ] Identify opportunities for shared abstractions
- [ ] Remove commented-out implementations

**Deliverables:**
- Clean, DRY adapter code
- Shared adapter utilities (if applicable)
- Documentation of adapter architecture

---

## 🛣️ PHASE 4: Backend Routes Review

**Objective**: Review all API endpoints for unused routes, redundant logic, and proper error handling.

### 4.1 API Routes (3-4 hours)

**Files to Review:**
- `/backend/routes/agentRouter.ts`
- `/backend/routes/appointmentsRouter.ts`
- `/backend/routes/caregiversRouter.ts`
- `/backend/routes/medicationsRouter.ts`
- `/backend/routes/memoryRouter.ts`
- `/backend/routes/modelsRouter.ts`
- `/backend/routes/patientsRouter.ts`
- `/backend/routes/personasRouter.ts`
- `/backend/routes/providersRouter.ts`
- `/backend/routes/sessionRouter.ts`

**Review Checklist (Per Router File)**:
- [ ] Remove unused routes (check frontend doesn't call them)
- [ ] Validate all validation schemas are necessary
- [ ] Check for redundant error handling
- [ ] Remove duplicate database query logic
- [ ] Verify all routes are registered in server.ts
- [ ] Check for dead middleware on specific routes
- [ ] Remove commented-out endpoints
- [ ] Validate response formats are consistent (apiContract usage)

**Deliverables:**
- Cleaned route files with only active endpoints
- API endpoint inventory (for potential API reference doc)
- List of deprecated endpoints to remove

---

## 🎨 PHASE 5: Frontend Core Review

**Objective**: Review main app files, router, and core utilities.

### 5.1 App Core & Configuration (2-3 hours)

**Files to Review:**
- `/frontend/src/main.ts`
- `/frontend/src/App.vue`
- `/frontend/src/core.ts` (510 lines)
- `/frontend/src/router/index.ts`
- `/frontend/vite.config.ts`
- `/frontend/tsconfig.json`
- `/frontend/package.json`

**Review Checklist:**

**main.ts & App.vue**:
- [ ] Remove unused global imports
- [ ] Check for unused plugins or directives
- [ ] Validate global styles are all necessary
- [ ] Remove commented-out code

**core.ts**:
- [ ] Remove unused API client functions
- [ ] Check for redundant fetch wrappers
- [ ] Validate all exported functions are imported in components
- [ ] Remove legacy message sending implementations
- [ ] Check for duplicate error handling logic

**router/index.ts**:
- [ ] Remove unused routes
- [ ] Check for redundant route guards
- [ ] Validate all views are still used
- [ ] Remove dead navigation logic

**package.json**:
- [ ] Remove unused frontend dependencies
- [ ] Check for duplicate UI libraries
- [ ] Update outdated packages

**Deliverables:**
- Streamlined frontend core
- Updated dependencies
- Clean router configuration

---

### 5.2 Frontend Utilities (1-2 hours)

**Files to Review:**
- `/frontend/src/utils/syntaxHighlighter.ts`
- `/frontend/src/composables/usePersonaStore.ts`

**Review Checklist:**
- [ ] Remove unused utility functions
- [ ] Check for duplicate logic
- [ ] Validate composables are actually used
- [ ] Remove legacy code

**Deliverables:**
- Clean utility files
- List of shared utilities (for potential reuse)

---

## 🧩 PHASE 6: Frontend Components Review

**Objective**: Review all Vue components for unused props, redundant logic, and dead code.

### 6.1 Shared Components (2-3 hours)

**Files to Review:**
- `/frontend/src/components/ConfirmDialog.vue`
- `/frontend/src/components/HamburgerMenu.vue`

**Review Checklist:**
- [ ] Remove unused props
- [ ] Check for unused emits
- [ ] Remove redundant watchers
- [ ] Validate all methods are called
- [ ] Remove commented-out code
- [ ] Check for duplicate styling

**Deliverables:**
- Clean shared components
- Component usage map (which components use what)

---

### 6.2 Chat Components (4-5 hours)

**Files to Review:**
- `/frontend/src/components/chat/ChatPanel.vue` (1007 lines)
- `/frontend/src/components/chat/ChatWorkspace.vue` (1080 lines)
- `/frontend/src/components/chat/ChatPanelMobile.vue` (1010 lines)
- `/frontend/src/components/chat/SessionSidebar.vue`
- `/frontend/src/components/chat/SessionSidebarMobile.vue`

**Review Checklist (Per Component)**:
- [ ] **Remove voice-related code** (VoiceControl integration removed Oct 27)
- [ ] Remove unused props and computed properties
- [ ] Check for redundant message handling logic
- [ ] Remove dead watchers or lifecycle hooks
- [ ] Validate all emits are used by parent
- [ ] Check for duplicate code between desktop/mobile versions
- [ ] Remove commented-out streaming code
- [ ] Clean up unused refs
- [ ] Remove legacy session management code

**Special Focus**:
- [ ] **ChatPanel.vue** - Remove VoiceControl import, handleVoiceInput, voiceControlRef
- [ ] **ChatPanelMobile.vue** - Remove same voice-related code
- [ ] Check for duplicated logic that could be extracted to composable

**Deliverables:**
- Voice-free chat components
- Potential composable extractions identified
- Clean message handling flow

---

### 6.3 Eldercare Components (3-4 hours)

**Files to Review:**
- `/frontend/src/components/eldercare/AppointmentForm.vue`
- `/frontend/src/components/eldercare/AppointmentsList.vue`
- `/frontend/src/components/eldercare/CaregiverProfile.vue`
- `/frontend/src/components/eldercare/MedicationForm.vue`
- `/frontend/src/components/eldercare/MedicationsList.vue`
- `/frontend/src/components/eldercare/PatientDetailModal.vue`
- `/frontend/src/components/eldercare/PatientForm.vue`
- And other eldercare components

**Review Checklist (Per Component)**:
- [ ] Remove unused props
- [ ] Check for redundant form validation
- [ ] Remove duplicate API calls
- [ ] Validate all emits are handled by parent
- [ ] Check for unused computed properties
- [ ] Remove commented-out code
- [ ] Verify all form fields are necessary

**Deliverables:**
- Clean eldercare components
- Shared validation logic identified (if any)
- Component dependency map

---

### 6.4 Persona Components (1-2 hours)

**Files to Review:**
- `/frontend/src/components/personas/PersonaManager.vue`
- `/frontend/src/components/personas/PersonaEditModal.vue`
- Other persona-related components

**Review Checklist:**
- [ ] Remove unused persona features
- [ ] Check for redundant state management
- [ ] Validate all persona settings are used
- [ ] Remove dead code in persona CRUD operations

**Deliverables:**
- Streamlined persona management
- Clear persona feature list

---

### 6.5 Views (2-3 hours)

**Files to Review:**
- `/frontend/src/views/HomeView.vue` (589 lines)
- `/frontend/src/views/EldercareDashboard.vue` (1445 lines)
- Other views

**Review Checklist:**
- [ ] Remove unused sections
- [ ] Check for redundant state management
- [ ] Validate all child components are necessary
- [ ] Remove dead navigation logic
- [ ] Clean up unused data properties

**Deliverables:**
- Clean view files
- View hierarchy documentation (if creating component guide)

---

## ⚙️ PHASE 7: Configuration & Build Files

**Objective**: Review build configuration and tooling setup.

### 7.1 Build & Tooling (1-2 hours)

**Files to Review:**
- `/eslint.config.js`
- `/pnpm-workspace.yaml`
- `/package.json` (root)
- `/.gitignore`
- `/.env.example`

**Review Checklist:**
- [ ] Remove unused ESLint rules
- [ ] Validate workspace configuration
- [ ] Check for unused root scripts
- [ ] Verify .gitignore is comprehensive
- [ ] Update .env.example to match current needs

**Deliverables:**
- Optimized build configuration
- Updated environment examples

---

## 🔍 PHASE 8: Final Review & Cross-References

**Objective**: Ensure consistency across all documentation and code.

### 8.1 Cross-Reference Validation (2-3 hours)

**Tasks:**
- [ ] Verify all documented features actually exist in code
- [ ] Check all implemented features are documented
- [ ] Validate API documentation matches route implementations
- [ ] Confirm component props match documentation
- [ ] Check database schema matches documentation
- [ ] Verify all dependencies in package.json are actually used
- [ ] Test all documented commands and examples work

**Deliverables:**
- Complete feature inventory (documented vs. implemented)
- List of discrepancies to resolve
- Final cleanup checklist

---

### 8.2 Create Mermaid Diagrams (Optional, 3-4 hours)

**Potential Diagrams:**
- [ ] System architecture overview
- [ ] Database entity relationship diagram (ERD)
- [ ] AI conversation flow diagram
- [ ] API request/response flow
- [ ] Component hierarchy diagram
- [ ] Data flow diagrams (chat, eldercare, personas)

**Deliverables:**
- `/docs/architecture/system-diagrams.md` with Mermaid charts
- Visual representation of system architecture

---

## 📊 Summary & Time Estimates

| Phase | Focus Area | Est. Time | Priority |
|-------|------------|-----------|----------|
| 1.1 | Root Documentation | 2-3 hrs | HIGH |
| 1.2 | AI Protocols | 1-2 hrs | MEDIUM |
| 2.1 | Server Core | 2-3 hrs | HIGH |
| 2.2 | Database Layer | 3-4 hrs | HIGH |
| 2.3 | Middleware/Utils | 2 hrs | MEDIUM |
| 3.1 | AI Services | 4-5 hrs | HIGH |
| 3.2 | Model Adapters | 3-4 hrs | HIGH |
| 4.1 | API Routes | 3-4 hrs | HIGH |
| 5.1 | Frontend Core | 2-3 hrs | HIGH |
| 5.2 | Frontend Utils | 1-2 hrs | MEDIUM |
| 6.1 | Shared Components | 2-3 hrs | MEDIUM |
| 6.2 | Chat Components | 4-5 hrs | HIGH |
| 6.3 | Eldercare Components | 3-4 hrs | HIGH |
| 6.4 | Persona Components | 1-2 hrs | MEDIUM |
| 6.5 | Views | 2-3 hrs | MEDIUM |
| 7.1 | Build Config | 1-2 hrs | LOW |
| 8.1 | Cross-Reference | 2-3 hrs | HIGH |
| 8.2 | Mermaid Diagrams | 3-4 hrs | LOW |
| **TOTAL** | **All Phases** | **40-55 hrs** | - |

---

## 🎯 Success Criteria

At the end of this cleanup, we should have:

1. ✅ **Accurate Documentation**: All docs match actual implementation
2. ✅ **No Dead Code**: Every function, component, route is actively used
3. ✅ **No Redundancies**: No duplicate logic or copy-pasted code
4. ✅ **Clean Dependencies**: Only necessary packages installed
5. ✅ **Clear Architecture**: Easy to understand data flow and structure
6. ✅ **Updated Versions**: All dependency versions current
7. ✅ **Voice Feature Removed**: All voice-related code cleaned out
8. ✅ **Comprehensive Inventory**: Full feature list documented

---

## 🚀 Next Steps

1. **Review this plan** - Add/remove sections as needed
2. **Start with Phase 1.1** - Root documentation (README.md, ks-overview.md)
3. **Work sequentially** - Complete each phase before moving to next
4. **Document findings** - Keep notes on removed code and discovered issues
5. **Test after each phase** - Ensure nothing breaks
6. **Commit frequently** - Small, focused commits per file/section

---

## 📝 Notes

- This plan assumes current functionality works and we're just cleaning up
- Each phase can be broken into smaller tasks if needed
- Priority levels can be adjusted based on immediate needs
- Mermaid diagrams are optional but valuable for onboarding
- Testing should happen continuously, not just at the end

**Ready to begin?** Let me know which phase to start with, or if you want to modify this plan first.
