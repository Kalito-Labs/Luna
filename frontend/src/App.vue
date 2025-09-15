<template>
  <div class="kalito-root">
    <main class="kalito-shell">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
// (optional: custom logic)
</script>

<style scoped>
.kalito-root {
  display: flex;
  flex-direction: column;
  width: 100vw;
  height: 100vh;
  min-height: 100vh;
  background: var(--bg-main);
  color: var(--text-main);
  position: relative;
  overflow: hidden;
  margin: 0;
  padding: 0;
}

.kalito-shell {
  flex: 1;
  width: 100%;
  height: 100%;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  background: var(--bg-main);
}
</style>
