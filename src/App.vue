<template>
  <div class="app-root">
    <header class="app-header">
      <a href="/" class="app-logo-link" @click.prevent="router.push('/')" aria-label="Home">
        <svg class="app-logo" viewBox="-120 -120 240 240" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <clipPath id="logo-diagonal-clip">
              <polygon points="-160,-120 -120,90 90,190" />
            </clipPath>
            <clipPath id="logo-diagonal-inner-clip">
              <polygon points="-120,0 120,0 120,120 -120,120" />
            </clipPath>
          </defs>
          <path
            class="logo-blob"
            clip-path="url(#logo-diagonal-clip)"
            d="M 68.49524956368963,0 C 66.43247209477671,33.20740357502506 61.3111903929552,42.00348902386601 34.21905184843267,59.269136388319076 C 7.12691330391014,76.53478375277214 -10.450868727355978,83.87987355489201 -39.873304614400496,69.06258945781225 C -69.29574050144501,54.24530536073249 -83.35640146463219,34.72925122293119 -83.4706916997454,1.0222211541270874e-14 C -83.58498193485862,-34.729251222931175 -71.81567891081079,-51.46429595596719 -40.33046555485337,-69.85441543391248 C -8.845252198895942,-88.24453491185777 15.263732944448549,-91.02408177025929 42.4701617240843,-73.56047791178116 C 69.67659050372005,-56.09687405330304 70.55802703260254,-33.20740357502506 68.49524956368963,0 Z"
          />
          <path
            class="logo-blob logo-blob--inner"
            clip-path="url(#logo-diagonal-inner-clip)"
            transform="scale(0.52) rotate(25)"
            d="M 68.49524956368963,0 C 66.43247209477671,33.20740357502506 61.3111903929552,42.00348902386601 34.21905184843267,59.269136388319076 C 7.12691330391014,76.53478375277214 -10.450868727355978,83.87987355489201 -39.873304614400496,69.06258945781225 C -69.29574050144501,54.24530536073249 -83.35640146463219,34.72925122293119 -83.4706916997454,1.0222211541270874e-14 C -83.58498193485862,-34.729251222931175 -71.81567891081079,-51.46429595596719 -40.33046555485337,-69.85441543391248 C -8.845252198895942,-88.24453491185777 15.263732944448549,-91.02408177025929 42.4701617240843,-73.56047791178116 C 69.67659050372005,-56.09687405330304 70.55802703260254,-33.20740357502506 68.49524956368963,0 Z"
          />
        </svg>
      </a>
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
        <button
          class="nav-link nav-link--button"
          type="button"
          :aria-label="themeButtonLabel"
          :title="themeButtonLabel"
          @click="onThemeClick"
        >
          <AutoModeIcon v-if="preference === 'system'" />
          <LightModeIcon v-else-if="preference === 'light'" />
          <DarkModeIcon v-else />
        </button>
      </nav>
    </header>

    <main class="app-main">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia"
import { computed } from "vue"
import { useRoute, useRouter } from "vue-router"
import { useThemeStore } from "./stores/theme"
import AutoModeIcon from "~icons/material-symbols/brightness-4-rounded"
import DarkModeIcon from "~icons/material-symbols/dark-mode-outline-rounded"
import LightModeIcon from "~icons/material-symbols/light-mode-outline-rounded"
import HistoryIcon from "~icons/material-symbols/history-rounded"
import SettingsIcon from "~icons/material-symbols/settings-outline-rounded"

const router = useRouter()
const route = useRoute()
const themeStore = useThemeStore()
const { preference, resolvedTheme } = storeToRefs(themeStore)

const themeButtonLabel = computed(() => {
  if (preference.value === "system") {
    return `Theme: System (${resolvedTheme.value}). Click to switch to Light.`
  }
  if (preference.value === "light") {
    return "Theme: Light. Click to switch to Dark."
  }
  return "Theme: Dark. Click to switch to System."
})

function onHistoryClick() {
  router.push(route.path === "/history" ? "/" : "/history")
}

function onSettingsClick() {
  router.push(route.path === "/settings" ? "/" : "/settings")
}

function onThemeClick() {
  themeStore.cycleThemePreference()
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
    "SF Pro Text",
    "Segoe UI",
    sans-serif;
}

@media screen and (max-width: 490px) {
  .app-root {
    min-height: auto;
  }
}

.app-header {
  padding: 1.25rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  backdrop-filter: blur(12px);
}

.app-logo-link {
  display: flex;
  align-items: center;
  text-decoration: none;
}

.app-logo {
  width: 62px;
  height: 62px;
}

.logo-blob {
  fill: none;
  stroke: var(--gradient-breath-start);
  stroke-width: 8;
}

.logo-blob--inner {
  opacity: 0.5;
  stroke: var(--gradient-breath-end);
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

.nav-link--button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font: inherit;
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
