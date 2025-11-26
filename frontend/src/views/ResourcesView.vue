<template>
  <div class="resources-page">
    <!-- Hamburger button/menu, top left -->
    <div class="hamburger-fixed">
      <HamburgerMenu />
    </div>
    
    <main class="main-content">
      <div class="header-content">
        <h1 class="page-title">🧠 Therapy Resources</h1>
      </div>
      
      <div class="container">

        <!-- Therapy Type Selector -->
        <section class="therapy-selector">
          <div class="selector-tabs">
            <button 
              v-for="therapy in therapyTypes" 
              :key="therapy.id"
              @click="selectTherapy(therapy.id)"
              class="therapy-tab"
              :class="{ 'active': selectedTherapy === therapy.id }"
            >
              <span class="tab-icon">{{ therapy.icon }}</span>
              <div class="tab-content">
                <span class="tab-title">{{ therapy.name }}</span>
                <span class="tab-subtitle">{{ therapy.shortDesc }}</span>
              </div>
            </button>
          </div>
        </section>

        <!-- Therapy Overview Cards (shown when no therapy selected) -->
        <section v-if="!selectedTherapy" class="overview-section">
          <div class="overview-grid">
            <div 
              v-for="therapy in therapyTypes" 
              :key="therapy.id"
              class="overview-card glass-card"
              @click="selectTherapy(therapy.id)"
            >
              <div class="card-icon">{{ therapy.icon }}</div>
              <h3>{{ therapy.name }}</h3>
              <p class="card-description">{{ therapy.description }}</p>
              <div class="card-features">
                <div class="feature" v-for="feature in therapy.features" :key="feature">
                  <span class="feature-icon">✓</span>
                  <span>{{ feature }}</span>
                </div>
              </div>
              <button class="explore-button">
                Explore {{ therapy.name }}
                <span class="arrow">→</span>
              </button>
            </div>
          </div>
        </section>

        <!-- Dynamic Therapy Content -->
        <section v-if="selectedTherapy" class="therapy-content">
          <component :is="currentTherapyComponent" />
        </section>
      </div>
    </main>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, markRaw } from 'vue'
import HamburgerMenu from '@/components/HamburgerMenu.vue'
import CBTView from './CBTView.vue'
import SelfContextView from './SelfContextView.vue'
import DBTView from './DBTView.vue'

interface TherapyType {
  id: string
  name: string
  icon: string
  shortDesc: string
  description: string
  features: string[]
  component: any
}

export default defineComponent({
  name: 'ResourcesView',
  components: {
    HamburgerMenu,
    CBTView,
    SelfContextView,
    DBTView
  },
  setup() {
    const selectedTherapy = ref<string | null>(null)

    const therapyTypes: TherapyType[] = [
      {
        id: 'cbt',
        name: 'CBT',
        icon: '🧠',
        shortDesc: 'Cognitive Behavioral Therapy',
        description: 'Change negative thought patterns and develop healthier behaviors through structured exercises and cognitive restructuring.',
        features: [
          'Identify cognitive distortions',
          'Challenge negative thoughts',
          'Track thought records',
          'Build balanced thinking'
        ],
        component: markRaw(CBTView)
      },
      {
        id: 'act',
        name: 'ACT',
        icon: '🌌',
        shortDesc: 'Acceptance & Commitment Therapy',
        description: 'Develop psychological flexibility by accepting what\'s out of your control and committing to actions aligned with your values.',
        features: [
          'Observer self practice',
          'Values clarification',
          'Committed action',
          'Psychological flexibility'
        ],
        component: markRaw(SelfContextView)
      },
      {
        id: 'dbt',
        name: 'DBT',
        icon: '⚖️',
        shortDesc: 'Dialectical Behavior Therapy',
        description: 'Balance acceptance and change through mindfulness, distress tolerance, emotion regulation, and interpersonal effectiveness.',
        features: [
          'Mindfulness skills',
          'Distress tolerance',
          'Emotion regulation',
          'Crisis survival'
        ],
        component: markRaw(DBTView)
      }
    ]

    const currentTherapyComponent = computed(() => {
      const therapy = therapyTypes.find(t => t.id === selectedTherapy.value)
      return therapy?.component || null
    })

    const selectTherapy = (therapyId: string) => {
      // Toggle off if clicking the same therapy
      if (selectedTherapy.value === therapyId) {
        selectedTherapy.value = null
      } else {
        selectedTherapy.value = therapyId
        // Scroll to top of content
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }

    return {
      selectedTherapy,
      therapyTypes,
      currentTherapyComponent,
      selectTherapy
    }
  }
})
</script>

<style scoped>
.resources-page {
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
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Fixed hamburger placement */
.hamburger-fixed {
  position: fixed;
  top: 32px;
  left: 32px;
  z-index: 2001;
}

.main-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0;
  scroll-behavior: smooth;
  
  scrollbar-width: thin;
  scrollbar-color: rgba(139, 92, 246, 0.6) rgba(255, 255, 255, 0.1);
}

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

.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px 20px 80px 20px;
}

.hero-section {
  text-align: center;
  margin-bottom: 60px;
}

.page-title {
  background: linear-gradient(135deg, rgba(196, 181, 253, 1) 0%, rgba(139, 92, 246, 1) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-size: 3.5rem;
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

.therapy-selector {
  margin-bottom: 60px;
}

.selector-tabs {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.therapy-tab {
  display: flex;
  align-items: center;
  gap: 16px;
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(20px) saturate(180%);
  border: 2px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 20px 24px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  text-align: left;
  position: relative;
  overflow: hidden;
}

.therapy-tab::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, 
    rgba(139, 92, 246, 0.1) 0%, 
    rgba(129, 140, 248, 0.1) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.therapy-tab:hover {
  border-color: rgba(139, 92, 246, 0.4);
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(139, 92, 246, 0.2);
}

.therapy-tab:hover::before {
  opacity: 1;
}

.therapy-tab.active {
  border-color: rgba(139, 92, 246, 0.6);
  background: rgba(139, 92, 246, 0.1);
  box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.3);
}

.therapy-tab.active::before {
  opacity: 1;
}

.tab-icon {
  font-size: 2.5rem;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
}

.tab-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  position: relative;
  z-index: 1;
}

.tab-title {
  color: rgba(196, 181, 253, 1);
  font-size: 1.3rem;
  font-weight: 700;
}

.tab-subtitle {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.95rem;
  font-weight: 400;
}

.overview-section {
  margin-bottom: 60px;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 32px;
}

.overview-card {
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 20px;
  padding: 40px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.overview-card:hover {
  border-color: rgba(139, 92, 246, 0.4);
  transform: translateY(-8px);
  box-shadow: 0 16px 48px rgba(139, 92, 246, 0.25);
}

.card-icon {
  font-size: 4rem;
  margin-bottom: 24px;
  opacity: 0.9;
}

.overview-card h3 {
  color: rgba(196, 181, 253, 1);
  font-size: 1.8rem;
  font-weight: 700;
  margin: 0 0 16px 0;
}

.card-description {
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.6;
  margin-bottom: 24px;
  font-size: 1.05rem;
}

.card-features {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  margin-bottom: 32px;
}

.feature {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(139, 92, 246, 0.05);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 10px;
  text-align: left;
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.95rem;
}

.feature-icon {
  color: rgba(34, 197, 94, 1);
  font-weight: 700;
  font-size: 1.1rem;
  flex-shrink: 0;
}

.explore-button {
  background: linear-gradient(135deg, rgba(139, 92, 246, 1) 0%, rgba(129, 140, 248, 1) 100%);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 14px 28px;
  font-size: 1.05rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 6px 24px rgba(139, 92, 246, 0.4);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.explore-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(139, 92, 246, 0.5);
}

.arrow {
  transition: transform 0.3s ease;
}

.explore-button:hover .arrow {
  transform: translateX(4px);
}

.therapy-content {
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

.glass-card {
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.3),
    0 4px 16px rgba(139, 92, 246, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

/* Mobile Responsiveness */
@media (max-width: 768px) {
  .container {
    padding: 20px 16px 100px 16px;
  }
  
  .header-content {
    padding: 16px;
  }
  
  .page-title {
    font-size: 2.5rem;
  }
  
  .page-subtitle {
    font-size: 1.2rem;
  }
  
  .selector-tabs {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .overview-grid {
    grid-template-columns: 1fr;
    gap: 24px;
  }
  
  .overview-card {
    padding: 32px 24px;
  }
  
  .therapy-tab {
    padding: 16px 20px;
  }
  
  .tab-icon {
    font-size: 2rem;
  }
  
  .tab-title {
    font-size: 1.1rem;
  }
  
  .tab-subtitle {
    font-size: 0.85rem;
  }
}

@media (max-width: 480px) {
  .container {
    padding: 16px 12px 80px 12px;
  }
  
  .page-title {
    font-size: 2rem;
  }
  
  .page-subtitle {
    font-size: 1.1rem;
  }
  
  .card-icon {
    font-size: 3rem;
  }
  
  .overview-card h3 {
    font-size: 1.5rem;
  }
  
  .overview-card {
    padding: 28px 20px;
  }
}
</style>
