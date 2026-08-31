export interface CvPersonal {
  firstName: string
  lastName: string
  jobTitle: string
  profile: string
  photo: string
  phone: string
  email: string
  website: string
  location: string
}

export interface CvExperience {
  id: string
  title: string
  startDate: string
  endDate: string
  desc: string
}

export interface CvEducation {
  id: string
  institution: string
  degree: string
  startDate: string
  endDate: string
}

export interface CvLanguage {
  id: string
  name: string
}

/** Competencies and skills share the same shape (name + level 1..5). */
export interface CvLeveledItem {
  id: string
  name: string
  level: number
}

export interface CvData {
  personal: CvPersonal
  experience: CvExperience[]
  education: CvEducation[]
  languages: CvLanguage[]
  competencies: CvLeveledItem[]
  skills: CvLeveledItem[]
}
