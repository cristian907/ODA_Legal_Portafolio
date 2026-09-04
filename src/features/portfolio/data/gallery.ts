export interface GalleryFilter {
  value: string
  label: string
}

export interface GalleryItem {
  category: string
  img: string
  alt: string
  title: string
  categoryLabel: string
}

// Gallery filter tabs and items. Previously hardcoded in index.html with
// data-category / data-img attributes.

export const GALLERY_FILTERS: GalleryFilter[] = [
  { value: 'all', label: 'Todas' },
  { value: 'despacho', label: 'Despacho' },
  { value: 'reuniones', label: 'Reuniones' },
  { value: 'perfil', label: 'Perfil' },
]

export const GALLERY_ITEMS: GalleryItem[] = [
  {
    category: 'despacho',
    img: '/assets/images/hero.png',
    alt: 'Instalaciones del Despacho',
    title: 'Oficina Principal',
    categoryLabel: 'Despacho',
  },
  {
    category: 'reuniones',
    img: '/assets/images/meeting.png',
    alt: 'Sala de Juntas',
    title: 'Sala de Conferencias',
    categoryLabel: 'Reuniones',
  },
  {
    category: 'perfil',
    img: '/assets/images/attorney.png',
    alt: 'Lic. Oscar De Abreu',
    title: 'Lic. Oscar De Abreu',
    categoryLabel: 'Perfil',
  },
  {
    category: 'despacho',
    img: '/assets/images/hero.png',
    alt: 'Biblioteca Jurídica',
    title: 'Biblioteca y Documentación',
    categoryLabel: 'Despacho',
  },
]
