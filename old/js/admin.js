/* ==========================================================================
   ODA LEGAL PORTAFOLIO - JAVASCRIPT ADMIN
   Arquitectura: 3 vistas (General / Biblioteca / Editor-modo).
   El sitio soporta DOS modos con estilo propio: hay un slot activo CLARO y un
   slot activo OSCURO. Al alternar en el sitio, cada modo muestra su estilo
   (colores + tamaños + fuente). El "modo por defecto" decide con cuál abre.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  // ------------------------------------------------------------------------
  // Constantes
  // ------------------------------------------------------------------------
  const defaultPalettes = {
    light: { c1: '#E4EDF7', c2: '#FFFFFF', c3: '#1E293B', c4: '#C5A059', c5: '#0F172A' },
    dark:  { c1: '#0F172A', c2: '#1E293B', c3: '#F8FAFC', c4: '#D4AF37', c5: '#E5BE48' }
  };

  const sizeBounds = {
    titles:    { default: 40, min: 16, max: 140 },
    subtitles: { default: 20, min: 12, max: 80 },
    body:      { default: 16, min: 8,  max: 40 }
  };

  const DEFAULT_SIZES = { titles: 40, subtitles: 20, body: 16 };
  const PAGE_SIZE = 4;

  function clamp(val, min, max) {
    if (isNaN(val)) return min;
    return Math.min(Math.max(val, min), max);
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[c]);
  }

  function swatchesHtml(palette) {
    return ['c1', 'c2', 'c3', 'c4', 'c5']
      .map((k) => `<span style="background:${escapeHtml(palette[k])}"></span>`)
      .join('');
  }

  // ------------------------------------------------------------------------
  // Estado
  // ------------------------------------------------------------------------
  let savedStyles = [];
  try {
    const rawSaved = localStorage.getItem('oda_saved_styles');
    if (rawSaved) savedStyles = JSON.parse(rawSaved);
  } catch (e) {
    console.error('Error parsing oda_saved_styles:', e);
  }
  let activeLightId = localStorage.getItem('oda_active_style_id_light') || null;
  let activeDarkId = localStorage.getItem('oda_active_style_id_dark') || null;
  let themeDefault = localStorage.getItem('oda_theme_default') || 'light';
  let allowThemeToggle = localStorage.getItem('oda_theme_allow_toggle') !== 'false';

  // Migración desde el modelo antiguo de un solo estilo activo
  (function migrateLegacyActive() {
    const legacy = localStorage.getItem('oda_active_style_id');
    if (legacy && !activeLightId && !activeDarkId) {
      const s = savedStyles.find((x) => x.id === legacy);
      if (s) {
        if (s.theme === 'dark') activeDarkId = s.id; else activeLightId = s.id;
        persistAppliedForTheme(s.theme);
      }
    }
    localStorage.removeItem('oda_active_style_id');
  })();

  let view = 'general';          // 'general' | 'library' | 'editor'
  let editorReturnView = 'general';
  let draft = null;              // estilo en construcción/edición (o null)

  let currentLibPage = 1;
  let librarySearch = '';
  let libraryThemeFilter = 'all'; // 'all' | 'light' | 'dark'

  // ------------------------------------------------------------------------
  // DOM
  // ------------------------------------------------------------------------
  const adminLoginScreen = document.getElementById('adminLoginScreen');
  const adminDashboardScreen = document.getElementById('adminDashboardScreen');
  const adminLoginForm = document.getElementById('adminLoginForm');
  const btnLogout = document.getElementById('btnLogout');

  const mainTabs = document.getElementById('mainTabs');
  const tabGeneralBtn = document.getElementById('tabGeneralBtn');
  const tabLibraryBtn = document.getElementById('tabLibraryBtn');
  const viewGeneral = document.getElementById('viewGeneral');
  const viewLibrary = document.getElementById('viewLibrary');
  const viewEditor = document.getElementById('viewEditor');
  const libCount = document.getElementById('libCount');

  // General
  const btnDefaultLight = document.getElementById('btnDefaultLight');
  const btnDefaultDark = document.getElementById('btnDefaultDark');
  const allowToggleChk = document.getElementById('allowToggleChk');
  const allowToggleHint = document.getElementById('allowToggleHint');
  const activeStyleBoxLight = document.getElementById('activeStyleBoxLight');
  const activeStyleBoxDark = document.getElementById('activeStyleBoxDark');
  const btnCreateStyleGeneral = document.getElementById('btnCreateStyleGeneral');
  const btnResetAll = document.getElementById('btnResetAll');

  // Biblioteca
  const btnCreateStyleLibrary = document.getElementById('btnCreateStyleLibrary');
  const styleSearchInput = document.getElementById('styleSearchInput');
  const savedStylesList = document.getElementById('savedStylesList');
  const libPagination = document.getElementById('libPagination');

  // Editor
  const btnBackFromEditor = document.getElementById('btnBackFromEditor');
  const editorTitle = document.getElementById('editorTitle');
  const draftNameInput = document.getElementById('draftNameInput');
  const btnThemeLight = document.getElementById('btnThemeLight');
  const btnThemeDark = document.getElementById('btnThemeDark');
  const fontFileInput = document.getElementById('fontFileInput');
  const fontDropzone = document.getElementById('fontDropzone');
  const fontStatusTag = document.getElementById('fontStatusTag');
  const btnResetFont = document.getElementById('btnResetFont');

  const editorActionbar = document.getElementById('editorActionbar');
  const btnSaveDraft = document.getElementById('btnSaveDraft');
  const saveDraftLabel = document.getElementById('saveDraftLabel');
  const btnCancelDraft = document.getElementById('btnCancelDraft');

  const saveToast = document.getElementById('saveToast');
  const draftNameError = document.getElementById('draftNameError');

  // Modal de confirmación
  const confirmModal = document.getElementById('confirmModal');
  const confirmTitle = document.getElementById('confirmTitle');
  const confirmMsg = document.getElementById('confirmMsg');
  const confirmIcon = document.getElementById('confirmIcon');
  const confirmOk = document.getElementById('confirmOk');
  const confirmCancel = document.getElementById('confirmCancel');

  const colorElements = {
    c1: { picker: document.getElementById('svcColor1'), hex: document.getElementById('svcHex1'), err: document.getElementById('svcHexErr1') },
    c2: { picker: document.getElementById('svcColor2'), hex: document.getElementById('svcHex2'), err: document.getElementById('svcHexErr2') },
    c3: { picker: document.getElementById('svcColor3'), hex: document.getElementById('svcHex3'), err: document.getElementById('svcHexErr3') },
    c4: { picker: document.getElementById('svcColor4'), hex: document.getElementById('svcHex4'), err: document.getElementById('svcHexErr4') },
    c5: { picker: document.getElementById('svcColor5'), hex: document.getElementById('svcHex5'), err: document.getElementById('svcHexErr5') }
  };

  const sizeConfigs = [
    { key: 'titles',    num: document.getElementById('sizeTitlesInput'),    range: document.getElementById('sizeTitlesRange') },
    { key: 'subtitles', num: document.getElementById('sizeSubtitlesInput'), range: document.getElementById('sizeSubtitlesRange') },
    { key: 'body',      num: document.getElementById('sizeBodyInput'),      range: document.getElementById('sizeBodyRange') }
  ];

  const previewFrame = document.getElementById('previewFrame');
  if (previewFrame) previewFrame.addEventListener('load', () => pushPreview());

  // ------------------------------------------------------------------------
  // Validación inline (colores + nombre)
  // ------------------------------------------------------------------------
  const HEX_RE = /^#([0-9A-F]{3}){1,2}$/i;
  const NAME_RE = /^[\p{L}\p{N} _#-]+$/u;

  // Pinta/limpia el error de un campo. msg === null limpia el estado.
  function setFieldError(inputEl, msgEl, msg) {
    if (inputEl) inputEl.classList.toggle('is-invalid', !!msg);
    if (inputEl) inputEl.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (msgEl) {
      msgEl.textContent = msg || '';
      msgEl.classList.toggle('hidden', !msg);
    }
  }

  // Regla del nombre del estilo: opcional, pero si se escribe debe ser válido.
  function validateStyleName(value) {
    const name = (value || '').trim();
    if (!name) return { ok: true, message: null };
    if (name.length < 2) return { ok: false, message: 'Usa al menos 2 caracteres.' };
    if (name.length > 40) return { ok: false, message: 'Máximo 40 caracteres.' };
    if (!NAME_RE.test(name)) return { ok: false, message: 'Solo letras, números, espacios, guiones y numeral (#).' };
    const currentId = draft ? draft.id : null;
    const dup = savedStyles.some((s) => s.id !== currentId && s.name.toLowerCase() === name.toLowerCase());
    if (dup) return { ok: false, message: 'Ya existe un estilo con ese nombre.' };
    return { ok: true, message: null };
  }

  // ------------------------------------------------------------------------
  // Modal de confirmación (reemplaza confirm() nativo). Devuelve Promise<bool>.
  // ------------------------------------------------------------------------
  let confirmState = null; // { resolve, lastFocus }

  function closeConfirm(result) {
    if (!confirmState) return;
    const { resolve, lastFocus } = confirmState;
    confirmState = null;
    if (confirmModal) confirmModal.classList.remove('show');
    document.removeEventListener('keydown', onConfirmKeydown);
    // Espera el fade-out antes de ocultar del todo
    setTimeout(() => { if (confirmModal && !confirmState) confirmModal.classList.add('hidden'); }, 200);
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
    resolve(result);
  }

  function onConfirmKeydown(e) {
    if (!confirmState) return;
    if (e.key === 'Escape') { e.preventDefault(); closeConfirm(false); return; }
    if (e.key === 'Tab') {
      // Foco atrapado entre Cancelar y Confirmar
      const focusables = [confirmCancel, confirmOk].filter(Boolean);
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }

  function showConfirm({ title = 'Confirmar', message = '', confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', variant = 'default' } = {}) {
    return new Promise((resolve) => {
      if (!confirmModal) { resolve(window.confirm(String(message).replace(/<[^>]*>/g, ''))); return; }
      // Si hay un modal abierto, ciérralo como cancelado antes de abrir el nuevo
      if (confirmState) closeConfirm(false);

      if (confirmTitle) confirmTitle.textContent = title;
      if (confirmMsg) confirmMsg.innerHTML = message; // message ya viene escapado por el llamador
      if (confirmOk) {
        confirmOk.textContent = confirmLabel;
        confirmOk.classList.toggle('danger', variant === 'danger');
      }
      if (confirmCancel) confirmCancel.textContent = cancelLabel;
      if (confirmIcon) confirmIcon.classList.toggle('is-danger', variant === 'danger');

      confirmState = { resolve, lastFocus: document.activeElement };
      confirmModal.classList.remove('hidden');
      void confirmModal.offsetWidth; // reflow para la transición
      confirmModal.classList.add('show');
      document.addEventListener('keydown', onConfirmKeydown);
      if (confirmOk) confirmOk.focus();
    });
  }

  if (confirmOk) confirmOk.addEventListener('click', () => closeConfirm(true));
  if (confirmCancel) confirmCancel.addEventListener('click', () => closeConfirm(false));
  if (confirmModal) {
    confirmModal.addEventListener('click', (e) => {
      if (e.target === confirmModal) closeConfirm(false); // click en el backdrop
    });
  }

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
    setView('general');
    applyPolicyUI();
    renderActiveSlots();
    renderSavedStyles();
    pushPreview();
  }

  // ------------------------------------------------------------------------
  // Navegación entre vistas
  // ------------------------------------------------------------------------
  function setView(v) {
    view = v;
    const inEditor = v === 'editor';
    mainTabs.classList.toggle('hidden', inEditor);
    editorActionbar.classList.toggle('hidden', !inEditor);
    viewGeneral.classList.toggle('active', v === 'general');
    viewLibrary.classList.toggle('active', v === 'library');
    viewEditor.classList.toggle('active', inEditor);
    if (!inEditor) {
      tabGeneralBtn.classList.toggle('active', v === 'general');
      tabGeneralBtn.setAttribute('aria-selected', String(v === 'general'));
      tabLibraryBtn.classList.toggle('active', v === 'library');
      tabLibraryBtn.setAttribute('aria-selected', String(v === 'library'));
    }
  }

  if (tabGeneralBtn) tabGeneralBtn.addEventListener('click', () => { setView('general'); pushPreview(); });
  if (tabLibraryBtn) tabLibraryBtn.addEventListener('click', () => { setView('library'); pushPreview(); });

  // ------------------------------------------------------------------------
  // Config por tema (sitio = slot activo de ese tema, o fábrica)
  // ------------------------------------------------------------------------
  function activeStyleForTheme(theme) {
    const id = theme === 'dark' ? activeDarkId : activeLightId;
    return savedStyles.find((x) => x.id === id) || null;
  }

  function getConfigForTheme(theme) {
    const s = activeStyleForTheme(theme);
    if (s) {
      return { theme, palette: { ...s.palette }, sizes: { ...s.sizes }, fontDataUrl: s.fontDataUrl || null, fontName: s.fontName || null };
    }
    return { theme, palette: { ...defaultPalettes[theme] }, sizes: { ...DEFAULT_SIZES }, fontDataUrl: null, fontName: null };
  }

  // Escribe el estilo aplicado de un tema en las claves que lee el sitio
  function persistAppliedForTheme(theme) {
    const c = getConfigForTheme(theme);
    localStorage.setItem(`oda_applied_${theme}`, JSON.stringify({
      palette: c.palette, sizes: c.sizes, fontDataUrl: c.fontDataUrl, fontName: c.fontName
    }));
    const id = theme === 'dark' ? activeDarkId : activeLightId;
    if (id) localStorage.setItem(`oda_active_style_id_${theme}`, id);
    else localStorage.removeItem(`oda_active_style_id_${theme}`);
  }

  // Aplica un estilo a su slot y lo vuelve el modo por defecto
  function applyStyleToSite(style) {
    if (style.theme === 'dark') activeDarkId = style.id; else activeLightId = style.id;
    themeDefault = style.theme;
    localStorage.setItem('oda_theme_default', themeDefault);
    localStorage.setItem('oda_theme', themeDefault); // el sitio abre en este modo
    persistAppliedForTheme(style.theme);
    reconcileSlots();
  }

  // Cada slot solo puede contener un estilo de su propio tema. Si un id apunta
  // a un estilo que ya no existe o cambió de tema, se libera ese slot.
  function reconcileSlots() {
    const l = savedStyles.find((s) => s.id === activeLightId);
    if (activeLightId && (!l || l.theme !== 'light')) { activeLightId = null; persistAppliedForTheme('light'); }
    const d = savedStyles.find((s) => s.id === activeDarkId);
    if (activeDarkId && (!d || d.theme !== 'dark')) { activeDarkId = null; persistAppliedForTheme('dark'); }
  }

  // ------------------------------------------------------------------------
  // Vista previa: borrador si editas; si no, el modo por defecto
  // ------------------------------------------------------------------------
  function pushPreview(cfg) {
    if (!previewFrame || !previewFrame.contentWindow) return;
    const c = cfg || (view === 'editor' && draft ? draft : getConfigForTheme(themeDefault));
    previewFrame.contentWindow.postMessage({
      type: 'oda-preview',
      theme: c.theme,
      palette: c.palette,
      sizes: c.sizes,
      fontDataUrl: c.fontDataUrl,
      fontName: c.fontName,
      // Al editar, se bloquea el modo en la preview (evita perder el borrador al alternar)
      allowToggle: view === 'editor' ? false : allowThemeToggle
    }, '*');
  }

  // ------------------------------------------------------------------------
  // GENERAL: modo por defecto + permitir cambiar (persisten al instante)
  // ------------------------------------------------------------------------
  function applyPolicyUI() {
    if (btnDefaultLight) btnDefaultLight.classList.toggle('active', themeDefault !== 'dark');
    if (btnDefaultDark) btnDefaultDark.classList.toggle('active', themeDefault === 'dark');
    if (allowToggleChk) allowToggleChk.checked = allowThemeToggle;
    if (allowToggleHint) {
      allowToggleHint.textContent = allowThemeToggle
        ? 'El botón claro/oscuro aparece en el sitio.'
        : 'El sitio queda forzado al modo por defecto; el botón se oculta.';
    }
  }

  function setThemeDefault(mode) {
    themeDefault = mode;
    localStorage.setItem('oda_theme_default', mode);
    localStorage.setItem('oda_theme', mode);
    applyPolicyUI();
    renderActiveSlots();
    pushPreview();
  }
  if (btnDefaultLight) btnDefaultLight.addEventListener('click', () => setThemeDefault('light'));
  if (btnDefaultDark) btnDefaultDark.addEventListener('click', () => setThemeDefault('dark'));

  if (allowToggleChk) {
    allowToggleChk.addEventListener('change', () => {
      allowThemeToggle = allowToggleChk.checked;
      localStorage.setItem('oda_theme_allow_toggle', String(allowThemeToggle));
      applyPolicyUI();
      renderActiveSlots();
      pushPreview();
    });
  }

  // ------------------------------------------------------------------------
  // GENERAL: slots de estilo activo (claro y oscuro)
  // ------------------------------------------------------------------------
  function renderActiveSlots() {
    renderSlot('light', activeStyleBoxLight, themeDefault === 'light');
    renderSlot('dark', activeStyleBoxDark, themeDefault === 'dark');
  }

  function renderSlot(theme, container, isDefault) {
    if (!container) return;
    // Solo se atenúa el modo secundario cuando el sitio está FORZADO (el visitante
    // no puede alternar). Si puede alternar, ambos modos se usan → ambos normales.
    container.classList.toggle('ed-slot-muted', !isDefault && !allowThemeToggle);

    const icon = theme === 'dark' ? '🌙' : '☀️';
    const label = theme === 'dark' ? 'Oscuro' : 'Claro';
    const defBadge = isDefault
      ? '<span class="ed-default-badge"><i class="fas fa-star"></i> Por defecto</span>'
      : '';
    const s = activeStyleForTheme(theme);

    if (!s) {
      container.innerHTML = `
        <div class="ed-slot-empty">
          <div class="ed-slot-head">${icon} <strong>${label}</strong> ${defBadge} · sin estilo (usa fábrica)</div>
          <div class="ed-active-swatches">${swatchesHtml(defaultPalettes[theme])}</div>
          <button class="btn-load-style ed-slot-create" data-theme="${theme}"><i class="fas fa-plus"></i> Crear estilo ${label.toLowerCase()}</button>
        </div>`;
      const btn = container.querySelector('.ed-slot-create');
      if (btn) btn.addEventListener('click', () => openEditor(null, 'general', theme));
      return;
    }

    const fontLabel = s.fontName ? s.fontName : 'Fuente Estándar';
    container.innerHTML = `
      <div class="saved-style-card is-active">
        <div class="saved-style-info">
          <div class="saved-style-header">
            <span class="saved-style-tag">${icon} ${label.toUpperCase()}</span>
            ${defBadge}
            <span class="saved-style-name">${escapeHtml(s.name)}</span>
          </div>
          <div class="saved-style-details">
            <span class="font-meta" title="${escapeHtml(fontLabel)}"><i class="fas fa-font"></i> ${escapeHtml(fontLabel)}</span>
            <span class="sizes-meta"><i class="fas fa-text-height"></i> T:${s.sizes.titles} S:${s.sizes.subtitles} P:${s.sizes.body}</span>
          </div>
          <div class="saved-style-swatches">${swatchesHtml(s.palette)}</div>
        </div>
        <div class="saved-style-actions">
          <button class="btn-edit-style" data-id="${s.id}"><i class="fas fa-pen"></i> Editar</button>
          <button class="btn-load-style" data-theme="${theme}"><i class="fas fa-random"></i> Cambiar</button>
        </div>
      </div>`;

    const editBtn = container.querySelector('.btn-edit-style');
    if (editBtn) editBtn.addEventListener('click', () => openEditor(s, 'general'));
    const changeBtn = container.querySelector('.btn-load-style');
    if (changeBtn) changeBtn.addEventListener('click', () => { setView('library'); pushPreview(); });
  }

  if (btnCreateStyleGeneral) btnCreateStyleGeneral.addEventListener('click', () => openEditor(null, 'general'));
  if (btnCreateStyleLibrary) btnCreateStyleLibrary.addEventListener('click', () => openEditor(null, 'library'));

  // ------------------------------------------------------------------------
  // BIBLIOTECA: filtrado, paginación y render
  // ------------------------------------------------------------------------
  function isActive(id) { return id === activeLightId || id === activeDarkId; }

  function getFilteredStyles() {
    let list = savedStyles;
    if (libraryThemeFilter !== 'all') {
      list = list.filter((s) => s.theme === libraryThemeFilter);
    }
    const term = librarySearch.trim().toLowerCase();
    if (!term) return list;
    return list.filter((s) => s.name.toLowerCase().includes(term));
  }

  function renderSavedStyles() {
    if (!savedStylesList) return;
    if (libCount) libCount.textContent = savedStyles.length;

    const filtered = getFilteredStyles();
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    if (currentLibPage > totalPages) currentLibPage = totalPages;
    if (currentLibPage < 1) currentLibPage = 1;

    if (filtered.length === 0) {
      savedStylesList.innerHTML = savedStyles.length === 0
        ? '<p class="empty-styles-text">No hay estilos guardados todavía. Crea el primero con “Crear estilo nuevo”.</p>'
        : `<p class="empty-styles-text">Ningún estilo coincide con "${escapeHtml(librarySearch)}".</p>`;
      renderPagination(1);
      return;
    }

    const start = (currentLibPage - 1) * PAGE_SIZE;
    const pageItems = filtered.slice(start, start + PAGE_SIZE);

    savedStylesList.innerHTML = '';
    pageItems.forEach((s) => {
      const itemEl = document.createElement('div');
      const active = isActive(s.id);
      itemEl.className = `saved-style-card ${active ? 'is-active' : ''}`;

      const themeIcon = s.theme === 'dark' ? '🌙' : '☀️';
      const fontLabel = s.fontName ? s.fontName : 'Fuente Estándar';
      const activeBadge = active ? '<span class="badge-active-style"><i class="fas fa-check-circle"></i> ACTIVO</span>' : '';

      itemEl.innerHTML = `
        <div class="saved-style-info">
          <div class="saved-style-header">
            <span class="saved-style-name">${escapeHtml(s.name)}</span>
            <span class="saved-style-tag">${themeIcon} ${escapeHtml(s.theme.toUpperCase())}</span>
            ${activeBadge}
          </div>
          <div class="saved-style-details">
            <span class="font-meta" title="${escapeHtml(fontLabel)}"><i class="fas fa-font"></i> ${escapeHtml(fontLabel)}</span>
            <span class="sizes-meta"><i class="fas fa-text-height"></i> T:${s.sizes.titles}px S:${s.sizes.subtitles}px P:${s.sizes.body}px</span>
          </div>
          <div class="saved-style-swatches">${swatchesHtml(s.palette)}</div>
        </div>
        <div class="saved-style-actions">
          <button class="btn-load-style" data-id="${s.id}" title="Aplicar como estilo del modo ${s.theme === 'dark' ? 'oscuro' : 'claro'}"><i class="fas fa-check"></i> Activar</button>
          <button class="btn-edit-style" data-id="${s.id}" title="Editar este estilo"><i class="fas fa-pen"></i> Editar</button>
          <button class="btn-delete-style" data-id="${s.id}" title="Borrar este estilo"><i class="fas fa-trash-alt"></i> Borrar</button>
        </div>
      `;
      savedStylesList.appendChild(itemEl);
    });

    savedStylesList.querySelectorAll('.btn-load-style').forEach((btn) => {
      btn.addEventListener('click', () => {
        const s = savedStyles.find((x) => x.id === btn.dataset.id);
        if (s) activateStyle(s);
      });
    });
    savedStylesList.querySelectorAll('.btn-edit-style').forEach((btn) => {
      btn.addEventListener('click', () => {
        const s = savedStyles.find((x) => x.id === btn.dataset.id);
        if (s) openEditor(s, 'library');
      });
    });
    savedStylesList.querySelectorAll('.btn-delete-style').forEach((btn) => {
      btn.addEventListener('click', () => {
        const s = savedStyles.find((x) => x.id === btn.dataset.id);
        if (s) deleteStyle(s);
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

  const libThemeFilter = document.getElementById('libThemeFilter');
  if (libThemeFilter) {
    const btns = libThemeFilter.querySelectorAll('.ed-seg');
    btns.forEach((b) => {
      b.addEventListener('click', () => {
        btns.forEach((x) => x.classList.remove('active'));
        b.classList.add('active');
        libraryThemeFilter = b.getAttribute('data-filter') || 'all';
        currentLibPage = 1;
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
  // Activar / borrar estilos
  // ------------------------------------------------------------------------
  function activateStyle(s) {
    applyStyleToSite(s);
    applyPolicyUI();
    renderActiveSlots();
    renderSavedStyles();
    pushPreview();
    const modo = s.theme === 'dark' ? 'oscuro' : 'claro';
    showToast(`<i class="fas fa-check-circle"></i> "${escapeHtml(s.name)}" activado como estilo del modo ${modo}`);
  }

  async function deleteStyle(s) {
    const wasActive = isActive(s.id);
    const safeName = escapeHtml(s.name);
    const message = wasActive
      ? `<strong>"${safeName}"</strong> está activo en el modo ${s.theme === 'dark' ? 'oscuro' : 'claro'}. Si lo borras, ese modo vuelve a los valores de fábrica.`
      : `¿Seguro que quieres borrar el estilo <strong>"${safeName}"</strong>? Esta acción no se puede deshacer.`;
    const ok = await showConfirm({
      title: 'Borrar estilo',
      message,
      confirmLabel: 'Borrar',
      variant: 'danger'
    });
    if (!ok) return;

    savedStyles = savedStyles.filter((x) => x.id !== s.id);
    localStorage.setItem('oda_saved_styles', JSON.stringify(savedStyles));

    if (s.id === activeLightId) { activeLightId = null; persistAppliedForTheme('light'); }
    if (s.id === activeDarkId) { activeDarkId = null; persistAppliedForTheme('dark'); }

    renderActiveSlots();
    renderSavedStyles();
    pushPreview();
    showToast(`<i class="fas fa-trash-alt"></i> Estilo "${escapeHtml(s.name)}" eliminado`);
  }

  // ------------------------------------------------------------------------
  // EDITOR (modo): trabajar sobre un borrador
  // ------------------------------------------------------------------------
  function openEditor(style, returnView, presetTheme) {
    editorReturnView = returnView || 'general';

    if (style) {
      draft = {
        id: style.id, name: style.name, theme: style.theme,
        palette: { ...style.palette }, sizes: { ...style.sizes },
        fontDataUrl: style.fontDataUrl || null, fontName: style.fontName || null
      };
      editorTitle.textContent = 'Editar estilo';
      saveDraftLabel.textContent = 'Guardar cambios';
    } else {
      const theme = presetTheme || 'light';
      draft = {
        id: null, name: '', theme,
        palette: { ...defaultPalettes[theme] }, sizes: { ...DEFAULT_SIZES },
        fontDataUrl: null, fontName: null
      };
      editorTitle.textContent = 'Nuevo estilo';
      saveDraftLabel.textContent = 'Guardar estilo';
    }

    draftNameInput.value = draft.name;
    setFieldError(draftNameInput, draftNameError, null);
    Object.keys(colorElements).forEach((key) => setFieldError(colorElements[key].hex, colorElements[key].err, null));
    updateThemeButtons();
    populateColors();
    populateSizes();
    updateFontStatus();

    setView('editor');
    pushPreview();
  }

  function closeEditor() {
    draft = null;
    setView(editorReturnView);
    renderActiveSlots();
    renderSavedStyles();
    pushPreview();
  }

  function updateThemeButtons() {
    if (!draft) return;
    if (btnThemeLight) btnThemeLight.classList.toggle('active', draft.theme !== 'dark');
    if (btnThemeDark) btnThemeDark.classList.toggle('active', draft.theme === 'dark');
  }

  function populateColors() {
    if (!draft) return;
    Object.keys(colorElements).forEach((key) => {
      const v = draft.palette[key];
      if (colorElements[key].picker) colorElements[key].picker.value = v;
      if (colorElements[key].hex) colorElements[key].hex.value = v.toUpperCase();
    });
  }

  function populateSizes() {
    if (!draft) return;
    sizeConfigs.forEach((cfg) => {
      const v = draft.sizes[cfg.key];
      if (cfg.num) cfg.num.value = v;
      if (cfg.range) cfg.range.value = v;
    });
  }

  function updateFontStatus() {
    if (fontStatusTag) fontStatusTag.textContent = (draft && draft.fontName) ? draft.fontName : 'Plus Jakarta Sans (por defecto)';
    if (fontFileInput) fontFileInput.value = '';
  }

  // Tema del estilo: al cambiarlo, carga los colores por defecto de ese tema
  function setDraftTheme(theme) {
    if (!draft) return;
    draft.theme = theme;
    draft.palette = { ...defaultPalettes[theme] };
    updateThemeButtons();
    populateColors();
    pushPreview();
  }
  if (btnThemeLight) btnThemeLight.addEventListener('click', () => setDraftTheme('light'));
  if (btnThemeDark) btnThemeDark.addEventListener('click', () => setDraftTheme('dark'));

  // Colores
  Object.keys(colorElements).forEach((key) => {
    const picker = colorElements[key].picker;
    const hexInput = colorElements[key].hex;
    const hexErr = colorElements[key].err;
    if (picker) {
      picker.addEventListener('input', (e) => {
        if (!draft) return;
        const hexVal = e.target.value.toUpperCase();
        if (hexInput) hexInput.value = hexVal;
        setFieldError(hexInput, hexErr, null); // el selector nativo siempre da un hex válido
        draft.palette[key] = hexVal;
        pushPreview();
      });
    }
    if (hexInput) {
      hexInput.addEventListener('input', (e) => {
        if (!draft) return;
        let val = e.target.value.trim();
        if (val && !val.startsWith('#')) val = '#' + val;
        if (HEX_RE.test(val)) {
          setFieldError(hexInput, hexErr, null);
          if (picker) picker.value = val;
          draft.palette[key] = val;
          pushPreview();
        } else {
          setFieldError(hexInput, hexErr, 'Color inválido. Usa un hex como #3366FF.');
        }
      });
      // Al salir del campo, restaura el último color válido si quedó inválido
      hexInput.addEventListener('blur', () => {
        if (!draft) return;
        if (hexInput.classList.contains('is-invalid')) {
          hexInput.value = String(draft.palette[key]).toUpperCase();
          setFieldError(hexInput, hexErr, null);
        }
      });
    }
  });

  // Nombre del estilo: validación en vivo
  if (draftNameInput) {
    draftNameInput.addEventListener('input', () => {
      const { message } = validateStyleName(draftNameInput.value);
      setFieldError(draftNameInput, draftNameError, message);
    });
  }

  // Tamaños (número + slider sincronizados)
  sizeConfigs.forEach((cfg) => {
    const b = sizeBounds[cfg.key];
    function setValue(v, { updateNum = true, updateRange = true } = {}) {
      if (!draft) return;
      draft.sizes[cfg.key] = v;
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
        if (isNaN(raw)) return;
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

  // Fuente: carga (compartida por el selector y arrastrar-soltar)
  function handleFontFile(file) {
    if (!draft || !file) return;
    if (!file.name.toLowerCase().endsWith('.ttf')) {
      showToast('<i class="fas fa-triangle-exclamation"></i> Selecciona un archivo de fuente válido (.ttf)', 'error');
      if (fontFileInput) fontFileInput.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = (evt) => {
      draft.fontDataUrl = evt.target.result;
      draft.fontName = file.name;
      if (fontStatusTag) fontStatusTag.textContent = file.name;
      pushPreview();
    };
    reader.readAsDataURL(file);
  }

  if (fontFileInput) {
    fontFileInput.addEventListener('change', (e) => {
      handleFontFile(e.target.files[0]);
    });
  }

  // Arrastrar y soltar sobre la zona de carga
  if (fontDropzone) {
    ['dragenter', 'dragover'].forEach((type) => {
      fontDropzone.addEventListener(type, (e) => {
        e.preventDefault();
        if (draft) fontDropzone.classList.add('is-dragover');
      });
    });
    ['dragleave', 'dragend', 'drop'].forEach((type) => {
      fontDropzone.addEventListener(type, () => fontDropzone.classList.remove('is-dragover'));
    });
    fontDropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      handleFontFile(file);
    });
  }
  if (btnResetFont) {
    btnResetFont.addEventListener('click', () => {
      if (!draft) return;
      draft.fontDataUrl = null;
      draft.fontName = null;
      updateFontStatus();
      pushPreview();
    });
  }

  // Guardar / cancelar
  if (btnSaveDraft) btnSaveDraft.addEventListener('click', saveDraft);
  if (btnCancelDraft) btnCancelDraft.addEventListener('click', closeEditor);
  if (btnBackFromEditor) btnBackFromEditor.addEventListener('click', closeEditor);

  function saveDraft() {
    if (!draft) return;
    const typed = draftNameInput ? draftNameInput.value.trim() : '';

    const nameCheck = validateStyleName(typed);
    if (!nameCheck.ok) {
      setFieldError(draftNameInput, draftNameError, nameCheck.message);
      if (draftNameInput) draftNameInput.focus();
      return;
    }

    const name = typed || `Estilo ${draft.theme === 'dark' ? 'Oscuro' : 'Claro'} #${savedStyles.length + 1}`;
    draft.name = name;

    if (draft.id) {
      const idx = savedStyles.findIndex((s) => s.id === draft.id);
      if (idx !== -1) savedStyles[idx] = { ...draft };
    } else {
      draft.id = `style_${Date.now()}`;
      savedStyles.unshift({ ...draft });
      currentLibPage = 1;
    }

    localStorage.setItem('oda_saved_styles', JSON.stringify(savedStyles));
    // Al guardar, el estilo se activa en el slot de su tema
    applyStyleToSite(savedStyles.find((s) => s.id === draft.id));

    const savedName = draft.name;
    draft = null;
    applyPolicyUI();
    setView(editorReturnView);
    renderActiveSlots();
    renderSavedStyles();
    pushPreview();
    showToast(`<i class="fas fa-check-circle"></i> Estilo "${escapeHtml(savedName)}" guardado y activado`);
  }

  // ------------------------------------------------------------------------
  // Restablecer todo (ambos modos a fábrica; conserva la biblioteca)
  // ------------------------------------------------------------------------
  if (btnResetAll) {
    btnResetAll.addEventListener('click', async () => {
      const ok = await showConfirm({
        title: 'Restablecer todo',
        message: '¿Restablecer el sitio a los valores de fábrica en <strong>ambos modos</strong>? Se desactivarán los estilos actuales. Tus estilos guardados se conservan.',
        confirmLabel: 'Restablecer',
        variant: 'danger'
      });
      if (!ok) return;

      activeLightId = null;
      activeDarkId = null;
      themeDefault = 'light';
      allowThemeToggle = true;

      localStorage.setItem('oda_theme_default', 'light');
      localStorage.setItem('oda_theme', 'light');
      localStorage.setItem('oda_theme_allow_toggle', 'true');
      persistAppliedForTheme('light');
      persistAppliedForTheme('dark');

      applyPolicyUI();
      renderActiveSlots();
      renderSavedStyles();
      pushPreview();
      showToast('<i class="fas fa-undo"></i> Sitio restablecido a los valores de fábrica');
    });
  }

  // ------------------------------------------------------------------------
  // Toast
  // ------------------------------------------------------------------------
  let toastTimer = null;
  function showToast(htmlMsg, type = 'success') {
    if (!saveToast) return;
    saveToast.innerHTML = htmlMsg;
    saveToast.classList.remove('is-error', 'is-warn');
    if (type === 'error') saveToast.classList.add('is-error');
    else if (type === 'warn') saveToast.classList.add('is-warn');
    saveToast.classList.remove('hidden');
    void saveToast.offsetWidth;
    saveToast.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      saveToast.classList.remove('show');
      setTimeout(() => saveToast.classList.add('hidden'), 300);
    }, type === 'error' ? 3500 : 2500);
  }

});
