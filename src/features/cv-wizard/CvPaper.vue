<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useCvStore } from '@/stores/cv'
import type { CvExperience, CvEducation, CvLanguage, CvLeveledItem } from '@/types/cv'
import '@/assets/css/cv-template.css'

const cv = useCvStore()
const sheet = ref<HTMLElement | null>(null)
const measurerEl = ref<HTMLElement | null>(null)
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

interface LeftPageContent {
  experience: CvExperience[]
  education: CvEducation[]
  showExpBanner: boolean
  showEduBanner: boolean
}

interface RightPageContent {
  languages: CvLanguage[]
  competencies: CvLeveledItem[]
  skills: CvLeveledItem[]
  showLangBanner: boolean
  showCompBanner: boolean
  showSkillBanner: boolean
}

interface PageDefinition {
  pageNumber: number
  isFirstPage: boolean
  left: LeftPageContent
  right: RightPageContent
}

const pages = ref<PageDefinition[]>([
  {
    pageNumber: 1,
    isFirstPage: true,
    left: {
      experience: cv.cvData.experience,
      education: cv.cvData.education,
      showExpBanner: true,
      showEduBanner: true,
    },
    right: {
      languages: cv.cvData.languages,
      competencies: cv.cvData.competencies,
      skills: cv.cvData.skills,
      showLangBanner: true,
      showCompBanner: true,
      showSkillBanner: true,
    },
  },
])

function measureAndDistribute() {
  if (!measurerEl.value) return

  const headerEl = measurerEl.value.querySelector('.cv-header-dark') as HTMLElement | null
  const secHeaderEl = measurerEl.value.querySelector('.cv-page-secondary-header') as HTMLElement | null
  const footerEl = measurerEl.value.querySelector('.cv-page-footer') as HTMLElement | null

  const headerH = headerEl ? headerEl.offsetHeight : 270
  const secHeaderH = secHeaderEl ? secHeaderEl.offsetHeight : 46
  const footerH = footerEl ? footerEl.offsetHeight : 26
  const bodyPadding = 48 // 20px top + 28px bottom margin

  // Page 1 capacity and Page N capacity in exact pixels (guaranteeing ~2cm margin before footer)
  const page1Cap = Math.max(500, Math.min(760, 1122 - headerH - bodyPadding - footerH))
  const pageNCap = Math.max(700, Math.min(990, 1122 - secHeaderH - bodyPadding - footerH))

  // Measure Exp items
  const expBannerEl = measurerEl.value.querySelector('#measureExpBanner') as HTMLElement | null
  const expBannerH = expBannerEl ? expBannerEl.offsetHeight + 10 : 42
  const expEls = measurerEl.value.querySelectorAll('.measure-exp-item')
  const expHeights: number[] = []
  expEls.forEach((el) => {
    expHeights.push((el as HTMLElement).offsetHeight + 11) // height + gap
  })

  // Measure Edu items
  const eduBannerEl = measurerEl.value.querySelector('#measureEduBanner') as HTMLElement | null
  const eduBannerH = eduBannerEl ? eduBannerEl.offsetHeight + 10 : 42
  const eduEls = measurerEl.value.querySelectorAll('.measure-edu-item')
  const eduHeights: number[] = []
  eduEls.forEach((el) => {
    eduHeights.push((el as HTMLElement).offsetHeight + 11)
  })

  // Measure Lang items
  const langBannerEl = measurerEl.value.querySelector('#measureLangBanner') as HTMLElement | null
  const langBannerH = langBannerEl ? langBannerEl.offsetHeight + 10 : 42
  const langEls = measurerEl.value.querySelectorAll('.measure-lang-item')
  const langHeights: number[] = []
  langEls.forEach((el) => {
    langHeights.push((el as HTMLElement).offsetHeight + 8)
  })

  // Measure Comp items
  const compBannerEl = measurerEl.value.querySelector('#measureCompBanner') as HTMLElement | null
  const compBannerH = compBannerEl ? compBannerEl.offsetHeight + 10 : 42
  const compEls = measurerEl.value.querySelectorAll('.measure-comp-item')
  const compHeights: number[] = []
  compEls.forEach((el) => {
    compHeights.push((el as HTMLElement).offsetHeight + 8)
  })

  // Measure Skill items
  const skillBannerEl = measurerEl.value.querySelector('#measureSkillBanner') as HTMLElement | null
  const skillBannerH = skillBannerEl ? skillBannerEl.offsetHeight + 10 : 42
  const skillEls = measurerEl.value.querySelectorAll('.measure-skill-item')
  const skillHeights: number[] = []
  skillEls.forEach((el) => {
    skillHeights.push((el as HTMLElement).offsetHeight + 8)
  })

  // 1. Distribute Left column
  const leftPages: LeftPageContent[] = []
  let leftPageIndex = 0
  let leftCurrentH = 0
  const getLeftCap = (idx: number) => (idx === 0 ? page1Cap : pageNCap)

  let leftContent: LeftPageContent = {
    experience: [],
    education: [],
    showExpBanner: false,
    showEduBanner: false,
  }

  const expList = cv.cvData.experience
  const eduList = cv.cvData.education

  if (expList.length > 0) {
    leftContent.showExpBanner = true
    leftCurrentH += expBannerH
    for (let i = 0; i < expList.length; i++) {
      const exp = expList[i]
      const h = expHeights[i] || 45
      if (leftCurrentH + h > getLeftCap(leftPageIndex) && leftContent.experience.length > 0) {
        leftPages.push(leftContent)
        leftPageIndex++
        leftCurrentH = expBannerH + h
        leftContent = {
          experience: [exp],
          education: [],
          showExpBanner: true,
          showEduBanner: false,
        }
      } else {
        leftContent.experience.push(exp)
        leftCurrentH += h
      }
    }
  }

  if (eduList.length > 0) {
    const firstTwoH = (eduHeights[0] || 40) + (eduHeights[1] || 40)
    const gapBetweenBlocks = leftContent.experience.length > 0 ? 18 : 0
    if (
      leftCurrentH + gapBetweenBlocks + eduBannerH + firstTwoH > getLeftCap(leftPageIndex) &&
      (leftContent.experience.length > 0 || leftContent.education.length > 0)
    ) {
      leftPages.push(leftContent)
      leftPageIndex++
      leftCurrentH = 0
      leftContent = {
        experience: [],
        education: [],
        showExpBanner: false,
        showEduBanner: false,
      }
    }

    leftContent.showEduBanner = true
    leftCurrentH += (leftContent.experience.length > 0 ? 18 : 0) + eduBannerH

    for (let i = 0; i < eduList.length; i++) {
      const edu = eduList[i]
      const h = eduHeights[i] || 40
      if (leftCurrentH + h > getLeftCap(leftPageIndex) && leftContent.education.length > 0) {
        leftPages.push(leftContent)
        leftPageIndex++
        leftCurrentH = eduBannerH + h
        leftContent = {
          experience: [],
          education: [edu],
          showExpBanner: false,
          showEduBanner: true,
        }
      } else {
        leftContent.education.push(edu)
        leftCurrentH += h
      }
    }
  }

  if (expList.length === 0 && eduList.length === 0) {
    leftContent.showExpBanner = true
    leftContent.showEduBanner = true
  }
  leftPages.push(leftContent)

  // 2. Distribute Right column
  const rightPages: RightPageContent[] = []
  let rightPageIndex = 0
  let rightCurrentH = 0
  const getRightCap = (idx: number) => (idx === 0 ? page1Cap : pageNCap)

  let rightContent: RightPageContent = {
    languages: [],
    competencies: [],
    skills: [],
    showLangBanner: false,
    showCompBanner: false,
    showSkillBanner: false,
  }

  const langs = cv.cvData.languages
  const comps = cv.cvData.competencies
  const skills = cv.cvData.skills

  // Idiomas
  if (langs.length > 0) {
    rightContent.showLangBanner = true
    rightCurrentH += langBannerH
    for (let i = 0; i < langs.length; i++) {
      const l = langs[i]
      const h = langHeights[i] || 24
      if (rightCurrentH + h > getRightCap(rightPageIndex) && rightContent.languages.length > 0) {
        rightPages.push(rightContent)
        rightPageIndex++
        rightCurrentH = langBannerH + h
        rightContent = {
          languages: [l],
          competencies: [],
          skills: [],
          showLangBanner: true,
          showCompBanner: false,
          showSkillBanner: false,
        }
      } else {
        rightContent.languages.push(l)
        rightCurrentH += h
      }
    }
  }

  // Competencias
  if (comps.length > 0) {
    const requiredH = (compHeights[0] || 24) + (compHeights[1] || 24)
    const gapBetween = rightContent.languages.length > 0 ? 18 : 0
    if (
      rightCurrentH + gapBetween + compBannerH + requiredH > getRightCap(rightPageIndex) &&
      (rightContent.languages.length > 0 || rightContent.competencies.length > 0)
    ) {
      rightPages.push(rightContent)
      rightPageIndex++
      rightCurrentH = 0
      rightContent = {
        languages: [],
        competencies: [],
        skills: [],
        showLangBanner: false,
        showCompBanner: false,
        showSkillBanner: false,
      }
    }
    rightContent.showCompBanner = true
    rightCurrentH += (rightContent.languages.length > 0 ? 18 : 0) + compBannerH
    for (let i = 0; i < comps.length; i++) {
      const c = comps[i]
      const h = compHeights[i] || 24
      if (rightCurrentH + h > getRightCap(rightPageIndex) && rightContent.competencies.length > 0) {
        rightPages.push(rightContent)
        rightPageIndex++
        rightCurrentH = compBannerH + h
        rightContent = {
          languages: [],
          competencies: [c],
          skills: [],
          showLangBanner: false,
          showCompBanner: true,
          showSkillBanner: false,
        }
      } else {
        rightContent.competencies.push(c)
        rightCurrentH += h
      }
    }
  }

  // Habilidades
  if (skills.length > 0) {
    const requiredH = (skillHeights[0] || 22) + (skillHeights[1] || 22)
    const gapBetween = rightContent.languages.length > 0 || rightContent.competencies.length > 0 ? 18 : 0
    if (
      rightCurrentH + gapBetween + skillBannerH + requiredH > getRightCap(rightPageIndex) &&
      (rightContent.languages.length > 0 || rightContent.competencies.length > 0 || rightContent.skills.length > 0)
    ) {
      rightPages.push(rightContent)
      rightPageIndex++
      rightCurrentH = 0
      rightContent = {
        languages: [],
        competencies: [],
        skills: [],
        showLangBanner: false,
        showCompBanner: false,
        showSkillBanner: false,
      }
    }
    rightContent.showSkillBanner = true
    rightCurrentH += (rightContent.languages.length > 0 || rightContent.competencies.length > 0 ? 18 : 0) + skillBannerH
    for (let i = 0; i < skills.length; i++) {
      const s = skills[i]
      const h = skillHeights[i] || 22
      if (rightCurrentH + h > getRightCap(rightPageIndex) && rightContent.skills.length > 0) {
        rightPages.push(rightContent)
        rightPageIndex++
        rightCurrentH = skillBannerH + h
        rightContent = {
          languages: [],
          competencies: [],
          skills: [s],
          showLangBanner: false,
          showCompBanner: false,
          showSkillBanner: true,
        }
      } else {
        rightContent.skills.push(s)
        rightCurrentH += h
      }
    }
  }

  if (langs.length === 0 && comps.length === 0 && skills.length === 0) {
    rightContent.showLangBanner = true
    rightContent.showCompBanner = true
    rightContent.showSkillBanner = true
  }
  rightPages.push(rightContent)

  // 3. Combine into final pages
  const totalCount = Math.max(leftPages.length, rightPages.length, 1)
  const result: PageDefinition[] = []
  for (let i = 0; i < totalCount; i++) {
    result.push({
      pageNumber: i + 1,
      isFirstPage: i === 0,
      left: leftPages[i] || { experience: [], education: [], showExpBanner: false, showEduBanner: false },
      right: rightPages[i] || {
        languages: [],
        competencies: [],
        skills: [],
        showLangBanner: false,
        showCompBanner: false,
        showSkillBanner: false,
      },
    })
  }
  pages.value = result
}

function triggerMeasure() {
  nextTick(() => {
    measureAndDistribute()
  })
}

watch(
  () => [
    cv.cvData.personal,
    cv.cvData.experience,
    cv.cvData.education,
    cv.cvData.languages,
    cv.cvData.competencies,
    cv.cvData.skills,
  ],
  () => {
    triggerMeasure()
  },
  { deep: true, immediate: true },
)

let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  triggerMeasure()
  if (measurerEl.value && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => triggerMeasure())
    resizeObserver.observe(measurerEl.value)
  }
})

onUnmounted(() => {
  resizeObserver?.disconnect()
})
</script>

<template>
  <div>
    <!-- Contenedor de medición real fuera de pantalla -->
    <div ref="measurerEl" class="cv-measurer-container" aria-hidden="true">
      <div class="cv-paper-page">
        <!-- Cabecera principal a medir -->
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

        <!-- Elementos del cuerpo a medir -->
        <main class="cv-body-white">
          <div class="cv-col-left">
            <div id="measureExpBanner" class="cv-section-banner">Experiencia Laboral</div>
            <div class="cv-items-list">
              <div
                v-for="exp in cv.cvData.experience"
                :key="exp.id"
                class="cv-timeline-item measure-exp-item"
              >
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

            <div id="measureEduBanner" class="cv-section-banner">Formación Académica</div>
            <div class="cv-items-list">
              <div
                v-for="edu in cv.cvData.education"
                :key="edu.id"
                class="cv-timeline-item measure-edu-item"
              >
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

          <div class="cv-col-right">
            <div id="measureLangBanner" class="cv-section-banner">Idiomas</div>
            <ul class="cv-languages-list">
              <li
                v-for="lang in cv.cvData.languages"
                :key="lang.id"
                class="cv-lang-item measure-lang-item"
              >
                <i class="fas fa-check-circle cv-lang-icon"></i>
                <span>{{ lang.name }}</span>
              </li>
            </ul>

            <div id="measureCompBanner" class="cv-section-banner">Competencias</div>
            <div class="cv-competencies-list">
              <div
                v-for="comp in cv.cvData.competencies"
                :key="comp.id"
                class="cv-comp-row measure-comp-item"
              >
                <span class="cv-comp-name">{{ comp.name }}</span>
                <div class="cv-comp-bar-track">
                  <div class="cv-comp-bar-fill" :style="{ width: compPercent(comp.level) + '%' }"></div>
                </div>
              </div>
            </div>

            <div id="measureSkillBanner" class="cv-section-banner">Habilidades</div>
            <div class="cv-skills-list">
              <div
                v-for="skill in cv.cvData.skills"
                :key="skill.id"
                class="cv-skill-row measure-skill-item"
              >
                <span class="cv-skill-name">{{ skill.name }}</span>
                <div class="cv-skill-dots">
                  <span v-for="dot in 5" :key="dot" class="cv-dot filled"></span>
                </div>
              </div>
            </div>
          </div>
        </main>

        <!-- Cabecera secundaria a medir -->
        <header class="cv-page-secondary-header">
          <span class="cv-page-secondary-title">{{ p.firstName }} {{ p.lastName }}</span>
          <span class="cv-page-secondary-number">Página 2</span>
        </header>

        <!-- Pie de página a medir -->
        <footer class="cv-page-footer">
          <span>Página 1</span>
        </footer>
      </div>
    </div>

    <!-- Contenedor Visible de Páginas del CV -->
    <div ref="sheet" class="cv-pages-container" id="cvPagesContainer">
      <div
        v-for="page in pages"
        :key="page.pageNumber"
        class="cv-paper-page"
        :id="`cvPaperPage_${page.pageNumber}`"
      >
        <!-- Cabecera Principal (Página 1) -->
        <header v-if="page.isFirstPage" class="cv-header-dark">
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

        <!-- Cabecera Secundaria Elegante (Página 2, 3...) -->
        <header v-else class="cv-page-secondary-header">
          <span class="cv-page-secondary-title">
            {{ p.firstName || 'Candidato' }} {{ p.lastName }} &mdash; {{ p.jobTitle || 'Currículum Vitae' }}
          </span>
          <span class="cv-page-secondary-number">Página {{ page.pageNumber }} de {{ pages.length }}</span>
        </header>

        <!-- Cuerpo blanco de 2 columnas -->
        <main class="cv-body-white">
          <!-- Columna Izquierda -->
          <div class="cv-col-left">
            <!-- Experiencia -->
            <div v-if="page.left.showExpBanner" class="cv-section-block">
              <div class="cv-section-banner">Experiencia Laboral</div>
              <div class="cv-items-list">
                <p
                  v-if="page.left.experience.length === 0 && page.isFirstPage && cv.cvData.experience.length === 0"
                  class="cv-item-desc"
                  style="color: #94a3b8"
                >
                  Sin experiencia agregada.
                </p>
                <div
                  v-for="exp in page.left.experience"
                  :key="exp.id"
                  class="cv-timeline-item"
                >
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

            <!-- Formación Académica -->
            <div v-if="page.left.showEduBanner" class="cv-section-block">
              <div class="cv-section-banner">Formación Académica</div>
              <div class="cv-items-list">
                <p
                  v-if="page.left.education.length === 0 && page.isFirstPage && cv.cvData.education.length === 0"
                  class="cv-item-desc"
                  style="color: #94a3b8"
                >
                  Sin formación agregada.
                </p>
                <div
                  v-for="edu in page.left.education"
                  :key="edu.id"
                  class="cv-timeline-item"
                >
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

          <!-- Columna Derecha -->
          <div class="cv-col-right">
            <!-- Idiomas -->
            <div v-if="page.right.showLangBanner" class="cv-section-block">
              <div class="cv-section-banner">Idiomas</div>
              <ul class="cv-languages-list">
                <p
                  v-if="page.right.languages.length === 0 && page.isFirstPage && cv.cvData.languages.length === 0"
                  class="cv-item-desc"
                  style="color: #94a3b8"
                >
                  Sin idiomas agregados.
                </p>
                <li
                  v-for="lang in page.right.languages"
                  :key="lang.id"
                  class="cv-lang-item"
                >
                  <i class="fas fa-check-circle cv-lang-icon"></i>
                  <span>{{ lang.name }}</span>
                </li>
              </ul>
            </div>

            <!-- Competencias -->
            <div v-if="page.right.showCompBanner" class="cv-section-block">
              <div class="cv-section-banner">Competencias</div>
              <div class="cv-competencies-list">
                <p
                  v-if="page.right.competencies.length === 0 && page.isFirstPage && cv.cvData.competencies.length === 0"
                  class="cv-item-desc"
                  style="color: #94a3b8"
                >
                  Sin competencias agregadas.
                </p>
                <div
                  v-for="comp in page.right.competencies"
                  :key="comp.id"
                  class="cv-comp-row"
                >
                  <span class="cv-comp-name" :title="comp.name">{{ comp.name }}</span>
                  <div class="cv-comp-bar-track">
                    <div
                      class="cv-comp-bar-fill"
                      :style="{ width: compPercent(comp.level) + '%' }"
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Habilidades -->
            <div v-if="page.right.showSkillBanner" class="cv-section-block">
              <div class="cv-section-banner">Habilidades</div>
              <div class="cv-skills-list">
                <p
                  v-if="page.right.skills.length === 0 && page.isFirstPage && cv.cvData.skills.length === 0"
                  class="cv-item-desc"
                  style="color: #94a3b8"
                >
                  Sin habilidades agregadas.
                </p>
                <div
                  v-for="skill in page.right.skills"
                  :key="skill.id"
                  class="cv-skill-row"
                >
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

        <!-- Pie de página con numeración -->
        <footer class="cv-page-footer">
          <span>Página {{ page.pageNumber }} de {{ pages.length }}</span>
        </footer>
      </div>
    </div>
  </div>
</template>
