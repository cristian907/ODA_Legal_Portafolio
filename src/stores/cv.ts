import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { STORAGE_KEYS } from '@/shared/constants/storageKeys'
import { SAMPLE_CV_DATA, CV_TOTAL_STEPS } from '@/shared/constants/sampleCv'
import { readJSON, writeJSON } from '@/composables/useLocalStorage'
import { personalSchema, dateRangeSchema } from '@/schemas/cv'
import type { CvData } from '@/types/cv'

function emptyCv(): CvData {
  return {
    personal: {
      firstName: '',
      lastName: '',
      jobTitle: '',
      profile: '',
      photo: '',
      phone: '',
      email: '',
      website: '',
      location: '',
    },
    experience: [],
    education: [],
    languages: [],
    competencies: [],
    skills: [],
  }
}

function clone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T
}

export const useCvStore = defineStore('cv', () => {
  // Load persisted CV, or seed with the sample (matches legacy loadCvData()).
  const cvData = ref<CvData>(
    readJSON<CvData | null>(STORAGE_KEYS.CV_DATA, null) || clone(SAMPLE_CV_DATA),
  )
  const currentStep = ref(1)

  // Validation errors, keyed by field name (step 1) or item id (steps 2-3).
  // The store owns this so both the wizard and the step components read it
  // directly, without prop-drilling.
  const errors = ref<Record<string, string>>({})

  // Auto-persist on every change (deep), like the legacy per-input saveCvData().
  watch(cvData, (v) => writeJSON(STORAGE_KEYS.CV_DATA, v), { deep: true })

  // ---- Quick actions -----------------------------------------------------
  function loadSample(): void {
    cvData.value = clone(SAMPLE_CV_DATA)
  }
  function clearForm(): void {
    cvData.value = emptyCv()
  }

  // ---- Experience --------------------------------------------------------
  function addExperience(): void {
    cvData.value.experience.push({ id: `exp_${Date.now()}`, title: '', startDate: '', endDate: '', desc: '' })
  }
  function removeExperience(id: string): void {
    cvData.value.experience = cvData.value.experience.filter((x) => x.id !== id)
  }

  // ---- Education ---------------------------------------------------------
  function addEducation(): void {
    cvData.value.education.push({ id: `edu_${Date.now()}`, institution: '', degree: '', startDate: '', endDate: '' })
  }
  function removeEducation(id: string): void {
    cvData.value.education = cvData.value.education.filter((x) => x.id !== id)
  }

  // ---- Languages ---------------------------------------------------------
  function addLanguage(name: string): void {
    const v = (name || '').trim()
    if (!v) return
    cvData.value.languages.push({ id: `lang_${Date.now()}`, name: v })
  }
  function removeLanguage(id: string): void {
    cvData.value.languages = cvData.value.languages.filter((x) => x.id !== id)
  }

  // ---- Competencies / Skills (name + level 1..5) -------------------------
  function addCompetency(name: string, level = 5): void {
    const v = (name || '').trim()
    if (!v) return
    cvData.value.competencies.push({ id: `comp_${Date.now()}`, name: v, level })
  }
  function removeCompetency(id: string): void {
    cvData.value.competencies = cvData.value.competencies.filter((x) => x.id !== id)
  }
  function addSkill(name: string, level = 5): void {
    const v = (name || '').trim()
    if (!v) return
    cvData.value.skills.push({ id: `skill_${Date.now()}`, name: v, level })
  }
  function removeSkill(id: string): void {
    cvData.value.skills = cvData.value.skills.filter((x) => x.id !== id)
  }

  // ---- Validation --------------------------------------------------------
  function setFieldError(key: string, message: string | null): void {
    if (message) errors.value[key] = message
    else delete errors.value[key]
  }

  function clearErrors(): void {
    errors.value = {}
  }

  /** Items with a start/end year range (experience or education) for a step. */
  function dateItemsFor(step: number) {
    if (step === 2) return cvData.value.experience
    if (step === 3) return cvData.value.education
    return []
  }

  /** Validate the whole step, replacing `errors`. Returns true when valid. */
  function validateStep(step: number): boolean {
    const next: Record<string, string> = {}
    if (step === 1) {
      const result = personalSchema.safeParse(cvData.value.personal)
      if (!result.success) {
        for (const issue of result.error.issues) {
          const key = String(issue.path[0])
          if (!next[key]) next[key] = issue.message
        }
      }
    } else if (step === 2 || step === 3) {
      for (const item of dateItemsFor(step)) {
        const result = dateRangeSchema.safeParse(item)
        if (!result.success) next[item.id] = result.error.issues[0].message
      }
    }
    errors.value = next
    return Object.keys(next).length === 0
  }

  /**
   * Validate a single field on blur, touching only its error key.
   * `key` is a personal field name (step 1) or an item id (steps 2-3).
   */
  function validateField(step: number, key: string): void {
    if (step === 1) {
      const result = personalSchema.safeParse(cvData.value.personal)
      const issue = result.success
        ? undefined
        : result.error.issues.find((i) => String(i.path[0]) === key)
      setFieldError(key, issue ? issue.message : null)
    } else if (step === 2 || step === 3) {
      const item = dateItemsFor(step).find((x) => x.id === key)
      if (!item) return
      const result = dateRangeSchema.safeParse(item)
      setFieldError(key, result.success ? null : result.error.issues[0].message)
    }
  }

  function goToStep(step: number): void {
    currentStep.value = Math.min(Math.max(1, step), CV_TOTAL_STEPS + 1)
  }

  return {
    cvData,
    currentStep,
    errors,
    loadSample,
    clearForm,
    addExperience,
    removeExperience,
    addEducation,
    removeEducation,
    addLanguage,
    removeLanguage,
    addCompetency,
    removeCompetency,
    addSkill,
    removeSkill,
    validateStep,
    validateField,
    clearErrors,
    goToStep,
  }
})
