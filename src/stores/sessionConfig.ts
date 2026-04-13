import { ref } from 'vue'
import { defineStore } from 'pinia'

const SELECTED_PRESET_STORAGE_KEY = 'breathing_selected_preset_v1'
const DEFAULT_PRESET_ID = 'box_default'

const readStoredPresetId = (): string | null => {
  try {
    const value = window.localStorage.getItem(SELECTED_PRESET_STORAGE_KEY)
    return value || DEFAULT_PRESET_ID
  } catch {
    return DEFAULT_PRESET_ID
  }
}

const persistPresetId = (id: string | null) => {
  try {
    if (id) {
      window.localStorage.setItem(SELECTED_PRESET_STORAGE_KEY, id)
      return
    }
    window.localStorage.removeItem(SELECTED_PRESET_STORAGE_KEY)
  } catch {
    // Ignore storage failures to keep the session usable.
  }
}

export const useSessionConfigStore = defineStore('sessionConfig', () => {
  const selectedPresetId = ref<string | null>(readStoredPresetId())

  function setSelectedPresetId(id: string | null) {
    selectedPresetId.value = id
    persistPresetId(id)
  }

  return {
    selectedPresetId,
    setSelectedPresetId,
  }
})
