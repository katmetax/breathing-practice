<template>
  <div class="panel">
    <h2 class="panel-title">Configure Session</h2>

    <form class="form" @submit.prevent="handleSavePreset">
      <fieldset class="fieldset">
        <legend class="fieldset-legend">Custom Pattern (seconds)</legend>
        <div class="grid-2">
          <label class="field">
            <span class="field-label">Inhale</span>
            <input
              v-model.number="inhale"
              class="field-input"
              type="number"
              min="1"
              max="60"
              required
            />
          </label>
          <label class="field">
            <span class="field-label">Hold (after inhale)</span>
            <input
              v-model.number="holdIn"
              class="field-input"
              type="number"
              min="0"
              max="60"
              required
            />
          </label>
          <label class="field">
            <span class="field-label">Exhale</span>
            <input
              v-model.number="exhale"
              class="field-input"
              type="number"
              min="1"
              max="60"
              required
            />
          </label>
          <label class="field">
            <span class="field-label">Hold (after exhale)</span>
            <input
              v-model.number="holdOut"
              class="field-input"
              type="number"
              min="0"
              max="60"
              required
            />
          </label>
        </div>
        <label class="field">
          <span class="field-label">Preset name</span>
          <input
            v-model="presetName"
            class="field-input"
            type="text"
            maxlength="40"
            placeholder="e.g. Box Breath"
            required
          />
        </label>

        <button class="btn btn-secondary" type="submit">Save Preset</button>
        <p v-if="saveError" class="field-error">
          {{ saveError }}
        </p>
        <p v-if="saveSuccess" class="field-success">
          {{ saveSuccess }}
        </p>
      </fieldset>
    </form>

    <section class="presets-section">
      <h3 class="section-title">Preset Library</h3>
      <p v-if="presets.length === 0" class="muted">
        No presets yet. Create one above to get started.
      </p>
      <ul v-else class="preset-list">
        <li v-for="preset in presets" :key="preset.id" class="preset-item">
          <button
            class="preset-button"
            type="button"
            :class="{
              'preset-button--active': preset.id === selectedPresetId,
            }"
            @click="selectedPresetId = preset.id"
          >
            <span class="preset-name">{{ preset.name }}</span>
            <span class="preset-meta">
              {{ preset.inhaleSec }} / {{ preset.holdInSec }} / {{ preset.exhaleSec }} /
              {{ preset.holdOutSec }} sec
            </span>
          </button>
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import { presetManager } from '../services/presetManager'
import { timerEngine } from '../services/timerEngine'
import type { BreathPreset } from '../types/breathing'

const inhale = ref(4)
const holdIn = ref(4)
const exhale = ref(4)
const holdOut = ref(4)
const presetName = ref('Box Breath')

const saveError = ref('')
const saveSuccess = ref('')

const presets = ref<BreathPreset[]>(presetManager.list())
const selectedPresetId = ref<string | null>(presets.value[0]?.id ?? null)

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
      selectedPresetId.value = firstPreset.id
    }
  }
}

reloadPresets()

function handleSavePreset() {
  saveError.value = ''
  saveSuccess.value = ''

  if (!presetName.value.trim()) {
    saveError.value = 'Please provide a name for the preset.'
    return
  }

  const values = [inhale.value, exhale.value]
  if (values.some((v) => !Number.isFinite(v) || v <= 0)) {
    saveError.value = 'Inhale and exhale must be positive seconds.'
    return
  }

  const created = presetManager.create({
    name: presetName.value.trim(),
    inhaleSec: Math.round(inhale.value),
    holdInSec: Math.round(holdIn.value),
    exhaleSec: Math.round(exhale.value),
    holdOutSec: Math.round(holdOut.value),
    isDefault: false,
  })

  reloadPresets()
  selectedPresetId.value = created.id
  saveSuccess.value = `"${created.name}" saved to your presets.`
}

onBeforeUnmount(() => {
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
  background: rgba(15, 23, 42, 0.92);
  border-radius: 1.2rem;
  padding: 1.5rem;
  border: 1px solid rgba(148, 163, 184, 0.35);
  box-shadow:
    0 18px 60px rgba(15, 23, 42, 0.9),
    0 0 0 1px rgba(15, 23, 42, 0.6);
}

.panel-title {
  font-size: 1.05rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #cbd5f5;
  margin-bottom: 1rem;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form--session {
  margin-bottom: 1.5rem;
}

.fieldset {
  border-radius: 0.9rem;
  border: 1px solid rgba(148, 163, 184, 0.5);
  padding: 1rem;
}

.fieldset-legend {
  padding: 0 0.4rem;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #9ca3af;
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
  color: #9ca3af;
}

.field-input {
  background: rgba(15, 23, 42, 0.9);
  border-radius: 0.6rem;
  border: 1px solid rgba(148, 163, 184, 0.7);
  padding: 0.45rem 0.6rem;
  color: #e5e7eb;
  font-size: 0.9rem;
}

.field-input:focus-visible {
  outline: 2px solid #22c55e;
  outline-offset: 1px;
}

.field-error {
  margin-top: 0.3rem;
  font-size: 0.8rem;
  color: #fecaca;
}

.field-success {
  margin-top: 0.3rem;
  font-size: 0.8rem;
  color: #bbf7d0;
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
  transition:
    transform 120ms ease,
    box-shadow 120ms ease,
    background-color 140ms ease;
}

.btn-primary {
  background: linear-gradient(135deg, #22c55e, #06b6d4);
  color: #020617;
  box-shadow: 0 12px 30px rgba(34, 197, 94, 0.35);
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 18px 40px rgba(34, 197, 94, 0.5);
}

.btn-primary:disabled {
  opacity: 0.6;
  box-shadow: none;
  cursor: default;
}

.btn-secondary {
  background: rgba(15, 23, 42, 0.9);
  color: #e5e7eb;
  border: 1px solid rgba(148, 163, 184, 0.9);
}

.btn-secondary:hover {
  background: rgba(30, 64, 175, 0.6);
}

.btn-ghost {
  margin-top: 0.5rem;
  background: transparent;
  color: #cbd5f5;
  border: 1px solid rgba(148, 163, 184, 0.7);
}

.btn-ghost:hover {
  background: rgba(15, 23, 42, 0.9);
}

.presets-section {
  margin-top: 1.25rem;
}

.section-title {
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #9ca3af;
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
  background: rgba(15, 23, 42, 0.9);
  color: #e5e7eb;
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
  background: rgba(15, 23, 42, 0.95);
  border-color: rgba(148, 163, 184, 0.8);
}

.preset-button--active {
  border-color: rgba(34, 197, 94, 0.9);
  box-shadow: 0 0 0 1px rgba(34, 197, 94, 0.6);
}

.preset-name {
  font-size: 0.9rem;
}

.preset-meta {
  font-size: 0.75rem;
  color: #9ca3af;
}

.muted {
  color: #9ca3af;
  font-size: 0.85rem;
}

.mode-toggle {
  display: inline-flex;
  padding: 0.2rem;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.7);
  margin-bottom: 0.6rem;
}

.mode-pill {
  border: none;
  background: transparent;
  color: #9ca3af;
  padding: 0.25rem 0.7rem;
  border-radius: 999px;
  cursor: pointer;
  font-size: 0.8rem;
}

.mode-pill--active {
  background: linear-gradient(135deg, #22c55e, #06b6d4);
  color: #020617;
}

.session-visual {
  margin-top: 0.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.breath-circle {
  width: 230px;
  height: 230px;
  border-radius: 999px;
  background: radial-gradient(circle at 20% 0, #1e40af, #0f172a);
  border: 1px solid rgba(148, 163, 184, 0.7);
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

.breath-phase-label {
  font-size: 1.1rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.breath-timer-label {
  font-variant-numeric: tabular-nums;
  font-size: 1.4rem;
  color: #d1fae5;
}

.breath-circle::after {
  content: '';
  position: absolute;
  inset: 10%;
  border-radius: inherit;
  border: 2px solid rgba(148, 163, 184, 0.4);
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
  color: #e5e7eb;
}
</style>
