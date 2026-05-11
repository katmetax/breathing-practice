<template>
  <label class="field" :class="{ 'field--stacked': stacked }">
    <span class="field-label">{{ label }}</span>
    <input
      ref="inputRef"
      v-bind="$attrs"
      :value="modelValue"
      class="field-input"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
  </label>
</template>

<script setup lang="ts">
import { ref } from "vue"

defineOptions({ inheritAttrs: false })

defineProps<{
  label: string
  modelValue: string | number
  stacked?: boolean
}>()

defineEmits<{
  "update:modelValue": [value: string | number]
}>()

const inputRef = ref<HTMLInputElement | null>(null)

defineExpose({ focus: () => inputRef.value?.focus() })
</script>

<style scoped>
.field {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 1rem;
}

.field-label {
  flex: 0 0 50%;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: var(--color-text-muted);
}

.field-input {
  flex: 0 0 50%;
  background: var(--color-input-bg);
  border-radius: 0.65rem;
  border: 1.5px solid color-mix(in srgb, var(--color-primary) 55%, transparent);
  padding: 0.65rem 0.85rem;
  color: var(--color-text-main);
  font-size: 1rem;
}

.field--stacked {
  flex-direction: column;
  align-items: stretch;
  gap: 0.4rem;
}

.field--stacked .field-label,
.field--stacked .field-input {
  flex: unset;
  width: 100%;
}

.field-input:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 1px;
}
</style>
