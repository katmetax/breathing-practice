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
  background: var(--color-app-root-bg);
  color: var(--color-text-main);
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
  backdrop-filter: blur(12px);
}

.app-title {
  font-size: 1.2rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-text-strong);
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
  color: var(--color-nav-link);
  border: 1px solid transparent;
  transition:
    background-color 160ms ease,
    color 160ms ease,
    border-color 160ms ease;
}

.nav-link:hover {
  background-color: var(--color-nav-link-hover-bg);
}

.nav-link--active {
  background: var(--gradient-nav-pill-active);
  color: var(--color-text-on-primary);
  border-color: rgba(34, 197, 94, 0.2);
}

.app-main {
  display: flex;
  justify-content: center;
  padding: 1.5rem;
}
</style>
