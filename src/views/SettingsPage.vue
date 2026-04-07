<template>
  <div class="panel">
    <div class="glass-panel">
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
                step="0.1"
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
                step="0.1"
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
                step="0.1"
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
                step="0.1"
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

          <div class="form-actions">
            <button class="btn btn-primary" type="submit">
              {{ selectedPresetId ? 'Update Preset' : 'Save Preset' }}
            </button>
          </div>
          <p v-if="saveError" class="field-error">
            {{ saveError }}
          </p>
          <p v-if="saveSuccess" class="field-success">
            {{ saveSuccess }}
          </p>
        </fieldset>
      </form>

      <section class="presets-section">
        <div class="presets-header">
          <h3 class="section-title">Preset Library</h3>
          <button
            class="btn btn-secondary btn-secondary--compact"
            type="button"
            @click="handleNewPreset"
          >
            New Preset
          </button>
        </div>
        <p v-if="presets.length === 0" class="muted">No presets yet. Create one to get started.</p>
        <ul v-else class="preset-list">
          <li v-for="preset in presets" :key="preset.id" class="preset-item">
            <div class="preset-row">
              <button
                class="preset-button"
                type="button"
                :class="{
                  'preset-button--active': preset.id === selectedPresetId,
                }"
                @click="handleSelectPreset(preset.id)"
              >
                <span class="preset-name">{{ preset.name }}</span>
                <span class="preset-meta">
                  {{ formatSeconds(preset.inhaleSec) }} / {{ formatSeconds(preset.holdInSec) }} /
                  {{ formatSeconds(preset.exhaleSec) }} / {{ formatSeconds(preset.holdOutSec) }} sec
                </span>
              </button>

              <div class="preset-delete-container">
                <button
                  v-if="pendingDeleteId !== preset.id"
                  class="preset-delete-button"
                  type="button"
                  :disabled="preset.isDefault"
                  @click="pendingDeleteId = preset.id"
                >
                  <DeleteIcon />
                </button>
                <div v-else class="preset-delete-confirm">
                  <button
                    class="preset-delete-confirm-btn"
                    type="button"
                    @click="handleDeletePreset(preset.id)"
                  >
                    Confirm
                  </button>
                  <button
                    class="preset-delete-cancel-btn"
                    type="button"
                    @click="pendingDeleteId = null"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { presetManager } from '../services/presetManager'
import { timerEngine } from '../services/timerEngine'
import type { BreathPreset } from '../types/breathing'
import { useSessionConfigStore } from '../stores/sessionConfig'
import DeleteIcon from '~icons/material-symbols/delete-outline-rounded'

const inhale = ref(4)
const holdIn = ref(4)
const exhale = ref(4)
const holdOut = ref(4)
const presetName = ref('Box Breath')

const saveError = ref('')
const saveSuccess = ref('')

const pendingDeleteId = ref<string | null>(null)

const presets = ref<BreathPreset[]>(presetManager.list())
const sessionConfigStore = useSessionConfigStore()
const { selectedPresetId } = storeToRefs(sessionConfigStore)

function formatSeconds(value: number): string {
  if (Number.isNaN(value)) return '0'
  if (Number.isInteger(value)) return value.toString()
  return value.toFixed(1)
}

function resetFormToDefaults() {
  inhale.value = 4
  holdIn.value = 4
  exhale.value = 4
  holdOut.value = 4
  presetName.value = ''
}

function loadPresetIntoForm(id: string | null) {
  if (!id) return
  const preset = presets.value.find((p) => p.id === id)
  if (!preset) return
  inhale.value = preset.inhaleSec
  holdIn.value = preset.holdInSec
  exhale.value = preset.exhaleSec
  holdOut.value = preset.holdOutSec
  presetName.value = preset.name
}

watch(
  () => presetManager.list(),
  (next) => {
    presets.value = next
  },
)

function reloadPresets() {
  presets.value = presetManager.list()
  // If a preset is currently selected and still exists in the list, keep form in sync.
  if (selectedPresetId.value) {
    const exists = presets.value.some((p) => p.id === selectedPresetId.value)
    if (exists) {
      loadPresetIntoForm(selectedPresetId.value)
    }
  }
}

reloadPresets()

watch(selectedPresetId, (next) => {
  if (next) {
    loadPresetIntoForm(next)
  }
})

function handleSelectPreset(id: string) {
  sessionConfigStore.setSelectedPresetId(id)
  pendingDeleteId.value = null
  loadPresetIntoForm(id)
}

function handleDeletePreset(id: string) {
  const preset = presets.value.find((p) => p.id === id)
  if (!preset) return
  if (preset.isDefault) return

  presetManager.delete(id)
  reloadPresets()
  pendingDeleteId.value = null

  if (selectedPresetId.value === id) {
    const first = presets.value[0]
    const nextId = first?.id ?? null
    sessionConfigStore.setSelectedPresetId(nextId)
    if (nextId) {
      loadPresetIntoForm(nextId)
    }
  } else if (!presets.value.length) {
    // No presets left; clear form for creating a new one.
    resetFormToDefaults()
  }
}

function handleNewPreset() {
  sessionConfigStore.setSelectedPresetId(null)
  pendingDeleteId.value = null
  saveError.value = ''
  saveSuccess.value = ''
  resetFormToDefaults()
}

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

  const normalizeDuration = (value: number) => {
    if (!Number.isFinite(value) || value < 0) return 0
    return Math.round(value * 10) / 10
  }

  const targetId = selectedPresetId.value
  const base =
    targetId && presets.value.find((p) => p.id === targetId)
      ? presets.value.find((p) => p.id === targetId)
      : null

  const payload: Omit<BreathPreset, 'id'> = {
    name: presetName.value.trim(),
    inhaleSec: normalizeDuration(inhale.value),
    holdInSec: normalizeDuration(holdIn.value),
    exhaleSec: normalizeDuration(exhale.value),
    holdOutSec: normalizeDuration(holdOut.value),
    isDefault: base?.isDefault ?? false,
  }

  if (base) {
    const updated = presetManager.update({ ...base, ...payload })
    reloadPresets()
    sessionConfigStore.setSelectedPresetId(updated.id)
    saveSuccess.value = `"${updated.name}" updated.`
  } else {
    const created = presetManager.create(payload)
    reloadPresets()
    sessionConfigStore.setSelectedPresetId(created.id)
    saveSuccess.value = `"${created.name}" saved to your presets.`
  }
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

.panel-title {
  font-size: 1.05rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  margin-bottom: 1rem;
}

.btn-primary {
  width: 100%;
  margin: 1rem 0;
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

.form-actions {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  margin-top: 0.75rem;
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
  background: transparent;
  border-radius: 0.6rem;
  border: 1px solid var(--color-border-soft);
  padding: 0.45rem 0.6rem;
  color: var(--color-text-main);
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

.presets-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.section-title {
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-muted);
  margin-bottom: 0.5rem;
}

.btn-secondary--compact {
  padding-inline: 0.8rem;
  padding-block: 0.3rem;
  font-size: 0.8rem;
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

.preset-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.preset-delete-container {
  display: flex;
  align-items: center;
}

.preset-button {
  flex: 1 1 auto;
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
}

.preset-button--active {
  border-color: var(--color-primary);
}

.preset-delete-button {
  flex: 0 0 auto;
  padding: 0.35rem 0.6rem;
  font-size: 0.75rem;
  border: 0;
  background: transparent;
  color: var(--color-danger);
  cursor: pointer;
  transition:
    background-color 120ms ease,
    border-color 120ms ease,
    color 120ms ease;
}

.preset-delete-button:hover:not(:disabled) {
  background: rgba(248, 113, 113, 0.1);
  border-color: rgba(248, 113, 113, 1);
  border-radius: 0.75rem;
  color: #fee2e2;
}

.preset-delete-button:disabled {
  opacity: 0.45;
  cursor: default;
}

.preset-delete-confirm {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.preset-delete-confirm-btn,
.preset-delete-cancel-btn {
  border-radius: 0.6rem;
  padding: 0.25rem 0.5rem;
  font-size: 0.7rem;
  border: 1px solid var(--color-border-strong);
  background: var(--color-surface-soft-strong);
  color: var(--color-text-strong);
  cursor: pointer;
  transition:
    background-color 120ms ease,
    border-color 120ms ease,
    color 120ms ease;
}

.preset-delete-confirm-btn:hover,
.preset-delete-cancel-btn:hover {
  background: rgba(30, 64, 175, 0.4);
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

.mode-toggle {
  display: inline-flex;
  padding: 0.2rem;
  border-radius: 999px;
  background: var(--color-surface-soft);
  border: 1px solid var(--color-border-strong);
  margin-bottom: 0.6rem;
}

.mode-pill {
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  padding: 0.25rem 0.7rem;
  border-radius: 999px;
  cursor: pointer;
  font-size: 0.8rem;
}

.mode-pill--active {
  background: var(--gradient-primary);
  color: var(--color-text-on-primary);
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
  background: var(--gradient-breath-circle);
  border: 1px solid var(--color-border-strong);
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
  color: var(--color-primary-soft);
}

.breath-circle::after {
  content: '';
  position: absolute;
  inset: 10%;
  border-radius: inherit;
  border: 2px solid var(--color-border-subtle);
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
