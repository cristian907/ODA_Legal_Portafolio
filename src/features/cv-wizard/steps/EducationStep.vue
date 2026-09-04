<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useCvStore } from '@/stores/cv'

const cv = useCvStore()
const PAGE_SIZE = 2
const page = ref(1)

const eduList = computed(() => cv.cvData.education)
const total = computed(() => eduList.value.length)
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / PAGE_SIZE)))

watch(totalPages, (max) => {
  if (page.value > max) page.value = max
})

const paginatedEducations = computed(() => {
  const start = (page.value - 1) * PAGE_SIZE
  return eduList.value.slice(start, start + PAGE_SIZE)
})

function addAndGo() {
  cv.addEducation()
  page.value = Math.ceil(cv.cvData.education.length / PAGE_SIZE)
}

function remove(id: string) {
  cv.removeEducation(id)
}

const inputClass =
  'w-full rounded-lg border border-[#1e293b] bg-[#0b0f17] px-3 py-1.5 text-sm text-white outline-none focus:border-[#c5a059]'
</script>

<template>
  <div class="flex flex-col gap-3">
    <!-- Section Header & Add Button -->
    <div class="flex items-center justify-between">
      <span class="flex items-center gap-2 font-semibold text-white">
        <i class="fas fa-graduation-cap text-[#c5a059]"></i> Formación Académica ({{ total }})
      </span>
      <button
        class="flex items-center gap-1.5 rounded-lg border border-[#c5a059]/40 bg-[#c5a059]/10 px-2.5 py-1 text-xs font-semibold text-[#c5a059] transition hover:bg-[#c5a059]/20"
        @click="addAndGo"
      >
        <i class="fas fa-plus"></i> Agregar Formación
      </button>
    </div>

    <!-- Empty State -->
    <div
      v-if="total === 0"
      class="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-[#1e293b] p-8 text-center"
    >
      <i class="fas fa-graduation-cap text-3xl text-slate-600"></i>
      <p class="text-sm text-slate-400">No hay estudios o títulos registrados.</p>
      <button class="btn-primary text-xs py-2 px-4" @click="addAndGo">
        <i class="fas fa-plus-circle"></i> Agregar Primera Formación
      </button>
    </div>

    <template v-else>
      <!-- Cards List (2 per page) -->
      <div class="flex flex-col gap-3">
        <div
          v-for="(edu, localIdx) in paginatedEducations"
          :key="edu.id"
          class="relative flex flex-col gap-2.5 rounded-lg border bg-[#0b0f17]/60 p-3"
          :class="cv.errors[edu.id] ? 'border-red-500' : 'border-[#1e293b]'"
        >
          <div class="flex items-center justify-between border-b border-[#1e293b] pb-1.5">
            <span class="text-xs font-semibold text-[#c5a059]">
              Formación #{{ (page - 1) * PAGE_SIZE + localIdx + 1 }}
            </span>
            <button
              class="flex items-center gap-1 text-xs text-slate-400 transition hover:text-red-400"
              title="Eliminar"
              @click="remove(edu.id)"
            >
              <i class="fas fa-trash-alt text-xs"></i> Eliminar
            </button>
          </div>

          <label class="flex flex-col gap-1 text-xs text-slate-300">
            Institución / Universidad
            <input
              v-model="edu.institution"
              type="text"
              :class="inputClass"
              placeholder="Ej. Universidad Ensigna"
              @blur="cv.validateField(3, edu.id)"
            />
          </label>

          <label class="flex flex-col gap-1 text-xs text-slate-300">
            Carrera / Título Obtenido
            <input
              v-model="edu.degree"
              type="text"
              :class="inputClass"
              placeholder="Ej. Ingeniería en sistemas"
              @blur="cv.validateField(3, edu.id)"
            />
          </label>

          <div class="grid grid-cols-2 gap-2">
            <label class="flex flex-col gap-1 text-xs text-slate-300">
              Año Inicio
              <input
                v-model="edu.startDate"
                type="text"
                maxlength="4"
                :class="inputClass"
                placeholder="Ej. 2018"
                @blur="cv.validateField(3, edu.id)"
              />
            </label>
            <label class="flex flex-col gap-1 text-xs text-slate-300">
              Año Fin
              <input
                v-model="edu.endDate"
                type="text"
                maxlength="8"
                :class="inputClass"
                placeholder="Ej. 2023 o Actual"
                @blur="cv.validateField(3, edu.id)"
              />
            </label>
          </div>

          <span v-if="cv.errors[edu.id]" class="text-xs text-red-400">
            {{ cv.errors[edu.id] }}
          </span>
        </div>
      </div>

      <!-- Pagination Bar (when total > 2) -->
      <div
        v-if="totalPages > 1"
        class="flex items-center justify-between rounded-lg border border-[#1e293b] bg-[#0b0f17] px-3 py-1.5 text-xs text-slate-300"
      >
        <button
          :disabled="page === 1"
          class="flex items-center gap-1 font-medium transition disabled:opacity-30 hover:text-white"
          @click="page--"
        >
          <i class="fas fa-chevron-left"></i> Anterior
        </button>

        <div class="flex items-center gap-1.5">
          <button
            v-for="pNum in totalPages"
            :key="pNum"
            class="flex h-6 min-w-6 items-center justify-center rounded px-1.5 font-bold transition"
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
          Siguiente <i class="fas fa-chevron-right"></i>
        </button>
      </div>
    </template>
  </div>
</template>
