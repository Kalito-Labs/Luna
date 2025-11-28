<template>
  <div class="dbt-content">
    <!-- Back Button -->
    <button @click="$emit('back')" class="back-button">
      <span class="back-arrow">←</span>
      <span>Back to Therapy Resources</span>
    </button>

    <div class="container-dbt">
        
        <!-- DBT Core Theory -->
        <section class="intro-section">
          <div class="section-header">
            <h1 class="page-title">💫 DBT: Dialectical Behavior Therapy</h1>
            <p class="page-subtitle">
              Combining acceptance and change for emotional balance
            </p>
          </div>
          
          <div class="core-theory glass-card">
            <div class="dialectic-explanation">
              <h3>The Dialectic</h3>
              <p class="dialectic-text">
                DBT combines <strong>acceptance</strong> (you're doing your best) with <strong>change</strong> (you need to learn new skills).
              </p>
              <div class="dialectic-formula">
                <span class="formula-part acceptance">Accepting yourself as you are</span>
                <span class="formula-plus">+</span>
                <span class="formula-part change">Working to change</span>
                <span class="formula-equals">=</span>
                <span class="formula-result">Dialectical Balance</span>
              </div>
            </div>
          </div>
        </section>
        
        <!-- Four Modules Navigation -->
        <section class="modules-section">
          <div class="section-header">
            <h2 class="section-title">The Two Core DBT Modules</h2>
            <p class="section-subtitle">
              Master these foundational skills for emotional regulation and distress tolerance
            </p>
          </div>

          <div class="modules-grid">
            <div 
              v-for="module in dbtModules" 
              :key="module.id"
              class="module-card glass-card"
              @click="selectModule(module.id)"
              :class="{ 'selected': selectedModule === module.id }"
            >
              <div class="module-icon">{{ module.icon }}</div>
              <h3>{{ module.name }}</h3>
              <p class="module-description">{{ module.description }}</p>
              <div class="module-badge">{{ module.skillCount }} Skills</div>
            </div>
          </div>
        </section>

        <!-- Module 1: Mindfulness -->
        <section v-if="selectedModule === 'mindfulness'" class="module-content">
          <div class="section-header">
            <h2 class="section-title">🧘 Mindfulness: The Foundation</h2>
            <p class="section-subtitle">
              Being fully present in the current moment without judgment - the foundation for all other DBT skills
            </p>
          </div>

          <div class="module-intro glass-card">
            <p class="intro-text">
              Mindfulness is the core skill that supports everything else in DBT. By learning to observe and describe your experience without judgment, you create space to choose skillful responses rather than reacting automatically.
            </p>
          </div>

          <div class="skills-grid">
            <!-- Observe Skill -->
            <div class="skill-card glass-card">
              <div class="skill-header">
                <span class="skill-icon">👁️</span>
                <h3>Observe</h3>
              </div>
              <p class="skill-description">Notice without describing or labeling</p>
              <ul class="skill-points">
                <li>Watch thoughts/emotions/sensations come and go</li>
                <li>Like sitting by a river, watching leaves float by</li>
                <li>No need to judge or change what you notice</li>
              </ul>
            </div>

            <!-- Describe Skill -->
            <div class="skill-card glass-card">
              <div class="skill-header">
                <span class="skill-icon">💬</span>
                <h3>Describe</h3>
              </div>
              <p class="skill-description">Put words to what you observe</p>
              <ul class="skill-points">
                <li>"I'm having the thought that..."</li>
                <li>"I notice tightness in my chest"</li>
                <li>Facts only, no judgments</li>
              </ul>
            </div>

            <!-- Participate Skill -->
            <div class="skill-card glass-card">
              <div class="skill-header">
                <span class="skill-icon">🎯</span>
                <h3>Participate</h3>
              </div>
              <p class="skill-description">Fully engage in the current activity</p>
              <ul class="skill-points">
                <li>Lose self-consciousness</li>
                <li>Be one with the experience</li>
                <li>Throw yourself completely into what you're doing</li>
              </ul>
            </div>

            <!-- Non-Judgmental Stance -->
            <div class="skill-card glass-card">
              <div class="skill-header">
                <span class="skill-icon">🚫</span>
                <h3>Non-Judgmental Stance</h3>
              </div>
              <p class="skill-description">Stop labeling things as "good" or "bad"</p>
              <ul class="skill-points">
                <li>Replace judgments with descriptions</li>
                <li>Notice when you judge, then return to observing</li>
                <li>See things as they are, not as you wish them to be</li>
              </ul>
            </div>

            <!-- One-Mindfully -->
            <div class="skill-card glass-card">
              <div class="skill-header">
                <span class="skill-icon">1️⃣</span>
                <h3>One-Mindfully</h3>
              </div>
              <p class="skill-description">Do one thing at a time with full attention</p>
              <ul class="skill-points">
                <li>When your mind wanders, gently return</li>
                <li>No multitasking</li>
                <li>Be here, now, doing this one thing</li>
              </ul>
            </div>

            <!-- Effectively -->
            <div class="skill-card glass-card">
              <div class="skill-header">
                <span class="skill-icon">✅</span>
                <h3>Effectively</h3>
              </div>
              <p class="skill-description">Focus on what works, not what's "fair"</p>
              <ul class="skill-points">
                <li>Do what's needed in this situation</li>
                <li>Let go of "should" and "right/wrong"</li>
                <li>Play by the rules that exist, not the rules you wish existed</li>
              </ul>
            </div>
          </div>

          <!-- Mindfulness Exercises -->
          <div class="exercises-section">
            <h3>Mindfulness Exercises</h3>
            <div class="exercise-grid">
              <div 
                v-for="exercise in mindfulnessExercises" 
                :key="exercise.id"
                class="exercise-item glass-card"
                @click="startExercise(exercise)"
              >
                <span class="exercise-icon">{{ exercise.icon }}</span>
                <span class="exercise-name">{{ exercise.name }}</span>
              </div>
            </div>
          </div>
        </section>

        <!-- Module 2: Distress Tolerance -->
        <section v-if="selectedModule === 'distress'" class="module-content">
          <div class="section-header">
            <h2 class="section-title">🛟 Distress Tolerance</h2>
            <p class="section-subtitle">
              Skills to survive crises without making things worse
            </p>
          </div>

          <div class="when-to-use glass-card">
            <h4>⚠️ When to Use These Skills</h4>
            <p>When emotions are so intense that problem-solving isn't possible yet. These are survival skills for crisis moments.</p>
          </div>

          <!-- STOP Skill -->
          <div class="acronym-skill glass-card">
            <div class="skill-header-large">
              <span class="skill-icon-large">🛑</span>
              <div>
                <h3>STOP Skill</h3>
                <p class="skill-subtitle">Crisis Response</p>
              </div>
            </div>
            <div class="acronym-steps">
              <div class="acronym-step">
                <span class="letter">S</span>
                <div class="step-content">
                  <h4>Stop</h4>
                  <p>Freeze, don't react immediately</p>
                </div>
              </div>
              <div class="acronym-step">
                <span class="letter">T</span>
                <div class="step-content">
                  <h4>Take a step back</h4>
                  <p>Get space from the situation</p>
                </div>
              </div>
              <div class="acronym-step">
                <span class="letter">O</span>
                <div class="step-content">
                  <h4>Observe</h4>
                  <p>Notice what's happening inside and outside</p>
                </div>
              </div>
              <div class="acronym-step">
                <span class="letter">P</span>
                <div class="step-content">
                  <h4>Proceed mindfully</h4>
                  <p>Choose wise action</p>
                </div>
              </div>
            </div>
          </div>

          <!-- TIP Skill -->
          <div class="acronym-skill glass-card">
            <div class="skill-header-large">
              <span class="skill-icon-large">🚨</span>
              <div>
                <h3>TIP Skill</h3>
                <p class="skill-subtitle">Emergency Emotion Regulation</p>
              </div>
            </div>
            <div class="acronym-steps">
              <div class="acronym-step">
                <span class="letter">T</span>
                <div class="step-content">
                  <h4>Temperature</h4>
                  <p>Change your body temperature (ice on face, cold shower)</p>
                </div>
              </div>
              <div class="acronym-step">
                <span class="letter">I</span>
                <div class="step-content">
                  <h4>Intense exercise</h4>
                  <p>Burn off adrenaline (run, jump, push-ups)</p>
                </div>
              </div>
              <div class="acronym-step">
                <span class="letter">P</span>
                <div class="step-content">
                  <h4>Paced breathing</h4>
                  <p>Slow exhales longer than inhales</p>
                </div>
              </div>
            </div>
          </div>

          <!-- ACCEPTS Skill -->
          <div class="acronym-skill glass-card">
            <div class="skill-header-large">
              <span class="skill-icon-large">🎭</span>
              <div>
                <h3>ACCEPTS</h3>
                <p class="skill-subtitle">Distraction Techniques</p>
              </div>
            </div>
            <div class="acronym-steps">
              <div class="acronym-step" v-for="accept in acceptsSkills" :key="accept.letter">
                <span class="letter">{{ accept.letter }}</span>
                <div class="step-content">
                  <h4>{{ accept.word }}</h4>
                  <p>{{ accept.description }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- IMPROVE Skill -->
          <div class="acronym-skill glass-card">
            <div class="skill-header-large">
              <span class="skill-icon-large">✨</span>
              <div>
                <h3>IMPROVE</h3>
                <p class="skill-subtitle">Make the Moment Better</p>
              </div>
            </div>
            <div class="acronym-steps">
              <div class="acronym-step" v-for="improve in improveSkills" :key="improve.letter">
                <span class="letter">{{ improve.letter }}</span>
                <div class="step-content">
                  <h4>{{ improve.word }}</h4>
                  <p>{{ improve.description }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Radical Acceptance -->
          <div class="radical-acceptance glass-card">
            <h3>🕊️ Radical Acceptance</h3>
            <p class="radical-description">
              Accepting reality as it is (not approving, just acknowledging)
            </p>
            <div class="acceptance-formula">
              <span class="formula-text">Suffering = Pain × Resistance</span>
            </div>
            <ul class="acceptance-points">
              <li>When you stop fighting reality, you can respond effectively</li>
              <li>"It is what it is"</li>
              <li>Acceptance is not approval - it's acknowledging what's true</li>
            </ul>
          </div>

          <!-- Willingness vs Willfulness -->
          <div class="willingness-card glass-card">
            <h3>Willingness vs. Willfulness</h3>
            <div class="comparison-grid">
              <div class="comparison-side willingness">
                <h4>✅ Willingness</h4>
                <p>Doing what's needed, even if hard</p>
                <ul>
                  <li>Open to reality</li>
                  <li>Flexible and adaptive</li>
                  <li>Accepting what is</li>
                </ul>
              </div>
              <div class="comparison-side willfulness">
                <h4>❌ Willfulness</h4>
                <p>Refusing to accept, trying to control what you can't</p>
                <ul>
                  <li>Fighting reality</li>
                  <li>Rigid and demanding</li>
                  <li>Insisting on your way</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <!-- Practice Tracker -->
        <section v-if="selectedModule" class="practice-section">
          <div class="section-header">
            <h2 class="section-title">📊 Practice Tracker</h2>
            <p class="section-subtitle">
              Track your DBT skills practice
            </p>
          </div>

          <div class="practice-form glass-card">
            <h3>Log Your Practice</h3>
            <div class="form-group">
              <label>Skill Used:</label>
              <select v-model="practiceLog.skill" class="form-select">
                <option value="">Select a skill...</option>
                <option v-for="skill in availableSkills" :key="skill" :value="skill">
                  {{ skill }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label>Situation:</label>
              <textarea 
                v-model="practiceLog.situation"
                placeholder="Describe the situation where you used this skill..."
                class="form-textarea"
              ></textarea>
            </div>
            <div class="form-group">
              <label>How effective was it? (0-10)</label>
              <div class="effectiveness-slider">
                <input 
                  type="range" 
                  min="0" 
                  max="10" 
                  v-model="practiceLog.effectiveness"
                  class="slider"
                >
                <span class="slider-value">{{ practiceLog.effectiveness }}/10</span>
              </div>
            </div>
            <div class="form-group">
              <label>Notes:</label>
              <textarea 
                v-model="practiceLog.notes"
                placeholder="What did you learn? What would you do differently next time?"
                class="form-textarea"
              ></textarea>
            </div>
            <button @click="savePracticeLog" class="save-button">
              Save Practice Log
            </button>
          </div>

          <!-- Saved Practice Logs -->
          <div v-if="savedPracticeLogs.length > 0" class="saved-logs glass-card">
            <h3>Your Practice History</h3>
            <p class="practice-note">
              <strong>Note:</strong> Your practice logs are saved to track your progress over time. 
              This helps you and your therapeutic support see patterns and growth in your DBT skills practice.
            </p>
            <div class="logs-list">
              <div 
                v-for="log in savedPracticeLogs" 
                :key="log.id"
                class="log-item"
              >
                <div class="log-header">
                  <span class="log-skill">{{ log.skill }}</span>
                  <div class="log-header-right">
                    <span class="log-date">{{ formatDate(log.date || '') }}</span>
                    <button @click="deleteLog(log.id!)" class="delete-log">🗑️</button>
                  </div>
                </div>
                <p class="log-situation">{{ log.situation }}</p>
                <div class="log-effectiveness">
                  <span>Effectiveness:</span>
                  <div class="effectiveness-bar">
                    <div 
                      class="effectiveness-fill"
                      :style="{ width: (log.effectiveness * 10) + '%' }"
                    ></div>
                  </div>
                  <span>{{ log.effectiveness }}/10</span>
                </div>
                <p v-if="log.notes" class="log-notes">{{ log.notes }}</p>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, ref, reactive, computed, watch } from 'vue'
import { useTherapyStorage } from '@/composables/useTherapyStorage'
import type { TherapyRecord } from '@/composables/useTherapyStorage'
import { useCurrentUser } from '@/composables/useCurrentUser'

interface DBTModule {
  id: string
  name: string
  icon: string
  description: string
  skillCount: number
}

interface MindfulnessExercise {
  id: string
  name: string
  icon: string
}

interface AcronymSkill {
  letter: string
  word: string
  description: string
}

interface PracticeLog {
  id?: string
  skill: string
  situation: string
  effectiveness: number
  notes: string
  date?: string
}

// DBT-specific therapy record data types
interface DBTPracticeLogData {
  type: 'practice_log'
  practiceLog: PracticeLog
}

type DBTRecordData = DBTPracticeLogData

export default defineComponent({
  name: 'DBTView',
  components: {},
  emits: ['back'],
  setup() {
    // Get current user (Kaleb) from database by name
    const { patientId } = useCurrentUser()

    // Initialize therapy storage for DBT exercises with dynamic patient ID
    const {
      records: therapyRecords,
      isLoading,
      save: saveToTherapy,
      load: loadRecords,
      remove: removeFromTherapy
    } = useTherapyStorage<DBTRecordData>({
      therapyType: 'dbt',
      patientId: patientId, // Pass the ref directly, not .value
      useBackend: true
    })

    // Watch for patient ID to become available, then load records
    watch(patientId, (newPatientId) => {
      if (newPatientId) {
        console.log('🔵 Patient ID loaded for DBT, fetching records for:', newPatientId)
        loadRecords().catch((err: Error) => console.error('Failed to load DBT records:', err))
      }
    }, { immediate: true })

    const selectedModule = ref<string | null>(null)
    
    const dbtModules: DBTModule[] = [
      {
        id: 'mindfulness',
        name: 'Mindfulness',
        icon: '🧘',
        description: 'The foundation - being present without judgment',
        skillCount: 6
      },
      {
        id: 'distress',
        name: 'Distress Tolerance',
        icon: '🛟',
        description: 'Survive crises without making things worse',
        skillCount: 15
      }
    ]

    const mindfulnessExercises: MindfulnessExercise[] = [
      { id: '1', name: 'Body Scan', icon: '🧘' },
      { id: '2', name: 'Breath Counting', icon: '🌬️' },
      { id: '3', name: 'Five Senses (5-4-3-2-1)', icon: '👁️' },
      { id: '4', name: 'Walking Meditation', icon: '🚶' },
      { id: '5', name: 'Eating Meditation', icon: '🍽️' }
    ]

    const acceptsSkills: AcronymSkill[] = [
      { letter: 'A', word: 'Activities', description: 'Engage in something absorbing' },
      { letter: 'C', word: 'Contributing', description: 'Help someone else' },
      { letter: 'C', word: 'Comparisons', description: 'Compare to times you coped worse or others\' struggles' },
      { letter: 'E', word: 'Emotions', description: 'Create opposite emotion (comedy for sadness)' },
      { letter: 'P', word: 'Pushing away', description: 'Mentally shelve the problem for now' },
      { letter: 'T', word: 'Thoughts', description: 'Engage your mind (puzzles, count backwards)' },
      { letter: 'S', word: 'Sensations', description: 'Strong sensations (hold ice, squeeze stress ball, loud music)' }
    ]

    const improveSkills: AcronymSkill[] = [
      { letter: 'I', word: 'Imagery', description: 'Visualize peaceful scene or coping effectively' },
      { letter: 'M', word: 'Meaning', description: 'Find purpose in the suffering' },
      { letter: 'P', word: 'Prayer', description: 'Connect to something greater' },
      { letter: 'R', word: 'Relaxation', description: 'Progressive muscle relaxation, breathing' },
      { letter: 'O', word: 'One thing', description: 'Focus on present, not past/future' },
      { letter: 'V', word: 'Vacation', description: 'Brief mental or physical break' },
      { letter: 'E', word: 'Encouragement', description: 'Self-affirmations, cheerleading' }
    ]

    const practiceLog = reactive<PracticeLog>({
      skill: '',
      situation: '',
      effectiveness: 5,
      notes: ''
    })

    // Computed property to extract saved practice logs from therapy records
    const savedPracticeLogs = computed(() => {
      const filtered = therapyRecords.value
        .filter((record: any) => {
          // Backend returns 'data' field, not 'record_data'
          return record.data && record.data.type === 'practice_log'
        })
        .map((record: any) => {
          const data = record.data as DBTPracticeLogData
          return {
            ...data.practiceLog,
            id: record.id,
            date: record.created_at
          }
        })
        .sort((a: PracticeLog, b: PracticeLog) => new Date(b.date!).getTime() - new Date(a.date!).getTime())
      return filtered
    })

    const availableSkills = computed(() => {
      const skills: string[] = []
      if (selectedModule.value === 'mindfulness') {
        skills.push('Observe', 'Describe', 'Participate', 'Non-Judgmental', 'One-Mindfully', 'Effectively')
      }
      if (selectedModule.value === 'distress') {
        skills.push('STOP', 'TIP', 'ACCEPTS', 'IMPROVE', 'Radical Acceptance', 'Willingness')
      }
      return skills
    })

    const selectModule = (moduleId: string) => {
      selectedModule.value = selectedModule.value === moduleId ? null : moduleId
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const startExercise = (exercise: MindfulnessExercise) => {
      showToast(`Starting ${exercise.name}...`, true)
      // Future: Could implement actual guided exercises
    }

    const savePracticeLog = async () => {
      if (!practiceLog.skill || !practiceLog.situation) {
        showToast('Please fill in skill and situation', false)
        return
      }

      const newLog: PracticeLog = {
        id: Date.now().toString(),
        ...practiceLog,
        date: new Date().toISOString()
      }

      // Save to backend via therapy storage
      const dbtData: DBTPracticeLogData = {
        type: 'practice_log',
        practiceLog: newLog
      }

      try {
        await saveToTherapy(dbtData)
        showToast('Practice log saved!', true)

        // Reset form
        practiceLog.skill = ''
        practiceLog.situation = ''
        practiceLog.effectiveness = 5
        practiceLog.notes = ''
      } catch (error) {
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.error('Error saving practice log:', error)
        }
        showToast('Failed to save practice log', false)
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

    const deleteLog = async (logId: string) => {
      try {
        const success = await removeFromTherapy(logId)
        if (success) {
          showToast('Practice log deleted', false)
        } else {
          showToast('Failed to delete practice log', false)
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('Error deleting log:', error)
        }
        showToast('Failed to delete practice log', false)
      }
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
      selectedModule,
      dbtModules,
      mindfulnessExercises,
      acceptsSkills,
      improveSkills,
      practiceLog,
      savedPracticeLogs,
      availableSkills,
      selectModule,
      startExercise,
      savePracticeLog,
      deleteLog,
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

.container-dbt {
  max-width: 1700px;
  margin: 0 auto;
  padding: 20px 20px 80px 20px;
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

.intro-section {
  margin-bottom: 60px;
}

.core-theory {
  max-width: 900px;
  margin: 0 auto;
}

.dialectic-explanation {
  text-align: center;
}

.dialectic-explanation h3 {
  color: rgba(196, 181, 253, 1);
  font-size: 1.8rem;
  font-weight: 700;
  margin: 0 0 20px 0;
}

.dialectic-text {
  color: rgba(255, 255, 255, 0.9);
  font-size: 1.2rem;
  line-height: 1.8;
  margin-bottom: 32px;
}

.dialectic-text strong {
  color: rgba(196, 181, 253, 1);
  font-weight: 600;
}

.dialectic-formula {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
  padding: 24px;
  background: rgba(139, 92, 246, 0.05);
  border: 2px solid rgba(139, 92, 246, 0.2);
  border-radius: 12px;
}

.formula-part {
  padding: 12px 20px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
}

.formula-part.acceptance {
  background: rgba(34, 197, 94, 0.1);
  border: 2px solid rgba(34, 197, 94, 0.3);
  color: rgba(34, 197, 94, 1);
}

.formula-part.change {
  background: rgba(59, 130, 246, 0.1);
  border: 2px solid rgba(59, 130, 246, 0.3);
  color: rgba(96, 165, 250, 1);
}

.formula-plus,
.formula-equals {
  color: rgba(196, 181, 253, 1);
  font-size: 1.5rem;
  font-weight: 700;
}

.formula-result {
  padding: 12px 24px;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.8) 0%, rgba(129, 140, 248, 0.8) 100%);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: white;
  font-weight: 700;
  font-size: 1.1rem;
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.3);
}

.modules-section {
  margin-bottom: 60px;
}

.modules-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
}

.module-card {
  cursor: pointer;
  text-align: center;
  transition: all 0.3s ease;
  position: relative;
}

.module-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 48px rgba(139, 92, 246, 0.25);
  border-color: rgba(139, 92, 246, 0.4);
}

.module-card.selected {
  border-color: rgba(139, 92, 246, 0.6);
  background: rgba(139, 92, 246, 0.1);
  box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.3);
}

.module-icon {
  font-size: 3rem;
  margin-bottom: 16px;
}

.module-card h3 {
  color: rgba(196, 181, 253, 1);
  margin-bottom: 12px;
  font-size: 1.4rem;
  font-weight: 600;
}

.module-description {
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.5;
  margin-bottom: 16px;
}

.module-badge {
  display: inline-block;
  background: rgba(139, 92, 246, 0.2);
  color: rgba(196, 181, 253, 1);
  padding: 6px 12px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
  border: 1px solid rgba(139, 92, 246, 0.3);
}

.module-content {
  margin-bottom: 60px;
  animation: fadeIn 0.4s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.skills-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
}

.skill-card {
  transition: all 0.3s ease;
}

.skill-card:hover {
  transform: translateY(-2px);
  border-color: rgba(139, 92, 246, 0.3);
}

.skill-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.skill-icon {
  font-size: 1.8rem;
}

.skill-header h3 {
  color: rgba(196, 181, 253, 1);
  margin: 0;
  font-size: 1.3rem;
  font-weight: 600;
}

.skill-description {
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 16px;
  font-size: 1.05rem;
  line-height: 1.5;
}

.skill-points {
  color: rgba(255, 255, 255, 0.75);
  padding-left: 20px;
  margin: 0;
}

.skill-points li {
  margin-bottom: 8px;
  line-height: 1.5;
}

.exercises-section {
  margin-top: 40px;
}

.exercises-section h3 {
  color: rgba(196, 181, 253, 1);
  font-size: 1.5rem;
  margin-bottom: 24px;
  font-weight: 600;
  text-align: center;
}

.exercise-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.exercise-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.exercise-item:hover {
  border-color: rgba(139, 92, 246, 0.4);
  transform: translateY(-2px);
}

.exercise-icon {
  font-size: 1.5rem;
}

.exercise-name {
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
}

.when-to-use {
  margin-bottom: 32px;
  background: rgba(251, 191, 36, 0.05);
  border-color: rgba(251, 191, 36, 0.3);
}

.when-to-use h4 {
  color: rgba(251, 191, 36, 1);
  margin: 0 0 12px 0;
  font-size: 1.2rem;
  font-weight: 600;
}

.when-to-use p {
  color: rgba(255, 255, 255, 0.85);
  margin: 0;
  line-height: 1.6;
}

.acronym-skill {
  margin-bottom: 32px;
}

.skill-header-large {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.skill-icon-large {
  font-size: 3rem;
}

.skill-header-large h3 {
  color: rgba(196, 181, 253, 1);
  margin: 0 0 4px 0;
  font-size: 1.8rem;
  font-weight: 700;
}

.skill-subtitle {
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
  font-size: 1rem;
}

.acronym-steps {
  display: grid;
  gap: 20px;
}

.acronym-step {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.acronym-step:hover {
  border-color: rgba(139, 92, 246, 0.3);
  background: rgba(139, 92, 246, 0.05);
}

.letter {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.8) 0%, rgba(129, 140, 248, 0.8) 100%);
  color: white;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.5rem;
  flex-shrink: 0;
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.step-content h4 {
  color: rgba(196, 181, 253, 1);
  margin: 0 0 8px 0;
  font-size: 1.2rem;
  font-weight: 600;
}

.step-content p {
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
  line-height: 1.5;
}

.radical-acceptance h3 {
  color: rgba(196, 181, 253, 1);
  font-size: 1.6rem;
  margin-bottom: 16px;
  font-weight: 600;
  text-align: center;
}

.radical-description {
  color: rgba(255, 255, 255, 0.85);
  text-align: center;
  margin-bottom: 24px;
  font-size: 1.1rem;
  line-height: 1.6;
}

.acceptance-formula {
  background: rgba(139, 92, 246, 0.1);
  border: 2px solid rgba(139, 92, 246, 0.3);
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  margin-bottom: 24px;
}

.formula-text {
  color: rgba(196, 181, 253, 1);
  font-size: 1.3rem;
  font-weight: 700;
}

.acceptance-points {
  color: rgba(255, 255, 255, 0.8);
  padding-left: 20px;
  margin: 0;
}

.acceptance-points li {
  margin-bottom: 12px;
  line-height: 1.6;
}

.willingness-card h3 {
  color: rgba(196, 181, 253, 1);
  font-size: 1.5rem;
  margin-bottom: 24px;
  font-weight: 600;
  text-align: center;
}

.comparison-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.comparison-side {
  padding: 24px;
  border-radius: 12px;
  border: 2px solid;
}

.comparison-side.willingness {
  background: rgba(34, 197, 94, 0.05);
  border-color: rgba(34, 197, 94, 0.3);
}

.comparison-side.willfulness {
  background: rgba(239, 68, 68, 0.05);
  border-color: rgba(239, 68, 68, 0.3);
}

.comparison-side h4 {
  margin: 0 0 12px 0;
  font-size: 1.2rem;
  font-weight: 600;
}

.comparison-side.willingness h4 {
  color: rgba(34, 197, 94, 1);
}

.comparison-side.willfulness h4 {
  color: rgba(248, 113, 113, 1);
}

.comparison-side p {
  color: rgba(255, 255, 255, 0.85);
  margin-bottom: 16px;
  line-height: 1.5;
}

.comparison-side ul {
  color: rgba(255, 255, 255, 0.75);
  padding-left: 20px;
  margin: 0;
}

.comparison-side li {
  margin-bottom: 8px;
  line-height: 1.4;
}

.practice-section {
  margin-bottom: 60px;
}

.practice-form h3 {
  color: rgba(196, 181, 253, 1);
  font-size: 1.5rem;
  margin-bottom: 24px;
  font-weight: 600;
  text-align: center;
}

.form-group {
  margin-bottom: 24px;
}

.form-group label {
  display: block;
  color: rgba(196, 181, 253, 1);
  margin-bottom: 8px;
  font-weight: 600;
  font-size: 1rem;
}

.form-select,
.form-textarea {
  width: 100%;
  background: rgba(36, 44, 51, 0.863);
  color: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 12px;
  font-size: 0.95rem;
  line-height: 1.5;
  transition: all 0.3s ease;
}

.form-textarea {
  min-height: 100px;
  resize: vertical;
}

.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: rgba(139, 92, 246, 0.6);
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}

.effectiveness-slider {
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

.slider-value {
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

.save-button {
  background: linear-gradient(135deg, rgba(139, 92, 246, 1) 0%, rgba(129, 140, 248, 1) 100%);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 14px 32px;
  font-size: 1.05rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 6px 24px rgba(139, 92, 246, 0.4);
  transition: all 0.3s ease;
  width: 100%;
}

.save-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(139, 92, 246, 0.5);
}

.saved-logs h3 {
  color: rgba(196, 181, 253, 1);
  font-size: 1.5rem;
  margin-bottom: 24px;
  font-weight: 600;
  text-align: center;
}

.logs-list {
  display: grid;
  gap: 20px;
}

.log-item {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s ease;
}

.log-item:hover {
  border-color: rgba(139, 92, 246, 0.3);
  background: rgba(139, 92, 246, 0.05);
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.log-skill {
  color: rgba(196, 181, 253, 1);
  font-weight: 600;
  font-size: 1.1rem;
}

.log-header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.log-date {
  color: rgba(139, 92, 246, 1);
  font-size: 0.9rem;
  font-weight: 500;
}

.delete-log {
  background: rgba(239, 68, 68, 0.1);
  color: rgba(248, 113, 113, 0.8);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 8px;
  padding: 6px 8px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  line-height: 1;
}

.delete-log:hover {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.4);
  color: rgba(248, 113, 113, 1);
}

.log-situation {
  color: rgba(255, 255, 255, 0.85);
  margin-bottom: 12px;
  line-height: 1.5;
}

.log-effectiveness {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.log-effectiveness > span:first-child {
  color: rgba(196, 181, 253, 1);
  font-weight: 500;
  font-size: 0.9rem;
}

.effectiveness-bar {
  flex: 1;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.effectiveness-fill {
  height: 100%;
  background: linear-gradient(90deg, rgba(139, 92, 246, 1) 0%, rgba(34, 197, 94, 1) 100%);
  transition: width 0.3s ease;
}

.log-effectiveness > span:last-child {
  color: rgba(139, 92, 246, 1);
  font-weight: 600;
  font-size: 0.9rem;
}

.log-notes {
  color: rgba(255, 255, 255, 0.7);
  font-style: italic;
  margin: 0;
  line-height: 1.5;
  font-size: 0.95rem;
}

.practice-note {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
  line-height: 1.6;
  margin: 0 0 20px 0;
  padding: 12px;
  background: rgba(139, 92, 246, 0.1);
  border-left: 3px solid rgba(139, 92, 246, 0.5);
  border-radius: 4px;
}

.practice-note strong {
  color: rgba(139, 92, 246, 1);
}

@media (max-width: 768px) {
  .back-button {
    top: 20px;
    left: 20px;
    padding: 10px 16px;
    font-size: 0.9rem;
  }

  .container-dbt {
    padding: 20px 16px 100px 16px;
  }
  
  .modules-grid {
    grid-template-columns: 1fr;
  }
  
  .skills-grid {
    grid-template-columns: 1fr;
  }
  
  .comparison-grid {
    grid-template-columns: 1fr;
  }
  
  .exercise-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .container-dbt {
    padding: 16px 12px 80px 12px;
  }
  
  .page-title {
    font-size: 2.2rem;
  }
  
  .glass-card {
    padding: 24px;
  }
}
</style>
