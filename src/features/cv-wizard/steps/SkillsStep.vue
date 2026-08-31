<script setup lang="ts">
import { useCvStore } from '@/stores/cv'
import LeveledEditor from '../LeveledEditor.vue'

const cv = useCvStore()
</script>

<template>
  <div class="flex flex-col gap-6">
    <span class="flex items-center gap-2 font-semibold text-white">
      <i class="fas fa-sliders-h text-[#c5a059]"></i> Competencias y Habilidades
    </span>

    <LeveledEditor
      label="Competencias (Software / Técnicas — Nivel 1 a 5)"
      icon="fa-laptop-code"
      :items="cv.cvData.competencies"
      placeholder="Nombre de competencia (Ej. Software 01)"
      @add="cv.addCompetency($event.name, $event.level)"
      @remove="cv.removeCompetency($event)"
    />

    <LeveledEditor
      label="Habilidades (Personales — 1 a 5 Puntos)"
      icon="fa-brain"
      :items="cv.cvData.skills"
      placeholder="Nombre de habilidad (Ej. Liderazgo, Creatividad)"
      @add="cv.addSkill($event.name, $event.level)"
      @remove="cv.removeSkill($event)"
    />
  </div>
</template>
