<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps({
  currentStep: { type: Number, required: true },
})
defineEmits(['goto'])

const steps = [
  { step: 1, label: 'Personal' },
  { step: 2, label: 'Experiencia' },
  { step: 3, label: 'Educación' },
  { step: 4, label: 'Idiomas' },
  { step: 5, label: 'Habilidades' },
]

const TOTAL = 5
const progress = computed(
  () => (Math.min(Math.max(props.currentStep, 1), TOTAL) - 1) / (TOTAL - 1) * 100,
)
</script>

<template>
  <div class="relative mb-6 flex justify-between">
    <!-- Track + progress -->
    <div class="absolute left-0 right-0 top-4 h-0.5 bg-[#1e293b]"></div>
    <div
      class="absolute left-0 top-4 h-0.5 bg-[#c5a059] transition-all"
      :style="{ width: progress + '%' }"
    ></div>

    <button
      v-for="node in steps"
      :key="node.step"
      type="button"
      class="relative z-10 flex flex-col items-center gap-1.5"
      @click="$emit('goto', node.step)"
    >
      <span
        class="flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-bold transition"
        :class="
          node.step === currentStep
            ? 'border-[#c5a059] bg-[#c5a059] text-[#0f172a]'
            : node.step < currentStep
              ? 'border-[#c5a059] bg-[#c5a059]/20 text-[#e5be48]'
              : 'border-[#1e293b] bg-[#0b0f17] text-slate-500'
        "
      >
        <i v-if="node.step < currentStep" class="fas fa-check text-xs"></i>
        <template v-else>{{ node.step }}</template>
      </span>
      <span
        class="text-[0.7rem] font-medium"
        :class="node.step === currentStep ? 'text-white' : 'text-slate-500'"
      >
        {{ node.label }}
      </span>
    </button>
  </div>
</template>
