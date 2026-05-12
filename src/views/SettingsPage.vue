<template>
  <section class="settings-page">
    <div class="page-label">SETTINGS</div>

    <section class="presets-section">
      <div class="presets-header">
        <h3 class="section-title">My Presets</h3>
        <button class="btn-outline new-preset-desktop" type="button" @click="handleNewPreset">
          + New Preset
        </button>
      </div>

      <p v-if="saveSuccess" class="field-success">
        {{ saveSuccess }}
      </p>

      <p v-if="presets.length === 0" class="muted">No presets yet. Create one to get started.</p>
      <ul v-else class="preset-list">
        <li v-for="preset in presets" :key="preset.id" class="preset-item">
          <div
            class="preset-card"
            :class="{ 'preset-card--active': preset.id === selectedPresetId }"
            @click="handleSelectPreset(preset.id)"
          >
            <div class="preset-card-header">
              <div class="preset-name-row">
                <span
                  v-if="preset.id === selectedPresetId"
                  class="preset-dot"
                  aria-hidden="true"
                ></span>
                <span class="preset-name">{{ preset.name }}</span>
              </div>

              <div class="preset-actions" @click.stop>
                <button class="preset-edit-btn" type="button" @click="handleEditPreset(preset.id)">
                  <EditIcon /><span class="edit-label">Edit</span>
                </button>

                <template v-if="pendingDeleteId !== preset.id">
                  <button
                    class="preset-delete-btn"
                    type="button"
                    :disabled="preset.isDefault"
                    @click="pendingDeleteId = preset.id"
                  >
                    <DeleteIcon />
                  </button>
                </template>
                <template v-else>
                  <div class="preset-delete-confirm">
                    <button
                      class="btn btn-secondary btn-secondary--compact preset-delete-confirm-btn"
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
                </template>
              </div>
            </div>

            <div class="preset-phases">
              <div class="phase-cell phase-cell--tinted">
                <span class="phase-value">{{ formatSeconds(preset.inhaleSec) }}s</span>
                <span class="phase-label">Inhale</span>
              </div>
              <div class="phase-cell">
                <span class="phase-value">{{ formatSeconds(preset.holdInSec) }}s</span>
                <span class="phase-label">Hold</span>
              </div>
              <div class="phase-cell phase-cell--tinted">
                <span class="phase-value">{{ formatSeconds(preset.exhaleSec) }}s</span>
                <span class="phase-label">Exhale</span>
              </div>
              <div class="phase-cell">
                <span class="phase-value">{{ formatSeconds(preset.holdOutSec) }}s</span>
                <span class="phase-label">Hold</span>
              </div>
            </div>
          </div>
        </li>
      </ul>
    </section>

    <!-- Mobile sticky New Preset button -->
    <div class="new-preset-mobile">
      <button class="btn-outline btn-outline--full" type="button" @click="handleNewPreset">
        + New Preset
      </button>
    </div>

    <!-- New / Edit Preset modal -->
    <div v-if="showPresetSettings" class="modal-overlay" @click.self="handleCancelPreset">
      <div class="modal" role="dialog">
        <div class="modal-header">
          <span class="modal-title-label">{{
            selectedPresetId ? "Edit Preset" : "New Preset"
          }}</span>
          <button
            class="modal-close-btn"
            type="button"
            @click="handleCancelPreset"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form @submit.prevent="handleSavePreset">
          <div class="modal-section">
            <FormField
              ref="presetNameFieldRef"
              v-model="presetName"
              label="Preset name"
              type="text"
              maxlength="40"
              placeholder="e.g. Box Breath"
              required
              stacked
            />
          </div>

          <div class="modal-section">
            <div class="phase-durations-header">
              <div class="modal-section-label">Phase Durations</div>
              <span class="decimal-hint">tap to type a decimal (e.g. 1.5)</span>
            </div>
            <div class="stepper-list">
              <PhaseStepper
                v-model.number="inhale"
                label="Inhale"
                :min="1"
                :max="60"
                @beforeinput="handleDurationBeforeInput"
                @paste="handleDurationPaste($event, BreathPhase.INHALE)"
                @blur="handleDurationBlur(BreathPhase.INHALE)"
              />
              <PhaseStepper
                v-model.number="hold_in"
                label="Hold"
                :min="0"
                :max="60"
                @beforeinput="handleDurationBeforeInput"
                @paste="handleDurationPaste($event, BreathPhase.HOLD_IN)"
                @blur="handleDurationBlur(BreathPhase.HOLD_IN)"
              />
              <PhaseStepper
                v-model.number="exhale"
                label="Exhale"
                :min="1"
                :max="60"
                @beforeinput="handleDurationBeforeInput"
                @paste="handleDurationPaste($event, BreathPhase.EXHALE)"
                @blur="handleDurationBlur(BreathPhase.EXHALE)"
              />
              <PhaseStepper
                v-model.number="hold_out"
                label="Hold"
                :min="0"
                :max="60"
                @beforeinput="handleDurationBeforeInput"
                @paste="handleDurationPaste($event, BreathPhase.HOLD_OUT)"
                @blur="handleDurationBlur(BreathPhase.HOLD_OUT)"
              />
            </div>
          </div>

          <p v-if="saveError" class="field-error">
            {{ saveError }}
          </p>

          <button class="btn btn-primary modal-submit-btn" type="submit">
            {{ selectedPresetId ? "Update Preset" : "Save Preset" }}
          </button>
        </form>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue"
import { storeToRefs } from "pinia"
import { presetManager } from "../services/presetManager"
import { BreathPhase, type BreathPreset } from "../types/breathing"
import { useSessionConfigStore } from "../stores/sessionConfig"
import FormField from "../components/form/FormField.vue"
import PhaseStepper from "../components/form/PhaseStepper.vue"
import DeleteIcon from "~icons/material-symbols/delete-outline-rounded"
import EditIcon from "~icons/material-symbols/edit-rounded"

const inhale = ref(4)
const hold_in = ref(4)
const exhale = ref(4)
const hold_out = ref(4)
const presetName = ref("Box Breath")

const saveError = ref("")
const saveSuccess = ref("")

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
  if (Number.isNaN(value)) return "0"
  if (Number.isInteger(value)) return value.toString()
  return value.toFixed(1)
}

function resetFormToDefaults() {
  inhale.value = 4
  hold_in.value = 4
  exhale.value = 4
  hold_out.value = 4
  presetName.value = ""
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
  const cleaned = raw.replace(",", ".").trim()
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
  if (event.inputType.startsWith("delete")) return
  const text = event.data ?? ""
  if (!text) return
  if (!/^[\d.,]+$/.test(text)) {
    event.preventDefault()
  }
}

function handleDurationPaste(event: ClipboardEvent, field: BreathPhase): void {
  const pasted = event.clipboardData?.getData("text") ?? ""
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

function sanitizePresetName(raw: string): string {
  return [...raw]
    .filter((c) => c.charCodeAt(0) > 0x1f && c.charCodeAt(0) !== 0x7f)
    .join("")
    .trim()
    .slice(0, MAX_PRESET_NAME_LENGTH)
}

function reloadPresets() {
  presets.value = presetManager.list()
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
  saveSuccess.value = ""
  loadPresetIntoForm(id)
}

function handleEditPreset(id: string) {
  handleSelectPreset(id)
  showPresetSettings.value = true
}

function handleCancelPreset() {
  showPresetSettings.value = false
  saveError.value = ""
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
      saveSuccess.value = ""
    }
  } else if (!presets.value.length) {
    resetFormToDefaults()
  }
}

function handleNewPreset() {
  sessionConfigStore.setSelectedPresetId(null)
  pendingDeleteId.value = null
  saveError.value = ""
  saveSuccess.value = ""
  showPresetSettings.value = true
  resetFormToDefaults()
}

function handleSavePreset() {
  saveError.value = ""
  saveSuccess.value = ""

  const normalizedName = sanitizePresetName(presetName.value)
  if (!normalizedName) {
    saveError.value = "Please provide a name for the preset."
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
    saveError.value = "Inhale/exhale must be 1-60 seconds; holds must be 0-60 seconds."
    return
  }
  DURATION_FIELD_KEYS.forEach((key) => {
    setDurationValue(key, durationRefs[key].value)
  })
  presetName.value = normalizedName

  const targetId = selectedPresetId.value
  const base = (targetId && presets.value.find((p) => p.id === targetId)) || null

  const payload: Omit<BreathPreset, "id"> = {
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

function handleKeydown(e: KeyboardEvent) {
  if (e.key === "Escape" && showPresetSettings.value) {
    handleCancelPreset()
  }
}

onMounted(() => {
  document.addEventListener("keydown", handleKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener("keydown", handleKeydown)
})
</script>

<style scoped>
.settings-page {
  width: 100%;
  max-width: 700px;
  padding: 0 0.5rem;
  /* room for the mobile sticky button */
  padding-bottom: 5rem;
}

@media screen and (min-width: 600px) {
  .settings-page {
    padding-bottom: 0.5rem;
  }
}

.page-label {
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-primary);
  margin-bottom: 1.25rem;
}

/* ── Presets section ── */

.presets-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.presets-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.section-title {
  font-size: 0.85rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  color: var(--color-text-muted);
  margin: 0;
}

/* ── Preset list ── */

.preset-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.preset-item {
  width: 100%;
}

.preset-card {
  border-radius: 0.875rem;
  border: 1.5px solid var(--color-card-border);
  padding: 0.875rem 1rem 0.75rem;
  background: var(--color-card-surface);
  cursor: pointer;
  transition:
    background 130ms ease,
    border-color 130ms ease;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}

.preset-card:hover {
  background: var(--color-card-surface-hover);
}

.preset-card--active {
  border-color: var(--color-primary);
  background: var(--color-surface-active);
}

/* Card header row */
.preset-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.preset-name-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  min-width: 0;
}

.preset-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--color-primary);
  flex-shrink: 0;
}

.preset-name {
  font-size: 0.925rem;
  font-weight: 600;
  color: var(--color-text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Action buttons */
.preset-actions {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-shrink: 0;
}

.preset-edit-btn {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  min-height: 36px;
  padding: 0 0.75rem;
  border-radius: 999px;
  border: 1.5px solid var(--color-border-strong);
  background: transparent;
  color: var(--color-text-muted);
  font-size: 0.78rem;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
  transition:
    background 120ms ease,
    border-color 120ms ease,
    color 120ms ease;
}

.preset-edit-btn:hover {
  color: var(--color-primary);
  border-color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 8%, transparent);
}

.edit-label {
  line-height: 1;
}

.preset-delete-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 999px;
  border: 1.5px solid color-mix(in srgb, var(--color-danger) 30%, transparent);
  background: color-mix(in srgb, var(--color-danger) 10%, transparent);
  color: var(--color-danger);
  font-size: 1rem;
  cursor: pointer;
  transition:
    background 120ms ease,
    border-color 120ms ease;
  flex-shrink: 0;
}

.preset-delete-btn:hover:not(:disabled) {
  background: color-mix(in srgb, var(--color-danger) 18%, transparent);
  border-color: var(--color-danger);
}

.preset-delete-btn:disabled {
  opacity: 0.35;
  cursor: default;
}

@media screen and (max-width: 490px) {
  .preset-edit-btn {
    min-height: 44px;
    height: 44px;
    padding: 0 0.9rem;
  }

  .preset-delete-btn {
    width: 44px;
    height: 44px;
  }
}

/* Delete confirm */
.preset-delete-confirm {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.btn-secondary--compact {
  padding-inline: 0.75rem;
  padding-block: 0.3rem;
  font-size: 0.78rem;
  color: white;
  margin: 0;
}

.preset-delete-confirm-btn {
  border-radius: 999px;
}

.preset-delete-confirm-btn:hover {
  background: var(--color-danger);
}

.preset-delete-cancel-btn {
  border-radius: 999px;
  padding: 0.3rem 0.65rem;
  font-size: 0.72rem;
  border: 1px solid var(--color-border-strong);
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  font-family: inherit;
  transition:
    background 120ms ease,
    color 120ms ease;
}

.preset-delete-cancel-btn:hover {
  background: var(--color-text-muted);
  color: var(--color-text-on-primary);
}

@media screen and (max-width: 490px) {
  .preset-delete-confirm-btn,
  .preset-delete-cancel-btn {
    height: 44px;
  }
}

/* Phase values row */
.preset-phases {
  display: flex;
  align-items: stretch;
}

.phase-cell {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  padding: 0.45rem 0.2rem;
  border-radius: 0.5rem;
  margin: 0 0.2rem;
}

.phase-cell--tinted {
  background: color-mix(in srgb, var(--color-primary) 12%, transparent);
}

.phase-value {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--color-primary);
  font-variant-numeric: tabular-nums;
}

.phase-label {
  font-size: 0.85rem;
  text-transform: lowercase;
  letter-spacing: 0.1em;
  color: var(--color-text-muted);
}

/* ── Outline button ── */

.btn-outline {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  border: 1.5px solid var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 10%, transparent);
  color: var(--color-primary);
  font-size: 0.85rem;
  font-weight: 500;
  padding: 0.45rem 1.1rem;
  cursor: pointer;
  font-family: inherit;
  transition: background 120ms ease;
  text-decoration: none;
}

.btn-outline:hover {
  background: color-mix(in srgb, var(--color-primary) 18%, transparent);
}

.btn-outline--full {
  width: 100%;
  padding: 0.85rem 1rem;
  font-size: 0.95rem;
}

/* Desktop New Preset button: inline in header */
.new-preset-desktop {
  display: none;
}

@media screen and (min-width: 600px) {
  .new-preset-desktop {
    display: inline-flex;
  }
}

/* Mobile sticky New Preset button */
.new-preset-mobile {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 1rem 1.5rem 1.75rem;
  background: linear-gradient(to top, var(--color-page-bg) 55%, transparent);
  z-index: 100;
}

@media screen and (min-width: 600px) {
  .new-preset-mobile {
    display: none;
  }
}

/* ── Modal ── */

.modal-overlay {
  position: fixed;
  inset: 0;
  background: var(--color-modal-overlay);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: var(--color-modal-bg);
  border-radius: 1.25rem 1.25rem 0 0;
  padding: 1.5rem 1.5rem 2.5rem;
  width: 100%;
  max-height: 88vh;
  overflow-y: auto;
  box-shadow: 0 -20px 60px rgba(0, 0, 0, 0.4);
  border: 1px solid var(--color-border-soft);
  border-bottom: none;
}

@media screen and (min-width: 600px) {
  .modal-overlay {
    align-items: center;
    padding: 1.5rem;
  }

  .modal {
    border-radius: 1.25rem;
    max-width: 480px;
    max-height: unset;
    border-bottom: 1px solid var(--color-border-soft);
  }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.modal-title-label {
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--color-primary);
}

.modal-close-btn {
  font-size: 0.9rem;
  color: var(--color-text-muted);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 0.4rem;
  line-height: 1;
  font-family: inherit;
  transition: color 120ms ease;
}

.modal-close-btn:hover {
  color: var(--color-text-main);
}

.modal-section {
  margin-bottom: 1.1rem;
}

.modal-section-label {
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.phase-durations-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
  padding-top: 0.95rem;
  margin-bottom: 0.875rem;
}

.decimal-hint {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  white-space: nowrap;
}

.stepper-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.modal-submit-btn {
  width: 100%;
  margin: 0.75rem 0 0;
}
</style>
