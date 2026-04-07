<template>
  <section class="timer-page">
    <div>
      <div>
        <section class="session-visual">
          <p class="breath-phase-label">
            {{ isCountingDown ? `Starting in ${countdownRemaining}…` : phaseLabel }}
          </p>

          <div
            class="breath-circle"
            :class="['breath-circle--' + currentPhase]"
            :style="{ '--phase-progress': phaseProgress }"
            aria-live="polite"
          >
            <div class="breath-progress" aria-hidden="true"></div>

            <!--
              Debug-only literal timer. Kept for development but hidden in the UI.
            <p class="breath-timer-label">
              {{ formattedElapsed }}
            </p>
            -->
          </div>
          <p class="session-meta">
            <span v-if="isRunning" class="muted">
              Round {{ currentRound }} •
              {{ mode === 'rounds' ? `${rounds} total` : 'duration mode' }}
            </span>
            <span v-else-if="sessionComplete">
              Session complete —
              {{ lastDurationDisplay }}
            </span>
            <span v-else class="muted">
              When you start, this circle will guide your breath phases.
            </span>
          </p>

          <span v-if="selectedPreset" class="muted preset-name">
            Preset: {{ selectedPreset.name }}
          </span>

          <button
            v-if="isRunning || isCountingDown"
            class="btn btn-ghost"
            type="button"
            @click="handleStop"
          >
            Stop session
          </button>
        </section>

        <form
          class="form form--session"
          @submit.prevent="handleStart"
          v-if="!isRunning && !isCountingDown"
        >
          <div class="session-settings">
            <fieldset class="fieldset">
              <legend class="fieldset-legend">Session Mode</legend>
              <div class="mode-toggle" :class="`is-${mode}`">
                <div class="mode-slider"></div>

                <button
                  class="mode-pill"
                  type="button"
                  :class="{ 'mode-pill--active': mode === 'duration' }"
                  @click="mode = 'duration'"
                >
                  Duration
                </button>
                <button
                  class="mode-pill"
                  type="button"
                  :class="{ 'mode-pill--active': mode === 'rounds' }"
                  @click="mode = 'rounds'"
                >
                  Rounds
                </button>
              </div>

              <div v-if="mode === 'rounds'" class="field">
                <span class="field-label">Number of rounds</span>

                <div class="slider-wrapper">
                  <div class="display">
                    <span class="time-value">{{ rounds }}</span>
                    <span class="unit">RND</span>
                  </div>

                  <input
                    type="range"
                    v-model.number="rounds"
                    min="1"
                    max="60"
                    step="1"
                    class="transparent-slider"
                  />

                  <div class="range-labels">
                    <span>1 RND</span>
                    <span>60 RND</span>
                  </div>
                </div>
              </div>

              <div v-else class="field">
                <span class="field-label">Duration (minutes)</span>

                <div class="slider-wrapper">
                  <div class="display">
                    <span class="time-value">{{ durationMinutes }}</span>
                    <span class="unit">MIN</span>
                  </div>

                  <input
                    type="range"
                    v-model.number="durationMinutes"
                    min="1"
                    max="30"
                    step="1"
                    class="transparent-slider"
                  />

                  <div class="range-labels">
                    <span>1 MIN</span>
                    <span>30 MIN</span>
                  </div>
                </div>
              </div>
            </fieldset>

            <button
              class="btn btn-primary"
              type="submit"
              :disabled="!canStart || isRunning || isCountingDown"
            >
              <span>Start</span>
            </button>
            <p v-if="startError" class="field-error">
              {{ startError }}
            </p>
          </div>
        </form>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { presetManager } from '../services/presetManager'
import { timerEngine } from '../services/timerEngine'
import { audioController } from '../services/audioController'
import { historyService } from '../services/historyService'
import type { BreathPreset, SessionMode } from '../types/breathing'
import { useSessionConfigStore } from '../stores/sessionConfig'

const saveSuccess = ref('')

const mode = ref<SessionMode>('duration')
const rounds = ref(10)
const durationMinutes = ref<number>(5)

const startError = ref('')

const presets = ref<BreathPreset[]>(presetManager.list())
const sessionConfigStore = useSessionConfigStore()
const { selectedPresetId } = storeToRefs(sessionConfigStore)

const isRunning = ref(false)
const sessionComplete = ref(false)
const isCountingDown = ref(false)
const countdownRemaining = ref(0)
const currentPhase = ref<'inhale' | 'hold_in' | 'exhale' | 'hold_out' | ''>('')
const currentRound = ref(1)
const elapsedTotal = ref(0)
const elapsedPhase = ref(0)
const currentPhaseDuration = ref(1)
const lastDurationSec = ref<number | null>(null)
const selectedPreset = ref(
  (selectedPresetId.value && presets.value.find((p) => p.id === selectedPresetId.value)) ||
    presets.value[0],
)

let countdownTimer: number | null = null

const canStart = computed(() => {
  if (!selectedPresetId.value) return false
  if (mode.value === 'rounds') return rounds.value > 0
  return durationMinutes.value > 0
})

const phaseLabel = computed(() => {
  switch (currentPhase.value) {
    case 'inhale':
      return 'Inhale'
    case 'hold_in':
      return 'Hold'
    case 'exhale':
      return 'Exhale'
    case 'hold_out':
      return 'Hold (empty)'
    default:
      return ''
  }
})

const formattedElapsed = computed(() => {
  // Show total elapsed with sub-second precision so fractional phase
  // durations (e.g. 8.2s) are visible during the session.
  const seconds = elapsedTotal.value
  if (!Number.isFinite(seconds) || seconds < 0) return '0.0s'
  return `${seconds.toFixed(1)}s`
})

const phaseProgress = computed(() => {
  const total = currentPhaseDuration.value
  if (!Number.isFinite(total) || total <= 0) return 0
  const ratio = elapsedPhase.value / total
  if (!Number.isFinite(ratio)) return 0
  return Math.max(0, Math.min(1, ratio))
})

const lastDurationDisplay = computed(() => {
  if (lastDurationSec.value == null) return ''
  const minutes = Math.floor(lastDurationSec.value / 60)
  const seconds = lastDurationSec.value % 60
  if (minutes === 0) {
    return `${seconds} seconds`
  }
  return `${minutes} min ${seconds.toString().padStart(2, '0')} sec`
})

watch(
  () => presetManager.list(),
  (next) => {
    presets.value = next
  },
)

function reloadPresets() {
  presets.value = presetManager.list()
  if (!selectedPresetId.value && presets.value.length > 0) {
    const firstPreset = presets.value[0]
    if (firstPreset) {
      sessionConfigStore.setSelectedPresetId(firstPreset.id)
    }
  }
}

reloadPresets()

function cancelCountdown() {
  if (countdownTimer != null) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
  isCountingDown.value = false
  countdownRemaining.value = 0
}

function beginSession(
  preset: BreathPreset,
  phases: { phase: BreathPreset['phaseOrder'][number]; durationSec: number }[],
  totalDurationSec: number | undefined,
) {
  const firstPhase = phases[0]
  if (!firstPhase) {
    startError.value = 'Unable to start: missing first phase.'
    return
  }

  sessionComplete.value = false
  lastDurationSec.value = null
  currentPhase.value = firstPhase.phase
  currentRound.value = 1
  elapsedTotal.value = 0
  elapsedPhase.value = 0
  currentPhaseDuration.value = firstPhase.durationSec

  timerEngine.init(
    {
      phases,
      rounds: mode.value === 'rounds' ? Math.round(rounds.value) : Number.MAX_SAFE_INTEGER,
      mode: mode.value,
      totalDurationSec,
    },
    {
      onPhaseChange(state) {
        currentPhase.value = state.currentPhase ?? 'inhale'
        currentRound.value = state.currentRound
        elapsedPhase.value = state.currentPhaseElapsed
        elapsedTotal.value = state.totalElapsed
        const nextPhaseConfig = phases.find((p) => p.phase === state.currentPhase)
        if (nextPhaseConfig) {
          currentPhaseDuration.value = nextPhaseConfig.durationSec
        }
        audioController.playPhaseTone()
      },
      onTick(state) {
        elapsedPhase.value = state.currentPhaseElapsed
        elapsedTotal.value = state.totalElapsed
      },
      onComplete(state) {
        isRunning.value = false
        sessionComplete.value = true
        currentPhase.value = ''
        lastDurationSec.value = Math.round(state.totalElapsed)
        audioController.playCompletionTone()

        historyService.add({
          presetId: preset.id,
          presetName: preset.name,
          durationSeconds: Math.round(state.totalElapsed),
        })
      },
    },
  )

  timerEngine.start()
  isRunning.value = true
  audioController.playPhaseTone()
}

function handleStart() {
  cancelCountdown()

  startError.value = ''
  saveSuccess.value = ''

  const preset =
    selectedPresetId.value && presets.value.find((p) => p.id === selectedPresetId.value)
  if (!preset) {
    startError.value = 'Please choose a preset before starting.'
    return
  }

  if (mode.value === 'rounds') {
    if (!rounds.value || rounds.value <= 0) {
      startError.value = 'Please choose at least one round.'
      return
    }
  } else if (!durationMinutes.value || durationMinutes.value <= 0) {
    startError.value = 'Please choose a positive duration.'
    return
  }

  const phases = [
    { phase: 'inhale' as const, durationSec: preset.inhaleSec },
    { phase: 'hold_in' as const, durationSec: preset.holdInSec },
    { phase: 'exhale' as const, durationSec: preset.exhaleSec },
    { phase: 'hold_out' as const, durationSec: preset.holdOutSec },
  ].filter((p) => p.durationSec > 0)

  if (phases.length === 0) {
    startError.value = 'Preset has no non-zero phases. Please adjust the pattern.'
    return
  }

  const totalDurationSec =
    mode.value === 'duration' ? Math.round(durationMinutes.value * 60) : undefined

  isCountingDown.value = true
  countdownRemaining.value = 3
  countdownTimer = window.setInterval(() => {
    if (countdownRemaining.value <= 1) {
      cancelCountdown()
      beginSession(preset, phases, totalDurationSec)
    } else {
      countdownRemaining.value -= 1
    }
  }, 1000)
}

function handleStop() {
  cancelCountdown()
  timerEngine.stop()
  isRunning.value = false
  sessionComplete.value = false
  lastDurationSec.value = null
  currentPhase.value = ''
  currentRound.value = 1
  elapsedTotal.value = 0
  elapsedPhase.value = 0
  currentPhaseDuration.value = 1
}

onBeforeUnmount(() => {
  cancelCountdown()
  timerEngine.stop()
})
</script>

<style scoped>
.timer-page {
  width: 100%;
  max-width: 1100px;
}

.timer-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
  gap: 1.5rem;
}

@media (max-width: 900px) {
  .timer-layout {
    grid-template-columns: minmax(0, 1fr);
  }
}

.panel {
  background: var(--color-surface-panel);
  border-radius: 1.2rem;
  padding: 1.5rem;
  border: 1px solid var(--color-border-soft);
  box-shadow: var(--shadow-panel);
}

.panel-title {
  font-size: 1.05rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-text-soft);
  margin-bottom: 1rem;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  justify-self: center;
  align-items: center;
  width: 100%;
}

.form--session {
  margin-bottom: 1.5rem;
}

.session-settings {
  width: 50%;
}

.btn-primary {
  display: flex;
  justify-self: center;
  width: 100%;
  margin-top: 1rem;
}

.timer-picker {
  padding: 20px;
  background: transparent;
  border-radius: 12px;
}

.display {
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  align-items: baseline;
  margin-bottom: 15px;
  margin-top: -65px;
  pointer-events: none;
}

.time-value {
  font-size: 2.5rem;
  font-weight: bold;
  color: var(--color-primary);
  margin-right: 5px;
}

.transparent-slider {
  -webkit-appearance: none; /* Hides default browser styling */
  appearance: none;
  width: 100%;
  background: transparent;
  cursor: pointer;
}

/***** Chrome, Safari, Edge, and Opera *****/

/* The Track (Background) */
.transparent-slider::-webkit-slider-runnable-track {
  background: var(--color-surface-soft-strong);
  height: 5px;
  border-radius: 4px;
}

/* The Thumb (Knob) */
.transparent-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  margin-top: -10px; /* Centers thumb on the track */
  background-color: var(--color-primary);
  height: 25px;
  width: 25px;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/***** Firefox *****/

/* The Track */
.transparent-slider::-moz-range-track {
  background: var(--color-surface-soft-strong);
  height: 5px;
  border-radius: 4px;
}

/* The Thumb */
.transparent-slider::-moz-range-thumb {
  background-color: var(--color-primary);
  height: 25px;
  width: 25px;
  border: none;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.range-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.fieldset {
  border-radius: 0.9rem;
  border: 1px solid var(--color-border-strong);
  padding: 1rem;
}

.fieldset-legend {
  padding: 0 0.4rem;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-text-muted);
}

.grid-2 {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

@media (max-width: 600px) {
  .grid-2 {
    grid-template-columns: minmax(0, 1fr);
  }
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.field-label {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-muted);
}

.field-input {
  background: var(--color-surface-soft);
  border-radius: 0.6rem;
  border: 1px solid var(--color-border-strong);
  padding: 0.45rem 0.6rem;
  color: var(--color-text-strong);
  font-size: 0.9rem;
}

.field-input:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 1px;
}

.field-error {
  margin-top: 0.3rem;
  font-size: 0.8rem;
  color: var(--color-danger-soft);
}

.field-success {
  margin-top: 0.3rem;
  font-size: 0.8rem;
  color: var(--color-success-soft);
}

.presets-section {
  margin-top: 1.25rem;
}

.section-title {
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-muted);
  margin-bottom: 0.5rem;
}

.preset-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  max-height: 220px;
  overflow: auto;
}

.preset-item {
  width: 100%;
}

.preset-button {
  width: 100%;
  text-align: left;
  border-radius: 0.75rem;
  padding: 0.55rem 0.75rem;
  border: 1px solid transparent;
  background: var(--color-surface-soft);
  color: var(--color-text-strong);
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  cursor: pointer;
  transition:
    background-color 130ms ease,
    border-color 130ms ease,
    transform 100ms ease;
}

.preset-button:hover {
  background: var(--color-surface-soft-strong);
  border-color: var(--color-border-strong);
}

.preset-button--active {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 1px rgba(34, 197, 94, 0.6);
}

.preset-name {
  font-size: 0.9rem;
}

.preset-meta {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.muted {
  color: var(--color-text-muted);
  font-size: 0.85rem;
}

.preset-name {
  text-transform: uppercase;
  color: var(--color-text-strong);
}

.mode-toggle {
  position: relative;
  display: inline-flex;
  padding: 0.2rem;
  border-radius: 999px;
  background: var(--color-surface-soft);
  border: 1px solid var(--color-border-strong);
  margin-bottom: 0.6rem;
  z-index: 1;
}

.mode-slider {
  position: absolute;
  width: calc(50% - 0.2rem);
  height: calc(100% - 0.4rem);
  background: var(--gradient-primary);
  border-radius: 999px;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: -1;
}

.mode-toggle.is-rounds .mode-slider {
  transform: translateX(100%);
}

.mode-pill {
  position: relative;
  flex: 1;
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  padding: 0.25rem 0.7rem;
  border-radius: 999px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: color 0.3s ease;
  white-space: nowrap;
}

.mode-pill--active {
  color: var(--color-text-on-primary);
}

.session-visual {
  margin: 1rem 0 5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
}

.breath-circle {
  width: 230px;
  height: 230px;
  border-radius: 999px;
  background: var(--gradient-breath-circle);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  position: relative;
  overflow: hidden;
  transition:
    background-color 200ms ease,
    transform 500ms ease;
}

.breath-circle-- {
  animation: rotate-glow 30s linear infinite;
}

@keyframes rotate-glow {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.breath-progress {
  position: absolute;
  inset: 0;
  background: conic-gradient(
    rgba(34, 197, 94, 0.85) calc(var(--phase-progress, 0) * 360deg),
    rgba(15, 23, 42, 0.7) 0
  );
  mix-blend-mode: screen;
  opacity: 0.55;
  pointer-events: none;
}

.breath-phase-label {
  font-size: 1.5rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-primary);
  text-align: center;
  margin-bottom: -20px;
}

.breath-timer-label {
  font-variant-numeric: tabular-nums;
  font-size: 1.4rem;
  color: var(--color-primary-soft);
}

.breath-circle::after {
  content: '';
  position: absolute;
  inset: 10%;
  border-radius: inherit;
  pointer-events: none;
}

.breath-circle--inhale {
  transform: scale(1.05);
  box-shadow:
    0 0 40px rgba(34, 197, 94, 0.5),
    0 0 0 1px rgba(34, 197, 94, 0.4);
}

.breath-circle--hold_in {
  transform: scale(1);
  box-shadow: 0 0 30px rgba(56, 189, 248, 0.5);
}

.breath-circle--exhale {
  transform: scale(0.95);
  box-shadow: 0 0 25px rgba(248, 250, 252, 0.15);
}

.breath-circle--hold_out {
  transform: scale(0.9);
  box-shadow: 0 0 20px rgba(148, 163, 184, 0.6);
}

.session-meta {
  font-size: 0.85rem;
  color: var(--color-text-strong);
}
</style>
