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
            <h1 class="page-title">🌌 ACT: Acceptance & Commitment Therapy</h1>
            <p class="page-subtitle">
You are not your thoughts, emotions, or experiences - you are the observer of them            </p>
          </div>
        </section>

        <!-- Self-as-Context Core Concept -->
        <section class="concept-section">

          <div class="concept-card glass-card">
            <div class="problem-solution">
              <div class="problem-box">
                <h4>⚠️ The Problem</h4>
                <p>Over-identification with thoughts, feelings, roles, and labels:</p>
                <ul>
                  <li>"I <em>AM</em> my anxiety"</li>
                  <li>"I <em>AM</em> a failure"</li>
                  <li>"I <em>AM</em> broken"</li>
                </ul>
              </div>
              <div class="solution-box">
                <h4>✨ The Solution</h4>
                <p>Recognize yourself as the observer - the sky that contains all weather:</p>
                <ul>
                  <li>"I am <em>experiencing</em> anxiety"</li>
                  <li>"I am <em>having</em> thoughts about failure"</li>
                  <li>"I am <em>noticing</em> difficult feelings"</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <!-- Sky Metaphor & Cognitive Defusion -->
        <section class="metaphor-section">
          <div class="section-header">
            <h2 class="section-title">☁️ The Sky Metaphor</h2>
            <p class="section-subtitle">
              Your consciousness is like the vast sky
            </p>
          </div>

          <div class="sky-visualization glass-card">
            <div class="sky-container">
              <div class="sky-background">
                <div class="cloud-element thought-cloud" style="top: 20%; left: 15%;">
                  <span>Anxious Thoughts</span>
                </div>
                <div class="cloud-element emotion-cloud" style="top: 40%; right: 20%;">
                  <span>Sadness</span>
                </div>
                <div class="cloud-element memory-cloud" style="bottom: 30%; left: 25%;">
                  <span>Painful Memory</span>
                </div>
                <div class="sun-element" style="top: 15%; right: 15%;">
                  <span>Joy</span>
                </div>
                <div class="observer-point">
                  <span>Observer Self</span>
                </div>
              </div>
            </div>
            
            <div class="metaphor-explanation">
              <h4>Key Insights:</h4>
              <ul>
                <li><strong>The sky</strong> contains all weather but isn't damaged by it</li>
                <li><strong>Storms pass</strong>, clouds move, but the sky remains constant</li>
                <li><strong>You can observe</strong> "I'm experiencing anxiety" from the still point of awareness</li>
                <li><strong>The observer self</strong> is the continuous awareness that has always been there</li>
              </ul>
            </div>

            <div class="section-divider"></div>

            <div class="defusion-header">
              <h3>🧘 Cognitive Defusion Exercise</h3>
              <p class="defusion-subtitle">
                Practice separating yourself from your thoughts and feelings
              </p>
            </div>

            <div class="exercise-content">
              <div class="exercise-icon">🔄</div>
              <h4>"I Am Not My..."</h4>
              <p class="exercise-description">
                Practice disidentifying from temporary experiences
              </p>
              
              <div class="disidentification-list">
                <div 
                  v-for="item in disidentificationItems" 
                  :key="item.id"
                  class="disidentification-item"
                >
                  <div class="item-content">
                    <strong>I am not my {{ item.category }}</strong>
                    <p>{{ item.explanation }}</p>
                  </div>
                </div>
              </div>
              
              <div class="disidentification-affirmation">
                <p class="affirmation-text">
                  "I am the observer, the continuous awareness that witnesses all experiences"
                </p>
              </div>
            </div>
          </div>
        </section>

        <!-- Values Section -->
        <section class="values-section">
          <div class="section-header">
            <h2 class="section-title">💎 Your Values</h2>
            <p class="section-subtitle">
              Discover what truly matters to you and let it guide your life
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

          <!-- Values Bullseye -->
          <div v-if="selectedDomain" class="values-bullseye glass-card">
            <h3>Values Bullseye: {{ lifeDomains.find(d => d.id === selectedDomain)?.name }}</h3>
            <div class="bullseye-exercise">
              <div class="bullseye-questions">
                <h4>Reflection Questions:</h4>
                <ul>
                  <li v-for="question in valuesQuestions" :key="question">{{ question }}</li>
                </ul>
              </div>
              <div class="bullseye-action">
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
            </div>
          </div>
        </section>

        <!-- Committed Action Section -->
        <section class="action-section">
          <div class="section-header">
            <h2 class="section-title">🎯 Committed Action</h2>
            <p class="section-subtitle">
              Transform your values into concrete action, even when it's uncomfortable
            </p>
          </div>

          <div class="action-process glass-card">
            <h3>From Values to Action</h3>
            <div class="action-steps">
              <div class="action-step" :class="{ 'active': currentActionStep === 1 }">
                <div class="step-number">1</div>
                <div class="step-content">
                  <h4>Choose a Value</h4>
                  <p>Select what matters most to you right now</p>
                </div>
              </div>
              <div class="action-step" :class="{ 'active': currentActionStep === 2 }">
                <div class="step-number">2</div>
                <div class="step-content">
                  <h4>Set a SMART Goal</h4>
                  <p>Make it Specific, Measurable, Achievable, Relevant, Time-bound</p>
                </div>
              </div>
              <div class="action-step" :class="{ 'active': currentActionStep === 3 }">
                <div class="step-number">3</div>
                <div class="step-content">
                  <h4>Break It Down</h4>
                  <p>What's the smallest first step you can take?</p>
                </div>
              </div>
              <div class="action-step" :class="{ 'active': currentActionStep === 4 }">
                <div class="step-number">4</div>
                <div class="step-content">
                  <h4>Notice Barriers</h4>
                  <p>What thoughts or feelings might get in the way?</p>
                </div>
              </div>
              <div class="action-step" :class="{ 'active': currentActionStep === 5 }">
                <div class="step-number">5</div>
                <div class="step-content">
                  <h4>Take Action</h4>
                  <p>Do it anyway, making room for discomfort</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Action Planning Form -->
          <div class="action-planning glass-card">
            <h3>Plan Your Committed Action</h3>
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
                <textarea 
                  v-model="actionPlan.barriers"
                  placeholder="What thoughts, feelings, or situations might stop you?"
                  class="form-textarea"
                ></textarea>
              </div>
              <div class="form-group">
                <label>5. Willingness Statement:</label>
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
        </section>

      </div>
    </main>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, reactive, computed } from 'vue'
import { useTherapyStorage } from '@/composables/useTherapyStorage'
import type { TherapyRecord } from '@/composables/useTherapyStorage'

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

interface ACTDisidentificationData {
  type: 'disidentification'
  items: DisidentificationItem[]
  completedCount: number
}

type ACTRecordData = ACTActionPlanData | ACTValuesReflectionData | ACTDisidentificationData

export default defineComponent({
  name: 'ACTView',
  components: {},
  emits: ['back'],
  setup() {
    // Initialize therapy storage for ACT exercises
    const {
      records: therapyRecords,
      isLoading,
      error: storageError,
      save: saveToTherapy,
      remove: removeFromTherapy
    } = useTherapyStorage<ACTRecordData>({
      therapyType: 'act',
      patientId: 'kaleb', // TODO: Get from auth/context
      useBackend: true
    })

    const selectedDomain = ref<string | null>(null)

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

    const valuesQuestions = [
      'What do you want your life to stand for?',
      'At your funeral, what would you want said about you?',
      'When you\'re 90, what will you be glad you did?',
      'What would you do if fear wasn\'t a factor?',
      'What makes you feel most alive?'
    ]

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
        .filter((record: TherapyRecord<ACTRecordData>) => record.record_data.type === 'action_plan')
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
      lifeDomains,
      disidentificationItems,
      valuesQuestions,
      domainValues,
      domainRatings,
      actionPlan,
      savedActionPlans,
      isLoading,
      selectDomain,
      saveDomainValues,
      saveActionPlan,
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