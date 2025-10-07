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
        <div class="intro-tagline">
          An offline-first AI ecosystem
          <span class="faint">prioritizing privacy and transparency.</span>
        </div>
        <div class="features-container">
          <ul class="feature-list">
            <li>
              <span class="emoji">🛡️</span> Modular AI models with transparent token and cost
              tracking.
            </li>
            <li>
              <span class="emoji">🔓</span> All data stored locally. No telemetry. No cloud/vendor
              lock-in.
            </li>
            <li><span class="emoji">💾</span> Purge, export, or migrate data any time.</li>
          </ul>
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
  max-width: 780px;
  gap: 0.85em;
  background: rgba(12, 14, 18, 0.54);
  border-radius: 1.15em;
  box-shadow:
    0 6px 32px 0 #0005,
    0 0 0 1.5px #3a416544;
  backdrop-filter: blur(10px) saturate(160%);
  -webkit-backdrop-filter: blur(10px) saturate(160%);
  border: 1.5px solid rgba(66, 72, 110, 0.18);
  padding: 2.3em 2.6em;
  transition: background 0.2s;
}

/* Features container styles */
.features-container {
  background: rgba(8, 10, 14, 0.75);
  border: 1.5px solid var(--color-border);
  border-radius: 0.5em;
  box-shadow:
    0 1.5px 10px 0 #10132332,
    0 0 0 1px rgba(58, 65, 101, 0.2);
  backdrop-filter: blur(8px) saturate(140%);
  -webkit-backdrop-filter: blur(8px) saturate(140%);
  color: var(--color-text);
  font-family: var(--font-family);
  padding: 1.2em;
  margin: 0.7em 0 1.2em 0;
  width: 98%;
  max-width: 720px;
}

/* Feature list styles */
.feature-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.2em;
}

/* Feature list item styles */
.feature-list li {
  color: #d2e7fc;
  font-size: 1.12rem;
  text-shadow: 0 1px 6px #1818302e;
  display: flex;
  align-items: flex-start;
  gap: 0.66em;
  padding: 0.12em 0;
}

/* Emoji styles */
.emoji {
  font-size: 1em;
  flex-shrink: 0;
  opacity: 0.98;
  margin-top: 2px;
  color: #76f1d8;
  filter: none;
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
    padding: 2em 2.2em;
    gap: 0.75em;
    margin-top: 2rem;
  }

  .features-container {
    padding: 1.1em;
    max-width: 100%;
  }

  .feature-list li {
    font-size: 1.08rem;
    gap: 0.6em;
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
    padding: 1.8em 1.8em;
    gap: 0.7em;
    margin-bottom: 1.5em;
  }

  .intro-tagline {
    font-size: 0.95rem;
    text-align: center;
  }

  .features-container {
    padding: 1em;
    margin: 0.6em 0 1em 0;
  }

  .feature-list {
    gap: 0.3em;
  }

  .feature-list li {
    font-size: 1rem;
    gap: 0.55em;
    padding: 0.15em 0;
  }

  .emoji {
    font-size: 0.95em;
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
    padding: 1.5em 1.4em;
    gap: 0.65em;
  margin-top: 2.5rem;
    border-radius: 1em;
  }

  .intro-tagline {
    font-size: 0.9rem;
  }

  .features-container {
    padding: 0.9em;
    margin: 0.5em 0 0.9em 0;
    border-radius: 0.4em;
  }

  .feature-list {
    gap: 0.25em;
  }

  .feature-list li {
    font-size: 0.95rem;
    gap: 0.5em;
    padding: 0.18em 0;
  }

  .emoji {
    font-size: 0.9em;
    margin-top: 1px;
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
    padding: 1.3em 1.6em;
    gap: 0.6em;
    margin-bottom: 1em;
  }

  .intro-tagline {
    font-size: 0.9rem;
  }

  .features-container {
    padding: 0.85em;
    margin: 0.5em 0 0.8em 0;
  }

  .feature-list li {
    font-size: 0.92rem;
  }
}
</style>
