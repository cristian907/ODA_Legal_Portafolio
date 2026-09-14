<script setup lang="ts">
defineEmits(['download', 'edit'])
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex flex-col items-center gap-3 rounded-xl border border-[#1e293b] bg-[#0f172a] p-8 text-center">
      <div class="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-2xl text-emerald-400">
        <i class="fas fa-check"></i>
      </div>
      <h3 class="text-lg font-bold text-white">¡Currículum Generado con Éxito!</h3>
      <p class="text-sm text-slate-400">
        Tu currículum vitae ha sido estructurado perfectamente según el formato estándar.
      </p>
    </div>

    <div class="flex flex-col gap-3">
      <button class="btn-primary w-full" @click="$emit('download')">
        <i class="fas fa-file-pdf"></i> Descargar como PDF
      </button>
      <button
        class="w-full rounded-lg border border-[#1e293b] px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/5"
        @click="$emit('edit')"
      >
        <i class="fas fa-edit"></i> Modificar datos del formulario
      </button>
    </div>
  </div>
</template>
