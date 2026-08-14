/* ==========================================================================
   ODA LEGAL PORTAFOLIO - JAVASCRIPT ADMIN (REDISEÑO)
   Editor con pestañas (Editor / Biblioteca), barra de acción única, edición
   con banner inline, tamaños con slider+número sincronizados, y biblioteca
   de estilos con buscador + paginación (4 por página).
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

  const PAGE_SIZE = 4; // Estilos por página en la biblioteca

  function clamp(val, min, max) {
    if (isNaN(val)) return min;
    return Math.min(Math.max(val, min), max);
  }

  // Escapar HTML para evitar inyección desde nombres de estilo / fuente
  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[c]);
  }

  // ------------------------------------------------------------------------
  // Estado
  // ------------------------------------------------------------------------
  let currentTheme = localStorage.getItem('oda_theme') || 'light';
  let activePalette = JSON.parse(localStorage.getItem(`oda_palette_${currentTheme}`)) || { ...defaultPalettes[currentTheme] };
  let currentFontDataUrl = localStorage.getItem('oda_custom_font') || null;
  let currentFontName = localStorage.getItem('oda_font_name') || null;
  let activeStyleId = localStorage.getItem('oda_active_style_id') || null;
  let editingStyleId = null; // ID del estilo en edición

  let activeSizes = {
    titles: clamp(parseInt(localStorage.getItem('oda_size_titles')) || sizeBounds.titles.default, sizeBounds.titles.min, sizeBounds.titles.max),
    subtitles: clamp(parseInt(localStorage.getItem('oda_size_subtitles')) || sizeBounds.subtitles.default, sizeBounds.subtitles.min, sizeBounds.subtitles.max),
    body: clamp(parseInt(localStorage.getItem('oda_size_body')) || sizeBounds.body.default, sizeBounds.body.min, sizeBounds.body.max)
  };

  let savedStyles = JSON.parse(localStorage.getItem('oda_saved_styles')) || [];

  // Estado de la biblioteca (paginación + búsqueda)
  let currentLibPage = 1;
  let librarySearch = '';

  // ------------------------------------------------------------------------
  // DOM
  // ------------------------------------------------------------------------
  const adminLoginScreen = document.getElementById('adminLoginScreen');
  const adminDashboardScreen = document.getElementById('adminDashboardScreen');
  const adminLoginForm = document.getElementById('adminLoginForm');
  const btnLogout = document.getElementById('btnLogout');

  // Pestañas
  const tabEditorBtn = document.getElementById('tabEditorBtn');
  const tabLibraryBtn = document.getElementById('tabLibraryBtn');
  const paneEditor = document.getElementById('paneEditor');
  const paneLibrary = document.getElementById('paneLibrary');
  const libCount = document.getElementById('libCount');

  // Tema, fuente, tamaños, acciones
  const btnThemeLight = document.getElementById('btnThemeLight');
  const btnThemeDark = document.getElementById('btnThemeDark');
  const fontFileInput = document.getElementById('fontFileInput');
  const fontStatusTag = document.getElementById('fontStatusTag');
  const btnResetFont = document.getElementById('btnResetFont');

  const sizeTitlesInput = document.getElementById('sizeTitlesInput');
  const sizeSubtitlesInput = document.getElementById('sizeSubtitlesInput');
  const sizeBodyInput = document.getElementById('sizeBodyInput');
  const sizeTitlesRange = document.getElementById('sizeTitlesRange');
  const sizeSubtitlesRange = document.getElementById('sizeSubtitlesRange');
  const sizeBodyRange = document.getElementById('sizeBodyRange');

  const btnSavePalette = document.getElementById('btnSavePalette');
  const btnResetPalette = document.getElementById('btnResetPalette');
  const saveToast = document.getElementById('saveToast');

  // Biblioteca
  const styleNameInput = document.getElementById('styleNameInput');
  const btnSaveNewStyle = document.getElementById('btnSaveNewStyle');
  const savedStylesList = document.getElementById('savedStylesList');
  const styleSearchInput = document.getElementById('styleSearchInput');
  const libPagination = document.getElementById('libPagination');

  // Banner de edición
  const editingBanner = document.getElementById('editingBanner');
  const editingNameInput = document.getElementById('editingNameInput');
  const btnUpdateStyle = document.getElementById('btnUpdateStyle');
  const btnCancelEdit = document.getElementById('btnCancelEdit');

  // Color pickers & hex inputs
  const colorElements = {
    c1: { picker: document.getElementById('svcColor1'), hex: document.getElementById('svcHex1') },
    c2: { picker: document.getElementById('svcColor2'), hex: document.getElementById('svcHex2') },
    c3: { picker: document.getElementById('svcColor3'), hex: document.getElementById('svcHex3') },
    c4: { picker: document.getElementById('svcColor4'), hex: document.getElementById('svcHex4') },
    c5: { picker: document.getElementById('svcColor5'), hex: document.getElementById('svcHex5') }
  };

  // Vista previa (iframe de la página real). pushPreview está hoisted, por eso
  // el listener de 'load' puede referenciarlo antes de su definición.
  const previewFrame = document.getElementById('previewFrame');
  if (previewFrame) previewFrame.addEventListener('load', pushPreview);

  function pushPreview() {
    if (!previewFrame || !previewFrame.contentWindow) return;
    previewFrame.contentWindow.postMessage({
      type: 'oda-preview',
      theme: currentTheme,
      palette: { ...activePalette },
      sizes: { ...activeSizes },
      fontDataUrl: currentFontDataUrl,
      fontName: currentFontName
    }, '*');
  }

  // Configuración de los 3 tamaños (número + slider comparten estado)
  const sizeConfigs = [
    { key: 'titles', num: sizeTitlesInput, range: sizeTitlesRange, cssVar: '--size-titles' },
    { key: 'subtitles', num: sizeSubtitlesInput, range: sizeSubtitlesRange, cssVar: '--size-subtitles' },
    { key: 'body', num: sizeBodyInput, range: sizeBodyRange, cssVar: '--size-body' }
  ];

  // ------------------------------------------------------------------------
  // Login / Dashboard
  // ------------------------------------------------------------------------
  const isLoggedIn = sessionStorage.getItem('oda_admin_logged_in') === 'true';
  if (isLoggedIn) { showDashboard(); } else { showLogin(); }

  if (adminLoginForm) {
    adminLoginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      sessionStorage.setItem('oda_admin_logged_in', 'true');
      showDashboard();
    });
  }

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
    showEditorTab();
    renderSavedStyles();
    pushPreview();
  }

  // ------------------------------------------------------------------------
  // Pestañas
  // ------------------------------------------------------------------------
  function activateTab(which) {
    const editorActive = which === 'editor';
    if (paneEditor) paneEditor.classList.toggle('active', editorActive);
    if (paneLibrary) paneLibrary.classList.toggle('active', !editorActive);
    if (tabEditorBtn) {
      tabEditorBtn.classList.toggle('active', editorActive);
      tabEditorBtn.setAttribute('aria-selected', String(editorActive));
    }
    if (tabLibraryBtn) {
      tabLibraryBtn.classList.toggle('active', !editorActive);
      tabLibraryBtn.setAttribute('aria-selected', String(!editorActive));
    }
  }
  function showEditorTab() { activateTab('editor'); }
  function showLibraryTab() { activateTab('library'); }

  if (tabEditorBtn) tabEditorBtn.addEventListener('click', showEditorTab);
  if (tabLibraryBtn) tabLibraryBtn.addEventListener('click', showLibraryTab);

  // ------------------------------------------------------------------------
  // Tamaños de texto (slider + número sincronizados, con clamp)
  // ------------------------------------------------------------------------
  function applyFontSizes(sizes) {
    activeSizes.titles = clamp(sizes.titles, sizeBounds.titles.min, sizeBounds.titles.max);
    activeSizes.subtitles = clamp(sizes.subtitles, sizeBounds.subtitles.min, sizeBounds.subtitles.max);
    activeSizes.body = clamp(sizes.body, sizeBounds.body.min, sizeBounds.body.max);

    sizeConfigs.forEach((cfg) => {
      const v = activeSizes[cfg.key];
      document.documentElement.style.setProperty(cfg.cssVar, `${v}px`);
      if (cfg.num) cfg.num.value = v;
      if (cfg.range) cfg.range.value = v;
    });
    pushPreview();
  }

  sizeConfigs.forEach((cfg) => {
    const b = sizeBounds[cfg.key];

    function setValue(v, { updateNum = true, updateRange = true } = {}) {
      activeSizes[cfg.key] = v;
      document.documentElement.style.setProperty(cfg.cssVar, `${v}px`);
      if (updateNum && cfg.num) cfg.num.value = v;
      if (updateRange && cfg.range) cfg.range.value = v;
      pushPreview();
    }

    if (cfg.range) {
      cfg.range.addEventListener('input', (e) => {
        setValue(clamp(parseInt(e.target.value), b.min, b.max), { updateRange: false });
      });
    }

    if (cfg.num) {
      cfg.num.addEventListener('input', (e) => {
        let raw = parseInt(e.target.value);
        if (isNaN(raw)) return; // permitir campo vacío mientras se escribe
        if (raw > b.max) { raw = b.max; e.target.value = b.max; }
        setValue(raw, { updateNum: false });
      });
      cfg.num.addEventListener('blur', (e) => {
        let raw = parseInt(e.target.value);
        if (isNaN(raw) || raw < b.min) raw = b.min;
        if (raw > b.max) raw = b.max;
        setValue(raw);
      });
    }
  });

  // ------------------------------------------------------------------------
  // Fuente única (.ttf)
  // ------------------------------------------------------------------------
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
    if (fontStatusTag) fontStatusTag.textContent = fontName;
    pushPreview();
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
    if (fontStatusTag) fontStatusTag.textContent = 'Plus Jakarta Sans (por defecto)';
    pushPreview();
  }

  if (fontFileInput) {
    fontFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (!file.name.toLowerCase().endsWith('.ttf')) {
        alert('Selecciona un archivo de fuente válido con extensión .ttf');
        fontFileInput.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onload = (evt) => {
        currentFontDataUrl = evt.target.result;
        currentFontName = file.name;
        applyCustomFont(currentFontDataUrl, currentFontName);
      };
      reader.readAsDataURL(file);
    });
  }

  if (btnResetFont) btnResetFont.addEventListener('click', resetToDefaultFont);

  // ------------------------------------------------------------------------
  // Tema y paleta
  // ------------------------------------------------------------------------
  function applyTheme(theme) {
    currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('oda_theme', theme);

    if (btnThemeLight) btnThemeLight.classList.toggle('active', theme !== 'dark');
    if (btnThemeDark) btnThemeDark.classList.toggle('active', theme === 'dark');

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

    Object.keys(colorElements).forEach((key) => {
      const colorVal = palette[key];
      if (colorElements[key].picker) colorElements[key].picker.value = colorVal;
      if (colorElements[key].hex) colorElements[key].hex.value = colorVal.toUpperCase();
    });
    pushPreview();
  }

  if (btnThemeLight) btnThemeLight.addEventListener('click', () => applyTheme('light'));
  if (btnThemeDark) btnThemeDark.addEventListener('click', () => applyTheme('dark'));

  // Sincronía picker <-> hex
  Object.keys(colorElements).forEach((key) => {
    const picker = colorElements[key].picker;
    const hexInput = colorElements[key].hex;

    if (picker) {
      picker.addEventListener('input', (e) => {
        const hexVal = e.target.value.toUpperCase();
        if (hexInput) hexInput.value = hexVal;
        activePalette[key] = hexVal;
        document.documentElement.style.setProperty(`--svc-color-${key.slice(1)}`, hexVal);
        pushPreview();
      });
    }

    if (hexInput) {
      hexInput.addEventListener('input', (e) => {
        let val = e.target.value.trim();
        if (!val.startsWith('#')) val = '#' + val;
        if (/^#([0-9A-F]{3}){1,2}$/i.test(val)) {
          if (picker) picker.value = val;
          activePalette[key] = val;
          document.documentElement.style.setProperty(`--svc-color-${key.slice(1)}`, val);
          pushPreview();
        }
      });
    }
  });

  // ------------------------------------------------------------------------
  // Biblioteca: filtrado, paginación y render
  // ------------------------------------------------------------------------
  function getFilteredStyles() {
    const term = librarySearch.trim().toLowerCase();
    if (!term) return savedStyles;
    return savedStyles.filter((s) => s.name.toLowerCase().includes(term));
  }

  function renderSavedStyles() {
    if (!savedStylesList) return;

    if (libCount) libCount.textContent = savedStyles.length;

    const filtered = getFilteredStyles();
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    if (currentLibPage > totalPages) currentLibPage = totalPages;
    if (currentLibPage < 1) currentLibPage = 1;

    // Vacíos
    if (filtered.length === 0) {
      savedStylesList.innerHTML = savedStyles.length === 0
        ? '<p class="empty-styles-text">No hay estilos guardados todavía.</p>'
        : `<p class="empty-styles-text">Ningún estilo coincide con "${escapeHtml(librarySearch)}".</p>`;
      renderPagination(1);
      return;
    }

    const start = (currentLibPage - 1) * PAGE_SIZE;
    const pageItems = filtered.slice(start, start + PAGE_SIZE);

    savedStylesList.innerHTML = '';
    pageItems.forEach((styleItem) => {
      const itemEl = document.createElement('div');
      const isActive = styleItem.id === activeStyleId;
      const isEditing = styleItem.id === editingStyleId;

      itemEl.className = `saved-style-card ${isActive ? 'is-active ' : ''}${isEditing ? 'is-editing' : ''}`;

      const themeIcon = styleItem.theme === 'dark' ? '🌙' : '☀️';
      const fontLabel = styleItem.fontName ? styleItem.fontName : 'Fuente Estándar';
      const activeBadgeHtml = isActive ? '<span class="badge-active-style"><i class="fas fa-check-circle"></i> ACTIVO</span>' : '';
      const editingBadgeHtml = isEditing ? '<span class="saved-style-tag" style="background:rgba(197,160,89,0.25); color:#e5be48;"><i class="fas fa-pen"></i> EDITANDO</span>' : '';

      itemEl.innerHTML = `
        <div class="saved-style-info">
          <div class="saved-style-header">
            <span class="saved-style-name">${escapeHtml(styleItem.name)}</span>
            <span class="saved-style-tag">${themeIcon} ${escapeHtml(styleItem.theme.toUpperCase())}</span>
            ${activeBadgeHtml}
            ${editingBadgeHtml}
          </div>
          <div class="saved-style-details">
            <span class="font-meta" title="${escapeHtml(fontLabel)}"><i class="fas fa-font"></i> ${escapeHtml(fontLabel)}</span>
            <span class="sizes-meta"><i class="fas fa-text-height"></i> T:${styleItem.sizes.titles}px S:${styleItem.sizes.subtitles}px P:${styleItem.sizes.body}px</span>
          </div>
          <div class="saved-style-swatches">
            <span style="background:${escapeHtml(styleItem.palette.c1)}"></span>
            <span style="background:${escapeHtml(styleItem.palette.c2)}"></span>
            <span style="background:${escapeHtml(styleItem.palette.c3)}"></span>
            <span style="background:${escapeHtml(styleItem.palette.c4)}"></span>
            <span style="background:${escapeHtml(styleItem.palette.c5)}"></span>
          </div>
        </div>
        <div class="saved-style-actions">
          <button class="btn-load-style" data-id="${styleItem.id}" title="Activar este estilo"><i class="fas fa-download"></i> Cargar</button>
          <button class="btn-edit-style" data-id="${styleItem.id}" title="Editar este estilo"><i class="fas fa-pen"></i> Editar</button>
          <button class="btn-delete-style" data-id="${styleItem.id}" title="Borrar este estilo"><i class="fas fa-trash-alt"></i> Borrar</button>
        </div>
      `;

      savedStylesList.appendChild(itemEl);
    });

    // Handlers por ID (robusto ante filtrado/paginación)
    savedStylesList.querySelectorAll('.btn-load-style').forEach((btn) => {
      btn.addEventListener('click', () => {
        const style = savedStyles.find((s) => s.id === btn.dataset.id);
        if (style) {
          exitEditMode(false);
          loadStyleConfiguration(style);
        }
      });
    });

    savedStylesList.querySelectorAll('.btn-edit-style').forEach((btn) => {
      btn.addEventListener('click', () => {
        const style = savedStyles.find((s) => s.id === btn.dataset.id);
        if (style) enterEditMode(style);
      });
    });

    savedStylesList.querySelectorAll('.btn-delete-style').forEach((btn) => {
      btn.addEventListener('click', () => {
        const style = savedStyles.find((s) => s.id === btn.dataset.id);
        if (style) deleteStyle(style);
      });
    });

    renderPagination(totalPages);
  }

  function renderPagination(totalPages) {
    if (!libPagination) return;
    if (totalPages <= 1) {
      libPagination.classList.add('hidden');
      libPagination.innerHTML = '';
      return;
    }
    libPagination.classList.remove('hidden');

    let html = `<button class="lib-page-btn" data-page="prev" ${currentLibPage === 1 ? 'disabled' : ''} aria-label="Anterior">‹</button>`;
    for (let p = 1; p <= totalPages; p++) {
      html += `<button class="lib-page-btn ${p === currentLibPage ? 'active' : ''}" data-page="${p}">${p}</button>`;
    }
    html += `<button class="lib-page-btn" data-page="next" ${currentLibPage === totalPages ? 'disabled' : ''} aria-label="Siguiente">›</button>`;
    libPagination.innerHTML = html;

    libPagination.querySelectorAll('.lib-page-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const val = btn.dataset.page;
        if (val === 'prev') currentLibPage = Math.max(1, currentLibPage - 1);
        else if (val === 'next') currentLibPage = Math.min(totalPages, currentLibPage + 1);
        else currentLibPage = parseInt(val);
        renderSavedStyles();
      });
    });
  }

  if (styleSearchInput) {
    styleSearchInput.addEventListener('input', (e) => {
      librarySearch = e.target.value;
      currentLibPage = 1;
      renderSavedStyles();
    });
  }

  // ------------------------------------------------------------------------
  // Cargar / editar / borrar estilos
  // ------------------------------------------------------------------------
  function loadStyleConfiguration(styleObj, notify = true) {
    activeStyleId = styleObj.id;
    localStorage.setItem('oda_active_style_id', activeStyleId);

    applyTheme(styleObj.theme);
    updateUIAndPreview(styleObj.palette);
    localStorage.setItem(`oda_palette_${styleObj.theme}`, JSON.stringify(styleObj.palette));

    if (styleObj.fontDataUrl) {
      currentFontDataUrl = styleObj.fontDataUrl;
      currentFontName = styleObj.fontName;
      applyCustomFont(styleObj.fontDataUrl, styleObj.fontName);
      localStorage.setItem('oda_custom_font', styleObj.fontDataUrl);
      localStorage.setItem('oda_font_name', styleObj.fontName);
    } else {
      resetToDefaultFont();
    }

    applyFontSizes(styleObj.sizes);
    localStorage.setItem('oda_size_titles', styleObj.sizes.titles);
    localStorage.setItem('oda_size_subtitles', styleObj.sizes.subtitles);
    localStorage.setItem('oda_size_body', styleObj.sizes.body);

    renderSavedStyles();
    if (notify) showToast(`<i class="fas fa-magic"></i> Estilo "${escapeHtml(styleObj.name)}" activado en el sitio`);
  }

  function enterEditMode(style) {
    editingStyleId = style.id;
    loadStyleConfiguration(style, false); // carga los valores en los controles
    if (editingBanner) editingBanner.classList.remove('hidden');
    if (editingNameInput) editingNameInput.value = style.name;
    showEditorTab();
    if (editingNameInput) editingNameInput.focus();
    renderSavedStyles();
    showToast(`<i class="fas fa-pen"></i> Editando "${escapeHtml(style.name)}". Ajusta y pulsa Guardar.`);
  }

  function exitEditMode(rerender = true) {
    editingStyleId = null;
    if (editingBanner) editingBanner.classList.add('hidden');
    if (rerender) renderSavedStyles();
  }

  function deleteStyle(style) {
    const isActive = style.id === activeStyleId;
    const idx = savedStyles.findIndex((s) => s.id === style.id);
    if (idx === -1) return;

    if (isActive) {
      const ok = confirm(`⚠️ ATENCIÓN: "${style.name}" es el ESTILO ACTIVO en el sitio.\n\nSi lo eliminas, el portal se restablecerá a los valores por defecto.\n\n¿Deseas continuar?`);
      if (!ok) return;
      savedStyles.splice(idx, 1);
      localStorage.setItem('oda_saved_styles', JSON.stringify(savedStyles));
      activeStyleId = null;
      localStorage.removeItem('oda_active_style_id');
      if (style.id === editingStyleId) exitEditMode(false);
      executeFullResetToDefaults();
      renderSavedStyles();
      showToast('<i class="fas fa-trash-alt"></i> Estilo activo eliminado. Portal restablecido por defecto.');
    } else {
      const ok = confirm(`¿Borrar el estilo "${style.name}"?`);
      if (!ok) return;
      savedStyles.splice(idx, 1);
      localStorage.setItem('oda_saved_styles', JSON.stringify(savedStyles));
      if (style.id === editingStyleId) exitEditMode(false);
      renderSavedStyles();
      showToast(`<i class="fas fa-trash-alt"></i> Estilo "${escapeHtml(style.name)}" eliminado`);
    }
  }

  // ------------------------------------------------------------------------
  // Guardar estilo nuevo (Biblioteca)
  // ------------------------------------------------------------------------
  if (btnSaveNewStyle) {
    btnSaveNewStyle.addEventListener('click', () => {
      const inputVal = styleNameInput ? styleNameInput.value.trim() : '';
      const name = inputVal || `Estilo ${currentTheme === 'dark' ? 'Oscuro' : 'Claro'} #${savedStyles.length + 1}`;

      if (savedStyles.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
        alert(`Ya existe un estilo con el nombre "${name}". Elige otro nombre.`);
        return;
      }

      const newStyleId = `style_${Date.now()}`;
      const newStyleObj = {
        id: newStyleId,
        name,
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

      persistActiveConfig();

      if (styleNameInput) styleNameInput.value = '';
      currentLibPage = 1;      // ver el recién creado (va al inicio)
      librarySearch = '';
      if (styleSearchInput) styleSearchInput.value = '';
      renderSavedStyles();

      showToast(`<i class="fas fa-bookmark"></i> Estilo "${escapeHtml(name)}" guardado y activado`);
    });
  }

  // ------------------------------------------------------------------------
  // Actualizar estilo en edición (banner)
  // ------------------------------------------------------------------------
  if (btnUpdateStyle) {
    btnUpdateStyle.addEventListener('click', () => {
      if (!editingStyleId) return;
      const idx = savedStyles.findIndex((s) => s.id === editingStyleId);
      if (idx === -1) return;

      const nameToUse = (editingNameInput && editingNameInput.value.trim()) || savedStyles[idx].name;

      if (savedStyles.some((s, i) => i !== idx && s.name.toLowerCase() === nameToUse.toLowerCase())) {
        alert(`Ya existe otro estilo con el nombre "${nameToUse}". Elige un nombre diferente.`);
        return;
      }

      savedStyles[idx] = {
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
      persistActiveConfig();

      exitEditMode(false);
      renderSavedStyles();
      showToast(`<i class="fas fa-check-circle"></i> Estilo "${escapeHtml(nameToUse)}" actualizado`);
    });
  }

  if (btnCancelEdit) btnCancelEdit.addEventListener('click', () => exitEditMode());

  // ------------------------------------------------------------------------
  // Aplicar cambios al sitio (barra de acción)
  // ------------------------------------------------------------------------
  function persistActiveConfig() {
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
  }

  if (btnSavePalette) {
    btnSavePalette.addEventListener('click', () => {
      persistActiveConfig();
      showToast('<i class="fas fa-check-circle"></i> ¡Cambios aplicados al sitio principal!');
    });
  }

  // ------------------------------------------------------------------------
  // Restablecer todo
  // ------------------------------------------------------------------------
  if (btnResetPalette) {
    btnResetPalette.addEventListener('click', () => {
      const ok = confirm('¿Restablecer la configuración activa (colores, fuente y tamaños) a los valores por defecto?');
      if (ok) {
        executeFullResetToDefaults();
        showToast('<i class="fas fa-undo"></i> Configuración restablecida por defecto');
      }
    });
  }

  function executeFullResetToDefaults() {
    activeStyleId = null;
    exitEditMode(false);
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

  // ------------------------------------------------------------------------
  // Toast
  // ------------------------------------------------------------------------
  let toastTimer = null;
  function showToast(htmlMsg) {
    if (!saveToast) return;
    saveToast.innerHTML = htmlMsg;
    saveToast.classList.remove('hidden');
    saveToast.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      saveToast.classList.remove('show');
      setTimeout(() => saveToast.classList.add('hidden'), 300);
    }, 2500);
  }

});
