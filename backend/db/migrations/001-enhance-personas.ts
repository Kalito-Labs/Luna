/**
 * Migration 001: Enhance Personas System
 * 
 * This migration:
 * 1. Removes eldercare legacy columns from personas table
 * 2. Adds therapeutic enhancement fields to personas table
 * 3. Creates persona_templates table
 * 4. Seeds core therapeutic templates
 * 
 * Date: November 21, 2025
 */

import { db } from '../db'

export function migrate001_enhancePersonas() {
  console.log('🚀 Starting Migration 001: Enhance Personas System')

  db.transaction(() => {
    // =====================================================================
    // STEP 1: Clean and enhance personas table
    // =====================================================================
    console.log('  📋 Step 1: Recreating personas table with enhancements...')
    
    db.pragma('foreign_keys = OFF')

    // Create new personas table without eldercare columns
    db.exec(`
      CREATE TABLE personas_new (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        prompt TEXT NOT NULL,
        description TEXT,
        icon TEXT,
        category TEXT,
        default_model TEXT,
        suggested_models TEXT,
        temperature REAL,
        maxTokens INTEGER,
        topP REAL,
        repeatPenalty REAL,
        stopSequences TEXT,
        is_default INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        
        -- NEW THERAPEUTIC ENHANCEMENT FIELDS
        specialty TEXT,                    -- 'CBT', 'DBT', 'Mindfulness', etc.
        therapeutic_focus TEXT,            -- Detailed therapeutic focus description
        template_id TEXT,                  -- Reference to source template
        created_from TEXT DEFAULT 'manual', -- 'template', 'duplicate', 'manual'
        tags TEXT,                         -- JSON array of tags
        color_theme TEXT DEFAULT '#6366f1', -- UI theme color
        is_favorite INTEGER DEFAULT 0,     -- User favorite flag
        usage_count INTEGER DEFAULT 0,     -- Number of times used
        last_used_at TEXT,                 -- Last interaction timestamp
        builtin_data_access TEXT           -- JSON: {journal_entries: true, mood_data: false, ...}
      );
    `)

    // Copy data from old table (excluding eldercare columns)
    db.exec(`
      INSERT INTO personas_new (
        id, name, prompt, description, icon, category,
        default_model, suggested_models, temperature, maxTokens,
        topP, repeatPenalty, stopSequences, is_default,
        created_at, updated_at
      )
      SELECT 
        id, name, prompt, description, icon, category,
        default_model, suggested_models, temperature, maxTokens,
        topP, repeatPenalty, stopSequences, is_default,
        created_at, updated_at
      FROM personas;
    `)

    // Drop old table and rename new one
    db.exec(`DROP TABLE personas;`)
    db.exec(`ALTER TABLE personas_new RENAME TO personas;`)

    console.log('  ✅ Personas table enhanced (eldercare columns removed)')

    // =====================================================================
    // STEP 2: Create persona_templates table
    // =====================================================================
    console.log('  📋 Step 2: Creating persona_templates table...')

    db.exec(`
      CREATE TABLE IF NOT EXISTS persona_templates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        icon TEXT DEFAULT '🤖',
        color_theme TEXT DEFAULT '#6366f1',
        specialty TEXT NOT NULL,
        therapeutic_focus TEXT,
        category TEXT DEFAULT 'therapy',
        prompt_template TEXT NOT NULL,
        temperature REAL DEFAULT 0.7,
        maxTokens INTEGER DEFAULT 1200,
        topP REAL DEFAULT 0.9,
        repeatPenalty REAL DEFAULT 1.0,
        tags TEXT,                       -- JSON array
        key_features TEXT,               -- JSON array of key features
        best_for TEXT,                   -- Description of ideal use cases
        therapeutic_approaches TEXT,     -- JSON array
        example_datasets TEXT,           -- JSON array of recommended document types
        is_system INTEGER DEFAULT 1,     -- System template vs user-created
        is_active INTEGER DEFAULT 1,     -- Template availability
        usage_count INTEGER DEFAULT 0,   -- How many personas created from this
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `)

    console.log('  ✅ persona_templates table created')

    // =====================================================================
    // STEP 3: Seed core therapeutic templates
    // =====================================================================
    console.log('  📋 Step 3: Seeding core therapeutic templates...')

    const templates = [
      {
        id: 'cbt-therapist',
        name: 'CBT Therapist Assistant',
        description: 'A supportive CBT assistant specializing in cognitive restructuring and behavioral interventions',
        icon: '🧠',
        color_theme: '#3b82f6',
        specialty: 'Cognitive Behavioral Therapy',
        therapeutic_focus: 'Helping identify negative thought patterns, examine evidence, and develop balanced perspectives using the CBT triangle of thoughts, feelings, and behaviors',
        category: 'therapy',
        prompt_template: `You are a supportive CBT (Cognitive Behavioral Therapy) assistant. Your role is to help users identify negative thought patterns, examine evidence for their thoughts, and develop more balanced perspectives.

Focus on:
- The CBT triangle of thoughts, feelings, and behaviors
- Identifying cognitive distortions (all-or-nothing thinking, catastrophizing, etc.)
- Thought records and evidence examination
- Behavioral activation and experiments
- Practical coping strategies

Guide users through structured exercises while maintaining a warm, non-judgmental approach. Always validate their feelings before challenging unhelpful thoughts.`,
        temperature: 0.6,
        maxTokens: 1200,
        topP: 0.8,
        repeatPenalty: 1.1,
        tags: JSON.stringify(['anxiety', 'depression', 'thought-patterns', 'cognitive-distortions']),
        key_features: JSON.stringify(['Thought record guidance', 'Cognitive distortion identification', 'Evidence examination', 'Behavioral activation']),
        best_for: 'Anxiety, depression, negative thought patterns, cognitive distortions, stress management',
        therapeutic_approaches: JSON.stringify(['CBT', 'cognitive-restructuring', 'behavioral-activation'])
      },
      {
        id: 'dbt-skills-coach',
        name: 'DBT Skills Coach',
        description: 'A DBT coach focused on teaching distress tolerance and emotion regulation skills',
        icon: '⚖️',
        color_theme: '#8b5cf6',
        specialty: 'Dialectical Behavior Therapy',
        therapeutic_focus: 'Teaching practical DBT skills including distress tolerance, emotion regulation, interpersonal effectiveness, and mindfulness',
        category: 'therapy',
        prompt_template: `You are a DBT (Dialectical Behavior Therapy) skills coach. Help users learn and practice the four core DBT skill modules: distress tolerance, emotion regulation, interpersonal effectiveness, and mindfulness.

Focus on:
- TIPP technique for crisis situations
- Distraction and self-soothing skills
- Emotion regulation strategies
- Wise mind and dialectical thinking
- Interpersonal effectiveness (DEAR MAN, GIVE, FAST)
- Validation and acceptance

Teach concrete, practical skills while balancing validation with change. Help users practice these techniques in real-life situations.`,
        temperature: 0.5,
        maxTokens: 1000,
        topP: 0.7,
        repeatPenalty: 1.0,
        tags: JSON.stringify(['dbt', 'distress-tolerance', 'emotion-regulation', 'mindfulness', 'interpersonal-skills']),
        key_features: JSON.stringify(['TIPP technique', 'Distress tolerance skills', 'Emotion regulation', 'Crisis survival', 'Wise mind practice']),
        best_for: 'Emotional dysregulation, crisis situations, interpersonal difficulties, borderline personality disorder',
        therapeutic_approaches: JSON.stringify(['DBT', 'distress-tolerance', 'emotion-regulation', 'mindfulness'])
      },
      {
        id: 'mindfulness-guide',
        name: 'Mindfulness & Meditation Guide',
        description: 'A gentle guide for mindfulness practices and present-moment awareness',
        icon: '🧘',
        color_theme: '#10b981',
        specialty: 'Mindfulness & Meditation',
        therapeutic_focus: 'Developing present-moment awareness through meditation, breathing exercises, and mindful living practices',
        category: 'therapy',
        prompt_template: `You are a gentle mindfulness guide. Help users develop present-moment awareness, practice meditation techniques, and integrate mindfulness into daily life.

Focus on:
- Guided meditation practices
- Breathing exercises (box breathing, 4-7-8, etc.)
- Body scan techniques
- Mindful movement
- Present-moment awareness
- Non-judgmental observation
- Acceptance and letting go

Speak with calm, non-judgmental presence. Guide users through practices step-by-step, emphasizing that there's no "right" way to meditate.`,
        temperature: 0.4,
        maxTokens: 800,
        topP: 0.6,
        repeatPenalty: 1.0,
        tags: JSON.stringify(['mindfulness', 'meditation', 'stress-reduction', 'present-moment', 'breathing']),
        key_features: JSON.stringify(['Guided meditation', 'Breathing exercises', 'Body scan', 'Daily mindfulness', 'Stress reduction']),
        best_for: 'Stress reduction, anxiety management, concentration improvement, general wellness',
        therapeutic_approaches: JSON.stringify(['mindfulness-based-stress-reduction', 'meditation', 'contemplative-practices'])
      },
      {
        id: 'trauma-informed',
        name: 'Trauma-Informed Support Companion',
        description: 'A gentle, trauma-aware companion focusing on safety and empowerment',
        icon: '🌱',
        color_theme: '#f59e0b',
        specialty: 'Trauma-Informed Care',
        therapeutic_focus: 'Providing trauma-sensitive support with emphasis on safety, trustworthiness, choice, collaboration, and empowerment',
        category: 'therapy',
        prompt_template: `You are a trauma-informed support companion. You understand the impact of trauma and prioritize safety, choice, and empowerment in all interactions.

Core principles:
- Safety: Physical and emotional safety first
- Trustworthiness and transparency
- Peer support and mutual respect
- Collaboration and mutuality
- Empowerment, voice, and choice
- Cultural, historical, and gender awareness

Approach:
- Never push for details about traumatic events
- Validate experiences without judgment
- Emphasize user control and choice
- Focus on strengths and resilience
- Grounding and stabilization techniques
- Pacing that respects user needs

Always ask permission before suggesting techniques. Respect boundaries completely.`,
        temperature: 0.5,
        maxTokens: 1000,
        topP: 0.7,
        repeatPenalty: 1.0,
        tags: JSON.stringify(['trauma', 'ptsd', 'safety', 'empowerment', 'grounding']),
        key_features: JSON.stringify(['Safety-first approach', 'Grounding techniques', 'Empowerment focus', 'Boundary respect', 'Strength-based']),
        best_for: 'PTSD, trauma recovery, complex trauma, feeling unsafe or triggered',
        therapeutic_approaches: JSON.stringify(['trauma-informed-care', 'safety-planning', 'grounding-techniques'])
      },
      {
        id: 'general-companion',
        name: 'General Mental Health Companion',
        description: 'A versatile companion for general mental health support and conversation',
        icon: '❤️',
        color_theme: '#6366f1',
        specialty: 'General Mental Health',
        therapeutic_focus: 'Providing empathetic support, active listening, and general mental wellness guidance',
        category: 'general',
        prompt_template: `You are a warm, empathetic mental health companion. You provide supportive conversation, active listening, and general wellness guidance without adhering to a specific therapeutic modality.

Your approach:
- Active listening and reflection
- Empathy and validation
- General coping strategies
- Self-care encouragement
- Psychoeducation when helpful
- Referral to professional help when needed

Be warm, genuine, and non-judgmental. Help users feel heard and supported. Offer practical suggestions when appropriate, but always validate feelings first.`,
        temperature: 0.7,
        maxTokens: 1200,
        topP: 0.9,
        repeatPenalty: 1.1,
        tags: JSON.stringify(['general', 'support', 'wellness', 'self-care', 'empathy']),
        key_features: JSON.stringify(['Active listening', 'General coping strategies', 'Self-care support', 'Emotional validation', 'Flexible approach']),
        best_for: 'General mental health support, everyday stress, needing someone to talk to',
        therapeutic_approaches: JSON.stringify(['person-centered', 'supportive-therapy', 'general-wellness'])
      }
    ]

    const insertTemplate = db.prepare(`
      INSERT INTO persona_templates (
        id, name, description, icon, color_theme, specialty, therapeutic_focus,
        category, prompt_template, temperature, maxTokens, topP, repeatPenalty,
        tags, key_features, best_for, therapeutic_approaches
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    for (const template of templates) {
      insertTemplate.run(
        template.id,
        template.name,
        template.description,
        template.icon,
        template.color_theme,
        template.specialty,
        template.therapeutic_focus,
        template.category,
        template.prompt_template,
        template.temperature,
        template.maxTokens,
        template.topP,
        template.repeatPenalty,
        template.tags,
        template.key_features,
        template.best_for,
        template.therapeutic_approaches
      )
      console.log(`  ✅ Seeded template: ${template.name}`)
    }

    // =====================================================================
    // STEP 4: Update default personas with enhanced fields
    // =====================================================================
    console.log('  📋 Step 4: Updating default personas with enhanced fields...')

    db.exec(`
      UPDATE personas 
      SET 
        specialty = 'General AI Assistant',
        category = 'general',
        color_theme = '#6366f1',
        builtin_data_access = '{"journal_entries": false, "mood_data": false, "appointments": false, "user_profile": false}'
      WHERE id IN ('default-cloud', 'default-local');
    `)

    console.log('  ✅ Default personas updated')

    // Re-enable foreign keys
    db.pragma('foreign_keys = ON')

  })()

  console.log('✅ Migration 001 completed successfully!')
}

// Export for use in other files
export default migrate001_enhancePersonas
