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

  // DOM Elements
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const themeToggleIcon = document.getElementById('themeToggleIcon');

  // Política de temas definida en el panel /admin
  const allowThemeToggle = localStorage.getItem('oda_theme_allow_toggle') !== 'false'; // por defecto: permitido
  const themeDefault = localStorage.getItem('oda_theme_default') || 'light';

  // State: si el visitante puede cambiar, respeta su preferencia guardada;
  // si el modo está forzado, se ignora y se usa el modo por defecto.
  let currentTheme = allowThemeToggle
    ? (localStorage.getItem('oda_theme') || themeDefault)
    : themeDefault;

  // Ocultar el botón de tema cuando el modo está forzado
  if (themeToggleBtn && !allowThemeToggle) themeToggleBtn.style.display = 'none';

  const DEFAULT_SIZES = { titles: 40, subtitles: 20, body: 16 };

  // --------------------------------------------------------------------------
  // Estilo activo POR TEMA (cada modo tiene su propio estilo completo:
  // paleta + tamaños + fuente). El panel /admin guarda oda_applied_light y
  // oda_applied_dark; si falta, se usan los valores de fábrica de ese tema.
  // --------------------------------------------------------------------------
  function getAppliedStyle(theme) {
    try {
      const raw = localStorage.getItem(`oda_applied_${theme}`);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* JSON inválido → fábrica */ }
    return null;
  }

  function applyFont(dataUrl) {
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

  function applyStyleForTheme(theme) {
    const root = document.documentElement;
    const s = getAppliedStyle(theme);
    const palette = (s && s.palette) ? s.palette : defaultPalettes[theme];
    const sizes = (s && s.sizes) ? s.sizes : DEFAULT_SIZES;

    root.style.setProperty('--svc-color-1', palette.c1);
    root.style.setProperty('--svc-color-2', palette.c2);
    root.style.setProperty('--svc-color-3', palette.c3);
    root.style.setProperty('--svc-color-4', palette.c4);
    root.style.setProperty('--svc-color-5', palette.c5);

    root.style.setProperty('--size-titles', `${sizes.titles}px`);
    root.style.setProperty('--size-subtitles', `${sizes.subtitles}px`);
    root.style.setProperty('--size-body', `${sizes.body}px`);

    applyFont(s ? s.fontDataUrl : null);
  }

  // --------------------------------------------------------------------------
  // Aplicar Tema (cambia data-theme y todo el estilo de ese modo)
  // --------------------------------------------------------------------------
  function applyTheme(theme, persist = true) {
    currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    if (persist) localStorage.setItem('oda_theme', theme);

    if (themeToggleIcon) {
      if (theme === 'dark') {
        themeToggleIcon.className = 'fas fa-sun';
        if (themeToggleBtn) themeToggleBtn.setAttribute('title', 'Cambiar a Modo Claro');
      } else {
        themeToggleIcon.className = 'fas fa-moon';
        if (themeToggleBtn) themeToggleBtn.setAttribute('title', 'Cambiar a Modo Oscuro');
      }
    }

    applyStyleForTheme(theme);
  }

  // Carga inicial
  applyTheme(currentTheme, allowThemeToggle); // no persistir cuando el modo está forzado

  // Toggle Event Listener (solo si el visitante tiene permitido cambiar de modo)
  if (themeToggleBtn && allowThemeToggle) {
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
  function applyPreviewConfig(cfg) {
    const root = document.documentElement;

    if (cfg.theme) {
      root.setAttribute('data-theme', cfg.theme);
      if (themeToggleIcon) {
        themeToggleIcon.className = cfg.theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
      }
    }

    // Reflejar en la vista previa si el visitante podrá cambiar de modo
    if (typeof cfg.allowToggle === 'boolean' && themeToggleBtn) {
      themeToggleBtn.style.display = cfg.allowToggle ? '' : 'none';
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

    applyFont(cfg.fontDataUrl);
  }

  window.addEventListener('message', (e) => {
    const data = e.data;
    if (data && data.type === 'oda-preview') {
      applyPreviewConfig(data);
    }
  });

});
