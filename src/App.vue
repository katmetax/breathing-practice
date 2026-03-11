<template>
  <div class="app-root">
    <header class="app-header">
      <h1 class="app-title">Breathing Practice</h1>
      <nav class="app-nav">
        <a
          class="nav-link"
          :class="{ 'nav-link--active': route.path === '/settings' }"
          @click.prevent="onSettingsClick"
        >
          <SettingsIcon />
        </a>
        <a
          class="nav-link"
          :class="{ 'nav-link--active': route.path === '/history' }"
          @click.prevent="onHistoryClick"
        >
          <HistoryIcon />
        </a>
      </nav>
    </header>

    <main class="app-main">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import HistoryIcon from '~icons/material-symbols/history-rounded'
import SettingsIcon from '~icons/material-symbols/settings-outline-rounded'
import { useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route = useRoute()

const onHistoryClick = () => {
  router.push(route.path === '/history' ? '/' : '/history')
}

const onSettingsClick = () => {
  router.push(route.path === '/settings' ? '/' : '/settings')
}
</script>

<style scoped>
.app-root {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: radial-gradient(circle at top, #1e293b, #020617);
  color: #f9fafb;
  font-family:
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    'SF Pro Text',
    'Segoe UI',
    sans-serif;
}

.app-header {
  padding: 1.25rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(148, 163, 184, 0.4);
  backdrop-filter: blur(12px);
  background: linear-gradient(to bottom, rgba(15, 23, 42, 0.9), rgba(15, 23, 42, 0.6));
}

.app-title {
  font-size: 1.2rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #e5e7eb;
}

.app-nav {
  display: flex;
  gap: 0.75rem;
}

.nav-link {
  cursor: pointer;
  padding: 0.4rem 0.9rem;
  border-radius: 999px;
  font-size: 0.9rem;
  text-decoration: none;
  color: #cbd5f5;
  border: 1px solid transparent;
  transition:
    background-color 160ms ease,
    color 160ms ease,
    border-color 160ms ease;
}

.nav-link:hover {
  background-color: rgba(148, 163, 184, 0.15);
}

.nav-link--active {
  background: linear-gradient(135deg, #22c55e, #06b6d4);
  color: #020617;
  border-color: rgba(34, 197, 94, 0.2);
}

.app-main {
  flex: 1;
  display: flex;
  justify-content: center;
  padding: 1.5rem;
}
</style>
