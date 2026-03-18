<template>
  <section class="history-page">
    <div class="history-panel">
      <header class="history-header">
        <h2 class="history-title">History</h2>
        <p class="history-subtitle">
          A gentle log of your past sessions — no streaks, no pressure.
        </p>
        <span v-if="totalNumberOfSessions > 0">
          {{ totalNumberOfSessions }} completed sessions
        </span>
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
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { historyService } from '../services/historyService'
import { presetManager } from '../services/presetManager'

const sessions = computed(() => historyService.listRecent(50))
const totalNumberOfSessions = computed(() => historyService.listAll()?.length)

function sessionLabel(session: { presetId: string | null; presetName?: string | null }): string {
  if (!session.presetId) return 'Custom session'
  if (session.presetName) return session.presetName
  const preset = presetManager.getById(session.presetId)
  return preset?.name ?? 'Preset-based session'
}

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
  background: var(--color-surface-panel-strong);
  border-radius: 1.2rem;
  padding: 1.5rem;
  border: 1px solid var(--color-border-soft);
  box-shadow: var(--shadow-panel);
}

.history-header {
  margin-bottom: 1rem;
}

.history-title {
  font-size: 1.1rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-text-soft);
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
  color: var(--color-text-strong);
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
  border: 1px solid var(--color-border-strong);
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.session-main {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.session-date {
  font-size: 0.9rem;
  color: var(--color-text-strong);
}

.session-duration {
  font-size: 0.9rem;
  color: var(--color-success-soft);
  font-variant-numeric: tabular-nums;
}

.session-note {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  padding: 0.45rem 1rem;
  font-size: 0.9rem;
  border: none;
  cursor: pointer;
}

.btn-primary {
  background: var(--gradient-primary);
  color: var(--color-text-on-primary);
}
</style>
