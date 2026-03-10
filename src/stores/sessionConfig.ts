import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useSessionConfigStore = defineStore('sessionConfig', () => {
  const selectedPresetId = ref<string | null>(null)

  function setSelectedPresetId(id: string | null) {
    selectedPresetId.value = id
  }

  return {
    selectedPresetId,
    setSelectedPresetId,
  }
})

