# Code Audit & Improvement Plan
**Date:** October 6, 2025  
**Status:** Planning Phase  
**Goal:** Optimize codebase, eliminate redundancies, ensure all code is utilized

---

## 📋 Overview

This audit will systematically review the Kalito codebase to:
- Identify and remove unused/dead code
- Eliminate redundancies and duplications
- Improve code organization and maintainability
- Optimize performance bottlenecks
- Ensure consistent patterns and best practices
- Validate all features are properly integrated

---

## 🎯 Phase 1: Dead Code Detection & Unused Exports
**Estimated Time:** 2-3 hours  
**Priority:** HIGH

### Backend Analysis
- [ ] **Unused Middleware**
  - `authRateLimit` in `security.ts` - exported but never imported/used
  - `ipWhitelist` function - defined but not applied anywhere
  
- [ ] **Model Preloader** (Currently disabled)
  - `preloadLocalModels()` - commented out in server.ts
  - `startModelWarming()` - never called
  - **Decision needed:** Delete or keep for future use?

- [ ] **OpenAI Adapters** 
  - Verify all 4 adapters are registered and accessible
  - Check if `getOpenAIAdapterIds()` is used
  - Validate factory pattern is necessary vs direct exports

- [ ] **Unused Router Helpers**
  - `notFound()` - check usage in routers
  - `conflict()` - check usage
  - `forbidden()` - check usage

### Frontend Analysis
- [ ] **Unused Imports**
  - Check all components for unused Vue imports
  - Verify all imported types are actually used
  
- [ ] **Dead Components**
  - Scan for any component files not referenced in routes/other components

### Actions
1. Run automated dead code detection
2. Manual review of each unused export
3. Create decision matrix: DELETE vs KEEP
4. Remove confirmed dead code
5. Document intentionally unused code (future features)

---

## 🔄 Phase 2: Code Duplication & Redundancy Analysis
**Estimated Time:** 3-4 hours  
**Priority:** HIGH

### Areas to Review

#### Backend
- [ ] **Error Handling Patterns**
  - `handleRouterError()` vs `handleCaughtError()`
  - Multiple ways to return errors - can we standardize?
  - Review `asyncHandler` usage consistency

- [ ] **Logger Functions**
  - `logError()`, `logInfo()`, `logWarn()`, `logDebug()`
  - Are all being used? Any redundant with direct logger calls?

- [ ] **API Response Helpers**
  - `okItem()`, `okList()`, `okDeleted()`
  - Check if all routers use these consistently
  - Can we reduce boilerplate?

- [ ] **Model Adapter Patterns**
  - Compare all 4 Ollama adapters (qwen, phi3, neural-chat, claude)
  - Extract common patterns into base class/factory
  - Reduce duplication in streaming logic

#### Frontend
- [ ] **API Call Patterns**
  - Review all fetch calls in `core.ts`
  - Can we create a unified API client?
  - Reduce duplication in error handling

- [ ] **Component Duplication**
  - Check for duplicated logic between ChatPanel/ChatWorkspace
  - Review dialog components for common patterns

### Actions
1. Generate duplication report
2. Identify patterns that can be abstracted
3. Create shared utilities/base classes
4. Refactor duplicated code
5. Test all affected features

---

## 📐 Phase 3: Architecture & Organization Review
**Estimated Time:** 2-3 hours  
**Priority:** MEDIUM

### Backend Structure
- [ ] **Types Organization**
  - Review `/types` folder - are all types necessary?
  - Check for duplicate type definitions
  - Ensure proper type exports/imports

- [ ] **Adapter Organization**
  - Current structure: `adapters/` + `adapters/openai/`
  - Should all adapters follow OpenAI's factory pattern?
  - Consider: `adapters/ollama/` subfolder?

- [ ] **Route Organization**
  - Review route file sizes (agentRouter.ts is 369 lines)
  - Consider breaking large routers into sub-routers
  - Validate RESTful patterns

- [ ] **Middleware Chain**
  - Review middleware order in server.ts
  - Ensure proper error handling flow
  - Validate rate limiting coverage

### Frontend Structure
- [ ] **Component Hierarchy**
  - ChatWorkspace → SessionSidebar → ChatPanel
  - Review prop drilling - can we use Pinia/provide-inject?
  
- [ ] **Core.ts Analysis** (477 lines)
  - Too many responsibilities?
  - Consider splitting into:
    - `api/sessions.ts`
    - `api/personas.ts`
    - `api/agent.ts`
    - `api/memory.ts`

- [ ] **Composables Usage**
  - Currently only `usePersonaStore.ts`
  - Can we extract more reusable logic?

### Actions
1. Create dependency graph
2. Identify architectural smells
3. Propose reorganization plan
4. Implement approved changes
5. Update import paths

---

## ⚡ Phase 4: Performance Optimization
**Estimated Time:** 2-3 hours  
**Priority:** MEDIUM

### Backend Optimizations
- [ ] **Database Queries**
  - Review all `db.prepare()` statements
  - Check for N+1 queries
  - Add indexes if missing
  - Consider query result caching

- [ ] **Memory Manager**
  - Review `getSummaries()`, `getPins()` performance
  - Check if importance scoring is efficient
  - Consider lazy loading for large sessions

- [ ] **Streaming Performance**
  - Review buffer sizes in adapters
  - Check TextDecoder usage efficiency
  - Validate JSONL parsing performance

### Frontend Optimizations
- [ ] **Render Performance**
  - Review ChatPanel rendering with many messages
  - Check syntax highlighting performance
  - Consider virtual scrolling for long chats

- [ ] **Bundle Size**
  - Analyze Vite build output
  - Check for large dependencies
  - Consider code splitting

- [ ] **API Call Optimization**
  - Review fetch patterns
  - Add request deduplication if needed
  - Implement proper loading states

### Actions
1. Run performance profiling
2. Identify bottlenecks
3. Implement optimizations
4. Benchmark improvements
5. Document performance gains

---

## 🔍 Phase 5: Code Quality & Best Practices
**Estimated Time:** 3-4 hours  
**Priority:** MEDIUM

### Code Review Areas
- [ ] **TypeScript Strict Mode**
  - Review any `any` types (found in server.ts line 200)
  - Ensure proper type safety throughout
  - Fix eslint disable directives

- [ ] **Error Handling**
  - Ensure all async functions handle errors
  - Review try-catch coverage
  - Validate error messages are user-friendly

- [ ] **Input Validation**
  - Review Zod schemas completeness
  - Check validation consistency across routers
  - Ensure proper sanitization

- [ ] **Security Review**
  - Review rate limiting coverage
  - Check for injection vulnerabilities
  - Validate CORS configuration
  - Review CSP headers

- [ ] **Documentation**
  - Add JSDoc comments to public APIs
  - Document complex algorithms
  - Update README if architecture changes

### Actions
1. Run ESLint with stricter rules
2. Run TypeScript in strict mode
3. Security scan with npm audit
4. Fix all identified issues
5. Add missing documentation

---

## 🧪 Phase 6: Testing & Validation
**Estimated Time:** 2-3 hours  
**Priority:** HIGH

### Test Coverage
- [ ] **Backend Tests**
  - Test all API endpoints
  - Test model adapters
  - Test memory manager logic
  - Test error scenarios

- [ ] **Frontend Tests**
  - Test core.ts functions
  - Test component interactions
  - Test error states
  - Test edge cases

- [ ] **Integration Tests**
  - Test full chat flow
  - Test session persistence
  - Test persona switching
  - Test model switching

### Manual Testing
- [ ] Test all 4 local models (qwen, phi3, neural-chat, claude)
- [ ] Test all 4 OpenAI models (gpt-4.1-mini/nano, gpt-5-mini/nano)
- [ ] Test streaming vs non-streaming
- [ ] Test memory system (pins, summaries)
- [ ] Test session management
- [ ] Test persona CRUD operations

### Actions
1. Write missing tests
2. Run full test suite
3. Manual QA testing
4. Fix discovered bugs
5. Document test results

---

## 📊 Phase 7: Final Review & Documentation
**Estimated Time:** 1-2 hours  
**Priority:** MEDIUM

### Deliverables
- [ ] **Audit Report**
  - Summary of findings
  - Changes made
  - Performance improvements
  - Code quality metrics

- [ ] **Updated Documentation**
  - Architecture diagram
  - API documentation
  - Development guidelines
  - Deployment guide

- [ ] **Migration Guide**
  - Breaking changes (if any)
  - Upgrade instructions
  - Deprecation notices

### Actions
1. Compile audit findings
2. Generate metrics report
3. Update all documentation
4. Create changelog
5. Get stakeholder approval

---

## 🎯 Quick Wins (Can Do Immediately)

### High Impact, Low Effort
1. **Remove `authRateLimit`** - unused export (5 min)
2. **Remove `ipWhitelist`** - unused function (5 min)
3. **Remove commented preloader code** - or document as disabled (10 min)
4. **Fix TypeScript `any` type** in server.ts line 200 (5 min)
5. **Remove unused eslint-disable directives** in server.ts (5 min)
6. **Add JSDoc to public APIs** - start with modelRegistry (15 min)

### Medium Impact, Medium Effort
7. **Extract Ollama adapter base class** - reduce duplication (1 hour)
8. **Split core.ts into modules** - improve organization (1-2 hours)
9. **Standardize error handling** - use helpers consistently (1 hour)
10. **Add database indexes** - if missing for common queries (30 min)

---

## 📈 Success Metrics

### Before/After Comparison
- [ ] Lines of code reduced by X%
- [ ] Number of files reduced by X
- [ ] Build size reduced by X KB
- [ ] Test coverage increased to X%
- [ ] ESLint errors reduced to 0
- [ ] TypeScript strict mode passing
- [ ] Performance benchmarks improved by X%

### Quality Gates
- ✅ No unused exports
- ✅ No code duplication >10 lines
- ✅ All functions <50 lines (except specific cases)
- ✅ All files <500 lines (except specific cases)
- ✅ 100% type safety (no `any`)
- ✅ All public APIs documented
- ✅ All routers use consistent patterns

---

## 🚀 Execution Strategy

### Recommended Order
1. **Phase 1** (Dead Code) - Clean up immediately
2. **Phase 6** (Testing) - Ensure nothing breaks during refactoring
3. **Phase 2** (Duplication) - Refactor with tests in place
4. **Phase 3** (Organization) - Restructure with confidence
5. **Phase 5** (Quality) - Polish and improve
6. **Phase 4** (Performance) - Optimize based on real data
7. **Phase 7** (Documentation) - Document final state

### Timeline
- **Quick Wins:** Day 1 (2 hours)
- **Phase 1-2:** Day 2-3 (6-8 hours)
- **Phase 3-5:** Day 4-5 (7-10 hours)
- **Phase 6-7:** Day 6 (3-5 hours)

**Total Estimated Time:** 18-25 hours over 6 days

---

## 🤔 Decision Log

### Decisions Needed
1. **Model Preloader**: Delete or keep disabled?
   - PRO keep: May want to re-enable later
   - PRO delete: Not using it, causing RAM issues
   - **DECISION:** Keep disabled with clear documentation

2. **OpenAI Factory Pattern**: Keep or simplify?
   - PRO keep: Scalable, easy to add models
   - PRO simplify: May be over-engineered for 4 models
   - **DECISION:** TBD

3. **Core.ts Split**: How many files?
   - Option A: Keep as is
   - Option B: Split into 4 API modules
   - Option C: Full API client class
   - **DECISION:** TBD

---

## 📝 Notes

- Maintain backwards compatibility where possible
- Test thoroughly after each phase
- Commit frequently with clear messages
- Document all breaking changes
- Get review/approval before major refactors

---

**Next Steps:**
1. Review this plan with team/stakeholders
2. Prioritize phases based on business needs
3. Set up testing infrastructure if missing
4. Begin with Quick Wins for immediate impact
5. Execute phases systematically

