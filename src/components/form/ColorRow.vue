<script setup lang="ts">
import { ref, watch } from 'vue'
import { HEX_RE } from '@/shared/constants/palettes'

const props = defineProps({
  label: { type: String, required: true },
  modelValue: { type: String, required: true },
})
const emit = defineEmits(['update:modelValue'])

const localHex = ref(props.modelValue.toUpperCase())
const error = ref('')

// Keep the local field in sync when the value changes from outside
// (e.g. switching the draft theme reloads the palette).
watch(
  () => props.modelValue,
  (v) => {
    localHex.value = String(v).toUpperCase()
    error.value = ''
  },
)

function onPicker(e: Event) {
  const hex = (e.target as HTMLInputElement).value.toUpperCase()
  localHex.value = hex
  error.value = ''
  emit('update:modelValue', hex)
}

function onHexInput(e: Event) {
  const rawValue = (e.target as HTMLInputElement).value
  let val = rawValue.trim()
  if (val && !val.startsWith('#')) val = '#' + val
  localHex.value = rawValue
  if (HEX_RE.test(val)) {
    error.value = ''
    emit('update:modelValue', val.toUpperCase())
  } else {
    error.value = 'Color inválido. Usa un hex como #3366FF.'
  }
}

function onBlur() {
  if (error.value) {
    localHex.value = String(props.modelValue).toUpperCase()
    error.value = ''
  }
}
</script>

<template>
  <div class="flex flex-col gap-1 border-b border-[#182234] py-2 last:border-0">
    <div class="flex items-center justify-between gap-3">
      <span class="text-[0.82rem] text-slate-300">{{ label }}</span>
      <div class="flex items-center gap-2">
        <input
          type="color"
          class="h-8 w-9 cursor-pointer rounded border border-[#1e293b] bg-transparent p-0.5"
          :value="modelValue"
          @input="onPicker"
        />
        <input
          type="text"
          maxlength="7"
          class="w-24 rounded border bg-[#0b0f17] px-2 py-1 text-sm text-white outline-none"
          :class="error ? 'border-red-500' : 'border-[#1e293b] focus:border-[#c5a059]'"
          :value="localHex"
          @input="onHexInput"
          @blur="onBlur"
        />
      </div>
    </div>
    <span v-if="error" class="text-xs text-red-400">{{ error }}</span>
  </div>
</template>
