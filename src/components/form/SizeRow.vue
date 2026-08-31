<script setup lang="ts">
const props = defineProps({
  label: { type: String, required: true },
  modelValue: { type: Number, required: true },
  min: { type: Number, required: true },
  max: { type: Number, required: true },
})
const emit = defineEmits(['update:modelValue'])

function clamp(v: number) {
  if (Number.isNaN(v)) return props.min
  return Math.min(Math.max(v, props.min), props.max)
}

function onRange(e: Event) {
  emit('update:modelValue', clamp(parseInt((e.target as HTMLInputElement).value, 10)))
}
function onNumber(e: Event) {
  const raw = parseInt((e.target as HTMLInputElement).value, 10)
  if (Number.isNaN(raw)) return
  emit('update:modelValue', Math.min(raw, props.max))
}
function onBlur(e: Event) {
  emit('update:modelValue', clamp(parseInt((e.target as HTMLInputElement).value, 10)))
}
</script>

<template>
  <div class="flex items-center gap-3 py-1.5">
    <span class="w-20 shrink-0 text-[0.82rem] text-slate-300">{{ label }}</span>
    <input
      type="range"
      class="flex-1 accent-[#c5a059]"
      :min="min"
      :max="max"
      :value="modelValue"
      @input="onRange"
    />
    <input
      type="number"
      class="w-16 rounded border border-[#1e293b] bg-[#0b0f17] px-2 py-1 text-sm text-white outline-none focus:border-[#c5a059]"
      :min="min"
      :max="max"
      :value="modelValue"
      @input="onNumber"
      @blur="onBlur"
    />
  </div>
</template>
