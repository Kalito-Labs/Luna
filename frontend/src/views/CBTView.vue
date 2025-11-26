<template>
  <div class="cbt-page">

    <main class="main-content">
    <div class="header-content">
        <HamburgerMenu />
      </div>
      <div class="container">
        <!-- CBT Core Theory Section -->
        <section class="cbt-section">
          <div class="section-header">
            <h2 class="section-title">🧠 Understanding CBT</h2>
            <p class="section-subtitle">
              Your thoughts, feelings, and behaviors are connected.
            </p>
          </div>

          <div class="theory-card glass-card">
            <h3>The CBT Triangle</h3>
            <div class="cbt-triangle">
              <div class="triangle-container">
                <div class="triangle-point thoughts">
                  <div class="point-circle">Thoughts</div>
                </div>
                <div class="triangle-point feelings">
                  <div class="point-circle">Feelings</div>
                </div>
                <div class="triangle-point behaviors">
                  <div class="point-circle">Behaviors</div>
                </div>
                <svg class="triangle-lines" viewBox="0 0 200 173">
                  <path d="M 100 20 L 50 140 L 150 140 Z" stroke="rgba(139, 92, 246, 0.4)" stroke-width="2" fill="transparent"/>
                </svg>
              </div>
            </div>
            <p class="theory-explanation">
              CBT is based on the idea that our thoughts, feelings, and behaviors are interconnected. 
              Negative thought patterns lead to negative emotions and unhelpful behaviors. By identifying 
              and challenging these patterns, we can change how we feel and act.
            </p>
          </div>
        </section>

        <!-- Automatic Thoughts Section -->
        <section class="cbt-section">
          <div class="section-header">
            <h2 class="section-title">⚡ Automatic Thoughts</h2>
            <p class="section-subtitle">
              Those immediate, reflexive thoughts that pop up without you even noticing.
            </p>
          </div>

          <div class="automatic-thoughts-card glass-card">
            <div class="definition">
              <h4>What are Automatic Thoughts?</h4>
              <ul>
                <li>Immediate, reflexive thoughts in response to situations</li>
                <li>Often negative, distorted, or unhelpful</li>
                <li>Usually happen so fast we don't notice them</li>
              </ul>
            </div>
            
            <div class="example-box">
              <strong>Example:</strong>
              <div class="example-scenario">
                <span class="scenario">Someone doesn't text back</span>
                <span class="arrow">→</span>
                <span class="thought">"They hate me"</span>
              </div>
              <small>This is an automatic thought - immediate but often inaccurate</small>
            </div>
          </div>
        </section>

        <!-- Cognitive Distortions Section -->
        <section class="cbt-section">
          <div class="section-header">
            <h2 class="section-title">🔍 Cognitive Distortions</h2>
            <p class="section-subtitle">
              Common thinking errors that keep us stuck in negative patterns.
            </p>
          </div>

          <div class="distortions-grid">
            <div 
              v-for="distortion in cognitiveDistortions" 
              :key="distortion.id"
              class="distortion-card glass-card"
              @click="selectDistortion(distortion)"
              :class="{ 'selected': selectedDistortion?.id === distortion.id }"
            >
              <h4>{{ distortion.name }}</h4>
              <p class="distortion-description">{{ distortion.description }}</p>
              <div class="distortion-example">
                <strong>Example:</strong>
                <em>"{{ distortion.example }}"</em>
              </div>
            </div>
          </div>

          <!-- Selected Distortion Detail -->
          <div v-if="selectedDistortion" class="distortion-detail glass-card">
            <h3>{{ selectedDistortion.name }}</h3>
            <p>{{ selectedDistortion.description }}</p>
            <div class="challenge-section">
              <h4>How to Challenge This Distortion:</h4>
              <ul>
                <li v-for="challenge in selectedDistortion.challenges" :key="challenge">
                  {{ challenge }}
                </li>
              </ul>
            </div>
          </div>
        </section>

        <!-- Thought Records Section -->
        <section class="cbt-section">
          <div class="section-header">
            <h2 class="section-title">📝 Thought Records</h2>
            <p class="section-subtitle">
              A structured way to examine and challenge your thoughts.
            </p>
          </div>

          <div class="thought-record-card glass-card">
            <div class="card-content">
              <div class="card-icon">📝</div>
              <h3>Create a New Thought Record</h3>
              <p>
                Use the powerful 7-step thought record process to identify, examine, and 
                challenge negative thoughts. This structured approach helps you develop 
                more balanced thinking patterns.
              </p>
              <div class="benefits-list">
                <span class="benefit">✓ Identify triggers</span>
                <span class="benefit">✓ Challenge thoughts</span>
                <span class="benefit">✓ Track emotions</span>
                <span class="benefit">✓ Build balance</span>
              </div>
              <button @click="openThoughtRecordModal" class="start-record-button">
                Start Thought Record
              </button>
            </div>
          </div>
        </section>

        <!-- Saved Thought Records Section -->
        <section v-if="savedThoughtRecords.length > 0" class="cbt-section">
          <div class="section-header">
            <h2 class="section-title">📚 Your Thought Records</h2>
            <p class="section-subtitle">
              Review your progress and insights from previous thought records.
            </p>
          </div>

          <div class="saved-records-grid">
            <div 
              v-for="record in savedThoughtRecords" 
              :key="record.id"
              class="saved-record-card glass-card"
            >
              <div class="record-header">
                <div class="record-date">
                  {{ formatDate(record.createdAt) }}
                </div>
                <button @click="deleteRecord(record.id)" class="delete-record">
                  🗑️
                </button>
              </div>
              <div class="record-content">
                <div class="record-field">
                  <strong>Situation:</strong>
                  <p>{{ record.situation }}</p>
                </div>
                <div class="record-field">
                  <strong>Automatic Thought:</strong>
                  <p>{{ record.automaticThought }}</p>
                </div>
                <div class="emotions-comparison">
                  <div class="emotion-before">
                    <span class="emotion-label">Before:</span>
                    <span class="emotion-text">{{ record.emotion }} ({{ record.emotionIntensity }}/100)</span>
                  </div>
                  <div class="emotion-after">
                    <span class="emotion-label">After:</span>
                    <span class="emotion-text">{{ record.newEmotion }} ({{ record.newEmotionIntensity }}/100)</span>
                  </div>
                </div>
                <div class="record-field">
                  <strong>Balanced Thought:</strong>
                  <p>{{ record.alternativeThought }}</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>

    <!-- Thought Record Modal -->
    <ThoughtRecordModal 
      :is-open="showThoughtRecordModal"
      @close="closeThoughtRecordModal"
      @save="saveThoughtRecord"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import HamburgerMenu from '@/components/HamburgerMenu.vue'
import ThoughtRecordModal from '@/components/ThoughtRecordModal.vue'

interface CognitiveDistortion {
  id: string
  name: string
  description: string
  example: string
  challenges: string[]
}

interface SavedThoughtRecord {
  id: string
  situation: string
  automaticThought: string
  emotion: string
  emotionIntensity: number
  evidenceFor: string
  evidenceAgainst: string
  alternativeThought: string
  newEmotion: string
  newEmotionIntensity: number
  createdAt: string
}

export default defineComponent({
  name: 'CBTView',
  components: {
    HamburgerMenu,
    ThoughtRecordModal
  },
  setup() {
    const selectedDistortion = ref<CognitiveDistortion | null>(null)
    const showThoughtRecordModal = ref(false)
    const savedThoughtRecords = ref<SavedThoughtRecord[]>([])

    const cognitiveDistortions: CognitiveDistortion[] = [
      {
        id: '1',
        name: 'All-or-Nothing Thinking',
        description: 'Seeing things in black and white categories',
        example: 'If I\'m not perfect, I\'m a failure',
        challenges: [
          'Look for shades of gray - what\'s between perfect and failure?',
          'Consider partial successes and progress made',
          'Ask yourself: "Would I judge a friend this harshly?"'
        ]
      },
      {
        id: '2',
        name: 'Catastrophizing',
        description: 'Expecting the worst possible outcome',
        example: 'If I mess up this presentation, I\'ll lose my job and become homeless',
        challenges: [
          'What\'s the most likely outcome, not the worst?',
          'How would you cope if the bad thing did happen?',
          'What evidence do you have that disaster will strike?'
        ]
      },
      {
        id: '3',
        name: 'Overgeneralization',
        description: 'One event means everything is always that way',
        example: 'I failed once, so I always fail',
        challenges: [
          'Look for counter-examples from your past',
          'Consider this as one data point, not a pattern',
          'Replace "always" and "never" with more accurate words'
        ]
      },
      {
        id: '4',
        name: 'Mental Filter',
        description: 'Focusing only on negatives, ignoring positives',
        example: 'Getting 9/10 positive reviews but only thinking about the 1 negative',
        challenges: [
          'Actively look for the positives in the situation',
          'Consider the whole picture, not just the negative parts',
          'Ask yourself what you\'re filtering out'
        ]
      },
      {
        id: '5',
        name: 'Mind Reading',
        description: 'Assuming you know what others think',
        example: 'They think I\'m stupid',
        challenges: [
          'What actual evidence do you have for this belief?',
          'Could there be other explanations for their behavior?',
          'Have you asked them directly what they think?'
        ]
      },
      {
        id: '6',
        name: 'Fortune Telling',
        description: 'Predicting negative outcomes',
        example: 'I know this won\'t work out',
        challenges: [
          'What evidence supports this prediction?',
          'What other outcomes are possible?',
          'How accurate have your past predictions been?'
        ]
      },
      {
        id: '7',
        name: 'Emotional Reasoning',
        description: '"I feel it, so it must be true"',
        example: 'I feel worthless, therefore I am worthless',
        challenges: [
          'Feelings are valid but not always factual',
          'What would you think if you felt differently?',
          'What evidence exists beyond your feelings?'
        ]
      },
      {
        id: '8',
        name: 'Should Statements',
        description: 'Rigid rules about how things "should" be',
        example: 'I should be better at this by now',
        challenges: [
          'Replace "should" with "could" or "would like to"',
          'According to whose standards should this be true?',
          'What\'s a more realistic expectation?'
        ]
      },
      {
        id: '9',
        name: 'Labeling',
        description: 'Defining yourself by one trait or mistake',
        example: 'I\'m a loser',
        challenges: [
          'Separate your actions from your identity',
          'Would you call a friend this label for the same mistake?',
          'What are some of your positive qualities?'
        ]
      },
      {
        id: '10',
        name: 'Personalization',
        description: 'Blaming yourself for things outside your control',
        example: 'It\'s my fault they\'re upset',
        challenges: [
          'What factors are outside your control?',
          'How much responsibility do you actually have?',
          'What would you tell a friend who blamed themselves?'
        ]
      }
    ]

    // Simple toast function replacement
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

    const selectDistortion = (distortion: CognitiveDistortion) => {
      selectedDistortion.value = selectedDistortion.value?.id === distortion.id ? null : distortion
    }

    const openThoughtRecordModal = () => {
      showThoughtRecordModal.value = true
    }

    const closeThoughtRecordModal = () => {
      showThoughtRecordModal.value = false
    }

    const saveThoughtRecord = (record: SavedThoughtRecord) => {
      savedThoughtRecords.value.unshift(record)
      // Here you could also save to localStorage or database
      localStorage.setItem('cbt-thought-records', JSON.stringify(savedThoughtRecords.value))
    }

    const deleteRecord = (recordId: string) => {
      const index = savedThoughtRecords.value.findIndex(r => r.id === recordId)
      if (index > -1) {
        savedThoughtRecords.value.splice(index, 1)
        localStorage.setItem('cbt-thought-records', JSON.stringify(savedThoughtRecords.value))
        showToast('Thought record deleted', false)
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

    // Load saved records from localStorage on component mount
    const loadSavedRecords = () => {
      try {
        const saved = localStorage.getItem('cbt-thought-records')
        if (saved) {
          savedThoughtRecords.value = JSON.parse(saved)
        }
      } catch (error) {
        console.error('Error loading saved records:', error)
      }
    }
    
    // Load records on component mount
    loadSavedRecords()

    return {
      selectedDistortion,
      cognitiveDistortions,
      showThoughtRecordModal,
      savedThoughtRecords,
      selectDistortion,
      openThoughtRecordModal,
      closeThoughtRecordModal,
      saveThoughtRecord,
      deleteRecord,
      formatDate
    }
  }
})
</script>

<style scoped>
.cbt-page {
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
  
  /* Custom scrollbar styling */
  scrollbar-width: thin;
  scrollbar-color: rgba(139, 92, 246, 0.6) rgba(255, 255, 255, 0.1);
}

/* WebKit scrollbar styling */
.main-content::-webkit-scrollbar {
  width: 8px;
}

.main-content::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  margin: 8px 0;
}

.main-content::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, 
    rgba(139, 92, 246, 0.6) 0%, 
    rgba(129, 140, 248, 0.6) 100%);
  border-radius: 4px;
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.main-content::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, 
    rgba(139, 92, 246, 0.8) 0%, 
    rgba(129, 140, 248, 0.8) 100%);
  border-color: rgba(255, 255, 255, 0.2);
}

.main-content::-webkit-scrollbar-thumb:active {
  background: linear-gradient(135deg, 
    rgba(139, 92, 246, 1) 0%, 
    rgba(129, 140, 248, 1) 100%);
}

.main-content::-webkit-scrollbar-corner {
  background: transparent;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px 20px 80px 20px; /* Added top and bottom padding for scroll space */
}

.cbt-section {
  margin-bottom: 60px;
}

.section-header {
  text-align: center;
  margin-bottom: 40px;
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

.theory-card h3 {
  color: rgba(196, 181, 253, 1);
  font-size: 1.6rem;
  margin-bottom: 30px;
  text-align: center;
  font-weight: 600;
}

.cbt-triangle {
  display: flex;
  justify-content: center;
  margin: 40px 0;
}

.triangle-container {
  position: relative;
  width: 240px;
  height: 208px;
}

.triangle-lines {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.triangle-point {
  position: absolute;
}

.triangle-point.thoughts {
  top: 0;
  left: 50%;
  transform: translateX(-50%);
}

.triangle-point.feelings {
  bottom: 0;
  left: 0;
}

.triangle-point.behaviors {
  bottom: 0;
  right: 0;
}

.point-circle {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.8) 0%, rgba(129, 140, 248, 0.8) 100%);
  color: white;
  padding: 14px 20px;
  border-radius: 50px;
  font-weight: 600;
  font-size: 1rem;
  text-align: center;
  box-shadow: 0 4px 20px rgba(139, 92, 246, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
  min-width: 80px;
}

.theory-explanation {
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.7;
  text-align: center;
  font-size: 1.1rem;
}

.automatic-thoughts-card {
  display: grid;
  gap: 30px;
}

.definition h4 {
  color: rgba(196, 181, 253, 1);
  margin-bottom: 20px;
  font-size: 1.3rem;
  font-weight: 600;
}

.definition ul {
  color: rgba(255, 255, 255, 0.85);
  padding-left: 24px;
}

.definition li {
  margin-bottom: 12px;
  line-height: 1.6;
  font-size: 1.05rem;
}

.example-box {
  background: rgba(139, 92, 246, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 12px;
  padding: 24px;
  text-align: center;
}

.example-scenario {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin: 15px 0;
  flex-wrap: wrap;
}

.scenario {
  background: rgba(129, 140, 248, 0.2);
  padding: 10px 18px;
  border-radius: 8px;
  color: rgba(196, 181, 253, 1);
  font-weight: 500;
}

.arrow {
  color: rgba(139, 92, 246, 1);
  font-size: 1.4rem;
  font-weight: bold;
}

.thought {
  background: rgba(220, 38, 38, 0.2);
  padding: 10px 18px;
  border-radius: 8px;
  color: rgba(248, 113, 113, 1);
  font-style: italic;
  font-weight: 500;
}

.distortions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
}

.distortion-card {
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.distortion-card:hover {
  transform: translateY(-4px);
  box-shadow: 
    0 16px 48px rgba(0, 0, 0, 0.4),
    0 8px 24px rgba(139, 92, 246, 0.2);
  border-color: rgba(139, 92, 246, 0.4);
}

.distortion-card.selected {
  border-color: rgba(139, 92, 246, 0.6);
  box-shadow: 
    0 0 0 2px rgba(139, 92, 246, 0.3),
    0 12px 36px rgba(0, 0, 0, 0.3);
  transform: translateY(-2px);
}

.distortion-card h4 {
  color: rgba(196, 181, 253, 1);
  font-size: 1.2rem;
  margin-bottom: 16px;
  font-weight: 600;
}

.distortion-description {
  color: rgba(255, 255, 255, 0.85);
  margin-bottom: 18px;
  line-height: 1.6;
  font-size: 1.05rem;
}

.distortion-example {
  background: rgba(139, 92, 246, 0.1);
  border-left: 3px solid rgba(139, 92, 246, 0.5);
  padding: 16px;
  border-radius: 8px;
}

.distortion-example strong {
  color: rgba(196, 181, 253, 1);
  font-weight: 600;
}

.distortion-example em {
  color: rgba(248, 113, 113, 0.9);
  font-style: italic;
  margin-left: 8px;
}

.distortion-detail {
  margin-top: 40px;
}

.distortion-detail h3 {
  color: rgba(196, 181, 253, 1);
  margin-bottom: 20px;
  font-size: 1.4rem;
  font-weight: 600;
}

.challenge-section h4 {
  color: rgba(196, 181, 253, 1);
  margin: 24px 0 16px 0;
  font-size: 1.2rem;
  font-weight: 600;
}

.challenge-section ul {
  color: rgba(255, 255, 255, 0.85);
  padding-left: 24px;
}

.challenge-section li {
  margin-bottom: 12px;
  line-height: 1.6;
  font-size: 1.05rem;
}

.thought-record-form {
  max-width: 900px;
  margin: 0 auto;
}

.form-group {
  margin-bottom: 32px;
}

.form-group label {
  display: block;
  color: rgba(196, 181, 253, 1);
  font-weight: 600;
  margin-bottom: 12px;
  font-size: 1.1rem;
}

.custom-textarea,
.custom-input {
  width: 100%;
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px 20px;
  font-size: 1rem;
  line-height: 1.5;
  resize: vertical;
  transition: all 0.3s ease;
}

.custom-textarea:focus,
.custom-input:focus {
  outline: none;
  border-color: rgba(139, 92, 246, 0.6);
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}

.custom-textarea::placeholder,
.custom-input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.emotion-input {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.slider-container {
  display: flex;
  align-items: center;
  gap: 16px;
}

.slider-label {
  color: rgba(196, 181, 253, 0.8);
  font-weight: 500;
  min-width: 24px;
  text-align: center;
}

.emotion-slider {
  flex: 1;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  outline: none;
  appearance: none;
  -webkit-appearance: none;
}

.emotion-slider::-webkit-slider-thumb {
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

.emotion-slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(139, 92, 246, 1) 0%, rgba(129, 140, 248, 1) 100%);
  cursor: pointer;
  border: 2px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3);
}

.slider-value {
  color: rgba(139, 92, 246, 1);
  font-weight: 600;
  font-size: 1.1rem;
  text-align: center;
  padding: 8px 12px;
  background: rgba(139, 92, 246, 0.1);
  border-radius: 8px;
  border: 1px solid rgba(139, 92, 246, 0.3);
}

.form-actions {
  display: flex;
  gap: 20px;
  justify-content: flex-end;
  margin-top: 40px;
}

.clear-button {
  background: transparent;
  color: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  padding: 12px 24px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.clear-button:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.5);
}

.save-button {
  background: linear-gradient(135deg, rgba(139, 92, 246, 1) 0%, rgba(129, 140, 248, 1) 100%);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 12px 32px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(139, 92, 246, 0.3);
  transition: all 0.3s ease;
}

.save-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(139, 92, 246, 0.4);
}

/* Thought Record Card Styles */
.thought-record-card {
  text-align: center;
  position: relative;
  overflow: hidden;
}

.card-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

.card-icon {
  font-size: 3rem;
  margin-bottom: 8px;
  opacity: 0.8;
}

.thought-record-card h3 {
  color: rgba(196, 181, 253, 1);
  font-size: 1.8rem;
  font-weight: 700;
  margin: 0;
}

.thought-record-card p {
  color: rgba(255, 255, 255, 0.85);
  font-size: 1.1rem;
  line-height: 1.6;
  max-width: 500px;
  margin: 0;
}

.benefits-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  justify-content: center;
}

.benefit {
  background: rgba(139, 92, 246, 0.2);
  color: rgba(196, 181, 253, 1);
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
  border: 1px solid rgba(139, 92, 246, 0.3);
}

.start-record-button {
  background: linear-gradient(135deg, rgba(139, 92, 246, 1) 0%, rgba(129, 140, 248, 1) 100%);
  color: white;
  border: none;
  border-radius: 16px;
  padding: 16px 32px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 6px 24px rgba(139, 92, 246, 0.4);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.start-record-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 32px rgba(139, 92, 246, 0.5);
}

.start-record-button:active {
  transform: translateY(-1px);
}

/* Saved Records Styles */
.saved-records-grid {
  display: grid;
  gap: 24px;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
}

.saved-record-card {
  position: relative;
  transition: all 0.3s ease;
}

.saved-record-card:hover {
  transform: translateY(-4px);
  box-shadow: 
    0 12px 40px rgba(0, 0, 0, 0.4),
    0 6px 20px rgba(139, 92, 246, 0.2);
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.record-date {
  color: rgba(139, 92, 246, 1);
  font-weight: 600;
  font-size: 0.9rem;
}

.delete-record {
  background: rgba(239, 68, 68, 0.1);
  color: rgba(248, 113, 113, 0.8);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 8px;
  padding: 6px 8px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.delete-record:hover {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.4);
  color: rgba(248, 113, 113, 1);
}

.record-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.record-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.record-field strong {
  color: rgba(196, 181, 253, 1);
  font-size: 0.9rem;
  font-weight: 600;
}

.record-field p {
  color: rgba(255, 255, 255, 0.85);
  margin: 0;
  line-height: 1.5;
  font-size: 0.95rem;
}

.emotions-comparison {
  background: rgba(139, 92, 246, 0.05);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 12px;
  padding: 16px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.emotion-before,
.emotion-after {
  display: flex;
  flex-direction: column;
  gap: 6px;
  text-align: center;
}

.emotion-label {
  color: rgba(196, 181, 253, 0.8);
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.emotion-text {
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .cbt-page {
    height: 100vh; /* Ensure full height on mobile */
  }
  
  .container {
    padding: 20px 16px 100px 16px; /* Mobile container padding */
  }
  
  .header-content {
    padding: 16px;
  }
  
  .page-title {
    font-size: 1.6rem;
  }
  
  .page-subtitle {
    font-size: 1rem;
  }
  
  .section-title {
    font-size: 1.8rem;
  }
  
  .glass-card {
    padding: 24px;
  }
  
  .distortions-grid {
    grid-template-columns: 1fr;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .example-scenario {
    flex-direction: column;
    gap: 12px;
  }
  
  .challenge-actions {
    flex-direction: column;
  }
  
  .triangle-container {
    width: 200px;
    height: 173px;
  }
  
  .point-circle {
    padding: 12px 16px;
    font-size: 0.9rem;
    min-width: 70px;
  }
  
  .header-content {
    padding: 16px;
  }
  
  /* Mobile scrollbar adjustments */
  .main-content::-webkit-scrollbar {
    width: 6px; /* Thinner on mobile */
  }
  
  /* Mobile thought record card */
  .thought-record-card h3 {
    font-size: 1.5rem;
  }
  
  .benefits-list {
    flex-direction: column;
    align-items: center;
  }
  
  .start-record-button {
    width: 100%;
    max-width: 280px;
  }
  
  /* Mobile saved records */
  .saved-records-grid {
    grid-template-columns: 1fr;
  }
  
  .emotions-comparison {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}

@media (max-width: 480px) {
  .cbt-section {
    margin-bottom: 40px;
  }
  
  .glass-card {
    padding: 20px;
  }
  
  .section-title {
    font-size: 1.6rem;
  }
  
  .container {
    padding: 16px 12px 80px 12px; /* Tighter padding on very small screens */
  }
  
  .header-content {
    padding: 12px;
  }
  
  /* Smaller screens adjustments */
  .thought-record-card p {
    font-size: 1rem;
  }
  
  .start-record-button {
    padding: 14px 24px;
    font-size: 1rem;
  }
  
  .saved-record-card {
    margin-bottom: 16px;
  }
  
  /* Even thinner scrollbar on very small screens */
  .main-content::-webkit-scrollbar {
    width: 4px;
  }
}
</style>