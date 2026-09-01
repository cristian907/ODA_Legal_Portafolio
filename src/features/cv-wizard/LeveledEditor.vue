<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import LevelSelector from './LevelSelector.vue'
import type { CvLeveledItem } from '@/types/cv'

const props = withDefaults(
  defineProps<{
    label: string
    icon: string
    items: CvLeveledItem[]
    placeholder?: string
    pageSize?: number
  }>(),
  { placeholder: '', pageSize: 5 },
)

const emit = defineEmits<{
  add: [payload: { name: string; level: number }]
  remove: [id: string]
}>()

const newName = ref('')
const newLevel = ref(5)
const errorMessage = ref('')
const page = ref(1)

const totalPages = computed(() => Math.max(1, Math.ceil(props.items.length / props.pageSize)))

// Adjust page if items length changes
watch(
  () => props.items.length,
  (newLen) => {
    const maxPage = Math.max(1, Math.ceil(newLen / props.pageSize))
    if (page.value > maxPage) page.value = maxPage
  },
)

const paginatedItems = computed(() => {
  const start = (page.value - 1) * props.pageSize
  return props.items.slice(start, start + props.pageSize)
})

function onInput() {
  if (errorMessage.value) errorMessage.value = ''
}

function add() {
  const trimmed = newName.value.trim()
  if (!trimmed) {
    errorMessage.value = 'Introduce un nombre.'
    return
  }

  // Duplicate validation (case-insensitive)
  const isDuplicate = props.items.some(
    (item) => item.name.trim().toLowerCase() === trimmed.toLowerCase(),
  )
  if (isDuplicate) {
    errorMessage.value = 'Este elemento ya ha sido agregado.'
    return
  }

  errorMessage.value = ''
  emit('add', { name: trimmed, level: newLevel.value })
  newName.value = ''
  newLevel.value = 5

  // Navigate to the page with the newly added item
  page.value = Math.ceil((props.items.length + 1) / props.pageSize)
}
</script>

<template>
  <div class="flex flex-col gap-2.5">
    <div class="flex items-center justify-between text-xs text-slate-300">
      <span class="flex items-center gap-2 font-semibold">
        <i class="fas" :class="icon"></i> {{ label }} ({{ items.length }})
      </span>
      <span v-if="totalPages > 1" class="text-slate-400">
        Pág. {{ page }} de {{ totalPages }}
      </span>
    </div>

    <!-- Input Add Card -->
    <div class="flex flex-col gap-2 rounded-lg border border-[#1f2937] bg-[#111827] p-2.5">
      <input
        v-model="newName"
        type="text"
        :class="[
          'rounded border bg-[#0b0f17] px-2.5 py-1.5 text-sm text-white outline-none focus:border-[#c5a059]',
          errorMessage ? 'border-red-500' : 'border-[#1e293b]',
        ]"
        :placeholder="placeholder"
        @input="onInput"
        @keydown.enter.prevent="add"
      />
      <span v-if="errorMessage" class="text-xs text-red-400">{{ errorMessage }}</span>

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

    <!-- Paginated List (5 items per page) -->
    <div v-else class="flex flex-col gap-1.5">
      <div
        v-for="item in paginatedItems"
        :key="item.id"
        class="flex items-center gap-2 rounded-lg border border-[#1e293b] bg-[#0f172a] px-3 py-1.5"
      >
        <input
          v-model="item.name"
          type="text"
          class="flex-1 rounded border border-transparent bg-transparent px-1 py-0.5 text-sm text-white outline-none focus:border-[#1e293b]"
        />
        <LevelSelector v-model="item.level" />
        <button class="text-slate-500 transition hover:text-red-400" title="Eliminar" @click="emit('remove', item.id)">
          <i class="fas fa-trash-alt text-xs"></i>
        </button>
      </div>

      <!-- Pagination Bar for 5 items per page -->
      <div v-if="totalPages > 1" class="flex items-center justify-between rounded-lg border border-[#1e293b] bg-[#0b0f17] px-3 py-1 text-xs text-slate-300 mt-1">
        <button
          :disabled="page === 1"
          class="flex items-center gap-1 font-medium transition disabled:opacity-30 hover:text-white"
          @click="page--"
        >
          <i class="fas fa-chevron-left text-[10px]"></i> Anterior
        </button>

        <div class="flex items-center gap-1">
          <button
            v-for="pNum in totalPages"
            :key="pNum"
            class="flex h-5 w-5 items-center justify-center rounded text-xs font-bold transition"
            :class="
              pNum === page
                ? 'bg-[#c5a059] text-[#0f172a]'
                : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
            "
            @click="page = pNum"
          >
            {{ pNum }}
          </button>
        </div>

        <button
          :disabled="page === totalPages"
          class="flex items-center gap-1 font-medium transition disabled:opacity-30 hover:text-white"
          @click="page++"
        >
          Siguiente <i class="fas fa-chevron-right text-[10px]"></i>
        </button>
      </div>
    </div>
  </div>
</template>
