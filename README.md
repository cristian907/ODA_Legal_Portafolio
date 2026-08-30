# ODA Legal - Portafolio Corporativo & Panel de Administración con Generador de CV

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)](https://developer.mozilla.org/es/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)](https://developer.mozilla.org/es/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=flat&logo=javascript&logoColor=black)](https://developer.mozilla.org/es/docs/Web/JavaScript)
[![Python](https://img.shields.io/badge/Python-3.x-3776AB?style=flat&logo=python&logoColor=white)](https://www.python.org/)

Aplicación web integral para la firma jurídica **ODA Legal**, que combina un **portafolio web corporativo de alto impacto visual** y un **panel de administración avanzado** con un módulo interactivo para la **creación y exportación de Currículum Vitae profesional en formato A4**.

---

## 🏛️ Características Principales

### 1. Portafolio Web Corporativo (`index.html`)
- **Diseño Jurídico Premium**: Estética elegante y confiable basada en tonos Azul Noche (`#0f172a`), Dorado Noble (`#c5a059`) y tipografías editoriales (`Cinzel` y `Montserrat`).
- **Navegación Fluida**: Secciones modulares de Servicios Legales, Trayectoria de la Firma, Casos de Éxito, Testimonios y Formulario de Contacto.
- **Totalmente Responsivo**: Adaptable a dispositivos móviles, tablets y pantallas de escritorio.

### 2. Panel de Administración (`admin.html`)
- **Pestaña "Estilos" (Live Theme Editor)**:
  - Personalización en tiempo real de paletas cromáticas, variables CSS y tipografías del sitio.
  - Previsualización en vivo integrada mediante `iframe` bidireccional.
- **Pestaña "Creación de CV" (Asistente Interactivo & Exportador PDF)**:
  - **Asistente paso a paso (Wizard)**:
    1. *Datos Personales*: Nombre, cargo, contacto, perfil profesional y ubicación.
    2. *Experiencia Laboral*: Gestión dinámica de puestos, empresas, periodos y logros.
    3. *Educación*: Títulos, universidades, años de graduación y distinciones.
    4. *Habilidades & Competencias*: Especialidades legales, áreas de práctica y nivel de dominio.
    5. *Idiomas & Certificaciones*: Lenguajes dominados, colegiaturas y acreditaciones.
  - **Visor en Vivo de Hoja A4**:
    - Renderizado en tiempo real a proporción $210\text{ mm} \times 297\text{ mm}$ ($794\text{px} \times 1122\text{px}$).
    - Controles interactivos de zoom: Alejar, Ajustar automáticamente a la pantalla y Acercar.
  - **Exportación Directa a PDF de 1 Página**:
    - Motor de renderizado con `html2pdf.js` / `html2canvas` / `jsPDF`.
    - Genera un archivo PDF limpio a alta resolución garantizando exactamente **1 sola página A4** sin desbordes ni márgenes en blanco.
  - **Persistencia Local**: Guardado automático de datos en `localStorage`.

---

## 📁 Estructura del Proyecto

```text
ODA_Portafolio/
│
├── assets/
│   └── images/               # Recursos gráficos corporativos (hero, abogado, martillo, reuniones)
│
├── css/
│   ├── styles.css            # Estilos globales, diseño responsive y tokens de diseño del sitio
│   ├── admin.css             # Estilos del panel de administración, sidebar proporcional y tabs
│   └── cv-template.css       # Maquetación, tipografías y reglas de impresión del CV en A4
│
├── js/
│   ├── main.js               # Lógica interactiva del portafolio web (animaciones, navegación)
│   ├── admin.js              # Controlador del panel de administración y personalizador de estilos
│   └── cv-wizard.js          # Asistente de pasos de CV, visor reactivo y generador de PDF
│
├── index.html                # Página de inicio / Portafolio público
├── admin.html                # Panel de Control & Creador de CV
├── server.py                 # Servidor HTTP local con enrutamiento amigable
├── .gitignore                # Exclusiones de Git (cálculos KLM, temporales, cachés)
└── README.md                 # Documentación técnica del proyecto
```

---

## 🚀 Puesta en Marcha (Instalación y Ejecución)

### Requisitos Previos
- Cualquier navegador web moderno (Google Chrome, Mozilla Firefox, Microsoft Edge, Safari).
- Python 3.x (opcional pero recomendado para el servidor local).

### Ejecutar con el Servidor Integrado
1. Abre una terminal en la raíz del proyecto.
2. Ejecuta el servidor Python:
   ```bash
   python3 server.py
   ```
3. Accede desde tu navegador a las siguientes rutas:
   - **Portafolio Web**: [http://localhost:8080/](http://localhost:8080/) o `http://localhost:8080/index.html`
   - **Panel de Administración y CV**: [http://localhost:8080/admin](http://localhost:8080/admin) o `http://localhost:8080/admin.html`

### Ejecución Alternativa
También puedes abrir directamente los archivos `index.html` y `admin.html` en tu navegador o utilizar extensiones como **Live Server** en VS Code.

---

## 🛠️ Tecnologías y Librerías

- **Frontend**: HTML5 Semántico, CSS3 Vanilla (Variables CSS, Flexbox, CSS Grid).
- **Programación**: JavaScript ES6+ Vanilla (sin dependencias pesadas de framework).
- **Generación de PDF**: [html2pdf.js v0.10.1](https://github.com/eKoopmans/html2pdf.js) (integración de `html2canvas` y `jsPDF`).
- **Iconografía & Fuentes**: [Font Awesome 6.4](https://fontawesome.com/) y [Google Fonts](https://fonts.google.com/) (*Cinzel*, *Montserrat*, *Outfit*, *Inter*).
- **Backend / Entorno de pruebas**: Python 3 (`http.server` & `socketserver`).

---

## 📄 Licencia

Desarrollado para fines académicos y profesionales en el marco de la Universidad José Antonio Páez (UJAP).