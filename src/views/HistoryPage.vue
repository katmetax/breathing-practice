<template>
  <section class="history-page">
    <div class="history-panel">
      <div class="glass-panel">
        <header class="history-header">
          <div class="history-titles">
            <h2 class="history-title">History</h2>
            <p class="history-subtitle">
              A gentle log of your past sessions — no streaks, no pressure.
            </p>
          </div>

          <div
            class="badge-base completed-sessions"
            v-if="totalNumberOfSessions > 0"
            title="Completed sessions"
          >
            <span class="number"><BreathIcon /> {{ totalNumberOfSessions }} </span>
            <div class="glow-effect"></div>
          </div>
        </header>

        <div v-if="sessions.length === 0" class="empty-state">
          <p class="empty-text">You have not completed any sessions yet.</p>
          <RouterLink to="/" class="btn btn-primary"> Start a first session </RouterLink>
        </div>

        <ul v-else class="session-list">
          <li v-for="session in sessions" :key="session.id" class="session-item">
            <div class="session-main">
              <p class="session-date">
                {{ formatDate(session.completedAt) }}
              </p>
              <p class="session-duration">
                {{ formatDuration(session.durationSeconds) }}
              </p>
            </div>
            <p class="session-note">
              {{ sessionLabel(session) }}
            </p>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { historyService } from '../services/historyService'
import BreathIcon from '~icons/material-symbols/air-rounded'

const sessions = computed(() => historyService.listRecent(50))
const totalNumberOfSessions = computed(() => historyService.listAll()?.length)

const sessionLabel = (session: { presetName?: string }) => session.presetName ?? 'Session'

function formatDate(iso: string): string {
  const date = new Date(iso)
  return date.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  if (minutes === 0) {
    return `${remainingSeconds} seconds`
  }
  return `${minutes} min ${remainingSeconds.toString().padStart(2, '0')} sec`
}
</script>

<style scoped>
.history-page {
  width: 100%;
  max-width: 700px;
}

.history-panel {
  border-radius: 1.2rem;
  padding: 1.5rem;
}

.glass-panel {
  min-width: 550px;
  padding: 1.5rem;

  /* The core glass effect */
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(50px);
  -webkit-backdrop-filter: blur(10px); /* Safari support */

  /* Border and Shadow for depth */
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 1.2rem;
  box-shadow: var(--shadow-panel);
}

@media screen and (max-width: 720px) {
  .history-panel {
    padding: 0;
  }

  .glass-panel {
    min-width: 200px;
  }
}

.history-titles {
  flex: 1;
}

.history-header {
  display: flex;
  margin-bottom: 1rem;
}

.history-title {
  font-size: 1.1rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-text-strong);
}

.history-subtitle {
  margin-top: 0.35rem;
  font-size: 0.9rem;
  color: var(--color-text-muted);
}

.empty-state {
  padding: 1.25rem;
  border-radius: 0.9rem;
  border: 1px dashed var(--color-border-dashed-soft);
  text-align: center;
}

.empty-text {
  margin-bottom: 0.75rem;
  color: var(--color-text-muted);
}

.badge-base {
  font-family: sans-serif;
}

.creative-wrapper {
  position: relative;
  display: inline-block;
  padding: 10px;
}

.completed-sessions {
  margin: 1rem 0.5rem 0;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 65px;
  height: 65px;
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(6px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 50%;
  overflow: hidden;
}

.number {
  display: flex;
  position: relative;
  z-index: 2;
  color: var(--color-text-soft);
  font-weight: 900;
  font-size: 17px;
  text-shadow: var(--shadow-text);
}

/* The colorful glow moving behind the glass */
.glow-effect {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: var(--gradient-breath-circle);
  opacity: 0.4;
  filter: blur(10px);
  transform: rotate(270deg);
}

.session-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.session-item {
  padding: 0.7rem 0.85rem;
  border-radius: 0.8rem;
  background: var(--color-surface-soft);
  display: flex;
  flex-direction: column;
}

.session-item p {
  margin: 0.5rem;
}

.session-main {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.session-date {
  font-size: 0.9rem;
  color: var(--color-text-main);
}

.session-duration {
  font-size: 0.9rem;
  color: var(--color-text-main);
  font-variant-numeric: tabular-nums;
}

.session-note {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}
</style>
