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
        <button class="menu-item" @click="goToChat">Chat</button>
        <button class="menu-item" @click="goToPersonas">
          <span class="menu-icon">👤</span>
          Personas
        </button>
        <button class="menu-item" @click="goToAbout">
          <span class="menu-icon">ℹ️</span>
          About
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

function goToPersonas() {
  open.value = false
  router.push({ name: 'personas' })
}

function goToAbout() {
  open.value = false
  router.push({ name: 'about' })
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
  width: 50px;
  height: 50px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 9px;
  padding: 0;
  margin: 0;
  background: linear-gradient(145deg, #0d1117, #0a0e13);
  border: 1.7px solid #303851;
  border-radius: 0.7em;
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
  background: linear-gradient(45deg, transparent, rgba(143, 216, 252, 0.1), transparent);
  border-radius: 0.8em;
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: -1;
}

.hamburger-button:hover,
.hamburger-button:focus {
  background: linear-gradient(145deg, #1a2332, #0f1419);
  border-color: #4a9eff;
  box-shadow:
    0 8px 28px 2px rgba(74, 158, 255, 0.2),
    0 2px 9px 0 #29366b55,
    0 0.5px 0 #dbefff66 inset,
    0 0 15px rgba(74, 158, 255, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
  transform: translateY(-1px);
}

.hamburger-button:hover::before,
.hamburger-button:focus::before {
  opacity: 1;
}

.hamburger-button.open {
  background: rgba(8, 10, 14, 0.85);
  border: 1.5px solid rgba(74, 158, 255, 0.6);
  box-shadow:
    0 0 20px rgba(74, 158, 255, 0.4),
    0 0 40px rgba(74, 158, 255, 0.2),
    0 1.5px 10px 0 #10132332,
    0 0 0 1px rgba(74, 158, 255, 0.3),
    inset 0 1px 0 rgba(74, 158, 255, 0.2);
  backdrop-filter: blur(12px) saturate(180%);
  -webkit-backdrop-filter: blur(12px) saturate(180%);
  animation: neonPulse 2s ease-in-out infinite alternate;
}

@keyframes neonPulse {
  0% {
    box-shadow:
      0 0 20px rgba(74, 158, 255, 0.4),
      0 0 40px rgba(74, 158, 255, 0.2),
      0 1.5px 10px 0 #10132332,
      0 0 0 1px rgba(74, 158, 255, 0.3),
      inset 0 1px 0 rgba(74, 158, 255, 0.2);
  }
  100% {
    box-shadow:
      0 0 30px rgba(74, 158, 255, 0.6),
      0 0 60px rgba(74, 158, 255, 0.3),
      0 1.5px 10px 0 #10132332,
      0 0 0 1px rgba(74, 158, 255, 0.4),
      inset 0 1px 0 rgba(74, 158, 255, 0.3);
  }
}

.hamburger-button.open:hover,
.hamburger-button.open:focus {
  background: rgba(12, 14, 18, 0.9);
  border-color: rgba(74, 158, 255, 0.8);
  box-shadow:
    0 0 25px rgba(74, 158, 255, 0.6),
    0 0 50px rgba(74, 158, 255, 0.3),
    0 2px 12px 0 #10132344,
    0 0 0 1px rgba(74, 158, 255, 0.4),
    inset 0 1px 0 rgba(74, 158, 255, 0.3);
}

.hamburger-button span {
  width: 37px;
  height: 4.3px;
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
  background: linear-gradient(90deg, #4a9eff, #74c7ff);
  box-shadow: 
    0 1.5px 6px #21232b44,
    0 0 12px rgba(74, 158, 255, 0.5);
}

.hamburger-button.open span:nth-child(1) {
  transform: translateY(11px) rotate(45deg);
  background: linear-gradient(90deg, #4a9eff, #74c7ff);
  box-shadow: 
    0 0 15px rgba(74, 158, 255, 0.6),
    0 0 30px rgba(74, 158, 255, 0.3);
}

.hamburger-button.open span:nth-child(2) {
  opacity: 0;
  transform: scaleX(0.6);
}

.hamburger-button.open span:nth-child(3) {
  transform: translateY(-11px) rotate(-45deg);
  background: linear-gradient(90deg, #4a9eff, #74c7ff);
  box-shadow: 
    0 0 15px rgba(74, 158, 255, 0.6),
    0 0 30px rgba(74, 158, 255, 0.3);
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
  /* Enhanced glass/frosted style with neon accents */
  background: linear-gradient(145deg, 
    rgba(12, 14, 18, 0.671), 
    rgba(8, 10, 14, 0.5));
  border: 1.5px solid rgba(74, 158, 255, 0.3);
  border-radius: 1em;
  box-shadow:
    0 0 20px rgba(74, 158, 255, 0.2),
    0 6px 32px 0 rgba(0, 0, 0, 0.4),
    0 0 0 1.5px rgba(74, 158, 255, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    inset 0 -1px 0 rgba(74, 158, 255, 0.2);
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
      0 0 20px rgba(74, 158, 255, 0.2),
      0 6px 32px 0 rgba(0, 0, 0, 0.4),
      0 0 0 1.5px rgba(74, 158, 255, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.1),
      inset 0 -1px 0 rgba(74, 158, 255, 0.2);
  }
  100% {
    box-shadow:
      0 0 30px rgba(74, 158, 255, 0.3),
      0 6px 32px 0 rgba(0, 0, 0, 0.4),
      0 0 0 1.5px rgba(74, 158, 255, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.15),
      inset 0 -1px 0 rgba(74, 158, 255, 0.3);
  }
}

.menu-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: linear-gradient(145deg, 
    rgba(8, 10, 14, 0.85), 
    rgba(12, 16, 20, 0.75));
  border: 1.5px solid rgba(66, 72, 110, 0.4);
  border-radius: 0.6em;
  box-shadow:
    0 1.5px 10px 0 rgba(16, 19, 35, 0.4),
    0 0 0 1px rgba(58, 65, 101, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px) saturate(150%);
  -webkit-backdrop-filter: blur(10px) saturate(150%);
  padding: 1rem 0.8rem;
  font-family: var(--font-base);
  font-size: 1.1rem;
  color: #a6d3f7;
  text-align: center;
  cursor: pointer;
  width: 95%;
  font-weight: 400;
  position: relative;
  overflow: hidden;
  transition:
    background 0.3s ease,
    color 0.3s ease,
    border-color 0.3s ease,
    box-shadow 0.3s ease,
    transform 0.25s ease;
}

.menu-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, 
    transparent, 
    rgba(74, 158, 255, 0.1), 
    transparent);
  transition: left 0.5s ease;
}

.menu-item:hover::before {
  left: 100%;
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
  color: #4a9eff;
  border-color: rgba(74, 158, 255, 0.6);
  box-shadow: 
    0 0 20px rgba(74, 158, 255, 0.4),
    0 3px 19px rgba(16, 23, 36, 0.6),
    0 0 0 1px rgba(74, 158, 255, 0.3),
    inset 0 1px 0 rgba(74, 158, 255, 0.2);
  transform: translateY(-3px) scale(1.05);
  text-shadow: 0 0 10px rgba(74, 158, 255, 0.5);
}

.menu-item:hover .menu-icon {
  opacity: 1;
  text-shadow: 0 0 15px rgba(74, 158, 255, 0.8);
  transform: scale(1.1);
}

.menu-item:active {
  background: linear-gradient(145deg, 
    rgba(22, 24, 26, 0.95), 
    rgba(16, 18, 22, 0.9));
  color: #74c7ff;
  border-color: rgba(116, 199, 255, 0.8);
  transform: scale(0.98) translateY(-1px);
  box-shadow: 
    0 0 15px rgba(116, 199, 255, 0.6),
    0 1px 5px rgba(16, 23, 36, 0.4),
    0 0 0 1px rgba(116, 199, 255, 0.4),
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
