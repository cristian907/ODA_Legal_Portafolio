<script setup lang="ts">
import { inject, ref } from 'vue'
import { useThemeStore } from '@/stores/theme'

const theme = useThemeStore()
const menuOpen = ref(false)

// When rendered inside the admin live preview the header must not be `fixed`
// (it would escape the preview panel) and the toggle is inert.
const previewMode = inject('previewMode', false)

function onToggle() {
  if (previewMode) return
  theme.toggleTheme()
}

const links = [
  { hash: '#inicio', label: 'Inicio' },
  { hash: '#servicios', label: 'Servicios' },
  { hash: '#galeria', label: 'Galería' },
  { hash: '#contacto', label: 'Contacto' },
]

// Simple highlight: the first link is active by default; navigating updates it.
const active = ref('#inicio')

function onNav(hash: string) {
  active.value = hash
  menuOpen.value = false
}
</script>

<template>
  <header
    class="left-0 top-0 z-[1000] w-full border-b border-border-app bg-header backdrop-blur-[12px] transition-colors"
    :class="previewMode ? 'sticky' : 'fixed'"
  >
    <div class="app-container flex min-h-[80px] items-center justify-between py-2">
      <!-- Logo -->
      <RouterLink
        to="/"
        class="flex items-center gap-3 whitespace-nowrap text-2xl font-bold leading-tight text-app"
      >
        <span
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-svc-4 text-xl text-svc-2 shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
        >
          <i class="fas fa-balance-scale"></i>
        </span>
        <span>ODA <span class="text-gold">LEGAL</span></span>
      </RouterLink>

      <!-- Navigation -->
      <nav>
        <ul class="nav-menu" :class="{ 'is-open': menuOpen }">
          <li v-for="link in links" :key="link.hash">
            <a
              :href="link.hash"
              class="nav-link relative py-2 font-medium"
              :class="active === link.hash ? 'text-gold is-active' : 'text-muted'"
              @click="onNav(link.hash)"
            >
              {{ link.label }}
            </a>
          </li>
        </ul>
      </nav>

      <!-- Actions -->
      <div class="flex items-center gap-4">
        <button
          v-if="theme.allowToggle"
          class="theme-toggle flex h-11 w-11 min-w-11 items-center justify-center rounded-full border border-border-app bg-surface text-app shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
          title="Cambiar tema (claro/oscuro)"
          @click="onToggle"
        >
          <i class="fas" :class="theme.currentTheme === 'dark' ? 'fa-sun' : 'fa-moon'"></i>
        </button>

        <a href="#contacto" class="btn-primary hidden sm:inline-flex" @click="onNav('#contacto')">
          <i class="fas fa-phone-alt"></i> Consulta Gratuita
        </a>

        <button
          class="mobile-btn text-app md:hidden"
          aria-label="Abrir menú"
          @click="menuOpen = !menuOpen"
        >
          <i class="fas text-xl" :class="menuOpen ? 'fa-times' : 'fa-bars'"></i>
        </button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.nav-menu {
  display: flex;
  align-items: center;
  gap: 2rem;
}

/* Animated underline (::after) — not expressible as a plain utility. */
.nav-link::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  height: 2px;
  width: 0%;
  background-color: var(--accent-gold);
  transition: width var(--transition-fast);
}
.nav-link:hover {
  color: var(--accent-gold);
}
.nav-link:hover::after,
.nav-link.is-active::after {
  width: 100%;
}

.theme-toggle {
  transition: all var(--transition-fast);
}
.theme-toggle:hover {
  background: var(--svc-color-4);
  color: var(--svc-color-2);
  border-color: var(--svc-color-4);
  transform: scale(1.08);
}

.mobile-btn {
  background: none;
  border: none;
  cursor: pointer;
}

/* Mobile slide-in nav panel (< md). */
@media (max-width: 767px) {
  .nav-menu {
    position: fixed;
    top: 80px;
    left: -100%;
    height: calc(100vh - 80px);
    width: 100%;
    flex-direction: column;
    justify-content: center;
    background: var(--bg-surface);
    transition: left var(--transition-normal);
    z-index: 999;
  }
  .nav-menu.is-open {
    left: 0;
  }
}
</style>
