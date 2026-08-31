import type { CvData } from '@/types/cv'

// Default CV used when there is nothing persisted yet (and for "load sample").
// Ported verbatim from the legacy js/cv-wizard.js SAMPLE_CV_DATA.
export const SAMPLE_CV_DATA: CvData = {
  personal: {
    firstName: 'Alejandro',
    lastName: 'Torres',
    jobTitle: 'Programador web',
    profile:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum sit amet quam rhoncus, egestas dui eget, malesuada justo. Ut aliquam augue. Consectetur adipiscing elit. Vestibulum sit amet quam rhoncus, egestas dui eget, malesuada justo.',
    photo: 'assets/images/attorney.png',
    phone: '+34-91-1234-567',
    email: 'Hola@unsitiogenial.es',
    website: 'www.unsitiogenial.es',
    location: 'Calle Cualquiera 123, Cualquier Lugar.',
  },
  experience: [
    { id: 'exp_1', title: 'Multinacional González', startDate: '2019', endDate: '2023', desc: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum sit amet dui elit quam rhoncus, egestas dui eget, malesuada justo. Ut aliquam augue.' },
    { id: 'exp_2', title: 'Álvarez y asociados', startDate: '2015', endDate: '2019', desc: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum sit amet dui elit quam rhoncus, egestas dui eget, malesuada justo. Ut aliquam augue.' },
    { id: 'exp_3', title: 'Industrias Ariova', startDate: '2014', endDate: '2015', desc: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum sit amet dui elit quam rhoncus, egestas dui eget, malesuada justo. Ut aliquam augue.' },
    { id: 'exp_4', title: 'Rimberio y asociados', startDate: '2012', endDate: '2014', desc: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum sit amet dui elit quam rhoncus, egestas dui eget, malesuada justo. Ut aliquam augue.' },
  ],
  education: [
    { id: 'edu_1', institution: 'Universidad Ensigna', degree: 'Ingeniería en sistemas', startDate: '2018', endDate: '2023' },
    { id: 'edu_2', institution: 'Universidad Ensigna', degree: 'Programación web', startDate: '2012', endDate: '2018' },
  ],
  languages: [
    { id: 'lang_1', name: 'Español' },
    { id: 'lang_2', name: 'Portugués' },
    { id: 'lang_3', name: 'Ingles' },
  ],
  competencies: [
    { id: 'comp_1', name: 'Software 01', level: 5 },
    { id: 'comp_2', name: 'Software 02', level: 4 },
    { id: 'comp_3', name: 'Software 03', level: 4 },
    { id: 'comp_4', name: 'Software 04', level: 5 },
    { id: 'comp_5', name: 'Software 05', level: 3 },
  ],
  skills: [
    { id: 'skill_1', name: 'Liderazgo', level: 5 },
    { id: 'skill_2', name: 'Creatividad', level: 5 },
    { id: 'skill_3', name: 'Análisis crítico', level: 4 },
    { id: 'skill_4', name: 'Eficiencia', level: 5 },
  ],
}

export const CV_TOTAL_STEPS = 5
