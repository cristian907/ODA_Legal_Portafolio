<script setup lang="ts">
import { ref } from 'vue'
import { useCvStore } from '@/stores/cv'

const cv = useCvStore()
const input = ref('')
const error = ref('')

function add() {
  error.value = ''
  const trimmed = input.value.trim()
  if (!trimmed) {
    error.value = 'Introduce el nombre del idioma.'
    return
  }
  const ok = cv.addLanguage(trimmed)
  if (ok) {
    input.value = ''
    error.value = ''
  } else {
    error.value = cv.errors.languages || 'El idioma solo debe contener letras (sin números ni caracteres especiales).'
  }
}

function onInput() {
  if (error.value) error.value = ''
  if (cv.errors.languages) cv.setFieldError('languages', null)
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <span class="flex items-center gap-2 font-semibold text-white">
      <i class="fas fa-language text-[#c5a059]"></i> Idiomas
    </span>

    <label class="flex flex-col gap-1 text-sm text-slate-300">
      Agregar Idioma
      <div class="flex gap-2">
        <input
          v-model="input"
          type="text"
          :class="[
            'flex-1 rounded-lg border bg-[#0b0f17] px-3 py-2 text-sm text-white outline-none focus:border-[#c5a059]',
            error || cv.errors.languages ? 'border-red-500' : 'border-[#1e293b]',
          ]"
          placeholder="Ej. Español, Inglés, Francés..."
          @input="onInput"
          @keydown.enter.prevent="add"
        />
        <button class="btn-primary shrink-0" @click="add">
          <i class="fas fa-plus"></i> Añadir
        </button>
      </div>
      <span v-if="error || cv.errors.languages" class="text-xs text-red-400">
        {{ error || cv.errors.languages }}
      </span>
    </label>

    <div class="flex flex-col gap-1">
      <span class="text-sm text-slate-300">Idiomas agregados:</span>
      <p v-if="cv.cvData.languages.length === 0" class="text-sm text-slate-500">
        No hay idiomas agregados.
      </p>
      <div v-else class="flex flex-wrap gap-2">
        <span
          v-for="lang in cv.cvData.languages"
          :key="lang.id"
          class="inline-flex items-center gap-2 rounded-full border border-[#1e293b] bg-[#0f172a] px-3 py-1 text-sm text-white"
        >
          <i class="fas fa-check-circle text-[#c5a059] text-xs"></i>
          {{ lang.name }}
          <button class="text-slate-500 transition hover:text-red-400" title="Eliminar" @click="cv.removeLanguage(lang.id)">
            <i class="fas fa-times"></i>
          </button>
        </span>
      </div>
    </div>
  </div>
</template>
