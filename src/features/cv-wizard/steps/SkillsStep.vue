<script setup lang="ts">
import { ref } from 'vue'
import { useCvStore } from '@/stores/cv'
import LeveledEditor from '../LeveledEditor.vue'

const cv = useCvStore()
const internalPage = ref<1 | 2>(1)
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <span class="flex items-center gap-2 font-semibold text-white">
        <i class="fas fa-sliders-h text-[#c5a059]"></i> Competencias y Habilidades
      </span>
      <span class="text-xs text-slate-400">
        Pág. {{ internalPage }} de 2
      </span>
    </div>

    <!-- Sub-page Navigation Tabs -->
    <div class="flex rounded-lg border border-[#1e293b] bg-[#0b0f17] p-1 text-xs">
      <button
        class="flex-1 flex items-center justify-center gap-1.5 rounded-md py-1.5 font-medium transition"
        :class="
          internalPage === 1
            ? 'bg-[#c5a059] text-[#0f172a] font-semibold'
            : 'text-slate-400 hover:text-white'
        "
        @click="internalPage = 1"
      >
        <i class="fas fa-laptop-code"></i> 1. Competencias ({{ cv.cvData.competencies.length }})
      </button>
      <button
        class="flex-1 flex items-center justify-center gap-1.5 rounded-md py-1.5 font-medium transition"
        :class="
          internalPage === 2
            ? 'bg-[#c5a059] text-[#0f172a] font-semibold'
            : 'text-slate-400 hover:text-white'
        "
        @click="internalPage = 2"
      >
        <i class="fas fa-brain"></i> 2. Habilidades ({{ cv.cvData.skills.length }})
      </button>
    </div>

    <!-- PÁGINA INTERNA 1: COMPETENCIAS (SOFTWARE / TÉCNICAS) -->
    <div v-if="internalPage === 1" class="flex flex-col gap-3">
      <LeveledEditor
        label="Competencias (Software / Técnicas — Nivel 1 a 5)"
        icon="fa-laptop-code"
        :items="cv.cvData.competencies"
        placeholder="Nombre de competencia (Ej. Software 01)"
        @add="cv.addCompetency($event.name, $event.level)"
        @remove="cv.removeCompetency($event)"
      />

      <div class="flex justify-end pt-2">
        <button
          class="flex items-center gap-1.5 rounded-lg border border-[#c5a059]/40 bg-[#c5a059]/10 px-3 py-1.5 text-xs font-semibold text-[#c5a059] transition hover:bg-[#c5a059]/20"
          @click="internalPage = 2"
        >
          Ir a Habilidades <i class="fas fa-arrow-right text-[10px]"></i>
        </button>
      </div>
    </div>

    <!-- PÁGINA INTERNA 2: HABILIDADES (PERSONALES) -->
    <div v-else class="flex flex-col gap-3">
      <LeveledEditor
        label="Habilidades (Personales — 1 a 5 Puntos)"
        icon="fa-brain"
        :items="cv.cvData.skills"
        placeholder="Nombre de habilidad (Ej. Liderazgo, Creatividad)"
        @add="cv.addSkill($event.name, $event.level)"
        @remove="cv.removeSkill($event)"
      />

      <div class="flex justify-start pt-2">
        <button
          class="flex items-center gap-1.5 text-xs text-slate-400 transition hover:text-[#c5a059]"
          @click="internalPage = 1"
        >
          <i class="fas fa-arrow-left text-[10px]"></i> Volver a Competencias
        </button>
      </div>
    </div>
  </div>
</template>
