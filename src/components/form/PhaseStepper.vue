<template>
  <div class="stepper">
    <span class="stepper-label">{{ label }}</span>
    <div class="stepper-controls">
      <button type="button" class="stepper-btn stepper-btn--dec" @click="decrement">−</button>
      <div class="stepper-value-wrapper">
        <input
          :value="modelValue"
          class="stepper-value"
          type="number"
          inputmode="decimal"
          :min="min"
          :max="max"
          step="0.1"
          @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
          @blur="$emit('blur')"
          @beforeinput="$emit('beforeinput', $event as InputEvent)"
          @paste="$emit('paste', $event as ClipboardEvent)"
        />
      </div>
      <button type="button" class="stepper-btn stepper-btn--inc" @click="increment">+</button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({ inheritAttrs: false })

const props = defineProps<{
  label: string
  modelValue: string | number
  min?: number
  max?: number
}>()

const emit = defineEmits<{
  "update:modelValue": [value: string | number]
  blur: []
  beforeinput: [event: InputEvent]
  paste: [event: ClipboardEvent]
}>()

function decrement() {
  const min = props.min ?? 0
  const current = Number(props.modelValue)
  if (!isFinite(current)) return
  emit("update:modelValue", Math.max(min, Math.round((current - 1) * 10) / 10))
}

function increment() {
  const max = props.max ?? 60
  const current = Number(props.modelValue)
  if (!isFinite(current)) return
  emit("update:modelValue", Math.min(max, Math.round((current + 1) * 10) / 10))
}
</script>

<style scoped>
.stepper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.stepper-label {
  font-family: "DM Mono", monospace;
  font-size: 0.75rem;
  color: var(--color-text-muted);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  width: 3.25rem;
  flex-shrink: 0;
}

.stepper-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: auto;
}

.stepper-btn {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.625rem;
  border: 1.5px solid var(--color-border-soft);
  background: var(--color-input-bg);
  font-size: 1.125rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-family: "DM Sans", sans-serif;
  line-height: 1;
  transition:
    background 120ms ease,
    border-color 120ms ease;
}

.stepper-btn--dec {
  color: var(--color-text-muted);
}

.stepper-btn--dec:hover {
  border-color: var(--color-border-strong);
  background: color-mix(in srgb, var(--color-text-muted) 10%, transparent);
}

.stepper-btn--inc {
  color: var(--color-primary);
}

.stepper-btn--inc:hover {
  border-color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 10%, transparent);
}

.stepper-value-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 4.75rem;
  height: 2.5rem;
  background: var(--color-input-bg);
  border: 1.5px solid color-mix(in srgb, var(--color-primary) 55%, transparent);
  border-radius: 0.625rem;
}

.stepper-value-wrapper:focus-within {
  outline: 2px solid var(--color-primary);
  outline-offset: 1px;
}

.stepper-value-wrapper::after {
  content: "s";
  font-family: "DM Mono", monospace;
  font-size: 1rem;
  font-weight: 500;
  color: var(--color-primary);
  pointer-events: none;
}

.stepper-value {
  width: 2.5rem;
  height: 100%;
  background: transparent;
  border: none;
  outline: none;
  font-family: "DM Mono", monospace;
  font-size: 1rem;
  font-weight: 500;
  color: var(--color-primary);
  text-align: right;
  padding: 0;
  appearance: textfield;
  -moz-appearance: textfield;
}

.stepper-value::-webkit-inner-spin-button,
.stepper-value::-webkit-outer-spin-button {
  -webkit-appearance: none;
}
</style>
