<script setup lang="ts">
import { type Component } from 'vue'
import { useCvStore } from '@/stores/cv'
import { useToast } from '@/composables/useToast'
import CvStepper from './CvStepper.vue'
import PersonalStep from './steps/PersonalStep.vue'
import ExperienceStep from './steps/ExperienceStep.vue'
import EducationStep from './steps/EducationStep.vue'
import LanguagesStep from './steps/LanguagesStep.vue'
import SkillsStep from './steps/SkillsStep.vue'
import CompletionStep from './steps/CompletionStep.vue'

const emit = defineEmits(['download'])

const cv = useCvStore()
const { show } = useToast()

const stepComponents: Record<number, Component> = {
  1: PersonalStep,
  2: ExperienceStep,
  3: EducationStep,
  4: LanguagesStep,
  5: SkillsStep,
}

function tryGo(target: number) {
  // Going backwards is always allowed; forward requires a valid current step.
  if (target < cv.currentStep) {
    cv.clearErrors()
    cv.goToStep(target)
    return
  }
  if (cv.validateStep(cv.currentStep)) cv.goToStep(target)
}

function next() {
  tryGo(cv.currentStep + 1)
}
function prev() {
  cv.clearErrors()
  cv.goToStep(Math.max(1, cv.currentStep - 1))
}
function finish() {
  if (cv.validateStep(cv.currentStep)) {
    cv.goToStep(6)
    show('¡Currículum generado exitosamente!')
  }
}
</script>

<template>
  <div class="flex h-full flex-col overflow-y-auto p-5">
    <CvStepper v-if="cv.currentStep <= 5" :current-step="cv.currentStep" @goto="tryGo" />

    <div class="flex-1">
      <component
        :is="stepComponents[cv.currentStep]"
        v-if="cv.currentStep <= 5"
      />
      <CompletionStep v-else @download="emit('download')" @edit="cv.goToStep(1)" />
    </div>

    <!-- Navigation -->
    <div v-if="cv.currentStep <= 5" class="mt-6 flex justify-between gap-3">
      <button
        v-if="cv.currentStep > 1"
        class="rounded-lg border border-[#1e293b] px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/5"
        @click="prev"
      >
        <i class="fas fa-arrow-left"></i> Anterior
      </button>
      <span v-else></span>

      <button v-if="cv.currentStep < 5" class="btn-primary" @click="next">
        Siguiente <i class="fas fa-arrow-right"></i>
      </button>
      <button v-else class="btn-primary" @click="finish">
        <i class="fas fa-check-double"></i> Finalizar y Ver CV
      </button>
    </div>
  </div>
</template>
