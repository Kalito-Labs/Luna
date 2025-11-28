<template>
  <div class="act-page">
    <!-- Back Button -->
    <button @click="$emit('back')" class="back-button">
      <span class="back-arrow">←</span>
      <span>Back to Therapy Resources</span>
    </button>

    <main class="main-content">
      <div class="container">
        
        <!-- Introduction Section -->
        <section class="intro-section">
          <div class="section-header">
            <h1 class="page-title">ACT</h1>
            <p class="page-subtitle">
Acceptance and Commitment Therapy
            </p>
          </div>
        </section>

        <!-- Cognitive Defusion Section -->
        <section class="defusion-section">
          <div class="section-header">
            <h2 class="section-title">🎭 Cognitive Defusion</h2>
            <p class="section-subtitle">
              Create distance between you and your thoughts - see them as mental events, not facts
            </p>
          </div>

          <div class="defusion-problem glass-card">
            <h3>⚠️ The Problem: Fusion</h3>
            <p class="fusion-explanation">
              When we're "fused" with thoughts, we treat them as literal truth, commands, or threats. 
              The thought "I'm worthless" becomes "I AM worthless."
            </p>
            <div class="fusion-examples">
              <div class="fusion-example">
                <span class="fusion-icon">❌</span>
                <div class="fusion-text">
                  <strong>Fused:</strong> "I'm stupid"
                </div>
              </div>
              <div class="fusion-example">
                <span class="fusion-icon">✅</span>
                <div class="fusion-text">
                  <strong>Defused:</strong> "I'm having the thought that I'm stupid"
                </div>
              </div>
            </div>
          </div>

          <div class="defusion-techniques glass-card">
            <h3>🛠️ Defusion Techniques</h3>
            <p class="techniques-intro">Try these practices to create space from difficult thoughts:</p>
            
            <div class="techniques-grid">
              <!-- Technique 1 -->
              <div class="technique-card">
                <div class="technique-header">
                  <span class="technique-icon">💭</span>
                  <h4>"I'm having the thought that..."</h4>
                </div>
                <p class="technique-description">
                  Prefix troubling thoughts with this phrase to create observer perspective.
                </p>
                <div class="technique-example">
                  <strong>Try it:</strong> Take a negative thought and add this prefix. Notice how it feels different.
                </div>
              </div>

              <!-- Technique 2 -->
              <div class="technique-card">
                <div class="technique-header">
                  <span class="technique-icon">📖</span>
                  <h4>Name the Story</h4>
                </div>
                <p class="technique-description">
                  Recognize repetitive thought patterns as familiar stories.
                </p>
                <div class="technique-example">
                  <strong>Example:</strong> "Ah, there's the 'I'm not good enough' story again"
                </div>
              </div>

              <!-- Technique 3 -->
              <div class="technique-card">
                <div class="technique-header">
                  <span class="technique-icon">🙏</span>
                  <h4>Thank Your Mind</h4>
                </div>
                <p class="technique-description">
                  Acknowledge thoughts without obeying them.
                </p>
                <div class="technique-example">
                  <strong>Say:</strong> "Thanks mind, I know you're trying to protect me"
                </div>
              </div>

              <!-- Technique 4 -->
              <div class="technique-card">
                <div class="technique-header">
                  <span class="technique-icon">🎪</span>
                  <h4>Silly Voices</h4>
                </div>
                <p class="technique-description">
                  Say the thought in a cartoon character voice or sing it to "Happy Birthday."
                </p>
                <div class="technique-example">
                  <strong>Effect:</strong> Makes the thought lose its power and authority
                </div>
              </div>

              <!-- Technique 5 -->
              <div class="technique-card">
                <div class="technique-header">
                  <span class="technique-icon">🍃</span>
                  <h4>Leaves on a Stream</h4>
                </div>
                <p class="technique-description">
                  Visualize thoughts as leaves floating down a stream. Watch them drift by without grabbing them.
                </p>
                <div class="technique-example">
                  <strong>Practice:</strong> Close your eyes and imagine this for 2 minutes
                </div>
              </div>

              <!-- Technique 6 -->
              <div class="technique-card">
                <div class="technique-header">
                  <span class="technique-icon">📝</span>
                  <h4>Thoughts as Text</h4>
                </div>
                <p class="technique-description">
                  Imagine the thought written on a sign or scrolling on a screen.
                </p>
                <div class="technique-example">
                  <strong>Result:</strong> See the thought as an object, not truth
                </div>
              </div>
            </div>

            <!-- Interactive Exercise -->
            <div class="defusion-exercise">
              <h4>🎯 Try It Now</h4>
              <p>Write a difficult thought you're having, then practice defusion:</p>
              <textarea 
                v-model="defusionThought"
                placeholder="e.g., 'I'm going to fail this project'"
                class="defusion-input"
              ></textarea>
              <div v-if="defusionThought" class="defusion-result">
                <p><strong>Original:</strong> "{{ defusionThought }}"</p>
                <p><strong>Defused:</strong> "I'm having the thought that {{ defusionThought.toLowerCase() }}"</p>
                <p><strong>Named:</strong> "There's the '{{ defusionThought.toLowerCase() }}' story"</p>
                <p><strong>Thanked:</strong> "Thanks mind for the '{{ defusionThought.toLowerCase() }}' thought"</p>
                <button @click="saveDefusionPractice" class="save-defusion-button">
                  Save This Practice
                </button>
              </div>
            </div>
          </div>

          <!-- Saved Defusion Practices -->
          <div v-if="savedDefusionPractices.length > 0" class="saved-defusions glass-card">
            <h3>Your Defusion Practice History</h3>
            <div class="defusions-list">
              <div 
                v-for="practice in savedDefusionPractices" 
                :key="practice.id"
                class="defusion-item"
              >
                <div class="defusion-item-header">
                  <span class="defusion-item-date">{{ formatDate(practice.createdAt) }}</span>
                </div>
                <p class="defusion-original-thought">"{{ practice.originalThought }}"</p>
                <div class="defusion-reframes">
                  <div class="reframe">
                    <strong>Defused:</strong> "{{ practice.defusedThought }}"
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Values & Action Section -->
        <section class="values-action-section">
          <div class="section-header">
            <h2 class="section-title">💎 Your Values & Committed Actions</h2>
            <p class="section-subtitle">
              Discover what truly matters to you and transform values into concrete action
            </p>
          </div>

          <div class="values-explanation glass-card">
            <div class="values-vs-goals">
              <div class="comparison-item">
                <h4>🎯 Goals</h4>
                <p>Specific, achievable, then done</p>
                <div class="example">"Lose 20 pounds"</div>
              </div>
              <div class="vs-divider">VS</div>
              <div class="comparison-item">
                <h4>💎 Values</h4>
                <p>Ongoing direction, never "completed"</p>
                <div class="example">"Health and vitality"</div>
              </div>
            </div>
            <p class="comparison-note">Goals serve values - they're stepping stones toward what matters most</p>
          </div>

          <div class="values-domains glass-card">
            <h3>Life Domains</h3>
            <p>Explore what matters to you in each area of life:</p>
            <div class="domains-grid">
              <div 
                v-for="domain in lifeDomains" 
                :key="domain.id"
                class="domain-card"
                @click="selectDomain(domain.id)"
                :class="{ 'selected': selectedDomain === domain.id }"
              >
                <div class="domain-icon">{{ domain.icon }}</div>
                <h4>{{ domain.name }}</h4>
                <p>{{ domain.description }}</p>
              </div>
            </div>
          </div>

          <!-- Combined Values & Action Exercise -->
          <div v-if="selectedDomain" class="combined-exercise glass-card">
            <h3>{{ lifeDomains.find(d => d.id === selectedDomain)?.name }} - Values & Action Plan</h3>
            
            <!-- Reflection Questions -->
            <div class="reflection-section">
              <h4>Reflection Questions:</h4>
              <ul class="reflection-questions">
                <li v-for="question in valuesQuestions" :key="question">{{ question }}</li>
              </ul>
            </div>

            <!-- Values Input -->
            <div class="values-input-section">
              <h4>Your Values in This Domain:</h4>
              <textarea 
                v-model="domainValues[selectedDomain]"
                placeholder="What do you value most in this area of life? What would you want your life to stand for here?"
                class="values-textarea"
              ></textarea>
              <div class="consistency-rating">
                <label>How consistently are you living this value? (0-10)</label>
                <div class="rating-slider">
                  <input 
                    type="range" 
                    min="0" 
                    max="10" 
                    v-model="domainRatings[selectedDomain]"
                    class="slider"
                  >
                  <span class="rating-value">{{ domainRatings[selectedDomain] || 0 }}/10</span>
                </div>
              </div>
              <button @click="saveDomainValues(selectedDomain)" class="save-values-button">
                Save Values Reflection
              </button>
            </div>

            <div class="section-divider"></div>

            <!-- Action Planning -->
            <div class="action-planning-section">
              <h4>Plan Your Committed Action</h4>
              <p class="action-intro">Take concrete steps toward what matters, even when it's uncomfortable. This is where values become lived experience.</p>
              <div class="planning-form">
                <div class="form-group">
                  <label>1. Your Chosen Value:</label>
                  <input 
                    v-model="actionPlan.value" 
                    type="text" 
                    placeholder="e.g., Being a loving parent, Creative expression, Health and vitality"
                    class="form-input"
                  >
                </div>
                <div class="form-group">
                  <label>2. Your SMART Goal:</label>
                  <textarea 
                    v-model="actionPlan.goal"
                    placeholder="Make it specific, measurable, achievable, relevant, and time-bound"
                    class="form-textarea"
                  ></textarea>
                </div>
                <div class="form-group">
                  <label>3. First Small Step:</label>
                  <input 
                    v-model="actionPlan.firstStep" 
                    type="text" 
                    placeholder="What's the tiniest action you could take today?"
                    class="form-input"
                  >
                </div>
                <div class="form-group">
                  <label>4. Potential Barriers:</label>
                  <p class="field-note">What difficult thoughts or feelings might show up? (Remember: you can use your defusion skills with these!)</p>
                  <textarea 
                    v-model="actionPlan.barriers"
                    placeholder="e.g., 'I'll fail', anxiety, fear of judgment, discomfort..."
                    class="form-textarea"
                  ></textarea>
                </div>
                <div class="form-group">
                  <label>5. Willingness Statement:</label>
                  <p class="field-note">Willingness is the heart of psychological flexibility - being open to discomfort while moving toward what matters.</p>
                  <div class="willingness-template">
                    "I'm willing to feel <input v-model="actionPlan.willingnessFeel" type="text" placeholder="anxiety, discomfort, etc." class="inline-input"> 
                    in order to <input v-model="actionPlan.willingnessAction" type="text" placeholder="take this action toward my value" class="inline-input">"
                  </div>
                </div>
                <div class="form-actions">
                  <button @click="saveActionPlan" class="save-action-button">
                    Commit to This Action
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Saved Action Plans -->
          <div v-if="savedActionPlans.length > 0" class="saved-actions glass-card">
            <h3>Your Committed Actions</h3>
            <div class="actions-list">
              <div 
                v-for="plan in savedActionPlans" 
                :key="plan.id"
                class="action-item"
              >
                <div class="action-header">
                  <h4>{{ plan.value }}</h4>
                  <span class="action-date">{{ formatDate(plan.createdAt) }}</span>
                </div>
                <p class="action-goal">{{ plan.goal }}</p>
                <div class="action-status">
                  <strong>Next Step:</strong> {{ plan.firstStep }}
                </div>
                <div class="willingness-display">
                  <em>"I'm willing to feel {{ plan.willingnessFeel }} in order to {{ plan.willingnessAction }}"</em>
                </div>
              </div>
            </div>
          </div>

          <!-- Saved Values Reflections -->
          <div v-if="savedValuesReflections.length > 0" class="saved-values glass-card">
            <h3>Your Values Reflections</h3>
            <div class="values-list">
              <div 
                v-for="reflection in savedValuesReflections" 
                :key="reflection.id"
                class="reflection-item"
              >
                <div class="reflection-header">
                  <h4>{{ reflection.domainIcon }} {{ reflection.domainName }}</h4>
                  <span class="reflection-date">{{ formatDate(reflection.createdAt) }}</span>
                </div>
                <p class="reflection-values">{{ reflection.values }}</p>
                <div class="reflection-rating">
                  <strong>Consistency:</strong> 
                  <span class="rating-badge">{{ reflection.consistencyRating }}/10</span>
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>
    </main>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, reactive, computed, watch } from 'vue'
import { useTherapyStorage } from '@/composables/useTherapyStorage'
import type { TherapyRecord } from '@/composables/useTherapyStorage'
import { useCurrentUser } from '@/composables/useCurrentUser'

interface LifeDomain {
  id: string
  name: string
  icon: string
  description: string
}

interface DisidentificationItem {
  id: string
  category: string
  explanation: string
  completed: boolean
}

interface ActionPlan {
  id?: string
  value: string
  goal: string
  firstStep: string
  barriers: string
  willingnessFeel: string
  willingnessAction: string
  createdAt?: string
}

interface DefusionPractice {
  id?: string
  originalThought: string
  defusedThought: string
  createdAt?: string
}

// ACT-specific therapy record data types
interface ACTActionPlanData {
  type: 'action_plan'
  actionPlan: ActionPlan
}

interface ACTValuesReflectionData {
  type: 'values_reflection'
  domainId: string
  domainName: string
  values: string
  consistencyRating: number
}

interface ACTDefusionData {
  type: 'defusion_practice'
  defusionPractice: DefusionPractice
}

interface ACTDisidentificationData {
  type: 'disidentification'
  items: DisidentificationItem[]
  completedCount: number
}

type ACTRecordData = ACTActionPlanData | ACTValuesReflectionData | ACTDefusionData | ACTDisidentificationData

export default defineComponent({
  name: 'ACTView',
  components: {},
  emits: ['back'],
  setup() {
    // Get current user (Kaleb) from database by name
    const { patientId, patientName, isReady, ensureLoaded } = useCurrentUser()

    // Initialize therapy storage for ACT exercises with dynamic patient ID
    const {
      records: therapyRecords,
      isLoading,
      error: storageError,
      save: saveToTherapy,
      remove: removeFromTherapy,
      load: loadRecords
    } = useTherapyStorage<ACTRecordData>({
      therapyType: 'act',
      patientId: patientId, // Pass the ref directly, not .value
      useBackend: true
    })

    // Watch for patient ID to become available, then load records
    watch(patientId, (newPatientId) => {
      if (newPatientId) {
        console.log('🔵 Patient ID loaded for ACT, fetching records for:', newPatientId)
        loadRecords().catch((err: Error) => console.error('Failed to load ACT records:', err))
      }
    }, { immediate: false })

    const selectedDomain = ref<string | null>(null)
    const defusionThought = ref<string>('')

    const lifeDomains: LifeDomain[] = [
      {
        id: 'relationships',
        name: 'Relationships',
        icon: '💕',
        description: 'Family, romantic, friendships'
      },
      {
        id: 'work',
        name: 'Work/Career',
        icon: '💼',
        description: 'Professional growth, contribution'
      },
      {
        id: 'education',
        name: 'Learning & Growth',
        icon: '📚',
        description: 'Personal development, skills'
      },
      {
        id: 'recreation',
        name: 'Recreation',
        icon: '🎨',
        description: 'Fun, hobbies, creativity'
      },
      {
        id: 'spirituality',
        name: 'Spirituality',
        icon: '🙏',
        description: 'Meaning, transcendence'
      },
      {
        id: 'community',
        name: 'Community',
        icon: '🌍',
        description: 'Citizenship, giving back'
      },
      {
        id: 'health',
        name: 'Health',
        icon: '💪',
        description: 'Physical & mental well-being'
      },
      {
        id: 'environment',
        name: 'Environment',
        icon: '🌱',
        description: 'Nature, sustainability'
      }
    ]

    const disidentificationItems = ref<DisidentificationItem[]>([
      {
        id: '1',
        category: 'thoughts',
        explanation: 'They come and go, but I remain to observe them',
        completed: false
      },
      {
        id: '2',
        category: 'emotions',
        explanation: 'They pass through me like weather through the sky',
        completed: false
      },
      {
        id: '3',
        category: 'body',
        explanation: 'It changes constantly, but I am the one aware of it',
        completed: false
      },
      {
        id: '4',
        category: 'roles',
        explanation: 'I play many parts, but I am the actor behind them all',
        completed: false
      },
      {
        id: '5',
        category: 'past',
        explanation: 'It shaped me but doesn\'t define my present awareness',
        completed: false
      },
      {
        id: '6',
        category: 'labels',
        explanation: 'Others may categorize me, but I am beyond all categories',
        completed: false
      }
    ])

    const domainQuestions: Record<string, string[]> = {
      relationships: [
        'What kind of partner, friend, or family member do you want to be?',
        'How do you want others to feel when they\'re around you?',
        'What would a meaningful connection look like to you?',
        'If you could be remembered for one quality in relationships, what would it be?',
        'What small act of love or kindness could you offer today?'
      ],
      work: [
        'What impact do you want to have through your work?',
        'What strengths or talents do you want to develop and share?',
        'How do you want to contribute to something larger than yourself?',
        'What would make your work feel meaningful, regardless of external success?',
        'If money wasn\'t a concern, what would you still choose to do?'
      ],
      education: [
        'What would you love to learn just for the joy of learning?',
        'What skills or knowledge would enrich your life?',
        'How do you want to grow as a person this year?',
        'What would you attempt if you knew you couldn\'t fail?',
        'What does being a lifelong learner mean to you?'
      ],
      recreation: [
        'What activities make you lose track of time?',
        'How do you want to express your creativity and playfulness?',
        'What hobbies would bring more joy and vitality into your life?',
        'If you had a free day with no obligations, how would you ideally spend it?',
        'What does "play" mean to you as an adult?'
      ],
      spirituality: [
        'What gives your life deeper meaning beyond the everyday?',
        'How do you want to connect with something greater than yourself?',
        'What practices help you feel centered and at peace?',
        'What legacy of wisdom or values do you want to live by?',
        'What would living with more presence and awareness look like?'
      ],
      community: [
        'How do you want to contribute to your community or society?',
        'What causes or issues matter most to you?',
        'What kind of neighbor or citizen do you aspire to be?',
        'How can you use your privileges or resources to help others?',
        'What does being a good community member mean to you?'
      ],
      health: [
        'How do you want to treat your body and mind?',
        'What does vitality and wellness mean to you personally?',
        'What healthy habits would improve your quality of life?',
        'How do you want to feel in your body day-to-day?',
        'If your body could speak, what would it ask of you?'
      ],
      environment: [
        'What relationship do you want to have with nature?',
        'How do you want to care for the planet for future generations?',
        'What small changes could reduce your environmental impact?',
        'How does spending time in nature nourish you?',
        'What does environmental stewardship mean to you?'
      ]
    }

    const valuesQuestions = computed(() => {
      return selectedDomain.value ? domainQuestions[selectedDomain.value] : []
    })

    const domainValues = reactive<Record<string, string>>({})
    const domainRatings = reactive<Record<string, number>>({})

    const actionPlan = reactive<ActionPlan>({
      value: '',
      goal: '',
      firstStep: '',
      barriers: '',
      willingnessFeel: '',
      willingnessAction: ''
    })

    // Computed property to extract saved action plans from therapy records
    const savedActionPlans = computed(() => {
      return therapyRecords.value
        .filter((record: TherapyRecord<ACTRecordData>) => record.record_data && record.record_data.type === 'action_plan')
        .map((record: TherapyRecord<ACTRecordData>) => {
          const data = record.record_data as ACTActionPlanData
          return {
            ...data.actionPlan,
            id: record.id,
            createdAt: record.created_at
          }
        })
        .sort((a: ActionPlan, b: ActionPlan) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
    })

    // Computed property to extract saved values reflections from therapy records
    const savedValuesReflections = computed(() => {
      return therapyRecords.value
        .filter((record: TherapyRecord<ACTRecordData>) => record.record_data && record.record_data.type === 'values_reflection')
        .map((record: TherapyRecord<ACTRecordData>) => {
          const data = record.record_data as ACTValuesReflectionData
          const domain = lifeDomains.find(d => d.id === data.domainId)
          return {
            id: record.id,
            domainId: data.domainId,
            domainName: data.domainName,
            domainIcon: domain?.icon || '💎',
            values: data.values,
            consistencyRating: data.consistencyRating,
            createdAt: record.created_at
          }
        })
        .sort((a: { createdAt: string }, b: { createdAt: string }) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    })

    // Computed property to extract saved defusion practices from therapy records
    const savedDefusionPractices = computed(() => {
      return therapyRecords.value
        .filter((record: TherapyRecord<ACTRecordData>) => record.record_data && record.record_data.type === 'defusion_practice')
        .map((record: TherapyRecord<ACTRecordData>) => {
          const data = record.record_data as ACTDefusionData
          return {
            ...data.defusionPractice,
            id: record.id,
            createdAt: record.created_at
          }
        })
        .sort((a: DefusionPractice, b: DefusionPractice) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
    })

    // Methods
    const selectDomain = (domainId: string) => {
      selectedDomain.value = selectedDomain.value === domainId ? null : domainId
    }

    const saveDomainValues = async (domainId: string) => {
      const domain = lifeDomains.find(d => d.id === domainId)
      if (!domain || !domainValues[domainId]) return

      const actData: ACTValuesReflectionData = {
        type: 'values_reflection',
        domainId,
        domainName: domain.name,
        values: domainValues[domainId],
        consistencyRating: domainRatings[domainId] || 0
      }

      try {
        await saveToTherapy(actData)
        showToast(`${domain.name} values saved`, true)
      } catch (error) {
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.error('Error saving domain values:', error)
        }
        showToast('Failed to save values', false)
      }
    }

    const saveActionPlan = async () => {
      if (!actionPlan.value || !actionPlan.firstStep) {
        showToast('Please fill in at least your value and first step', false)
        return
      }

      const newPlan: ActionPlan = {
        id: Date.now().toString(),
        ...actionPlan,
        createdAt: new Date().toISOString()
      }

      // Save to backend via therapy storage
      const actData: ACTActionPlanData = {
        type: 'action_plan',
        actionPlan: newPlan
      }

      try {
        await saveToTherapy(actData)
        showToast('Action plan committed! Take your first step.', true)

        // Reset form
        Object.keys(actionPlan).forEach(key => {
          if (key !== 'id' && key !== 'createdAt') {
            (actionPlan as any)[key] = ''
          }
        })
      } catch (error) {
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.error('Error saving action plan:', error)
        }
        showToast('Failed to save action plan', false)
      }
    }

    const saveDefusionPractice = async () => {
      if (!defusionThought.value.trim()) {
        showToast('Please enter a thought first', false)
        return
      }

      const newPractice: DefusionPractice = {
        id: Date.now().toString(),
        originalThought: defusionThought.value,
        defusedThought: `I'm having the thought that ${defusionThought.value.toLowerCase()}`,
        createdAt: new Date().toISOString()
      }

      const actData: ACTDefusionData = {
        type: 'defusion_practice',
        defusionPractice: newPractice
      }

      try {
        await saveToTherapy(actData)
        showToast('Defusion practice saved!', true)

        // Reset form
        defusionThought.value = ''
      } catch (error) {
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.error('Error saving defusion practice:', error)
        }
        showToast('Failed to save defusion practice', false)
      }
    }

    const formatDate = (dateString: string) => {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        hour: 'numeric', 
        minute: '2-digit' 
      })
    }

    const showToast = (message: string, isSuccess: boolean = true) => {
      const toastDiv = document.createElement('div')
      toastDiv.textContent = message
      toastDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${isSuccess ? 'rgba(34, 197, 94, 0.9)' : 'rgba(239, 68, 68, 0.9)'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        z-index: 1000;
        font-weight: 500;
        backdrop-filter: blur(10px);
        transition: all 0.3s ease;
      `
      document.body.appendChild(toastDiv)
      
      setTimeout(() => {
        toastDiv.style.opacity = '0'
        toastDiv.style.transform = 'translateX(100%)'
        setTimeout(() => document.body.removeChild(toastDiv), 300)
      }, 3000)
    }

    return {
      selectedDomain,
      defusionThought,
      lifeDomains,
      disidentificationItems,
      valuesQuestions,
      domainValues,
      domainRatings,
      actionPlan,
      savedActionPlans,
      savedValuesReflections,
      savedDefusionPractices,
      isLoading,
      selectDomain,
      saveDomainValues,
      saveActionPlan,
      saveDefusionPractice,
      formatDate
    }
  }
})
</script>

<style scoped>
.back-button {
  position: fixed;
  top: 32px;
  left: 32px;
  z-index: 2000;
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.9);
  padding: 12px 20px;
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.back-button:hover {
  background: rgba(139, 92, 246, 0.2);
  border-color: rgba(139, 92, 246, 0.4);
  transform: translateX(-4px);
  box-shadow: 0 6px 24px rgba(139, 92, 246, 0.3);
}

.back-arrow {
  font-size: 1.2rem;
  transition: transform 0.3s ease;
}

.back-button:hover .back-arrow {
  transform: translateX(-4px);
}

.act-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: linear-gradient(135deg, 
    rgba(15, 23, 42, 0.95) 0%,
    rgba(30, 41, 59, 0.9) 50%,
    rgba(15, 23, 42, 0.95) 100%);
  color: rgba(255, 255, 255, 0.9);
  overflow: hidden;
}

.header-content {
  padding: 25px;
  position: relative;
  z-index: 100;
}

.main-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0;
  scroll-behavior: smooth;
}

.container {
  max-width: 1700px;
  margin: 0 auto;
  padding: 20px 20px 80px 20px;
}

.intro-section {
  margin-bottom: 60px;
}

.section-header {
  text-align: center;
  margin-bottom: 40px;
}

.page-title {
  background: linear-gradient(135deg, rgba(196, 181, 253, 1) 0%, rgba(139, 92, 246, 1) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-size: 3rem;
  font-weight: 800;
  margin: 0 0 20px 0;
}

.page-subtitle {
  color: rgba(196, 181, 253, 0.8);
  font-size: 1.4rem;
  margin: 0;
  max-width: 700px;
  margin: 0 auto;
  line-height: 1.6;
}

.section-title {
  background: linear-gradient(135deg, rgba(196, 181, 253, 1) 0%, rgba(139, 92, 246, 1) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-size: 2.2rem;
  font-weight: 700;
  margin: 0 0 15px 0;
}

.section-subtitle {
  color: rgba(196, 181, 253, 0.8);
  font-size: 1.2rem;
  margin: 0;
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
}

.glass-card {
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  padding: 32px;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.3),
    0 4px 16px rgba(139, 92, 246, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 24px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.concept-section {
  margin-bottom: 60px;
}

.problem-solution {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
}

.problem-box,
.solution-box {
  padding: 24px;
  border-radius: 12px;
  border: 2px solid;
}

.problem-box {
  background: rgba(239, 68, 68, 0.05);
  border-color: rgba(239, 68, 68, 0.3);
}

.solution-box {
  background: rgba(34, 197, 94, 0.05);
  border-color: rgba(34, 197, 94, 0.3);
}

.problem-box h4,
.solution-box h4 {
  margin: 0 0 16px 0;
  font-size: 1.3rem;
  font-weight: 600;
}

.problem-box ul,
.solution-box ul {
  margin: 16px 0 0 0;
  padding-left: 20px;
}

.problem-box li,
.solution-box li {
  margin-bottom: 8px;
  line-height: 1.5;
}

.sky-visualization {
  position: relative;
}

.sky-container {
  margin-bottom: 32px;
}

.sky-background {
  position: relative;
  height: 400px;
  background: linear-gradient(135deg, 
    rgba(59, 130, 246, 0.1) 0%,
    rgba(147, 197, 253, 0.05) 50%,
    rgba(219, 234, 254, 0.1) 100%);
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(147, 197, 253, 0.2);
}

.cloud-element,
.sun-element {
  position: absolute;
  padding: 12px 20px;
  border-radius: 25px;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.3s ease;
  animation: float 6s ease-in-out infinite;
}

.thought-cloud {
  background: rgba(107, 114, 128, 0.3);
  border: 1px solid rgba(107, 114, 128, 0.4);
  color: rgba(209, 213, 219, 1);
}

.emotion-cloud {
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.4);
  color: rgba(248, 113, 113, 1);
  animation-delay: -2s;
}

.memory-cloud {
  background: rgba(168, 85, 247, 0.2);
  border: 1px solid rgba(168, 85, 247, 0.4);
  color: rgba(196, 181, 253, 1);
  animation-delay: -4s;
}

.sun-element {
  background: rgba(251, 191, 36, 0.3);
  border: 1px solid rgba(251, 191, 36, 0.5);
  color: rgba(252, 211, 77, 1);
  animation-delay: -1s;
}

.observer-point {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.8) 0%, rgba(129, 140, 248, 0.8) 100%);
  color: white;
  padding: 16px 24px;
  border-radius: 50px;
  font-weight: 700;
  font-size: 1rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px rgba(139, 92, 246, 0.4);
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

.metaphor-explanation h4 {
  color: rgba(196, 181, 253, 1);
  margin-bottom: 20px;
  font-size: 1.3rem;
  font-weight: 600;
}

.metaphor-explanation ul {
  color: rgba(255, 255, 255, 0.85);
  padding-left: 20px;
}

.metaphor-explanation li {
  margin-bottom: 12px;
  line-height: 1.6;
  font-size: 1.05rem;
}

.section-divider {
  width: 100%;
  height: 1px;
  background: linear-gradient(90deg, 
    transparent 0%, 
    rgba(139, 92, 246, 0.3) 50%, 
    transparent 100%);
  margin: 48px 0 40px 0;
}

.defusion-header {
  text-align: center;
  margin-bottom: 32px;
}

.defusion-header h3 {
  color: rgba(196, 181, 253, 1);
  margin-bottom: 12px;
  font-size: 1.5rem;
  font-weight: 600;
}

.defusion-subtitle {
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
  font-size: 1rem;
  line-height: 1.5;
}

.exercise-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.exercises-section {
  margin-bottom: 60px;
}

.exercise-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  max-width: 900px;
  margin: 0 auto;
}

.exercise-icon {
  font-size: 3rem;
  margin-bottom: 16px;
  opacity: 0.8;
}

.exercise-content h4 {
  color: rgba(196, 181, 253, 1);
  margin-bottom: 16px;
  font-size: 1.5rem;
  font-weight: 600;
}

.exercise-description {
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 24px;
  line-height: 1.6;
}

.disidentification-list {
  width: 100%;
  max-width: 700px;
  margin: 32px auto 24px;
}

.disidentification-item {
  display: flex;
  align-items: flex-start;
  padding: 20px 24px;
  border-radius: 12px;
  background: rgba(139, 92, 246, 0.05);
  border-left: 4px solid rgba(139, 92, 246, 0.4);
  margin-bottom: 16px;
  text-align: left;
  transition: all 0.3s ease;
}

.disidentification-item:hover {
  background: rgba(139, 92, 246, 0.08);
  border-left-color: rgba(139, 92, 246, 0.6);
  transform: translateX(4px);
}

.item-content strong {
  color: rgba(196, 181, 253, 1);
  display: block;
  margin-bottom: 4px;
  font-size: 1rem;
}

.item-content p {
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.4;
}

.disidentification-affirmation {
  background: rgba(139, 92, 246, 0.1);
  border: 2px solid rgba(139, 92, 246, 0.3);
  border-radius: 12px;
  padding: 20px;
  margin-top: 24px;
}

.affirmation-text {
  color: rgba(196, 181, 253, 1);
  font-size: 1.1rem;
  font-weight: 500;
  text-align: center;
  margin: 0;
  line-height: 1.6;
}

.values-section {
  margin-bottom: 60px;
}

.values-vs-goals {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 32px;
  margin-bottom: 24px;
}

.comparison-item {
  text-align: center;
  flex: 1;
}

.comparison-item h4 {
  color: rgba(196, 181, 253, 1);
  margin-bottom: 12px;
  font-size: 1.3rem;
  font-weight: 600;
}

.comparison-item p {
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 16px;
  line-height: 1.5;
}

.example {
  background: rgba(139, 92, 246, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 8px;
  padding: 12px 16px;
  font-style: italic;
  color: rgba(196, 181, 253, 1);
}

.vs-divider {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.8) 0%, rgba(129, 140, 248, 0.8) 100%);
  color: white;
  padding: 12px 20px;
  border-radius: 50px;
  font-weight: 700;
  font-size: 1.1rem;
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.comparison-note {
  color: rgba(255, 255, 255, 0.7);
  text-align: center;
  font-style: italic;
  margin: 0;
}

.values-domains h3 {
  color: rgba(196, 181, 253, 1);
  margin-bottom: 16px;
  font-size: 1.5rem;
  font-weight: 600;
  text-align: center;
}

.domains-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-top: 24px;
}

.domain-card {
  background: rgba(255, 255, 255, 0.02);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.domain-card:hover {
  border-color: rgba(139, 92, 246, 0.4);
  background: rgba(139, 92, 246, 0.05);
  transform: translateY(-2px);
}

.domain-card.selected {
  border-color: rgba(139, 92, 246, 0.6);
  background: rgba(139, 92, 246, 0.1);
  box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.3);
}

.domain-icon {
  font-size: 2rem;
  margin-bottom: 12px;
  opacity: 0.8;
}

.domain-card h4 {
  color: rgba(196, 181, 253, 1);
  margin-bottom: 8px;
  font-size: 1.1rem;
  font-weight: 600;
}

.domain-card p {
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.4;
}

.values-bullseye h3 {
  color: rgba(196, 181, 253, 1);
  margin-bottom: 24px;
  font-size: 1.5rem;
  font-weight: 600;
  text-align: center;
}

.bullseye-exercise {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
}

.bullseye-questions h4,
.bullseye-action h4 {
  color: rgba(196, 181, 253, 1);
  margin-bottom: 16px;
  font-size: 1.2rem;
  font-weight: 600;
}

.bullseye-questions ul {
  color: rgba(255, 255, 255, 0.8);
  padding-left: 20px;
}

.bullseye-questions li {
  margin-bottom: 12px;
  line-height: 1.5;
  font-size: 0.95rem;
}

.values-textarea {
  width: 100%;
  min-height: 120px;
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 12px;
  font-size: 0.95rem;
  line-height: 1.5;
  resize: vertical;
  margin-bottom: 20px;
}

.save-values-button {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.8) 0%, rgba(129, 140, 248, 0.8) 100%);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;
  margin-top: 8px;
}

.save-values-button:hover {
  background: linear-gradient(135deg, rgba(139, 92, 246, 1) 0%, rgba(129, 140, 248, 1) 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.save-values-button {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.8) 0%, rgba(129, 140, 248, 0.8) 100%);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;
  margin-top: 16px;
}

.save-values-button:hover {
  background: linear-gradient(135deg, rgba(139, 92, 246, 1) 0%, rgba(129, 140, 248, 1) 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.action-intro {
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 20px;
  font-size: 1rem;
  line-height: 1.5;
  text-align: center;
  font-style: italic;
}

.field-note {
  color: rgba(196, 181, 253, 0.8);
  font-size: 0.9rem;
  margin: 4px 0 8px 0;
  line-height: 1.4;
  font-style: italic;
}

.consistency-rating label {
  display: block;
  color: rgba(196, 181, 253, 1);
  margin-bottom: 12px;
  font-weight: 500;
}

.rating-slider {
  display: flex;
  align-items: center;
  gap: 16px;
}

.slider {
  flex: 1;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  outline: none;
  appearance: none;
  -webkit-appearance: none;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(139, 92, 246, 1) 0%, rgba(129, 140, 248, 1) 100%);
  cursor: pointer;
  border: 2px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3);
}

.rating-value {
  color: rgba(139, 92, 246, 1);
  font-weight: 600;
  font-size: 1.1rem;
  text-align: center;
  padding: 8px 12px;
  background: rgba(139, 92, 246, 0.1);
  border-radius: 8px;
  border: 1px solid rgba(139, 92, 246, 0.3);
  min-width: 60px;
}

.action-section {
  margin-bottom: 60px;
}

.action-process h3 {
  color: rgba(196, 181, 253, 1);
  margin-bottom: 24px;
  font-size: 1.5rem;
  font-weight: 600;
  text-align: center;
}

.action-steps {
  display: grid;
  gap: 16px;
}

.action-step {
  display: flex;
  align-items: center;
  padding: 20px;
  border-radius: 12px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.action-step.active {
  border-color: rgba(139, 92, 246, 0.6);
  background: rgba(139, 92, 246, 0.1);
}

.action-step .step-number {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.8) 0%, rgba(129, 140, 248, 0.8) 100%);
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  margin-right: 20px;
  flex-shrink: 0;
}

.step-content h4 {
  color: rgba(196, 181, 253, 1);
  margin-bottom: 4px;
  font-size: 1.1rem;
  font-weight: 600;
}

.step-content p {
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
  line-height: 1.4;
  font-size: 0.95rem;
}

.action-planning h3 {
  color: rgba(196, 181, 253, 1);
  margin-bottom: 24px;
  font-size: 1.5rem;
  font-weight: 600;
  text-align: center;
}

.planning-form {
  display: grid;
  gap: 24px;
}

.form-group label {
  display: block;
  color: rgba(196, 181, 253, 1);
  margin-bottom: 8px;
  font-weight: 600;
  font-size: 1rem;
}

.form-input,
.form-textarea {
  width: 100%;
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 12px;
  font-size: 0.95rem;
  line-height: 1.5;
  transition: all 0.3s ease;
}

.form-textarea {
  min-height: 80px;
  resize: vertical;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: rgba(139, 92, 246, 0.6);
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}

.willingness-template {
  background: rgba(139, 92, 246, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 8px;
  padding: 16px;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.6;
}

.inline-input {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(196, 181, 253, 1);
  border: 1px solid rgba(139, 92, 246, 0.4);
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 0.9rem;
  margin: 0 4px;
  min-width: 120px;
}

.form-actions {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}

.save-action-button {
  background: linear-gradient(135deg, rgba(139, 92, 246, 1) 0%, rgba(129, 140, 248, 1) 100%);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 16px 32px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 6px 24px rgba(139, 92, 246, 0.4);
  transition: all 0.3s ease;
}

.save-action-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(139, 92, 246, 0.5);
}

.saved-actions h3 {
  color: rgba(196, 181, 253, 1);
  margin-bottom: 24px;
  font-size: 1.5rem;
  font-weight: 600;
  text-align: center;
}

.actions-list {
  display: grid;
  gap: 20px;
}

.action-item {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 24px;
  transition: all 0.3s ease;
}

.action-item:hover {
  border-color: rgba(139, 92, 246, 0.4);
  background: rgba(139, 92, 246, 0.05);
}

.action-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.action-header h4 {
  color: rgba(196, 181, 253, 1);
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
}

.action-date {
  color: rgba(139, 92, 246, 1);
  font-size: 0.9rem;
  font-weight: 500;
}

.action-goal {
  color: rgba(255, 255, 255, 0.85);
  margin-bottom: 12px;
  line-height: 1.5;
  font-size: 0.95rem;
}

.action-status {
  margin-bottom: 12px;
}

.action-status strong {
  color: rgba(196, 181, 253, 1);
  font-size: 0.9rem;
}

.willingness-display {
  background: rgba(139, 92, 246, 0.05);
  border-left: 3px solid rgba(139, 92, 246, 0.5);
  padding: 12px 16px;
  border-radius: 8px;
  color: rgba(196, 181, 253, 0.9);
  font-style: italic;
  line-height: 1.5;
}

/* Cognitive Defusion Styles */
.defusion-section {
  margin-bottom: 60px;
}

.defusion-problem h3 {
  color: rgba(196, 181, 253, 1);
  margin-bottom: 16px;
  font-size: 1.5rem;
  font-weight: 600;
  text-align: center;
}

.fusion-explanation {
  color: rgba(255, 255, 255, 0.85);
  text-align: center;
  margin-bottom: 24px;
  font-size: 1.05rem;
  line-height: 1.6;
}

.fusion-examples {
  display: flex;
  gap: 24px;
  justify-content: center;
  flex-wrap: wrap;
}

.fusion-example {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px 20px;
  flex: 1;
  min-width: 250px;
  max-width: 400px;
}

.fusion-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.fusion-text {
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.5;
}

.fusion-text strong {
  color: rgba(196, 181, 253, 1);
  display: block;
  margin-bottom: 4px;
}

.defusion-techniques h3 {
  color: rgba(196, 181, 253, 1);
  margin-bottom: 16px;
  font-size: 1.5rem;
  font-weight: 600;
  text-align: center;
}

.techniques-intro {
  color: rgba(255, 255, 255, 0.8);
  text-align: center;
  margin-bottom: 32px;
  font-size: 1.05rem;
}

.techniques-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.technique-card {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s ease;
}

.technique-card:hover {
  border-color: rgba(139, 92, 246, 0.4);
  background: rgba(139, 92, 246, 0.05);
  transform: translateY(-2px);
}

.technique-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.technique-icon {
  font-size: 1.8rem;
  flex-shrink: 0;
}

.technique-header h4 {
  color: rgba(196, 181, 253, 1);
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
}

.technique-description {
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 12px;
  line-height: 1.5;
  font-size: 0.95rem;
}

.technique-example {
  background: rgba(139, 92, 246, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 8px;
  padding: 12px;
  font-size: 0.9rem;
  line-height: 1.4;
}

.technique-example strong {
  color: rgba(196, 181, 253, 1);
}

.defusion-exercise {
  background: rgba(139, 92, 246, 0.05);
  border: 2px solid rgba(139, 92, 246, 0.3);
  border-radius: 12px;
  padding: 24px;
  margin-top: 32px;
}

.defusion-exercise h4 {
  color: rgba(196, 181, 253, 1);
  margin: 0 0 12px 0;
  font-size: 1.3rem;
  font-weight: 600;
}

.defusion-exercise > p {
  color: rgba(255, 255, 255, 0.85);
  margin-bottom: 16px;
}

.defusion-input {
  width: 100%;
  min-height: 80px;
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 12px;
  font-size: 1rem;
  line-height: 1.5;
  resize: vertical;
  margin-bottom: 20px;
}

.defusion-input:focus {
  outline: none;
  border-color: rgba(139, 92, 246, 0.6);
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}

.defusion-result {
  background: rgba(34, 197, 94, 0.05);
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: 8px;
  padding: 16px;
}

.defusion-result p {
  color: rgba(255, 255, 255, 0.9);
  margin: 0 0 12px 0;
  line-height: 1.6;
}

.defusion-result p:last-child {
  margin-bottom: 0;
}

.defusion-result strong {
  color: rgba(34, 197, 94, 1);
}

.save-defusion-button {
  background: linear-gradient(135deg, rgba(139, 92, 246, 1) 0%, rgba(129, 140, 248, 1) 100%);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.3);
  transition: all 0.3s ease;
  margin-top: 16px;
  width: 100%;
}

.save-defusion-button:hover {
  background: linear-gradient(135deg, rgba(139, 92, 246, 1.2) 0%, rgba(129, 140, 248, 1.2) 100%);
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4);
}

.saved-defusions h3 {
  color: rgba(196, 181, 253, 1);
  margin-bottom: 24px;
  font-size: 1.5rem;
  font-weight: 600;
  text-align: center;
}

.defusions-list {
  display: grid;
  gap: 20px;
}

.defusion-item {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s ease;
}

.defusion-item:hover {
  border-color: rgba(139, 92, 246, 0.4);
  background: rgba(139, 92, 246, 0.05);
}

.defusion-item-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.defusion-item-date {
  color: rgba(139, 92, 246, 1);
  font-size: 0.9rem;
  font-weight: 500;
}

.defusion-original-thought {
  color: rgba(255, 255, 255, 0.9);
  font-size: 1.05rem;
  margin-bottom: 12px;
  font-style: italic;
}

.defusion-reframes {
  margin-top: 12px;
}

.reframe {
  background: rgba(34, 197, 94, 0.05);
  border-left: 3px solid rgba(34, 197, 94, 0.5);
  padding: 10px 12px;
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.5;
  font-size: 0.95rem;
}

.reframe strong {
  color: rgba(34, 197, 94, 1);
}

@media (max-width: 768px) {
  .back-button {
    top: 20px;
    left: 20px;
    padding: 10px 16px;
    font-size: 0.9rem;
  }

  .container {
    padding: 20px 16px 100px 16px;
  }
  
  .header-content {
    padding: 16px;
  }
  
  .page-title {
    font-size: 2.2rem;
  }
  
  .section-title {
    font-size: 1.8rem;
  }
  
  .glass-card {
    padding: 24px;
  }
  
  .problem-solution {
    grid-template-columns: 1fr;
    gap: 24px;
  }
  
  .exercises-grid {
    grid-template-columns: 1fr;
  }
  
  .values-vs-goals {
    flex-direction: column;
    gap: 20px;
  }
  
  .domains-grid {
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 16px;
  }
  
  .bullseye-exercise {
    grid-template-columns: 1fr;
    gap: 24px;
  }

  .techniques-grid {
    grid-template-columns: 1fr;
  }

  .fusion-examples {
    flex-direction: column;
  }
}

@media (max-width: 480px) {
  .container {
    padding: 16px 12px 80px 12px;
  }
  
  .page-title {
    font-size: 2rem;
  }
  
  .glass-card {
    padding: 20px;
  }
  
  .sky-background {
    height: 300px;
  }
  
  .cloud-element,
  .sun-element {
    font-size: 0.8rem;
    padding: 8px 12px;
  }
  
  .domains-grid {
    grid-template-columns: 1fr;
  }
}
</style>