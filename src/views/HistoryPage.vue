<template>
  <section class="history-page">
    <header class="history-header">
      <div class="history-titles">
        <p class="page-label">HISTORY</p>
        <p class="history-subtitle">
          A gentle log of your past sessions — no streaks, no pressure.
        </p>
      </div>

      <div class="completed-sessions" v-if="totalNumberOfSessions > 0" title="Completed sessions">
        <span class="sessions-count"><BreathIcon /> {{ totalNumberOfSessions }}</span>
        <div class="glow-effect"></div>
      </div>
    </header>

    <div v-if="sessions.length === 0" class="empty-state">
      <div class="empty-icon-wrap" aria-hidden="true"><BreathIcon /></div>
      <div class="empty-text-group">
        <p class="empty-heading">No sessions yet</p>
        <p class="empty-text">Complete your first breathing practice to see your history here.</p>
      </div>
      <RouterLink to="/" class="btn btn-primary">Start a Session</RouterLink>
    </div>

    <template v-else>
      <div class="session-table-wrap">
        <div class="session-table-header">
          <span class="table-col-label">Preset</span>
          <span class="table-col-label">Duration</span>
          <span class="table-col-label">Date</span>
        </div>
        <ul class="session-list">
          <li
            v-for="(session, index) in sessions"
            :key="session.id"
            class="session-item"
            :class="{ 'session-item--stripe': index % 2 !== 0 }"
          >
            <div class="session-left">
              <div class="session-icon-wrap" aria-hidden="true"><BreathIcon /></div>
              <div class="session-info">
                <p class="session-preset-name">{{ sessionLabel(session) }}</p>
                <p class="session-date-mobile">{{ formatDate(session.completedAt) }}</p>
              </div>
            </div>
            <p class="session-duration-cell">
              {{
                session.roundsCompleted != null
                  ? formatRounds(session.roundsCompleted)
                  : formatDuration(session.durationSeconds)
              }}
            </p>
            <p class="session-date-desktop">{{ formatDate(session.completedAt) }}</p>
          </li>
        </ul>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { historyService } from '../services/historyService'
import BreathIcon from '~icons/material-symbols/air-rounded'

const route = useRoute()
const sessionItems = ref(historyService.listRecent(50))

const reloadSessions = () => {
  sessionItems.value = historyService.listRecent(50)
}

onMounted(reloadSessions)
watch(() => route.path, reloadSessions)

const sessions = computed(() => sessionItems.value)
const totalNumberOfSessions = computed(() => sessionItems.value.length)

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

function formatRounds(rounds: number): string {
  return `${rounds} ${rounds === 1 ? 'round' : 'rounds'}`
}

function formatDuration(seconds: number): string {
  return `${Math.floor(seconds / 60)} min`
}
</script>

<style scoped>
.history-page {
  width: 100%;
  max-width: 700px;
  padding: 0 0.5rem;
}

.history-header {
  display: flex;
  align-items: flex-start;
  margin-bottom: 1.5rem;
}

.history-titles {
  flex: 1;
}

.page-label {
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-primary);
  margin-bottom: 0.35rem;
}

.history-subtitle {
  font-size: 0.88rem;
  color: var(--color-text-muted);
  line-height: 1.5;
}

/* Sessions count badge */
.completed-sessions {
  margin: 0.1rem 0 0 0.75rem;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(6px);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.sessions-count {
  display: flex;
  align-items: center;
  gap: 2px;
  position: relative;
  z-index: 2;
  color: var(--color-text-strong);
  font-weight: 700;
  font-size: 14px;
}

.glow-effect {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: var(--gradient-breath-circle);
  opacity: 0.5;
  filter: blur(10px);
  transform: rotate(270deg);
}

/* Empty state */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 3rem 1rem;
  gap: 1.1rem;
}

.empty-icon-wrap {
  font-size: 4rem;
  opacity: 0.2;
  color: var(--color-primary);
  line-height: 1;
}

.empty-text-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.empty-heading {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-text-main);
  margin: 0;
}

.empty-text {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  line-height: 1.65;
  max-width: 280px;
  margin: 0;
}

/* Session table */
.session-table-wrap {
  border-radius: 0.9rem;
  overflow: hidden;
}

.session-table-header {
  display: none;
}

.session-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

/* Mobile: flex row */
.session-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.8rem 0.6rem;
  border-bottom: 1px solid var(--color-card-border);
}

.session-item:last-child {
  border-bottom: none;
}

.session-item--stripe {
  background: var(--color-stripe);
}

.session-left {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  flex: 1;
  min-width: 0;
}

.session-icon-wrap {
  width: 36px;
  height: 36px;
  border-radius: 9px;
  background: color-mix(in srgb, var(--color-primary) 14%, transparent);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 1.1rem;
  color: var(--color-primary);
}

.session-info {
  min-width: 0;
}

.session-preset-name {
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--color-text-main);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.session-date-mobile {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin: 0.15rem 0 0;
}

.session-duration-cell {
  font-size: 0.88rem;
  font-weight: 500;
  color: var(--color-primary);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  margin: 0;
  flex-shrink: 0;
}

.session-date-desktop {
  display: none;
}

/* Desktop: grid table */
@media screen and (min-width: 600px) {
  .session-table-wrap {
    background: var(--color-card-surface);
    border: 1px solid var(--color-card-border);
  }

  .session-table-header {
    display: grid;
    grid-template-columns: 1fr 160px 200px;
    padding: 0.55rem 1.1rem;
    border-bottom: 1px solid var(--color-card-border);
  }

  .table-col-label {
    font-size: 0.62rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.16em;
    color: var(--color-text-muted);
  }

  .session-item {
    display: grid;
    grid-template-columns: 1fr 160px 200px;
    align-items: center;
    padding: 0.85rem 1.1rem;
    gap: 0;
    border-radius: 0;
  }

  .session-item--stripe {
    border-radius: 0;
  }

  .session-date-mobile {
    display: none;
  }

  .session-date-desktop {
    display: block;
    font-size: 0.82rem;
    color: var(--color-text-muted);
    margin: 0;
  }
}
</style>
