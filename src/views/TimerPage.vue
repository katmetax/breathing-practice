<template>
  <section class="timer-page">
    <div>
      <div>
        <section class="session-visual">
          <p class="breath-phase-label">
            {{ isCountingDown ? `Starting in ${countdownRemaining}…` : phaseLabel }}
          </p>

          <div class="breath-blob-wrapper">
            <svg
              class="breath-blob-svg"
              :style="`transition: transform ${isRunning ? currentPhaseDuration : 15}s cubic-bezier(0.4, 0, 0.2, 1)`"
              :class="`breath-blob-phase--${currentPhase}`"
              viewBox="-120 -120 240 240"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient
                  id="blobGradient"
                  gradientUnits="userSpaceOnUse"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                  class="gradient-element"
                >
                  <stop
                    offset="0%"
                    style="stop-color: var(--gradient-breath-start); stop-opacity: 1"
                  />
                  <stop
                    offset="100%"
                    style="stop-color: var(--gradient-breath-end); stop-opacity: 1"
                  />
                </linearGradient>
              </defs>

              <path
                class="blob-path"
                d="M 74.27332230365087,0 C 74.83693175213968,30.599222038082097 65.27071194691645,45.41079158492555 36.46015705833725,63.15084447698112 C 7.649602169758058,80.8908973690367 -10.577819325757552,86.74792268746755 -40.968897250665904,70.96021156822228 C -71.35997517557425,55.172500448977 -85.22055812868366,35.27848902977774 -85.10415464129615,1.042225305756047e-14 C -84.98775115390863,-35.278489029777724 -70.3307517775354,-55.34223363205183 -40.50328330111585,-70.15374455088865 C -10.67581482469631,-84.96525546972546 5.511567863190329,-76.78447981306942 34.20571926438201,-59.246043675347266 C 62.899870665573694,-41.70760753762511 73.70971285516207,-30.599222038082097 74.27332230365087,0 Z"
              />
            </svg>
          </div>

          <!--
              Debug-only literal timer. Kept for development but hidden in the UI.
            <p class="breath-timer-label">
              {{ formattedElapsed }}
            </p>
            -->
          <p class="session-meta">
            <span v-if="isRunning" class="muted">
              Round {{ currentRound }} •
              {{ mode === 'rounds' ? `${rounds} total` : 'duration mode' }}
            </span>
            <span v-else-if="sessionComplete" class="session-meta--completed">
              <BreathIcon />
              Session completed:
              {{ lastDurationDisplay }}
            </span>
            <span v-else class="muted">
              When you start, this circle will guide your breath phases.
            </span>
          </p>

          <span
            v-if="selectedPreset"
            :class="{
              'preset-name': true,
              'session--active': isRunning || isCountingDown,
            }"
            title="Selected preset"
          >
            <PresetIcon /> {{ selectedPreset.name }}
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
                <div class="display">
                  <span class="time-value">{{ rounds }}</span>
                  <span class="unit">RND</span>
                </div>
                <span class="field-label">Number of rounds</span>

                <div class="slider-wrapper">
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
                <div class="display">
                  <span class="time-value">{{ durationMinutes }}</span>
                  <span class="unit">MIN</span>
                </div>
                <span class="field-label">Duration (minutes)</span>

                <div class="slider-wrapper">
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
import { playTone, stopTone } from '../services/audioController'
import { historyService } from '../services/historyService'
import type { BreathPreset, SessionMode } from '../types/breathing'
import { BreathPhase, StartEndPhase } from '../types/breathing'
import { useSessionConfigStore } from '../stores/sessionConfig'
import { useWakeLock } from '../composables/useWakeLock'
import BreathIcon from '~icons/material-symbols/air-rounded'
import PresetIcon from '~icons/material-symbols/target'

const { requestWakeLock, releaseWakeLock } = useWakeLock()

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
const currentPhase = ref<BreathPhase | ''>('')
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
    case BreathPhase.INHALE:
      return 'Inhale'
    case BreathPhase.HOLD_IN:
      return 'Hold'
    case BreathPhase.EXHALE:
      return 'Exhale'
    case BreathPhase.HOLD_OUT:
      return 'Hold'
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
  phases: { phase: BreathPhase; durationSec: number }[],
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
  requestWakeLock()

  timerEngine.init(
    {
      phases,
      rounds: mode.value === 'rounds' ? Math.round(rounds.value) : Number.MAX_SAFE_INTEGER,
      mode: mode.value,
      totalDurationSec,
    },
    {
      onPhaseChange(state) {
        currentPhase.value = state.currentPhase ?? BreathPhase.INHALE
        currentRound.value = state.currentRound
        elapsedPhase.value = state.currentPhaseElapsed
        elapsedTotal.value = state.totalElapsed
        const nextPhaseConfig = phases.find((p) => p.phase === state.currentPhase)
        if (nextPhaseConfig) {
          currentPhaseDuration.value = nextPhaseConfig.durationSec
        }
        playTone(currentPhase.value)
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
        playTone(StartEndPhase.END)
        releaseWakeLock()

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
  // playTone(StartEndPhase.START)
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
    { phase: BreathPhase.INHALE as const, durationSec: preset.inhaleSec },
    { phase: BreathPhase.HOLD_IN as const, durationSec: preset.holdInSec },
    { phase: BreathPhase.EXHALE as const, durationSec: preset.exhaleSec },
    { phase: BreathPhase.HOLD_OUT as const, durationSec: preset.holdOutSec },
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
  stopTone()
  releaseWakeLock()
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
  stopTone()
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

@media screen and (max-width: 720px) {
  .session-settings {
    width: 100%;
  }
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
  margin-top: -55px;
  pointer-events: none;
}

@media screen and (max-width: 490px) {
  .display {
    margin-top: -45px;
    margin-bottom: 0;
  }
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

@media screen and (max-width: 490px) {
  .transparent-slider::-webkit-slider-thumb {
    height: 44px;
    width: 44px;
    margin-top: -19px;
  }

  .transparent-slider::-moz-range-thumb {
    height: 44px;
    width: 44px;
  }
}

.range-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

@media screen and (max-width: 490px) {
  .range-labels {
    margin-top: 35px;
  }
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

@media screen and (max-width: 600px) {
  .grid-2 {
    grid-template-columns: minmax(0, 1fr);
  }
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

@media screen and (max-width: 490px) {
  .field {
    gap: 1.5rem;
  }
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
  display: flex;
  align-items: center;
  font-size: 0.9rem;
  text-transform: uppercase;
  color: var(--color-primary);
}

@media screen and (max-width: 490px) {
  .preset-name {
    align-self: flex-end;
    margin-right: 15px;
  }

  .preset-name.session--active {
    align-self: center;
    margin-right: 0;
  }
}

.preset-name svg {
  margin-right: 5px;
  font-size: 17px;
}

.muted {
  color: var(--color-text-muted);
  font-size: 0.85rem;
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

@media screen and (max-width: 490px) {
  .mode-toggle {
    display: flex;
    align-items: center;
    margin-bottom: 0;
    height: 44px;
    max-width: 180px;
  }
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

@media screen and (max-width: 490px) {
  .mode-slider {
    height: calc(100% - 0.5rem);
  }
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
  margin: 1rem 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
}

@media screen and (max-width: 490px) {
  .session-visual {
    margin: -1rem 0 0;
    gap: 1rem;
  }
}

.breath-phase-label {
  font-size: 1.5rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-primary);
  text-align: center;
  margin-bottom: -20px;
}

.breath-blob-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 300px;
  height: 300px;
  overflow: hidden;
}

@media screen and (max-width: 490px) {
  .breath-blob-wrapper {
    width: 200px;
    height: 200px;
  }
}

.breath-blob-svg {
  width: 100%;
  height: 100%;
  fill: url(#blobGradient);
  filter: drop-shadow(var(--shadow-breath-circle));
}

.breath-blob-phase--inhale {
  transform: scale(1.3);
}

.breath-blob-phase--hold_in {
  transform: scale(1.3);
}

.breath-blob-phase--exhale {
  transform: scale(0.8);
}

.breath-blob-phase--hold_out {
  transform: scale(0.8);
}

.gradient-element {
  transform-origin: 50px 50px;
  animation: rotate-glow 30s linear infinite;
}

.blob-path {
  transition: d 0.5s ease-in-out;
  animation: blob-morph 15s ease-in-out infinite alternate;
}

@keyframes rotate-glow {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes blob-morph {
  0%,
  100% {
    d: path(
      'M 74.27332230365087,0 C 74.83693175213968,30.599222038082097 65.27071194691645,45.41079158492555 36.46015705833725,63.15084447698112 C 7.649602169758058,80.8908973690367 -10.577819325757552,86.74792268746755 -40.968897250665904,70.96021156822228 C -71.35997517557425,55.172500448977 -85.22055812868366,35.27848902977774 -85.10415464129615,1.042225305756047e-14 C -84.98775115390863,-35.278489029777724 -70.3307517775354,-55.34223363205183 -40.50328330111585,-70.15374455088865 C -10.67581482469631,-84.96525546972546 5.511567863190329,-76.78447981306942 34.20571926438201,-59.246043675347266 C 62.899870665573694,-41.70760753762511 73.70971285516207,-30.599222038082097 74.27332230365087,0 Z'
    );
  }
  70% {
    /* The following shapes need to have the same amount of complexity (6) as the initial shape */
    d: path(
      'M 82.59530868685202,0 C 82.67239362978778,33.52074780281568 69.97982333359184,49.17325962155623 38.860595420657845,67.30852568095781 C 7.741367507723858,85.4437917403594 -11.514840783049358,89.36819565784579 -41.881602964883925,72.54106423760634 C -72.2483651467185,55.71393281736688 -83.41073621009681,34.87747326642693 -82.60645330668042,1.0116372863094146e-14 C -81.80217040326403,-34.87747326642692 -68.95414859011716,-50.27521244552514 -38.66447135121834,-66.96882882810137 C -8.37479411231952,-83.66244521067759 8.237310639397254,-83.51667273733023 38.552255648914844,-66.77446553030488 C 68.86720065843244,-50.032258323279535 82.51822374391627,-33.52074780281568 82.59530868685202,0 Z'
    );
  }
  50% {
    d: path(
      'M 81.98002208199414,0 C 82.83853731927891,35.25307500959785 73.31785006282192,55.468417530971934 42.423775167676304,73.48013403929421 C 11.529700272530683,91.4918505476165 -12.51064993130531,90.41689954311266 -41.59627749858835,72.0468660332891 C -70.68190506587139,53.676832523465556 -75.3010550958798,33.629184553983904 -73.91873510145585,9.0524342339019e-15 C -72.5364151070319,-33.62918455398389 -64.29410985089078,-45.58683068287219 -36.066997520892514,-62.46987218264649 C -7.8398851908942575,-79.35291368242079 9.477959317815518,-83.1496340447588 38.98971421853718,-67.53216599909717 C 68.50146911925884,-51.91469795343555 81.12150684470936,-35.25307500959785 81.98002208199414,0 Z'
    );
  }
  25% {
    d: path(
      'M 80,0 C 80.00000000000001,34.641016151377556 70,51.961524227066306 40.00000000000001,69.28203230275508 C 10.00000000000001,86.60254037844386 -9.999999999999986,86.60254037844386 -39.999999999999986,69.2820323027551 C -69.99999999999999,51.961524227066334 -79.99999999999999,34.64101615137755 -80,9.797174393178826e-15 C -80.00000000000001,-34.641016151377535 -70.00000000000003,-51.961524227066285 -40.000000000000036,-69.28203230275507 C -10.00000000000005,-86.60254037844385 9.999999999999936,-86.60254037844389 39.99999999999994,-69.28203230275513 C 69.99999999999994,-51.96152422706636 79.99999999999999,-34.641016151377556 80,0 Z'
    );
  }
  15% {
    d: path(
      'M 83.26109978022953,0 C 85.75352956860078,35.51315223888474 77.10337769915358,61.82681523481526 45.99191558652703,79.66033453328376 C 14.880453473900474,97.49385383175226 -10.716667391319316,91.24916082719496 -41.18474867027669,71.33407719387402 C -71.65282994923406,51.41899356055309 -77.05253630625407,33.63685546634486 -75.88040952930247,9.292670064805059e-15 C -74.70828275235087,-33.63685546634485 -64.4718930530564,-47.61527606594159 -36.49624156247029,-63.2133446715054 C -8.520590071884172,-78.8114132770692 6.0828610973670365,-78.19561059013158 36.02219643304199,-62.39227442225523 C 65.96153176871695,-46.588938254378874 80.76866999185827,-35.51315223888474 83.26109978022953,0 Z'
    );
  }
}

.session-meta {
  font-size: 0.85rem;
  color: var(--color-text-strong);
}

@media screen and (max-width: 490px) {
  .session-meta {
    margin: 0 0 1rem;
  }
}

.session-meta--completed {
  display: flex;
  align-items: center;
}

.session-meta--completed svg {
  font-size: 17px;
  margin-right: 5px;
}
</style>
