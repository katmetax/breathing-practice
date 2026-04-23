<template>
  <section class="settings-page">
    <div class="panel">
      <GlassPanel>
        <h2 class="panel-title">Configure Session</h2>

        <form v-if="showPresetSettings" class="form" @submit.prevent="handleSavePreset">
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
                  inputmode="decimal"
                  @beforeinput="handleDurationBeforeInput"
                  @paste="handleDurationPaste($event, BreathPhase.INHALE)"
                  @blur="handleDurationBlur(BreathPhase.INHALE)"
                  required
                />
              </label>
              <label class="field">
                <span class="field-label">Hold (after inhale)</span>
                <input
                  v-model.number="hold_in"
                  class="field-input"
                  type="number"
                  min="0"
                  max="60"
                  step="0.1"
                  inputmode="decimal"
                  @beforeinput="handleDurationBeforeInput"
                  @paste="handleDurationPaste($event, BreathPhase.HOLD_IN)"
                  @blur="handleDurationBlur(BreathPhase.HOLD_IN)"
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
                  inputmode="decimal"
                  @beforeinput="handleDurationBeforeInput"
                  @paste="handleDurationPaste($event, BreathPhase.EXHALE)"
                  @blur="handleDurationBlur(BreathPhase.EXHALE)"
                  required
                />
              </label>
              <label class="field">
                <span class="field-label">Hold (after exhale)</span>
                <input
                  v-model.number="hold_out"
                  class="field-input"
                  type="number"
                  min="0"
                  max="60"
                  step="0.1"
                  inputmode="decimal"
                  @beforeinput="handleDurationBeforeInput"
                  @paste="handleDurationPaste($event, BreathPhase.HOLD_OUT)"
                  @blur="handleDurationBlur(BreathPhase.HOLD_OUT)"
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
          </fieldset>
        </form>
        <span v-else class="muted"
          >Select a preset from the list below for your breathing practice.</span
        >
        <section class="presets-section">
          <p v-if="saveSuccess" class="field-success">
            {{ saveSuccess }}
          </p>

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
          <p v-if="presets.length === 0" class="muted">
            No presets yet. Create one to get started.
          </p>
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
                    {{ formatSeconds(preset.exhaleSec) }} /
                    {{ formatSeconds(preset.holdOutSec) }} sec
                  </span>
                </button>

                <div class="preset-edit-container">
                  <button
                    class="preset-edit-button"
                    type="button"
                    @click="handleEditPreset(preset.id)"
                  >
                    <EditIcon />
                  </button>
                </div>

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
                      class="preset-delete-confirm-btn btn btn-secondary btn-secondary--compact"
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
      </GlassPanel>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { presetManager } from '../services/presetManager'
import { timerEngine } from '../services/timerEngine'
import { BreathPhase, type BreathPreset } from '../types/breathing'
import { useSessionConfigStore } from '../stores/sessionConfig'
import GlassPanel from '../components/layout/GlassPanel.vue'
import DeleteIcon from '~icons/material-symbols/delete-outline-rounded'
import EditIcon from '~icons/material-symbols/edit-rounded'

const inhale = ref(4)
const hold_in = ref(4)
const exhale = ref(4)
const hold_out = ref(4)
const presetName = ref('Box Breath')

const saveError = ref('')
const saveSuccess = ref('')

const editPresetId = ref<string | null>(null)
const pendingDeleteId = ref<string | null>(null)

const showPresetSettings = ref<boolean>(false)

const presets = ref<BreathPreset[]>(presetManager.list())
const sessionConfigStore = useSessionConfigStore()
const { selectedPresetId } = storeToRefs(sessionConfigStore)
const MAX_PRESET_NAME_LENGTH = 40
const DURATION_MIN_BY_FIELD: Record<BreathPhase, number> = {
  inhale: 1,
  hold_in: 0,
  exhale: 1,
  hold_out: 0,
}

const durationRefs: Record<BreathPhase, typeof inhale> = {
  inhale,
  hold_in,
  exhale,
  hold_out,
}

function formatSeconds(value: number): string {
  if (Number.isNaN(value)) return '0'
  if (Number.isInteger(value)) return value.toString()
  return value.toFixed(1)
}

function resetFormToDefaults() {
  inhale.value = 4
  hold_in.value = 4
  exhale.value = 4
  hold_out.value = 4
  presetName.value = ''
}

function loadPresetIntoForm(id: string | null) {
  if (!id) return
  const preset = presets.value.find((p) => p.id === id)
  if (!preset) return
  inhale.value = preset.inhaleSec
  hold_in.value = preset.holdInSec
  exhale.value = preset.exhaleSec
  hold_out.value = preset.holdOutSec
  presetName.value = preset.name
}

function normalizeDuration(value: number, field: BreathPhase): number {
  const min = DURATION_MIN_BY_FIELD[field]
  if (!Number.isFinite(value)) return min
  if (value < min) return min
  if (value > 60) return 60
  return Math.round(value * 10) / 10
}

function parseDurationText(raw: string, field: BreathPhase): number | null {
  const cleaned = raw.replace(',', '.').trim()
  if (!cleaned) return null
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return null
  const parsed = Number(cleaned)
  if (!Number.isFinite(parsed)) return null
  return normalizeDuration(parsed, field)
}

function setDurationValue(field: BreathPhase, value: number): void {
  durationRefs[field].value = normalizeDuration(value, field)
}

function handleDurationBeforeInput(event: InputEvent): void {
  if (event.inputType.startsWith('delete')) return
  const text = event.data ?? ''
  if (!text) return
  if (!/^[\d.,]+$/.test(text)) {
    event.preventDefault()
  }
}

function handleDurationPaste(event: ClipboardEvent, field: BreathPhase): void {
  const pasted = event.clipboardData?.getData('text') ?? ''
  const parsed = parseDurationText(pasted, field)
  if (parsed === null) {
    event.preventDefault()
    return
  }
  event.preventDefault()
  setDurationValue(field, parsed)
}

function handleDurationBlur(field: BreathPhase): void {
  setDurationValue(field, durationRefs[field].value)
}

function containsControlCharacters(raw: string): boolean {
  for (const char of raw) {
    const code = char.charCodeAt(0)
    if (code <= 0x1f || code === 0x7f) return true
  }
  return false
}

function sanitizePresetName(raw: string): string {
  let withoutControlChars = ''
  for (const char of raw) {
    const code = char.charCodeAt(0)
    if (code <= 0x1f || code === 0x7f) continue
    withoutControlChars += char
  }
  return withoutControlChars.trim().slice(0, MAX_PRESET_NAME_LENGTH)
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
  saveSuccess.value = ''
  loadPresetIntoForm(id)
}

const handleEditPreset = (id: string) => {
  editPresetId.value = id
  handleSelectPreset(id)
  showPresetSettings.value = !showPresetSettings.value
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
      showPresetSettings.value = false
      saveSuccess.value = ''
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
  showPresetSettings.value = true
  resetFormToDefaults()
}

function handleSavePreset() {
  saveError.value = ''
  saveSuccess.value = ''

  const normalizedName = sanitizePresetName(presetName.value)
  if (!normalizedName) {
    saveError.value = 'Please provide a name for the preset.'
    return
  }
  if (containsControlCharacters(presetName.value)) {
    saveError.value = 'Preset name contains invalid characters.'
    return
  }

  const DURATION_FIELD_KEYS = Object.values(BreathPhase)
  const durations = DURATION_FIELD_KEYS.map((key) => ({
    key,
    value: normalizeDuration(durationRefs[key].value, key),
  }))
  if (
    durations.some(
      ({ key, value }) =>
        !Number.isFinite(value) || value < DURATION_MIN_BY_FIELD[key] || value > 60,
    )
  ) {
    saveError.value = 'Inhale/exhale must be 1-60 seconds; holds must be 0-60 seconds.'
    return
  }
  DURATION_FIELD_KEYS.forEach((key) => {
    setDurationValue(key, durationRefs[key].value)
  })
  presetName.value = normalizedName

  const targetId = selectedPresetId.value
  const base =
    targetId && presets.value.find((p) => p.id === targetId)
      ? presets.value.find((p) => p.id === targetId)
      : null

  const payload: Omit<BreathPreset, 'id'> = {
    name: normalizedName,
    inhaleSec: normalizeDuration(inhale.value, BreathPhase.INHALE),
    holdInSec: normalizeDuration(hold_in.value, BreathPhase.HOLD_IN),
    exhaleSec: normalizeDuration(exhale.value, BreathPhase.EXHALE),
    holdOutSec: normalizeDuration(hold_out.value, BreathPhase.HOLD_OUT),
    isDefault: base?.isDefault ?? false,
  }

  if (base) {
    const updated = presetManager.update({ ...base, ...payload })
    reloadPresets()
    sessionConfigStore.setSelectedPresetId(updated.id)
    saveSuccess.value = `"${updated.name}" updated.`
    showPresetSettings.value = false
  } else {
    const created = presetManager.create(payload)
    reloadPresets()
    sessionConfigStore.setSelectedPresetId(created.id)
    saveSuccess.value = `"${created.name}" saved to your presets.`
    showPresetSettings.value = false
  }
}

onBeforeUnmount(() => {
  timerEngine.stop()
})
</script>

<style scoped>
.panel {
  border-radius: 1.2rem;
  padding: 1.5rem;
}

@media screen and (max-width: 720px) {
  .settings-page {
    width: 100%;
  }

  .panel {
    padding: 0;
  }

  .glass-panel {
    min-width: 200px;
  }
}

.panel-title {
  font-size: 1.05rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  margin-bottom: 1rem;
  color: var(--color-text-strong);
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
  align-items: end;
}

.grid-2 .field-label {
  /* Keep a consistent label height so neighboring inputs align vertically. */
  min-height: 2.4em;
  display: flex;
  align-items: flex-end;
}

@media (max-width: 420px) {
  .grid-2 .field-label {
    min-height: 2.8em;
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
  color: white;
}

.preset-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
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

.preset-delete-container,
.preset-edit-container {
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

.preset-edit-button {
  flex: 0 0 auto;
  padding: 0.35rem 0.6rem;
  font-size: 1rem;
  border: 0;
  background: transparent;
  color: var(--color-primary);
  cursor: pointer;
  transition:
    background-color 120ms ease,
    border-color 120ms ease,
    color 120ms ease;
}

.preset-edit-button:hover {
  background: rgba(248, 113, 113, 0.1);
  border-color: rgba(248, 113, 113, 1);
  border-radius: 0.75rem;
}

.preset-delete-button {
  flex: 0 0 auto;
  padding: 0.35rem 0.6rem;
  font-size: 1rem;
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

.preset-delete-confirm-btn {
  margin: 0;
}

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

.preset-delete-confirm-btn:hover {
  background: var(--color-danger);
}

.preset-delete-cancel-btn:hover {
  color: var(--color-text-on-primary);
  background: var(--color-text-muted);
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
</style>
