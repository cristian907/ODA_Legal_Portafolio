<script setup lang="ts">
import { ref } from 'vue'
import LevelSelector from './LevelSelector.vue'
import type { CvLeveledItem } from '@/types/cv'

withDefaults(
  defineProps<{
    label: string
    icon: string
    items: CvLeveledItem[]
    placeholder?: string
  }>(),
  { placeholder: '' },
)
const emit = defineEmits<{
  add: [payload: { name: string; level: number }]
  remove: [id: string]
}>()

const newName = ref('')
const newLevel = ref(5)

function add() {
  if (!newName.value.trim()) return
  emit('add', { name: newName.value, level: newLevel.value })
  newName.value = ''
  newLevel.value = 5
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <span class="flex items-center gap-2 text-sm text-slate-300">
      <i class="fas" :class="icon"></i> {{ label }}
    </span>

    <div class="flex flex-col gap-2 rounded-lg border border-[#1f2937] bg-[#111827] p-3">
      <input
        v-model="newName"
        type="text"
        class="rounded border border-[#1e293b] bg-[#0b0f17] px-2.5 py-1.5 text-sm text-white outline-none focus:border-[#c5a059]"
        :placeholder="placeholder"
        @keydown.enter.prevent="add"
      />
      <div class="flex items-center justify-between gap-2">
        <span class="text-xs text-slate-500">Nivel (1-5):</span>
        <LevelSelector v-model="newLevel" />
        <button
          class="rounded bg-[#c5a059] px-3 py-1 text-xs font-semibold text-[#0f172a] transition hover:bg-[#b38e44]"
          @click="add"
        >
          <i class="fas fa-plus"></i> Añadir
        </button>
      </div>
    </div>

    <p v-if="items.length === 0" class="text-xs text-slate-500">Nada agregado todavía.</p>

    <div
      v-for="item in items"
      :key="item.id"
      class="flex items-center gap-2 rounded-lg border border-[#1e293b] bg-[#0f172a] px-3 py-2"
    >
      <input
        v-model="item.name"
        type="text"
        class="flex-1 rounded border border-transparent bg-transparent px-1 py-0.5 text-sm text-white outline-none focus:border-[#1e293b]"
      />
      <LevelSelector v-model="item.level" />
      <button class="text-slate-500 transition hover:text-red-400" @click="emit('remove', item.id)">
        <i class="fas fa-trash-alt"></i>
      </button>
    </div>
  </div>
</template>
