<template>
  <label class="field">
    <span class="field-label">{{ label }}</span>
    <input
      v-bind="$attrs"
      :value="modelValue"
      class="field-input"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
  </label>
</template>

<script setup lang="ts">
defineOptions({ inheritAttrs: false })

defineProps<{
  label: string
  modelValue: string | number
}>()

defineEmits<{
  'update:modelValue': [value: string | number]
}>()
</script>

<style scoped>
.field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.field-label {
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: var(--color-text-muted);
}

.field-input {
  background: var(--color-input-bg);
  border-radius: 0.65rem;
  border: 1.5px solid color-mix(in srgb, var(--color-primary) 55%, transparent);
  padding: 0.65rem 0.85rem;
  color: var(--color-text-main);
  font-size: 1rem;
}

.field-input:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 1px;
}
</style>
