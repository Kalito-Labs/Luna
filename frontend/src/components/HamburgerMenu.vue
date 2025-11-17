<template>
  <div class="hamburger-container" ref="menuRef">
    <button
      class="hamburger-button"
      :class="{ open }"
      @click="open = !open"
      aria-label="Toggle menu"
    >
      <span /><span /><span />
    </button>
    <transition name="menu-fade">
      <div v-if="open" class="hamburger-menu">
        <button class="menu-item" @click="goToHome">
          <span class="menu-icon">🏠</span>
          Home
        </button>
        <button class="menu-item" @click="goToChat">Luna Ai</button>
        <button class="menu-item" @click="goToJournal">
          <span class="menu-icon">📓</span>
          Journal
        </button>
        <button class="menu-item" @click="goToPersonas">
          <span class="menu-icon">👤</span>
          Personas
        </button>
        <button class="menu-item" @click="goToKalitoHub">
          <span class="menu-icon">🏥</span>
          Kalito Hub
        </button>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'

const open = ref(false)
const menuRef = ref<HTMLElement | null>(null)
const router = useRouter()

function goToHome() {
  open.value = false
  router.push({ name: 'home' })
}

function goToChat() {
  open.value = false
  router.push({ name: 'chat' })
}

function goToJournal() {
  open.value = false
  router.push({ name: 'journal' })
}

function goToPersonas() {
  open.value = false
  router.push({ name: 'personas' })
}

function goToKalitoHub() {
  open.value = false
  router.push({ name: 'kalito-hub' })
}

function handleClickOutside(event: MouseEvent) {
  if (open.value && menuRef.value && !menuRef.value.contains(event.target as Node)) {
    open.value = false
  }
}
onMounted(() => document.addEventListener('click', handleClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', handleClickOutside))
</script>

<style scoped>
.hamburger-button {
  width: 35px;
  height: 35px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 6px;
  padding: 0;
  margin: 0;
  background: linear-gradient(145deg, #0d1117, #0a0e13);
  border: 1.7px solid #303851;
  border-radius: 0.6em;
  cursor: pointer;
  box-shadow:
    0 4px 20px 0 #11192875,
    0 2px 8px 0 #0002,
    0 0.5px 0 #c7dfff33 inset,
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  outline: none;
  position: relative;
  transition:
    background 0.3s ease,
    border 0.3s ease,
    box-shadow 0.3s ease,
    backdrop-filter 0.3s ease,
    transform 0.2s ease;
}

.hamburger-button::before {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: linear-gradient(45deg, transparent, rgba(95, 184, 184, 0.1), transparent);
  border-radius: 0.7em;
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: -1;
}

.hamburger-button:hover,
.hamburger-button:focus {
  background: linear-gradient(145deg, #1a2332, #0f1419);
  border-color: #3d9999;
  box-shadow:
    0 8px 28px 2px rgba(61, 153, 153, 0.2),
    0 2px 9px 0 #29366b55,
    0 0.5px 0 #b8e6e666 inset,
    0 0 15px rgba(61, 153, 153, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
  transform: translateY(-1px);
}

.hamburger-button:hover::before,
.hamburger-button:focus::before {
  opacity: 1;
}

.hamburger-button.open {
  background: rgba(8, 10, 14, 0.85);
  border: 1.5px solid rgba(61, 153, 153, 0.6);
  box-shadow:
    0 0 20px rgba(61, 153, 153, 0.4),
    0 0 40px rgba(61, 153, 153, 0.2),
    0 1.5px 10px 0 #10132332,
    0 0 0 1px rgba(61, 153, 153, 0.3),
    inset 0 1px 0 rgba(61, 153, 153, 0.2);
  backdrop-filter: blur(12px) saturate(180%);
  -webkit-backdrop-filter: blur(12px) saturate(180%);
  animation: neonPulse 2s ease-in-out infinite alternate;
}

@keyframes neonPulse {
  0% {
    box-shadow:
      0 0 20px rgba(61, 153, 153, 0.4),
      0 0 40px rgba(61, 153, 153, 0.2),
      0 1.5px 10px 0 #10132332,
      0 0 0 1px rgba(61, 153, 153, 0.3),
      inset 0 1px 0 rgba(61, 153, 153, 0.2);
  }
  100% {
    box-shadow:
      0 0 30px rgba(61, 153, 153, 0.6),
      0 0 60px rgba(61, 153, 153, 0.3),
      0 1.5px 10px 0 #10132332,
      0 0 0 1px rgba(61, 153, 153, 0.4),
      inset 0 1px 0 rgba(61, 153, 153, 0.3);
  }
}

.hamburger-button.open:hover,
.hamburger-button.open:focus {
  background: rgba(12, 14, 18, 0.9);
  border-color: rgba(61, 153, 153, 0.8);
  box-shadow:
    0 0 25px rgba(61, 153, 153, 0.6),
    0 0 50px rgba(61, 153, 153, 0.3),
    0 2px 12px 0 #10132344,
    0 0 0 1px rgba(61, 153, 153, 0.4),
    inset 0 1px 0 rgba(61, 153, 153, 0.3);
}

.hamburger-button span {
  width: 26px;
  height: 3px;
  background: linear-gradient(90deg, #b4c3cf, #d1e3f0);
  border-radius: 5px;
  transition:
    background 0.3s ease,
    transform 0.4s cubic-bezier(0.68, -0.6, 0.32, 1.6),
    opacity 0.3s ease,
    box-shadow 0.3s ease;
  box-shadow: 
    0 1.5px 6px #21232b44,
    0 0 8px rgba(180, 195, 207, 0.3);
  position: relative;
}

.hamburger-button:hover span {
  background: linear-gradient(90deg, #3d9999, #5fb8b8);
  box-shadow: 
    0 1.5px 6px #21232b44,
    0 0 12px rgba(61, 153, 153, 0.5);
}

.hamburger-button.open span:nth-child(1) {
  transform: translateY(7.5px) rotate(45deg);
  background: linear-gradient(90deg, #3d9999, #5fb8b8);
  box-shadow: 
    0 0 15px rgba(61, 153, 153, 0.6),
    0 0 30px rgba(61, 153, 153, 0.3);
}

.hamburger-button.open span:nth-child(2) {
  opacity: 0;
  transform: scaleX(0.6);
}

.hamburger-button.open span:nth-child(3) {
  transform: translateY(-7.5px) rotate(-45deg);
  background: linear-gradient(90deg, #3d9999, #5fb8b8);
  box-shadow: 
    0 0 15px rgba(61, 153, 153, 0.6),
    0 0 30px rgba(61, 153, 153, 0.3);
}

.hamburger-button span {
  opacity: 1;
  transform: none;
}

.hamburger-menu {
  position: absolute;
  top: 112%;
  left: 0;
  margin-top: 0.5rem;
  min-width: 200px;
  max-width: 450px;
  /* Enhanced glass/frosted style with teal accents */
  background: linear-gradient(145deg, 
    rgba(12, 14, 18, 0.671), 
    rgba(8, 10, 14, 0.5));
  border: 1.5px solid rgba(61, 153, 153, 0.3);
  border-radius: 1em;
  box-shadow:
    0 0 20px rgba(61, 153, 153, 0.2),
    0 6px 32px 0 rgba(0, 0, 0, 0.4),
    0 0 0 1.5px rgba(61, 153, 153, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    inset 0 -1px 0 rgba(61, 153, 153, 0.2);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  padding: .5em;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  z-index: 1001;
  font-family: var(--font-base);
  overflow: visible;
  position: relative;
  animation: menuGlow 3s ease-in-out infinite alternate;
}

@keyframes menuGlow {
  0% {
    box-shadow:
      0 0 20px rgba(61, 153, 153, 0.2),
      0 6px 32px 0 rgba(0, 0, 0, 0.4),
      0 0 0 1.5px rgba(61, 153, 153, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.1),
      inset 0 -1px 0 rgba(61, 153, 153, 0.2);
  }
  100% {
    box-shadow:
      0 0 30px rgba(61, 153, 153, 0.3),
      0 6px 32px 0 rgba(0, 0, 0, 0.4),
      0 0 0 1.5px rgba(61, 153, 153, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.15),
      inset 0 -1px 0 rgba(61, 153, 153, 0.3);
  }
}

.menu-item {
  width: 100%;
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.02), 
    rgba(61, 153, 153, 0.03));
  border: 1px solid rgba(61, 153, 153, 0.15);
  border-radius: 0.75rem;
  color: var(--color-text);
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 0.95rem;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  box-shadow: 
    0 2px 8px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.menu-item:hover {
  /* Even more dramatic gradient + glow on hover with teal */
  background: linear-gradient(135deg, 
    rgba(61, 153, 153, 0.1),
    rgba(95, 184, 184, 0.08));
  border-color: rgba(61, 153, 153, 0.4);
  color: var(--color-heading);
  transform: translateX(4px);
  box-shadow:
    0 0 25px rgba(61, 153, 153, 0.35),
    0 0 15px rgba(61, 153, 153, 0.2),
    0 4px 16px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    inset 0 0 20px rgba(61, 153, 153, 0.05);
  text-shadow: 0 0 8px rgba(61, 153, 153, 0.6);
}

.menu-item:active {
  transform: translateX(2px);
  box-shadow:
    0 0 15px rgba(61, 153, 153, 0.25),
    0 2px 8px rgba(0, 0, 0, 0.15);
}

.menu-icon {
  font-size: 1.1em;
  opacity: 0.9;
  transition: 
    opacity 0.3s ease,
    text-shadow 0.3s ease,
    transform 0.3s ease;
}

.menu-item:hover {
  background: linear-gradient(145deg, 
    rgba(35, 36, 43, 0.9), 
    rgba(28, 32, 40, 0.85));
  color: #3d9999;
  border-color: rgba(61, 153, 153, 0.6);
  box-shadow: 
    0 0 20px rgba(61, 153, 153, 0.4),
    0 3px 19px rgba(16, 23, 36, 0.6),
    0 0 0 1px rgba(61, 153, 153, 0.3),
    inset 0 1px 0 rgba(61, 153, 153, 0.2);
  transform: translateY(-3px) scale(1.05);
  text-shadow: 0 0 10px rgba(61, 153, 153, 0.5);
}

.menu-item:hover .menu-icon {
  opacity: 1;
  text-shadow: 0 0 15px rgba(61, 153, 153, 0.8);
  transform: scale(1.1);
}

.menu-item:active {
  background: linear-gradient(145deg, 
    rgba(22, 24, 26, 0.95), 
    rgba(16, 18, 22, 0.9));
  color: #5fb8b8;
  border-color: rgba(95, 184, 184, 0.8);
  transform: scale(0.98) translateY(-1px);
  box-shadow: 
    0 0 15px rgba(95, 184, 184, 0.6),
    0 1px 5px rgba(16, 23, 36, 0.4),
    0 0 0 1px rgba(95, 184, 184, 0.4),
    inset 0 2px 4px rgba(0, 0, 0, 0.3);
}

.menu-fade-enter-active,
.menu-fade-leave-active {
  transition:
    opacity 0.4s ease,
    transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94),
    filter 0.4s ease;
}

.menu-fade-enter-from,
.menu-fade-leave-to {
  opacity: 0;
  transform: translateY(-15px) scale(0.95);
  filter: blur(5px);
}

.menu-fade-enter-to,
.menu-fade-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1);
  filter: blur(0);
}
</style>
