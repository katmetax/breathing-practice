<template>
  <section class="history-page">
    <div class="history-panel">
      <header class="history-header">
        <h2 class="history-title">History</h2>
        <p class="history-subtitle">
          A gentle log of your past sessions — no streaks, no pressure.
        </p>
      </header>

      <div v-if="sessions.length === 0" class="empty-state">
        <p class="empty-text">
          You have not completed any sessions yet.
        </p>
        <RouterLink to="/" class="btn btn-primary">
          Start a first session
        </RouterLink>
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
            {{ session.presetId ? 'Preset-based session' : 'Custom session' }}
          </p>
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { historyService } from '../services/historyService';

const sessions = computed(() => historyService.listRecent(50));

function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes === 0) {
    return `${remainingSeconds} seconds`;
  }
  return `${minutes} min ${remainingSeconds.toString().padStart(2, '0')} sec`;
}
</script>

<style scoped>
.history-page {
  width: 100%;
  max-width: 700px;
}

.history-panel {
  background: rgba(15, 23, 42, 0.95);
  border-radius: 1.2rem;
  padding: 1.5rem;
  border: 1px solid rgba(148, 163, 184, 0.35);
  box-shadow:
    0 18px 60px rgba(15, 23, 42, 0.9),
    0 0 0 1px rgba(15, 23, 42, 0.6);
}

.history-header {
  margin-bottom: 1rem;
}

.history-title {
  font-size: 1.1rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #cbd5f5;
}

.history-subtitle {
  margin-top: 0.35rem;
  font-size: 0.9rem;
  color: #9ca3af;
}

.empty-state {
  padding: 1.25rem;
  border-radius: 0.9rem;
  border: 1px dashed rgba(148, 163, 184, 0.6);
  text-align: center;
}

.empty-text {
  margin-bottom: 0.75rem;
  color: #e5e7eb;
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
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.7);
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
  color: #e5e7eb;
}

.session-duration {
  font-size: 0.9rem;
  color: #bbf7d0;
  font-variant-numeric: tabular-nums;
}

.session-note {
  font-size: 0.8rem;
  color: #9ca3af;
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
  background: linear-gradient(135deg, #22c55e, #06b6d4);
  color: #020617;
}
</style>

