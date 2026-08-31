<script setup lang="ts">
const socials = [
  { icon: 'fa-linkedin-in', label: 'LinkedIn' },
  { icon: 'fa-twitter', label: 'Twitter' },
  { icon: 'fa-facebook-f', label: 'Facebook' },
  { icon: 'fa-instagram', label: 'Instagram' },
]

const navLinks = [
  { hash: '#inicio', label: 'Inicio' },
  { hash: '#servicios', label: 'Especialidades' },
  { hash: '#galeria', label: 'Galería' },
  { hash: '#contacto', label: 'Contacto Directo' },
]

const practiceLinks = [
  'Derecho Civil',
  'Derecho Penal',
  'Derecho Corporativo',
  'Derecho Laboral',
]

const contactInfo = [
  { icon: 'fa-map-marker-alt', text: 'Av. Francisco de Miranda, Edif. Financiero, Piso 8, Caracas' },
  { icon: 'fa-phone-alt', text: '+58 (212) 555-0199 / +58 (414) 123-4567' },
  { icon: 'fa-envelope', text: 'contacto@odalegal.com' },
]
</script>

<template>
  <footer id="contacto" class="footer border-t border-border-app bg-footer pb-8 pt-20 text-footer-text">
    <div class="app-container">
      <div class="footer-grid mb-16 grid gap-12">
        <!-- About -->
        <div>
          <div class="mb-5 flex items-center gap-3 text-2xl font-bold leading-tight text-footer-text">
            <span
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-svc-4 text-xl text-svc-2 shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
            >
              <i class="fas fa-balance-scale"></i>
            </span>
            <span>ODA <span class="text-gold">LEGAL</span></span>
          </div>
          <p class="mb-6 max-w-[350px] text-footer-text opacity-85">
            Despacho legal comprometido con la justicia, la excelencia estratégica y la defensa
            integral de mis clientes.
          </p>
          <div class="flex gap-4">
            <a
              v-for="social in socials"
              :key="social.label"
              href="#"
              class="social-icon flex h-10 w-10 items-center justify-center rounded-full border border-border-app bg-surface text-svc-5"
              :aria-label="social.label"
            >
              <i class="fab" :class="social.icon"></i>
            </a>
          </div>
        </div>

        <!-- Navigation -->
        <div>
          <h3 class="footer-heading relative mb-6 pb-2 font-bold text-footer-text">Navegación</h3>
          <ul>
            <li v-for="link in navLinks" :key="link.label" class="mb-3">
              <a :href="link.hash" class="footer-link text-footer-text opacity-85">{{ link.label }}</a>
            </li>
          </ul>
        </div>

        <!-- Practice -->
        <div>
          <h3 class="footer-heading relative mb-6 pb-2 font-bold text-footer-text">Práctica Legal</h3>
          <ul>
            <li v-for="item in practiceLinks" :key="item" class="mb-3">
              <a href="#servicios" class="footer-link text-footer-text opacity-85">{{ item }}</a>
            </li>
          </ul>
        </div>

        <!-- Contact -->
        <div>
          <h3 class="footer-heading relative mb-6 pb-2 font-bold text-footer-text">Contacto</h3>
          <ul>
            <li
              v-for="info in contactInfo"
              :key="info.text"
              class="mb-4 flex items-start gap-3 text-footer-text opacity-85"
            >
              <i class="fas mt-1 text-gold" :class="info.icon"></i>
              <span>{{ info.text }}</span>
            </li>
          </ul>
        </div>
      </div>

      <div
        class="flex flex-wrap items-center justify-between gap-4 border-t border-border-app pt-8 text-footer-text opacity-75"
      >
        <p>&copy; 2026 ODA Legal - Lic. Oscar De Abreu. Todos los derechos reservados.</p>
        <RouterLink to="/admin" class="text-[0.85rem] hover:text-gold">
          <i class="fas fa-cog"></i> Administración (/admin)
        </RouterLink>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer-heading {
  font-size: var(--size-subtitles);
}
.footer-heading::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  height: 2px;
  width: 30px;
  background-color: var(--accent-gold);
}

.footer-link {
  transition: all var(--transition-fast);
}
.footer-link:hover {
  color: var(--accent-gold);
  opacity: 1;
  padding-left: 5px;
}

.social-icon {
  transition: all var(--transition-fast);
}
.social-icon:hover {
  background: var(--accent-gold);
  border-color: var(--accent-gold);
  color: #ffffff;
  transform: translateY(-3px);
}

.footer-grid {
  grid-template-columns: 2fr 1fr 1fr 1.5fr;
}
@media (max-width: 992px) {
  .footer-grid {
    grid-template-columns: 1fr 1fr;
  }
}
@media (max-width: 767px) {
  .footer-grid {
    grid-template-columns: 1fr;
  }
}
</style>
