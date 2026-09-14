<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const user = ref('admin@odalegal.com')
const pass = ref('123456')

function submit() {
  // Simulation: no credential check (matches the legacy behavior).
  auth.login()
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-[#0b0f17] p-6">
    <div class="w-full max-w-md rounded-2xl border border-[#1e293b] bg-[#0f172a] p-8 shadow-2xl">
      <div class="mb-6 flex flex-col items-center gap-3">
        <span
          class="flex h-12 w-12 items-center justify-center rounded-xl bg-[#c5a059] text-2xl text-[#0f172a]"
        >
          <i class="fas fa-balance-scale"></i>
        </span>
        <h2 class="text-2xl font-bold text-white">ODA <span class="text-[#c5a059]">LEGAL</span></h2>
      </div>

      <div class="mb-6 text-center">
        <h3 class="text-lg font-semibold text-white">Acceso Administrativo</h3>
        <p class="text-sm text-slate-400">
          Introduce tus credenciales para acceder a la configuración del portal
        </p>
      </div>

      <form class="flex flex-col gap-4" @submit.prevent="submit">
        <div class="flex flex-col gap-1.5">
          <label class="text-sm text-slate-300" for="adminUser">
            <i class="fas fa-user"></i> Usuario o Email
          </label>
          <input
            id="adminUser"
            v-model="user"
            type="text"
            class="rounded-lg border border-[#1e293b] bg-[#0b0f17] px-3 py-2 text-sm text-white outline-none focus:border-[#c5a059]"
          />
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-sm text-slate-300" for="adminPass">
            <i class="fas fa-lock"></i> Contraseña
          </label>
          <input
            id="adminPass"
            v-model="pass"
            type="password"
            class="rounded-lg border border-[#1e293b] bg-[#0b0f17] px-3 py-2 text-sm text-white outline-none focus:border-[#c5a059]"
          />
        </div>

        <div class="rounded-lg bg-[#c5a059]/10 px-3 py-2 text-xs text-[#e5be48]">
          <i class="fas fa-info-circle"></i> Simulación: hacé clic en
          <strong>Iniciar Sesión</strong> para ingresar.
        </div>

        <button type="submit" class="btn-primary w-full">
          <i class="fas fa-sign-in-alt"></i> Iniciar Sesión
        </button>
      </form>

      <div class="mt-6 text-center">
        <RouterLink to="/" class="text-sm text-slate-400 transition hover:text-[#c5a059]">
          <i class="fas fa-arrow-left"></i> Volver al sitio principal
        </RouterLink>
      </div>
    </div>
  </div>
</template>
