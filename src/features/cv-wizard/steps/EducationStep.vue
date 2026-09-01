<script setup lang="ts">
import { useCvStore } from '@/stores/cv'

const cv = useCvStore()

const inputClass =
  'w-full rounded-lg border border-[#1e293b] bg-[#0b0f17] px-3 py-2 text-sm text-white outline-none focus:border-[#c5a059]'
</script>

<template>
  <div class="flex flex-col gap-4">
    <span class="flex items-center gap-2 font-semibold text-white">
      <i class="fas fa-graduation-cap text-[#c5a059]"></i> Formación Académica
    </span>

    <p v-if="cv.cvData.education.length === 0" class="text-sm text-slate-500">
      No hay estudios agregados.
    </p>

    <div
      v-for="edu in cv.cvData.education"
      :key="edu.id"
      class="relative flex flex-col gap-3 rounded-lg border p-3"
      :class="cv.errors[edu.id] ? 'border-red-500' : 'border-[#1e293b]'"
    >
      <button
        class="absolute right-2 top-2 text-slate-500 transition hover:text-red-400"
        title="Eliminar"
        @click="cv.removeEducation(edu.id)"
      >
        <i class="fas fa-trash-alt"></i>
      </button>

      <label class="flex flex-col gap-1 text-sm text-slate-300">
        Institución / Universidad
        <input
          v-model="edu.institution"
          type="text"
          :class="inputClass"
          placeholder="Ej. Universidad Ensigna"
          @blur="cv.validateField(3, edu.id)"
        />
      </label>
      <label class="flex flex-col gap-1 text-sm text-slate-300">
        Carrera / Título Obtenido
        <input
          v-model="edu.degree"
          type="text"
          :class="inputClass"
          placeholder="Ej. Ingeniería en sistemas"
          @blur="cv.validateField(3, edu.id)"
        />
      </label>
      <div class="grid grid-cols-2 gap-3">
        <label class="flex flex-col gap-1 text-sm text-slate-300">
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
        <label class="flex flex-col gap-1 text-sm text-slate-300">
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
      <span v-if="cv.errors[edu.id]" class="text-xs text-red-400">{{ cv.errors[edu.id] }}</span>
    </div>

    <button
      class="rounded-lg border border-dashed border-[#c5a059]/50 py-2 text-sm font-semibold text-[#c5a059] transition hover:bg-[#c5a059]/10"
      @click="cv.addEducation()"
    >
      <i class="fas fa-plus-circle"></i> Agregar Formación
    </button>
  </div>
</template>
