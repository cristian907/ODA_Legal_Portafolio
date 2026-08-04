/* ==========================================================================
   ODA LEGAL PORTAFOLIO - JAVASCRIPT ADMIN
   Gestión Avanzada de Múltiples Estilos (Edición Completa de Todos los Parámetros:
   Nombre, Paleta 1-5, Fuente .TTF, Tamaños de Texto y Modo Claro/Oscuro)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  // Paleta Predeterminada por Defecto (5 Colores)
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

  // Tamaños por defecto y límites ampliados (px)
  const sizeBounds = {
    titles: { default: 40, min: 16, max: 140 },
    subtitles: { default: 20, min: 12, max: 80 },
    body: { default: 16, min: 8, max: 40 }
  };

  function clamp(val, min, max) {
    if (isNaN(val)) return min;
    return Math.min(Math.max(val, min), max);
  }

  // State
  let currentTheme = localStorage.getItem('oda_theme') || 'light';
  let activePalette = JSON.parse(localStorage.getItem(`oda_palette_${currentTheme}`)) || { ...defaultPalettes[currentTheme] };
  let currentFontDataUrl = localStorage.getItem('oda_custom_font') || null;
  let currentFontName = localStorage.getItem('oda_font_name') || null;
  let activeStyleId = localStorage.getItem('oda_active_style_id') || null;
  let editingStyleId = null; // ID del estilo que se está editando en tiempo real

  let activeSizes = {
    titles: clamp(parseInt(localStorage.getItem('oda_size_titles')) || sizeBounds.titles.default, sizeBounds.titles.min, sizeBounds.titles.max),
    subtitles: clamp(parseInt(localStorage.getItem('oda_size_subtitles')) || sizeBounds.subtitles.default, sizeBounds.subtitles.min, sizeBounds.subtitles.max),
    body: clamp(parseInt(localStorage.getItem('oda_size_body')) || sizeBounds.body.default, sizeBounds.body.min, sizeBounds.body.max)
  };

  // Historial ilimitado de múltiples estilos
  let savedStyles = JSON.parse(localStorage.getItem('oda_saved_styles')) || [];

  // DOM Elements - Login & Screens
  const adminLoginScreen = document.getElementById('adminLoginScreen');
  const adminDashboardScreen = document.getElementById('adminDashboardScreen');
  const adminLoginForm = document.getElementById('adminLoginForm');
  const btnLogout = document.getElementById('btnLogout');

  // DOM Elements - Theme, Font, Sizes & Actions
  const btnThemeLight = document.getElementById('btnThemeLight');
  const btnThemeDark = document.getElementById('btnThemeDark');
  const fontFileInput = document.getElementById('fontFileInput');
  const fontStatusTag = document.getElementById('fontStatusTag');
  const btnResetFont = document.getElementById('btnResetFont');
  
  const sizeTitlesInput = document.getElementById('sizeTitlesInput');
  const sizeSubtitlesInput = document.getElementById('sizeSubtitlesInput');
  const sizeBodyInput = document.getElementById('sizeBodyInput');
  const btnResetFontSizes = document.getElementById('btnResetFontSizes');

  const btnSavePalette = document.getElementById('btnSavePalette');
  const btnResetPalette = document.getElementById('btnResetPalette');
  const saveToast = document.getElementById('saveToast');

  // Saved Styles DOM
  const styleNameInput = document.getElementById('styleNameInput');
  const btnSaveNewStyle = document.getElementById('btnSaveNewStyle');
  const savedStylesList = document.getElementById('savedStylesList');

  // Color Pickers & Hex Inputs Map
  const colorElements = {
    c1: { picker: document.getElementById('svcColor1'), hex: document.getElementById('svcHex1') },
    c2: { picker: document.getElementById('svcColor2'), hex: document.getElementById('svcHex2') },
    c3: { picker: document.getElementById('svcColor3'), hex: document.getElementById('svcHex3') },
    c4: { picker: document.getElementById('svcColor4'), hex: document.getElementById('svcHex4') },
    c5: { picker: document.getElementById('svcColor5'), hex: document.getElementById('svcHex5') }
  };

  // Check Login State
  const isLoggedIn = sessionStorage.getItem('oda_admin_logged_in') === 'true';

  if (isLoggedIn) {
    showDashboard();
  } else {
    showLogin();
  }

  // Simulated Login Form Submit
  if (adminLoginForm) {
    adminLoginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      sessionStorage.setItem('oda_admin_logged_in', 'true');
      showDashboard();
    });
  }

  // Logout
  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      sessionStorage.removeItem('oda_admin_logged_in');
      showLogin();
    });
  }

  function showLogin() {
    adminLoginScreen.classList.remove('hidden');
    adminDashboardScreen.classList.add('hidden');
  }

  function showDashboard() {
    adminLoginScreen.classList.add('hidden');
    adminDashboardScreen.classList.remove('hidden');
    applyTheme(currentTheme);
    applyFontSizes(activeSizes);
    if (currentFontDataUrl) {
      applyCustomFont(currentFontDataUrl, currentFontName || 'Fuente Personalizada');
    }
    renderSavedStyles();
  }

  // --------------------------------------------------------------------------
  // 3 Tamaños de Texto (Con Autocorrección Visual y Restablecimiento)
  // --------------------------------------------------------------------------
  function applyFontSizes(sizes) {
    activeSizes.titles = clamp(sizes.titles, sizeBounds.titles.min, sizeBounds.titles.max);
    activeSizes.subtitles = clamp(sizes.subtitles, sizeBounds.subtitles.min, sizeBounds.subtitles.max);
    activeSizes.body = clamp(sizes.body, sizeBounds.body.min, sizeBounds.body.max);

    document.documentElement.style.setProperty('--size-titles', `${activeSizes.titles}px`);
    document.documentElement.style.setProperty('--size-subtitles', `${activeSizes.subtitles}px`);
    document.documentElement.style.setProperty('--size-body', `${activeSizes.body}px`);

    if (sizeTitlesInput) sizeTitlesInput.value = activeSizes.titles;
    if (sizeSubtitlesInput) sizeSubtitlesInput.value = activeSizes.subtitles;
    if (sizeBodyInput) sizeBodyInput.value = activeSizes.body;
  }

  // 1. Títulos
  if (sizeTitlesInput) {
    sizeTitlesInput.addEventListener('input', (e) => {
      let rawVal = parseInt(e.target.value);
      if (!isNaN(rawVal)) {
        if (rawVal > sizeBounds.titles.max) {
          rawVal = sizeBounds.titles.max;
          e.target.value = sizeBounds.titles.max;
        }
        activeSizes.titles = rawVal;
        document.documentElement.style.setProperty('--size-titles', `${rawVal}px`);
      }
    });

    sizeTitlesInput.addEventListener('blur', (e) => {
      let rawVal = parseInt(e.target.value);
      if (isNaN(rawVal) || rawVal < sizeBounds.titles.min) {
        e.target.value = sizeBounds.titles.min;
        activeSizes.titles = sizeBounds.titles.min;
        document.documentElement.style.setProperty('--size-titles', `${sizeBounds.titles.min}px`);
      }
    });
  }

  // 2. Subtítulos
  if (sizeSubtitlesInput) {
    sizeSubtitlesInput.addEventListener('input', (e) => {
      let rawVal = parseInt(e.target.value);
      if (!isNaN(rawVal)) {
        if (rawVal > sizeBounds.subtitles.max) {
          rawVal = sizeBounds.subtitles.max;
          e.target.value = sizeBounds.subtitles.max;
        }
        activeSizes.subtitles = rawVal;
        document.documentElement.style.setProperty('--size-subtitles', `${rawVal}px`);
      }
    });

    sizeSubtitlesInput.addEventListener('blur', (e) => {
      let rawVal = parseInt(e.target.value);
      if (isNaN(rawVal) || rawVal < sizeBounds.subtitles.min) {
        e.target.value = sizeBounds.subtitles.min;
        activeSizes.subtitles = sizeBounds.subtitles.min;
        document.documentElement.style.setProperty('--size-subtitles', `${sizeBounds.subtitles.min}px`);
      }
    });
  }

  // 3. Textos
  if (sizeBodyInput) {
    sizeBodyInput.addEventListener('input', (e) => {
      let rawVal = parseInt(e.target.value);
      if (!isNaN(rawVal)) {
        if (rawVal > sizeBounds.body.max) {
          rawVal = sizeBounds.body.max;
          e.target.value = sizeBounds.body.max;
        }
        activeSizes.body = rawVal;
        document.documentElement.style.setProperty('--size-body', `${rawVal}px`);
      }
    });

    sizeBodyInput.addEventListener('blur', (e) => {
      let rawVal = parseInt(e.target.value);
      if (isNaN(rawVal) || rawVal < sizeBounds.body.min) {
        e.target.value = sizeBounds.body.min;
        activeSizes.body = sizeBounds.body.min;
        document.documentElement.style.setProperty('--size-body', `${sizeBounds.body.min}px`);
      }
    });
  }

  // Restablecer exclusivamente los tamaños de texto por defecto
  if (btnResetFontSizes) {
    btnResetFontSizes.addEventListener('click', () => {
      applyFontSizes({
        titles: sizeBounds.titles.default,
        subtitles: sizeBounds.subtitles.default,
        body: sizeBounds.body.default
      });

      localStorage.removeItem('oda_size_titles');
      localStorage.removeItem('oda_size_subtitles');
      localStorage.removeItem('oda_size_body');

      showToast('<i class="fas fa-undo"></i> Tamaños de texto restablecidos (40, 20, 16px)');
    });
  }

  // --------------------------------------------------------------------------
  // Carga y Manejo de Fuente Única (.TTF)
  // --------------------------------------------------------------------------
  function applyCustomFont(dataUrl, fontName) {
    let fontStyle = document.getElementById('customFontStyle');
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

    if (fontStatusTag) {
      fontStatusTag.innerHTML = `<i class="fas fa-check-circle"></i> Fuente activa: ${fontName}`;
    }
  }

  function resetToDefaultFont() {
    const fontStyle = document.getElementById('customFontStyle');
    if (fontStyle) fontStyle.remove();

    document.documentElement.style.setProperty('--font-main', "'Plus Jakarta Sans', sans-serif");
    currentFontDataUrl = null;
    currentFontName = null;
    localStorage.removeItem('oda_custom_font');
    localStorage.removeItem('oda_font_name');

    if (fontFileInput) fontFileInput.value = '';
    if (fontStatusTag) {
      fontStatusTag.innerHTML = `<i class="fas fa-check-circle"></i> Fuente por defecto: Plus Jakarta Sans`;
    }
  }

  if (fontFileInput) {
    fontFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        if (!file.name.toLowerCase().endsWith('.ttf')) {
          alert('Por favor selecciona un archivo de fuente válido con extensión .ttf');
          return;
        }

        const reader = new FileReader();
        reader.onload = (evt) => {
          currentFontDataUrl = evt.target.result;
          currentFontName = file.name;
          applyCustomFont(currentFontDataUrl, currentFontName);
        };
        reader.readAsDataURL(file);
      }
    });
  }

  if (btnResetFont) {
    btnResetFont.addEventListener('click', resetToDefaultFont);
  }

  // --------------------------------------------------------------------------
  // Aplicar Tema y Paleta en Tiempo Real
  // --------------------------------------------------------------------------
  function applyTheme(theme) {
    currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('oda_theme', theme);

    if (theme === 'dark') {
      if (btnThemeDark) btnThemeDark.classList.add('active');
      if (btnThemeLight) btnThemeLight.classList.remove('active');
    } else {
      if (btnThemeLight) btnThemeLight.classList.add('active');
      if (btnThemeDark) btnThemeDark.classList.remove('active');
    }

    const savedPalette = JSON.parse(localStorage.getItem(`oda_palette_${theme}`));
    activePalette = savedPalette || { ...defaultPalettes[theme] };

    updateUIAndPreview(activePalette);
  }

  function updateUIAndPreview(palette) {
    activePalette = { ...palette };

    document.documentElement.style.setProperty('--svc-color-1', palette.c1);
    document.documentElement.style.setProperty('--svc-color-2', palette.c2);
    document.documentElement.style.setProperty('--svc-color-3', palette.c3);
    document.documentElement.style.setProperty('--svc-color-4', palette.c4);
    document.documentElement.style.setProperty('--svc-color-5', palette.c5);

    Object.keys(colorElements).forEach(key => {
      const colorVal = palette[key];
      if (colorElements[key].picker) colorElements[key].picker.value = colorVal;
      if (colorElements[key].hex) colorElements[key].hex.value = colorVal.toUpperCase();
    });
  }

  // Theme Switchers
  if (btnThemeLight) btnThemeLight.addEventListener('click', () => applyTheme('light'));
  if (btnThemeDark) btnThemeDark.addEventListener('click', () => applyTheme('dark'));

  // Hex / Color Picker Sync
  Object.keys(colorElements).forEach(key => {
    const picker = colorElements[key].picker;
    const hexInput = colorElements[key].hex;

    if (picker) {
      picker.addEventListener('input', (e) => {
        const hexVal = e.target.value.toUpperCase();
        if (hexInput) hexInput.value = hexVal;
        activePalette[key] = hexVal;
        document.documentElement.style.setProperty(`--svc-color-${key.slice(1)}`, hexVal);
      });
    }

    if (hexInput) {
      hexInput.addEventListener('input', (e) => {
        let val = e.target.value.trim();
        if (!val.startsWith('#')) {
          val = '#' + val;
        }

        if (/^#([0-9A-F]{3}){1,2}$/i.test(val)) {
          if (picker) picker.value = val;
          activePalette[key] = val;
          document.documentElement.style.setProperty(`--svc-color-${key.slice(1)}`, val);
        }
      });
    }
  });

  // --------------------------------------------------------------------------
  // Gestión Avanzada de Múltiples Estilos (Cargar, Editar Completo, Borrar)
  // --------------------------------------------------------------------------
  function renderSavedStyles() {
    if (!savedStylesList) return;

    if (savedStyles.length === 0) {
      savedStylesList.innerHTML = '<p class="empty-styles-text">No hay estilos guardados previamente.</p>';
      return;
    }

    savedStylesList.innerHTML = '';
    savedStyles.forEach((styleItem, index) => {
      const itemEl = document.createElement('div');
      const isActive = styleItem.id === activeStyleId;
      const isEditing = styleItem.id === editingStyleId;

      itemEl.className = `saved-style-card ${isActive ? 'is-active ' : ''}${isEditing ? 'is-editing' : ''}`;

      const themeIcon = styleItem.theme === 'dark' ? '🌙' : '☀️';
      const fontLabel = styleItem.fontName ? styleItem.fontName : 'Fuente Estándar';
      const activeBadgeHtml = isActive ? `<span class="badge-active-style"><i class="fas fa-check-circle"></i> ACTIVO</span>` : '';
      const editingBadgeHtml = isEditing ? `<span class="saved-style-tag" style="background:#3b82f6; color:#fff;"><i class="fas fa-pen"></i> EDITANDO...</span>` : '';

      itemEl.innerHTML = `
        <div class="saved-style-info">
          <div class="saved-style-header">
            <span class="saved-style-name">${styleItem.name}</span>
            <span class="saved-style-tag">${themeIcon} ${styleItem.theme.toUpperCase()}</span>
            ${activeBadgeHtml}
            ${editingBadgeHtml}
          </div>
          <div class="saved-style-details">
            <span class="font-meta" title="${fontLabel}"><i class="fas fa-font"></i> ${fontLabel}</span>
            <span class="sizes-meta"><i class="fas fa-text-height"></i> T:${styleItem.sizes.titles}px S:${styleItem.sizes.subtitles}px P:${styleItem.sizes.body}px</span>
          </div>
          <div class="saved-style-swatches">
            <span style="background:${styleItem.palette.c1}"></span>
            <span style="background:${styleItem.palette.c2}"></span>
            <span style="background:${styleItem.palette.c3}"></span>
            <span style="background:${styleItem.palette.c4}"></span>
            <span style="background:${styleItem.palette.c5}"></span>
          </div>
        </div>
        <div class="saved-style-actions">
          <button class="btn-load-style" data-index="${index}" title="Activar este estilo"><i class="fas fa-download"></i> Cargar</button>
          <button class="btn-edit-style" data-index="${index}" title="Editar este estilo completo"><i class="fas fa-pen"></i> Editar</button>
          <button class="btn-delete-style" data-index="${index}" title="Borrar este estilo"><i class="fas fa-trash-alt"></i> Borrar</button>
        </div>
      `;

      savedStylesList.appendChild(itemEl);
    });

    // 1. Botón Cargar
    document.querySelectorAll('.btn-load-style').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-index'));
        if (savedStyles[idx]) {
          editingStyleId = null;
          updateSaveButtonUI();
          loadStyleConfiguration(savedStyles[idx]);
        }
      });
    });

    // 2. Botón Editar COMPLETO (Carga todas las propiedades en los controles para modificación integral)
    document.querySelectorAll('.btn-edit-style').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-index'));
        const targetStyle = savedStyles[idx];
        if (targetStyle) {
          editingStyleId = targetStyle.id;
          
          // Cargar todas las propiedades en los controles interactivos del panel
          loadStyleConfiguration(targetStyle, false);

          // Cargar el nombre en el campo de texto de edición
          if (styleNameInput) {
            styleNameInput.value = targetStyle.name;
            styleNameInput.focus();
          }

          updateSaveButtonUI();
          renderSavedStyles();

          showToast(`<i class="fas fa-pen"></i> Editando "${targetStyle.name}". Modifica colores, fuentes o tamaños y haz clic en "Actualizar Estilo".`);
        }
      });
    });

    // 3. Botón Borrar (Con aviso especial si es el ESTILO ACTIVO)
    document.querySelectorAll('.btn-delete-style').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-index'));
        const targetStyle = savedStyles[idx];

        if (targetStyle) {
          if (targetStyle.id === editingStyleId) {
            editingStyleId = null;
            updateSaveButtonUI();
          }

          const isActive = (targetStyle.id === activeStyleId);

          if (isActive) {
            // Confirmación especial para el ESTILO ACTIVO
            const confirmDeleteActive = confirm(`⚠️ ATENCIÓN: El estilo "${targetStyle.name}" es el ESTILO ACTIVO actualmente en el sitio.\n\nSi lo eliminas, el portal se restablecerá automáticamente a los valores por defecto de fábrica.\n\n¿Estás seguro de que deseas continuar y borrarlo?`);

            if (confirmDeleteActive) {
              savedStyles.splice(idx, 1);
              localStorage.setItem('oda_saved_styles', JSON.stringify(savedStyles));
              activeStyleId = null;
              localStorage.removeItem('oda_active_style_id');

              // Restablecer valores de fábrica
              executeFullResetToDefaults();
              renderSavedStyles();
              showToast('<i class="fas fa-trash-alt"></i> Estilo activo eliminado. Portal restablecido por defecto.');
            }
          } else {
            // Confirmación normal para estilos no activos
            const confirmDelete = confirm(`¿Estás seguro de que deseas borrar el estilo "${targetStyle.name}"?`);

            if (confirmDelete) {
              savedStyles.splice(idx, 1);
              localStorage.setItem('oda_saved_styles', JSON.stringify(savedStyles));
              renderSavedStyles();
              showToast(`<i class="fas fa-trash-alt"></i> Estilo "${targetStyle.name}" eliminado del historial`);
            }
          }
        }
      });
    });
  }

  function updateSaveButtonUI() {
    if (!btnSaveNewStyle) return;
    if (editingStyleId) {
      const editStyleObj = savedStyles.find(s => s.id === editingStyleId);
      const name = editStyleObj ? editStyleObj.name : 'Estilo';
      btnSaveNewStyle.innerHTML = `<i class="fas fa-save"></i> Actualizar Estilo "${name}"`;
      btnSaveNewStyle.style.background = 'linear-gradient(135deg, #3b82f6, #1d4ed8)';
    } else {
      btnSaveNewStyle.innerHTML = `<i class="fas fa-bookmark"></i> Guardar Estilo`;
      btnSaveNewStyle.style.background = '';
    }
  }

  function loadStyleConfiguration(styleObj, notify = true) {
    activeStyleId = styleObj.id;
    localStorage.setItem('oda_active_style_id', activeStyleId);

    // 1. Tema
    applyTheme(styleObj.theme);

    // 2. Paleta activa
    updateUIAndPreview(styleObj.palette);
    localStorage.setItem(`oda_palette_${styleObj.theme}`, JSON.stringify(styleObj.palette));

    // 3. Fuente
    if (styleObj.fontDataUrl) {
      currentFontDataUrl = styleObj.fontDataUrl;
      currentFontName = styleObj.fontName;
      applyCustomFont(styleObj.fontDataUrl, styleObj.fontName);
      localStorage.setItem('oda_custom_font', styleObj.fontDataUrl);
      localStorage.setItem('oda_font_name', styleObj.fontName);
    } else {
      resetToDefaultFont();
    }

    // 4. Tamaños de texto
    applyFontSizes(styleObj.sizes);
    localStorage.setItem('oda_size_titles', styleObj.sizes.titles);
    localStorage.setItem('oda_size_subtitles', styleObj.sizes.subtitles);
    localStorage.setItem('oda_size_body', styleObj.sizes.body);

    renderSavedStyles();
    if (notify) {
      showToast(`<i class="fas fa-magic"></i> Estilo "${styleObj.name}" activado en el sitio`);
    }
  }

  // Guardar nuevo estilo o actualizar estilo existente en modo edición
  if (btnSaveNewStyle) {
    btnSaveNewStyle.addEventListener('click', () => {
      const inputVal = styleNameInput ? styleNameInput.value.trim() : '';

      // MODO EDICIÓN: Actualizar el estilo existente en su totalidad
      if (editingStyleId) {
        const editIndex = savedStyles.findIndex(s => s.id === editingStyleId);
        if (editIndex !== -1) {
          const nameToUse = inputVal || savedStyles[editIndex].name;
          
          // Validar duplicado excluyendo el objeto actual
          const duplicateExists = savedStyles.some((s, i) => i !== editIndex && s.name.toLowerCase() === nameToUse.toLowerCase());
          if (duplicateExists) {
            alert(`Ya existe otro estilo guardado con el nombre "${nameToUse}". Por favor elige un nombre diferente.`);
            return;
          }

          // Sobrescribir TODAS las propiedades del estilo guardado
          savedStyles[editIndex] = {
            id: editingStyleId,
            name: nameToUse,
            theme: currentTheme,
            palette: { ...activePalette },
            fontDataUrl: currentFontDataUrl,
            fontName: currentFontName,
            sizes: { ...activeSizes }
          };

          activeStyleId = editingStyleId;
          localStorage.setItem('oda_active_style_id', activeStyleId);
          localStorage.setItem('oda_saved_styles', JSON.stringify(savedStyles));

          localStorage.setItem(`oda_palette_${currentTheme}`, JSON.stringify(activePalette));
          localStorage.setItem('oda_size_titles', activeSizes.titles);
          localStorage.setItem('oda_size_subtitles', activeSizes.subtitles);
          localStorage.setItem('oda_size_body', activeSizes.body);

          editingStyleId = null;
          updateSaveButtonUI();
          if (styleNameInput) styleNameInput.value = '';
          renderSavedStyles();

          showToast(`<i class="fas fa-check-circle"></i> Estilo "${nameToUse}" actualizado con éxito con todos los nuevos parámetros`);
          return;
        }
      }

      // MODO NUEVO: Crear un estilo nuevo desde cero
      const name = inputVal 
        ? inputVal 
        : `Estilo ${currentTheme === 'dark' ? 'Oscuro' : 'Claro'} #${savedStyles.length + 1}`;
      
      const duplicateExists = savedStyles.some(s => s.name.toLowerCase() === name.toLowerCase());

      if (duplicateExists) {
        alert(`Ya existe un estilo guardado con el nombre "${name}". Por favor ingresa un nombre diferente o elimina el estilo existente con ese nombre.`);
        return;
      }

      const newStyleId = `style_${Date.now()}`;
      const newStyleObj = {
        id: newStyleId,
        name: name,
        theme: currentTheme,
        palette: { ...activePalette },
        fontDataUrl: currentFontDataUrl,
        fontName: currentFontName,
        sizes: { ...activeSizes }
      };

      activeStyleId = newStyleId;
      localStorage.setItem('oda_active_style_id', activeStyleId);

      savedStyles.unshift(newStyleObj);
      localStorage.setItem('oda_saved_styles', JSON.stringify(savedStyles));
      
      localStorage.setItem(`oda_palette_${currentTheme}`, JSON.stringify(activePalette));
      localStorage.setItem('oda_size_titles', activeSizes.titles);
      localStorage.setItem('oda_size_subtitles', activeSizes.subtitles);
      localStorage.setItem('oda_size_body', activeSizes.body);

      if (styleNameInput) styleNameInput.value = '';
      renderSavedStyles();

      showToast(`<i class="fas fa-bookmark"></i> Estilo "${name}" guardado e instalado como ACTIVO`);
    });
  }

  // --------------------------------------------------------------------------
  // Botón GUARDAR Y ACTIVAR CONFIGURACIÓN GENERAL
  // --------------------------------------------------------------------------
  if (btnSavePalette) {
    btnSavePalette.addEventListener('click', () => {
      localStorage.setItem(`oda_palette_${currentTheme}`, JSON.stringify(activePalette));

      localStorage.setItem('oda_size_titles', activeSizes.titles);
      localStorage.setItem('oda_size_subtitles', activeSizes.subtitles);
      localStorage.setItem('oda_size_body', activeSizes.body);

      if (currentFontDataUrl) {
        localStorage.setItem('oda_custom_font', currentFontDataUrl);
        localStorage.setItem('oda_font_name', currentFontName);
      } else {
        localStorage.removeItem('oda_custom_font');
        localStorage.removeItem('oda_font_name');
      }

      showToast('<i class="fas fa-check-circle"></i> ¡Estilo actual activado y guardado en el sitio principal!');
    });
  }

  // --------------------------------------------------------------------------
  // Botón RESTABLECER CON CONFIRMACIÓN GLOBAL
  // --------------------------------------------------------------------------
  if (btnResetPalette) {
    btnResetPalette.addEventListener('click', () => {
      const confirmReset = confirm('¿Estás seguro de que deseas restablecer la configuración activa (colores, fuente y tamaños) a los valores por defecto?');
      
      if (confirmReset) {
        executeFullResetToDefaults();
        showToast('<i class="fas fa-undo"></i> Configuración activa restablecida por defecto');
      }
    });
  }

  function executeFullResetToDefaults() {
    activeStyleId = null;
    editingStyleId = null;
    updateSaveButtonUI();
    localStorage.removeItem('oda_active_style_id');

    const defaultPal = defaultPalettes[currentTheme];
    updateUIAndPreview(defaultPal);
    localStorage.setItem(`oda_palette_${currentTheme}`, JSON.stringify(defaultPal));
    
    applyFontSizes({
      titles: sizeBounds.titles.default,
      subtitles: sizeBounds.subtitles.default,
      body: sizeBounds.body.default
    });
    localStorage.removeItem('oda_size_titles');
    localStorage.removeItem('oda_size_subtitles');
    localStorage.removeItem('oda_size_body');
    
    resetToDefaultFont();
    renderSavedStyles();
  }

  // Helper de Toast
  function showToast(htmlMsg) {
    if (!saveToast) return;
    saveToast.innerHTML = htmlMsg;
    saveToast.classList.remove('hidden');
    saveToast.classList.add('show');

    setTimeout(() => {
      saveToast.classList.remove('show');
      setTimeout(() => saveToast.classList.add('hidden'), 300);
    }, 2500);
  }

});
