/* ==========================================================================
   CV WIZARD & RENDERER (1 PÁGINA A4)
   ODA LEGAL - PANEL DE ADMINISTRACIÓN
   ========================================================================== */

(function () {
  'use strict';

  // ------------------------------------------------------------------------
  // Datos iniciales / de ejemplo (Fieles al diseño de referencia)
  // ------------------------------------------------------------------------
  const SAMPLE_CV_DATA = {
    personal: {
      firstName: 'Alejandro',
      lastName: 'Torres',
      jobTitle: 'Programador web',
      profile: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum sit amet quam rhoncus, egestas dui eget, malesuada justo. Ut aliquam augue. Consectetur adipiscing elit. Vestibulum sit amet quam rhoncus, egestas dui eget, malesuada justo.',
      photo: 'assets/images/attorney.png',
      phone: '+34-91-1234-567',
      email: 'Hola@unsitiogenial.es',
      website: 'www.unsitiogenial.es',
      location: 'Calle Cualquiera 123, Cualquier Lugar.'
    },
    experience: [
      {
        id: 'exp_1',
        title: 'Multinacional González',
        startDate: '2019',
        endDate: '2023',
        desc: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum sit amet dui elit quam rhoncus, egestas dui eget, malesuada justo. Ut aliquam augue.'
      },
      {
        id: 'exp_2',
        title: 'Álvarez y asociados',
        startDate: '2015',
        endDate: '2019',
        desc: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum sit amet dui elit quam rhoncus, egestas dui eget, malesuada justo. Ut aliquam augue.'
      },
      {
        id: 'exp_3',
        title: 'Industrias Ariova',
        startDate: '2014',
        endDate: '2015',
        desc: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum sit amet dui elit quam rhoncus, egestas dui eget, malesuada justo. Ut aliquam augue.'
      },
      {
        id: 'exp_4',
        title: 'Rimberio y asociados',
        startDate: '2012',
        endDate: '2014',
        desc: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum sit amet dui elit quam rhoncus, egestas dui eget, malesuada justo. Ut aliquam augue.'
      }
    ],
    education: [
      {
        id: 'edu_1',
        institution: 'Universidad Ensigna',
        degree: 'Ingeniería en sistemas',
        startDate: '2018',
        endDate: '2023'
      },
      {
        id: 'edu_2',
        institution: 'Universidad Ensigna',
        degree: 'Programación web',
        startDate: '2012',
        endDate: '2018'
      }
    ],
    languages: [
      { id: 'lang_1', name: 'Español' },
      { id: 'lang_2', name: 'Portugués' },
      { id: 'lang_3', name: 'Ingles' }
    ],
    competencies: [
      { id: 'comp_1', name: 'Software 01', level: 5 },
      { id: 'comp_2', name: 'Software 02', level: 4 },
      { id: 'comp_3', name: 'Software 03', level: 4 },
      { id: 'comp_4', name: 'Software 04', level: 5 },
      { id: 'comp_5', name: 'Software 05', level: 3 }
    ],
    skills: [
      { id: 'skill_1', name: 'Liderazgo', level: 5 },
      { id: 'skill_2', name: 'Creatividad', level: 5 },
      { id: 'skill_3', name: 'Análisis crítico', level: 4 },
      { id: 'skill_4', name: 'Eficiencia', level: 5 }
    ]
  };

  // ------------------------------------------------------------------------
  // Estado
  // ------------------------------------------------------------------------
  let cvData = loadCvData();
  let currentStep = 1;
  const TOTAL_STEPS = 5;

  function loadCvData() {
    try {
      const saved = localStorage.getItem('oda_cv_data');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Error al cargar oda_cv_data:', e);
    }
    // Si no hay datos guardados, iniciar con datos de ejemplo
    return JSON.parse(JSON.stringify(SAMPLE_CV_DATA));
  }

  function saveCvData() {
    try {
      localStorage.setItem('oda_cv_data', JSON.stringify(cvData));
    } catch (e) {
      console.warn('Error al guardar oda_cv_data:', e);
    }
    renderCvPreview();
  }

  function escapeHtml(str) {
    return String(str || '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[c]);
  }

  // ------------------------------------------------------------------------
  // Inicialización del DOM y Eventos
  // ------------------------------------------------------------------------
  function onReady(fn) {
    if (document.readyState === 'interactive' || document.readyState === 'complete') {
      setTimeout(fn, 0);
    } else {
      document.addEventListener('DOMContentLoaded', fn);
    }
  }

  onReady(() => {
    initWizardDOM();
    populateFormFromState();
    renderCvPreview();
    setupEventListeners();
    setupAutoFitPreview();
  });

  // ------------------------------------------------------------------------
  // Referencias a elementos
  // ------------------------------------------------------------------------
  let stepperNodes = [];
  let stepPanes = [];
  let stepperProgress = null;

  function initWizardDOM() {
    stepperNodes = Array.from(document.querySelectorAll('.cv-step-node'));
    stepPanes = Array.from(document.querySelectorAll('.cv-step-pane'));
    stepperProgress = document.getElementById('cvStepperProgress');
  }

  function setupEventListeners() {
    // Stepper navigation clicks
    stepperNodes.forEach((node) => {
      node.addEventListener('click', () => {
        const targetStep = parseInt(node.dataset.step, 10);
        if (targetStep < currentStep || validateCurrentStep()) {
          goToStep(targetStep);
        }
      });
    });

    // Botones Siguiente / Anterior
    document.querySelectorAll('.btn-wizard-nav.next').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (validateCurrentStep()) {
          goToStep(currentStep + 1);
        }
      });
    });

    document.querySelectorAll('.btn-wizard-nav.prev').forEach((btn) => {
      btn.addEventListener('click', () => {
        goToStep(Math.max(1, currentStep - 1));
      });
    });

    // Botón Submit / Finalizar en paso 5
    const btnFinishWizard = document.getElementById('btnFinishWizard');
    if (btnFinishWizard) {
      btnFinishWizard.addEventListener('click', () => {
        if (validateCurrentStep()) {
          goToStep(6); // Pantalla de completado
          triggerSuccessFeedback('¡Currículum generado exitosamente!');
        }
      });
    }

    // Botón Cargar datos de ejemplo
    const btnLoadSample = document.getElementById('btnCvLoadSample');
    if (btnLoadSample) {
      btnLoadSample.addEventListener('click', () => {
        cvData = JSON.parse(JSON.stringify(SAMPLE_CV_DATA));
        saveCvData();
        populateFormFromState();
        triggerSuccessFeedback('Datos de ejemplo cargados.');
      });
    }

    // Botón Limpiar formulario
    const btnClearForm = document.getElementById('btnCvClearForm');
    if (btnClearForm) {
      btnClearForm.addEventListener('click', () => {
        cvData = {
          personal: { firstName: '', lastName: '', jobTitle: '', profile: '', photo: '', phone: '', email: '', website: '', location: '' },
          experience: [],
          education: [],
          languages: [],
          competencies: [],
          skills: []
        };
        saveCvData();
        populateFormFromState();
        triggerSuccessFeedback('Formulario reiniciado.');
      });
    }

    // Acciones de la barra de herramientas del Preview y modal de finalización
    const btnCvDownloadPdf = document.getElementById('btnCvDownloadPdf');
    const btnCvDownloadPdfModal = document.getElementById('btnCvDownloadPdfModal');
    if (btnCvDownloadPdf) btnCvDownloadPdf.addEventListener('click', downloadCvAsPdf);
    if (btnCvDownloadPdfModal) btnCvDownloadPdfModal.addEventListener('click', downloadCvAsPdf);

    const btnCvEditModal = document.getElementById('btnCvEditModal');
    if (btnCvEditModal) {
      btnCvEditModal.addEventListener('click', () => goToStep(1));
    }

    // Inputs paso 1 (Datos Personales)
    bindInput('cvFirstName', (val) => { cvData.personal.firstName = val; });
    bindInput('cvLastName', (val) => { cvData.personal.lastName = val; });
    bindInput('cvJobTitle', (val) => { cvData.personal.jobTitle = val; });
    bindInput('cvProfile', (val) => { cvData.personal.profile = val; });
    bindInput('cvPhone', (val) => { cvData.personal.phone = val; });
    bindInput('cvEmail', (val) => { cvData.personal.email = val; });
    bindInput('cvWebsite', (val) => { cvData.personal.website = val; });
    bindInput('cvLocation', (val) => { cvData.personal.location = val; });

    // Foto de perfil
    const cvPhotoInput = document.getElementById('cvPhotoInput');
    if (cvPhotoInput) {
      cvPhotoInput.addEventListener('change', handlePhotoUpload);
    }
    const btnRemovePhoto = document.getElementById('btnRemovePhoto');
    if (btnRemovePhoto) {
      btnRemovePhoto.addEventListener('click', () => {
        cvData.personal.photo = '';
        saveCvData();
        updatePhotoPreview();
      });
    }

    // Botones de agregar dinámicos
    const btnAddExperience = document.getElementById('btnAddExperience');
    if (btnAddExperience) {
      btnAddExperience.addEventListener('click', () => {
        cvData.experience.push({
          id: `exp_${Date.now()}`,
          title: '',
          startDate: '',
          endDate: '',
          desc: ''
        });
        saveCvData();
        renderExperienceEditorList();
      });
    }

    const btnAddEducation = document.getElementById('btnAddEducation');
    if (btnAddEducation) {
      btnAddEducation.addEventListener('click', () => {
        cvData.education.push({
          id: `edu_${Date.now()}`,
          institution: '',
          degree: '',
          startDate: '',
          endDate: ''
        });
        saveCvData();
        renderEducationEditorList();
      });
    }

    const btnAddLanguage = document.getElementById('btnAddLanguage');
    const cvLangInput = document.getElementById('cvLangInput');
    if (btnAddLanguage && cvLangInput) {
      const addLang = () => {
        const val = cvLangInput.value.trim();
        if (val) {
          cvData.languages.push({ id: `lang_${Date.now()}`, name: val });
          cvLangInput.value = '';
          saveCvData();
          renderLanguagesEditorList();
        }
      };
      btnAddLanguage.addEventListener('click', addLang);
      cvLangInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); addLang(); }
      });
    }

    const btnAddCompetency = document.getElementById('btnAddCompetency');
    const cvCompInput = document.getElementById('cvCompInput');
    if (btnAddCompetency && cvCompInput) {
      const addComp = () => {
        const val = cvCompInput.value.trim();
        if (val) {
          const levelEl = document.querySelector('.cv-comp-new-level.active');
          const level = levelEl ? parseInt(levelEl.dataset.level, 10) : 5;
          cvData.competencies.push({ id: `comp_${Date.now()}`, name: val, level });
          cvCompInput.value = '';
          saveCvData();
          renderCompetenciesEditorList();
        }
      };
      btnAddCompetency.addEventListener('click', addComp);
      cvCompInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); addComp(); }
      });
    }

    const btnAddSkill = document.getElementById('btnAddSkill');
    const cvSkillInput = document.getElementById('cvSkillInput');
    if (btnAddSkill && cvSkillInput) {
      const addSkill = () => {
        const val = cvSkillInput.value.trim();
        if (val) {
          const levelEl = document.querySelector('.cv-skill-new-level.active');
          const level = levelEl ? parseInt(levelEl.dataset.level, 10) : 5;
          cvData.skills.push({ id: `skill_${Date.now()}`, name: val, level });
          cvSkillInput.value = '';
          saveCvData();
          renderSkillsEditorList();
        }
      };
      btnAddSkill.addEventListener('click', addSkill);
      cvSkillInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); addSkill(); }
      });
    }

    // Nivel selectors para nuevos items
    setupNewItemLevelSelectors('.cv-comp-new-level');
    setupNewItemLevelSelectors('.cv-skill-new-level');

    // Zoom controls de la hoja
    const btnZoomIn = document.getElementById('btnCvZoomIn');
    const btnZoomOut = document.getElementById('btnCvZoomOut');
    const btnZoomFit = document.getElementById('btnCvZoomFit');
    if (btnZoomIn) btnZoomIn.addEventListener('click', () => adjustZoom(0.1));
    if (btnZoomOut) btnZoomOut.addEventListener('click', () => adjustZoom(-0.1));
    if (btnZoomFit) btnZoomFit.addEventListener('click', autoFitSheet);
  }

  function bindInput(id, updateFn) {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', (e) => {
      updateFn(e.target.value);
      saveCvData();
    });
  }

  function setupNewItemLevelSelectors(selector) {
    const buttons = document.querySelectorAll(selector);
    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        buttons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
  }

  // ------------------------------------------------------------------------
  // Navegación por pasos (Wizard)
  // ------------------------------------------------------------------------
  function goToStep(step) {
    currentStep = step;

    // Actualizar nodos del stepper
    stepperNodes.forEach((node) => {
      const s = parseInt(node.dataset.step, 10);
      node.classList.toggle('active', s === step);
      node.classList.toggle('completed', s < step);
    });

    // Actualizar barra de progreso
    if (stepperProgress) {
      const progressPercent = Math.min(100, Math.max(0, ((Math.min(step, TOTAL_STEPS) - 1) / (TOTAL_STEPS - 1)) * 100));
      stepperProgress.style.width = `${progressPercent}%`;
    }

    // Mostrar el panel correspondiente
    stepPanes.forEach((pane) => {
      const pStep = parseInt(pane.dataset.step, 10);
      pane.classList.toggle('active', pStep === step);
    });

    // Asegurar scroll al inicio del panel izquierdo
    const edContent = document.querySelector('.ed-content');
    if (edContent) edContent.scrollTop = 0;
  }

  // ------------------------------------------------------------------------
  // Validaciones por paso
  // ------------------------------------------------------------------------
  function validateCurrentStep() {
    let isValid = true;

    if (currentStep === 1) {
      const fnEl = document.getElementById('cvFirstName');
      const lnEl = document.getElementById('cvLastName');
      const emailEl = document.getElementById('cvEmail');
      const emailErr = document.getElementById('cvEmailErr');

      if (fnEl && !fnEl.value.trim()) {
        setFieldError(fnEl, 'El nombre es obligatorio.');
        isValid = false;
      } else {
        clearFieldError(fnEl);
      }

      if (lnEl && !lnEl.value.trim()) {
        setFieldError(lnEl, 'El apellido es obligatorio.');
        isValid = false;
      } else {
        clearFieldError(lnEl);
      }

      if (emailEl && emailEl.value.trim()) {
        const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRe.test(emailEl.value.trim())) {
          setFieldError(emailEl, 'Introduce un correo válido.', emailErr);
          isValid = false;
        } else {
          clearFieldError(emailEl, emailErr);
        }
      }
    } else if (currentStep === 2) {
      // Validar rangos de fechas en Experiencia
      cvData.experience.forEach((exp, idx) => {
        const start = parseInt(exp.startDate, 10);
        const end = parseInt(exp.endDate, 10);
        const cardEl = document.getElementById(`expCard_${exp.id}`);
        const errEl = document.getElementById(`expErr_${exp.id}`);

        if (!isNaN(start) && !isNaN(end) && end < start) {
          isValid = false;
          if (errEl) {
            errEl.textContent = 'La fecha de fin no puede ser anterior a la de inicio.';
            errEl.classList.remove('hidden');
          }
          if (cardEl) cardEl.style.borderColor = '#ef4444';
        } else {
          if (errEl) errEl.classList.add('hidden');
          if (cardEl) cardEl.style.borderColor = '';
        }
      });
    } else if (currentStep === 3) {
      // Validar rangos de fechas en Educación
      cvData.education.forEach((edu) => {
        const start = parseInt(edu.startDate, 10);
        const end = parseInt(edu.endDate, 10);
        const errEl = document.getElementById(`eduErr_${edu.id}`);
        const cardEl = document.getElementById(`eduCard_${edu.id}`);

        if (!isNaN(start) && !isNaN(end) && end < start) {
          isValid = false;
          if (errEl) {
            errEl.textContent = 'La fecha de fin no puede ser anterior a la de inicio.';
            errEl.classList.remove('hidden');
          }
          if (cardEl) cardEl.style.borderColor = '#ef4444';
        } else {
          if (errEl) errEl.classList.add('hidden');
          if (cardEl) cardEl.style.borderColor = '';
        }
      });
    }

    return isValid;
  }

  function setFieldError(inputEl, msg, customErrEl) {
    if (inputEl) inputEl.classList.add('is-invalid');
    const errEl = customErrEl || (inputEl ? inputEl.nextElementSibling : null);
    if (errEl && errEl.classList.contains('cv-error-text')) {
      errEl.textContent = msg;
      errEl.classList.remove('hidden');
    }
  }

  function clearFieldError(inputEl, customErrEl) {
    if (inputEl) inputEl.classList.remove('is-invalid');
    const errEl = customErrEl || (inputEl ? inputEl.nextElementSibling : null);
    if (errEl && errEl.classList.contains('cv-error-text')) {
      errEl.textContent = '';
      errEl.classList.add('hidden');
    }
  }

  // ------------------------------------------------------------------------
  // Carga de Fotos
  // ------------------------------------------------------------------------
  function handlePhotoUpload(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido (.png, .jpg, .webp)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      cvData.personal.photo = evt.target.result;
      saveCvData();
      updatePhotoPreview();
    };
    reader.readAsDataURL(file);
  }

  function updatePhotoPreview() {
    const thumbImg = document.getElementById('cvPhotoThumbImg');
    const thumbIcon = document.getElementById('cvPhotoThumbIcon');
    if (cvData.personal.photo) {
      if (thumbImg) {
        thumbImg.src = cvData.personal.photo;
        thumbImg.classList.remove('hidden');
      }
      if (thumbIcon) thumbIcon.classList.add('hidden');
    } else {
      if (thumbImg) {
        thumbImg.src = '';
        thumbImg.classList.add('hidden');
      }
      if (thumbIcon) thumbIcon.classList.remove('hidden');
    }
  }

  // ------------------------------------------------------------------------
  // Llenado de formularios desde el Estado
  // ------------------------------------------------------------------------
  function populateFormFromState() {
    // Paso 1: Personal
    setVal('cvFirstName', cvData.personal.firstName);
    setVal('cvLastName', cvData.personal.lastName);
    setVal('cvJobTitle', cvData.personal.jobTitle);
    setVal('cvProfile', cvData.personal.profile);
    setVal('cvPhone', cvData.personal.phone);
    setVal('cvEmail', cvData.personal.email);
    setVal('cvWebsite', cvData.personal.website);
    setVal('cvLocation', cvData.personal.location);
    updatePhotoPreview();

    // Paso 2: Experiencia
    renderExperienceEditorList();

    // Paso 3: Educación
    renderEducationEditorList();

    // Paso 4: Idiomas
    renderLanguagesEditorList();

    // Paso 5: Competencias y Habilidades
    renderCompetenciesEditorList();
    renderSkillsEditorList();
  }

  function setVal(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val || '';
  }

  // ------------------------------------------------------------------------
  // Renderizado de listas en el Wizard (Paso 2, 3, 4, 5)
  // ------------------------------------------------------------------------
  function renderExperienceEditorList() {
    const container = document.getElementById('cvExperienceList');
    if (!container) return;

    if (cvData.experience.length === 0) {
      container.innerHTML = '<p class="ed-hint" style="margin-bottom:0.75rem;">No hay experiencias agregadas.</p>';
      return;
    }

    container.innerHTML = cvData.experience.map((exp, index) => `
      <div class="cv-item-editor-card" id="expCard_${exp.id}">
        <button type="button" class="cv-card-delete-btn" data-id="${exp.id}" title="Eliminar experiencia">
          <i class="fas fa-trash-alt"></i>
        </button>
        <div class="cv-form-group">
          <label class="cv-label">Empresa / Cargo <span class="required">*</span></label>
          <input type="text" class="cv-input exp-title-input" data-id="${exp.id}" value="${escapeHtml(exp.title)}" placeholder="Ej. Multinacional González">
        </div>
        <div class="cv-grid-2">
          <div class="cv-form-group">
            <label class="cv-label">Año Inicio</label>
            <input type="text" class="cv-input exp-start-input" data-id="${exp.id}" value="${escapeHtml(exp.startDate)}" placeholder="Ej. 2019">
          </div>
          <div class="cv-form-group">
            <label class="cv-label">Año Fin</label>
            <input type="text" class="cv-input exp-end-input" data-id="${exp.id}" value="${escapeHtml(exp.endDate)}" placeholder="Ej. 2023 o Actual">
          </div>
        </div>
        <span class="cv-error-text hidden" id="expErr_${exp.id}"></span>
        <div class="cv-form-group" style="margin-top:0.4rem;">
          <label class="cv-label">Descripción</label>
          <textarea rows="2" class="cv-textarea exp-desc-input" data-id="${exp.id}" placeholder="Breve descripción de funciones y logros...">${escapeHtml(exp.desc)}</textarea>
        </div>
      </div>
    `).join('');

    // Eventos de inputs y eliminar
    container.querySelectorAll('.exp-title-input').forEach((input) => {
      input.addEventListener('input', (e) => {
        const item = cvData.experience.find((x) => x.id === e.target.dataset.id);
        if (item) { item.title = e.target.value; saveCvData(); }
      });
    });

    container.querySelectorAll('.exp-start-input').forEach((input) => {
      input.addEventListener('input', (e) => {
        const item = cvData.experience.find((x) => x.id === e.target.dataset.id);
        if (item) { item.startDate = e.target.value; saveCvData(); validateCurrentStep(); }
      });
    });

    container.querySelectorAll('.exp-end-input').forEach((input) => {
      input.addEventListener('input', (e) => {
        const item = cvData.experience.find((x) => x.id === e.target.dataset.id);
        if (item) { item.endDate = e.target.value; saveCvData(); validateCurrentStep(); }
      });
    });

    container.querySelectorAll('.exp-desc-input').forEach((input) => {
      input.addEventListener('input', (e) => {
        const item = cvData.experience.find((x) => x.id === e.target.dataset.id);
        if (item) { item.desc = e.target.value; saveCvData(); }
      });
    });

    container.querySelectorAll('.cv-card-delete-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        cvData.experience = cvData.experience.filter((x) => x.id !== btn.dataset.id);
        saveCvData();
        renderExperienceEditorList();
      });
    });
  }

  function renderEducationEditorList() {
    const container = document.getElementById('cvEducationList');
    if (!container) return;

    if (cvData.education.length === 0) {
      container.innerHTML = '<p class="ed-hint" style="margin-bottom:0.75rem;">No hay estudios agregados.</p>';
      return;
    }

    container.innerHTML = cvData.education.map((edu) => `
      <div class="cv-item-editor-card" id="eduCard_${edu.id}">
        <button type="button" class="cv-card-delete-btn" data-id="${edu.id}" title="Eliminar formación">
          <i class="fas fa-trash-alt"></i>
        </button>
        <div class="cv-form-group">
          <label class="cv-label">Institución / Universidad <span class="required">*</span></label>
          <input type="text" class="cv-input edu-inst-input" data-id="${edu.id}" value="${escapeHtml(edu.institution)}" placeholder="Ej. Universidad Ensigna">
        </div>
        <div class="cv-form-group">
          <label class="cv-label">Carrera / Título Obtenido</label>
          <input type="text" class="cv-input edu-degree-input" data-id="${edu.id}" value="${escapeHtml(edu.degree)}" placeholder="Ej. Ingeniería en sistemas">
        </div>
        <div class="cv-grid-2">
          <div class="cv-form-group">
            <label class="cv-label">Año Inicio</label>
            <input type="text" class="cv-input edu-start-input" data-id="${edu.id}" value="${escapeHtml(edu.startDate)}" placeholder="Ej. 2018">
          </div>
          <div class="cv-form-group">
            <label class="cv-label">Año Fin</label>
            <input type="text" class="cv-input edu-end-input" data-id="${edu.id}" value="${escapeHtml(edu.endDate)}" placeholder="Ej. 2023">
          </div>
        </div>
        <span class="cv-error-text hidden" id="eduErr_${edu.id}"></span>
      </div>
    `).join('');

    container.querySelectorAll('.edu-inst-input').forEach((input) => {
      input.addEventListener('input', (e) => {
        const item = cvData.education.find((x) => x.id === e.target.dataset.id);
        if (item) { item.institution = e.target.value; saveCvData(); }
      });
    });

    container.querySelectorAll('.edu-degree-input').forEach((input) => {
      input.addEventListener('input', (e) => {
        const item = cvData.education.find((x) => x.id === e.target.dataset.id);
        if (item) { item.degree = e.target.value; saveCvData(); }
      });
    });

    container.querySelectorAll('.edu-start-input').forEach((input) => {
      input.addEventListener('input', (e) => {
        const item = cvData.education.find((x) => x.id === e.target.dataset.id);
        if (item) { item.startDate = e.target.value; saveCvData(); validateCurrentStep(); }
      });
    });

    container.querySelectorAll('.edu-end-input').forEach((input) => {
      input.addEventListener('input', (e) => {
        const item = cvData.education.find((x) => x.id === e.target.dataset.id);
        if (item) { item.endDate = e.target.value; saveCvData(); validateCurrentStep(); }
      });
    });

    container.querySelectorAll('.cv-card-delete-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        cvData.education = cvData.education.filter((x) => x.id !== btn.dataset.id);
        saveCvData();
        renderEducationEditorList();
      });
    });
  }

  function renderLanguagesEditorList() {
    const container = document.getElementById('cvLanguagesChips');
    if (!container) return;

    container.innerHTML = cvData.languages.map((lang) => `
      <span class="cv-chip">
        <i class="fas fa-check-circle" style="color:var(--cv-accent-gold); font-size:11px;"></i>
        ${escapeHtml(lang.name)}
        <button type="button" class="cv-chip-remove" data-id="${lang.id}" title="Eliminar idioma">
          <i class="fas fa-times"></i>
        </button>
      </span>
    `).join('');

    container.querySelectorAll('.cv-chip-remove').forEach((btn) => {
      btn.addEventListener('click', () => {
        cvData.languages = cvData.languages.filter((x) => x.id !== btn.dataset.id);
        saveCvData();
        renderLanguagesEditorList();
      });
    });
  }

  function renderCompetenciesEditorList() {
    const container = document.getElementById('cvCompetenciesList');
    if (!container) return;

    if (cvData.competencies.length === 0) {
      container.innerHTML = '<p class="ed-hint" style="margin-bottom:0.75rem;">No hay competencias agregadas.</p>';
      return;
    }

    container.innerHTML = cvData.competencies.map((comp) => `
      <div class="cv-item-editor-card" style="display:flex; align-items:center; justify-content:space-between; gap:0.5rem; padding:0.5rem 0.75rem;">
        <input type="text" class="cv-input comp-name-input" data-id="${comp.id}" value="${escapeHtml(comp.name)}" style="flex:1;" placeholder="Ej. Software 01">
        <div class="cv-level-selector" style="margin-top:0;">
          ${[1, 2, 3, 4, 5].map((lvl) => `
            <button type="button" class="cv-level-btn comp-lvl-btn ${comp.level === lvl ? 'active' : ''}" data-id="${comp.id}" data-level="${lvl}">
              ${lvl}
            </button>
          `).join('')}
        </div>
        <button type="button" class="cv-card-delete-btn" data-id="${comp.id}" style="position:static;" title="Eliminar">
          <i class="fas fa-trash-alt"></i>
        </button>
      </div>
    `).join('');

    container.querySelectorAll('.comp-name-input').forEach((input) => {
      input.addEventListener('input', (e) => {
        const item = cvData.competencies.find((x) => x.id === e.target.dataset.id);
        if (item) { item.name = e.target.value; saveCvData(); }
      });
    });

    container.querySelectorAll('.comp-lvl-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget;
        const item = cvData.competencies.find((x) => x.id === target.dataset.id);
        if (item) {
          item.level = parseInt(target.dataset.level, 10);
          saveCvData();
          renderCompetenciesEditorList();
        }
      });
    });

    container.querySelectorAll('.cv-card-delete-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        cvData.competencies = cvData.competencies.filter((x) => x.id !== btn.dataset.id);
        saveCvData();
        renderCompetenciesEditorList();
      });
    });
  }

  function renderSkillsEditorList() {
    const container = document.getElementById('cvSkillsList');
    if (!container) return;

    if (cvData.skills.length === 0) {
      container.innerHTML = '<p class="ed-hint" style="margin-bottom:0.75rem;">No hay habilidades agregadas.</p>';
      return;
    }

    container.innerHTML = cvData.skills.map((skill) => `
      <div class="cv-item-editor-card" style="display:flex; align-items:center; justify-content:space-between; gap:0.5rem; padding:0.5rem 0.75rem;">
        <input type="text" class="cv-input skill-name-input" data-id="${skill.id}" value="${escapeHtml(skill.name)}" style="flex:1;" placeholder="Ej. Liderazgo">
        <div class="cv-level-selector" style="margin-top:0;">
          ${[1, 2, 3, 4, 5].map((lvl) => `
            <button type="button" class="cv-level-btn skill-lvl-btn ${skill.level === lvl ? 'active' : ''}" data-id="${skill.id}" data-level="${lvl}">
              ${lvl}
            </button>
          `).join('')}
        </div>
        <button type="button" class="cv-card-delete-btn" data-id="${skill.id}" style="position:static;" title="Eliminar">
          <i class="fas fa-trash-alt"></i>
        </button>
      </div>
    `).join('');

    container.querySelectorAll('.skill-name-input').forEach((input) => {
      input.addEventListener('input', (e) => {
        const item = cvData.skills.find((x) => x.id === e.target.dataset.id);
        if (item) { item.name = e.target.value; saveCvData(); }
      });
    });

    container.querySelectorAll('.skill-lvl-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget;
        const item = cvData.skills.find((x) => x.id === target.dataset.id);
        if (item) {
          item.level = parseInt(target.dataset.level, 10);
          saveCvData();
          renderSkillsEditorList();
        }
      });
    });

    container.querySelectorAll('.cv-card-delete-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        cvData.skills = cvData.skills.filter((x) => x.id !== btn.dataset.id);
        saveCvData();
        renderSkillsEditorList();
      });
    });
  }

  // ------------------------------------------------------------------------
  // Renderizado del Currículum A4 (Fiel a la Referencia)
  // ------------------------------------------------------------------------
  function renderCvPreview() {
    const p = cvData.personal;

    // Header: Nombres y Título
    setElText('previewCvFirstName', p.firstName || 'Nombre');
    setElText('previewCvLastName', p.lastName || 'Apellido');
    setElText('previewCvJobTitle', p.jobTitle || 'Título Profesional');

    // Header: Foto
    const photoImg = document.getElementById('previewCvPhotoImg');
    const photoPlaceholder = document.getElementById('previewCvPhotoPlaceholder');
    if (photoImg && photoPlaceholder) {
      if (p.photo) {
        photoImg.src = p.photo;
        photoImg.classList.remove('hidden');
        photoPlaceholder.classList.add('hidden');
      } else {
        photoImg.src = '';
        photoImg.classList.add('hidden');
        photoPlaceholder.classList.remove('hidden');
      }
    }

    // Header: Perfil
    setElText('previewCvProfileText', p.profile || 'Resumen del perfil profesional...');

    // Header: Contacto
    setElText('previewCvPhone', p.phone || '+00 000 000000');
    setElText('previewCvEmail', p.email || 'correo@ejemplo.com');
    setElText('previewCvWebsite', p.website || 'www.misitio.com');
    setElText('previewCvLocation', p.location || 'Ciudad, País');

    // Body: Experiencia Laboral
    const expContainer = document.getElementById('previewCvExperienceList');
    if (expContainer) {
      if (cvData.experience.length === 0) {
        expContainer.innerHTML = '<p class="cv-item-desc" style="color:#94a3b8;">Sin experiencia agregada.</p>';
      } else {
        expContainer.innerHTML = cvData.experience.map((exp) => `
          <div class="cv-timeline-item">
            <div class="cv-item-check"><i class="far fa-check-square"></i></div>
            <div class="cv-item-content">
              <div class="cv-item-header">
                <span class="cv-item-company">${escapeHtml(exp.title)}</span>
                <span class="cv-item-dates">${escapeHtml(exp.startDate)}${exp.endDate ? ' - ' + escapeHtml(exp.endDate) : ''}</span>
              </div>
              ${exp.desc ? `<p class="cv-item-desc">${escapeHtml(exp.desc)}</p>` : ''}
            </div>
          </div>
        `).join('');
      }
    }

    // Body: Formación Académica
    const eduContainer = document.getElementById('previewCvEducationList');
    if (eduContainer) {
      if (cvData.education.length === 0) {
        eduContainer.innerHTML = '<p class="cv-item-desc" style="color:#94a3b8;">Sin formación agregada.</p>';
      } else {
        eduContainer.innerHTML = cvData.education.map((edu) => `
          <div class="cv-timeline-item">
            <div class="cv-item-check"><i class="far fa-check-square"></i></div>
            <div class="cv-item-content">
              <div class="cv-item-header">
                <span class="cv-item-company">${escapeHtml(edu.institution)}</span>
                <span class="cv-item-dates">${escapeHtml(edu.startDate)}${edu.endDate ? ' - ' + escapeHtml(edu.endDate) : ''}</span>
              </div>
              ${edu.degree ? `<p class="cv-item-desc">${escapeHtml(edu.degree)}</p>` : ''}
            </div>
          </div>
        `).join('');
      }
    }

    // Body: Idiomas
    const langContainer = document.getElementById('previewCvLanguagesList');
    if (langContainer) {
      if (cvData.languages.length === 0) {
        langContainer.innerHTML = '<p class="cv-item-desc" style="color:#94a3b8;">Sin idiomas agregados.</p>';
      } else {
        langContainer.innerHTML = cvData.languages.map((lang) => `
          <li class="cv-lang-item">
            <i class="fas fa-check-circle cv-lang-icon"></i>
            <span>${escapeHtml(lang.name)}</span>
          </li>
        `).join('');
      }
    }

    // Body: Competencias (Barras de progreso)
    const compContainer = document.getElementById('previewCvCompetenciesList');
    if (compContainer) {
      if (cvData.competencies.length === 0) {
        compContainer.innerHTML = '<p class="cv-item-desc" style="color:#94a3b8;">Sin competencias agregadas.</p>';
      } else {
        compContainer.innerHTML = cvData.competencies.map((comp) => {
          const percent = Math.min(100, Math.max(20, comp.level * 20));
          return `
            <div class="cv-comp-row">
              <span class="cv-comp-name" title="${escapeHtml(comp.name)}">${escapeHtml(comp.name)}</span>
              <div class="cv-comp-bar-track">
                <div class="cv-comp-bar-fill" style="width:${percent}%"></div>
              </div>
            </div>
          `;
        }).join('');
      }
    }

    // Body: Habilidades (5 Dots)
    const skillContainer = document.getElementById('previewCvSkillsList');
    if (skillContainer) {
      if (cvData.skills.length === 0) {
        skillContainer.innerHTML = '<p class="cv-item-desc" style="color:#94a3b8;">Sin habilidades agregadas.</p>';
      } else {
        skillContainer.innerHTML = cvData.skills.map((skill) => `
          <div class="cv-skill-row">
            <span class="cv-skill-name" title="${escapeHtml(skill.name)}">${escapeHtml(skill.name)}</span>
            <div class="cv-skill-dots">
              ${[1, 2, 3, 4, 5].map((dotIndex) => `
                <span class="cv-dot ${dotIndex <= skill.level ? 'filled' : ''}"></span>
              `).join('')}
            </div>
          </div>
        `).join('');
      }
    }
  }

  function setElText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  // ------------------------------------------------------------------------
  // Auto-ajuste de escala para vista previa responsiva A4
  // ------------------------------------------------------------------------
  let currentZoom = 1;

  function autoFitSheet() {
    const viewport = document.getElementById('cvPreviewViewport');
    const sheet = document.getElementById('cvPaperSheet');
    if (!viewport || !sheet) return;

    const availableWidth = viewport.clientWidth - 40;
    const availableHeight = viewport.clientHeight - 40;
    const sheetWidth = 794;
    const sheetHeight = 1123;

    const scaleX = availableWidth / sheetWidth;
    const scaleY = availableHeight / sheetHeight;
    currentZoom = Math.min(scaleX, scaleY, 1.05);

    sheet.style.transform = `scale(${currentZoom})`;
  }

  function adjustZoom(delta) {
    currentZoom = Math.min(1.5, Math.max(0.4, currentZoom + delta));
    const sheet = document.getElementById('cvPaperSheet');
    if (sheet) sheet.style.transform = `scale(${currentZoom})`;
  }

  function setupAutoFitPreview() {
    window.addEventListener('resize', () => {
      const viewCv = document.getElementById('viewCv');
      if (viewCv && viewCv.classList.contains('active')) {
        autoFitSheet();
      }
    });
  }

  // ------------------------------------------------------------------------
  // Descarga de PDF con html2pdf.js
  // ------------------------------------------------------------------------
  function downloadCvAsPdf() {
    const sheet = document.getElementById('cvPaperSheet');
    if (!sheet) return;

    const p = cvData.personal;
    const fileName = `Curriculum_${p.firstName || 'Candidato'}_${p.lastName || 'CV'}.pdf`.replace(/\s+/g, '_');

    triggerSuccessFeedback('Generando PDF...');

    // Guardar estilos que interfieren con la captura
    const saved = {
      transform: sheet.style.transform,
      boxShadow: sheet.style.boxShadow,
      border: sheet.style.border
    };

    // El viewport padre tiene overflow:auto que recorta la captura de html2canvas.
    // Temporalmente lo desactivamos.
    const viewport = sheet.closest('.cv-preview-viewport');
    const savedViewportOverflow = viewport ? viewport.style.overflow : null;
    if (viewport) viewport.style.overflow = 'visible';

    // Limpiar estilos temporalmente: el transform (zoom) distorsiona la captura,
    // el border de 1px suma 2px al alto total y causa una 2da página en blanco.
    sheet.style.transform = 'none';
    sheet.style.boxShadow = 'none';
    sheet.style.border = 'none';

    function restore() {
      sheet.style.transform = saved.transform;
      sheet.style.boxShadow = saved.boxShadow;
      sheet.style.border = saved.border;
      if (viewport) viewport.style.overflow = savedViewportOverflow || '';
    }

    html2pdf()
      .set({
        margin: 0,
        filename: fileName,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      })
      .from(sheet)
      .toPdf()
      .get('pdf')
      .then(function (pdf) {
        // Eliminar cualquier página extra en blanco
        while (pdf.internal.getNumberOfPages() > 1) {
          pdf.deletePage(pdf.internal.getNumberOfPages());
        }
      })
      .save()
      .then(function () {
        restore();
        triggerSuccessFeedback('¡PDF descargado con éxito!');
      })
      .catch(function (err) {
        restore();
        console.error('Error al generar PDF:', err);
      });
  }

  function triggerSuccessFeedback(msg) {
    const toast = document.getElementById('saveToast');
    if (toast) {
      toast.innerHTML = `<i class="fas fa-check-circle"></i> ${msg}`;
      toast.classList.remove('hidden', 'is-error', 'is-warn');
      void toast.offsetWidth;
      toast.classList.add('show');
      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.classList.add('hidden'), 300);
      }, 2800);
    }
  }

  // Exportar funciones globales necesarias
  window.cvWizard = {
    renderPreview: renderCvPreview,
    autoFit: autoFitSheet,
    downloadPdf: downloadCvAsPdf,
    saveData: saveCvData
  };

})();
