<template>
  <div class="homeview-root" :style="homeBgStyle">
    <!-- Hamburger button/menu, top left -->
    <div class="hamburger-fixed">
      <HamburgerMenu />
    </div>

    <!-- Main Content Area -->
    <section class="main-area">
      <h1 class="main-title">Project Luna</h1>
      <div class="intro-block">
        <div class="quotes-container">
          <div v-if="currentQuote.text" class="daily-quote">
            <div class="quote-icon">✨</div>
            <blockquote class="quote-text">
              "{{ currentQuote.text }}"
            </blockquote>
            <div class="quote-author">
              — {{ currentQuote.author }}
            </div>
          </div>
        </div>
        <div class="cta-section">
          <p class="cta-text">Begin Your Wellness Journey</p>
          <div class="cta-buttons">
            <router-link to="/kalito" class="btn btn-primary">
              <span class="btn-icon">🌙</span>
              Luna AI
            </router-link>
            <router-link to="/journal" class="btn btn-secondary">
              <span class="btn-icon">📓</span>
              Journal
            </router-link>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import HamburgerMenu from '@/components/HamburgerMenu.vue'
import { getRandomQuote, type Quote } from '@/utils/quotes'
import homeBg from '@/assets/images/bg-1.webp'

// Current quote state
const currentQuote = ref<Quote>({ text: '', author: '' })

// Background style for the home view
const homeBgStyle = computed(() => ({
  background: `#16161e url('${homeBg}') center center/cover no-repeat`,
}))

// Initialize with random quote on mount
onMounted(() => {
  currentQuote.value = getRandomQuote()
})
</script>

<style scoped>
:root {
  --color-primary: #6e79c7;
  --color-background: #16161e;
  --color-border: rgba(66, 72, 110, 0.25);
  --color-text: #e4ecf7;
  --border-radius: 0.75em;
  --font-family: 'IBM Plex Sans', Arial, sans-serif;
  --transition-duration: 0.13s;
}

/* General container styles */
.homeview-root {
  min-height: 100vh;
  min-width: 100vw;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--color-background);
  color: var(--color-text);
  margin: 0;
  padding: 0;
}

/* Fixed hamburger placement */
.hamburger-fixed {
  position: fixed;
  top: 32px;
  left: 32px;
  z-index: 2001;
}

/* Main Content Styles */
.main-area {
  flex: 1;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

/* Title styles */
.main-title {
  color: #bfe0ff;
  text-shadow:
    0 2px 16px #10162d5c,
    0 1px 0 #000a;
  font-family: 'Barlow', 'Sora', Arial, sans-serif;
  font-size: 2.7rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  margin: 0.5em 0 0.6em 0;
  text-align: center;
  z-index: 1;
}

/* Intro block styles */
.intro-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 1.7em;
  width: 100%;
  max-width: 900px;
  gap: 1em;
  background: rgba(12, 14, 18, 0.54);
  border-radius: 1.15em;
  box-shadow:
    0 6px 32px 0 #0005,
    0 0 0 1.5px #3a416544;
  backdrop-filter: blur(10px) saturate(160%);
  -webkit-backdrop-filter: blur(10px) saturate(160%);
  border: 1.5px solid rgba(66, 72, 110, 0.18);
  padding: 1em 1em;
  transition: background 0.2s;
}

/* Quotes container styles */
.quotes-container {
  background: rgba(8, 10, 14, 0.75);
  border: 1.5px solid var(--color-border);
  border-radius: 0.75em;
  box-shadow:
    0 1.5px 10px 0 #10132332,
    0 0 0 1px rgba(58, 65, 101, 0.2);
  backdrop-filter: blur(8px) saturate(140%);
  -webkit-backdrop-filter: blur(8px) saturate(140%);
  color: var(--color-text);
  font-family: var(--font-family);
  padding: 1em 2em;
  width: 100%;
  text-align: center;
  position: relative;
}

.daily-quote {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.2em;
  max-width: 650px;
  margin: 0 auto;
}

.quote-icon {
  font-size: 2.5em;
  color: #8b5cf6;
  opacity: 0.9;
  margin-bottom: 0.5em;
}

.quote-text {
  font-size: 1.4rem;
  line-height: 1.6;
  font-style: italic;
  color: #e4ecf7;
  margin: 0;
  font-weight: 400;
  text-align: center;
}

.quote-author {
  font-size: 1.1rem;
  color: #9fb5d4;
  font-weight: 500;
  margin-top: 0.5em;
}

/* CTA Section */
.cta-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.2em;
  width: 100%;
  padding-top: 0.5em;
}

.cta-text {
  font-size: 1.1rem;
  color: #c5dbf5;
  margin: 0;
  font-weight: 500;
}

.cta-buttons {
  display: flex;
  gap: 1em;
  flex-wrap: wrap;
  justify-content: center;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.6em;
  padding: 0.85em 1.8em;
  border-radius: 0.6em;
  font-size: 1rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s ease;
  border: 1.5px solid transparent;
  cursor: pointer;
}

.btn-icon {
  font-size: 1.2em;
}

.btn-primary {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: #fff;
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.4);
  border-color: rgba(255, 255, 255, 0.1);
  font-size: 1.1rem;
  padding: 1em 2.2em;
}

.btn-primary:hover {
  background: linear-gradient(135deg, #9d72f7 0%, #8b5cf6 100%);
  box-shadow: 0 6px 20px rgba(139, 92, 246, 0.5);
  transform: translateY(-2px);
}

.btn-secondary {
  background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%);
  color: #fff;
  box-shadow: 0 4px 16px rgba(14, 165, 233, 0.4);
  border-color: rgba(255, 255, 255, 0.1);
  font-size: 1.1rem;
  padding: 1em 2.2em;
}

.btn-secondary:hover {
  background: linear-gradient(135deg, #38bdf8 0%, #22d3ee 100%);
  box-shadow: 0 6px 20px rgba(14, 165, 233, 0.5);
  transform: translateY(-2px);
  border-color: rgba(255, 255, 255, 0.2);
}

/* ================================================================ */
/* Mobile Styles - Tablets (Portrait and Landscape)                */
/* ================================================================ */
@media (max-width: 1024px) {
  .hamburger-fixed {
    top: 24px;
    left: 24px;
  }

  .main-title {
    font-size: 2.3rem;
    margin: 0.4em 0 0.5em 0;
  }

  .intro-block {
    max-width: 90%;
    padding: 2.4em 2.4em;
    gap: 1.3em;
    margin-top: 2rem;
  }

  .quotes-container {
    padding: 2em 1.8em;
  }

  .quote-text {
    font-size: 1.2rem;
  }

  .quote-author {
    font-size: 1rem;
  }

  .cta-buttons {
    flex-direction: column;
    width: 100%;
  }

  .btn {
    width: 100%;
    justify-content: center;
  }
}

/* ================================================================ */
/* Mobile Styles - Phones (Portrait)                               */
/* ================================================================ */
@media (max-width: 768px) {
  .hamburger-fixed {
    top: 20px;
    left: 20px;
  }

  .main-title {
    font-size: 2rem;
    margin: 0.3em 0 0.4em 0;
    letter-spacing: 0.03em;
  }

  .intro-block {
    max-width: 95%;
    padding: 2em 1.8em;
    gap: 1.2em;
    margin-bottom: 1.5em;
  }

  .quotes-container {
    padding: 1.8em 1.6em;
  }

  .quote-icon {
    font-size: 2rem;
  }

  .quote-text {
    font-size: 1.1rem;
    line-height: 1.5;
  }

  .quote-author {
    font-size: 0.95rem;
  }

  .cta-text {
    font-size: 1rem;
  }

  .btn {
    padding: 0.8em 1.5em;
    font-size: 0.95rem;
  }
}

/* ================================================================ */
/* Mobile Styles - Small Phones (Portrait)                         */
/* ================================================================ */
@media (max-width: 480px) {
  .hamburger-fixed {
    top: 16px;
    left: 16px;
    margin-top: .8rem;
  }

  .main-title {
    font-size: 1.7rem;
    margin: 0.3em 0 0.4em 0;
    margin-top: 2rem;
  }

  .intro-block {
    max-width: 96%;
    padding: 1.8em 1.4em;
    gap: 1em;
    margin-top: 2.5rem;
    border-radius: 1em;
  }

  .quotes-container {
    padding: 1.5em 1.4em;
    border-radius: 0.6em;
  }

  .quote-icon {
    font-size: 1.8rem;
  }

  .quote-text {
    font-size: 1rem;
    line-height: 1.4;
  }

  .quote-author {
    font-size: 0.9rem;
  }

  .cta-text {
    font-size: 0.95rem;
  }

  .btn {
    padding: 0.75em 1.3em;
    font-size: 0.9rem;
  }
}

/* ================================================================ */
/* Mobile Styles - Landscape Phones                                */
/* ================================================================ */
@media (max-width: 896px) and (max-height: 414px) and (orientation: landscape) {
  .main-title {
    font-size: 1.8rem;
    margin: 0.2em 0 0.3em 0;
  }

  .intro-block {
    max-width: 85%;
    padding: 1.5em 1.6em;
    gap: 0.9em;
    margin-bottom: 1em;
  }

  .quotes-container {
    padding: 1.2em 1.4em;
  }

  .quote-icon {
    font-size: 1.5rem;
  }

  .quote-text {
    font-size: 0.95rem;
    line-height: 1.3;
  }

  .quote-author {
    font-size: 0.85rem;
  }

  .cta-section {
    gap: 0.8em;
  }

  .btn {
    padding: 0.7em 1.2em;
    font-size: 0.85rem;
  }
}
</style>