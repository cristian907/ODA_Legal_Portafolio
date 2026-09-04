<script setup lang="ts">
import { computed } from 'vue'
import { useCvStore } from '@/stores/cv'
import { useToast } from '@/composables/useToast'

const cv = useCvStore()
const { show } = useToast()
const p = computed(() => cv.cvData.personal)

const inputClass =
  'rounded-lg border bg-[#0b0f17] px-3 py-2 text-sm text-white outline-none focus:border-[#c5a059]'

function onPhoto(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) {
    show('Selecciona un archivo de imagen válido (.png, .jpg, .webp)', 'error')
    return
  }
  const reader = new FileReader()
  reader.onload = (evt) => {
    cv.cvData.personal.photo = String(evt.target?.result ?? '')
  }
  reader.readAsDataURL(file)
  input.value = ''
}

const photoThumb = computed(() => {
  const src = p.value.photo
  if (!src) return ''
  return src.startsWith('assets/') ? '/' + src : src
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-center justify-between">
      <span class="flex items-center gap-2 font-semibold text-white">
        <i class="fas fa-user-circle text-[#c5a059]"></i> Datos Personales y Perfil
      </span>
      <div class="flex gap-2">
        <button
          class="rounded border border-[#1e293b] px-2.5 py-1 text-xs text-slate-300 transition hover:bg-white/5"
          @click="cv.loadSample()"
        >
          <i class="fas fa-magic"></i> Ejemplo
        </button>
        <button
          class="rounded border border-[#1e293b] px-2.5 py-1 text-xs text-slate-300 transition hover:bg-white/5"
          @click="cv.clearForm()"
        >
          <i class="fas fa-eraser"></i> Limpiar
        </button>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-3">
      <label class="flex flex-col gap-1 text-sm text-slate-300">
        Nombre
        <input
          v-model="p.firstName"
          type="text"
          :class="[inputClass, cv.errors.firstName ? 'border-red-500' : 'border-[#1e293b]']"
          placeholder="Ej. Alejandro"
          @blur="cv.validateField(1, 'firstName')"
        />
        <span v-if="cv.errors.firstName" class="text-xs text-red-400">{{ cv.errors.firstName }}</span>
      </label>
      <label class="flex flex-col gap-1 text-sm text-slate-300">
        Apellido
        <input
          v-model="p.lastName"
          type="text"
          :class="[inputClass, cv.errors.lastName ? 'border-red-500' : 'border-[#1e293b]']"
          placeholder="Ej. Torres"
          @blur="cv.validateField(1, 'lastName')"
        />
        <span v-if="cv.errors.lastName" class="text-xs text-red-400">{{ cv.errors.lastName }}</span>
      </label>
    </div>

    <label class="flex flex-col gap-1 text-sm text-slate-300">
      Título / Profesión
      <input
        v-model="p.jobTitle"
        type="text"
        :class="[inputClass, 'border-[#1e293b]']"
        placeholder="Ej. Programador web / Abogado Corporativo"
      />
    </label>

    <div class="flex flex-col gap-2">
      <span class="text-sm text-slate-300">Foto Personal</span>
      <div class="flex items-center gap-3">
        <div
          class="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#1e293b] bg-[#0b0f17] text-slate-500"
        >
          <img v-if="photoThumb" :src="photoThumb" alt="Preview" class="h-full w-full object-cover" />
          <i v-else class="fas fa-camera"></i>
        </div>
        <div class="flex flex-col gap-1.5">
          <input id="cvPhotoInput" type="file" accept="image/*" class="hidden" @change="onPhoto" />
          <label
            for="cvPhotoInput"
            class="cursor-pointer rounded border border-[#1e293b] px-3 py-1.5 text-xs text-slate-300 transition hover:bg-white/5"
          >
            <i class="fas fa-upload"></i> Subir imagen
          </label>
          <button
            class="text-xs text-slate-400 transition hover:text-white"
            @click="cv.cvData.personal.photo = ''"
          >
            <i class="fas fa-trash"></i> Quitar foto
          </button>
        </div>
      </div>
    </div>

    <label class="flex flex-col gap-1 text-sm text-slate-300">
      Perfil Profesional / Resumen
      <textarea
        v-model="p.profile"
        rows="3"
        :class="[inputClass, 'border-[#1e293b] resize-none']"
        placeholder="Breve resumen de tu perfil profesional, enfoque y objetivos..."
      ></textarea>
    </label>

    <div class="grid grid-cols-2 gap-3">
      <label class="flex flex-col gap-1 text-sm text-slate-300">
        <span><i class="fas fa-phone-alt"></i> Teléfono</span>
        <input
          v-model="p.phone"
          type="text"
          :class="[inputClass, cv.errors.phone ? 'border-red-500' : 'border-[#1e293b]']"
          placeholder="+34-91-1234-567"
          @blur="cv.validateField(1, 'phone')"
        />
        <span v-if="cv.errors.phone" class="text-xs text-red-400">{{ cv.errors.phone }}</span>
      </label>
      <label class="flex flex-col gap-1 text-sm text-slate-300">
        <span><i class="fas fa-envelope"></i> Correo</span>
        <input
          v-model="p.email"
          type="email"
          :class="[inputClass, cv.errors.email ? 'border-red-500' : 'border-[#1e293b]']"
          placeholder="correo@ejemplo.com"
          @blur="cv.validateField(1, 'email')"
        />
        <span v-if="cv.errors.email" class="text-xs text-red-400">{{ cv.errors.email }}</span>
      </label>
    </div>

    <div class="grid grid-cols-2 gap-3">
      <label class="flex flex-col gap-1 text-sm text-slate-300">
        <span><i class="fas fa-globe"></i> Página Web</span>
        <input
          v-model="p.website"
          type="text"
          :class="[inputClass, cv.errors.website ? 'border-red-500' : 'border-[#1e293b]']"
          placeholder="www.unsitiogenial.es"
          @blur="cv.validateField(1, 'website')"
        />
        <span v-if="cv.errors.website" class="text-xs text-red-400">{{ cv.errors.website }}</span>
      </label>
      <label class="flex flex-col gap-1 text-sm text-slate-300">
        <span><i class="fas fa-map-marker-alt"></i> Localización</span>
        <input v-model="p.location" type="text" :class="[inputClass, 'border-[#1e293b]']" placeholder="Calle Cualquiera 123, Ciudad." />
      </label>
    </div>
  </div>
</template>
