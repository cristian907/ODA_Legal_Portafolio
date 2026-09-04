<script setup lang="ts">
defineProps({
  modelValue: { type: Number, required: true },
})
defineEmits(['update:modelValue'])
</script>

<template>
  <div class="flex gap-1">
    <button
      v-for="lvl in 5"
      :key="lvl"
      type="button"
      class="h-6 w-6 rounded text-xs font-bold transition"
      :class="
        modelValue === lvl
          ? 'bg-[#c5a059] text-[#0f172a]'
          : 'bg-[#1e293b] text-slate-400 hover:bg-[#273449]'
      "
      @click="$emit('update:modelValue', lvl)"
    >
      {{ lvl }}
    </button>
  </div>
</template>
