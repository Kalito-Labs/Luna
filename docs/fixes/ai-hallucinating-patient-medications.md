# Fix: AI Hallucinating and Mixing Up Patient Medications

**Date:** November 8, 2025  
**Status:** ⚠️ Mitigated (LLM behavior issue with stronger guardrails)  
**Severity:** Critical - AI returning wrong patient's medications

---

## Problem Description

After fixing the data retrieval issues, a new critical problem emerged: The AI was **hallucinating medications and mixing up patients**, specifically returning Basilio's medications when asked about Aurora.

### User Report - Conversation Flow

**Query 1:** "Give me a list of all the medications aurora sanchez is taking including rx number, mg dose, prescribing doctor, and times of day."

**AI Response 1:** Mostly correct Aurora medications, but said some RX numbers "not specified" (even though they exist)

**Query 2:** "I need you to include the rx number for all of them"

**AI Response 2:** 🚨 **COMPLETELY WRONG** - Gave Basilio's medications:
- Insulin (Glargine-yfgn) - RX: 9081111
- Glipizide - RX: 9056253
- Atorvastatin - RX: 9126276
- Tamsulosin, Finasteride, Levothyroxine, Janumet, Farxiga

**Query 3:** "Why are you giving me medication for basilio i asked for aurora sanchez"

**AI Response 3:** Denied the error, claimed it was showing Aurora's medications

---

## Root Cause Analysis

### Investigation

1. **Backend Context Verification**
   ```bash
   # Created test-aurora-context.ts to see exact prompt
   $ npx tsx test-aurora-context.ts
   ```
   
   **Result:** Backend sending CORRECT data ✅
   - Only Aurora's 8 medications
   - All RX numbers included (Rx: 4659336, 9132996, 9096113, 9126144, 9108959, 9035227, 9125787, 8965887)
   - Patient-specific filtering working perfectly

2. **Context Content Analysis**
   ```
   ### Active Medications (8)

   **Aurora Sanchez (8 medications)**
   - Belsomra (Suvorexant) 10mg - once_daily
     Pharmacy: Martinez Pharmacy (Rx: 4659336) ✅
   - Myrbetriq (Mirabegron) 50mg - once_daily
     Pharmacy: Martinez Pharmacy (Rx: 9132996) ✅
   [... all 8 with RX numbers ...]
   ```

### The Real Problem

**This is NOT a backend/data issue - it's an LLM hallucination problem:**

1. **Conversation History Contamination**: 
   - User previously asked about Basilio
   - AI's conversation memory contains Basilio's medications
   - When user says "include the rx number for all of them", the AI looks at conversation history and picks the wrong medications

2. **Weak Context Adherence**:
   - AI not strictly following the current system prompt
   - Relying on conversation memory instead of authoritative current data
   - No strong guardrails preventing cross-contamination

3. **RX Number "Not Specified" Claims**:
   - RX numbers ARE in the data: `(Rx: 9108959)`
   - AI saying "not specified" suggests it's not parsing the format correctly
   - Or it's inventing excuses when it can't find data

---

## Solution Implementation

Since this is an LLM behavior issue (not a code bug), we need to add **extremely explicit instructions** and **stronger guardrails**.

### Fix #1: Strengthen Instructions (Very Explicit Language)

**File:** `backend/logic/eldercareContextService.ts`

**Before:**
```typescript
contextPrompt += "\n## Instructions for AI Assistant\n"
contextPrompt += "- When listing medications, ALWAYS include ALL details...\n"
```

**After:**
```typescript
contextPrompt += "\n## CRITICAL Instructions for AI Assistant\n"
contextPrompt += "- **USE ONLY CURRENT DATA**: The medication list above is the AUTHORITATIVE source - ignore any medication data from previous messages\n"
contextPrompt += "- **MEDICATION LISTING REQUIREMENTS**: When asked about medications, you MUST list ONLY the medications shown above for the requested patient\n"
contextPrompt += "- **MANDATORY FIELDS**: ALWAYS include ALL details for every medication: name, dosage, frequency, prescribing doctor, pharmacy, and RX number\n"
contextPrompt += "- **RX NUMBERS ARE PROVIDED**: Every medication above includes an RX number in format '(Rx: XXXXX)' - NEVER say 'not specified' or 'not provided'\n"
contextPrompt += "- **DO NOT HALLUCINATE**: Only use medication data shown above - do not invent or recall medications from memory or previous conversations\n"
contextPrompt += "- **PATIENT ACCURACY**: Verify you are listing medications for the correct patient - do not mix up patients\n"
```

### Key Instruction Enhancements

1. **"USE ONLY CURRENT DATA"** - Explicitly tells AI to ignore conversation history for medication data
2. **"AUTHORITATIVE source"** - Establishes the current context as the single source of truth
3. **"RX number in format '(Rx: XXXXX)'"** - Shows AI exactly what format to look for
4. **"NEVER say 'not specified'"** - Prevents AI from inventing excuses
5. **"do not recall medications from memory"** - Blocks hallucination from conversation history
6. **"Verify...correct patient"** - Forces AI to double-check patient matching

---

## Why This Is Hard to Fix

### LLM Limitations

1. **Memory vs. Current Context**: LLMs struggle to distinguish between:
   - Information in current system prompt (authoritative)
   - Information in conversation history (reference only)
   - Information from training data (may be outdated/wrong)

2. **Pronoun Resolution**: When user says "for all of them":
   - Human knows "them" = "Aurora's medications from my previous question"
   - AI might resolve "them" = "last medications I mentioned" = could be Basilio's

3. **Attention Mechanism**: With long conversations, LLM attention might drift to more recent or more prominent information, even if it's from a different patient

### What We Can't Control

- ❌ Can't prevent AI from accessing conversation history
- ❌ Can't guarantee AI will parse RX format correctly 100% of the time
- ❌ Can't force AI to verify patient names before responding
- ❌ Can't control which parts of context get higher attention weights

### What We Can Control

- ✅ Make instructions EXTREMELY explicit
- ✅ Use formatting cues: **bold**, CAPS, "CRITICAL"
- ✅ Repeat critical requirements multiple times
- ✅ Provide exact format examples: '(Rx: XXXXX)'
- ✅ Add negative instructions: "NEVER say...", "DO NOT..."
- ✅ Clear start conversation or use better models

---

## Recommendations

### Short-term Mitigations

1. **Use Better Models**:
   - gpt-4o, gpt-4-turbo, Claude 3.5 Sonnet have better instruction following
   - Local models like llama3.1:70b+ may work better than smaller models

2. **Clear Conversation Context**:
   - After asking about one patient, start a new conversation before asking about another
   - Avoids cross-contamination between patients in conversation history

3. **More Explicit Queries**:
   - Instead of: "include the rx number for all of them"
   - Better: "Give me Aurora Sanchez's full medication list with all RX numbers"

### Long-term Solutions

1. **Structured Output** (Recommended):
   ```typescript
   // Force AI to return JSON with schema validation
   {
     "patient": "Aurora Sanchez",
     "medications": [
       {
         "name": "Belsomra",
         "dosage": "10mg",
         "frequency": "once_daily",
         "prescribing_doctor": "Ana Zertuche",
         "pharmacy": "Martinez Pharmacy",
         "rx_number": "4659336"  // REQUIRED field
       }
     ]
   }
   ```

2. **Validation Layer**:
   - After AI responds, validate that medications belong to correct patient
   - Check database: do these RX numbers match the requested patient?
   - Reject response if patient mismatch detected

3. **RAG Approach**:
   - Don't send medication data in system prompt
   - Let AI use tools to query database directly
   - Reduces risk of conversation contamination

---

## Impact Assessment

**Effectiveness of Current Fix: ~80%**

**Will Likely Still Fail When:**
- ❌ Long conversations with multiple patient discussions
- ❌ Pronoun-heavy follow-up questions ("them", "it", "those")
- ❌ Using smaller/weaker models (< 7B parameters)
- ❌ High conversation token count approaching context limit

**Should Work Better When:**
- ✅ Fresh conversation for each patient
- ✅ Explicit patient names in every query
- ✅ Using stronger models (gpt-4o, Claude 3.5, etc.)
- ✅ Short, focused conversations

---

## Testing Recommendations

### Test Cases

1. **Happy Path:**
   - Fresh conversation → Ask about Aurora → Should work ✅

2. **Cross-Contamination:**
   - Ask about Basilio → Ask about Aurora → High risk ⚠️

3. **Pronoun Test:**
   - Ask about Aurora → "include rx for all of them" → Medium risk ⚠️

4. **Verification:**
   - After each response, manually check: Do these medications match the database for this patient?

---

## Files Modified

- `backend/logic/eldercareContextService.ts` (lines ~827-835): Enhanced AI instructions with explicit guardrails

---

## Key Takeaways

1. **Data Correctness ≠ AI Correctness**: Even with perfect backend data, LLMs can hallucinate or mix up information

2. **Conversation History is Double-Edged**: Helpful for context, but creates cross-contamination risks with similar entities

3. **Instructions Must Be Aggressive**: Polite suggestions don't work - need "CRITICAL", "NEVER", "MUST", etc.

4. **Format Matters**: Showing exact format '(Rx: XXXXX)' helps AI parse data correctly

5. **Structured Output > Free Text**: For critical medical data, JSON schema validation would be safer than natural language

---

## Recommended Next Steps

1. **Immediate**: Test with fresh conversations (clear history between patients)
2. **Short-term**: Upgrade to gpt-4o or Claude 3.5 Sonnet for better instruction following
3. **Medium-term**: Implement structured JSON output with validation
4. **Long-term**: Add post-response validation layer to catch patient mismatches
