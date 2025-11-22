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
/* General container styles */
.homeview-root {
  min-height: 100vh;
  min-width: 100vw;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, 
    rgba(15, 23, 42, 0.98) 0%, 
    rgba(30, 41, 59, 0.95) 50%,
    rgba(67, 56, 202, 0.1) 100%);
  color: rgba(255, 255, 255, 0.92);
  margin: 0;
  padding: 0;
  position: relative;
}

.homeview-root::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('${homeBg}') center center/cover no-repeat;
  opacity: 0.15;
  z-index: 0;
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
  padding-top: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  z-index: 1;
}

/* Title styles */
.main-title {
  font-size: 3.5rem;
  font-weight: 700;
  margin: 0 0 2rem 0;
  text-align: center;
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.98) 0%, 
    rgba(196, 181, 253, 0.9) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.02em;
  text-shadow: 0 4px 20px rgba(139, 92, 246, 0.3);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

/* Intro block styles */
.intro-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 2rem;
  width: 100%;
  max-width: 900px;
  gap: 2rem;
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(30px);
  border-radius: 24px;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(139, 92, 246, 0.2);
  padding: 1.2rem 1rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.intro-block::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, 
    transparent, 
    rgba(139, 92, 246, 0.6), 
    transparent);
  border-radius: 2px;
}

.intro-block:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(139, 92, 246, 0.3);
  box-shadow: 0 12px 50px rgba(139, 92, 246, 0.25);
}

/* Quotes container styles */
.quotes-container {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(139, 92, 246, 0.15);
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(20px);
  padding: 1rem 1.5rem;
  width: 100%;
  text-align: center;
  position: relative;
}

.daily-quote {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  max-width: 650px;
  margin: 0 auto;
}

.quote-icon {
  font-size: 3rem;
  opacity: 0.9;
  filter: drop-shadow(0 4px 12px rgba(139, 92, 246, 0.4));
}

.quote-text {
  font-size: 1.5rem;
  line-height: 1.7;
  font-style: italic;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
  font-weight: 400;
  text-align: center;
}

.quote-author {
  font-size: 1.1rem;
  color: rgba(196, 181, 253, 0.9);
  font-weight: 500;
  margin-top: 0.5rem;
}

/* CTA Section */
.cta-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  width: 100%;
  padding-top: 1rem;
}

.cta-text {
  font-size: 1.25rem;
  color: rgba(255, 255, 255, 0.85);
  margin: 0;
  font-weight: 600;
  letter-spacing: 0.01em;
}

.cta-buttons {
  display: flex;
  gap: 1.25rem;
  flex-wrap: wrap;
  justify-content: center;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 2rem;
  border-radius: 16px;
  font-size: 1.1rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid transparent;
  cursor: pointer;
  backdrop-filter: blur(20px);
}

.btn-icon {
  font-size: 1.3em;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.btn-primary {
  background: linear-gradient(135deg, 
    rgba(139, 92, 246, 0.9) 0%, 
    rgba(124, 58, 237, 0.95) 100%);
  color: white;
  box-shadow: 0 8px 32px rgba(139, 92, 246, 0.4);
  border-color: rgba(255, 255, 255, 0.2);
}

.btn-primary:hover {
  background: linear-gradient(135deg, 
    rgba(139, 92, 246, 1) 0%, 
    rgba(124, 58, 237, 1) 100%);
  box-shadow: 0 12px 40px rgba(139, 92, 246, 0.6);
  transform: translateY(-3px);
  border-color: rgba(255, 255, 255, 0.3);
}

.btn-secondary {
  background: linear-gradient(135deg, 
    rgba(129, 140, 248, 0.9) 0%, 
    rgba(99, 102, 241, 0.95) 100%);
  color: white;
  box-shadow: 0 8px 32px rgba(129, 140, 248, 0.4);
  border-color: rgba(255, 255, 255, 0.2);
}

.btn-secondary:hover {
  background: linear-gradient(135deg, 
    rgba(129, 140, 248, 1) 0%, 
    rgba(99, 102, 241, 1) 100%);
  box-shadow: 0 12px 40px rgba(129, 140, 248, 0.6);
  transform: translateY(-3px);
  border-color: rgba(255, 255, 255, 0.3);
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
    font-size: 3rem;
    margin: 0 0 1.5rem 0;
  }

  .intro-block {
    max-width: 90%;
    padding: 2.5rem;
    gap: 1.75rem;
  }

  .quotes-container {
    padding: 1.75rem 2rem;
  }

  .quote-text {
    font-size: 1.3rem;
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
    font-size: 2.5rem;
    margin: 0 0 1.25rem 0;
  }

  .intro-block {
    max-width: 95%;
    padding: 2rem 1.75rem;
    gap: 1.5rem;
  }

  .quotes-container {
    padding: 1.5rem 1.75rem;
  }

  .quote-icon {
    font-size: 2.5rem;
  }

  .quote-text {
    font-size: 1.2rem;
    line-height: 1.6;
  }

  .quote-author {
    font-size: 1rem;
  }

  .cta-text {
    font-size: 1.1rem;
  }

  .btn {
    padding: 0.875rem 1.75rem;
    font-size: 1rem;
  }
}

/* ================================================================ */
/* Mobile Styles - Small Phones (Portrait)                         */
/* ================================================================ */
@media (max-width: 480px) {
  .hamburger-fixed {
    top: 16px;
    left: 16px;
  }

  .main-title {
    font-size: 2rem;
    margin: 2rem 0 1rem 0;
  }

  .intro-block {
    max-width: 96%;
    padding: 1.75rem 1.5rem;
    gap: 1.25rem;
    margin-top: 1rem;
    border-radius: 20px;
  }

  .quotes-container {
    padding: 1.5rem 1.5rem;
    border-radius: 16px;
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
    padding: 0.875rem 1.5rem;
    font-size: 0.95rem;
  }
}

/* ================================================================ */
/* Mobile Styles - Landscape Phones                                */
/* ================================================================ */
@media (max-width: 896px) and (max-height: 414px) and (orientation: landscape) {
  .main-title {
    font-size: 2rem;
    margin: 0.5rem 0 1rem 0;
  }

  .intro-block {
    max-width: 85%;
    padding: 1.5rem 1.75rem;
    gap: 1.25rem;
    margin-bottom: 1rem;
  }

  .quotes-container {
    padding: 1.25rem 1.5rem;
  }

  .quote-icon {
    font-size: 1.75rem;
  }

  .quote-text {
    font-size: 1rem;
    line-height: 1.4;
  }

  .quote-author {
    font-size: 0.9rem;
  }

  .cta-section {
    gap: 1rem;
  }

  .btn {
    padding: 0.75rem 1.5rem;
    font-size: 0.9rem;
  }
}
</style>