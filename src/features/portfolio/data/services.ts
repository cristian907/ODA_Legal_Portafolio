export interface Service {
  icon: string
  title: string
  description: string
}

// Legal services rendered in the Services section.
// Previously hardcoded as six .service-card blocks in index.html.
export const SERVICES: Service[] = [
  {
    icon: 'fa-gavel',
    title: 'Derecho Civil y Familia',
    description:
      'Asesoría estratégica en divorcios, sucesiones, herencias, custodias y redactado de contratos con absoluta transparencia.',
  },
  {
    icon: 'fa-shield-alt',
    title: 'Derecho Penal',
    description:
      'Defensa jurídica rigurosa en juicios orales, procesos penales, querellas y protección de garantías constitucionales.',
  },
  {
    icon: 'fa-building',
    title: 'Derecho Corporativo',
    description:
      'Constitución de sociedades, gobierno corporativo, marcas, fusiones y contratos comerciales para empresas.',
  },
  {
    icon: 'fa-user-tie',
    title: 'Derecho Laboral',
    description:
      'Representación experta en liquidaciones, despidos injustificados, contratos de trabajo y conciliaciones.',
  },
  {
    icon: 'fa-file-contract',
    title: 'Derecho Inmobiliario',
    description:
      'Auditoría de títulos, contratos de compraventa, arrendamientos y asesoría legal en operaciones de bienes raíces.',
  },
  {
    icon: 'fa-handshake',
    title: 'Mediación y Arbitraje',
    description:
      'Resolución alternativa de conflictos negociación estratégica para evitar litigios prolongados.',
  },
]
