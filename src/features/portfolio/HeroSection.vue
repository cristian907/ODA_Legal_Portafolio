<script setup lang="ts">
const stats = [
  { number: '15+', label: 'Años de Exp.' },
  { number: '98%', label: 'Casos Exitosos' },
  { number: '500+', label: 'Clientes' },
]
</script>

<template>
  <section id="inicio" class="hero relative flex min-h-[90vh] items-center overflow-hidden pb-16 pt-[100px]">
    <div class="hero-overlay pointer-events-none absolute inset-0"></div>

    <div class="app-container hero-grid relative z-10">
      <!-- Copy -->
      <div>
        <div
          class="mb-6 inline-flex items-center gap-2 rounded-full border border-svc-4 bg-white/[0.12] px-4 py-[0.4rem] font-semibold uppercase tracking-[1px] text-on-dark backdrop-blur-sm"
        >
          <i class="fas fa-award"></i> Abogado &amp; Asesor Legal de Excelencia
        </div>
        <h1 class="hero-title mb-6 font-bold text-on-dark">
          Defensa Legal <span class="italic text-svc-4">Estratégica</span> y Compromiso Ético
        </h1>
        <p class="hero-description mb-10 max-w-[600px] text-on-dark opacity-90">
          Ofrezco asesoría jurídica integral y representación de alto nivel para proteger tus
          intereses, derechos y patrimonio en cada etapa procesal.
        </p>
        <div class="hero-actions flex flex-wrap gap-4">
          <a href="#contacto" class="btn-primary">
            <i class="fas fa-calendar-check"></i> Agendar Consulta
          </a>
          <a href="#servicios" class="btn-secondary">
            <i class="fas fa-gavel"></i> Conocer Especialidades
          </a>
        </div>
      </div>

      <!-- Featured card -->
      <div
        class="relative rounded-2xl border border-svc-5 bg-surface p-8 text-center shadow-[0_16px_32px_rgba(0,0,0,0.16)] backdrop-blur-[16px]"
      >
        <img
          src="/assets/images/attorney.png"
          alt="Lic. Oscar De Abreu"
          class="mx-auto mb-6 h-[140px] w-[140px] rounded-full border-4 border-svc-4 object-cover shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
        />
        <h3 class="hero-card-name mb-1 font-bold text-svc-3">Lic. Oscar De Abreu</h3>
        <p class="hero-card-subtitle mb-6 font-medium text-svc-4">Abogado Senior &amp; Consultor Legal</p>

        <div class="grid grid-cols-3 gap-4 border-t border-svc-5 pt-6">
          <div v-for="stat in stats" :key="stat.label">
            <h4 class="stat-number font-bold text-svc-3">{{ stat.number }}</h4>
            <span class="text-[0.75em] uppercase tracking-[0.5px] text-svc-3 opacity-75">
              {{ stat.label }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero {
  background-color: #090d14;
  background-image: linear-gradient(rgba(9, 13, 20, 0.7), rgba(9, 13, 20, 0.7)),
    url('/assets/images/hero.png');
  background-position: center;
  background-size: cover;
  background-repeat: no-repeat;
  color: #ffffff;
}

.hero-overlay {
  background: radial-gradient(circle at 20% 50%, rgba(197, 160, 89, 0.15) 0%, transparent 60%);
}

.hero-grid {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 3rem;
  align-items: center;
}

/* Title/subtitle sizes follow the themeable tokens. */
.hero-title,
.hero-card-name {
  font-size: var(--size-titles);
  line-height: 1.2;
}

.hero-description,
.hero-card-subtitle,
.stat-number {
  font-size: var(--size-subtitles);
}

@media (max-width: 992px) {
  .hero-grid {
    grid-template-columns: 1fr;
    text-align: center;
  }
  .hero-actions {
    justify-content: center;
  }
}
</style>
