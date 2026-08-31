<script setup lang="ts">
export interface SegmentedOption {
  value: string
  label?: string
  icon?: string
}

withDefaults(
  defineProps<{
    modelValue: string
    options: SegmentedOption[]
    size?: 'sm' | 'md'
  }>(),
  { size: 'md' },
)
defineEmits<{ 'update:modelValue': [value: string] }>()
</script>

<template>
  <div class="inline-flex gap-1 rounded-lg border border-[#c5a059]/20 bg-white/5 p-1">
    <button
      v-for="opt in options"
      :key="opt.value"
      type="button"
      class="inline-flex items-center gap-1.5 rounded-md font-semibold transition"
      :class="[
        size === 'sm' ? 'px-3 py-1 text-xs' : 'px-4 py-1.5 text-sm',
        modelValue === opt.value
          ? 'bg-gradient-to-br from-[#c5a059] to-[#b38e44] text-[#0f172a]'
          : 'text-slate-400 hover:bg-white/5 hover:text-white',
      ]"
      @click="$emit('update:modelValue', opt.value)"
    >
      <i v-if="opt.icon" class="fas" :class="opt.icon"></i>
      <span v-if="opt.label">{{ opt.label }}</span>
    </button>
  </div>
</template>
