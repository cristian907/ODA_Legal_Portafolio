<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCvStore } from '@/stores/cv'
import '@/assets/css/cv-template.css'

const cv = useCvStore()
const sheet = ref<HTMLElement | null>(null)
defineExpose({ sheet })

const p = computed(() => cv.cvData.personal)

// Legacy sample stored a relative "assets/…" path; normalize to an absolute
// URL so it resolves under any route. Data URLs pass through unchanged.
const photoSrc = computed(() => {
  const src = p.value.photo
  if (!src) return ''
  if (src.startsWith('assets/')) return '/' + src
  return src
})

const compPercent = (level: number) => Math.min(100, Math.max(20, level * 20))

// Only show contact rows the user actually filled in; empty fields are dropped
// from the CV instead of falling back to placeholder text.
const contactItems = computed(() =>
  [
    { icon: 'fa-phone-alt', value: p.value.phone },
    { icon: 'fa-envelope', value: p.value.email },
    { icon: 'fa-globe', value: p.value.website },
    { icon: 'fa-map-marker-alt', value: p.value.location },
  ].filter((item) => item.value?.trim()),
)
</script>

<template>
  <div ref="sheet" class="cv-paper-sheet" id="cvPaperSheet">
    <!-- Dark header -->
    <header class="cv-header-dark">
      <div class="cv-header-top">
        <div class="cv-photo-card">
          <img v-if="photoSrc" :src="photoSrc" alt="Foto" class="cv-photo-img" />
          <div v-else class="cv-photo-placeholder">
            <i class="fas fa-user"></i>
            <span>Sin foto</span>
          </div>
        </div>
        <div class="cv-name-role">
          <h1 class="cv-name-first">{{ p.firstName || 'Nombre' }}</h1>
          <h2 class="cv-name-last">{{ p.lastName || 'Apellido' }}</h2>
          <h3 class="cv-job-title">{{ p.jobTitle || 'Título Profesional' }}</h3>
        </div>
      </div>

      <div class="cv-header-bottom">
        <div class="cv-profile-box">
          <h4 class="cv-profile-title">Mi Perfil</h4>
          <p class="cv-profile-text">{{ p.profile || 'Resumen del perfil profesional...' }}</p>
        </div>
        <ul class="cv-contact-list">
          <li v-for="item in contactItems" :key="item.icon" class="cv-contact-item">
            <span class="cv-contact-icon"><i class="fas" :class="item.icon"></i></span>
            <span>{{ item.value }}</span>
          </li>
        </ul>
      </div>
    </header>

    <!-- White body (2 columns) -->
    <main class="cv-body-white">
      <div class="cv-col-left">
        <div class="cv-section-block">
          <div class="cv-section-banner">Experiencia Laboral</div>
          <div class="cv-items-list">
            <p v-if="cv.cvData.experience.length === 0" class="cv-item-desc" style="color: #94a3b8">
              Sin experiencia agregada.
            </p>
            <div v-for="exp in cv.cvData.experience" :key="exp.id" class="cv-timeline-item">
              <div class="cv-item-check"><i class="far fa-check-square"></i></div>
              <div class="cv-item-content">
                <div class="cv-item-header">
                  <span class="cv-item-company">{{ exp.title }}</span>
                  <span class="cv-item-dates">
                    {{ exp.startDate }}{{ exp.endDate ? ' - ' + exp.endDate : '' }}
                  </span>
                </div>
                <p v-if="exp.desc" class="cv-item-desc">{{ exp.desc }}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="cv-section-block">
          <div class="cv-section-banner">Formación Académica</div>
          <div class="cv-items-list">
            <p v-if="cv.cvData.education.length === 0" class="cv-item-desc" style="color: #94a3b8">
              Sin formación agregada.
            </p>
            <div v-for="edu in cv.cvData.education" :key="edu.id" class="cv-timeline-item">
              <div class="cv-item-check"><i class="far fa-check-square"></i></div>
              <div class="cv-item-content">
                <div class="cv-item-header">
                  <span class="cv-item-company">{{ edu.institution }}</span>
                  <span class="cv-item-dates">
                    {{ edu.startDate }}{{ edu.endDate ? ' - ' + edu.endDate : '' }}
                  </span>
                </div>
                <p v-if="edu.degree" class="cv-item-desc">{{ edu.degree }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="cv-col-right">
        <div class="cv-section-block">
          <div class="cv-section-banner">Idiomas</div>
          <ul class="cv-languages-list">
            <p v-if="cv.cvData.languages.length === 0" class="cv-item-desc" style="color: #94a3b8">
              Sin idiomas agregados.
            </p>
            <li v-for="lang in cv.cvData.languages" :key="lang.id" class="cv-lang-item">
              <i class="fas fa-check-circle cv-lang-icon"></i>
              <span>{{ lang.name }}</span>
            </li>
          </ul>
        </div>

        <div class="cv-section-block">
          <div class="cv-section-banner">Competencias</div>
          <div class="cv-competencies-list">
            <p v-if="cv.cvData.competencies.length === 0" class="cv-item-desc" style="color: #94a3b8">
              Sin competencias agregadas.
            </p>
            <div v-for="comp in cv.cvData.competencies" :key="comp.id" class="cv-comp-row">
              <span class="cv-comp-name" :title="comp.name">{{ comp.name }}</span>
              <div class="cv-comp-bar-track">
                <div class="cv-comp-bar-fill" :style="{ width: compPercent(comp.level) + '%' }"></div>
              </div>
            </div>
          </div>
        </div>

        <div class="cv-section-block">
          <div class="cv-section-banner">Habilidades</div>
          <div class="cv-skills-list">
            <p v-if="cv.cvData.skills.length === 0" class="cv-item-desc" style="color: #94a3b8">
              Sin habilidades agregadas.
            </p>
            <div v-for="skill in cv.cvData.skills" :key="skill.id" class="cv-skill-row">
              <span class="cv-skill-name" :title="skill.name">{{ skill.name }}</span>
              <div class="cv-skill-dots">
                <span
                  v-for="dot in 5"
                  :key="dot"
                  class="cv-dot"
                  :class="{ filled: dot <= skill.level }"
                ></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
