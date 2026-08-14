/* ==========================================================================
   ODA LEGAL PORTAFOLIO - JAVASCRIPT PRINCIPAL
   Gestión de Tema (Claro/Oscuro), Fuente Única (.TTF), Tamaños (px), Paleta y Galería
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  // --------------------------------------------------------------------------
  // Paletas Predeterminadas (5 Colores por Tema)
  // --------------------------------------------------------------------------
  const defaultPalettes = {
    light: {
      c1: '#E4EDF7',
      c2: '#ffffff',
      c3: '#1e293b',
      c4: '#c5a059',
      c5: '#0f172a'
    },
    dark: {
      c1: '#0f172a',
      c2: '#1e293b',
      c3: '#f8fafc',
      c4: '#d4af37',
      c5: '#e5be48'
    }
  };

  // State
  let currentTheme = localStorage.getItem('oda_theme') || 'light';

  // DOM Elements
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const themeToggleIcon = document.getElementById('themeToggleIcon');

  // --------------------------------------------------------------------------
  // Carga de Tamaños de Texto (px) desde LocalStorage
  // --------------------------------------------------------------------------
  function loadFontSizes() {
    const savedTitles = localStorage.getItem('oda_size_titles');
    const savedSubtitles = localStorage.getItem('oda_size_subtitles');
    const savedBody = localStorage.getItem('oda_size_body');

    if (savedTitles) document.documentElement.style.setProperty('--size-titles', `${savedTitles}px`);
    if (savedSubtitles) document.documentElement.style.setProperty('--size-subtitles', `${savedSubtitles}px`);
    if (savedBody) document.documentElement.style.setProperty('--size-body', `${savedBody}px`);
  }

  // --------------------------------------------------------------------------
  // Carga de Fuente Única Personalizada (.TTF) desde LocalStorage
  // --------------------------------------------------------------------------
  function loadCustomFont() {
    const savedFont = localStorage.getItem('oda_custom_font');
    if (savedFont) {
      let fontStyle = document.getElementById('customFontStyle');
      if (!fontStyle) {
        fontStyle = document.createElement('style');
        fontStyle.id = 'customFontStyle';
        document.head.appendChild(fontStyle);
      }
      fontStyle.textContent = `
        @font-face {
          font-family: 'CustomUploadedFont';
          src: url('${savedFont}') format('truetype');
          font-weight: normal;
          font-style: normal;
        }
      `;
      document.documentElement.style.setProperty('--font-main', "'CustomUploadedFont', sans-serif");
    }
  }

  // --------------------------------------------------------------------------
  // Aplicar Tema y Paleta de Colores
  // --------------------------------------------------------------------------
  function applyTheme(theme) {
    currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('oda_theme', theme);

    // Update Icon in Header Toggle
    if (themeToggleIcon) {
      if (theme === 'dark') {
        themeToggleIcon.className = 'fas fa-sun';
        themeToggleBtn.setAttribute('title', 'Cambiar a Modo Claro');
      } else {
        themeToggleIcon.className = 'fas fa-moon';
        themeToggleBtn.setAttribute('title', 'Cambiar a Modo Oscuro');
      }
    }

    // Cargar la paleta de 5 colores guardada para este tema
    const savedPalette = JSON.parse(localStorage.getItem(`oda_palette_${theme}`));
    const activePalette = savedPalette || { ...defaultPalettes[theme] };

    // Aplicar variables CSS para la sección de Servicios
    document.documentElement.style.setProperty('--svc-color-1', activePalette.c1);
    document.documentElement.style.setProperty('--svc-color-2', activePalette.c2);
    document.documentElement.style.setProperty('--svc-color-3', activePalette.c3);
    document.documentElement.style.setProperty('--svc-color-4', activePalette.c4);
    document.documentElement.style.setProperty('--svc-color-5', activePalette.c5);
  }

  // Carga inicial de tamaños, fuente y tema
  loadFontSizes();
  loadCustomFont();
  applyTheme(currentTheme);

  // Toggle Event Listener
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
      applyTheme(nextTheme);
    });
  }

  // --------------------------------------------------------------------------
  // Galería de Fotos - Filtros y Lightbox Modal
  // --------------------------------------------------------------------------
  const filterBtns = document.querySelectorAll('.filter-btn');
  const galleryItems = document.querySelectorAll('.gallery-item');
  const modalLightbox = document.getElementById('modalLightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const closeLightboxBtn = document.getElementById('closeLightboxBtn');

  // Filtros
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.getAttribute('data-filter');

      galleryItems.forEach(item => {
        const category = item.getAttribute('data-category');
        if (filter === 'all' || category === filter) {
          item.style.display = 'block';
        } else {
          item.style.display = 'none';
        }
      });
    });
  });

  // Lightbox Modal
  galleryItems.forEach(item => {
    item.addEventListener('click', () => {
      const imgSrc = item.getAttribute('data-img');
      if (lightboxImg && modalLightbox) {
        lightboxImg.src = imgSrc;
        modalLightbox.classList.add('active');
      }
    });
  });

  if (closeLightboxBtn) {
    closeLightboxBtn.addEventListener('click', () => {
      modalLightbox.classList.remove('active');
    });
  }

  if (modalLightbox) {
    modalLightbox.addEventListener('click', (e) => {
      if (e.target === modalLightbox) {
        modalLightbox.classList.remove('active');
      }
    });
  }

  // --------------------------------------------------------------------------
  // Navegación Móvil
  // --------------------------------------------------------------------------
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const navMenu = document.getElementById('navMenu');

  if (mobileMenuBtn && navMenu) {
    mobileMenuBtn.addEventListener('click', () => {
      navMenu.classList.toggle('active');
      const icon = mobileMenuBtn.querySelector('i');
      if (icon) {
        icon.classList.toggle('fa-bars');
        icon.classList.toggle('fa-times');
      }
    });
  }

  // Cerrar menú móvil al hacer clic en un enlace
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      if (navMenu) navMenu.classList.remove('active');
      const icon = mobileMenuBtn ? mobileMenuBtn.querySelector('i') : null;
      if (icon) {
        icon.classList.add('fa-bars');
        icon.classList.remove('fa-times');
      }
    });
  });

  // --------------------------------------------------------------------------
  // Vista Previa en Vivo desde el panel /admin (cuando esta página se carga
  // dentro de un <iframe>). El panel envía la configuración por postMessage,
  // lo que permite previsualizar cambios NO guardados y funciona incluso en
  // file:// (donde el acceso directo al documento del iframe está bloqueado).
  // --------------------------------------------------------------------------
  function applyPreviewFont(dataUrl) {
    let fontStyle = document.getElementById('customFontStyle');
    if (dataUrl) {
      if (!fontStyle) {
        fontStyle = document.createElement('style');
        fontStyle.id = 'customFontStyle';
        document.head.appendChild(fontStyle);
      }
      fontStyle.textContent = `
        @font-face {
          font-family: 'CustomUploadedFont';
          src: url('${dataUrl}') format('truetype');
          font-weight: normal;
          font-style: normal;
        }
      `;
      document.documentElement.style.setProperty('--font-main', "'CustomUploadedFont', sans-serif");
    } else {
      if (fontStyle) fontStyle.remove();
      document.documentElement.style.setProperty('--font-main', "'Plus Jakarta Sans', sans-serif");
    }
  }

  function applyPreviewConfig(cfg) {
    const root = document.documentElement;

    if (cfg.theme) {
      root.setAttribute('data-theme', cfg.theme);
      if (themeToggleIcon) {
        themeToggleIcon.className = cfg.theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
      }
    }

    if (cfg.palette) {
      root.style.setProperty('--svc-color-1', cfg.palette.c1);
      root.style.setProperty('--svc-color-2', cfg.palette.c2);
      root.style.setProperty('--svc-color-3', cfg.palette.c3);
      root.style.setProperty('--svc-color-4', cfg.palette.c4);
      root.style.setProperty('--svc-color-5', cfg.palette.c5);
    }

    if (cfg.sizes) {
      root.style.setProperty('--size-titles', `${cfg.sizes.titles}px`);
      root.style.setProperty('--size-subtitles', `${cfg.sizes.subtitles}px`);
      root.style.setProperty('--size-body', `${cfg.sizes.body}px`);
    }

    applyPreviewFont(cfg.fontDataUrl);
  }

  window.addEventListener('message', (e) => {
    const data = e.data;
    if (data && data.type === 'oda-preview') {
      applyPreviewConfig(data);
    }
  });

});
