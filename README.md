# ODA Legal — Portafolio Corporativo & Panel de Administración con Generador de CV

[![Vue 3](https://img.shields.io/badge/Vue-3-4FC08D?style=flat&logo=vuedotjs&logoColor=white)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat&logo=vite&logoColor=white)](https://vite.dev/)
[![Pinia](https://img.shields.io/badge/Pinia-2-FFD859?style=flat&logo=vuedotjs&logoColor=black)](https://pinia.vuejs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?style=flat&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

Aplicación web integral para la firma jurídica **ODA Legal**, que combina un **portafolio web corporativo de alto impacto visual** y un **panel de administración avanzado** con un módulo interactivo para la **creación y exportación de Currículum Vitae profesional en formato A4**.

Migrada de HTML/CSS/JS vanilla a una **SPA Vue 3** modular y escalable, conservando el 100 % de la funcionalidad y los datos guardados por el usuario (`localStorage`).

---

## 🏛️ Características Principales

### 1. Portafolio Web Corporativo (ruta `/`)
- **Diseño Jurídico Premium**: estética elegante basada en tonos Azul Noche (`#0f172a`) y Dorado Noble (`#c5a059`).
- **Navegación fluida**: secciones de Servicios Legales, Galería y Contacto.
- **Tema claro/oscuro reactivo** y **totalmente responsivo**.

### 2. Panel de Administración (ruta `/admin`)
- **Editor de Estilos en Vivo**:
  - Personalización en tiempo real de paleta (5 colores), tamaños tipográficos y fuente (`.ttf`).
  - **Vista previa reactiva**: el portafolio real se renderiza con el estilo en edición, sin `iframe` ni `postMessage` — todo es estado compartido de Pinia.
  - Biblioteca de estilos con búsqueda, filtros y paginación; slots activos independientes para modo claro y oscuro.
- **Asistente de CV (Wizard de 5 pasos)**: datos personales, experiencia, educación, idiomas, competencias y habilidades.
  - **Visor A4 en vivo** (794 × 1123 px) con zoom y auto-ajuste.
  - **Exportación a PDF de 1 página** con `html2pdf.js` (cargado de forma diferida).
  - **Persistencia automática** en `localStorage`.

---

## 📁 Estructura del Proyecto

```text
ODA_Legal_Portafolio/
├── public/assets/images/        # Recursos gráficos corporativos
├── index.html                   # Único entry point (SPA)
├── vite.config.js
├── src/
│   ├── main.ts · App.vue
│   ├── router/                  # rutas '/' (portafolio) y '/admin'
│   ├── types/                   # tipos de dominio (theme · cv)
│   ├── assets/css/              # tailwind + variables de tema + cv-template
│   ├── shared/constants/        # palettes · storageKeys · sampleCv
│   ├── composables/             # useTheme · useLocalStorage · usePdfExport · useToast · useConfirm
│   ├── stores/                  # theme · cv · auth (Pinia)
│   ├── components/              # reutilizables globales
│   │   ├── feedback/            # ToastHost · ConfirmModal
│   │   └── form/                # SegmentedControl · ColorRow · SizeRow · FontUploader
│   └── features/
│       ├── portfolio/           # Hero, Services, Gallery, Footer…
│       ├── theme-editor/        # editor de temas + vista previa en vivo
│       └── cv-wizard/           # wizard, hoja A4 y exportación PDF
└── README.md
```

---

## 🚀 Puesta en Marcha

### Requisitos
- Node.js 18+ y pnpm.

### Instalación y desarrollo
```bash
pnpm install     # instala dependencias
pnpm dev         # servidor de desarrollo con hot-reload → http://localhost:8080/
pnpm type-check  # verifica tipos con vue-tsc (sin emitir)
```

Rutas:
- **Portafolio**: [http://localhost:8080/](http://localhost:8080/)
- **Panel de Administración y CV**: [http://localhost:8080/admin](http://localhost:8080/admin)

### Compilación para producción
```bash
pnpm build    # genera la carpeta dist/ (estática, lista para desplegar)
pnpm preview  # sirve localmente el build de producción
```

El resultado en `dist/` es completamente estático: se despliega en cualquier hosting de archivos estáticos (Netlify, Vercel, GitHub Pages, Nginx…). Para el enrutamiento SPA, configurá el fallback de rutas a `index.html`.

---

## 🛠️ Tecnologías y Librerías

- **Framework**: [Vue 3](https://vuejs.org/) (Composition API, `<script setup lang="ts">`).
- **Lenguaje**: [TypeScript 5](https://www.typescriptlang.org/) (modo `strict`; type-check con `vue-tsc` integrado al build).
- **Build & Dev**: [Vite 5](https://vite.dev/).
- **Estado**: [Pinia](https://pinia.vuejs.org/).
- **Ruteo**: [Vue Router 4](https://router.vuejs.org/).
- **Estilos**: [Tailwind CSS 4](https://tailwindcss.com/) sobre variables CSS (que impulsan el editor de temas en vivo).
- **Generación de PDF**: [html2pdf.js 0.10.1](https://github.com/eKoopmans/html2pdf.js) (`html2canvas` + `jsPDF`), importado dinámicamente bajo demanda.
- **Iconografía & Fuentes**: [Font Awesome 6.4](https://fontawesome.com/) y [Google Fonts](https://fonts.google.com/) (*Playfair Display*, *Plus Jakarta Sans*).

---

## 📄 Licencia

Desarrollado para fines académicos y profesionales en el marco de la Universidad José Antonio Páez (UJAP).
