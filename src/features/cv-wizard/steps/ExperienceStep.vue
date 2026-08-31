<script setup lang="ts">
import { useCvStore } from '@/stores/cv'

const cv = useCvStore()

const inputClass =
  'w-full rounded-lg border border-[#1e293b] bg-[#0b0f17] px-3 py-2 text-sm text-white outline-none focus:border-[#c5a059]'
</script>

<template>
  <div class="flex flex-col gap-4">
    <span class="flex items-center gap-2 font-semibold text-white">
      <i class="fas fa-briefcase text-[#c5a059]"></i> Experiencia Laboral
    </span>

    <p v-if="cv.cvData.experience.length === 0" class="text-sm text-slate-500">
      No hay experiencias agregadas.
    </p>

    <div
      v-for="exp in cv.cvData.experience"
      :key="exp.id"
      class="relative flex flex-col gap-3 rounded-lg border p-3"
      :class="cv.errors[exp.id] ? 'border-red-500' : 'border-[#1e293b]'"
    >
      <button
        class="absolute right-2 top-2 text-slate-500 transition hover:text-red-400"
        title="Eliminar"
        @click="cv.removeExperience(exp.id)"
      >
        <i class="fas fa-trash-alt"></i>
      </button>

      <label class="flex flex-col gap-1 text-sm text-slate-300">
        Empresa / Cargo <span class="text-red-400">*</span>
        <input v-model="exp.title" type="text" :class="inputClass" placeholder="Ej. Multinacional González" />
      </label>
      <div class="grid grid-cols-2 gap-3">
        <label class="flex flex-col gap-1 text-sm text-slate-300">
          Año Inicio
          <input v-model="exp.startDate" type="text" :class="inputClass" placeholder="Ej. 2019" @blur="cv.validateField(2, exp.id)" />
        </label>
        <label class="flex flex-col gap-1 text-sm text-slate-300">
          Año Fin
          <input v-model="exp.endDate" type="text" :class="inputClass" placeholder="Ej. 2023 o Actual" @blur="cv.validateField(2, exp.id)" />
        </label>
      </div>
      <span v-if="cv.errors[exp.id]" class="text-xs text-red-400">{{ cv.errors[exp.id] }}</span>
      <label class="flex flex-col gap-1 text-sm text-slate-300">
        Descripción
        <textarea v-model="exp.desc" rows="2" :class="[inputClass, 'resize-none']" placeholder="Breve descripción de funciones y logros..."></textarea>
      </label>
    </div>

    <button
      class="rounded-lg border border-dashed border-[#c5a059]/50 py-2 text-sm font-semibold text-[#c5a059] transition hover:bg-[#c5a059]/10"
      @click="cv.addExperience()"
    >
      <i class="fas fa-plus-circle"></i> Agregar Experiencia
    </button>
  </div>
</template>
