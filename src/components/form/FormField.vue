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

@media screen and (max-width: 490px) {
  .field-input {
    padding: 0.7rem 0.6rem;
  }
}
</style>
