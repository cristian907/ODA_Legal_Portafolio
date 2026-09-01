import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { STORAGE_KEYS } from '@/shared/constants/storageKeys'
import { SAMPLE_CV_DATA, CV_TOTAL_STEPS } from '@/shared/constants/sampleCv'
import { readJSON, writeJSON } from '@/composables/useLocalStorage'
import { personalSchema, experienceItemSchema, educationItemSchema, languageItemSchema, dateRangeSchema } from '@/schemas/cv'
import type { CvData } from '@/types/cv'

function createEmptyCv(): CvData {
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

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function createItemId(prefix: string): string {
  return `${prefix}_${Date.now()}`
}

export const useCvStore = defineStore('cv', () => {
  const cvData = ref<CvData>(
    readJSON<CvData | null>(STORAGE_KEYS.CV_DATA, null) || deepClone(SAMPLE_CV_DATA),
  )
  const currentStep = ref(1)

  // The store owns the errors so the wizard and every step component read them
  // directly, without prop-drilling. Keyed by field name (step 1) or item id
  // (steps 2-3).
  const errors = ref<Record<string, string>>({})

  watch(cvData, (data) => writeJSON(STORAGE_KEYS.CV_DATA, data), { deep: true })

  function loadSample(): void {
    cvData.value = deepClone(SAMPLE_CV_DATA)
  }
  function clearForm(): void {
    cvData.value = createEmptyCv()
  }

  function addExperience(): void {
    cvData.value.experience.push({ id: createItemId('exp'), title: '', startDate: '', endDate: '', desc: '' })
  }
  function removeExperience(id: string): void {
    cvData.value.experience = cvData.value.experience.filter((entry) => entry.id !== id)
  }

  function addEducation(): void {
    cvData.value.education.push({ id: createItemId('edu'), institution: '', degree: '', startDate: '', endDate: '' })
  }
  function removeEducation(id: string): void {
    cvData.value.education = cvData.value.education.filter((entry) => entry.id !== id)
  }

  function addLanguage(name: string): boolean {
    const trimmedName = (name || '').trim()
    const result = languageItemSchema.safeParse(trimmedName)
    if (!result.success) {
      setFieldError('languages', result.error.issues[0].message)
      return false
    }

    const isDuplicate = cvData.value.languages.some(
      (lang) => lang.name.trim().toLowerCase() === trimmedName.toLowerCase(),
    )
    if (isDuplicate) {
      setFieldError('languages', 'Este idioma ya ha sido agregado.')
      return false
    }

    setFieldError('languages', null)
    cvData.value.languages.push({ id: createItemId('lang'), name: trimmedName })
    return true
  }
  function removeLanguage(id: string): void {
    cvData.value.languages = cvData.value.languages.filter((entry) => entry.id !== id)
    if (cvData.value.languages.length === 0 && errors.value.languages) {
      delete errors.value.languages
    }
  }

  function addCompetency(name: string, level = 5): void {
    const trimmedName = (name || '').trim()
    if (!trimmedName) return
    cvData.value.competencies.push({ id: createItemId('comp'), name: trimmedName, level })
  }
  function removeCompetency(id: string): void {
    cvData.value.competencies = cvData.value.competencies.filter((entry) => entry.id !== id)
  }
  function addSkill(name: string, level = 5): void {
    const trimmedName = (name || '').trim()
    if (!trimmedName) return
    cvData.value.skills.push({ id: createItemId('skill'), name: trimmedName, level })
  }
  function removeSkill(id: string): void {
    cvData.value.skills = cvData.value.skills.filter((entry) => entry.id !== id)
  }

  function setFieldError(key: string, message: string | null): void {
    if (message) errors.value[key] = message
    else delete errors.value[key]
  }

  function clearErrors(): void {
    errors.value = {}
  }

  /** Items with a start/end year range (experience or education) for a step. */
  function dateRangeItemsForStep(step: number) {
    if (step === 2) return cvData.value.experience
    if (step === 3) return cvData.value.education
    return []
  }

  function validatePersonal(): Record<string, string> {
    const fieldErrors: Record<string, string> = {}
    const result = personalSchema.safeParse(cvData.value.personal)
    if (!result.success) {
      for (const issue of result.error.issues) {
        const fieldName = String(issue.path[0])
        if (!fieldErrors[fieldName]) fieldErrors[fieldName] = issue.message
      }
    }
    return fieldErrors
  }

  function validateExperienceItems(): Record<string, string> {
    const itemErrors: Record<string, string> = {}
    for (const item of cvData.value.experience) {
      const result = experienceItemSchema.safeParse(item)
      if (!result.success) itemErrors[item.id] = result.error.issues[0].message
    }
    return itemErrors
  }

  function validateEducationItems(): Record<string, string> {
    const itemErrors: Record<string, string> = {}
    for (const item of cvData.value.education) {
      const result = educationItemSchema.safeParse(item)
      if (!result.success) itemErrors[item.id] = result.error.issues[0].message
    }
    return itemErrors
  }

  function validateLanguages(): Record<string, string> {
    const itemErrors: Record<string, string> = {}
    for (const lang of cvData.value.languages) {
      const result = languageItemSchema.safeParse(lang.name)
      if (!result.success) {
        itemErrors['languages'] = result.error.issues[0].message
        break
      }
    }
    return itemErrors
  }

  const stepValidators: Record<number, () => Record<string, string>> = {
    1: validatePersonal,
    2: validateExperienceItems,
    3: validateEducationItems,
    4: validateLanguages,
  }

  /** Validate the whole step, replacing `errors`. Returns true when valid. */
  function validateStep(step: number): boolean {
    const nextErrors = stepValidators[step]?.() ?? {}
    errors.value = nextErrors
    return Object.keys(nextErrors).length === 0
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
    } else if (step === 2) {
      const item = cvData.value.experience.find((entry) => entry.id === key)
      if (!item) return
      const result = experienceItemSchema.safeParse(item)
      setFieldError(key, result.success ? null : result.error.issues[0].message)
    } else if (step === 3) {
      const item = cvData.value.education.find((entry) => entry.id === key)
      if (!item) return
      const result = educationItemSchema.safeParse(item)
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
    setFieldError,
    clearErrors,
    goToStep,
  }
})
