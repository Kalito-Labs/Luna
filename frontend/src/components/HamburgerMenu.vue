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
        <button class="menu-item" @click="goToKalitoHub">
          <span class="menu-icon">🏥</span>
          Kalito Hub
        </button>
        <button class="menu-item" @click="goToJournal">
          <span class="menu-icon">📓</span>
          Journal
        </button>
        <button class="menu-item" @click="goToLibrary">
          <span class="menu-icon">📚</span>
          Library
        </button>
        <button class="menu-item" @click="goToPersonas">
          <span class="menu-icon">👤</span>
          Personas
        </button>
        <button class="menu-item" @click="goToChat">
          <span class="menu-icon">🤖</span>
          Luna AI
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

function goToLibrary() {
  open.value = false
  router.push({ name: 'library' })
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
.hamburger-container {
  position: relative;
  display: inline-block;
  z-index: 2000;
}

.hamburger-button {
  width: 40px;
  height: 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 5px;
  padding: 0;
  margin: 0;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 16px;
  cursor: pointer;
  backdrop-filter: blur(20px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  outline: none;
  position: relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.hamburger-button:hover,
.hamburger-button:focus {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(139, 92, 246, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(139, 92, 246, 0.25);
}

.hamburger-button.open {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(139, 92, 246, 0.3);
  box-shadow: 0 4px 20px rgba(139, 92, 246, 0.25);
}

.hamburger-button.open:hover,
.hamburger-button.open:focus {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(139, 92, 246, 0.4);
  box-shadow: 0 8px 30px rgba(139, 92, 246, 0.3);
}

.hamburger-button span {
  width: 24px;
  height: 2.5px;
  background: linear-gradient(90deg, 
    rgba(255, 255, 255, 0.9), 
    rgba(196, 181, 253, 0.8));
  border-radius: 4px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.hamburger-button:hover span {
  background: linear-gradient(90deg, 
    rgba(196, 181, 253, 0.9), 
    rgba(196, 181, 253, 1));
}

.hamburger-button.open span:nth-child(1) {
  transform: translateY(7.5px) rotate(45deg);
  background: linear-gradient(90deg, 
    rgba(196, 181, 253, 0.9), 
    rgba(196, 181, 253, 1));
}

.hamburger-button.open span:nth-child(2) {
  opacity: 0;
  transform: scaleX(0);
}

.hamburger-button.open span:nth-child(3) {
  transform: translateY(-7.5px) rotate(-45deg);
  background: linear-gradient(90deg, 
    rgba(196, 181, 253, 0.9), 
    rgba(196, 181, 253, 1));
}

.hamburger-menu {
  position: absolute;
  top: calc(100% + 0.75rem);
  left: 0;
  min-width: 220px;
  background: rgba(44, 45, 54, 0.979);
  backdrop-filter: blur(30px);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 20px;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.2);
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  z-index: 2001;
}

.menu-item {
  width: 100%;
  padding: 0.875rem 1rem;
  background: rgba(36, 38, 39, 0.89);
  border: 1px solid rgba(139, 92, 246, 0.15);
  border-radius: 16px;
  color: rgba(255, 255, 255, 0.85);
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 0.95rem;
  font-weight: 500;
}

.menu-item:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(139, 92, 246, 0.3);
  color: rgba(255, 255, 255, 1);
  transform: translateX(4px);
  box-shadow: 0 4px 20px rgba(139, 92, 246, 0.25);
}

.menu-item:active {
  transform: translateX(2px);
  box-shadow: 0 2px 10px rgba(139, 92, 246, 0.2);
}

.menu-icon {
  font-size: 1.1em;
  opacity: 0.9;
  transition: all 0.3s ease;
}

.menu-item:hover .menu-icon {
  opacity: 1;
  transform: scale(1.1);
}

.menu-fade-enter-active,
.menu-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.menu-fade-enter-from,
.menu-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}

.menu-fade-enter-to,
.menu-fade-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1);
}
</style>
