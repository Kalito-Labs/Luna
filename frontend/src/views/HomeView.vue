<template>
  <div class="homeview-root" :style="homeBgStyle">
    <!-- Hamburger button/menu, top left -->
    <div class="hamburger-fixed">
      <HamburgerMenu />
    </div>

    <!-- Main Content Area -->
    <section class="main-area">
      <h1 class="main-title">KalitoSpace</h1>
            <div class="intro-block">
        <div class="intro-hero">
          <h2 class="intro-headline">Helping Mom and Dad, Made Easy</h2>
        </div>

        <div class="features-container">
          <ul class="feature-list">

            <li>
              <span class="emoji">🏥</span>
              <div class="feature-content">
                <strong>Complete Care Dashboard</strong>
                <span class="feature-desc">Track medications, appointments, vitals, and caregiver schedules in one organized view.</span>
              </div>
            </li>

            <li>
              <span class="emoji">📊</span>
              <div class="feature-content">
                <strong>Health Trend Monitoring</strong>
                <span class="feature-desc">Visualize  weight, and glucose patterns to spot changes early.</span>
              </div>
            </li>

            <li>
              <span class="emoji">🤖</span>
              <div class="feature-content">
                <strong>Kalito AI</strong>
                <span class="feature-desc">  Always ready to help with everyday questions, planning, and family support.
</span>
              </div>
            </li>

            <li>
              <span class="emoji">🔒</span>
              <div class="feature-content">
                <strong>Private and Local</strong>
                <span class="feature-desc">All data stored locally. No cloud storage, No tracking.</span>
              </div>
            </li>
          </ul>
        </div>
        <div class="cta-section">
          <p class="cta-text">Ready to Start?</p>
          <div class="cta-buttons">
            <router-link to="/eldercare" class="btn btn-primary">
              <span class="btn-icon">🏥</span>
              Start Managing Care
            </router-link>
            <router-link to="/kalito" class="btn btn-secondary">
              <span class="btn-icon">💬</span>
              Talk to Kalito
            </router-link>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import HamburgerMenu from '@/components/HamburgerMenu.vue'
import homeBg from '@/assets/images/home-1.webp'

// Background style for the home view
const homeBgStyle = computed(() => ({
  background: `#16161e url('${homeBg}') center center/cover no-repeat`,
}))
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
  gap: 1.5em;
  background: rgba(12, 14, 18, 0.54);
  border-radius: 1.15em;
  box-shadow:
    0 6px 32px 0 #0005,
    0 0 0 1.5px #3a416544;
  backdrop-filter: blur(10px) saturate(160%);
  -webkit-backdrop-filter: blur(10px) saturate(160%);
  border: 1.5px solid rgba(66, 72, 110, 0.18);
  padding: 2.8em 3em;
  transition: background 0.2s;
}

/* Intro hero section */
.intro-hero {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 0.8em;
  width: 100%;
}

.intro-headline {
  font-size: 2rem;
  font-weight: 600;
  color: #d4e7fd;
  margin: 0;
  letter-spacing: -0.01em;
  text-shadow: 0 2px 12px rgba(16, 22, 45, 0.4);
}

.intro-tagline {
  font-size: 1.15rem;
  line-height: 1.7;
  color: #b8cfe8;
  margin: 0;
  max-width: 720px;
  margin-left: auto;
  margin-right: auto;
}

/* Features container styles */
.features-container {
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
  padding: 1.8em 2em;
  width: 100%;
}

.features-heading {
  font-size: 1.3rem;
  font-weight: 600;
  color: #c5dbf5;
  margin: 0 0 1.2em 0;
  text-align: center;
  letter-spacing: -0.01em;
}

/* Feature list styles */
.feature-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 1.2em;
}

/* Feature list item styles */
.feature-list li {
  color: #d2e7fc;
  font-size: 1rem;
  display: flex;
  align-items: flex-start;
  gap: 1em;
  padding: 0;
}

/* Emoji styles */
.emoji {
  font-size: 1.8em;
  flex-shrink: 0;
  opacity: 0.95;
  margin-top: 2px;
  color: #76f1d8;
  filter: none;
}

.feature-content {
  display: flex;
  flex-direction: column;
  gap: 0.4em;
  flex: 1;
}

.feature-content strong {
  font-size: 1.08rem;
  font-weight: 600;
  color: #e4ecf7;
  display: block;
}

.feature-desc {
  font-size: 0.95rem;
  line-height: 1.6;
  color: #9fb5d4;
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
  background: linear-gradient(135deg, #5a7bc7 0%, #4c6bb8 100%);
  color: #fff;
  box-shadow: 0 4px 16px rgba(90, 123, 199, 0.3);
  border-color: rgba(255, 255, 255, 0.1);
}

.btn-primary:hover {
  background: linear-gradient(135deg, #6585d1 0%, #5777c4 100%);
  box-shadow: 0 6px 20px rgba(90, 123, 199, 0.4);
  transform: translateY(-2px);
}

.btn-secondary {
  background: rgba(42, 48, 72, 0.6);
  color: #d4e7fd;
  border-color: rgba(66, 72, 110, 0.4);
  backdrop-filter: blur(8px);
}

.btn-secondary:hover {
  background: rgba(50, 58, 86, 0.7);
  border-color: rgba(90, 123, 199, 0.5);
  transform: translateY(-2px);
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

  .intro-headline {
    font-size: 1.7rem;
  }

  .intro-tagline {
    font-size: 1.05rem;
  }

  .features-container {
    padding: 1.6em 1.8em;
  }

  .features-heading {
    font-size: 1.2rem;
  }

  .feature-list {
    gap: 1em;
  }

  .feature-list li {
    gap: 0.9em;
  }

  .feature-content strong {
    font-size: 1.05rem;
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

  .intro-headline {
    font-size: 1.5rem;
  }

  .intro-tagline {
    font-size: 1rem;
    line-height: 1.6;
  }

  .features-container {
    padding: 1.4em 1.6em;
  }

  .features-heading {
    font-size: 1.15rem;
    margin-bottom: 1em;
  }

  .feature-list {
    gap: 0.9em;
  }

  .feature-list li {
    gap: 0.8em;
  }

  .emoji {
    font-size: 1.6em;
  }

  .feature-content strong {
    font-size: 1rem;
  }

  .feature-desc {
    font-size: 0.9rem;
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
  }

  .main-title {
    font-size: 1.7rem;
    margin: 0.3em 0 0.4em 0;
  }

  .intro-block {
    max-width: 96%;
    padding: 1.8em 1.4em;
    gap: 1em;
    margin-top: 2.5rem;
    border-radius: 1em;
  }

  .intro-headline {
    font-size: 1.3rem;
  }

  .intro-tagline {
    font-size: 0.95rem;
    line-height: 1.5;
  }

  .features-container {
    padding: 1.2em 1.4em;
    border-radius: 0.6em;
  }

  .features-heading {
    font-size: 1.05rem;
    margin-bottom: 0.9em;
  }

  .feature-list {
    gap: 0.8em;
  }

  .feature-list li {
    gap: 0.7em;
  }

  .emoji {
    font-size: 1.5em;
  }

  .feature-content strong {
    font-size: 0.95rem;
  }

  .feature-desc {
    font-size: 0.85rem;
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

  .intro-headline {
    font-size: 1.2rem;
  }

  .intro-tagline {
    font-size: 0.9rem;
  }

  .features-container {
    padding: 1.2em 1.4em;
  }

  .features-heading {
    font-size: 1rem;
  }

  .feature-list {
    gap: 0.7em;
  }

  .feature-content strong {
    font-size: 0.9rem;
  }

  .feature-desc {
    font-size: 0.8rem;
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
