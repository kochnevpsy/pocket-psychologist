// app.js - Логика тестирования, подсчета результатов и визуализации теста Сонди (МПВ)
// Поддержка двух этапов: Первый план (Vordergrund) и Второй план (Hintergrund)

document.addEventListener('DOMContentLoaded', () => {
  try {
  // Application Settings & Advanced Modes State
  const appSettings = {
    copingAdvanced: localStorage.getItem('kp_advanced_mode_coping') === 'true',
    thoughtsAdvanced: localStorage.getItem('kp_advanced_mode_thoughts') === 'true',
    trackerAdvanced: localStorage.getItem('kp_advanced_mode_tracker') === 'true',
    disabledModules: new Set(),
    defaultModule: 'hub'
  };
  window.appSettings = appSettings;

  const MODULE_VISIBILITY_KEY = 'kp_disabled_modules_v1';
  const DEFAULT_MODULE_KEY = 'kp_default_module_v1';
  try {
    const rawDisabled = localStorage.getItem(MODULE_VISIBILITY_KEY);
    if (rawDisabled === null) {
      // Default configuration: Sondi and the personal diary are available in
      // Options, but off by default.
      appSettings.disabledModules.add('szondi');
      appSettings.disabledModules.add('diary');
    } else {
      const savedDisabled = JSON.parse(rawDisabled || '[]');
      if (Array.isArray(savedDisabled)) {
        savedDisabled.forEach(id => {
          if (typeof APP_MODULES !== 'undefined' && APP_MODULES.some(m => m.id === id)) {
            appSettings.disabledModules.add(id);
          }
        });
      }
    }
  } catch (e) {}
  try {
    const savedDefault = localStorage.getItem(DEFAULT_MODULE_KEY);
    if (savedDefault) appSettings.defaultModule = savedDefault;
  } catch (e) {}

  // One-time migration: the personal diary is off by default even for users
  // who already have an older module-settings entry.
  try {
    if (!localStorage.getItem('kp_diary_default_off_v1')) {
      if (!appSettings.disabledModules.has('diary')) {
        appSettings.disabledModules.add('diary');
        saveModuleSettings();
      }
      localStorage.setItem('kp_diary_default_off_v1', '1');
    }
  } catch (e) {}

  function isModuleEnabled(id) {
    if (!id || id === 'hub') return true;
    if (typeof APP_MODULES === 'undefined') return true;
    return !appSettings.disabledModules.has(id);
  }

  function saveModuleSettings() {
    try {
      localStorage.setItem(MODULE_VISIBILITY_KEY, JSON.stringify(Array.from(appSettings.disabledModules)));
      localStorage.setItem(DEFAULT_MODULE_KEY, appSettings.defaultModule || 'hub');
    } catch (e) {}
  }

  function getStartupModule() {
    const target = appSettings.defaultModule || 'hub';
    if (target === 'hub') return 'hub';
    return isModuleEnabled(target) ? target : 'hub';
  }

  // DOM Elements
  const screenWelcome = document.getElementById('screen-welcome');
  const screenTest = document.getElementById('screen-test');
  const screenResults = document.getElementById('screen-results');
  const screenHistory = document.getElementById('screen-history');
  const screenHub = document.getElementById('screen-hub');
  const screenUpcoming = document.getElementById('screen-upcoming');
  const screenBreathing = document.getElementById('screen-breathing');
  const screenGrounding = document.getElementById('screen-grounding');
  const screenCoping = document.getElementById('screen-coping');
  const screenThoughts = document.getElementById('screen-thoughts');
  const screenTracker = document.getElementById('screen-tracker');
  const screenDiary = document.getElementById('screen-diary');
  const screenWhitenoise = document.getElementById('screen-whitenoise');
  const screenAuthor = document.getElementById('screen-author');
  const btnHubOpenAuthor = document.getElementById('btn-hub-open-author');
  const btnSettingsOpenAuthor = document.getElementById('btn-settings-open-author');
  const hubModulesGrid = document.getElementById('hub-modules-grid');
  const btnHeaderHome = document.getElementById('btn-header-home');
  const btnHeaderModulesToggle = document.getElementById('btn-header-modules-toggle');
  const btnResultsToHub = document.getElementById('btn-results-to-hub');
  const btnSosBreathe = document.getElementById('btn-sos-breathe');
  const btnSosGround = document.getElementById('btn-sos-ground');
  const btnSosWhitenoise = document.getElementById('btn-sos-whitenoise');
  const upcomingTitle = document.getElementById('upcoming-title');
  const upcomingIcon = document.getElementById('upcoming-icon');
  const upcomingDesc = document.getElementById('upcoming-desc');
  const upcomingModuleHeaderTitle = document.getElementById('upcoming-module-header-title');
  const navTabItems = document.querySelectorAll('.nav-tab-item');

  const btnStartTest = document.getElementById('btn-start-test');
  const btnPrint = document.getElementById('btn-print');
  const btnShare = document.getElementById('btn-share');
  const btnSaveChartsImage = document.getElementById('btn-save-charts-image');
  const btnTelegramKms = document.getElementById('btn-telegram-kms');
  const btnMaxKms = document.getElementById('btn-max-kms');
  const btnExpertMax = document.getElementById('btn-expert-max');
  const btnExpertTelegram = document.getElementById('btn-expert-telegram');

  const MAX_EXPERT_URL = 'https://max.ru/u/f9LHodD0cOJDHKS3v0RDLu913Wl1bDs9g7KdgkAPTnjFG5jy6kplGsQ15Jw';
  const TELEGRAM_EXPERT_USER = 'kms_psy';
  const btnRestart = document.getElementById('btn-restart');
  const btnHistoryWelcome = document.getElementById('btn-history-welcome');
  const btnHistoryResults = document.getElementById('btn-history-results');
  const btnHistoryBack = document.getElementById('btn-history-back');
  const btnClearHistory = document.getElementById('btn-clear-history');
  const historyListContainer = document.getElementById('history-list-container');
  const historyCount = document.getElementById('history-count');

  const cbTestMode = document.getElementById('cb-test-mode');
  const cbSecondPlan = document.getElementById('cb-second-plan');
  const modalConfirm = document.getElementById('modal-confirm');
  const modalConfirmTitle = document.getElementById('modal-confirm-title');
  const modalConfirmMessage = document.getElementById('modal-confirm-message');
  const modalBtnCancel = document.getElementById('modal-btn-cancel');
  const modalBtnConfirm = document.getElementById('modal-btn-confirm');
  const modalConfirmBtnText = document.getElementById('modal-confirm-btn-text');

  // Global Handler for Keyboard Done Checkmark Buttons (Item 2)
  function updateKeyboardDoneStatus(input) {
    if (!input) return;
    const wrap = input.closest('.input-with-keyboard-done');
    if (!wrap) return;
    const btn = wrap.querySelector('.btn-keyboard-done');
    if (!btn) return;
    if (input.value && input.value.length > 0) {
      btn.classList.add('is-active');
    } else {
      btn.classList.remove('is-active');
    }
  }
  window.updateKeyboardDoneStatus = updateKeyboardDoneStatus;

  function updateAllKeyboardDoneButtons() {
    document.querySelectorAll('.input-with-keyboard-done textarea, .input-with-keyboard-done input').forEach(input => {
      updateKeyboardDoneStatus(input);
    });
  }
  window.updateAllKeyboardDoneButtons = updateAllKeyboardDoneButtons;

  document.addEventListener('input', (e) => {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
      updateKeyboardDoneStatus(e.target);
    }
  });
  document.addEventListener('change', (e) => {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
      updateKeyboardDoneStatus(e.target);
    }
  });

  function handleKeyboardDone(e) {
    const btn = e.target.closest('.btn-keyboard-done');
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    const wrap = btn.closest('.input-with-keyboard-done');
    const input = wrap ? wrap.querySelector('textarea, input') : null;
    if (!input) return;

    const scope = input.closest('form, .modal-card, .screen') || document;
    const fields = Array.from(scope.querySelectorAll('textarea, input'))
      .filter(el => {
        if (el.disabled || el.readOnly) return false;
        const type = (el.getAttribute('type') || 'text').toLowerCase();
        if (['range', 'checkbox', 'radio', 'file', 'hidden', 'button', 'submit'].includes(type)) return false;
        return el.getClientRects().length > 0;
      });
    const next = fields[fields.indexOf(input) + 1];

    if (next) {
      btn.title = 'Следующее поле';
      btn.setAttribute('aria-label', 'Следующее поле');
      next.focus({ preventScroll: false });
      if (typeof next.setSelectionRange === 'function' && typeof next.value === 'string') {
        try { next.setSelectionRange(next.value.length, next.value.length); } catch (err) {}
      }
      next.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }

    btn.title = 'Скрыть клавиатуру';
    btn.setAttribute('aria-label', 'Скрыть клавиатуру');
    input.blur();
    if (document.activeElement && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur();
    }
  }
  document.addEventListener('click', handleKeyboardDone);

  let activeConfirmAction = null;
  function showConfirmDialog({ title, message, confirmText, onConfirm }) {
    if (!modalConfirm) {
      if (confirm((message || 'Вы уверены?').replace(/<[^>]*>/g, ''))) onConfirm?.();
      return;
    }
    if (modalConfirmTitle) modalConfirmTitle.textContent = title || 'Подтверждение';
    if (modalConfirmMessage) modalConfirmMessage.innerHTML = message || 'Вы действительно хотите удалить эту запись?';
    if (modalConfirmBtnText) modalConfirmBtnText.textContent = confirmText || 'Удалить';

    activeConfirmAction = onConfirm;
    modalConfirm.classList.add('active');
    modalConfirm.setAttribute('aria-hidden', 'false');
    modalConfirm.style.zIndex = '100005';
  }
  window.showConfirmDialog = showConfirmDialog;

  function closeConfirmDialog() {
    if (!modalConfirm) return;
    modalConfirm.classList.remove('active');
    modalConfirm.setAttribute('aria-hidden', 'true');
    activeConfirmAction = null;
  }
  window.closeConfirmDialog = closeConfirmDialog;

  if (modalBtnCancel) {
    modalBtnCancel.addEventListener('click', closeConfirmDialog);
  }
  if (modalBtnConfirm) {
    modalBtnConfirm.addEventListener('click', () => {
      const act = activeConfirmAction;
      closeConfirmDialog();
      if (typeof act === 'function') act();
    });
  }
  // Safe backdrop close helper: only fires if pointer was pressed down ON the backdrop
  function attachBackdropClose(overlay, closeFn) {
    if (!overlay) return;
    let isBackdropDown = false;
    overlay.addEventListener('pointerdown', (e) => {
      isBackdropDown = (e.target === overlay);
    });
    overlay.addEventListener('click', (e) => {
      if (isBackdropDown && e.target === overlay) {
        isBackdropDown = false;
        closeFn();
      }
    });
  }
  window.attachBackdropClose = attachBackdropClose;

  // Pre-test Note DOM Elements
  const btnPretestNote = document.getElementById('btn-pretest-note');
  const pretestNoteTitle = document.getElementById('pretest-note-title');
  const pretestNoteDesc = document.getElementById('pretest-note-desc');
  const pretestNoteIndicator = document.getElementById('pretest-note-indicator');
  const resultsNoteCard = document.getElementById('results-note-card');
  const resultsNoteText = document.getElementById('results-note-text');

  const modalNote = document.getElementById('modal-note');
  const inputTestNote = document.getElementById('input-test-note');
  const noteCharCount = document.getElementById('note-char-count');
  const modalNoteBtnClear = document.getElementById('modal-note-btn-clear');
  const modalNoteBtnCancel = document.getElementById('modal-note-btn-cancel');
  const modalNoteBtnSave = document.getElementById('modal-note-btn-save');

  const stageBadge = document.getElementById('stage-badge');
  const seriesLabel = document.getElementById('series-label');
  const seriesPills = document.querySelectorAll('.series-pill');
  const phasePill = document.getElementById('phase-pill');
  const phaseIcon = document.getElementById('phase-icon');
  const phaseLabel = document.getElementById('phase-label');
  const phaseCounter = document.getElementById('phase-counter');
  const portraitsGrid = document.getElementById('portraits-grid');

  const szondiChartSvg = document.getElementById('szondi-chart-svg');
  const scalesGrid = document.getElementById('scales-grid');
  const sobchikInterpretationContainer = document.getElementById('sobchik-interpretation-container');
  const szondiInterpretationContainer = document.getElementById('szondi-interpretation-container');
  const personalitySynthesis = document.getElementById('personality-synthesis');
  const fateInterpretationContainer = document.getElementById('fate-interpretation-container');
  const resultsDate = document.getElementById('results-date');

  // Preload and decode all 48 portraits into memory immediately
  function preloadAllPortraits() {
    if (typeof SZONDI_SERIES === 'undefined') return;
    window._preloadedPortraits = [];
    SZONDI_SERIES.forEach(series => {
      series.portraits.forEach(p => {
        const img = new Image();
        img.src = p.src;
        if (typeof img.decode === 'function') {
          img.decode().catch(() => {});
        }
        window._preloadedPortraits.push(img);
      });
    });
  }
  preloadAllPortraits();

  // Persistent 8-card DOM slots (never destroyed, preventing blank flash)
  let persistentCards = [];

  function getCurrentPortraitsList() {
    if (state.stage === 'first') {
      const s = SZONDI_SERIES[state.currentSeriesIndex];
      return s ? s.portraits : [];
    } else {
      return state.secondPlanSeries[state.currentSeriesIndex] || [];
    }
  }

  function initPortraitsGrid() {
    if (persistentCards.length === 8) return;
    portraitsGrid.innerHTML = '';
    persistentCards = [];

    for (let i = 0; i < 8; i++) {
      const slot = document.createElement('div');
      slot.className = 'portrait-slot';
      slot.dataset.slotIndex = i;

      const card = document.createElement('div');
      card.className = 'portrait-card';
      card.dataset.slotIndex = i;

      const img = document.createElement('img');
      img.alt = `Портрет ${i + 1}`;
      img.loading = 'eager';
      img.draggable = false;
      card.draggable = false;

      card.appendChild(img);

      card.addEventListener('click', () => {
        const portraits = getCurrentPortraitsList();
        if (!portraits) return;
        const portrait = portraits[i];
        if (portrait) {
          onPortraitClick(portrait, card);
        }
      });

      slot.appendChild(card);
      portraitsGrid.appendChild(slot);
      persistentCards.push(card);
    }

    // Completely prevent scroll, elastic stretch and rubber-banding during portrait selections
    if (portraitsGrid && !portraitsGrid._touchGuarded) {
      portraitsGrid.addEventListener('touchmove', (e) => {
        e.preventDefault();
      }, { passive: false });
      portraitsGrid._touchGuarded = true;
    }
    const screenTestEl = document.getElementById('screen-test');
    if (screenTestEl && !screenTestEl._touchGuarded) {
      screenTestEl.addEventListener('touchmove', (e) => {
        if (screenTestEl.classList.contains('active')) {
          e.preventDefault();
        }
      }, { passive: false });
      screenTestEl._touchGuarded = true;
    }
  }

  // Application State
  const state = {
    testNote: '', // Заметка перед прохождением (до 200 символов)
    isTestRun: false, // Флаг тестового прохождения (не сохранять в историю)
    exploreSecondPlan: true, // Исследовать второй план (по умолчанию true)
    stage: 'first', // 'first' (Этап 1: 6 серий по 8 портретов) или 'second' (Этап 2: 6 серий по 4 портрета)
    currentSeriesIndex: 0, // 0 to 5
    currentPhase: 'pleasant', // 'pleasant' или 'unpleasant'
    currentSelections: {
      pleasant: [],
      unpleasant: []
    },
    firstPlanHistory: [], // [{ seriesNumber: 1, pleasant: [...], unpleasant: [...], unchosen: [...] }, ...]
    secondPlanSeries: [], // 6 массивов по 4 портрета каждый, отсортированных по имени файла
    secondPlanHistory: [], // [{ seriesNumber: 1, pleasant: [...], unpleasant: [...] }, ...]
    firstPlanScores: {
      'h+': 0, 'h-': 0, 's+': 0, 's-': 0,
      'e+': 0, 'e-': 0, 'hy+': 0, 'hy-': 0,
      'k+': 0, 'k-': 0, 'p+': 0, 'p-': 0,
      'd+': 0, 'd-': 0, 'm+': 0, 'm-': 0
    },
    secondPlanScores: {
      'h+': 0, 'h-': 0, 's+': 0, 's-': 0,
      'e+': 0, 'e-': 0, 'hy+': 0, 'hy-': 0,
      'k+': 0, 'k-': 0, 'p+': 0, 'p-': 0,
      'd+': 0, 'd-': 0, 'm+': 0, 'm-': 0
    },
    scores: {
      'h+': 0, 'h-': 0, 's+': 0, 's-': 0,
      'e+': 0, 'e-': 0, 'hy+': 0, 'hy-': 0,
      'k+': 0, 'k-': 0, 'p+': 0, 'p-': 0,
      'd+': 0, 'd-': 0, 'm+': 0, 'm-': 0
    }
  };

  // --- Initialize App Controls ---
  btnStartTest.addEventListener('click', () => {
    startTest();
  });

  // --- Initialize 4 Switchable Result Tabs ---
  function initTabs() {
    const tabBtns = document.querySelectorAll('.results-tab-btn');
    const tabPanes = document.querySelectorAll('.results-tab-pane');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-tab');
        tabBtns.forEach(b => b.classList.remove('active'));
        tabPanes.forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        const pane = document.getElementById(target);
        if (pane) pane.classList.add('active');
      });
    });
  }
  initTabs();

  btnPrint.addEventListener('click', () => {
    if (window.AndroidBridge && window.AndroidBridge.printPdf) {
      window.AndroidBridge.printPdf();
    } else {
      window.print();
    }
  });

  if (btnShare) {
    btnShare.addEventListener('click', () => {
      shareResults();
    });
  }

  if (btnSaveChartsImage) {
    btnSaveChartsImage.addEventListener('click', saveSondiChartsImage);
  }

  if (btnTelegramKms) {
    btnTelegramKms.addEventListener('click', () => {
      sendResultsToTelegramKms();
    });
  }

  if (btnMaxKms) {
    btnMaxKms.addEventListener('click', () => {
      sendResultsToMaxKms();
    });
  }

  if (btnExpertMax) {
    btnExpertMax.addEventListener('click', () => {
      sendResultsToMaxKms();
    });
  }

  if (btnExpertTelegram) {
    btnExpertTelegram.addEventListener('click', () => {
      sendResultsToTelegramKms();
    });
  }

  btnRestart.addEventListener('click', () => {
    resetTest();
  });

  if (btnHistoryWelcome) {
    btnHistoryWelcome.addEventListener('click', () => {
      renderHistoryScreen();
      showScreen(screenHistory);
    });
  }

  if (btnHistoryResults) {
    btnHistoryResults.addEventListener('click', () => {
      renderHistoryScreen();
      showScreen(screenHistory);
    });
  }

  if (btnHistoryBack) {
    btnHistoryBack.addEventListener('click', () => {
      showScreen(screenWelcome);
    });
  }

  // --- Modal Confirmation Dialog Helpers (Unified) ---
  function showConfirmModal(opts) {
    showConfirmDialog(opts);
  }
  function closeConfirmModal() {
    closeConfirmDialog();
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // --- Pre-test Note Handlers & Modal Logic ---
  function updatePretestNoteButton() {
    if (!btnPretestNote) return;
    const note = (state.testNote || '').trim();
    if (note) {
      btnPretestNote.classList.add('has-note');
      if (pretestNoteTitle) pretestNoteTitle.textContent = 'Заметка сохранена';
      if (pretestNoteDesc) pretestNoteDesc.textContent = note;
      if (pretestNoteIndicator) pretestNoteIndicator.style.display = 'inline-flex';
    } else {
      btnPretestNote.classList.remove('has-note');
      if (pretestNoteTitle) pretestNoteTitle.textContent = 'Заметка к тесту';
      if (pretestNoteDesc) pretestNoteDesc.textContent = 'Добавить заметку (до 200 симв.)';
      if (pretestNoteIndicator) pretestNoteIndicator.style.display = 'none';
    }
  }

  function openNoteModal() {
    if (!modalNote) return;
    const currentNote = state.testNote || '';
    if (inputTestNote) {
      inputTestNote.value = currentNote;
      updateNoteCharCount();
    }
    if (modalNoteBtnClear) {
      modalNoteBtnClear.style.display = currentNote.trim() ? 'inline-flex' : 'none';
    }
    modalNote.classList.add('active');
    modalNote.setAttribute('aria-hidden', 'false');
    // Do not auto-focus on modal open so the mobile virtual keyboard does not automatically pop up
    if (inputTestNote) {
      inputTestNote.selectionStart = inputTestNote.selectionEnd = inputTestNote.value.length;
    }
  }

  function closeNoteModal() {
    if (!modalNote) return;
    modalNote.classList.remove('active');
    modalNote.setAttribute('aria-hidden', 'true');
  }

  function updateNoteCharCount() {
    if (!inputTestNote || !noteCharCount) return;
    const len = inputTestNote.value.length;
    noteCharCount.textContent = `${len} / 200`;
    noteCharCount.classList.remove('warning', 'danger');
    if (len >= 200) {
      noteCharCount.classList.add('danger');
    } else if (len >= 180) {
      noteCharCount.classList.add('warning');
    }
    if (modalNoteBtnClear) {
      modalNoteBtnClear.style.display = inputTestNote.value.trim() ? 'inline-flex' : 'none';
    }
  }

  function saveNoteFromModal() {
    if (inputTestNote) {
      state.testNote = inputTestNote.value.slice(0, 200).trim();
    }
    updatePretestNoteButton();
    closeNoteModal();
  }

  function clearNote() {
    if (inputTestNote) {
      inputTestNote.value = '';
      updateNoteCharCount();
    }
    state.testNote = '';
    updatePretestNoteButton();
    closeNoteModal();
  }

  if (btnPretestNote) {
    btnPretestNote.addEventListener('click', openNoteModal);
  }

  if (modalNoteBtnSave) {
    modalNoteBtnSave.addEventListener('click', saveNoteFromModal);
  }

  if (modalNoteBtnCancel) {
    modalNoteBtnCancel.addEventListener('click', closeNoteModal);
  }

  if (modalNoteBtnClear) {
    modalNoteBtnClear.addEventListener('click', clearNote);
  }

  if (inputTestNote) {
    inputTestNote.addEventListener('input', updateNoteCharCount);
    inputTestNote.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        saveNoteFromModal();
      }
    });
  }

  if (modalNote) {
    modalNote.addEventListener('click', (e) => {
      if (e.target === modalNote) {
        closeNoteModal();
      }
    });
  }

  // --- Modal: Szondi Test Instruction Dialog ---
  const btnSzondiGuide = document.getElementById('btn-szondi-guide');
  const modalSzondiInstruction = document.getElementById('modal-szondi-instruction');
  const modalBtnSzondiClose = document.getElementById('modal-btn-szondi-close');

  if (btnSzondiGuide && modalSzondiInstruction) {
    btnSzondiGuide.addEventListener('click', () => {
      modalSzondiInstruction.classList.add('active');
      modalSzondiInstruction.setAttribute('aria-hidden', 'false');
    });
  }
  if (modalBtnSzondiClose && modalSzondiInstruction) {
    modalBtnSzondiClose.addEventListener('click', () => {
      modalSzondiInstruction.classList.remove('active');
      modalSzondiInstruction.setAttribute('aria-hidden', 'true');
    });
  }
  if (modalSzondiInstruction) {
    modalSzondiInstruction.addEventListener('click', (e) => {
      if (e.target === modalSzondiInstruction) {
        modalSzondiInstruction.classList.remove('active');
        modalSzondiInstruction.setAttribute('aria-hidden', 'true');
      }
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (modalNote && modalNote.classList.contains('active')) {
        closeNoteModal();
      } else if (modalConfirm && modalConfirm.classList.contains('active')) {
        closeConfirmModal();
      } else if (modalSzondiInstruction && modalSzondiInstruction.classList.contains('active')) {
        modalSzondiInstruction.classList.remove('active');
        modalSzondiInstruction.setAttribute('aria-hidden', 'true');
      }
    }
  });

  if (btnClearHistory) {
    btnClearHistory.addEventListener('click', () => {
      showConfirmModal({
        title: 'Очистить всю историю?',
        message: 'Вы действительно хотите удалить <strong>всю историю тестирований</strong>? Все сохраненные результаты будут безвозвратно удалены.',
        confirmText: 'Очистить всё',
        onConfirm: () => {
          saveHistoryList([]);
          renderHistoryScreen();
        }
      });
    });
  }

  function resetModalScroll(modal) {
    if (!modal) return;
    modal.scrollTop = 0;
    const card = modal.querySelector('.modal-card');
    if (card) card.scrollTop = 0;
  }

  function setFullscreenEditor(modal, isFullscreen) {
    if (!modal) return;
    modal.classList.toggle('editor-fullscreen', Boolean(isFullscreen));
    document.body.classList.toggle('fullscreen-editor-open', Boolean(isFullscreen));
    if (isFullscreen) resetModalScroll(modal);
  }

  function closeModalInstant(modal) {
    if (!modal) return;
    modal.classList.add('modal-instant-close');
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => modal.classList.remove('modal-instant-close'));
    });
  }

  function closeFullscreenModal(modal) {
    if (!modal) return;
    // Hide instantly, before removing the full-screen layout. Otherwise the
    // normal centered modal is briefly visible during the opacity transition.
    modal.classList.add('modal-instant-close');
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    setFullscreenEditor(modal, false);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => modal.classList.remove('modal-instant-close'));
    });
  }

  let pageReturnNav = null;

  function setPageFullscreen(modal, isPage) {
    if (!modal) return;
    if (isPage && pageReturnNav === null) {
      pageReturnNav = document.querySelector('.nav-tab-item.active');
    }
    modal.classList.toggle('page-fullscreen', Boolean(isPage));
    document.body.classList.toggle('page-fullscreen-open', Boolean(isPage));
    if (isPage) resetModalScroll(modal);
  }

  function restorePageNav() {
    if (pageReturnNav && document.body.contains(pageReturnNav)) {
      document.querySelectorAll('.nav-tab-item').forEach(tab => {
        tab.classList.toggle('active', tab === pageReturnNav);
      });
    }
    pageReturnNav = null;
  }

  function setNavPageActive(buttonId) {
    document.querySelectorAll('.nav-tab-item').forEach(tab => {
      tab.classList.toggle('active', tab.id === buttonId);
    });
  }

  function showScreen(screen) {
    [screenHub, screenWelcome, screenTest, screenResults, screenHistory, screenBreathing, screenGrounding, screenCoping, screenThoughts, screenTracker, screenDiary, screenWhitenoise, screenUpcoming, screenAuthor].forEach(s => {
      if (s) s.classList.remove('active');
    });
    if (screen) screen.classList.add('active');
    try { window.scrollTo(0, 0); } catch (e) {}

    if (screen === screenTest) {
      document.body.classList.add('in-test-mode');
    } else {
      document.body.classList.remove('in-test-mode');
    }

    if (screen === screenHub) {
      updateNavTabs('hub');
    } else if (screen === screenWelcome || screen === screenTest || screen === screenResults || screen === screenHistory) {
      updateNavTabs('szondi');
    } else if (screen === screenBreathing) {
      updateNavTabs('breathing');
    } else if (screen === screenGrounding) {
      updateNavTabs('grounding');
    } else if (screen === screenCoping) {
      updateNavTabs('coping');
    } else if (screen === screenThoughts) {
      updateNavTabs('thoughts');
    } else if (screen === screenTracker) {
      updateNavTabs('mood-tracker');
    } else if (screen === screenDiary) {
      updateNavTabs('diary');
    } else if (screen === screenWhitenoise) {
      updateNavTabs('whitenoise');
    } else if (screen === screenAuthor) {
      updateNavTabs(null);
    }

    window.scrollTo(0, 0);
  }

  function startTest() {
    state.isTestRun = cbTestMode ? cbTestMode.checked : false;
    state.exploreSecondPlan = cbSecondPlan ? cbSecondPlan.checked : true;
    state.stage = 'first';
    state.currentSeriesIndex = 0;
    state.currentPhase = 'pleasant';
    state.currentSelections = { pleasant: [], unpleasant: [] };
    state.firstPlanHistory = [];
    state.secondPlanSeries = [];
    state.secondPlanHistory = [];
    resetScores();
    showScreen(screenTest);
    renderCurrentSeries();
  }

  function resetScores() {
    Object.keys(state.scores).forEach(k => {
      state.scores[k] = 0;
      state.firstPlanScores[k] = 0;
      state.secondPlanScores[k] = 0;
    });
  }

  function resetTest() {
    state.testNote = '';
    updatePretestNoteButton();
    showScreen(screenWelcome);
  }

  function showToast(title, text) {
    let toast = document.querySelector('.series-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'series-toast';
      document.body.appendChild(toast);
    }
    toast.innerHTML = `
      <div style="font-size: 28px; margin-bottom: 6px;">✨</div>
      <h3>${title}</h3>
      <p>${text}</p>
    `;
    toast.classList.add('active');
    setTimeout(() => {
      toast.classList.remove('active');
    }, 2500);
  }

  // --- Render Series (In-Place DOM Mutation: Zero Blank Frames) ---
  function renderCurrentSeries() {
    initPortraitsGrid();
    const portraits = getCurrentPortraitsList();
    if (!portraits || portraits.length === 0) return;

    state.currentPhase = 'pleasant';
    state.currentSelections = { pleasant: [], unpleasant: [] };

    // Update Topbar with responsive full/short spans
    if (stageBadge) {
      if (state.stage === 'first') {
        stageBadge.innerHTML = '<span class="stage-full">Этап 1: Первый план</span><span class="stage-short">1 план</span>';
        stageBadge.className = 'stage-pill';
      } else {
        stageBadge.innerHTML = '<span class="stage-full">Этап 2: Второй план</span><span class="stage-short">2 план</span>';
        stageBadge.className = 'stage-pill stage-second';
      }
    }

    const seriesNum = state.currentSeriesIndex + 1;
    seriesLabel.innerHTML = `<span class="series-full">Серия ${seriesNum} из 6</span><span class="series-short">${seriesNum} / 6</span>`;
    seriesPills.forEach((pill, idx) => {
      pill.classList.remove('active', 'completed');
      if (idx < state.currentSeriesIndex) {
        pill.classList.add('completed');
      } else if (idx === state.currentSeriesIndex) {
        pill.classList.add('active');
      }
    });

    if (state.stage === 'first') {
      portraitsGrid.classList.remove('second-plan');
      // All 8 cards visible (4 columns x 2 rows)
      for (let idx = 0; idx < 8; idx++) {
        const slot = portraitsGrid.children[idx];
        const card = persistentCards[idx];
        if (slot) slot.style.display = '';
        const portrait = portraits[idx];
        if (portrait && card) {
          const img = card.querySelector('img');
          img.src = portrait.src;
          img.alt = `Портрет ${portrait.id}`;
          card.dataset.id = portrait.id;
          card.dataset.scale = portrait.scale;
          delete card.dataset.selected;
          card.style.pointerEvents = '';
          card.style.transform = '';
          card.style.borderColor = '';
          card.style.boxShadow = '';
          card.classList.remove('hidden-slot', 'selecting-pleasant', 'selecting-unpleasant');
          const badge = card.querySelector('.portrait-index');
          if (badge) badge.remove();
        }
      }
    } else {
      // Second Plan: EXACTLY 1 ROW OF 4 PORTRAITS!
      portraitsGrid.classList.add('second-plan');
      // Slots 0..3 are the 4 unchosen portraits
      for (let idx = 0; idx < 4; idx++) {
        const slot = portraitsGrid.children[idx];
        const card = persistentCards[idx];
        if (slot) slot.style.display = '';
        const portrait = portraits[idx];
        if (portrait && card) {
          const img = card.querySelector('img');
          img.src = portrait.src;
          img.alt = `Портрет ${portrait.id}`;
          card.dataset.id = portrait.id;
          card.dataset.scale = portrait.scale;
          delete card.dataset.selected;
          card.style.pointerEvents = '';
          card.style.transform = '';
          card.style.borderColor = '';
          card.style.boxShadow = '';
          card.classList.remove('hidden-slot', 'selecting-pleasant', 'selecting-unpleasant');
          const badge = card.querySelector('.portrait-index');
          if (badge) badge.remove();
        }
      }
      // Hide slots 4..7
      for (let idx = 4; idx < 8; idx++) {
        const slot = portraitsGrid.children[idx];
        if (slot) slot.style.display = 'none';
      }
    }

    updatePhaseUI();
  }

  function updatePhaseUI() {
    const isPleasant = state.currentPhase === 'pleasant';

    // Ambient illumination on the entire screen
    screenTest.classList.remove('phase-pleasant', 'phase-unpleasant');
    screenTest.classList.add(isPleasant ? 'phase-pleasant' : 'phase-unpleasant');

    if (phasePill) {
      phasePill.className = `phase-pill ${isPleasant ? 'phase-pleasant' : 'phase-unpleasant'}`;
    }
    if (phaseIcon) {
      phaseIcon.textContent = isPleasant ? '+' : '−';
    }
    if (phaseLabel) {
      phaseLabel.textContent = isPleasant ? 'Приятные' : 'Неприятные';
    }
    if (phaseCounter) {
      const count = isPleasant ? state.currentSelections.pleasant.length : state.currentSelections.unpleasant.length;
      phaseCounter.textContent = `${count} / 2`;
    }
  }

  // --- Portrait Click Handler (Instant Snappy Response, Zero Delay) ---
  function onPortraitClick(portrait, cardElement) {
    // Prevent double clicking on the same card
    if (cardElement.dataset.selected === 'true' || cardElement.classList.contains('hidden-slot')) return;

    // Immediately lock this card synchronously
    cardElement.dataset.selected = 'true';
    cardElement.style.pointerEvents = 'none';

    // --- Stage 2: Second Plan (4 portraits) ---
    // User chooses only the 2 most pleasant portraits; the remaining 2 are automatically recorded as unpleasant!
    if (state.stage === 'second') {
      if (state.currentSelections.pleasant.length >= 2) return;

      cardElement.classList.add('selecting-pleasant', 'hidden-slot');
      state.currentSelections.pleasant.push({
        ...portrait,
        cardElement: cardElement
      });

      updatePhaseUI();

      if (state.currentSelections.pleasant.length === 2) {
        // Automatically determine the remaining 2 portraits in this series
        const currentPortraits = getCurrentPortraitsList();
        const pleasantIds = new Set(state.currentSelections.pleasant.map(p => p.id));
        const remainingPortraits = currentPortraits.filter(p => !pleasantIds.has(p.id));

        state.currentSelections.unpleasant = remainingPortraits.map(p => ({
          ...p
        }));

        completeCurrentSeries();
      }
      return;
    }

    // --- Stage 1: First Plan (8 portraits) ---
    if (state.currentPhase === 'pleasant') {
      if (state.currentSelections.pleasant.length >= 2) return;

      cardElement.classList.add('selecting-pleasant', 'hidden-slot');
      state.currentSelections.pleasant.push({
        ...portrait,
        cardElement: cardElement
      });

      // Check if pleasant phase complete
      if (state.currentSelections.pleasant.length === 2) {
        state.currentPhase = 'unpleasant';
      }
      updatePhaseUI();

    } else if (state.currentPhase === 'unpleasant') {
      if (state.currentSelections.unpleasant.length >= 2) return;

      cardElement.classList.add('selecting-unpleasant', 'hidden-slot');
      state.currentSelections.unpleasant.push({
        ...portrait,
        cardElement: cardElement
      });

      updatePhaseUI();

      if (state.currentSelections.unpleasant.length === 2) {
        // Series complete! Advance immediately
        completeCurrentSeries();
      }
    }
  }

  // --- Complete Series & Advance ---
  function completeCurrentSeries() {
    const seriesNumber = state.currentSeriesIndex + 1;

    if (state.stage === 'first') {
      const fullSeries = SZONDI_SERIES[state.currentSeriesIndex].portraits;
      const pleasantIds = new Set(state.currentSelections.pleasant.map(p => p.id));
      const unpleasantIds = new Set(state.currentSelections.unpleasant.map(p => p.id));

      // The 4 unchosen portraits for this series
      const unchosen = fullSeries.filter(p => !pleasantIds.has(p.id) && !unpleasantIds.has(p.id));
      // Sort in natural order by file name (e.g. p11, p13, p15, p17) as requested!
      unchosen.sort((a, b) => a.file.localeCompare(b.file, undefined, { numeric: true }));

      state.firstPlanHistory.push({
        seriesNumber: seriesNumber,
        pleasant: [...state.currentSelections.pleasant],
        unpleasant: [...state.currentSelections.unpleasant],
        unchosen: unchosen
      });

      state.secondPlanSeries[state.currentSeriesIndex] = unchosen;

      if (state.currentSeriesIndex < 5) {
        state.currentSeriesIndex++;
        renderCurrentSeries();
      } else {
        // First Plan (all 6 series) completed!
        if (state.exploreSecondPlan) {
          // Transition to Stage 2: Second Plan (6 series of 4 unchosen portraits in 1 row)
          state.stage = 'second';
          state.currentSeriesIndex = 0;
          showToast('Этап 2: Второй план', 'Перед вами 4 портрета, не выбранных на первом этапе. Выберите 2 наиболее приятных лица (оставшиеся 2 запишутся как неприятные).');
          renderCurrentSeries();
        } else {
          // Second Plan is disabled: finish test immediately after Stage 1!
          calculateAndRenderResults();
        }
      }
    } else {
      // Stage 2: Second Plan series completion
      state.secondPlanHistory.push({
        seriesNumber: seriesNumber,
        pleasant: [...state.currentSelections.pleasant],
        unpleasant: [...state.currentSelections.unpleasant]
      });

      if (state.currentSeriesIndex < 5) {
        state.currentSeriesIndex++;
        renderCurrentSeries();
      } else {
        // Both Stages completed! Proceed directly to results!
        calculateAndRenderResults();
      }
    }
  }

  // --- Calculate Results ---
  function calculateAndRenderResults() {
    resetScores();

    // 1. Calculate First Plan scores
    state.firstPlanHistory.forEach(item => {
      item.pleasant.forEach(p => {
        state.firstPlanScores[`${p.scale}+`]++;
        state.scores[`${p.scale}+`]++;
      });
      item.unpleasant.forEach(p => {
        state.firstPlanScores[`${p.scale}-`]++;
        state.scores[`${p.scale}-`]++;
      });
    });

    // 2. Calculate Second Plan scores
    state.secondPlanHistory.forEach(item => {
      item.pleasant.forEach(p => {
        state.secondPlanScores[`${p.scale}+`]++;
      });
      item.unpleasant.forEach(p => {
        state.secondPlanScores[`${p.scale}-`]++;
      });
    });

    // Render results components
    const dateFormatted = new Date().toLocaleDateString('ru-RU', { 
      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' 
    });

    if (state.isTestRun) {
      resultsDate.innerHTML = `
        <div>Дата прохождения: ${dateFormatted}</div>
        <div><span class="test-mode-results-badge">⚠️ Тестовое прохождение — результаты не сохранены в историю</span></div>
      `;
    } else {
      resultsDate.textContent = `Дата прохождения: ${dateFormatted}`;
      // Automatically save completed test to history
      saveTestToHistory(state.firstPlanScores, state.secondPlanScores);
    }

    if (resultsNoteCard && resultsNoteText) {
      if (state.testNote) {
        resultsNoteText.textContent = state.testNote;
        resultsNoteCard.style.display = 'inline-flex';
      } else {
        resultsNoteCard.style.display = 'none';
      }
    }

    // Render Scheme 1 (First Plan)
    generateSzondiSvg(state.firstPlanScores, 'szondi-chart-svg', 'Схема профиля - первый план', '#2F4A3B');

    // Show or hide Scheme 2 (Second Plan)
    const chartCardSecond = document.getElementById('chart-card-second-plan');
    if (chartCardSecond) {
      chartCardSecond.style.display = state.exploreSecondPlan ? 'block' : 'none';
    }
    if (state.exploreSecondPlan) {
      generateSzondiSvg(state.secondPlanScores, 'szondi-chart-svg-second', 'Схема профиля - второй план', '#8C7B68');
    }

    render16ScalesGrid();
    renderSondiBrief();
    // renderSobchikInterpretation();
    // renderSzondiClassicalInterpretation();
    // renderFateAnalysis();

    // Reset to first tab (Schemes)
    const firstTabBtn = document.querySelector('.results-tab-btn[data-tab="tab-schemes"]');
    if (firstTabBtn) firstTabBtn.click();

    showScreen(screenResults);
  }

  // --- Classical Szondi SVG Chart Generator for Both Schemes ---
  function generateSzondiSvg(scoresObj, containerId, planTitle, themeColor) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const factorList = ['h', 's', 'e', 'hy', 'k', 'p', 'd', 'm'];
    const vectorGroups = [
      { name: 'Вектор S (Либидо)', factors: ['h', 's'], color: '#2F4A3B', fill: 'rgba(47, 74, 59, 0.15)', stroke: 'rgba(47, 74, 59, 0.45)' },
      { name: 'Вектор P (Аффект)', factors: ['e', 'hy'], color: '#A87E75', fill: 'rgba(168, 126, 117, 0.15)', stroke: 'rgba(168, 126, 117, 0.45)' },
      { name: 'Вектор Sch (Эго)', factors: ['k', 'p'], color: '#8C7B68', fill: 'rgb(185, 171, 203, 0.15)', stroke: 'rgb(185, 171, 203, 0.45)' },
      { name: 'Вектор C (Контакт)', factors: ['d', 'm'], color: '#B0895A', fill: 'rgba(176, 137, 90, 0.15)', stroke: 'rgba(176, 137, 90, 0.45)' }
    ];

    const svgWidth = 840;
    const svgHeight = 440;
    const margin = { top: 50, bottom: 90, left: 60, right: 30 };
    const chartW = svgWidth - margin.left - margin.right;
    const chartH = svgHeight - margin.top - margin.bottom;

    const zeroY = margin.top + chartH / 2; // Baseline Y at score 0
    const maxScore = 6;
    const scaleY = (chartH / 2) / maxScore; // Pixels per score unit

    let svgHtml = `
      <svg viewBox="0 0 ${svgWidth} ${svgHeight}" class="szondi-svg" style="width: 100%; height: auto; font-family: inherit;">
        <defs>
          <linearGradient id="barPleasantGrad_${containerId}" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stop-color="#6F927B" />
            <stop offset="100%" stop-color="#6F927B" />
          </linearGradient>
          <linearGradient id="barUnpleasantGrad_${containerId}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#B5725F" />
            <stop offset="100%" stop-color="#C98A78" />
          </linearGradient>
        </defs>
    `;

    // Background horizontal grid lines (-6 to +6)
    for (let s = -maxScore; s <= maxScore; s++) {
      const y = zeroY - s * scaleY;
      const isZero = s === 0;
      svgHtml += `
        <line x1="${margin.left}" y1="${y}" x2="${margin.left + chartW}" y2="${y}" 
              stroke="${isZero ? themeColor : 'rgba(37, 53, 44, 0.07)'}" 
              stroke-width="${isZero ? '2' : '1'}" 
              stroke-dasharray="${isZero ? 'none' : '3,3'}" />
        <text x="${margin.left - 12}" y="${y + 4}" 
              fill="${isZero ? themeColor : '#7A857B'}" 
              font-size="11" font-weight="${isZero ? '700' : '500'}" 
              text-anchor="end">${s > 0 ? '+' + s : s}</text>
      `;
    }

    // Vector group headers and vertical separators
    const colWidth = chartW / 8;
    vectorGroups.forEach((vg, vIdx) => {
      const startX = margin.left + vIdx * 2 * colWidth;
      const width = colWidth * 2;
      const midX = startX + width / 2;

      // Group bracket / label at top
      svgHtml += `
        <rect x="${startX + 4}" y="${margin.top - 38}" width="${width - 8}" height="24" 
              rx="4" fill="${vg.fill}" stroke="${vg.stroke}" stroke-width="1" />
        <text x="${midX}" y="${margin.top - 22}" fill="${vg.color}" 
              font-size="11" font-weight="700" text-anchor="middle">${vg.name}</text>
      `;

      // Vertical separator line
      if (vIdx > 0) {
        svgHtml += `
          <line x1="${startX}" y1="${margin.top - 40}" x2="${startX}" y2="${zeroY + chartH / 2 + 10}" 
                stroke="rgba(37, 53, 44, 0.15)" stroke-width="1.5" />
        `;
      }
    });

    // Bars for each of the 8 factors
    const barWidth = colWidth * 0.54;

    factorList.forEach((factor, idx) => {
      const plusVal = scoresObj[`${factor}+`] || 0;
      const minusVal = scoresObj[`${factor}-`] || 0;
      const reaction = evaluateSzondiReaction(plusVal, minusVal);

      const colCenterX = margin.left + idx * colWidth + colWidth / 2;
      const barX = colCenterX - barWidth / 2;

      // Positive bar (upwards from zeroY)
      if (plusVal > 0) {
        const barH = plusVal * scaleY;
        const barY = zeroY - barH;
        svgHtml += `
          <rect x="${barX}" y="${barY}" width="${barWidth}" height="${barH}" 
                rx="4" fill="url(#barPleasantGrad_${containerId})" />
          <text x="${colCenterX}" y="${barY - 6}" fill="#6F927B" 
                font-size="12" font-weight="700" text-anchor="middle">+${plusVal}</text>
        `;
      }

      // Negative bar (downwards from zeroY)
      if (minusVal > 0) {
        const barH = minusVal * scaleY;
        const barY = zeroY;
        svgHtml += `
          <rect x="${barX}" y="${barY}" width="${barWidth}" height="${barH}" 
                rx="4" fill="url(#barUnpleasantGrad_${containerId})" />
          <text x="${colCenterX}" y="${barY + barH + 15}" fill="#C98A78" 
                font-size="12" font-weight="700" text-anchor="middle">-${minusVal}</text>
        `;
      }

      // Factor Name Label below the chart
      const labelY = zeroY + chartH / 2 + 34;
      svgHtml += `
        <text x="${colCenterX}" y="${labelY}" fill="#25352C" 
              font-size="16" font-weight="800" text-anchor="middle">${factor}</text>
      `;

      // Reaction symbol badge (e.g. +, -, ±, 0)
      const badgeY = labelY + 12;
      let badgeBg = 'rgba(37, 53, 44, 0.08)';
      let badgeColor = '#667267';
      let badgeBorder = 'rgba(172, 168, 160, 0.3)';
      if (reaction.type === '+') {
        badgeBg = 'rgba(111, 146, 123, 0.2)';
        badgeColor = '#6F927B';
        badgeBorder = 'rgba(111, 146, 123, 0.4)';
      } else if (reaction.type === '-') {
        badgeBg = 'rgba(181, 114, 95, 0.2)';
        badgeColor = '#C98A78';
        badgeBorder = 'rgb(210, 167, 156, 0.4)';
      } else if (reaction.type === '+-') {
        badgeBg = 'rgba(140, 123, 104, 0.2)';
        badgeColor = '#8C7B68';
        badgeBorder = 'rgba(197, 184, 201, 0.4)';
      }

      svgHtml += `
        <rect x="${colCenterX - 18}" y="${badgeY}" width="36" height="22" 
              rx="6" fill="${badgeBg}" stroke="${badgeBorder}" stroke-width="1" />
        <text x="${colCenterX}" y="${badgeY + 15}" fill="${badgeColor}" 
              font-size="12" font-weight="800" text-anchor="middle">${reaction.symbol}</text>
      `;
    });

    svgHtml += `</svg>`;
    container.innerHTML = svgHtml;
  }

  // --- Render Structured Results Table (HTML) below charts - REMOVED per user requirement ---
  function renderHtmlResultsTable(scoresObj, containerId, planThemeColor) {
    const container = document.getElementById(containerId);
    if (container) container.innerHTML = '';
  }

  // --- 1. Render Diagnostic Scales (Filtered: 1st Plan >= 3, 2nd Plan >= 4) ---
  // In order: 1st Plan (descending 6 -> 3), then 2nd Plan in separate section (descending 6 -> 4)
  function renderSondiBrief() {
    const container = document.getElementById('sondi-brief-content');
    if (!container) return;
    if (typeof SzondiITOPavlov === 'undefined') {
      container.innerHTML = '<p class="sondi-brief-placeholder">Краткая интерпретация недоступна.</p>';
      return;
    }
    const p2 = state.exploreSecondPlan ? state.secondPlanScores : {};
    let result;
    try {
      result = SzondiITOPavlov.analyze(state.firstPlanScores, p2, { COMBINE_MODE: 'max' });
    } catch (err) {
      console.error('Sondi brief error:', err);
      container.innerHTML = '<p class="sondi-brief-placeholder">Не удалось построить краткую интерпретацию.</p>';
      return;
    }

    const cleanText = (value) => String(value || '')
      .replace(/Это не оценка реальных людей и не диагноз\.?/gi, '')
      .replace(/осторожные формулировки/gi, '')
      .replace(/\s*По формальным критериям источника тип ВНД[^.]*\./gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    const summary = cleanText(result.text && result.text.summary);
    const lines = (result.text && result.text.scaleLines ? result.text.scaleLines : [])
      .map(line => cleanText(String(line).replace(/^•\s*/, '')))
      .filter(Boolean);
    const leading = (result.leading && Array.isArray(result.leading.leading)) ? result.leading.leading : [];
    const leadingLines = lines.slice(0, leading.length);
    const extraLines = lines.slice(leading.length);
    const celebData = window.SZONDI_CELEBRITIES || {};

    function celebritiesFor(pole, key) {
      const data = celebData[pole] || {};
      const names = Array.isArray(data[key]) ? data[key] : [];
      if (!names.length) return '';
      const label = key === 'people' ? 'Известные личности' : 'Персонажи';
      return `<div class="sondi-tendency-celeb"><strong>${label}:</strong> ${names.map(escapeHtml).join(', ')}</div>`;
    }

    function scaleLabel(item) {
      const pole = item && item.pole ? item.pole : '';
      const text = SzondiITOPavlov.POLE_TEXT && SzondiITOPavlov.POLE_TEXT[pole]
        ? SzondiITOPavlov.POLE_TEXT[pole].label
        : pole;
      return text ? `(${text})` : '';
    }

    let html = '';

    if (leading.length > 1) {
      html += '<p class="sondi-brief-notice">Было выявлено более 1 ведущей тенденции характера, шкалы в автоматической интерпретации описаны по отдельности. Для комплексного анализа рекомендуем выгрузить результаты в нейросеть, или показать их психологу</p>';
      leading.forEach((item, index) => {
        const poleInfo = SzondiITOPavlov.POLE_TEXT && SzondiITOPavlov.POLE_TEXT[item.pole];
        const sentence = leadingLines[index] || cleanText(poleInfo && poleInfo.sentence);
        html += `<article class="sondi-tendency">
          <div class="sondi-tendency-scale">${escapeHtml(scaleLabel(item))}</div>
          ${sentence ? `<p class="sondi-tendency-text">${escapeHtml(sentence)}</p>` : ''}
          ${celebritiesFor(item.pole, 'people')}
          ${celebritiesFor(item.pole, 'characters')}
        </article>`;
      });
      if (extraLines.length) {
        html += '<h4 class="sondi-brief-subtitle">Дополнительно</h4><ul class="sondi-brief-list">' +
          extraLines.map(line => `<li>${escapeHtml(line)}</li>`).join('') + '</ul>';
      }
    } else {
      if (summary) html += `<p class="sondi-brief-summary">${escapeHtml(summary)}</p>`;
      if (lines.length) {
        html += '<h4 class="sondi-brief-subtitle">Ведущие тенденции</h4><ul class="sondi-brief-list">' +
          lines.map(line => `<li>${escapeHtml(line)}</li>`).join('') + '</ul>';
      }
      let celebPoles = leading.map(item => item.pole);
      if (!celebPoles.length && result.selection) {
        if (result.selection.weak && result.selection.weak.length) celebPoles = result.selection.weak.slice(0, 1);
        else if (result.selection.background && result.selection.background.length) celebPoles = result.selection.background.slice(0, 1);
      }
      const celebItems = celebPoles.map(pole => celebData[pole]).filter(Boolean);
      if (celebItems.length) {
        const collect = (key) => {
          const seen = new Set();
          const out = [];
          celebItems.forEach(item => (item[key] || []).forEach(name => {
            if (!seen.has(name)) { seen.add(name); out.push(name); }
          }));
          return out;
        };
        const people = collect('people');
        const characters = collect('characters');
        if (people.length) {
          html += '<h4 class="sondi-brief-subtitle">Известные личности</h4><ul class="sondi-brief-list sondi-brief-people">' +
            people.map(name => `<li>${escapeHtml(name)}</li>`).join('') + '</ul>';
        }
        if (characters.length) {
          html += '<h4 class="sondi-brief-subtitle">Персонажи</h4><ul class="sondi-brief-list sondi-brief-people">' +
            characters.map(name => `<li>${escapeHtml(name)}</li>`).join('') + '</ul>';
        }
      }
    }

    if (!html) {
      html = '<p class="sondi-brief-placeholder">Недостаточно выраженных тенденций для краткого описания.</p>';
    }
    container.innerHTML = html;
  }

  function render16ScalesGrid() {
    if (!scalesGrid) return;
    scalesGrid.innerHTML = '';
    const factorKeys = ['h', 's', 'e', 'hy', 'k', 'p', 'd', 'm'];
    const p1Scales = [];
    const p2Scales = [];

    factorKeys.forEach(f => {
      const factorDef = SZONDI_FACTORS[f];
      const p1Plus = state.firstPlanScores[`${f}+`] || 0;
      const p2Plus = state.secondPlanScores[`${f}+`] || 0;
      const p1Minus = state.firstPlanScores[`${f}-`] || 0;
      const p2Minus = state.secondPlanScores[`${f}-`] || 0;

      // First Plan: threshold >= 3
      if (p1Plus >= 3) {
        p1Scales.push({ poleDef: factorDef.plus, score1: p1Plus, score2: p2Plus, isPleasant: true, rankScore: p1Plus });
      }
      if (p1Minus >= 3) {
        p1Scales.push({ poleDef: factorDef.minus, score1: p1Minus, score2: p2Minus, isPleasant: false, rankScore: p1Minus });
      }

      // Second Plan: threshold >= 4 ONLY (do NOT consider 3 points or less per requirement 5)
      if (state.exploreSecondPlan) {
        if (p2Plus >= 4) {
          p2Scales.push({ poleDef: factorDef.plus, score1: p1Plus, score2: p2Plus, isPleasant: true, rankScore: p2Plus });
        }
        if (p2Minus >= 4) {
          p2Scales.push({ poleDef: factorDef.minus, score1: p1Minus, score2: p2Minus, isPleasant: false, rankScore: p2Minus });
        }
      }
    });

    // Sort descending by score:
    // First Plan: 6 -> 3
    p1Scales.sort((a, b) => b.rankScore - a.rankScore);
    // Second Plan: 6 -> 4
    p2Scales.sort((a, b) => b.rankScore - a.rankScore);

    if (p1Scales.length === 0 && (!state.exploreSecondPlan || p2Scales.length === 0)) {
      scalesGrid.innerHTML = `
        <div class="threshold-alert-card" style="grid-column: 1 / -1;">
          <h4>Все показатели ниже диагностического порога</h4>
          <p>На первом плане ни одна из шкал не набрала 3 и более баллов, а на втором плане не выявлено шкал от 4 баллов. Согласно заданным правилам анализа, шкалы с низкими показателями исключаются из рассмотрения как не имеющие диагностической выраженности.</p>
        </div>
      `;
      return;
    }

    // 1. First Plan Section (>= 3 points)
    const header1 = document.createElement('div');
    header1.style.cssText = 'grid-column: 1 / -1; display: flex; align-items: center; justify-content: space-between; padding: 12px 18px; background: rgba(47, 74, 59, 0.1); border-left: 4px solid #2F4A3B; border-radius: 8px; margin-top: 10px;';
    header1.innerHTML = `
      <div>
        <strong style="color: #2F4A3B; font-size: 14px; display: block;">🔷 Первый план: Выраженные шкалы (порог: от 3 баллов, ранжированы: 6 → 3)</strong>
        <span style="font-size: 11px; color: var(--text-muted);">Актуальные манифестные влечения личности</span>
      </div>
      <span style="font-size: 12px; color: #2F4A3B; font-weight: 700; background: rgba(47, 74, 59, 0.2); padding: 3px 10px; border-radius: 12px;">${p1Scales.length} шкал(ы)</span>
    `;
    scalesGrid.appendChild(header1);

    if (p1Scales.length > 0) {
      p1Scales.forEach(item => {
        const card = createComparativeScaleCard(item.poleDef, item.score1, item.score2, item.isPleasant);
        scalesGrid.appendChild(card);
      });
    } else {
      const emptyNote1 = document.createElement('div');
      emptyNote1.style.cssText = 'grid-column: 1 / -1; padding: 12px 16px; color: var(--text-muted); font-style: italic;';
      emptyNote1.textContent = 'На первом плане не выявлено шкал с показателем ≥ 3 баллов.';
      scalesGrid.appendChild(emptyNote1);
    }

    // 2. Second Plan Section in separate dedicated block ("отдельная графа", >= 4 points only)
    if (state.exploreSecondPlan) {
      const header2 = document.createElement('div');
      header2.style.cssText = 'grid-column: 1 / -1; display: flex; align-items: center; justify-content: space-between; padding: 12px 18px; background: rgba(140, 123, 104, 0.12); border-left: 4px solid #8C7B68; border-radius: 8px; margin-top: 28px; margin-bottom: 8px;';
      header2.innerHTML = `
        <div>
          <strong style="color: #8C7B68; font-size: 14px; display: block;">🔮 Второй план: Фоновые выраженные шкалы (порог: от 4 баллов, ранжированы: 6 → 4)</strong>
          <span style="font-size: 11px; color: var(--text-muted);">Показатели до 3 баллов включительно на втором плане исключены из анализа</span>
        </div>
        <span style="font-size: 12px; color: #8C7B68; font-weight: 700; background: rgba(140, 123, 104, 0.2); padding: 3px 10px; border-radius: 12px;">${p2Scales.length} шкал(ы)</span>
      `;
      scalesGrid.appendChild(header2);

      if (p2Scales.length > 0) {
        p2Scales.forEach(item => {
          const card = createComparativeScaleCard(item.poleDef, item.score1, item.score2, item.isPleasant);
          scalesGrid.appendChild(card);
        });
      } else {
        const emptyNote2 = document.createElement('div');
        emptyNote2.style.cssText = 'grid-column: 1 / -1; padding: 14px 18px; background: rgba(37, 53, 44, 0.03); border: 1px dashed rgba(140, 123, 104, 0.3); border-radius: 8px; color: var(--text-muted); font-size: 13px; line-height: 1.5;';
        emptyNote2.innerHTML = `<em>На втором плане не выявлено шкал, достигших диагностического порога (≥ 4 баллов). Показатели от 0 до 3 баллов на втором плане не учитываются в диагностическом анализе как фоновые флуктуации.</em>`;
        scalesGrid.appendChild(emptyNote2);
      }
    }
  }

  function createComparativeScaleCard(poleDef, score1, score2, isPleasant) {
    const card = document.createElement('div');
    card.className = `scale-card ${isPleasant ? 'is-pleasant' : 'is-unpleasant'}`;
    const pct1 = Math.round((score1 / 6) * 100);
    const pct2 = Math.round((score2 / 6) * 100);

    const score2Html = state.exploreSecondPlan
      ? `<div style="font-size: 12px; font-weight: 600; color: #8C7B68;">II план: ${score2} / 6</div>`
      : '';

    const meter2Html = state.exploreSecondPlan
      ? `
        <div style="display: flex; justify-content: space-between; font-size: 10px; color: var(--text-muted); margin-bottom: 2px;">
          <span>Фоновый (II)</span>
          <span>${score2}</span>
        </div>
        <div class="scale-meter" style="height: 5px;">
          <div class="scale-meter-fill" style="width: ${pct2}%; background: #8C7B68;"></div>
        </div>
      `
      : '';

    card.innerHTML = `
      <div class="scale-card-header">
        <span class="scale-code-badge">${poleDef.code}</span>
        <div style="text-align: right;">
          <div style="font-size: 13px; font-weight: 700; color: #2F4A3B;">I план: ${score1} / 6</div>
          ${score2Html}
        </div>
      </div>
      <div class="scale-title">${poleDef.title}</div>
      <!-- scale-desc removed per requirement -->
      <div style="margin-top: 10px;">
        <div style="display: flex; justify-content: space-between; font-size: 10px; color: var(--text-muted); margin-bottom: 2px;">
          <span>Актуальный (I)</span>
          <span>${score1}</span>
        </div>
        <div class="scale-meter" style="height: 5px; margin-bottom: 6px;">
          <div class="scale-meter-fill" style="width: ${pct1}%; background: #2F4A3B;"></div>
        </div>
        ${meter2Html}
      </div>
    `;
    return card;
  }

  // --- 2. Render Sobchik Leading Tendencies (ТВТ) (>= 3 points only) ---
  // In order: First Plan (descending 6 -> 3), then Second Plan (descending 6 -> 3)
  function renderSobchikInterpretation() {
    const container = document.getElementById('sobchik-interpretation-container');
    if (!container) return;
    container.innerHTML = '';

    const poles = [
      'h+', 'h-', 's+', 's-', 'e+', 'e-', 'hy+', 'hy-',
      'k+', 'k-', 'p+', 'p-', 'd+', 'd-', 'm+', 'm-'
    ];

    // 1. First Plan poles (score >= 3), sorted strictly descending
    const p1List = [];
    poles.forEach(code => {
      const p1 = state.firstPlanScores[code] || 0;
      const p2 = state.secondPlanScores[code] || 0;
      if (p1 >= 3) {
        p1List.push({
          code,
          score: p1,
          p1,
          p2,
          isFirstPlan: true,
          data: SOBCHIK_TVT_INTERPRETATIONS ? SOBCHIK_TVT_INTERPRETATIONS[code] : null
        });
      }
    });
    p1List.sort((a, b) => b.score - a.score);

    // 2. Second Plan poles (score >= 4 only per requirement 5), sorted strictly descending
    const p2List = [];
    if (state.exploreSecondPlan) {
      poles.forEach(code => {
        const p1 = state.firstPlanScores[code] || 0;
        const p2 = state.secondPlanScores[code] || 0;
        if (p2 >= 4) { // Requirement 5: score >= 4 only!
          p2List.push({
            code,
            score: p2,
            p1,
            p2,
            isFirstPlan: false,
            data: SOBCHIK_TVT_INTERPRETATIONS ? SOBCHIK_TVT_INTERPRETATIONS[code] : null
          });
        }
      });
      p2List.sort((a, b) => b.score - a.score);
    }

    if (p1List.length === 0 && p2List.length === 0) {
      container.innerHTML = `
        <div class="threshold-alert-card">
          <h4>Отсутствуют выраженные ведущие тенденции</h4>
          <p>На первом плане показатели не превысили 3 баллов, а на втором плане не достигли диагностического порога в 4 балла. Согласно правилам интерпретации, сбалансированный профиль без резких пиков отражает гармоничное состояние без акцентуаций.</p>
        </div>
      `;
      return;
    }

    const leadingCodes = p1List.map(item => `${item.code} (${item.score})`);
    const latentCodes = p2List.map(item => `${item.code} (${item.score})`);

    let summaryHtml = `
      <div class="sobchik-card" style="background: rgba(47, 74, 59, 0.08); border-left: 4px solid #2F4A3B; margin-bottom: 24px;">
        <h4 style="color: #25352C; font-size: 16px; margin-bottom: 8px;">Индивидуально-типологический паттерн личности (Л.Н. Собчик)</h4>
        <p style="font-size: 13px; color: var(--text-muted); line-height: 1.6; margin-bottom: 12px;">
          Ведущие тенденции определяют стиль мышления, эмоционального реагирования, межличностного взаимодействия и зоны риска дезадаптации при стрессе.
          ${state.exploreSecondPlan ? 'В соответствии с правилами интерпретации, первыми детально представлены <strong>наиболее выраженные тенденции Первого плана</strong> (от 6 до 3 баллов), а затем в отдельной графе — <strong>фоновые тенденции Второго плана с выраженностью от 4 баллов</strong>.' : 'В соответствии с правилами интерпретации, представлены <strong>наиболее выраженные тенденции Первого плана</strong> (от 6 до 3 баллов).'}
        </p>
        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
          ${leadingCodes.length > 0 ? `<div style="font-size: 12px; background: rgba(47, 74, 59, 0.2); color: #2F4A3B; padding: 4px 10px; border-radius: 6px;"><strong>I план (актуальные, по убыванию):</strong> ${leadingCodes.join(', ')}</div>` : ''}
          ${state.exploreSecondPlan && latentCodes.length > 0 ? `<div style="font-size: 12px; background: rgba(140, 123, 104, 0.2); color: #8C7B68; padding: 4px 10px; border-radius: 6px;"><strong>II план (фоновые от 4 баллов):</strong> ${latentCodes.join(', ')}</div>` : ''}
        </div>
      </div>
    `;

    container.innerHTML = summaryHtml;

    // SECTION 1: FIRST PLAN
    const p1Section = document.createElement('div');
    p1Section.className = 'plan-interpretation-section';
    p1Section.innerHTML = `
      <div class="plan-section-title-box plan-first">
        <div>
          <h3>🔷 Первый план: Актуальные ведущие тенденции (ранжированы по силе: 6 → 3)</h3>
          <p>Осознаваемый поведенческий фасад, текущее психологическое состояние и актуальные способы адаптации.</p>
        </div>
        <span class="plan-badge-pill" style="background: rgba(47, 74, 59, 0.2); color: #2F4A3B;">
          ${p1List.length} ${p1List.length === 1 ? 'тенденция' : (p1List.length < 5 ? 'тенденции' : 'тенденций')}
        </span>
      </div>
    `;

    if (p1List.length === 0) {
      const emptyNote = document.createElement('p');
      emptyNote.style.cssText = 'color: var(--text-muted); font-style: italic; padding: 10px 14px;';
      emptyNote.textContent = 'На первом плане не выявлено тенденций, преодолевших диагностический порог в 3 балла.';
      p1Section.appendChild(emptyNote);
    } else {
      p1List.forEach(item => {
        const card = createSobchikCard(item, true);
        if (card) p1Section.appendChild(card);
      });
    }
    container.appendChild(p1Section);

    // SECTION 2: SECOND PLAN (rendered only when exploreSecondPlan is enabled)
    if (state.exploreSecondPlan) {
      const p2Section = document.createElement('div');
      p2Section.className = 'plan-interpretation-section';
      p2Section.innerHTML = `
        <div class="plan-section-title-box plan-second">
          <div>
            <h3>🔮 Второй план: Фоновые и латентные тенденции (порог: от 4 баллов, ранжированы: 6 → 4)</h3>
            <p>Скрытый бессознательный резерв личности, компенсаторные механизмы и подавляемые мотивы (показатели до 3 баллов исключены).</p>
          </div>
          <span class="plan-badge-pill" style="background: rgba(140, 123, 104, 0.2); color: #8C7B68;">
            ${p2List.length} ${p2List.length === 1 ? 'тенденция' : (p2List.length < 5 ? 'тенденции' : 'тенденций')}
          </span>
        </div>
      `;

      if (p2List.length === 0) {
        const emptyNote = document.createElement('p');
        emptyNote.style.cssText = 'color: var(--text-muted); font-style: italic; padding: 10px 14px;';
        emptyNote.textContent = 'На втором плане не выявлено скрытых тенденций, преодолевших диагностический порог в 4 балла.';
        p2Section.appendChild(emptyNote);
      } else {
        p2List.forEach(item => {
          const card = createSobchikCard(item, false);
          if (card) p2Section.appendChild(card);
        });
      }
      container.appendChild(p2Section);
    }
  }

  function createSobchikCard(item, isFirstPlan) {
    const isPleasant = item.code.endsWith('+');
    const card = document.createElement('div');
    card.className = `sobchik-card ${isPleasant ? 'is-pleasant' : 'is-unpleasant'}`;

    const d = item.data;
    if (!d) return null;

    let scoreBadge = isFirstPlan
      ? `<span class="sobchik-score-badge" style="color: #2F4A3B; font-weight: 700;">I план: ${item.score} / 6 баллов</span>`
      : `<span class="sobchik-score-badge" style="color: #8C7B68; font-weight: 700;">II план (фоновый): ${item.score} / 6 баллов</span>`;

    card.innerHTML = `
      <div class="sobchik-header">
        <div class="sobchik-scale-badge">
          <span class="sobchik-tag">${item.code}</span>
          <span class="sobchik-tendency-title">${d.tendency}</span>
        </div>
        <div>${scoreBadge}</div>
      </div>

      <div class="sobchik-details-grid">
        <div class="sobchik-item">
          <strong>Характерологический стиль</strong>
          <span>${d.character}</span>
        </div>
        <div class="sobchik-item">
          <strong>Эмоциональная сфера</strong>
          <span>${d.emotion}</span>
        </div>
        <div class="sobchik-item">
          <strong>Познавательный стиль и мышление</strong>
          <span>${d.cognitive}</span>
        </div>
        <div class="sobchik-item">
          <strong>Межличностное взаимодействие</strong>
          <span>${d.social}</span>
        </div>
        <div class="sobchik-item stress-item" style="grid-column: 1 / -1; background: rgba(181, 114, 95, 0.07); border-color: rgba(181, 114, 95, 0.25);">
          <strong>Дезадаптационные риски при стрессе</strong>
          <span style="color: #E4CBC5;">${d.stressRisks}</span>
        </div>
      </div>
    `;

    return card;
  }

  // --- 3. Render Classical Szondi Interpretation (>= 3 points only) ---
  function renderSzondiClassicalInterpretation() {
    const container = document.getElementById('szondi-interpretation-container');
    if (!container) return;
    container.innerHTML = '';

    const vectorCodes = ['S', 'P', 'Sch', 'C'];
    const p1Formulas = [];
    const p2Formulas = [];
    let activeVectorsCount = 0;

    vectorCodes.forEach(vCode => {
      const vector = SZONDI_VECTORS[vCode];
      const f1 = vector.factors[0];
      const f2 = vector.factors[1];

      // Plan 1 reactions
      const p1_f1_plus = state.firstPlanScores[`${f1}+`];
      const p1_f1_minus = state.firstPlanScores[`${f1}-`];
      const p1_f2_plus = state.firstPlanScores[`${f2}+`];
      const p1_f2_minus = state.firstPlanScores[`${f2}-`];

      // Plan 2 reactions
      const p2_f1_plus = state.secondPlanScores[`${f1}+`];
      const p2_f1_minus = state.secondPlanScores[`${f1}-`];
      const p2_f2_plus = state.secondPlanScores[`${f2}+`];
      const p2_f2_minus = state.secondPlanScores[`${f2}-`];

      const r1_p1 = evaluateSzondiReaction(p1_f1_plus, p1_f1_minus);
      const r2_p1 = evaluateSzondiReaction(p1_f2_plus, p1_f2_minus);
      const formula1 = `${f1}${r1_p1.symbol} ${f2}${r2_p1.symbol}`;
      p1Formulas.push(`${vCode}: ${formula1}`);

      const r1_p2 = evaluateSzondiReaction(p2_f1_plus, p2_f1_minus);
      const r2_p2 = evaluateSzondiReaction(p2_f2_plus, p2_f2_minus);
      const formula2 = `${f1}${r1_p2.symbol} ${f2}${r2_p2.symbol}`;
      p2Formulas.push(`${vCode}: ${formula2}`);

      // Filter: only consider vector if Plan 1 has >= 3 OR Plan 2 has >= 4
      const isVectorActive = state.exploreSecondPlan
        ? (
            p1_f1_plus >= 3 || p1_f1_minus >= 3 || p1_f2_plus >= 3 || p1_f2_minus >= 3 ||
            p2_f1_plus >= 4 || p2_f1_minus >= 4 || p2_f2_plus >= 4 || p2_f2_minus >= 4
          )
        : (
            p1_f1_plus >= 3 || p1_f1_minus >= 3 || p1_f2_plus >= 3 || p1_f2_minus >= 3
          );

      if (!isVectorActive) {
        return; // Exclude this vector entirely per requirement 5
      }

      activeVectorsCount++;

      const card = document.createElement('div');
      card.className = 'vector-report-card';

      const p1Analysis = getVectorDetailedAnalysis(vCode, f1, r1_p1, f2, r2_p1);
      const p2Analysis = state.exploreSecondPlan ? getVectorDetailedAnalysis(vCode, f1, r1_p2, f2, r2_p2) : '';
      const dynamicAnalysis = state.exploreSecondPlan ? getVectorComparativeDynamic(vCode, r1_p1, r2_p1, r1_p2, r2_p2) : '';

      const secondPlanHeaderHtml = state.exploreSecondPlan
        ? `<div style="font-family: monospace; font-size: 13px; color: #8C7B68; font-weight: 700;">II план: ${formula2}</div>`
        : '';

      const secondPlanBodyHtml = state.exploreSecondPlan
        ? `
        <div style="margin-bottom: 14px; background: rgba(140, 123, 104, 0.07); border-left: 3px solid #8C7B68; padding: 10px 14px; border-radius: 4px;">
          <strong style="color: #8C7B68; font-size: 13px; display: block; margin-bottom: 2px;">Второй план (скрытый бессознательный фон и вытеснение):</strong>
          <span style="font-size: 13px; color: #4D5B50;">${p2Analysis}</span>
        </div>

        <div style="background: rgba(111, 146, 123, 0.07); border-left: 3px solid #6F927B; padding: 10px 14px; border-radius: 4px;">
          <strong style="color: #6F927B; font-size: 13px; display: block; margin-bottom: 2px;">Динамика взаимодействия планов (компенсация и защиты):</strong>
          <span style="font-size: 13px; color: #4D5B50;">${dynamicAnalysis}</span>
        </div>
        `
        : '';

      card.innerHTML = `
        <div class="vector-report-header" style="border-bottom: 1px solid var(--border-subtle); padding-bottom: 12px; margin-bottom: 14px;">
          <div>
            <span class="vector-badge" style="font-size: 14px;">${vector.name}</span>
            <div style="font-size: 13px; color: var(--text-muted); margin-top: 4px;">${vector.description}</div>
          </div>
          <div style="text-align: right;">
            <div style="font-family: monospace; font-size: 13px; color: #2F4A3B; font-weight: 700;">I план: ${formula1}</div>
            ${secondPlanHeaderHtml}
          </div>
        </div>

        <div style="margin-bottom: 14px; background: rgba(47, 74, 59, 0.07); border-left: 3px solid #2F4A3B; padding: 10px 14px; border-radius: 4px;">
          <strong style="color: #2F4A3B; font-size: 13px; display: block; margin-bottom: 2px;">Передний план (актуальные осознанные влечения):</strong>
          <span style="font-size: 13px; color: #4D5B50;">${p1Analysis}</span>
        </div>

        ${secondPlanBodyHtml}
      `;

      container.appendChild(card);
    });

    if (activeVectorsCount === 0) {
      container.innerHTML = `
        <div class="threshold-alert-card">
          <h4>Влеченческое напряжение ниже порогового (&lt; 3 баллов)</h4>
          <p>В классическом психоанализе Сонди векторы влечений без выраженных выборов (3+ баллов) находятся в состоянии покоя влечения или гармоничной сублимации. Острых конфликтов между сознательным фасадом и бессознательным фоном не обнаружено.</p>
        </div>
      `;
    }

    // Personality Synthesis Section
    const fullP1Formula = p1Formulas.join(' | ');
    const fullP2Formula = p2Formulas.join(' | ');
    const dominantAnalysis = getDominantDrivesAnalysisBothPlans();

    const secondFormulaRow = state.exploreSecondPlan
      ? `
          <div style="background: rgba(140, 123, 104, 0.1); padding: 6px 10px; border-radius: 4px; color: #8C7B68;">
            <strong>Схема 2 (II план / Hintergrund):</strong> ${fullP2Formula}
          </div>
      `
      : '';

    const secondPlanCardInSynthesis = state.exploreSecondPlan
      ? `
        <div style="background: rgba(140, 123, 104, 0.1); border: 1px solid rgba(140, 123, 104, 0.3); border-radius: 8px; padding: 14px;">
          <strong style="color: #8C7B68; font-size: 14px; display: block; margin-bottom: 4px;">🔮 Скрытые резервы и латентный фон (II план ≥ 3):</strong>
          <span style="font-size: 13px; color: #4D5B50;">${dominantAnalysis.p2Latents}</span>
        </div>
      `
      : '';

    personalitySynthesis.innerHTML = `
      <div class="vector-report-header" style="flex-direction: column; align-items: flex-start; gap: 8px;">
        <span class="vector-badge" style="background: rgba(140, 123, 104, 0.2); color: #8C7B68;">Интегральный психологический синтез личности</span>
        <div style="display: flex; flex-direction: column; gap: 4px; font-family: monospace; font-size: 12px; width: 100%;">
          <div style="background: rgba(47, 74, 59, 0.1); padding: 6px 10px; border-radius: 4px; color: #2F4A3B;">
            <strong>Схема 1 (I план / Vordergrund):</strong> ${fullP1Formula}
          </div>
          ${secondFormulaRow}
        </div>
      </div>

      <div style="font-size: 15px; color: #25352C; font-weight: 700; margin: 16px 0 8px 0;">
        ${state.exploreSecondPlan ? 'Соотношение сознательного фасада и бессознательного фона:' : 'Психологический портрет актуального плана:'}
      </div>
      <p class="vector-summary-text" style="font-size: 14px; margin-bottom: 16px;">
        ${state.exploreSecondPlan ? dominantAnalysis.leadingNarrative : dominantAnalysis.p1Strengths}
      </p>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px;">
        <div style="background: rgba(47, 74, 59, 0.1); border: 1px solid rgba(47, 74, 59, 0.3); border-radius: 8px; padding: 14px;">
          <strong style="color: #2F4A3B; font-size: 14px; display: block; margin-bottom: 4px;">🔷 Актуальные ведущие потребности (I план ≥ 3):</strong>
          <span style="font-size: 13px; color: #4D5B50;">${dominantAnalysis.p1Strengths}</span>
        </div>
        ${secondPlanCardInSynthesis}
        <div style="background: rgba(181, 114, 95, 0.1); border: 1px solid rgba(181, 114, 95, 0.3); border-radius: 8px; padding: 14px;">
          <strong style="color: #C98A78; font-size: 14px; display: block; margin-bottom: 4px;">🔴 Защитное вытеснение и самоконтроль (≥ 3):</strong>
          <span style="font-size: 13px; color: #4D5B50;">${dominantAnalysis.repressions}</span>
        </div>
      </div>
    `;
  }

  // --- 4. Render Fate Analysis (Судьбоанализ) (>= 3 points only) ---
  // In order: First Plan (descending 6 -> 3), then Second Plan (descending 6 -> 3)
  // Noble warm brown theme
  function renderFateAnalysis() {
    const container = document.getElementById('fate-interpretation-container');
    if (!container) return;
    container.innerHTML = '';

    const poles = [
      'h+', 'h-', 's+', 's-', 'e+', 'e-', 'hy+', 'hy-',
      'k+', 'k-', 'p+', 'p-', 'd+', 'd-', 'm+', 'm-'
    ];

    // 1. First Plan factors >= 3, sorted descending
    const p1List = [];
    poles.forEach(code => {
      const p1 = state.firstPlanScores[code] || 0;
      const p2 = state.secondPlanScores[code] || 0;
      if (p1 >= 3) {
        const factorKey = code.slice(0, -1);
        p1List.push({
          code,
          score: p1,
          p1,
          p2,
          isFirstPlan: true,
          data: FATE_ANALYSIS_DATA ? FATE_ANALYSIS_DATA[code] : null,
          factorName: SZONDI_FACTORS[factorKey] ? SZONDI_FACTORS[factorKey].name : code
        });
      }
    });
    p1List.sort((a, b) => b.score - a.score);

    // 2. Second Plan factors >= 4 only (Requirement 5), sorted descending
    const p2List = [];
    if (state.exploreSecondPlan) {
      poles.forEach(code => {
        const p1 = state.firstPlanScores[code] || 0;
        const p2 = state.secondPlanScores[code] || 0;
        if (p2 >= 4) { // Requirement 5: score >= 4 only!
          const factorKey = code.slice(0, -1);
          p2List.push({
            code,
            score: p2,
            p1,
            p2,
            isFirstPlan: false,
            data: FATE_ANALYSIS_DATA ? FATE_ANALYSIS_DATA[code] : null,
            factorName: SZONDI_FACTORS[factorKey] ? SZONDI_FACTORS[factorKey].name : code
          });
        }
      });
      p2List.sort((a, b) => b.score - a.score);
    }

    if (p1List.length === 0 && p2List.length === 0) {
      container.innerHTML = `
        <div class="threshold-alert-card">
          <h4>Нет доминантных влечений для судьбоаналитического анализа</h4>
          <p>На первом плане показатели не превысили 3 баллов, а на втором плане не достигли диагностического порога в 4 балла. При умеренных показателях профессиональные и партнерские выборы определяются в основном социальными нормами и осознанными предпочтениями без выраженной бессознательной детерминации.</p>
        </div>
      `;
      return;
    }

    const introCard = document.createElement('div');
    introCard.className = 'fate-card fate-intro-card';
    introCard.innerHTML = `
      <h4 class="fate-intro-heading" style="font-size: 16px; margin-bottom: 6px;">Судьбоаналитическая типология выборов (Леопольд Сонди)</h4>
      <p style="font-size: 13px; color: var(--text-muted); line-height: 1.6;">
        Судьбоанализ исследует бессознательные механизмы, направляющие судьбу человека в 4 ключевых сферах:
        <strong>Оперотропизм</strong> (выбор профессии), <strong>Либидотропизм</strong> (выбор партнера),
        <strong>Идеотропизм</strong> (духовный и мировоззренческий выбор) и <strong>Морботропизм</strong> (уязвимость к психосоматическим срывам).
        ${state.exploreSecondPlan ? 'Анализ упорядочен: сначала представлены <strong>наиболее выраженные факторы Первого плана</strong> (от 6 до 3 баллов), а затем в отдельной графе — <strong>факторы Второго плана (порог: от 4 баллов)</strong>.' : 'Анализ представляет <strong>наиболее выраженные факторы Первого плана</strong> (от 6 до 3 баллов).'}
      </p>
    `;
    container.appendChild(introCard);

    // SECTION 1: FIRST PLAN
    const p1Section = document.createElement('div');
    p1Section.className = 'plan-interpretation-section';
    p1Section.innerHTML = `
      <div class="plan-section-title-box plan-first-fate">
        <div>
          <h3 style="color: #A98B6D;">🟤 Первый план: Актуальный выбор судьбы (ранжированы по силе: 6 → 3)</h3>
          <p>Осознаваемые предпочтения в профессии, партнерских отношениях и системе личных ценностей.</p>
        </div>
        <span class="plan-badge-pill" style="background: rgb(197, 169, 142, 0.25); color: #A98B6D;">
          ${p1List.length} ${p1List.length === 1 ? 'фактор' : (p1List.length < 5 ? 'фактора' : 'факторов')}
        </span>
      </div>
    `;

    if (p1List.length === 0) {
      const emptyNote = document.createElement('p');
      emptyNote.style.cssText = 'color: var(--text-muted); font-style: italic; padding: 10px 14px;';
      emptyNote.textContent = 'На первом плане не выявлено факторов, преодолевших диагностический порог в 3 балла.';
      p1Section.appendChild(emptyNote);
    } else {
      p1List.forEach(item => {
        const card = createFateCard(item, true);
        if (card) p1Section.appendChild(card);
      });
    }
    container.appendChild(p1Section);

    // SECTION 2: SECOND PLAN (rendered only when exploreSecondPlan is enabled)
    if (state.exploreSecondPlan) {
      const p2Section = document.createElement('div');
      p2Section.className = 'plan-interpretation-section';
      p2Section.innerHTML = `
        <div class="plan-section-title-box plan-second-fate">
          <div>
            <h3 style="color: #A98B6D;">🟤 Второй план: Фоновые детерминанты судьбы (порог: от 4 баллов, ранжированы: 6 → 4)</h3>
            <p>Скрытые бессознательные резервы и латентные предрасположенности выбора жизненного пути (показатели до 3 баллов исключены).</p>
          </div>
          <span class="plan-badge-pill" style="background: rgb(139, 116, 95, 0.25); color: #A98B6D;">
            ${p2List.length} ${p2List.length === 1 ? 'фактор' : (p2List.length < 5 ? 'фактора' : 'факторов')}
          </span>
        </div>
      `;

      if (p2List.length === 0) {
        const emptyNote = document.createElement('p');
        emptyNote.style.cssText = 'color: var(--text-muted); font-style: italic; padding: 10px 14px;';
        emptyNote.textContent = 'На втором плане не выявлено скрытых факторов, преодолевших диагностический порог в 4 балла.';
        p2Section.appendChild(emptyNote);
      } else {
        p2List.forEach(item => {
          const card = createFateCard(item, false);
          if (card) p2Section.appendChild(card);
        });
      }
      container.appendChild(p2Section);
    }
  }

  function createFateCard(item, isFirstPlan) {
    const d = item.data;
    if (!d) return null;

    const card = document.createElement('div');
    card.className = 'fate-card';

    const planBadgeText = isFirstPlan
      ? `I план: ${item.score} / 6 (актуальный)`
      : `II план: ${item.score} / 6 (фоновый)`;

    card.innerHTML = `
      <div class="fate-card-header">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span class="fate-tag">${item.code}</span>
          <strong style="color: #25352C; font-size: 15px;">${item.factorName}</strong>
        </div>
        <span style="font-size: 12px; color: #A98B6D; font-weight: 700;">${planBadgeText}</span>
      </div>

      <div class="fate-factors-grid">
        <div class="fate-factor-box operotropism">
          <h4>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
            </svg>
            Оперотропизм (Выбор профессии)
          </h4>
          <p>${d.operotropism}</p>
        </div>

        <div class="fate-factor-box libidotropism">
          <h4>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
            Либидотропизм (Выбор партнера)
          </h4>
          <p>${d.libidotropism}</p>
        </div>

        <div class="fate-factor-box ideotropism">
          <h4>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
            </svg>
            Идеотропизм (Духовные идеалы)
          </h4>
          <p>${d.ideotropism}</p>
        </div>

        <div class="fate-factor-box morbotropism">
          <h4>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            Морботропизм (Зоны уязвимости)
          </h4>
          <p>${d.morbotropism}</p>
        </div>
      </div>
    `;

    return card;
  }

  function getVectorDetailedAnalysis(vCode, f1, r1, f2, r2) {
    if (vCode === 'S') {
      if (r1.type === '+' && r2.type === '+') return 'Гармоничное сочетание потребности в эмоциональной близости и активной жизненной позиции. Способность любить и проявлять настойчивость в достижении целей.';
      if (r1.type === '+' && r2.type === '-') return 'Мягкосердечие, выраженная гуманистическая направленность при торможении агрессивных проявлений. Склонность к самопожертвованию, заботе и уступчивости.';
      if (r1.type === '-' && r2.type === '+') return 'Маскулинная наступательная направленность с высокой работоспособностью. Рационализация эмоциональных связей, акцент на преодолении трудностей и соперничестве.';
      if (r1.type === '-' && r2.type === '-') return 'Высокая степень сдержанности чувств и торможение внешней активности. Энергия сублимируется в интеллектуальный или творческий труд.';
      if (r1.type === '+-') return 'Амбивалентность эмоциональной привязанности: борьба между потребностью в интимном сближении и страхом зависимости.';
      if (r2.type === '+-') return 'Внутреннее напряжение в сфере самоутверждения: чередование наступательной решимости и пассивности.';
      return 'Уравновешенный характер влечений сферы привязанности и активности без выраженных крайностей.';
    }

    if (vCode === 'P') {
      if (r1.type === '+' && r2.type === '-') return 'Высокий нравственно-этический самоконтроль, подавление раздражительности и стыдливость. Стремление к благопристойности и справедливости.';
      if (r1.type === '-' && r2.type === '+') return 'Эмоциональная экспрессивность, потребность в признании и внимании. Возможны вспышки нетерпимости и непосредственное выражение переживаний.';
      if (r1.type === '+' && r2.type === '+') return 'Способность к яркой эмпатии, доброжелательность, артистичность в сочетании со стремлением к гармонизации отношений.';
      if (r1.type === '-' && r2.type === '-') return 'Накопление внутреннего аффекта при внешней замкнутости. Опасение открыто проявлять чувства из-за боязни критики.';
      if (r1.type === '+-') return 'Скрытое эмоциональное кипение: сдерживаемый гнев или обостренное чувство ущемленности.';
      return 'Стабильный уровень эмоциональной регуляции без резких аффективных всплесков.';
    }

    if (vCode === 'Sch') {
      if (r1.type === '+' && r2.type === '+') return 'Сильное интегрированное «Я»: сочетание логического самоконтроля, объективности и масштаба идей. Высокий творческий и управленческий потенциал.';
      if (r1.type === '+' && r2.type === '-') return 'Рационализм, дисциплина мышления, опора на логику и факты. Скептическое отношение к иллюзиям, практицизм, высокая надежность.';
      if (r1.type === '-' && r2.type === '+') return 'Богатое воображение, интуиция, творческий поиск. Отказ от жестких стереотипов, восприимчивость к новым концепциям.';
      if (r1.type === '-' && r2.type === '-') return 'Пластичность самооценки, готовность адаптироваться к изменяющимся обстоятельствам без ригидного отстаивания догм.';
      if (r1.type === '+-') return 'Интрапсихический конфликт идентификации: колебания между самоограничением и грандиозными планами.';
      return 'Сбалансированное функционирование механизмов эго-контроля и личностной экспансии.';
    }

    if (vCode === 'C') {
      if (r1.type === '-' && r2.type === '+') return 'Преданность близким людям и проверенным ценностям в сочетании с оптимизмом и общительностью. Стремление к надежному коллективу.';
      if (r1.type === '+' && r2.type === '+') return 'Высокая контактность, любознательность, открытость миру, легкая переключаемость и энтузиазм при знакомстве с новым.';
      if (r1.type === '-' && r2.type === '-') return 'Избирательность в контактах, стремление к автономии и личному уединению. Бережное отношение к узкому кругу избранных связей.';
      if (r1.type === '+' && r2.type === '-') return 'Стремление к переменам и автономии от прежних зависимостей. Поиск нового жизненного пространства.';
      if (r2.type === '+-') return 'Амбивалентная привязанность: жажда эмоционального тепла при постоянном сомнении в надежности партнера.';
      return 'Стабильный стиль межличностных отношений с сохранением баланса между верностью и открытостью новому.';
    }

    return 'Стабильный профиль вектора.';
  }

  function getVectorComparativeDynamic(vCode, r1_p1, r2_p1, r1_p2, r2_p2) {
    const isComplementary1 = (r1_p1.type === '+' && r1_p2.type === '-') || (r1_p1.type === '-' && r1_p2.type === '+');
    const isComplementary2 = (r2_p1.type === '+' && r2_p2.type === '-') || (r2_p1.type === '-' && r2_p2.type === '+');

    if (isComplementary1 || isComplementary2) {
      return 'Классическая комплементарность по Сонди: осознанно декларируемая тенденция первого плана компенсируется противоположным импульсом на втором плане. Это указывает на активную работу психологических защит (реактивное образование, компенсация).';
    }

    if (r1_p1.type === r1_p2.type && r2_p1.type === r2_p2.type && r1_p1.type !== '0') {
      return 'Конгруэнтность планов: фоновые неосознаваемые тенденции полностью совпадают с сознательными проявлениями. Данная черта личности обладает глубокой устойчивостью и не подвержена амбивалентности.';
    }

    if ((r1_p1.type === '0' || r2_p1.type === '0') && (r1_p2.type !== '0' || r2_p2.type !== '0')) {
      return 'Латентная актуализация: внешне нейтральная или «разряженная» тема первого плана на втором плане обнаруживает скрытое влечение, являясь резервом личностного развития.';
    }

    return 'Сбалансированное взаимодействие сознательного контроля и фоновой мотивации без выраженных конфликтов вытеснения.';
  }

  function getDominantDrivesAnalysisBothPlans() {
    const factors = ['h', 's', 'e', 'hy', 'k', 'p', 'd', 'm'];

    const sortedP1Plus = [...factors].sort((a, b) => state.firstPlanScores[`${b}+`] - state.firstPlanScores[`${a}+`]);
    const sortedP1Minus = [...factors].sort((a, b) => state.firstPlanScores[`${b}-`] - state.firstPlanScores[`${a}-`]);
    const sortedP2Plus = [...factors].sort((a, b) => state.secondPlanScores[`${b}+`] - state.secondPlanScores[`${a}+`]);

    // Only consider factors with score >= 3
    const topP1Plus = sortedP1Plus.filter(f => state.firstPlanScores[`${f}+`] >= 3);
    const topP1Minus = sortedP1Minus.filter(f => state.firstPlanScores[`${f}-`] >= 3);
    const topP2Plus = sortedP2Plus.filter(f => state.secondPlanScores[`${f}+`] >= 3);

    const p1Strengths = topP1Plus.length > 0
      ? topP1Plus.map(f => `${SZONDI_FACTORS[f].plus.title} (${f}+: ${state.firstPlanScores[`${f}+`]})`).join('; ')
      : 'Нет выраженных доминантных потребностей (все факторы < 3 баллов)';

    const p2Latents = topP2Plus.length > 0
      ? topP2Plus.map(f => `${SZONDI_FACTORS[f].plus.title} (${f}+: ${state.secondPlanScores[`${f}+`]})`).join('; ')
      : 'Фоновые влечения сбалансированы (все факторы < 3 баллов)';

    const repressions = topP1Minus.length > 0
      ? topP1Minus.map(f => `${SZONDI_FACTORS[f].minus.title} (${f}-: ${state.firstPlanScores[`${f}-`]})`).join('; ')
      : 'Вытеснение не зафиксировано (все факторы < 3 баллов)';

    let narrative = `Сравнение Первого (Vordergrund) и Второго (Hintergrund) планов выявляет динамическую картину личности на основе выраженных влечений (≥ 3 баллов). `;
    if (topP1Plus.length > 0) {
      narrative += `На сознательном уровне ведущая активность направлена на реализацию факторов [${topP1Plus.map(f => f + '+').join(', ')}]. `;
    } else {
      narrative += `На сознательном уровне острых акцентуированных влечений не выявлено. `;
    }

    if (topP2Plus.length > 0) {
      narrative += `При этом бессознательный фоновый резерв сформирован факторами [${topP2Plus.map(f => f + '+').join(', ')}], что указывает на скрытые ресурсы, активирующиеся в стрессовых ситуациях или при глубоком расслаблении. `;
    }

    if (topP1Minus.length > 0) {
      narrative += `Зоны сознательного самоконтроля и защитного вытеснения сосредоточены вокруг [${topP1Minus.map(f => f + '-').join(', ')}].`;
    }

    return {
      leadingNarrative: narrative,
      p1Strengths: p1Strengths,
      p2Latents: p2Latents,
      repressions: repressions
    };
  }

  // --- Helper: Format Score Distribution as Clean Text (Without ASCII pseudo-graphic schemas) ---
  function formatScoreDistributionText(p1Scores, p2Scores, exploreSecondPlan, dateStr, note) {
    const formatPlan = (title, emoji, sc) => {
      const vectors = [
        { code: 'S', name: 'Либидо', f1: 'h', f2: 's' },
        { code: 'P', name: 'Аффект', f1: 'e', f2: 'hy' },
        { code: 'Sch', name: 'Эго', f1: 'k', f2: 'p' },
        { code: 'C', name: 'Контакт', f1: 'd', f2: 'm' }
      ];

      const formula = vectors.map(v => {
        const r1 = evaluateSzondiReaction(sc[`${v.f1}+`] || 0, sc[`${v.f1}-`] || 0);
        const r2 = evaluateSzondiReaction(sc[`${v.f2}+`] || 0, sc[`${v.f2}-`] || 0);
        return `${v.code} (${r1.symbol} ${r2.symbol})`;
      }).join('   ');

      const distributionLines = vectors.map(v => {
        const p1 = sc[`${v.f1}+`] || 0;
        const m1 = sc[`${v.f1}-`] || 0;
        const r1 = evaluateSzondiReaction(p1, m1);

        const p2 = sc[`${v.f2}+`] || 0;
        const m2 = sc[`${v.f2}-`] || 0;
        const r2 = evaluateSzondiReaction(p2, m2);

        return `• Вектор ${v.code} (${v.name}):\n   ${v.f1}: +${p1} / -${m1} (${r1.symbol})   |   ${v.f2}: +${p2} / -${m2} (${r2.symbol})`;
      }).join('\n');

      const factors = ['h', 's', 'e', 'hy', 'k', 'p', 'd', 'm'];
      const brief = factors.map(f => `${f}:+${sc[`${f}+`] || 0}/-${sc[`${f}-`] || 0}`).join(' ');

      return `${emoji} ${title}\nФормула влечений: ${formula}\n\nРаспределение баллов:\n${distributionLines}\n\nКраткая сводка: ${brief}`;
    };

    let text = `📊 Результаты теста Сонди (Метод портретных выборов)\n📅 Дата: ${dateStr}`;
    if (note && note.trim()) {
      text += `\n📝 Заметка: ${note.trim()}`;
    }

    text += '\n\n' + formatPlan('СХЕМА 1: ПЕРВЫЙ ПЛАН (Vordergrund / актуальный)', '🔷', p1Scores);

    if (exploreSecondPlan && p2Scores) {
      text += '\n\n' + formatPlan('СХЕМА 2: ВТОРОЙ ПЛАН (Hintergrund / фоновый)', '🔮', p2Scores);
    }

    text += '\n\n💡 Для получения более точной и совокупной интерпретации желательно связаться с экспертом по данной методике:';
    text += `\n💬 MAX: ${MAX_EXPERT_URL}`;
    text += `\n💬 Telegram: @${TELEGRAM_EXPERT_USER}`;

    return text;
  }

  // --- Helper: Render High-Resolution Canvas Image of Results Table ---
  function renderResultsTableToCanvas(p1Scores, p2Scores, exploreSecondPlan, dateStr, note) {
    const canvas = document.createElement('canvas');
    const width = 940;
    const hasSecondPlan = exploreSecondPlan && p2Scores;
    const height = hasSecondPlan ? 760 : 440;

    const dpr = 2; // Retina sharpness
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    function drawRoundedRect(context, x, y, w, h, r) {
      context.beginPath();
      context.moveTo(x + r, y);
      context.lineTo(x + w - r, y);
      context.quadraticCurveTo(x + w, y, x + w, y + r);
      context.lineTo(x + w, y + h - r);
      context.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      context.lineTo(x + r, y + h);
      context.quadraticCurveTo(x, y + h, x, y + h - r);
      context.lineTo(x, y + r);
      context.quadraticCurveTo(x, y, x + r, y);
      context.closePath();
    }

    // 1. Background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#F3F0E8');
    bgGrad.addColorStop(1, '#FAF8F2');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Border
    ctx.strokeStyle = '#F7F4EC';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(1, 1, width - 2, height - 2);

    // 2. Top Header
    ctx.fillStyle = '#25352C';
    ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('ТЕСТ СОНДИ • РЕЗУЛЬТАТЫ ТЕСТИРОВАНИЯ', 28, 38);

    ctx.fillStyle = '#667267';
    ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    let subtitleText = `Дата: ${dateStr}`;
    if (note && note.trim()) {
      subtitleText += `   |   📝 Заметка: ${note.trim()}`;
    }
    ctx.fillText(subtitleText, 28, 58);

    // Helper: Draw Plan Block (Formula Banner, Table, and Mini Histogram)
    const drawPlanBlock = (startY, title, themeColor, sc) => {
      const factors = ['h', 's', 'e', 'hy', 'k', 'p', 'd', 'm'];
      const vectors = [
        { code: 'S', name: 'Либидо', factors: ['h', 's'] },
        { code: 'P', name: 'Аффект', factors: ['e', 'hy'] },
        { code: 'Sch', name: 'Эго', factors: ['k', 'p'] },
        { code: 'C', name: 'Контакт', factors: ['d', 'm'] }
      ];

      // Plan Title
      ctx.fillStyle = themeColor;
      ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(title, 28, startY);

      // Vector Formula Banner
      const formulaStr = vectors.map(v => {
        const r1 = evaluateSzondiReaction(sc[`${v.factors[0]}+`] || 0, sc[`${v.factors[0]}-`] || 0);
        const r2 = evaluateSzondiReaction(sc[`${v.factors[1]}+`] || 0, sc[`${v.factors[1]}-`] || 0);
        return `${v.code} (${r1.symbol} ${r2.symbol})`;
      }).join('    ');

      ctx.fillStyle = '#4D5B50';
      ctx.font = 'bold 13px ui-monospace, SFMono-Regular, Menlo, monospace';
      ctx.textAlign = 'right';
      ctx.fillText(formulaStr, width - 28, startY);
      ctx.textAlign = 'left';

      // Table layout
      const tableX = 28;
      const tableY = startY + 14;
      const tableW = width - 56; // 884
      const colTitleW = 140;
      const colFactorW = (tableW - colTitleW) / 8; // 93px

      const rowVectorY = tableY;
      const rowVectorH = 28;
      const rowFactorY = rowVectorY + rowVectorH;
      const rowFactorH = 30;
      const rowPlusY = rowFactorY + rowFactorH;
      const rowPlusH = 32;
      const rowMinusY = rowPlusY + rowPlusH;
      const rowMinusH = 32;
      const rowRxY = rowMinusY + rowMinusH;
      const rowRxH = 36;
      const tableTotalH = rowVectorH + rowFactorH + rowPlusH + rowMinusH + rowRxH; // 158

      // Table Background
      ctx.fillStyle = 'rgba(247, 244, 236, 0.75)';
      ctx.fillRect(tableX, tableY, tableW, tableTotalH);

      // Table Outer Border
      ctx.strokeStyle = 'rgba(172, 168, 160, 0.2)';
      ctx.lineWidth = 1;
      ctx.strokeRect(tableX, tableY, tableW, tableTotalH);

      // Horizontal Row lines
      [rowFactorY, rowPlusY, rowMinusY, rowRxY].forEach(y => {
        ctx.beginPath();
        ctx.moveTo(tableX, y);
        ctx.lineTo(tableX + tableW, y);
        ctx.strokeStyle = 'rgba(37, 53, 44, 0.08)';
        ctx.stroke();
      });

      // Left Column Background
      ctx.fillStyle = 'rgba(250, 248, 242, 0.5)';
      ctx.fillRect(tableX, tableY, colTitleW, tableTotalH);
      ctx.beginPath();
      ctx.moveTo(tableX + colTitleW, tableY);
      ctx.lineTo(tableX + colTitleW, tableY + tableTotalH);
      ctx.strokeStyle = 'rgba(37, 53, 44, 0.15)';
      ctx.stroke();

      // Titles in First Column
      ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#667267';
      ctx.fillText('ВЕКТОРЫ', tableX + 14, rowVectorY + 19);
      ctx.fillText('ФАКТОРЫ', tableX + 14, rowFactorY + 20);

      ctx.fillStyle = '#6F927B';
      ctx.fillText('+ Выбор (приятно)', tableX + 14, rowPlusY + 21);

      ctx.fillStyle = '#C98A78';
      ctx.fillText('− Выбор (неприятно)', tableX + 14, rowMinusY + 21);

      ctx.fillStyle = '#4D5B50';
      ctx.fillText('Реакция влечения', tableX + 14, rowRxY + 23);

      // Vector Headers (4 vectors, each spanning 2 factors)
      vectors.forEach((v, vIdx) => {
        const vX = tableX + colTitleW + vIdx * 2 * colFactorW;
        const vW = 2 * colFactorW;

        if (vIdx > 0) {
          ctx.beginPath();
          ctx.moveTo(vX, tableY);
          ctx.lineTo(vX, tableY + tableTotalH);
          ctx.strokeStyle = 'rgba(37, 53, 44, 0.15)';
          ctx.stroke();
        }

        ctx.fillStyle = 'rgba(47, 74, 59, 0.08)';
        ctx.fillRect(vX + 1, rowVectorY + 1, vW - 2, rowVectorH - 2);

        ctx.fillStyle = '#2F4A3B';
        ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${v.code} (${v.name})`, vX + vW / 2, rowVectorY + 19);
      });

      // Factor Columns (8 factors)
      factors.forEach((f, fIdx) => {
        const fX = tableX + colTitleW + fIdx * colFactorW;

        if (fIdx % 2 === 1) {
          ctx.beginPath();
          ctx.moveTo(fX, rowFactorY);
          ctx.lineTo(fX, tableY + tableTotalH);
          ctx.strokeStyle = 'rgba(37, 53, 44, 0.06)';
          ctx.stroke();
        }

        // Factor Name
        ctx.fillStyle = '#25352C';
        ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(f, fX + colFactorW / 2, rowFactorY + 21);

        const pVal = sc[`${f}+`] || 0;
        const mVal = sc[`${f}-`] || 0;
        const rx = evaluateSzondiReaction(pVal, mVal);

        // Plus Value
        ctx.fillStyle = pVal > 0 ? '#6F927B' : '#7A857B';
        ctx.font = pVal > 0 ? 'bold 14px system-ui' : '13px system-ui';
        ctx.fillText(pVal > 0 ? `+${pVal}` : '0', fX + colFactorW / 2, rowPlusY + 21);

        // Minus Value
        ctx.fillStyle = mVal > 0 ? '#C98A78' : '#7A857B';
        ctx.font = mVal > 0 ? 'bold 14px system-ui' : '13px system-ui';
        ctx.fillText(mVal > 0 ? `−${mVal}` : '0', fX + colFactorW / 2, rowMinusY + 21);

        // Reaction Badge
        let badgeBg = 'rgba(102, 98, 91, 0.2)';
        let badgeColor = '#667267';
        if (rx.type === '+') {
          badgeBg = 'rgba(111, 146, 123, 0.25)';
          badgeColor = '#6F927B';
        } else if (rx.type === '-') {
          badgeBg = 'rgba(181, 114, 95, 0.25)';
          badgeColor = '#C98A78';
        } else if (rx.type === '+-') {
          badgeBg = 'rgba(140, 123, 104, 0.25)';
          badgeColor = '#8C7B68';
        }

        const bW = 32;
        const bH = 22;
        const bX = fX + (colFactorW - bW) / 2;
        const bY = rowRxY + (rowRxH - bH) / 2;

        ctx.fillStyle = badgeBg;
        drawRoundedRect(ctx, bX, bY, bW, bH, 5);
        ctx.fill();

        ctx.strokeStyle = badgeColor;
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = badgeColor;
        ctx.font = 'bold 13px system-ui';
        ctx.fillText(rx.symbol, fX + colFactorW / 2, bY + 16);
      });

      // Mini Graphical Histogram below table
      const histY = tableY + tableTotalH + 14;
      const zeroLineY = histY + 40;
      const barScale = 5.5;

      ctx.fillStyle = '#7A857B';
      ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('Графический профиль:', tableX, histY + 6);

      // Baseline at 0
      ctx.beginPath();
      ctx.moveTo(tableX + colTitleW, zeroLineY);
      ctx.lineTo(tableX + tableW, zeroLineY);
      ctx.strokeStyle = 'rgba(37, 53, 44, 0.18)';
      ctx.lineWidth = 1;
      ctx.stroke();

      factors.forEach((f, fIdx) => {
        const fCenterX = tableX + colTitleW + fIdx * colFactorW + colFactorW / 2;
        const pVal = sc[`${f}+`] || 0;
        const mVal = sc[`${f}-`] || 0;
        const barW = 14;

        if (pVal > 0) {
          const bH = pVal * barScale;
          ctx.fillStyle = '#6F927B';
          ctx.fillRect(fCenterX - barW / 2, zeroLineY - bH, barW, bH);
          ctx.fillStyle = '#6F927B';
          ctx.font = 'bold 10px system-ui';
          ctx.textAlign = 'center';
          ctx.fillText(`+${pVal}`, fCenterX, zeroLineY - bH - 3);
        }

        if (mVal > 0) {
          const bH = mVal * barScale;
          ctx.fillStyle = '#B5725F';
          ctx.fillRect(fCenterX - barW / 2, zeroLineY, barW, bH);
          ctx.fillStyle = '#C98A78';
          ctx.font = 'bold 10px system-ui';
          ctx.textAlign = 'center';
          ctx.fillText(`-${mVal}`, fCenterX, zeroLineY + bH + 11);
        }
      });
      ctx.textAlign = 'left';
    };

    // Draw Plan 1
    drawPlanBlock(94, '🔷 СХЕМА 1: ПЕРВЫЙ ПЛАН (Vordergrund / актуальный)', '#2F4A3B', p1Scores);

    // Draw Plan 2 if enabled
    if (hasSecondPlan) {
      drawPlanBlock(420, '🔮 СХЕМА 2: ВТОРОЙ ПЛАН (Hintergrund / фоновый)', '#8C7B68', p2Scores);
    }

    // Footer
    ctx.fillStyle = '#7A857B';
    ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Метод портретных выборов Л. Сонди • Приложение Szondi Test', width / 2, height - 12);

    return canvas;
  }

  // --- Unified Share Execution Handler (Text + Canvas Image) ---
  async function executeShare(data) {
    const p1Scores = data.firstPlanScores || {};
    const p2Scores = data.secondPlanScores || null;
    const exploreSecondPlan = !!data.exploreSecondPlan;
    const dateStr = data.dateStr || new Date().toLocaleDateString('ru-RU');
    const note = (data.note || '').trim();

    const shareText = formatScoreDistributionText(p1Scores, p2Scores, exploreSecondPlan, dateStr, note);

    let base64Png = null;
    let canvasBlob = null;
    try {
      const canvas = renderResultsTableToCanvas(p1Scores, p2Scores, exploreSecondPlan, dateStr, note);
      if (canvas) {
        base64Png = canvas.toDataURL('image/png');
        if (canvas.toBlob) {
          canvasBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        }
      }
    } catch (e) {
      console.error('Error rendering table canvas image:', e);
    }

    // 1. Android Bridge with Image & Text support
    if (window.AndroidBridge && window.AndroidBridge.shareResultsWithImage && base64Png) {
      window.AndroidBridge.shareResultsWithImage(shareText, base64Png);
      return;
    }
    if (window.AndroidBridge && window.AndroidBridge.shareResults) {
      window.AndroidBridge.shareResults(shareText);
      return;
    }

    // 2. Web Share API (with file if supported)
    if (canvasBlob && navigator.share && navigator.canShare) {
      try {
        const file = new File([canvasBlob], 'szondi_profile.png', { type: 'image/png' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'Результаты теста Сонди (МПВ)',
            text: shareText,
            files: [file]
          });
          return;
        }
      } catch (err) {}
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Результаты теста Сонди (МПВ)',
          text: shareText
        });
        return;
      } catch (err) {}
    }

    // 3. Fallback: Copy to clipboard and download image
    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(shareText);
        if (base64Png) {
          const a = document.createElement('a');
          a.href = base64Png;
          a.download = `szondi_profile_${Date.now()}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
        showToast('Результаты скопированы', 'Текст с распределением баллов скопирован в буфер, таблица со шкалами сохранена картинкой.');
        return;
      } catch (err) {}
    }

    alert('Результаты теста:\n\n' + shareText);
  }

  // --- Share Results (Results Screen) ---
  async function saveSondiChartsImage() {
    const container = document.getElementById('results-schemes-container');
    if (!container) return;
    try {
      const selected = [];
      const first = document.querySelector('#szondi-chart-svg svg');
      if (first) selected.push({ svg: first, title: 'Схема профиля — первый план' });
      const secondCard = document.getElementById('chart-card-second-plan');
      const second = document.querySelector('#szondi-chart-svg-second svg');
      if (second && secondCard && getComputedStyle(secondCard).display !== 'none') {
        selected.push({ svg: second, title: 'Схема профиля — второй план' });
      }
      if (!selected.length) {
        showToast('Нет схем профиля', 'Сначала пройдите тест Сонди.');
        return;
      }

      const svgToImage = (svg) => {
        const clone = svg.cloneNode(true);
        clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        clone.setAttribute('width', '840');
        clone.setAttribute('height', '440');
        clone.style.width = '840px';
        clone.style.height = '440px';
        clone.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        const source = new XMLSerializer().serializeToString(clone);
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(source);
        });
      };

      const images = [];
      for (const item of selected) {
        images.push({ img: await svgToImage(item.svg), title: item.title });
      }

      const width = 1600;
      const margin = 64;
      const headerH = 84;
      const chartW = width - margin * 2;
      const chartH = Math.round(chartW * 440 / 840);
      const blockGap = 34;
      const height = margin + headerH + images.length * (chartH + 32 + blockGap) + margin;
      const canvas = document.createElement('canvas');
      const dpr = 2;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
      ctx.fillStyle = '#FAF8F2';
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = '#25352C';
      ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('Схемы профиля теста Сонди', margin, margin + 32);
      ctx.fillStyle = '#667267';
      ctx.font = '15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      const dateText = resultsDate ? resultsDate.innerText.replace(/\s+/g, ' ').trim() : '';
      ctx.fillText(dateText || 'Профиль результатов', margin, margin + 58);

      let y = margin + headerH;
      images.forEach(item => {
        ctx.fillStyle = '#2F4A3B';
        ctx.font = 'bold 19px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(item.title, margin, y + 20);
        y += 32;
        ctx.strokeStyle = 'rgba(37, 53, 44, 0.14)';
        ctx.lineWidth = 1;
        ctx.strokeRect(margin + 0.5, y + 0.5, chartW - 1, chartH - 1);
        ctx.drawImage(item.img, margin, y, chartW, chartH);
        y += chartH + blockGap;
      });

      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      const base64 = canvas.toDataURL('image/png');
      const filename = `sondi_charts_${Date.now()}.png`;
      // Save directly to the device Downloads folder. Do not open the share sheet.
      if (window.AndroidBridge && typeof window.AndroidBridge.saveImageToDownloads === 'function' && base64) {
        window.AndroidBridge.saveImageToDownloads(base64, filename);
        return;
      }

      if (!blob) {
        showToast('Не удалось сохранить изображение', 'Попробуйте ещё раз.');
        return;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1200);
      showToast('Изображение сохранено', 'Схемы профиля без интерпретации.');
    } catch (err) {
      console.error('Chart image export error:', err);
      showToast('Не удалось сохранить изображение', 'Попробуйте ещё раз.');
    }
  }

  function shareResults() {
    const dateFormatted = new Date().toLocaleDateString('ru-RU', { 
      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
    executeShare({
      firstPlanScores: state.firstPlanScores,
      secondPlanScores: state.secondPlanScores,
      exploreSecondPlan: state.exploreSecondPlan,
      dateStr: dateFormatted,
      note: state.testNote
    });
  }

  // --- Dedicated Handler: Send Results to Telegram @kms_psy ---
  async function sendToTelegramKms(data) {
    const p1Scores = data.firstPlanScores || {};
    const p2Scores = data.secondPlanScores || null;
    const exploreSecondPlan = !!data.exploreSecondPlan;
    const dateStr = data.dateStr || new Date().toLocaleDateString('ru-RU');
    const note = (data.note || '').trim();

    const shareText = formatScoreDistributionText(p1Scores, p2Scores, exploreSecondPlan, dateStr, note);

    let base64Png = null;
    try {
      const canvas = renderResultsTableToCanvas(p1Scores, p2Scores, exploreSecondPlan, dateStr, note);
      if (canvas) {
        base64Png = canvas.toDataURL('image/png');
      }
    } catch (e) {
      console.error('Error rendering table canvas image:', e);
    }

    // 1. Android Bridge with direct Telegram support
    if (window.AndroidBridge && window.AndroidBridge.sendToTelegram) {
      window.AndroidBridge.sendToTelegram('kms_psy', shareText, base64Png);
      return;
    }

    // 2. Web browser: copy text to clipboard, download profile image, and open Telegram chat
    let textCopied = false;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(shareText);
        textCopied = true;
      } catch (e) {}
    }

    if (base64Png) {
      try {
        const a = document.createElement('a');
        a.href = base64Png;
        a.download = `szondi_profile_kms_psy_${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } catch (e) {}
    }

    // Open Telegram URL (clean URL avoids browser and intent crashes)
    const tgUrl = `https://t.me/kms_psy`;
    window.open(tgUrl, '_blank');

    showToast(
      'Отправка в Telegram @kms_psy',
      textCopied
        ? 'Результаты теста скопированы в буфер обмена! Переходим в диалог с @kms_psy — просто вставьте скопированный текст и отправьте.'
        : 'Открываем диалог с @kms_psy в Telegram.'
    );
  }

  function sendResultsToTelegramKms() {
    const dateFormatted = new Date().toLocaleDateString('ru-RU', { 
      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
    sendToTelegramKms({
      firstPlanScores: state.firstPlanScores,
      secondPlanScores: state.secondPlanScores,
      exploreSecondPlan: state.exploreSecondPlan,
      dateStr: dateFormatted,
      note: state.testNote
    });
  }

  // --- Dedicated Handler: Send Results to MAX Messenger ---
  async function sendToMaxKms(data) {
    const p1Scores = data.firstPlanScores || {};
    const p2Scores = data.secondPlanScores || null;
    const exploreSecondPlan = !!data.exploreSecondPlan;
    const dateStr = data.dateStr || new Date().toLocaleDateString('ru-RU');
    const note = (data.note || '').trim();

    const shareText = formatScoreDistributionText(p1Scores, p2Scores, exploreSecondPlan, dateStr, note);

    let base64Png = null;
    try {
      const canvas = renderResultsTableToCanvas(p1Scores, p2Scores, exploreSecondPlan, dateStr, note);
      if (canvas) {
        base64Png = canvas.toDataURL('image/png');
      }
    } catch (e) {
      console.error('Error rendering table canvas image for MAX:', e);
    }

    // 1. Android Bridge with direct MAX support
    if (window.AndroidBridge && window.AndroidBridge.sendToMax) {
      window.AndroidBridge.sendToMax(MAX_EXPERT_URL, shareText, base64Png);
      return;
    }

    // 2. Web browser: copy text to clipboard, download profile image, and open MAX chat
    let textCopied = false;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(shareText);
        textCopied = true;
      } catch (e) {}
    }

    if (base64Png) {
      try {
        const a = document.createElement('a');
        a.href = base64Png;
        a.download = `szondi_profile_max_${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } catch (e) {}
    }

    // Open MAX URL in new window / app
    window.open(MAX_EXPERT_URL, '_blank');

    showToast(
      'Отправка в MAX',
      textCopied
        ? 'Результаты теста скопированы в буфер обмена! Переходим в MAX — просто вставьте скопированный текст в диалог с экспертом.'
        : 'Открываем диалог в MAX для связи с экспертом.'
    );
  }

  function sendResultsToMaxKms() {
    const dateFormatted = new Date().toLocaleDateString('ru-RU', { 
      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
    sendToMaxKms({
      firstPlanScores: state.firstPlanScores,
      secondPlanScores: state.secondPlanScores,
      exploreSecondPlan: state.exploreSecondPlan,
      dateStr: dateFormatted,
      note: state.testNote
    });
  }

  // --- History Management ---
  function getHistoryList() {
    try {
      if (window.AndroidBridge && window.AndroidBridge.getHistory) {
        const json = window.AndroidBridge.getHistory();
        if (json && json.trim() !== '') {
          return JSON.parse(json);
        }
      }
    } catch (e) {
      console.error('Bridge getHistory error:', e);
    }
    try {
      const local = localStorage.getItem('szondi_history_tests');
      return local ? JSON.parse(local) : [];
    } catch (e) {
      return [];
    }
  }

  function saveHistoryList(list) {
    try {
      const json = JSON.stringify(list);
      localStorage.setItem('szondi_history_tests', json);
      if (window.AndroidBridge && window.AndroidBridge.saveHistory) {
        window.AndroidBridge.saveHistory(json);
      }
    } catch (e) {
      console.error('Error saving history:', e);
    }
  }

  function formatScoresShortFormula(sc) {
    const factors = ['h', 's', 'e', 'hy', 'k', 'p', 'd', 'm'];
    return factors.map(f => `${f}+${sc[`${f}+`]}, ${f}-${sc[`${f}-`]}`).join(', ');
  }

  function saveTestToHistory(p1Scores, p2Scores) {
    const history = getHistoryList();
    const now = new Date();
    const dateStr = now.toLocaleDateString('ru-RU', {
      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const f1 = formatScoresShortFormula(p1Scores);
    const f2 = state.exploreSecondPlan ? formatScoresShortFormula(p2Scores) : '';

    const newEntry = {
      id: 'test_' + now.getTime(),
      timestamp: now.getTime(),
      dateStr: dateStr,
      note: (state.testNote || '').trim(),
      exploreSecondPlan: state.exploreSecondPlan,
      formula: state.exploreSecondPlan ? `I: ${f1} | II: ${f2}` : `I: ${f1}`,
      firstPlanScores: { ...p1Scores },
      secondPlanScores: state.exploreSecondPlan ? { ...p2Scores } : null,
      scores: { ...p1Scores } // for backwards compatibility
    };

    history.unshift(newEntry);
    if (history.length > 100) history.pop();
    saveHistoryList(history);
  }

  function renderHistoryScreen() {
    const history = getHistoryList();
    if (!historyListContainer) return;

    if (historyCount) {
      historyCount.textContent = `Сохранено тестов: ${history.length}`;
    }
    historyListContainer.innerHTML = '';

    if (history.length === 0) {
      historyListContainer.innerHTML = `
        <div class="history-empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom: 12px; opacity: 0.5;">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          <h3 style="font-size: 18px; margin-bottom: 6px; color: #25352C;">История тестирований пуста</h3>
          <p>Пройдите тест Сонди, и результаты каждого тестирования сохранятся здесь автоматически.</p>
        </div>
      `;
      return;
    }

    history.forEach((item, index) => {
      const card = document.createElement('div');
      card.className = 'history-card';

      const sc1 = item.firstPlanScores || item.scores;
      const sc2 = item.secondPlanScores || item.scores;

      const sVal1 = `h: +${sc1['h+']}/-${sc1['h-']}, s: +${sc1['s+']}/-${sc1['s-']}`;
      const pVal1 = `e: +${sc1['e+']}/-${sc1['e-']}, hy: +${sc1['hy+']}/-${sc1['hy-']}`;

      const noteHtml = item.note ? `
        <div class="history-note-card">
          <span class="history-note-icon">📝</span>
          <span class="history-note-body">${escapeHtml(item.note)}</span>
        </div>
      ` : '';

      card.innerHTML = `
        <div class="history-card-header">
          <span class="history-card-date">Тест #${history.length - index} • ${item.dateStr}</span>
          <span style="font-size: 12px; color: #667267;">${new Date(item.timestamp).toLocaleDateString()}</span>
        </div>
        ${noteHtml}
        <div class="history-formula-badge" style="font-size: 12px; line-height: 1.5;">
          ${item.formula}
        </div>
        <div class="history-vectors-summary">
          <div class="history-vector-chip"><strong>I план S (Либидо):</strong> ${sVal1}</div>
          <div class="history-vector-chip"><strong>I план P (Аффект):</strong> ${pVal1}</div>
        </div>
        <div class="history-card-actions">
          <button class="btn-primary btn-view-history" data-id="${item.id}" style="padding: 8px 18px; font-size: 13px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            <span>${item.exploreSecondPlan === false ? 'Посмотреть результаты' : 'Посмотреть обе схемы'}</span>
          </button>
          <button class="btn-max-history" data-id="${item.id}" style="padding: 8px 14px; font-size: 13px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4 4h16a2 2 0 012 2v10a2 2 0 01-2 2H6l-4 4V6a2 2 0 012-2z"/>
            </svg>
            <span>В MAX</span>
          </button>
          <button class="btn-telegram-history" data-id="${item.id}" style="padding: 8px 14px; font-size: 13px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
            </svg>
            <span>В Telegram @kms_psy</span>
          </button>
          <button class="btn-secondary btn-share-history" data-id="${item.id}" style="padding: 8px 14px; font-size: 13px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="18" cy="5" r="3"></circle>
              <circle cx="6" cy="12" r="3"></circle>
              <circle cx="18" cy="19" r="3"></circle>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
            </svg>
            <span>Поделиться</span>
          </button>
          <button class="btn-secondary btn-delete-history" data-id="${item.id}" style="padding: 8px 12px; font-size: 13px; color: #C98A78;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
            </svg>
            <span>Удалить</span>
          </button>
        </div>
      `;

      historyListContainer.appendChild(card);
    });

    // Wire buttons
    document.querySelectorAll('.btn-view-history').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        const item = history.find(h => h.id === id);
        if (item) {
          loadAndDisplayHistoricalTest(item);
        }
      });
    });

    document.querySelectorAll('.btn-max-history').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        const item = history.find(h => h.id === id);
        if (item) {
          sendToMaxKms({
            firstPlanScores: item.firstPlanScores || item.scores,
            secondPlanScores: item.secondPlanScores,
            exploreSecondPlan: item.exploreSecondPlan !== false && !!item.secondPlanScores,
            dateStr: item.dateStr,
            note: item.note
          });
        }
      });
    });

    document.querySelectorAll('.btn-telegram-history').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        const item = history.find(h => h.id === id);
        if (item) {
          sendToTelegramKms({
            firstPlanScores: item.firstPlanScores || item.scores,
            secondPlanScores: item.secondPlanScores,
            exploreSecondPlan: item.exploreSecondPlan !== false && !!item.secondPlanScores,
            dateStr: item.dateStr,
            note: item.note
          });
        }
      });
    });

    document.querySelectorAll('.btn-share-history').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        const item = history.find(h => h.id === id);
        if (item) {
          shareHistoryItem(item);
        }
      });
    });

    document.querySelectorAll('.btn-delete-history').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        const item = history.find(h => h.id === id);
        const dateText = item ? item.dateStr : 'эту запись';
        showConfirmModal({
          title: 'Удалить результат тестирования?',
          message: `Вы уверены, что хотите удалить результат от <strong>${dateText}</strong>? Это действие нельзя будет отменить.`,
          confirmText: 'Удалить',
          onConfirm: () => {
            const updated = history.filter(h => h.id !== id);
            saveHistoryList(updated);
            renderHistoryScreen();
          }
        });
      });
    });
  }

  function loadAndDisplayHistoricalTest(item) {
    state.exploreSecondPlan = item.exploreSecondPlan !== false && !!item.secondPlanScores;
    state.firstPlanScores = { ...(item.firstPlanScores || item.scores) };
    state.secondPlanScores = item.secondPlanScores ? { ...item.secondPlanScores } : {};
    state.scores = { ...state.firstPlanScores };
    state.testNote = item.note || '';

    resultsDate.textContent = `Дата прохождения: ${item.dateStr}`;

    if (resultsNoteCard && resultsNoteText) {
      if (state.testNote) {
        resultsNoteText.textContent = state.testNote;
        resultsNoteCard.style.display = 'inline-flex';
      } else {
        resultsNoteCard.style.display = 'none';
      }
    }

    generateSzondiSvg(state.firstPlanScores, 'szondi-chart-svg', 'Схема профиля - первый план', '#2F4A3B');

    const chartCardSecond = document.getElementById('chart-card-second-plan');
    if (chartCardSecond) {
      chartCardSecond.style.display = state.exploreSecondPlan ? 'block' : 'none';
    }
    if (state.exploreSecondPlan) {
      generateSzondiSvg(state.secondPlanScores, 'szondi-chart-svg-second', 'Схема профиля - второй план', '#8C7B68');
    }

    render16ScalesGrid();
    renderSondiBrief();
    // renderSobchikInterpretation();
    // renderSzondiClassicalInterpretation();
    // renderFateAnalysis();

    // Reset to first tab (Schemes)
    const firstTabBtn = document.querySelector('.results-tab-btn[data-tab="tab-schemes"]');
    if (firstTabBtn) firstTabBtn.click();

    showScreen(screenResults);
  }

  function shareHistoryItem(item) {
    executeShare({
      firstPlanScores: item.firstPlanScores || item.scores,
      secondPlanScores: item.secondPlanScores,
      exploreSecondPlan: item.exploreSecondPlan !== false && !!item.secondPlanScores,
      dateStr: item.dateStr,
      note: item.note
    });
  }

  // =========================================================================
  // MODULE 2, 3, 4, 5: STUDIO-GRADE ACOUSTIC SOUND ENGINE
  // Физическое моделирование реальных акустических инструментов:
  // 1. Стерео-конволюционный ревербератор (ConvolverNode) — акустика священного храма / медитативного зала
  // 2. Тибетские поющие чаши (бронза) — бинауральное расщепление близких частот (биений ~0.85 Гц) + негармонические моды + войлочный удар
  // 3. Африканская калимба (деревянная дека + стальные язычки) — щипковый импульс + резонанс полого резонатора (380 Гц)
  // 4. Дзен-флейта сякухати (бамбук) — турбулентный шум дыхания + гармонический обертоновый спектр + задержанное вибрато
  // =========================================================================
  class AcousticSoundPlayer {
    constructor() {
      this.ctx = null;
      this.masterGain = null;
      this.limiter = null;
      this.warmthFilter = null;
      this.dryGain = null;
      this.wetGain = null;
      this.malletBuffer = null;
      this.pinkNoiseBuffer = null;
      this.isEnabled = true;
      this.theme = 'bowls'; // 'bowls' | 'kalimba' | 'harp' | 'koshi' | 'rain'
    }

    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          try {
            // Strict 48000 Hz sample rate as requested for studio-grade, glitch-free audio
            this.ctx = new AudioCtx({ sampleRate: 48000, latencyHint: 'playback' });
          } catch (e) {
            try {
              this.ctx = new AudioCtx({ sampleRate: 48000 });
            } catch (e2) {
              this.ctx = new AudioCtx();
            }
          }
          this._initAcousticMasterBus();
          this._initPrecomputedBuffers();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    _initAcousticMasterBus() {
      if (!this.ctx) return;
      try {
        const now = this.ctx.currentTime;

        // 1. Transparent Safety Limiter (gentle 25ms attack prevents cycle distortion on bass tones)
        this.limiter = this.ctx.createDynamicsCompressor();
        this.limiter.threshold.setValueAtTime(-1.5, now);
        this.limiter.knee.setValueAtTime(10.0, now);
        this.limiter.ratio.setValueAtTime(4.0, now);
        this.limiter.attack.setValueAtTime(0.025, now);
        this.limiter.release.setValueAtTime(0.20, now);
        this.limiter.connect(this.ctx.destination);

        // 2. Silky Warmth Filter (cuts harsh digital high frequencies > 7500 Hz)
        this.warmthFilter = this.ctx.createBiquadFilter();
        this.warmthFilter.type = 'lowpass';
        this.warmthFilter.frequency.setValueAtTime(7500, now);
        this.warmthFilter.Q.setValueAtTime(0.707, now);
        this.warmthFilter.connect(this.limiter);

        // 3. Pristine Master Bus Gain (clean 0.76 level, NO comb delays, NO interference)
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.76, now);
        this.masterGain.connect(this.warmthFilter);
      } catch (err) {
        // Direct routing fallback
      }
    }

    _initPrecomputedBuffers() {
      if (!this.ctx) return;
      try {
        const sr = this.ctx.sampleRate;
        // Pre-allocate rain pink noise bed (2.5s)
        const rainLen = Math.floor(sr * 2.5);
        this.pinkNoiseBuffer = this.ctx.createBuffer(1, rainLen, sr);
        const rainData = this.pinkNoiseBuffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0;
        for (let i = 0; i < rainLen; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          rainData[i] = (b0 + b1 + b2) * 0.08;
        }
      } catch (e) {}
    }

    _route(node) {
      if (!this.ctx) return;
      if (this.masterGain) {
        node.connect(this.masterGain);
      } else {
        node.connect(this.ctx.destination);
      }
    }

    setTheme(newTheme) {
      this.theme = newTheme;
    }

    /**
     * Tibetan Singing Bowl (Бронзовая тибетская чаша)
     * Чистый акустический гармонический синтез без шумовых щелчков и артефактов
     */
    playSingingBowl(freq, duration = 3.8, peakGain = 0.18) {
      if (!this.isEnabled) return;
      try {
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        const instrumentGain = this.ctx.createGain();
        instrumentGain.gain.setValueAtTime(0.0001, now);
        // Soft felt attack (0.07s) gives a completely silky, non-clicking entry
        instrumentGain.gain.linearRampToValueAtTime(peakGain, now + 0.07);
        instrumentGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        this._route(instrumentGain);

        // 1. Warm Fundamental sine wave
        const osc1 = this.ctx.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(freq, now);
        const g1 = this.ctx.createGain();
        g1.gain.setValueAtTime(0.65, now);
        osc1.connect(g1);
        g1.connect(instrumentGain);
        osc1.start(now);
        osc1.stop(now + duration + 0.05);

        // 2. Harmonic warm overtone (Octave 2x)
        const osc2 = this.ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(freq * 2.0, now);
        const g2 = this.ctx.createGain();
        g2.gain.setValueAtTime(0.0001, now);
        g2.gain.linearRampToValueAtTime(0.18, now + 0.06);
        g2.gain.exponentialRampToValueAtTime(0.0001, now + duration * 0.7);
        osc2.connect(g2);
        g2.connect(instrumentGain);
        osc2.start(now);
        osc2.stop(now + duration * 0.7 + 0.05);

        // 3. Subtle third harmonic (3x) for organic bronze resonance
        if (freq * 3.0 < 3000) {
          const osc3 = this.ctx.createOscillator();
          osc3.type = 'sine';
          osc3.frequency.setValueAtTime(freq * 3.0, now);
          const g3 = this.ctx.createGain();
          g3.gain.setValueAtTime(0.0001, now);
          g3.gain.linearRampToValueAtTime(0.06, now + 0.05);
          g3.gain.exponentialRampToValueAtTime(0.0001, now + duration * 0.45);
          osc3.connect(g3);
          g3.connect(instrumentGain);
          osc3.start(now);
          osc3.stop(now + duration * 0.45 + 0.05);
        }
      } catch (e) {}
    }

    /**
     * African Wooden Kalimba (Калимба с деревянным полым корпусом)
     * - Thumb tine pluck click & initial micro-pitch bend
     * - Inharmonic tine overtones (cantilever metal bar 2.81x)
     * - Hollow wooden box body resonance (380 Hz bandpass cavity)
     */
    playKalimba(freq, duration = 1.3, peakGain = 0.18) {
      if (!this.isEnabled) return;
      try {
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        const instrumentGain = this.ctx.createGain();
        instrumentGain.gain.setValueAtTime(0.0001, now);
        instrumentGain.gain.linearRampToValueAtTime(peakGain, now + 0.008);
        instrumentGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        this._route(instrumentGain);

        // 1. Tine Fundamental with micro-pitch drop (tine tension relaxation)
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq * 1.02, now);
        osc.frequency.exponentialRampToValueAtTime(freq, now + 0.022);

        const oscFilter = this.ctx.createBiquadFilter();
        oscFilter.type = 'lowpass';
        oscFilter.frequency.setValueAtTime(1400, now);
        oscFilter.frequency.exponentialRampToValueAtTime(450, now + duration);

        osc.connect(oscFilter);
        oscFilter.connect(instrumentGain);
        osc.start(now);
        osc.stop(now + duration + 0.05);

        // 2. High Metallic Tine Ping (2.81x overtone)
        const tineMode = this.ctx.createOscillator();
        tineMode.type = 'sine';
        tineMode.frequency.setValueAtTime(freq * 2.81, now);
        const tineGain = this.ctx.createGain();
        tineGain.gain.setValueAtTime(0.0001, now);
        tineGain.gain.linearRampToValueAtTime(0.16, now + 0.006);
        tineGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
        tineMode.connect(tineGain);
        tineGain.connect(instrumentGain);
        tineMode.start(now);
        tineMode.stop(now + 0.24);

        // 3. Wooden Body Cavity Resonance (Hollow soundbox hum ~380 Hz)
        const bodyRes = this.ctx.createBiquadFilter();
        bodyRes.type = 'bandpass';
        bodyRes.frequency.setValueAtTime(380, now);
        bodyRes.Q.setValueAtTime(3.0, now);

        const bodyGain = this.ctx.createGain();
        bodyGain.gain.setValueAtTime(0.0001, now);
        bodyGain.gain.linearRampToValueAtTime(0.14, now + 0.01);
        bodyGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.40);

        osc.connect(bodyRes);
        bodyRes.connect(bodyGain);
        bodyGain.connect(instrumentGain);
      } catch (e) {}
    }

    /**
     * Relaxing Harp (Небесная арфа — расслабляющие струны, заменила флейту)
     */
    playHarp(freq, duration = 2.4, peakGain = 0.22) {
      if (!this.isEnabled) return;
      try {
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        const instrumentGain = this.ctx.createGain();
        instrumentGain.gain.setValueAtTime(0.0001, now);
        instrumentGain.gain.linearRampToValueAtTime(peakGain, now + 0.015);
        instrumentGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        this._route(instrumentGain);

        // Plucked fundamental string
        const osc = this.ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        // 2nd octave harmonic
        const osc2 = this.ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(freq * 2, now);
        const g2 = this.ctx.createGain();
        g2.gain.setValueAtTime(0.32, now);
        g2.gain.exponentialRampToValueAtTime(0.0001, now + duration * 0.7);
        osc2.connect(g2);
        g2.connect(instrumentGain);
        osc2.start(now);
        osc2.stop(now + duration);

        // 3rd harmonic
        const osc3 = this.ctx.createOscillator();
        osc3.type = 'sine';
        osc3.frequency.setValueAtTime(freq * 3, now);
        const g3 = this.ctx.createGain();
        g3.gain.setValueAtTime(0.12, now);
        g3.gain.exponentialRampToValueAtTime(0.0001, now + duration * 0.45);
        osc3.connect(g3);
        g3.connect(instrumentGain);
        osc3.start(now);
        osc3.stop(now + duration);

        // Body resonance filter
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2600, now);
        filter.frequency.exponentialRampToValueAtTime(650, now + duration);

        osc.connect(filter);
        filter.connect(instrumentGain);
        osc.start(now);
        osc.stop(now + duration + 0.05);
      } catch (e) {}
    }

    /**
     * Koshi Wind Chimes (Колокольчики Коши — хрустальные серебряные обертоны)
     */
    playKoshi(freq, duration = 3.2, peakGain = 0.18) {
      if (!this.isEnabled) return;
      try {
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        const instrumentGain = this.ctx.createGain();
        instrumentGain.gain.setValueAtTime(0.0001, now);
        instrumentGain.gain.linearRampToValueAtTime(peakGain, now + 0.008);
        instrumentGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        this._route(instrumentGain);

        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        const oscOver = this.ctx.createOscillator();
        oscOver.type = 'sine';
        oscOver.frequency.setValueAtTime(freq * 2.756, now);
        const gOver = this.ctx.createGain();
        gOver.gain.setValueAtTime(0.28, now);
        gOver.gain.exponentialRampToValueAtTime(0.0001, now + duration * 0.85);
        oscOver.connect(gOver);
        gOver.connect(instrumentGain);
        oscOver.start(now);
        oscOver.stop(now + duration);

        const oscShim = this.ctx.createOscillator();
        oscShim.type = 'sine';
        oscShim.frequency.setValueAtTime(freq * 5.404, now);
        const gShim = this.ctx.createGain();
        gShim.gain.setValueAtTime(0.10, now);
        gShim.gain.exponentialRampToValueAtTime(0.0001, now + duration * 0.45);
        oscShim.connect(gShim);
        gShim.connect(instrumentGain);
        oscShim.start(now);
        oscShim.stop(now + duration);

        osc.connect(instrumentGain);
        osc.start(now);
        osc.stop(now + duration + 0.05);
      } catch (e) {}
    }

    /**
     * Meditative Rain (Медитативный теплый дождь с каплями)
     */
    playRain(type) {
      if (!this.isEnabled) return;
      try {
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const duration = (type === 'inhale' || type === 'exhale') ? 3.0 : 2.0;

        if (this.pinkNoiseBuffer) {
          const noiseSource = this.ctx.createBufferSource();
          noiseSource.buffer = this.pinkNoiseBuffer;

          const rainFilter = this.ctx.createBiquadFilter();
          rainFilter.type = 'bandpass';
          rainFilter.frequency.setValueAtTime(1300, now);
          rainFilter.Q.setValueAtTime(0.7, now);

          const rainGain = this.ctx.createGain();
          rainGain.gain.setValueAtTime(0.0001, now);
          rainGain.gain.linearRampToValueAtTime(0.10, now + 0.3);
          rainGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

          noiseSource.connect(rainFilter);
          rainFilter.connect(rainGain);
          this._route(rainGain);
          noiseSource.start(now);
        }

        // Zen water droplet notes
        const dropFreq = type === 'inhale' ? 784.0 : (type === 'exhale' ? 523.2 : 659.2);
        this.playKalimba(dropFreq, 1.0, 0.14);
        if (type === 'complete') {
          setTimeout(() => this.playKalimba(659.2, 1.0, 0.12), 220);
          setTimeout(() => this.playKalimba(784.0, 1.2, 0.13), 440);
          setTimeout(() => this.playKalimba(1046.5, 1.4, 0.14), 660);
        }
      } catch (e) {}
    }

    _playAsset(filename) {
      if (!this.isEnabled) return false;
      try {
        const audio = new Audio('audio/' + filename);
        audio.volume = 0.95;
        const p = audio.play();
        if (p && typeof p.catch === 'function') {
          p.catch(() => {});
        }
        return true;
      } catch (e) {
        return false;
      }
    }

    playSample(theme) {
      if (!this.isEnabled) return;
      if (theme === 'bowls') {
        this.playSingingBowl(329.6, 3.2, 0.20);
      } else if (theme === 'kalimba') {
        this.playKalimba(523.2, 1.4, 0.18);
      } else if (theme === 'harp') {
        this.playHarp(523.2, 2.2, 0.20);
        setTimeout(() => this.playHarp(659.2, 2.2, 0.18), 160);
      } else if (theme === 'koshi') {
        this.playKoshi(880.0, 2.8, 0.16);
        setTimeout(() => this.playKoshi(1046.5, 2.6, 0.15), 160);
      } else if (theme === 'rain') {
        this.playRain('inhale');
      }
    }

    playChime(pitch = 392) {
      if (!this.isEnabled) return;
      this.playKalimba(pitch, 0.8, 0.16);
    }

    play(type) {
      if (!this.isEnabled) return;

      // Pure procedural Web Audio synthesis for 100% reliable sound playback without asset drops
      if (this.theme === 'bowls') {
        if (type === 'inhale') {
          this.playSingingBowl(329.6, 3.8, 0.20);
        } else if (type === 'hold-in' || type === 'hold-out') {
          this.playSingingBowl(392.0, 3.2, 0.16);
        } else if (type === 'exhale') {
          this.playSingingBowl(261.6, 4.0, 0.20);
        } else if (type === 'complete') {
          // Harmonious celebratory ending chord - gently voiced, zero interference
          this.playSingingBowl(261.6, 3.8, 0.14);
          setTimeout(() => this.playSingingBowl(329.6, 3.6, 0.13), 320);
          setTimeout(() => this.playSingingBowl(392.0, 3.4, 0.12), 640);
          setTimeout(() => this.playSingingBowl(523.2, 3.8, 0.12), 960);
        }
      } else if (this.theme === 'kalimba') {
        if (type === 'inhale') {
          this.playKalimba(523.2, 1.4, 0.18);
          setTimeout(() => this.playKalimba(392.0, 1.2, 0.14), 140);
        } else if (type === 'hold-in' || type === 'hold-out') {
          this.playKalimba(349.2, 1.2, 0.15);
        } else if (type === 'exhale') {
          this.playKalimba(261.6, 1.6, 0.18);
        } else if (type === 'complete') {
          this.playKalimba(261.6, 1.4, 0.15);
          setTimeout(() => this.playKalimba(329.6, 1.4, 0.14), 180);
          setTimeout(() => this.playKalimba(392.0, 1.4, 0.14), 360);
          setTimeout(() => this.playKalimba(523.2, 1.6, 0.15), 540);
        }
      } else if (this.theme === 'harp') {
        if (type === 'inhale') {
          this.playHarp(392.0, 2.8, 0.18);
          setTimeout(() => this.playHarp(523.2, 2.6, 0.16), 160);
        } else if (type === 'hold-in' || type === 'hold-out') {
          this.playHarp(659.2, 2.4, 0.15);
        } else if (type === 'exhale') {
          this.playHarp(523.2, 2.8, 0.18);
          setTimeout(() => this.playHarp(392.0, 2.6, 0.15), 180);
          setTimeout(() => this.playHarp(261.6, 2.8, 0.16), 360);
        } else if (type === 'complete') {
          this.playHarp(261.6, 2.6, 0.14);
          setTimeout(() => this.playHarp(329.6, 2.6, 0.13), 180);
          setTimeout(() => this.playHarp(392.0, 2.6, 0.13), 360);
          setTimeout(() => this.playHarp(493.9, 2.6, 0.13), 540);
          setTimeout(() => this.playHarp(523.2, 3.0, 0.15), 720);
        }
      } else if (this.theme === 'koshi') {
        if (type === 'inhale') {
          this.playKoshi(880.0, 3.2, 0.16);
          setTimeout(() => this.playKoshi(1318.5, 2.8, 0.13), 180);
        } else if (type === 'hold-in' || type === 'hold-out') {
          this.playKoshi(1046.5, 2.8, 0.14);
        } else if (type === 'exhale') {
          this.playKoshi(698.5, 3.0, 0.16);
          setTimeout(() => this.playKoshi(523.2, 3.0, 0.15), 200);
        } else if (type === 'complete') {
          this.playKoshi(523.2, 2.6, 0.13);
          setTimeout(() => this.playKoshi(659.2, 2.6, 0.13), 180);
          setTimeout(() => this.playKoshi(784.0, 2.6, 0.13), 360);
          setTimeout(() => this.playKoshi(880.0, 2.6, 0.13), 540);
          setTimeout(() => this.playKoshi(1046.5, 3.0, 0.15), 720);
        }
      } else if (this.theme === 'rain') {
        this.playRain(type);
      }
    }
  }

  // Application Shared Audio Player (Isolated Service)
  const appAudio = new AcousticSoundPlayer();
  window.appAudio = appAudio;
  const breathingAudio = appAudio; // Alias for breathing relaxation module
  window.breathingAudio = appAudio; // Backward compatibility

  // Global Audio Unlock Listener (fixes mobile and WebView silence on first interaction)
  function unlockGlobalAudio() {
    if (appAudio) appAudio.init();
  }
  ['touchstart', 'touchend', 'mousedown', 'pointerdown', 'keydown'].forEach(evt => {
    window.addEventListener(evt, unlockGlobalAudio, { once: true, passive: true });
  });

  function triggerBreathingHaptic(type) {
    if (navigator.vibrate) {
      try {
        if (type === 'inhale') navigator.vibrate([40, 50, 40]);
        else if (type === 'hold-in' || type === 'hold-out') navigator.vibrate(35);
        else if (type === 'exhale') navigator.vibrate([60, 40, 30]);
        else if (type === 'complete') navigator.vibrate([80, 100, 80, 100, 120]);
      } catch (e) {}
    }
  }

  // Breathing State
  const breathingState = {
    techniqueId: '478',
    targetCycles: 4,
    currentCycle: 1,
    phaseIndex: 0,
    isRunning: false,
    isPaused: false,
    elapsedPhaseSeconds: 0,
    phaseDuration: 4,
    totalElapsedSeconds: 0,
    timerId: null,
    animId: null,
    clockId: null,
    vibeEnabled: true,
    soundEnabled: true,
    initialized: false
  };

  const CIRCLE_CIRCUMFERENCE = 722.56;

  // DOM references for breathing
  const breathingTechniquesList = document.getElementById('breathing-techniques-list');
  const breathingPhasePills = document.getElementById('breathing-phase-pills');
  const breathingTrackProgress = document.getElementById('breathing-track-progress');
  const breathingCircleInner = document.getElementById('breathing-circle-inner');
  const breathingPhaseName = document.getElementById('breathing-phase-name');
  const breathingCountdown = document.getElementById('breathing-countdown');
  const breathingPhaseHint = document.getElementById('breathing-phase-hint');
  const breathingCycleDisplay = document.getElementById('breathing-cycle-display');
  const breathingTimeDisplay = document.getElementById('breathing-time-display');
  const breathingTargetCycles = document.getElementById('breathing-target-cycles');
  const btnBreathingToggle = document.getElementById('btn-breathing-toggle');
  const breathingBtnIcon = document.getElementById('breathing-btn-icon');
  const breathingBtnLabel = document.getElementById('breathing-btn-label');
  const btnBreathingReset = document.getElementById('btn-breathing-reset');
  const btnBreathingSound = document.getElementById('btn-breathing-sound');
  const breathingSoundIcon = document.getElementById('breathing-sound-icon');
  const btnBreathingVibe = document.getElementById('btn-breathing-vibe');
  const breathingVibeIcon = document.getElementById('breathing-vibe-icon');
  const btnBreathingGuide = document.getElementById('btn-breathing-guide');
  const modalBreathingGuide = document.getElementById('modal-breathing-guide');
  const modalBtnGuideClose = document.getElementById('modal-btn-guide-close');

  const breathingInfoCat = document.getElementById('breathing-info-cat');
  const breathingInfoTitle = document.getElementById('breathing-info-title');
  const breathingInfoFormulaPills = document.getElementById('breathing-info-formula-pills');
  const breathingInfoDesc = document.getElementById('breathing-info-desc');
  const breathingInfoBenefits = document.getElementById('breathing-info-benefits');

  function getCurrentBreathingTechnique() {
    if (typeof BREATHING_TECHNIQUES === 'undefined') return null;
    return BREATHING_TECHNIQUES.find(t => t.id === breathingState.techniqueId) || BREATHING_TECHNIQUES[0];
  }

  function initBreathingModule() {
    if (!breathingState.initialized) {
      renderBreathingTechniqueChips();
      setupBreathingControls();
      breathingState.initialized = true;
    }
    applyBreathingTechnique(breathingState.techniqueId, false);
  }

  function renderBreathingTechniqueChips() {
    if (!breathingTechniquesList || typeof BREATHING_TECHNIQUES === 'undefined') return;
    breathingTechniquesList.innerHTML = '';

    BREATHING_TECHNIQUES.forEach(tech => {
      const chip = document.createElement('div');
      chip.className = `technique-chip ${tech.id === breathingState.techniqueId ? 'active' : ''}`;
      chip.setAttribute('data-tech-id', tech.id);
      chip.innerHTML = `
        <div class="technique-chip-top">
          <span class="technique-chip-name">${tech.shortName}</span>
          <span class="technique-chip-badge">${tech.category}</span>
        </div>
        <span class="technique-chip-formula">${tech.formula}</span>
      `;
      chip.addEventListener('click', () => {
        if (breathingState.isRunning) {
          stopBreathingSession();
        }
        applyBreathingTechnique(tech.id, true);
      });
      breathingTechniquesList.appendChild(chip);
    });
  }

  function applyBreathingTechnique(techId, autoScroll = false) {
    breathingState.techniqueId = techId;
    const tech = getCurrentBreathingTechnique();
    if (!tech) return;

    breathingState.targetCycles = tech.defaultCycles || 4;

    // Update active chip
    document.querySelectorAll('.technique-chip').forEach(chip => {
      if (chip.getAttribute('data-tech-id') === techId) {
        chip.classList.add('active');
        if (autoScroll) {
          chip.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
      } else {
        chip.classList.remove('active');
      }
    });

    // Update target cycles buttons
    if (breathingTargetCycles) {
      breathingTargetCycles.querySelectorAll('.target-cycle-btn').forEach(btn => {
        const c = parseInt(btn.getAttribute('data-cycles'), 10);
        if (c === breathingState.targetCycles) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
    }

    // Update Educational Card
    if (breathingInfoCat) breathingInfoCat.textContent = tech.category;
    if (breathingInfoTitle) breathingInfoTitle.textContent = tech.name;
    if (breathingInfoDesc) breathingInfoDesc.textContent = tech.desc;
    if (breathingInfoBenefits) {
      breathingInfoBenefits.innerHTML = `<strong>Эффект:</strong> ${tech.benefits}`;
    }
    if (breathingInfoFormulaPills) {
      breathingInfoFormulaPills.innerHTML = tech.pattern.map(p => `
        <span class="timing-formula-pill" style="border-color: ${p.color}; color: ${p.color};">
          ${p.name} ${p.duration}с
        </span>
      `).join('');
    }

    // Update phase indicators
    if (breathingPhasePills) {
      breathingPhasePills.innerHTML = tech.pattern.map((p, idx) => `
        <span class="phase-step-pill ${idx === 0 ? 'active' : ''}" data-idx="${idx}">
          ${p.name} ${p.duration}с
        </span>
      `).join('');
    }

    // Reset visualizer to Idle state
    resetBreathingVisualizer();
  }

  function resetBreathingVisualizer() {
    if (breathingState.animId) {
      cancelAnimationFrame(breathingState.animId);
      breathingState.animId = null;
    }
    const tech = getCurrentBreathingTechnique();
    if (!tech) return;

    breathingState.currentCycle = 1;
    breathingState.phaseIndex = 0;
    breathingState.elapsedPhaseSeconds = 0;
    breathingState.totalElapsedSeconds = 0;

    if (breathingPhaseName) {
      breathingPhaseName.textContent = 'ГОТОВЫ?';
      breathingPhaseName.style.color = '#2F4A3B';
    }
    if (breathingCountdown) breathingCountdown.textContent = '—';
    if (breathingPhaseHint) breathingPhaseHint.textContent = 'Нажмите «Начать практику»';
    if (breathingCycleDisplay) {
      const targetStr = breathingState.targetCycles === 0 ? '∞' : breathingState.targetCycles;
      breathingCycleDisplay.textContent = `1 / ${targetStr}`;
    }
    if (breathingTimeDisplay) breathingTimeDisplay.textContent = '00:00';

    if (breathingCircleInner) {
      breathingCircleInner.className = 'breathing-circle-inner';
      breathingCircleInner.style.transform = 'scale(1)';
      breathingCircleInner.style.transition = 'transform 0.4s ease-out';
    }
    if (breathingTrackProgress) {
      breathingTrackProgress.style.strokeDashoffset = `${CIRCLE_CIRCUMFERENCE}`;
    }

    updatePhasePillActive(0);

    if (btnBreathingToggle) {
      btnBreathingToggle.classList.remove('is-active');
      if (breathingBtnIcon) breathingBtnIcon.textContent = '▶';
      if (breathingBtnLabel) breathingBtnLabel.textContent = 'Начать практику';
    }
  }

  function updatePhasePillActive(index) {
    if (!breathingPhasePills) return;
    const pills = breathingPhasePills.querySelectorAll('.phase-step-pill');
    pills.forEach((p, idx) => {
      if (idx === index) p.classList.add('active');
      else p.classList.remove('active');
    });
  }

  function startBreathingSession() {
    breathingAudio.init();
    breathingState.isRunning = true;
    breathingState.isPaused = false;

    if (btnBreathingToggle) {
      btnBreathingToggle.classList.add('is-active');
      if (breathingBtnIcon) breathingBtnIcon.textContent = '⏸';
      if (breathingBtnLabel) breathingBtnLabel.textContent = 'Пауза';
    }

    startCurrentPhase();
    startSessionClock();
  }

  function pauseBreathingSession() {
    breathingState.isPaused = true;
    if (breathingState.animId) {
      cancelAnimationFrame(breathingState.animId);
      breathingState.animId = null;
    }
    if (breathingState.timerId) clearInterval(breathingState.timerId);
    if (breathingState.clockId) clearInterval(breathingState.clockId);

    if (btnBreathingToggle) {
      btnBreathingToggle.classList.remove('is-active');
      if (breathingBtnIcon) breathingBtnIcon.textContent = '▶';
      if (breathingBtnLabel) breathingBtnLabel.textContent = 'Продолжить';
    }
    if (breathingPhaseHint) breathingPhaseHint.textContent = 'Практика на паузе';
  }

  function resumeBreathingSession() {
    breathingState.isPaused = false;
    if (btnBreathingToggle) {
      btnBreathingToggle.classList.add('is-active');
      if (breathingBtnIcon) breathingBtnIcon.textContent = '⏸';
      if (breathingBtnLabel) breathingBtnLabel.textContent = 'Пауза';
    }
    continueCurrentPhase();
    startSessionClock();
  }

  function stopBreathingSession() {
    breathingState.isRunning = false;
    breathingState.isPaused = false;
    if (breathingState.animId) {
      cancelAnimationFrame(breathingState.animId);
      breathingState.animId = null;
    }
    if (breathingState.timerId) clearInterval(breathingState.timerId);
    if (breathingState.clockId) clearInterval(breathingState.clockId);
    resetBreathingVisualizer();
  }

  function startCurrentPhase() {
    const tech = getCurrentBreathingTechnique();
    if (!tech) return;

    const phase = tech.pattern[breathingState.phaseIndex];
    if (!phase) return;

    breathingState.phaseDuration = phase.duration;
    breathingState.elapsedPhaseSeconds = 0;

    // Audio & Haptic feedback
    breathingAudio.play(phase.type);
    if (breathingState.vibeEnabled) {
      triggerBreathingHaptic(phase.type);
    }

    // Phase label & hint
    if (breathingPhaseName) {
      breathingPhaseName.textContent = phase.name.toUpperCase();
      breathingPhaseName.style.color = phase.color || '#2F4A3B';
    }
    if (breathingCountdown) {
      breathingCountdown.textContent = phase.duration;
    }
    if (breathingPhaseHint) {
      breathingPhaseHint.textContent = phase.instruction;
    }

    updatePhasePillActive(breathingState.phaseIndex);

    // Apply animation to circle - perfectly scaled inside the progress ring
    if (breathingCircleInner) {
      breathingCircleInner.className = `breathing-circle-inner phase-${phase.type}`;
      if (phase.type === 'inhale') {
        breathingCircleInner.style.transition = `transform ${phase.duration}s cubic-bezier(0.25, 1, 0.5, 1)`;
        breathingCircleInner.style.transform = 'scale(1.16)';
      } else if (phase.type === 'exhale') {
        breathingCircleInner.style.transition = `transform ${phase.duration}s cubic-bezier(0.25, 1, 0.5, 1)`;
        breathingCircleInner.style.transform = 'scale(0.88)';
      } else if (phase.type === 'hold-in') {
        breathingCircleInner.style.transition = 'transform 0.3s ease-out';
        breathingCircleInner.style.transform = 'scale(1.16)';
      } else if (phase.type === 'hold-out') {
        breathingCircleInner.style.transition = 'transform 0.3s ease-out';
        breathingCircleInner.style.transform = 'scale(0.88)';
      }
    }

    continueCurrentPhase();
  }

  function continueCurrentPhase() {
    if (breathingState.animId) {
      cancelAnimationFrame(breathingState.animId);
      breathingState.animId = null;
    }
    if (breathingState.timerId) clearInterval(breathingState.timerId);

    const startPerfTime = performance.now() - (breathingState.elapsedPhaseSeconds * 1000);

    function step(now) {
      if (breathingState.isPaused || !breathingState.isRunning) return;

      const elapsedMs = now - startPerfTime;
      breathingState.elapsedPhaseSeconds = Math.min(breathingState.phaseDuration, elapsedMs / 1000);

      const remainingSeconds = Math.max(0, Math.ceil(breathingState.phaseDuration - breathingState.elapsedPhaseSeconds));
      if (breathingCountdown && breathingCountdown.textContent !== String(remainingSeconds)) {
        breathingCountdown.textContent = remainingSeconds;
      }

      // Smooth SVG track progress
      const fraction = Math.min(1, breathingState.elapsedPhaseSeconds / breathingState.phaseDuration);
      if (breathingTrackProgress) {
        const offset = CIRCLE_CIRCUMFERENCE * (1 - fraction);
        breathingTrackProgress.style.strokeDashoffset = `${offset}`;
      }

      // Phase finished
      if (breathingState.elapsedPhaseSeconds >= breathingState.phaseDuration) {
        breathingState.animId = null;
        advanceBreathingPhase();
      } else {
        breathingState.animId = requestAnimationFrame(step);
      }
    }

    breathingState.animId = requestAnimationFrame(step);
  }

  function advanceBreathingPhase() {
    const tech = getCurrentBreathingTechnique();
    if (!tech) return;

    breathingState.phaseIndex++;
    if (breathingState.phaseIndex >= tech.pattern.length) {
      // Completed 1 full cycle
      breathingState.phaseIndex = 0;
      breathingState.currentCycle++;

      const targetCycles = breathingState.targetCycles;
      if (targetCycles > 0 && breathingState.currentCycle > targetCycles) {
        // Session Complete!
        finishBreathingSession();
        return;
      }

      // Update cycle counter
      if (breathingCycleDisplay) {
        const targetStr = targetCycles === 0 ? '∞' : targetCycles;
        breathingCycleDisplay.textContent = `${breathingState.currentCycle} / ${targetStr}`;
      }
    }

    startCurrentPhase();
  }

  function finishBreathingSession() {
    breathingState.isRunning = false;
    breathingState.isPaused = false;
    if (breathingState.timerId) clearInterval(breathingState.timerId);
    if (breathingState.clockId) clearInterval(breathingState.clockId);

    breathingAudio.play('complete');
    if (breathingState.vibeEnabled) {
      triggerBreathingHaptic('complete');
    }

    if (breathingPhaseName) {
      breathingPhaseName.textContent = 'ОТЛИЧНО!';
      breathingPhaseName.style.color = '#6F927B';
    }
    if (breathingCountdown) breathingCountdown.textContent = '✓';
    if (breathingPhaseHint) breathingPhaseHint.textContent = 'Практика дыхания успешно завершена!';

    if (breathingCircleInner) {
      breathingCircleInner.className = 'breathing-circle-inner phase-complete';
      breathingCircleInner.style.transform = 'scale(1)';
    }
    if (breathingTrackProgress) {
      breathingTrackProgress.style.strokeDashoffset = '0';
    }

    if (btnBreathingToggle) {
      btnBreathingToggle.classList.remove('is-active');
      if (breathingBtnIcon) breathingBtnIcon.textContent = '↺';
      if (breathingBtnLabel) breathingBtnLabel.textContent = 'Пройти снова';
    }
  }

  function startSessionClock() {
    if (breathingState.clockId) clearInterval(breathingState.clockId);
    breathingState.clockId = setInterval(() => {
      if (breathingState.isPaused) return;
      breathingState.totalElapsedSeconds++;
      if (breathingTimeDisplay) {
        const mins = String(Math.floor(breathingState.totalElapsedSeconds / 60)).padStart(2, '0');
        const secs = String(breathingState.totalElapsedSeconds % 60).padStart(2, '0');
        breathingTimeDisplay.textContent = `${mins}:${secs}`;
      }
    }, 1000);
  }

  function setupBreathingControls() {
    if (btnBreathingToggle) {
      btnBreathingToggle.addEventListener('click', () => {
        if (!breathingState.isRunning) {
          startBreathingSession();
        } else if (breathingState.isPaused) {
          resumeBreathingSession();
        } else {
          pauseBreathingSession();
        }
      });
    }

    if (breathingCircleInner) {
      breathingCircleInner.addEventListener('click', (e) => {
        if (e && e.preventDefault) e.preventDefault();
        if (!breathingState.isRunning) {
          startBreathingSession();
        } else if (breathingState.isPaused) {
          resumeBreathingSession();
        } else {
          pauseBreathingSession();
        }
      });
    }

    if (btnBreathingReset) {
      btnBreathingReset.addEventListener('click', () => {
        stopBreathingSession();
      });
    }

    // Target Cycles Selector
    if (breathingTargetCycles) {
      breathingTargetCycles.querySelectorAll('.target-cycle-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          breathingTargetCycles.querySelectorAll('.target-cycle-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          breathingState.targetCycles = parseInt(btn.getAttribute('data-cycles'), 10) || 0;
          if (breathingCycleDisplay) {
            const targetStr = breathingState.targetCycles === 0 ? '∞' : breathingState.targetCycles;
            breathingCycleDisplay.textContent = `${breathingState.currentCycle} / ${targetStr}`;
          }
        });
      });
    }

    // Sound toggle
    if (btnBreathingSound) {
      btnBreathingSound.addEventListener('click', () => {
        breathingState.soundEnabled = !breathingState.soundEnabled;
        breathingAudio.isEnabled = breathingState.soundEnabled;
        if (breathingState.soundEnabled) {
          btnBreathingSound.classList.add('active');
          if (breathingSoundIcon) breathingSoundIcon.textContent = '🔔';
        } else {
          btnBreathingSound.classList.remove('active');
          if (breathingSoundIcon) breathingSoundIcon.textContent = '🔕';
        }
      });
    }

    // Vibration toggle
    if (btnBreathingVibe) {
      btnBreathingVibe.addEventListener('click', () => {
        breathingState.vibeEnabled = !breathingState.vibeEnabled;
        if (breathingState.vibeEnabled) {
          btnBreathingVibe.classList.add('active');
          if (breathingVibeIcon) breathingVibeIcon.textContent = '📳';
        } else {
          btnBreathingVibe.classList.remove('active');
          if (breathingVibeIcon) breathingVibeIcon.textContent = '📴';
        }
      });
    }

    // Sound theme chips (bowls, kalimba, flute)
    const soundChips = document.querySelectorAll('.sound-chip');
    soundChips.forEach(chip => {
      chip.addEventListener('click', () => {
        soundChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const theme = chip.getAttribute('data-sound') || 'bowls';
        breathingAudio.setTheme(theme);
        breathingAudio.playSample(theme);
      });
    });

    // Guide Modal
    if (btnBreathingGuide && modalBreathingGuide) {
      btnBreathingGuide.addEventListener('click', () => {
        modalBreathingGuide.classList.add('active');
        modalBreathingGuide.setAttribute('aria-hidden', 'false');
      });
    }
    if (modalBtnGuideClose && modalBreathingGuide) {
      modalBtnGuideClose.addEventListener('click', () => {
        modalBreathingGuide.classList.remove('active');
        modalBreathingGuide.setAttribute('aria-hidden', 'true');
      });
    }
    if (modalBreathingGuide) {
      modalBreathingGuide.addEventListener('click', (e) => {
        if (e.target === modalBreathingGuide) {
          modalBreathingGuide.classList.remove('active');
          modalBreathingGuide.setAttribute('aria-hidden', 'true');
        }
      });
    }
  }

  // =========================================================================
  // MODULE 3: GROUNDING TECHNIQUE (5-4-3-2-1) CONTROLLER
  // Соматическая 1-тап переориентация при тревоге и панических волнах
  // =========================================================================
  const groundingState = {
    stepIndex: 0,
    tapCount: 0,
    initialized: false
  };

  const groundingActiveCard = document.getElementById('grounding-active-card');
  const groundingCompleteCard = document.getElementById('grounding-complete-card');
  const groundingStepBadge = document.getElementById('grounding-step-badge');
  const groundingStepIcon = document.getElementById('grounding-step-icon');
  const groundingStepInstruction = document.getElementById('grounding-step-instruction');
  const groundingStepHint = document.getElementById('grounding-step-hint');
  const groundingProgressDots = document.getElementById('grounding-progress-dots');
  const btnGroundingAdvance = document.getElementById('btn-grounding-advance');
  const groundingAdvanceLabel = document.getElementById('grounding-advance-label');
  const btnGroundingRestart = document.getElementById('btn-grounding-restart');
  const btnGroundingToBreathe = document.getElementById('btn-grounding-to-breathe');
  const btnGroundingGuide = document.getElementById('btn-grounding-guide');
  const modalGroundingGuide = document.getElementById('modal-grounding-guide');
  const modalBtnGroundingClose = document.getElementById('modal-btn-grounding-close');

  const GROUNDING_STEP_DATA = [
    {
      count: 5,
      sense: 'Зрение',
      itemLabel: 'предмет',
      icon: '👁️',
      instruction: 'Назовите 5 предметов, которые вы видите вокруг прямо сейчас',
      hint: 'Оглядитесь вокруг прямо сейчас. Найдите 5 конкретных предметов или деталей (чашка, лампа, угол книги, тень на стене, окно).'
    },
    {
      count: 4,
      sense: 'Осязание',
      itemLabel: 'ощущение',
      icon: '✋',
      instruction: 'Почувствуйте 4 физических ощущения в теле',
      hint: 'Ощутите стопы на полу, спину на спинке кресла, ткань одежды на коже, прохладу или тепло воздуха.'
    },
    {
      count: 3,
      sense: 'Слух',
      itemLabel: 'звук',
      icon: '👂',
      instruction: 'Прислушайтесь и выделите 3 различных звука',
      hint: 'Шум за окном, гудение техники, звук собственного спокойного дыхания, шорох или тиканье часов.'
    },
    {
      count: 2,
      sense: 'Обоняние',
      itemLabel: 'запах',
      icon: '👃',
      instruction: 'Уловите 2 аромата или запаха вокруг себя',
      hint: 'Запах кофе, мыла, свежего воздуха из окна, ткани одежды или вдохните любимый аромат.'
    },
    {
      count: 1,
      sense: 'Вкус',
      itemLabel: 'вкус',
      icon: '👅',
      instruction: 'Ощутите 1 вкус во рту прямо сейчас',
      hint: 'Сделайте глоток чистой воды, ощутите послевкусие напитка или просто зафиксируйте нейтральный вкус.'
    }
  ];

  function initGroundingModule() {
    if (!groundingState.initialized) {
      setupGroundingControls();
      groundingState.initialized = true;
    }
    renderGroundingStep(0);
  }

  function setupGroundingControls() {
    // Multi-tap large progress button
    if (btnGroundingAdvance) {
      btnGroundingAdvance.addEventListener('click', () => {
        const step = GROUNDING_STEP_DATA[groundingState.stepIndex];
        if (!step) return;

        groundingState.tapCount++;
        const currentCount = groundingState.tapCount;
        const targetCount = step.count;

        // Light up the corresponding progress dot
        if (groundingProgressDots) {
          const dots = groundingProgressDots.querySelectorAll('.ground-dot');
          dots.forEach((dot, idx) => {
            if (idx < currentCount) {
              dot.classList.add('active');
            } else {
              dot.classList.remove('active');
            }
          });
        }

        // Tactile sound and vibration
        if (typeof appAudio !== 'undefined' && appAudio.playChime) {
          appAudio.playChime(300 + currentCount * 55);
        }
        if (navigator.vibrate) {
          try { navigator.vibrate(28); } catch(e) {}
        }

        if (currentCount < targetCount) {
          // More taps needed for this step
          const remaining = targetCount - currentCount;
          if (groundingAdvanceLabel) {
            groundingAdvanceLabel.textContent = `Зафиксировано: ${currentCount} из ${targetCount} (нажмите ещё ${remaining})`;
          }
        } else {
          // Current step completed!
          if (groundingState.stepIndex < 4) {
            if (groundingAdvanceLabel) {
              groundingAdvanceLabel.textContent = `✓ Шаг завершен! Следующий шаг →`;
            }
            setTimeout(() => {
              renderGroundingStep(groundingState.stepIndex + 1);
            }, 300);
          } else {
            // All 5 steps completed!
            if (typeof appAudio !== 'undefined' && appAudio.play) {
              appAudio.play('complete');
            }
            if (navigator.vibrate) {
              try { navigator.vibrate([60, 50, 80]); } catch(e) {}
            }
            if (groundingActiveCard) groundingActiveCard.style.display = 'none';
            if (groundingCompleteCard) groundingCompleteCard.style.display = 'block';
          }
        }
      });
    }

    // Restart
    if (btnGroundingRestart) {
      btnGroundingRestart.addEventListener('click', () => {
        renderGroundingStep(0);
      });
    }

    // Transition to 4-7-8 Breathing
    if (btnGroundingToBreathe) {
      btnGroundingToBreathe.addEventListener('click', () => {
        navigateTo('breathing');
        applyBreathingTechnique('478', true);
      });
    }

    // Guide Modal
    if (btnGroundingGuide && modalGroundingGuide) {
      btnGroundingGuide.addEventListener('click', () => {
        modalGroundingGuide.classList.add('active');
        modalGroundingGuide.setAttribute('aria-hidden', 'false');
      });
    }
    if (modalBtnGroundingClose && modalGroundingGuide) {
      modalBtnGroundingClose.addEventListener('click', () => {
        modalGroundingGuide.classList.remove('active');
        modalGroundingGuide.setAttribute('aria-hidden', 'true');
      });
    }
    if (modalGroundingGuide) {
      modalGroundingGuide.addEventListener('click', (e) => {
        if (e.target === modalGroundingGuide) {
          modalGroundingGuide.classList.remove('active');
          modalGroundingGuide.setAttribute('aria-hidden', 'true');
        }
      });
    }
  }

  function renderGroundingStep(stepIndex) {
    groundingState.stepIndex = stepIndex;
    groundingState.tapCount = 0;
    const step = GROUNDING_STEP_DATA[stepIndex];
    if (!step) return;

    if (groundingActiveCard) groundingActiveCard.style.display = 'block';
    if (groundingCompleteCard) groundingCompleteCard.style.display = 'none';

    if (groundingStepBadge) groundingStepBadge.textContent = `Шаг ${stepIndex + 1} из 5 • ${step.sense}`;
    if (groundingStepIcon) groundingStepIcon.textContent = step.icon;
    if (groundingStepInstruction) groundingStepInstruction.textContent = step.instruction;
    if (groundingStepHint) groundingStepHint.textContent = step.hint;

    // Render individual progress dots for the current step (5, 4, 3, 2, 1)
    if (groundingProgressDots) {
      groundingProgressDots.innerHTML = '';
      for (let i = 0; i < step.count; i++) {
        const dot = document.createElement('span');
        dot.className = 'ground-dot';
        dot.setAttribute('data-dot-idx', i);
        groundingProgressDots.appendChild(dot);
      }
    }

    // Button label
    if (groundingAdvanceLabel) {
      groundingAdvanceLabel.textContent = `Зафиксировать ${step.itemLabel} 1 из ${step.count}`;
    }
  }

  // =========================================================================
  // MODULE 4: COPING CARDS CONTROLLER (КПТ)
  // =========================================================================
  let initialCustomCards = [];
  try {
    const raw = JSON.parse(localStorage.getItem('pocket_psy_custom_coping') || '[]');
    let migrated = false;
    initialCustomCards = raw.map(c => {
      let changed = false;
      let act = c.action || '';
      let st = c.statement || '';
      if (act === 'Дышите спокойно и сохраняйте контакт с текущим моментом') {
        act = '';
        changed = true;
      }
      if (st === 'Поддерживающее напоминание для себя') {
        st = '';
        changed = true;
      }
      if (changed) migrated = true;
      return changed ? { ...c, action: act, statement: st } : c;
    });
    if (migrated) {
      localStorage.setItem('pocket_psy_custom_coping', JSON.stringify(initialCustomCards));
    }
  } catch(e) {
    initialCustomCards = [];
  }

  let initialAddedPopularIds = [];
  try {
    const savedAdded = localStorage.getItem('pocket_psy_added_popular_coping');
    if (savedAdded) {
      initialAddedPopularIds = JSON.parse(savedAdded);
    } else {
      initialAddedPopularIds = [];
    }
  } catch(e) {
    initialAddedPopularIds = [];
  }

  const defaultSavedCardId = localStorage.getItem('pocket_psy_coping_default_card_id') || null;

  const copingState = {
    sourceFilter: 'my_cards', // 'my_cards' | 'popular' | 'all'
    emotionFilter: 'all', // 'all' | 'anxiety' | 'self_criticism' | 'anger' | 'sadness' | 'burnout'
    currentIndex: 0,
    favorites: JSON.parse(localStorage.getItem('pocket_psy_coping_favs') || '[]'),
    defaultCardId: defaultSavedCardId,
    hasUserOpenedCards: true, // Always show cards directly
    customCards: initialCustomCards,
    addedPopularCardIds: initialAddedPopularIds,
    popularFilterCat: 'all',
    isEditMode: false,
    showActions: false, // Hidden by default, toggled via overarching button
    showPlaceholder: true, // Initially the field is empty until the user chooses a card
    initialized: false
  };
  window.copingState = copingState;
  window.renderCopingCardsManageList = renderCopingCardsManageList;

  const copingSourceTabs = document.getElementById('coping-source-tabs');
  const copingEmotionFilterStrip = document.getElementById('coping-emotion-filter-strip') || document.getElementById('coping-categories-strip');
  const btnCopingPinDefault = document.getElementById('btn-coping-pin-default');
  const copingDefaultIndicator = document.getElementById('coping-default-indicator');
  const copingEmptyLanding = document.getElementById('coping-empty-landing');
  const btnCopingStartBrowse = document.getElementById('btn-coping-start-browse');
  const btnCopingLandingAdd = document.getElementById('btn-coping-landing-add');
  const copingCardMetaBar = document.getElementById('coping-card-meta-bar');

  // Categories Drawer & Action Toggle Elements
  const btnCopingToggleCategories = document.getElementById('btn-coping-toggle-categories');
  const copingCategoriesDrawer = document.getElementById('coping-categories-drawer');
  const copingCatToggleLabel = document.getElementById('coping-cat-toggle-label');
  const btnToggleCopingActions = document.getElementById('btn-toggle-coping-actions');
  const labelToggleCopingActions = document.getElementById('label-toggle-coping-actions');

  const copingCategoriesStrip = document.getElementById('coping-categories-strip');
  const copingCardBadge = document.getElementById('coping-card-badge');
  const copingCardCounter = document.getElementById('coping-card-counter');
  const btnCopingFav = document.getElementById('btn-coping-fav');
  const copingFavIcon = document.getElementById('coping-fav-icon');
  const copingHeroCard = document.getElementById('coping-hero-card');
  const copingCardStatement = document.getElementById('coping-card-statement');
  const copingCardAction = document.getElementById('coping-card-action');
  const copingCardActionBox = document.getElementById('coping-card-action-box');
  const copingCardDivider = document.getElementById('coping-card-divider');
  const btnCopingPrev = document.getElementById('btn-coping-prev');
  const btnCopingRandom = document.getElementById('btn-coping-random');
  const btnCopingNext = document.getElementById('btn-coping-next');
  const btnAddCustomCoping = document.getElementById('btn-add-custom-coping');
  const btnAddAdvancedCoping = document.getElementById('btn-add-advanced-coping');
  const groupCustomCardAction = document.getElementById('group-custom-card-action');
  const modalAddCardTitle = document.getElementById('modal-add-card-title');
  const modalAddCardSubtitle = document.getElementById('modal-add-card-subtitle');
  const modalAddCopingCard = document.getElementById('modal-add-coping-card');
  const formAddCopingCard = document.getElementById('form-add-coping-card');
  const inpCustomCardCat = document.getElementById('inp-custom-card-cat');
  const inpCustomCardStatement = document.getElementById('inp-custom-card-statement');
  const inpCustomCardAction = document.getElementById('inp-custom-card-action');
  const modalBtnAddCardCancel = document.getElementById('modal-btn-add-card-cancel');
  const btnCopingGuide = document.getElementById('btn-coping-guide');
  const modalCopingGuide = document.getElementById('modal-coping-guide');
  const modalBtnCopingClose = document.getElementById('modal-btn-coping-close');
  const btnCopingDelete = document.getElementById('btn-coping-delete');
  const btnCopingEditCurrent = document.getElementById('btn-coping-edit-current');
  const btnCopingEditMode = document.getElementById('btn-coping-edit-mode');
  const btnCopingOpenExport = document.getElementById('btn-coping-open-export');

  // Coping Cards List & Management Modal Elements (Item 4)
  const btnOpenCopingList = document.getElementById('btn-open-coping-list');
  const modalCopingCardsList = document.getElementById('modal-coping-cards-list');
  const modalBtnCopingListClose = document.getElementById('modal-btn-coping-list-close');
  const modalBtnCopingListCloseX = document.getElementById('modal-btn-coping-list-close-x');
  const modalBtnCopingListAddNew = document.getElementById('modal-btn-coping-list-add-new');
  const modalBtnCopingListEditMode = document.getElementById('modal-btn-coping-list-edit-mode');
  const modalBtnCopingToggleActions = document.getElementById('modal-btn-coping-toggle-actions');
  const modalLabelToggleCopingActions = document.getElementById('modal-label-toggle-coping-actions');
  const modalCopingListFilter = document.getElementById('modal-coping-list-filter');
  const copingCardsManageList = document.getElementById('coping-cards-manage-list');

  // Edit Custom Card Modal Elements
  const modalEditCopingCard = document.getElementById('modal-edit-coping-card');
  const formEditCopingCard = document.getElementById('form-edit-coping-card');
  const inpEditCardId = document.getElementById('inp-edit-card-id');
  const inpEditCardCat = document.getElementById('inp-edit-card-cat');
  const inpEditCardStatement = document.getElementById('inp-edit-card-statement');
  const inpEditCardAction = document.getElementById('inp-edit-card-action');
  const modalBtnEditCardCancel = document.getElementById('modal-btn-edit-card-cancel');
  const modalBtnEditCardCloseX = document.getElementById('modal-btn-edit-card-close-x');

  // Popular Cards Modal Elements
  const btnOpenPopularCoping = document.getElementById('btn-open-popular-coping');
  const modalPopularCoping = document.getElementById('modal-popular-coping');
  const modalBtnPopularCopingClose = document.getElementById('modal-btn-popular-coping-close');
  const modalBtnPopularCopingCloseX = document.getElementById('modal-btn-popular-coping-close-x');
  const popularCopingCategoriesFilter = document.getElementById('popular-coping-categories-filter');
  const popularCopingCardsList = document.getElementById('popular-coping-cards-list');

  function saveAddedPopularCopingIds() {
    try {
      localStorage.setItem('pocket_psy_added_popular_coping', JSON.stringify(copingState.addedPopularCardIds || []));
    } catch(e) {}
  }

  function getAddedPopularCopingCards() {
    const popularPool = (typeof COPING_CARDS !== 'undefined') ? COPING_CARDS : [];
    const addedIds = Array.isArray(copingState.addedPopularCardIds) ? copingState.addedPopularCardIds : [];
    const popularById = new Map(popularPool.map(card => [card.id, card]));
    return addedIds.map(id => popularById.get(id)).filter(Boolean);
  }

  // The user's personal deck: own cards + popular cards explicitly added by the user.
  function getUserCopingCards() {
    const custom = copingState.customCards || [];
    const customIds = new Set(custom.map(card => card.id));
    const addedPopular = getAddedPopularCopingCards().filter(card => !customIds.has(card.id));
    return [...custom, ...addedPopular];
  }

  function getCombinedCopingCards() {
    const popularPool = (typeof COPING_CARDS !== 'undefined') ? COPING_CARDS : [];
    return [...(copingState.customCards || []), ...popularPool];
  }

  function getFilteredCopingCards() {
    const popularPool = (typeof COPING_CARDS !== 'undefined') ? COPING_CARDS : [];

    // "Популярные" is a browse-only catalog. The main deck and the saved
    // cards list contain only the user's own cards and cards they added.
    let baseList = copingState.sourceFilter === 'popular'
      ? popularPool
      : getUserCopingCards();

    if (copingState.emotionFilter && copingState.emotionFilter !== 'all') {
      baseList = baseList.filter(c => c.category === copingState.emotionFilter);
    }

    return baseList;
  }

  function initCopingModule() {
    try {
      const stored = localStorage.getItem('pocket_psy_custom_coping');
      if (stored) copingState.customCards = JSON.parse(stored);
    } catch (e) {}
    try {
      const favs = localStorage.getItem('pocket_psy_coping_favs');
      if (favs) copingState.favorites = JSON.parse(favs);
    } catch (e) {}

    const defId = localStorage.getItem('pocket_psy_coping_default_card_id');
    copingState.defaultCardId = defId || null;
    copingState.hasUserOpenedCards = true;
    if (defId) {
      const all = getCombinedCopingCards();
      const foundCard = all.find(c => c.id === defId);
      if (foundCard) {
        // A popular card pinned as default before this fix may not be in the
        // saved list yet. Pinning it is an explicit user choice, so include it.
        if (!foundCard.id.startsWith('custom-') && !copingState.addedPopularCardIds.includes(foundCard.id)) {
          copingState.addedPopularCardIds.push(foundCard.id);
          saveAddedPopularCopingIds();
        }
        copingState.sourceFilter = 'my_cards';
        copingState.emotionFilter = 'all';
        const list = getFilteredCopingCards();
        const idx = list.findIndex(c => c.id === defId);
        copingState.currentIndex = idx >= 0 ? idx : 0;
        copingState.showPlaceholder = false;
      } else {
        copingState.showPlaceholder = true;
      }
    } else {
      copingState.sourceFilter = 'my_cards';
      copingState.emotionFilter = 'all';
      copingState.currentIndex = 0;
      copingState.showPlaceholder = true;
    }

    if (!copingState.initialized) {
      setupCopingControls();
      copingState.initialized = true;
    }
    renderCopingFilters();
    renderCurrentCopingCard();
    updateCopingActionsUI();
  }

  function renderPopularCopingModal() {
    if (!popularCopingCategoriesFilter || !popularCopingCardsList || typeof COPING_CARDS === 'undefined') return;

    const categories = [
      { id: 'all', title: 'Все', icon: '✨' },
      { id: 'anxiety', title: 'Тревога и паника', icon: '🌊' },
      { id: 'self_criticism', title: 'Самокритика и стыд', icon: '🛡️' },
      { id: 'anger', title: 'Гнев и раздражение', icon: '🔥' },
      { id: 'sadness', title: 'Грусть и апатия', icon: '🌧️' },
      { id: 'burnout', title: 'Выгорание и усталость', icon: '🔋' }
    ];

    popularCopingCategoriesFilter.innerHTML = categories.map(cat => {
      const count = cat.id === 'all' 
        ? COPING_CARDS.length 
        : COPING_CARDS.filter(c => c.category === cat.id).length;
      const isActive = cat.id === copingState.popularFilterCat;
      return `
        <button type="button" class="coping-cat-pill ${isActive ? 'active' : ''}" data-pop-cat="${cat.id}">
          <span>${cat.icon} ${cat.title}</span>
          <span class="coping-cat-count">${count}</span>
        </button>
      `;
    }).join('');

    popularCopingCategoriesFilter.querySelectorAll('.coping-cat-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        copingState.popularFilterCat = pill.getAttribute('data-pop-cat') || 'all';
        renderPopularCopingModal();
      });
    });

    const filtered = copingState.popularFilterCat === 'all'
      ? COPING_CARDS
      : COPING_CARDS.filter(c => c.category === copingState.popularFilterCat);

    const fragment = document.createDocumentFragment();
    filtered.forEach(card => {
      const isAdded = copingState.addedPopularCardIds.includes(card.id);
      const cardEl = document.createElement('div');
      cardEl.className = 'popular-coping-card-item';
      cardEl.innerHTML = `
        <div class="popular-coping-top">
          <span class="coping-card-badge" style="font-size: 11.5px; padding: 2px 8px;">
            ${card.icon || '📑'} ${card.categoryName || 'КПТ'}
          </span>
          <span style="font-size: 11px; color: var(--text-faint); font-weight: 600;">Популярная карточка</span>
        </div>
        <div class="popular-coping-statement">“${escapeHtml(card.statement)}”</div>
        ${card.action ? `<div class="popular-coping-action">💡 <strong>Действие:</strong> ${escapeHtml(card.action)}</div>` : ''}
        <div class="popular-coping-actions-row">
          <button type="button" class="btn-popular-card-add ${isAdded ? 'is-added' : ''}" data-card-id="${card.id}">
            <span>${isAdded ? '✓ В вашей колоде' : '➕ Добавить в мои карточки'}</span>
          </button>
          <button type="button" class="btn-popular-card-view" data-card-id="${card.id}">
            <span>👁️ Открыть в колоде</span>
          </button>
        </div>
      `;

      const btnAdd = cardEl.querySelector('.btn-popular-card-add');
      if (btnAdd) {
        btnAdd.addEventListener('click', () => {
          if (!copingState.addedPopularCardIds.includes(card.id)) {
            copingState.addedPopularCardIds.push(card.id);
            saveAddedPopularCopingIds();
            btnAdd.classList.add('is-added');
            btnAdd.innerHTML = '<span>✓ В вашей колоде</span>';
            showTrackerToast(`⚡ Карточка «${card.categoryName}» добавлена в вашу колоду!`);

            // Show the added card in the user's own deck right away.
            copingState.sourceFilter = 'my_cards';
            copingState.emotionFilter = 'all';
            copingState.showPlaceholder = false;
            const deck = getFilteredCopingCards();
            const addedIdx = deck.findIndex(c => c.id === card.id);
            if (addedIdx >= 0) copingState.currentIndex = addedIdx;
            renderCopingCategories();
            renderCurrentCopingCard();
          } else {
            copingState.addedPopularCardIds = copingState.addedPopularCardIds.filter(id => id !== card.id);
            saveAddedPopularCopingIds();
            btnAdd.classList.remove('is-added');
            btnAdd.innerHTML = '<span>➕ Добавить в мои карточки</span>';
            copingState.sourceFilter = 'my_cards';
            copingState.emotionFilter = 'all';
            const deck = getFilteredCopingCards();
            if (copingState.currentIndex >= deck.length) {
              copingState.currentIndex = Math.max(0, deck.length - 1);
            }
            renderCopingCategories();
            renderCurrentCopingCard();
          }
        });
      }

      const btnView = cardEl.querySelector('.btn-popular-card-view');
      if (btnView) {
        btnView.addEventListener('click', () => {
          if (!copingState.addedPopularCardIds.includes(card.id)) {
            copingState.addedPopularCardIds.push(card.id);
            saveAddedPopularCopingIds();
          }
          if (modalPopularCoping) {
            modalPopularCoping.classList.remove('active');
            modalPopularCoping.setAttribute('aria-hidden', 'true');
          }
          copingState.sourceFilter = 'my_cards';
          copingState.emotionFilter = 'all';
          copingState.showPlaceholder = false;
          renderCopingCategories();
          const cards = getFilteredCopingCards();
          const targetIdx = cards.findIndex(c => c.id === card.id);
          copingState.currentIndex = targetIdx >= 0 ? targetIdx : 0;
          renderCurrentCopingCard();
        });
      }

      fragment.appendChild(cardEl);
    });
    popularCopingCardsList.innerHTML = '';
    popularCopingCardsList.appendChild(fragment);
  }

  function renderCopingFilters() {
    // 1. Level 1: Update source tabs badges & active states
    const myCount = getUserCopingCards().length;
    const popularPool = (typeof COPING_CARDS !== 'undefined') ? COPING_CARDS : [];
    const popCount = popularPool.length;

    const badgeMy = document.getElementById('badge-source-my-count');
    if (badgeMy) badgeMy.textContent = myCount;
    const badgePop = document.getElementById('badge-source-popular-count');
    if (badgePop) badgePop.textContent = popCount;

    if (copingSourceTabs) {
      copingSourceTabs.querySelectorAll('.coping-source-tab').forEach(tab => {
        const src = tab.getAttribute('data-source');
        tab.classList.toggle('active', src === copingState.sourceFilter);
      });
    }

    // 2. Level 2: Emotion filter pills
    if (!copingEmotionFilterStrip) return;

    let sourcePool = [];
    if (copingState.sourceFilter === 'popular') {
      sourcePool = popularPool;
    } else {
      sourcePool = getUserCopingCards();
    }

    const emotions = [
      { id: 'all', title: 'Все', icon: '✨' },
      { id: 'anxiety', title: 'Тревога', icon: '🌊' },
      { id: 'self_criticism', title: 'Самокритика', icon: '🛡️' },
      { id: 'anger', title: 'Злость / Гнев', icon: '🔥' },
      { id: 'sadness', title: 'Грусть', icon: '🌧️' },
      { id: 'burnout', title: 'Выгорание', icon: '🔋' }
    ];

    const catLabels = {
      all: '🏷️ Все ▾',
      anxiety: '🌊 Тревога ▾',
      self_criticism: '🛡️ Самокритика ▾',
      anger: '🔥 Злость ▾',
      sadness: '🌧️ Грусть ▾',
      burnout: '🔋 Выгорание ▾'
    };
    if (copingCatToggleLabel) {
      copingCatToggleLabel.textContent = catLabels[copingState.emotionFilter] || '🏷️ Категории ▾';
    }

    copingEmotionFilterStrip.innerHTML = emotions.map(cat => {
      const count = cat.id === 'all'
        ? sourcePool.length
        : sourcePool.filter(c => c.category === cat.id).length;
      const isActive = cat.id === copingState.emotionFilter;
      return `
        <button type="button" class="coping-emotion-pill coping-cat-pill ${isActive ? 'active' : ''}" data-emotion="${cat.id}">
          <span>${cat.icon} ${cat.title}</span>
          <span class="coping-emotion-count">${count}</span>
        </button>
      `;
    }).join('');

    copingEmotionFilterStrip.querySelectorAll('.coping-emotion-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        copingState.emotionFilter = pill.getAttribute('data-emotion') || 'all';
        copingState.hasUserOpenedCards = true;
        copingState.showPlaceholder = false;
        copingState.currentIndex = 0;
        // Auto-close categories drawer to save vertical space
        if (copingCategoriesDrawer) copingCategoriesDrawer.style.display = 'none';
        if (btnCopingToggleCategories) btnCopingToggleCategories.classList.remove('active');
        renderCopingFilters();
        renderCurrentCopingCard();
      });
    });
  }

  function renderCopingCategories() {
    renderCopingFilters();
  }

  function renderCurrentCopingCard() {
    const arenaNavRow = document.querySelector('.coping-nav-row');

    if (copingEmptyLanding) copingEmptyLanding.style.display = 'none';
    if (copingCardMetaBar) copingCardMetaBar.style.display = 'flex';
    if (copingHeroCard) copingHeroCard.style.display = 'block';
    if (arenaNavRow) arenaNavRow.style.display = 'flex';

    // Initially the card field stays empty: no card is shown until the user picks one
    if (copingState.showPlaceholder) {
      if (copingCardBadge) copingCardBadge.textContent = '🏷️ Без категории';
      if (copingCardCounter) copingCardCounter.textContent = '';
      if (copingDefaultIndicator) copingDefaultIndicator.style.display = 'none';
      if (btnCopingPinDefault) {
        btnCopingPinDefault.classList.remove('is-default');
        btnCopingPinDefault.style.display = 'none';
      }
      if (copingCardStatement) {
        copingCardStatement.style.display = 'block';
        copingCardStatement.textContent = 'Здесь пока пусто';
      }
      if (copingCardAction) {
        copingCardAction.textContent = 'Выберите категорию, откройте «📚 Популярные» или создайте свою карточку — и она появится в этом поле.';
      }
      if (copingCardActionBox) copingCardActionBox.style.display = 'flex';
      if (copingCardDivider) copingCardDivider.style.display = 'block';
      if (copingFavIcon) copingFavIcon.textContent = '☆';
      if (btnCopingFav) btnCopingFav.classList.remove('is-fav');
      if (btnCopingDelete) btnCopingDelete.style.display = 'none';
      if (btnCopingEditCurrent) btnCopingEditCurrent.style.display = 'none';
      return;
    }

    const cards = getFilteredCopingCards();
    if (!cards || cards.length === 0) {
      if (copingCardBadge) copingCardBadge.textContent = 'Пусто';
      if (copingCardCounter) copingCardCounter.textContent = '0 из 0';
      if (copingDefaultIndicator) copingDefaultIndicator.style.display = 'none';
      if (btnCopingPinDefault) {
        btnCopingPinDefault.classList.remove('is-default');
        btnCopingPinDefault.style.display = 'none';
      }
      if (copingCardStatement) {
        copingCardStatement.style.display = 'block';
        copingCardStatement.textContent = (copingState.sourceFilter === 'my_cards')
          ? 'В этой категории у вас пока нет своих карточек. Нажмите «➕ Создать свою карточку» ниже.'
          : 'В этой категории пока нет карточек. Выберите другой фильтр эмоций выше.';
      }
      if (copingCardAction) {
        copingCardAction.textContent = (copingState.sourceFilter === 'my_cards')
          ? 'Создайте свою карточку с поддерживающей мыслью и заземляющим действием.'
          : 'Выберите другую категорию или переключитесь на «📚 Популярные».';
      }
      if (copingCardActionBox) copingCardActionBox.style.display = 'none';
      if (copingCardDivider) copingCardDivider.style.display = 'none';
      if (copingFavIcon) copingFavIcon.textContent = '☆';
      if (btnCopingFav) btnCopingFav.classList.remove('is-fav');
      if (btnCopingDelete) btnCopingDelete.style.display = 'none';
      if (btnCopingEditCurrent) btnCopingEditCurrent.style.display = 'none';
      return;
    }

    if (copingState.currentIndex >= cards.length) {
      copingState.currentIndex = 0;
    } else if (copingState.currentIndex < 0) {
      copingState.currentIndex = cards.length - 1;
    }

    const card = cards[copingState.currentIndex];
    const isFav = copingState.favorites.includes(card.id);
    const isDefault = Boolean(copingState.defaultCardId && copingState.defaultCardId === card.id);

    if (copingCardBadge) {
      copingCardBadge.textContent = `${card.icon || '📑'} ${card.categoryName || 'КПТ'}`;
    }
    if (copingCardCounter) {
      copingCardCounter.textContent = `Карточка ${copingState.currentIndex + 1} из ${cards.length}`;
    }

    // Default card pin state & indicator badge
    if (btnCopingPinDefault) {
      btnCopingPinDefault.style.display = 'inline-flex';
      btnCopingPinDefault.classList.toggle('is-default', isDefault);
      btnCopingPinDefault.title = isDefault 
        ? 'Снять выбор по умолчанию (перестанет открываться первой)' 
        : 'Сделать по умолчанию (будет сразу открываться при входе)';
    }
    if (copingDefaultIndicator) {
      copingDefaultIndicator.style.display = isDefault ? 'inline-flex' : 'none';
    }

    const hasStatement = Boolean(card && card.statement && card.statement.trim().length > 0);
    const hasAction = Boolean(card && card.action && card.action.trim().length > 0);
    const showActionBox = Boolean(hasAction);

    if (copingCardStatement) {
      copingCardStatement.textContent = card.statement || '';
      copingCardStatement.style.display = hasStatement ? 'block' : 'none';
    }
    if (copingCardAction) {
      copingCardAction.textContent = card.action || '';
    }
    if (copingCardActionBox) {
      copingCardActionBox.style.display = showActionBox ? 'flex' : 'none';
    }
    if (copingCardDivider) {
      copingCardDivider.style.display = (hasStatement && showActionBox) ? 'block' : 'none';
    }

    if (copingFavIcon) {
      copingFavIcon.textContent = isFav ? '★' : '☆';
    }
    if (btnCopingFav) {
      if (isFav) btnCopingFav.classList.add('is-fav');
      else btnCopingFav.classList.remove('is-fav');
    }

    const isCustom = Boolean(card && card.id && card.id.startsWith('custom-'));
    if (btnCopingDelete) {
      btnCopingDelete.style.display = isCustom ? 'inline-flex' : 'none';
    }
    if (btnCopingEditCurrent) {
      btnCopingEditCurrent.style.display = (copingState.isEditMode && isCustom) ? 'inline-flex' : 'none';
    }

    // Micro-animation flash
    if (copingHeroCard) {
      copingHeroCard.classList.remove('card-flip-anim');
      void copingHeroCard.offsetWidth;
      copingHeroCard.classList.add('card-flip-anim');
    }
  }

  function updateCopingActionsUI() {
    const isShowing = Boolean(copingState.showActions);
    const labelText = isShowing ? '💡 Скрыть действия' : '💡 Открыть действия карточек';

    if (btnToggleCopingActions) {
      btnToggleCopingActions.classList.toggle('active', isShowing);
      if (labelToggleCopingActions) {
        labelToggleCopingActions.textContent = labelText;
      } else {
        btnToggleCopingActions.innerHTML = `<span>${labelText}</span>`;
      }
    }
    if (modalBtnCopingToggleActions) {
      modalBtnCopingToggleActions.classList.toggle('active', isShowing);
      if (modalLabelToggleCopingActions) {
        modalLabelToggleCopingActions.textContent = labelText;
      } else {
        modalBtnCopingToggleActions.innerHTML = `<span>${labelText}</span>`;
      }
    }

    renderCurrentCopingCard();
    if (modalCopingCardsList && modalCopingCardsList.classList.contains('active')) {
      renderCopingCardsManageList(copingState.manageListFilterCat || 'all');
    }
  }

  function toggleCopingActions() {
    copingState.showActions = !copingState.showActions;
    updateCopingActionsUI();
  }

  function setupCopingControls() {
    // Level 1 Source Tabs Click
    if (copingSourceTabs) {
      copingSourceTabs.querySelectorAll('.coping-source-tab').forEach(tab => {
        tab.addEventListener('click', () => {
          copingState.sourceFilter = tab.getAttribute('data-source') || 'all';
          copingState.hasUserOpenedCards = true;
          copingState.showPlaceholder = false;
          copingState.currentIndex = 0;
          renderCopingFilters();
          renderCurrentCopingCard();
        });
      });
    }

    // Landing placeholder actions
    if (btnCopingStartBrowse) {
      btnCopingStartBrowse.addEventListener('click', () => {
        copingState.hasUserOpenedCards = true;
        copingState.showPlaceholder = false;
        copingState.currentIndex = 0;
        renderCurrentCopingCard();
      });
    }
    if (btnCopingLandingAdd) {
      btnCopingLandingAdd.addEventListener('click', () => {
        if (modalAddCopingCard) {
          resetModalScroll(modalAddCopingCard);
          setFullscreenEditor(modalAddCopingCard, true);
          modalAddCopingCard.classList.add('active');
          modalAddCopingCard.setAttribute('aria-hidden', 'false');
        }
      });
    }

    // Pin Default Card
    if (btnCopingPinDefault) {
      btnCopingPinDefault.addEventListener('click', () => {
        const cards = getFilteredCopingCards();
        if (!cards || cards.length === 0) return;
        const card = cards[copingState.currentIndex];
        if (!card) return;

        if (copingState.defaultCardId === card.id) {
          copingState.defaultCardId = null;
          try {
            localStorage.removeItem('pocket_psy_coping_default_card_id');
          } catch(e) {}
          if (navigator.vibrate) try { navigator.vibrate(20); } catch(e) {}
          showTrackerToast('Карточка больше не отображается по умолчанию');
        } else {
          copingState.defaultCardId = card.id;
          try {
            localStorage.setItem('pocket_psy_coping_default_card_id', card.id);
          } catch(e) {}
          if (navigator.vibrate) try { navigator.vibrate([30, 50, 30]); } catch(e) {}
          showTrackerToast('📌 Эта карточка теперь открывается по умолчанию при входе!');
        }
        renderCurrentCopingCard();
        if (modalCopingCardsList && modalCopingCardsList.classList.contains('active')) {
          renderCopingCardsManageList(copingState.manageListFilterCat || 'all');
        }
      });
    }

    // Next / Prev / Random
    if (btnCopingNext) {
      btnCopingNext.addEventListener('click', () => {
        const cards = getFilteredCopingCards();
        if (cards.length === 0) return;
        copingState.showPlaceholder = false;
        copingState.currentIndex = (copingState.currentIndex + 1) % cards.length;
        if (navigator.vibrate) try { navigator.vibrate(25); } catch(e) {}
        renderCurrentCopingCard();
      });
    }

    if (btnCopingPrev) {
      btnCopingPrev.addEventListener('click', () => {
        const cards = getFilteredCopingCards();
        if (cards.length === 0) return;
        copingState.showPlaceholder = false;
        copingState.currentIndex = (copingState.currentIndex - 1 + cards.length) % cards.length;
        if (navigator.vibrate) try { navigator.vibrate(25); } catch(e) {}
        renderCurrentCopingCard();
      });
    }

    if (btnCopingRandom) {
      btnCopingRandom.addEventListener('click', () => {
        const cards = getFilteredCopingCards();
        if (cards.length <= 1) return;
        copingState.showPlaceholder = false;
        let nextIdx = copingState.currentIndex;
        while (nextIdx === copingState.currentIndex) {
          nextIdx = Math.floor(Math.random() * cards.length);
        }
        copingState.currentIndex = nextIdx;
        if (navigator.vibrate) try { navigator.vibrate(30); } catch(e) {}
        renderCurrentCopingCard();
      });
    }

    // Favorite toggle
    if (btnCopingFav) {
      btnCopingFav.addEventListener('click', () => {
        const cards = getFilteredCopingCards();
        if (!cards || cards.length === 0) return;
        const card = cards[copingState.currentIndex];
        if (!card) return;

        const pos = copingState.favorites.indexOf(card.id);
        if (pos >= 0) {
          copingState.favorites.splice(pos, 1);
        } else {
          copingState.favorites.push(card.id);
        }

        try {
          localStorage.setItem('pocket_psy_coping_favs', JSON.stringify(copingState.favorites));
        } catch(e) {}

        if (navigator.vibrate) try { navigator.vibrate(35); } catch(e) {}
        renderCopingFilters();
        renderCurrentCopingCard();
      });
    }

    // Delete custom card with confirmation dialog
    if (btnCopingDelete) {
      btnCopingDelete.addEventListener('click', () => {
        const cards = getFilteredCopingCards();
        if (!cards || cards.length === 0) return;
        const card = cards[copingState.currentIndex];
        if (!card || !card.id || !card.id.startsWith('custom-')) return;

        showConfirmDialog({
          title: 'Удалить карточку?',
          message: 'Вы действительно хотите удалить эту копинг-карточку? Восстановить её будет невозможно.',
          confirmText: 'Удалить',
          onConfirm: () => {
            copingState.customCards = copingState.customCards.filter(c => c.id !== card.id);
            copingState.favorites = copingState.favorites.filter(id => id !== card.id);
            if (copingState.defaultCardId === card.id) {
              copingState.defaultCardId = null;
              try { localStorage.removeItem('pocket_psy_coping_default_card_id'); } catch(e) {}
            }
            try {
              localStorage.setItem('pocket_psy_custom_coping', JSON.stringify(copingState.customCards));
              localStorage.setItem('pocket_psy_coping_favs', JSON.stringify(copingState.favorites));
            } catch(e) {}

            const remaining = getFilteredCopingCards();
            if (copingState.currentIndex >= remaining.length) {
              copingState.currentIndex = Math.max(0, remaining.length - 1);
            }
            if (navigator.vibrate) try { navigator.vibrate(30); } catch(e) {}
            renderCopingFilters();
            renderCurrentCopingCard();
            showTrackerToast('Карточка удалена');
          }
        });
      });
    }

    // Edit mode toggle
    if (btnCopingEditMode) {
      btnCopingEditMode.addEventListener('click', () => {
        toggleCopingEditMode();
      });
    }
    if (modalBtnCopingListEditMode) {
      modalBtnCopingListEditMode.addEventListener('click', () => {
        toggleCopingEditMode();
      });
    }

    // Edit current active card
    if (btnCopingEditCurrent) {
      btnCopingEditCurrent.addEventListener('click', () => {
        const cards = getFilteredCopingCards();
        if (!cards || cards.length === 0) return;
        const card = cards[copingState.currentIndex];
        if (card && card.id && card.id.startsWith('custom-')) {
          openEditCopingCardModal(card.id);
        }
      });
    }

    // Drawer toggle for categories
    if (btnCopingToggleCategories && copingCategoriesDrawer) {
      btnCopingToggleCategories.addEventListener('click', () => {
        const isHidden = copingCategoriesDrawer.style.display === 'none' || !copingCategoriesDrawer.style.display;
        copingCategoriesDrawer.style.display = isHidden ? 'block' : 'none';
        btnCopingToggleCategories.classList.toggle('active', isHidden);
      });
    }

    // Toggle actions buttons (Main module & modal list)
    if (btnToggleCopingActions) {
      btnToggleCopingActions.addEventListener('click', () => {
        toggleCopingActions();
      });
    }
    if (modalBtnCopingToggleActions) {
      modalBtnCopingToggleActions.addEventListener('click', () => {
        toggleCopingActions();
      });
    }

    // Guide Modal
    if (btnCopingGuide && modalCopingGuide) {
      btnCopingGuide.addEventListener('click', () => {
        modalCopingGuide.classList.add('active');
        modalCopingGuide.setAttribute('aria-hidden', 'false');
      });
    }
    if (modalBtnCopingClose && modalCopingGuide) {
      modalBtnCopingClose.addEventListener('click', () => {
        modalCopingGuide.classList.remove('active');
        modalCopingGuide.setAttribute('aria-hidden', 'true');
      });
    }
    if (modalCopingGuide) {
      modalCopingGuide.addEventListener('click', (e) => {
        if (e.target === modalCopingGuide) {
          modalCopingGuide.classList.remove('active');
          modalCopingGuide.setAttribute('aria-hidden', 'true');
        }
      });
    }

    // Add Custom Card Modal (Simple & Advanced)
    function openCopingAddCardModal(isAdvanced) {
      if (!modalAddCopingCard) return;
      if (groupCustomCardAction) {
        groupCustomCardAction.style.display = isAdvanced ? 'block' : 'none';
      }
      if (modalAddCardTitle) {
        modalAddCardTitle.textContent = isAdvanced ? 'Создать расширенную карточку' : 'Создать карточку';
      }
      if (modalAddCardSubtitle) {
        modalAddCardSubtitle.textContent = isAdvanced
          ? 'Поддерживающая мысль и заземляющее действие'
          : 'Введите текст карточки';
      }
      if (inpCustomCardStatement) inpCustomCardStatement.value = '';
      if (inpCustomCardAction) inpCustomCardAction.value = '';
      if (inpCustomCardCat) inpCustomCardCat.value = 'none';
      resetModalScroll(modalAddCopingCard);
      setFullscreenEditor(modalAddCopingCard, true);
      modalAddCopingCard.classList.add('active');
      modalAddCopingCard.setAttribute('aria-hidden', 'false');
    }

    if (btnAddCustomCoping) {
      btnAddCustomCoping.addEventListener('click', () => openCopingAddCardModal(false));
    }
    if (btnAddAdvancedCoping) {
      btnAddAdvancedCoping.addEventListener('click', () => openCopingAddCardModal(true));
    }
    if (modalBtnAddCardCancel && modalAddCopingCard) {
      modalBtnAddCardCancel.addEventListener('click', () => {
        closeFullscreenModal(modalAddCopingCard);
      });
    }
    if (modalAddCopingCard) {
      modalAddCopingCard.addEventListener('click', (e) => {
        if (e.target === modalAddCopingCard) {
          closeFullscreenModal(modalAddCopingCard);
        }
      });
    }

    // Custom Card Form Submit (User can fill either statement OR action)
    if (formAddCopingCard) {
      formAddCopingCard.addEventListener('submit', (e) => {
        e.preventDefault();
        const cat = inpCustomCardCat ? inpCustomCardCat.value : 'none';
        const statement = inpCustomCardStatement ? inpCustomCardStatement.value.trim() : '';
        const action = inpCustomCardAction ? inpCustomCardAction.value.trim() : '';

        // Requirement 11: either field is sufficient
        if (!statement && !action) {
          if (inpCustomCardStatement) inpCustomCardStatement.focus();
          return;
        }

        const finalStatement = statement;
        const finalAction = action;

        const catNames = {
          none: 'Без категории',
          anxiety: 'Тревога',
          self_criticism: 'Самокритика',
          anger: 'Гнев',
          sadness: 'Грусть',
          burnout: 'Выгорание'
        };
        const catIcons = {
          none: '🏷️',
          anxiety: '🌊',
          self_criticism: '🛡️',
          anger: '🔥',
          sadness: '🌧️',
          burnout: '🔋'
        };

        const newCard = {
          id: `custom-${Date.now()}`,
          createdAt: new Date().toISOString(),
          category: cat,
          categoryName: catNames[cat] || 'Без категории',
          icon: catIcons[cat] || '🏷️',
          statement: finalStatement,
          action: finalAction
        };

        copingState.customCards.push(newCard);
        try {
          localStorage.setItem('pocket_psy_custom_coping', JSON.stringify(copingState.customCards));
        } catch(err) {}

        // Add to favorites by default so user easily finds their own cards
        copingState.favorites.push(newCard.id);
        try {
          localStorage.setItem('pocket_psy_coping_favs', JSON.stringify(copingState.favorites));
        } catch(err) {}

        // Reset form & close modal
        if (inpCustomCardStatement) inpCustomCardStatement.value = '';
        if (inpCustomCardAction) inpCustomCardAction.value = '';
        if (inpCustomCardCat) inpCustomCardCat.value = 'none';
        closeFullscreenModal(modalAddCopingCard);

        if (navigator.vibrate) try { navigator.vibrate([40, 50, 40]); } catch(e) {}

        // Switch to 'my_cards' category so user immediately sees their own created cards
        copingState.sourceFilter = 'my_cards';
        copingState.emotionFilter = 'all';
        copingState.showPlaceholder = false;
        copingState.currentIndex = Math.max(0, copingState.customCards.length - 1);
        renderCopingCategories();
        renderCurrentCopingCard();
      });
    }

    // Popular Coping Cards Modal Handlers
    if (btnOpenPopularCoping && modalPopularCoping) {
      btnOpenPopularCoping.addEventListener('click', () => {
        renderPopularCopingModal();
        modalPopularCoping.classList.add('active');
        modalPopularCoping.setAttribute('aria-hidden', 'false');
      });
    }
    if (modalBtnPopularCopingClose && modalPopularCoping) {
      modalBtnPopularCopingClose.addEventListener('click', () => {
        modalPopularCoping.classList.remove('active');
        modalPopularCoping.setAttribute('aria-hidden', 'true');
      });
    }
    if (modalBtnPopularCopingCloseX && modalPopularCoping) {
      modalBtnPopularCopingCloseX.addEventListener('click', () => {
        modalPopularCoping.classList.remove('active');
        modalPopularCoping.setAttribute('aria-hidden', 'true');
      });
    }
    if (modalPopularCoping) {
      modalPopularCoping.addEventListener('click', (e) => {
        if (e.target === modalPopularCoping) {
          modalPopularCoping.classList.remove('active');
          modalPopularCoping.setAttribute('aria-hidden', 'true');
        }
      });
    }

    // Coping Cards List Management Modal Handlers (Item 4)
    if (btnOpenCopingList && modalCopingCardsList) {
      btnOpenCopingList.addEventListener('click', () => {
        renderCopingCardsManageList(copingState.activeCategory || 'all');
        modalCopingCardsList.classList.add('active');
        modalCopingCardsList.setAttribute('aria-hidden', 'false');
      });
    }
    if (modalBtnCopingListClose && modalCopingCardsList) {
      modalBtnCopingListClose.addEventListener('click', () => {
        modalCopingCardsList.classList.remove('active');
        modalCopingCardsList.setAttribute('aria-hidden', 'true');
      });
    }
    if (modalBtnCopingListCloseX && modalCopingCardsList) {
      modalBtnCopingListCloseX.addEventListener('click', () => {
        modalCopingCardsList.classList.remove('active');
        modalCopingCardsList.setAttribute('aria-hidden', 'true');
      });
    }
    if (modalBtnCopingListAddNew) {
      modalBtnCopingListAddNew.addEventListener('click', () => {
        closeModalInstant(modalCopingCardsList);
        if (modalAddCopingCard) {
          resetModalScroll(modalAddCopingCard);
          setFullscreenEditor(modalAddCopingCard, true);
          modalAddCopingCard.classList.add('active');
          modalAddCopingCard.setAttribute('aria-hidden', 'false');
        }
      });
    }
    attachBackdropClose(modalCopingCardsList, () => {
      if (modalCopingCardsList) {
        modalCopingCardsList.classList.remove('active');
        modalCopingCardsList.setAttribute('aria-hidden', 'true');
      }
    });

    // Edit Custom Card Modal Handlers (Item 4)
    if (modalBtnEditCardCancel && modalEditCopingCard) {
      modalBtnEditCardCancel.addEventListener('click', () => {
        closeFullscreenModal(modalEditCopingCard);
      });
    }
    if (modalBtnEditCardCloseX && modalEditCopingCard) {
      modalBtnEditCardCloseX.addEventListener('click', () => {
        closeFullscreenModal(modalEditCopingCard);
      });
    }
    attachBackdropClose(modalEditCopingCard, () => {
      if (modalEditCopingCard) {
        closeFullscreenModal(modalEditCopingCard);
      }
    });

    if (formEditCopingCard) {
      formEditCopingCard.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = inpEditCardId ? inpEditCardId.value : null;
        if (!id) return;
        const card = (copingState.customCards || []).find(c => c.id === id);
        if (!card) return;

        const cat = inpEditCardCat ? inpEditCardCat.value : card.category;
        const statement = inpEditCardStatement ? inpEditCardStatement.value.trim() : card.statement;
        const action = inpEditCardAction ? inpEditCardAction.value.trim() : card.action;

        const catNames = {
          none: 'Без категории',
          anxiety: 'Тревога',
          self_criticism: 'Самокритика',
          anger: 'Гнев',
          sadness: 'Грусть',
          burnout: 'Выгорание'
        };
        const catIcons = {
          none: '🏷️',
          anxiety: '🌊',
          self_criticism: '🛡️',
          anger: '🔥',
          sadness: '🌧️',
          burnout: '🔋'
        };

        card.category = cat;
        card.categoryName = catNames[cat] || 'Без категории';
        card.icon = catIcons[cat] || '🏷️';
        card.statement = statement;
        card.action = action;
        if (!card.createdAt && card.id && card.id.startsWith('custom-')) {
          const ts = parseInt(card.id.replace('custom-', ''), 10);
          if (!isNaN(ts) && ts > 0) card.createdAt = new Date(ts).toISOString();
        }

        try {
          localStorage.setItem('pocket_psy_custom_coping', JSON.stringify(copingState.customCards));
        } catch(err) {}

        if (modalEditCopingCard) {
          closeFullscreenModal(modalEditCopingCard);
        }

        renderCopingCategories();
        renderCurrentCopingCard();
        renderCopingCardsManageList(copingState.manageListFilterCat || 'all');
        showTrackerToast('Карточка успешно обновлена');
      });
    }
  }

  function toggleCopingEditMode() {
    copingState.isEditMode = !copingState.isEditMode;
    updateCopingEditModeUI();
  }

  function updateCopingEditModeUI() {
    const isEdit = Boolean(copingState.isEditMode);
    const updateBtn = (btn) => {
      if (!btn) return;
      btn.classList.toggle('active', isEdit);
      btn.innerHTML = isEdit
        ? '<span class="edit-mode-icon">✓</span><span class="edit-mode-text">Готово</span>'
        : '<span class="edit-mode-icon">✏️</span><span class="edit-mode-text">Режим правки</span>';
    };
    updateBtn(btnCopingEditMode);
    updateBtn(modalBtnCopingListEditMode);
    renderCurrentCopingCard();
    if (modalCopingCardsList && modalCopingCardsList.classList.contains('active')) {
      renderCopingCardsManageList(copingState.manageListFilterCat || 'all');
    }
  }

  function renderCopingCardsManageList(filterCat = 'all') {
    if (!copingCardsManageList) return;
    copingState.manageListFilterCat = filterCat;

    const categories = [
      { id: 'all', title: 'Все', icon: '✨' },
      { id: 'anxiety', title: 'Тревога', icon: '🌊' },
      { id: 'self_criticism', title: 'Самокритика', icon: '🛡️' },
      { id: 'anger', title: 'Злость', icon: '🔥' },
      { id: 'sadness', title: 'Грусть', icon: '🌧️' },
      { id: 'burnout', title: 'Выгорание', icon: '🔋' }
    ];

    const myCards = getUserCopingCards();

    if (modalCopingListFilter) {
      modalCopingListFilter.innerHTML = categories.map(cat => {
        const count = cat.id === 'all'
          ? myCards.length
          : myCards.filter(c => c.category === cat.id).length;
        const isActive = cat.id === filterCat;
        return `
          <button type="button" class="coping-cat-pill ${isActive ? 'active' : ''}" data-manage-cat="${cat.id}">
            <span>${cat.icon} ${cat.title}</span>
            <span class="coping-emotion-count">${count}</span>
          </button>
        `;
      }).join('');

      modalCopingListFilter.querySelectorAll('.coping-cat-pill').forEach(pill => {
        pill.addEventListener('click', () => {
          const cId = pill.getAttribute('data-manage-cat') || 'all';
          renderCopingCardsManageList(cId);
        });
      });
    }

    // The saved-cards modal mirrors the user's own deck:
    // their own cards plus popular cards they explicitly added.
    let cards = myCards;
    if (filterCat !== 'all') {
      cards = myCards.filter(c => c.category === filterCat);
    }

    if (cards.length === 0) {
      copingCardsManageList.innerHTML = `
        <div style="text-align: center; padding: 24px 16px; color: var(--text-muted); font-size: 13px; background: rgba(37, 53, 44, 0.03); border-radius: 8px;">
          ${myCards.length === 0 ? 'У вас пока нет созданных карточек. Нажмите «➕ Создать карточку» ниже.' : 'В этой категории у вас пока нет своих карточек.'}
        </div>
      `;
      return;
    }

    const catNames = {
      none: 'Без категории',
      anxiety: 'Тревога',
      self_criticism: 'Самокритика',
      anger: 'Гнев / Злость',
      sadness: 'Грусть / Апатия',
      burnout: 'Выгорание'
    };

    copingCardsManageList.innerHTML = cards.map(card => {
      const badgeText = `${card.icon || '📑'} ${catNames[card.category] || card.categoryName || 'Без категории'}`;
      const isDefault = Boolean(copingState.defaultCardId && copingState.defaultCardId === card.id);
      const isCustom = Boolean(card.id && card.id.startsWith('custom-'));
      const hasAction = Boolean(card.action && card.action.trim().length > 0);
      const actionHtml = hasAction 
        ? `<div class="coping-manage-item-action">💡 <strong>Действие:</strong> ${escapeHtml(card.action)}</div>` 
        : '';

      return `
        <div class="coping-manage-item" data-card-id="${card.id}">
          <div class="coping-manage-item-top">
            <span class="coping-card-badge" style="font-size: 11.5px; padding: 2px 8px;">${badgeText}</span>
            <div style="display: flex; align-items: center; gap: 6px;">
              ${isDefault ? '<span class="coping-default-badge" style="display: inline-flex; font-size: 10.5px; padding: 2px 6px;">📌 По умолчанию</span>' : ''}
              <span style="font-size: 11px; color: ${isCustom ? '#2F4A3B' : '#8C7B68'}; font-weight: 700;">${isCustom ? '👤 Ваша карточка' : '📚 Из популярных'}</span>
            </div>
          </div>
          <div class="coping-manage-item-statement">“${escapeHtml(card.statement)}”</div>
          ${actionHtml}
          <div class="coping-manage-actions">
            <button type="button" class="coping-manage-btn coping-btn-view" data-action="view" data-card-id="${card.id}">
              <span>👁️ Открыть</span>
            </button>
            <button type="button" class="coping-manage-btn coping-btn-pin ${isDefault ? 'is-default' : ''}" data-action="pin" data-card-id="${card.id}" title="${isDefault ? 'Снять выбор по умолчанию' : 'Сделать карточкой по умолчанию'}">
              <span>${isDefault ? '📌 По умолчанию' : '☆ По умолчанию'}</span>
            </button>
            ${isCustom ? `<button type="button" class="coping-manage-btn coping-btn-edit" data-action="edit" data-card-id="${card.id}">
              <span>✏️ Редактировать</span>
            </button>` : ''}
            <button type="button" class="coping-manage-btn coping-btn-del" data-action="delete" data-card-id="${card.id}" style="background: rgba(181, 114, 95, 0.15); border-color: rgba(181, 114, 95, 0.4); color: #E0BDB7;">
              <span>${isCustom ? '🗑️ Удалить' : '🗑️ Убрать из колоды'}</span>
            </button>
          </div>
        </div>
      `;
    }).join('');

    copingCardsManageList.querySelectorAll('.coping-manage-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.getAttribute('data-action');
        const cardId = btn.getAttribute('data-card-id');
        if (action === 'view') {
          if (modalCopingCardsList) {
            modalCopingCardsList.classList.remove('active');
            modalCopingCardsList.setAttribute('aria-hidden', 'true');
          }
          copingState.hasUserOpenedCards = true;
          copingState.showPlaceholder = false;
          copingState.sourceFilter = 'my_cards';
          copingState.emotionFilter = 'all';
          renderCopingFilters();
          const deck = getFilteredCopingCards();
          const idx = deck.findIndex(c => c.id === cardId);
          copingState.currentIndex = idx >= 0 ? idx : 0;
          renderCurrentCopingCard();
        } else if (action === 'pin') {
          if (copingState.defaultCardId === cardId) {
            copingState.defaultCardId = null;
            try { localStorage.removeItem('pocket_psy_coping_default_card_id'); } catch(e) {}
            if (navigator.vibrate) try { navigator.vibrate(20); } catch(e) {}
            showTrackerToast('Карточка больше не отображается по умолчанию');
          } else {
            copingState.defaultCardId = cardId;
            try { localStorage.setItem('pocket_psy_coping_default_card_id', cardId); } catch(e) {}
            if (navigator.vibrate) try { navigator.vibrate([30, 50, 30]); } catch(e) {}
            showTrackerToast('📌 Карточка закреплена: будет отображаться первой при входе!');
          }
          renderCopingCardsManageList(copingState.manageListFilterCat || 'all');
          renderCurrentCopingCard();
        } else if (action === 'edit') {
          openEditCopingCardModal(cardId);
        } else if (action === 'delete') {
          const isCustomCard = Boolean(cardId && cardId.startsWith('custom-'));
          showConfirmDialog({
            title: isCustomCard ? 'Удалить карточку?' : 'Убрать карточку из колоды?',
            message: isCustomCard
              ? 'Вы действительно хотите удалить эту копинг-карточку? Восстановить её будет невозможно.'
              : 'Карточка останется в «Популярных», но исчезнет из вашей личной колоды. Продолжить?',
            confirmText: isCustomCard ? 'Удалить' : 'Убрать',
            onConfirm: () => {
              if (isCustomCard) {
                copingState.customCards = copingState.customCards.filter(c => c.id !== cardId);
              } else {
                copingState.addedPopularCardIds = copingState.addedPopularCardIds.filter(id => id !== cardId);
                saveAddedPopularCopingIds();
              }
              copingState.favorites = copingState.favorites.filter(id => id !== cardId);
              if (copingState.defaultCardId === cardId) {
                copingState.defaultCardId = null;
                try { localStorage.removeItem('pocket_psy_coping_default_card_id'); } catch(e) {}
              }
              try {
                localStorage.setItem('pocket_psy_custom_coping', JSON.stringify(copingState.customCards));
                localStorage.setItem('pocket_psy_coping_favs', JSON.stringify(copingState.favorites));
              } catch(e) {}
              const remaining = getFilteredCopingCards();
              if (copingState.currentIndex >= remaining.length) {
                copingState.currentIndex = Math.max(0, remaining.length - 1);
              }
              renderCopingCardsManageList(copingState.manageListFilterCat || 'all');
              renderCopingFilters();
              renderCurrentCopingCard();
              showTrackerToast(isCustomCard ? 'Карточка удалена' : 'Карточка убрана из колоды');
            }
          });
        }
      });
    });
  }

  function openEditCopingCardModal(cardId) {
    const card = (copingState.customCards || []).find(c => c.id === cardId);
    if (!card || !modalEditCopingCard) return;

    if (inpEditCardId) inpEditCardId.value = card.id;
    if (inpEditCardCat) inpEditCardCat.value = card.category || 'none';
    if (inpEditCardStatement) inpEditCardStatement.value = card.statement || '';
    if (inpEditCardAction) inpEditCardAction.value = card.action || '';

    // The "My cards" list must not remain underneath the full-screen editor.
    closeModalInstant(modalCopingCardsList);
    updateAllKeyboardDoneButtons();
    resetModalScroll(modalEditCopingCard);
    setFullscreenEditor(modalEditCopingCard, true);
    modalEditCopingCard.classList.add('active');
    modalEditCopingCard.setAttribute('aria-hidden', 'false');
  }

  // =========================================================================
  // MODULE 5: COGNITIVE THOUGHTS DIARY (ДНЕВНИК АВТОМАТИЧЕСКИХ МЫСЛЕЙ КПТ)
  // Протокол Аарона Бека: Выявление триггера, автоматической мысли,
  // определение когнитивного искажения и формулирование рационального ответа
  // Разделение: «Мои записи» и «Примеры и образцы»
  // =========================================================================
  const thoughtsState = {
    userRecords: [],
    sampleRecords: [],
    sourceFilter: 'my', // 'my' | 'samples' | 'all'
    filterEmotion: 'all',
    categoryTab: 'simple', // 'simple' | 'detailed'
    displayMode: 'table', // 'table' by default for simple thoughts table
    selectedEmotion: null,
    simpleEmotion: null,
    selectedDistortion: 'catastrophizing',
    isEditMode: false,
    initialized: false
  };

  // DOM elements for Thoughts module
  const btnNewThought = document.getElementById('btn-new-thought');
  const btnThoughtSimple = document.getElementById('btn-thought-simple');
  const btnThoughtFull = document.getElementById('btn-thought-full');
  const thoughtsTotalCount = document.getElementById('thoughts-total-count');
  const thoughtsFilterStrip = document.getElementById('thoughts-filter-strip');
  const thoughtsListContainer = document.getElementById('thoughts-list-container');
  const thoughtsTableContainer = document.getElementById('thoughts-table-container');
  const btnThoughtTabSimple = document.getElementById('btn-thought-tab-simple');
  const btnThoughtTabDetailed = document.getElementById('btn-thought-tab-detailed');
  const countThoughtsSimple = document.getElementById('count-thoughts-simple');
  const countThoughtsDetailed = document.getElementById('count-thoughts-detailed');
  const btnThoughtViewList = document.getElementById('btn-thought-view-list');
  const btnThoughtViewTable = document.getElementById('btn-thought-view-table');
  const btnThoughtsGuide = document.getElementById('btn-thoughts-guide');
  const modalThoughtsGuide = document.getElementById('modal-thoughts-guide');
  const modalBtnThoughtsGuideClose = document.getElementById('modal-btn-thoughts-guide-close');
  const btnThoughtsEditMode = document.getElementById('btn-thoughts-edit-mode');
  const btnThoughtsOpenExport = document.getElementById('btn-thoughts-open-export');

  // Simple Thought Breakdown Modal Elements
  const modalThoughtSimple = document.getElementById('modal-thought-simple');
  const formThoughtSimple = document.getElementById('form-thought-simple');
  const inpSimpleSituation = document.getElementById('inp-simple-situation');
  const inpSimpleAutomatic = document.getElementById('inp-simple-automatic');
  const simpleThoughtEmotionsPicker = document.getElementById('simple-thought-emotions-picker');
  const inpSimpleIntensity = document.getElementById('inp-simple-intensity');
  const inpSimpleEmotion = document.getElementById('inp-simple-emotion');
  const labelSimpleIntensity = document.getElementById('label-simple-intensity');
  const modalBtnThoughtSimpleCancel = document.getElementById('modal-btn-thought-simple-cancel');
  const modalBtnThoughtSimpleCloseX = document.getElementById('modal-btn-thought-simple-close-x');
  const btnSimpleToFull = document.getElementById('btn-simple-to-full');

  // Separate Sample Thoughts Modal Elements
  const btnOpenThoughtExamples = document.getElementById('btn-open-thought-examples');
  const modalThoughtExamples = document.getElementById('modal-thought-examples');
  const modalBtnThoughtExamplesClose = document.getElementById('modal-btn-thought-examples-close');
  const modalBtnThoughtExamplesCloseX = document.getElementById('modal-btn-thought-examples-close-x');
  const thoughtExamplesListContainer = document.getElementById('thought-examples-list-container');
  const countMyThoughtsBadge = document.getElementById('count-my-thoughts-badge');
  const btnToggleThoughtBreakdowns = document.getElementById('btn-toggle-thought-breakdowns');
  const thoughtsBreakdownsCollapse = document.getElementById('thoughts-breakdowns-collapse');
  const labelToggleThoughtBreakdowns = document.getElementById('label-toggle-thought-breakdowns');
  const countThoughtBreakdownsBadge = document.getElementById('count-thought-breakdowns-badge');
  const thoughtsBreakdownsContainer = document.getElementById('thoughts-breakdowns-container');
  const btnOpenThoughtExamplesExtended = document.getElementById('btn-open-thought-examples-extended');
  const modalThoughtDetails = document.getElementById('modal-thought-details');
  const thoughtDetailsContent = document.getElementById('thought-details-content');
  const modalBtnThoughtDetailsClose = document.getElementById('modal-btn-thought-details-close');
  const modalBtnThoughtDetailsCloseX = document.getElementById('modal-btn-thought-details-close-x');

  // Full Thought Breakdown Modal Elements
  const modalThoughtEditor = document.getElementById('modal-thought-editor');
  const modalBtnThoughtFullCloseX = document.getElementById('modal-btn-thought-full-close-x');
  const formThoughtEditor = document.getElementById('form-thought-editor');
  const inpThoughtSituation = document.getElementById('inp-thought-situation');
  const inpThoughtAutomatic = document.getElementById('inp-thought-automatic');
  const inpThoughtBeliefBefore = document.getElementById('inp-thought-belief-before');
  const labelBeliefBefore = document.getElementById('label-belief-before');
  const thoughtEmotionsPicker = document.getElementById('thought-emotions-picker');
  const inpThoughtIntensityBefore = document.getElementById('inp-thought-intensity-before');
  const inpThoughtEmotion = document.getElementById('inp-thought-emotion');
  const labelIntensityBefore = document.getElementById('label-intensity-before');
  const thoughtDistortionsPicker = document.getElementById('thought-distortions-picker');
  const thoughtDistortionHint = document.getElementById('thought-distortion-hint');
  const inpThoughtRational = document.getElementById('inp-thought-rational');
  const inpThoughtIntensityAfter = document.getElementById('inp-thought-intensity-after');
  const labelIntensityAfter = document.getElementById('label-intensity-after');
  const modalBtnThoughtCancel = document.getElementById('modal-btn-thought-cancel');
  let openFullThoughtModal = null;

  function initThoughtsModule() {
    loadThoughtsRecords();
    if (!thoughtsState.initialized) {
      setupThoughtsUI();
      thoughtsState.initialized = true;
    }
    renderThoughtsFilters();
    renderThoughtsList();
  }

  function loadThoughtsRecords() {
    try {
      const userSaved = localStorage.getItem('pocket_psy_thoughts_user');
      if (userSaved) {
        thoughtsState.userRecords = JSON.parse(userSaved);
      } else {
        const oldSaved = localStorage.getItem('pocket_psy_thoughts');
        if (oldSaved) {
          const parsed = JSON.parse(oldSaved);
          thoughtsState.userRecords = parsed.filter(p => !p.id.startsWith('th-def-'));
          saveThoughtsRecords();
        } else {
          thoughtsState.userRecords = [];
        }
      }
    } catch (e) {
      thoughtsState.userRecords = [];
    }

    const samples = (typeof DEFAULT_THOUGHT_RECORDS !== 'undefined') ? [...DEFAULT_THOUGHT_RECORDS] : [];
    thoughtsState.sampleRecords = samples.map(s => ({ ...s, isSample: true }));

    thoughtsState.sourceFilter = 'my';
    updateThoughtsSourceTabsUI();
  }

  function saveThoughtsRecords() {
    try {
      localStorage.setItem('pocket_psy_thoughts_user', JSON.stringify(thoughtsState.userRecords));
    } catch (e) {}
    updateThoughtsSourceTabsUI();
  }

  function updateThoughtsSourceTabsUI() {
    const countMy = document.getElementById('count-my-thoughts');
    const n = thoughtsState.userRecords.length;
    if (countMy) countMy.textContent = n;
    if (countMyThoughtsBadge) countMyThoughtsBadge.textContent = n;
  }

  function getActiveThoughtsPool() {
    // Only user's own recorded thoughts are in the default pool
    return thoughtsState.userRecords;
  }

  function renderThoughtExamplesModal() {
    if (!thoughtExamplesListContainer || typeof DEFAULT_THOUGHT_RECORDS === 'undefined') return;
    const fragment = document.createDocumentFragment();
    DEFAULT_THOUGHT_RECORDS.forEach(sample => {
      const emotionObj = (typeof THOUGHT_EMOTIONS !== 'undefined')
        ? THOUGHT_EMOTIONS.find(e => e.id === sample.emotion) || { name: 'Эмоция', icon: '⚡', color: '#A87E75' }
        : { name: 'Эмоция', icon: '⚡', color: '#A87E75' };

      const distortionObj = (typeof THOUGHT_DISTORTIONS !== 'undefined')
        ? THOUGHT_DISTORTIONS.find(d => d.id === sample.distortion) || { name: 'Искажение', desc: '' }
        : { name: 'Искажение', desc: '' };

      const card = document.createElement('div');
      card.className = 'thought-sample-card-item';
      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px;">
          <span class="thought-emotion-pill" style="background: ${emotionObj.color}22; color: ${emotionObj.color}; border: 1px solid ${emotionObj.color}44;">
            ${emotionObj.icon} ${emotionObj.name} • ${sample.emotionIntensityBefore}%
          </span>
          <span style="font-size: 11px; background: rgba(47, 74, 59, 0.15); color: #2F4A3B; border: 1px solid rgba(47, 74, 59, 0.3); padding: 2px 7px; border-radius: 4px; font-weight: 600;">
            Пример разбора КПТ
          </span>
        </div>

        <div class="thought-sample-row">
          <span class="thought-sample-label">1. Ситуация / Триггер:</span>
          <p class="thought-sample-text">${escapeHtml(sample.situation)}</p>
        </div>

        <div class="thought-sample-row">
          <span class="thought-sample-label">2. Автоматическая мысль:</span>
          <p class="thought-sample-text" style="color: #C98A78; font-weight: 600;">«${escapeHtml(sample.automaticThought)}»</p>
          <span style="font-size: 11px; color: var(--text-faint);">Убеждённость в мысли до разбора: ${sample.beliefBefore}%</span>
        </div>

        <div class="thought-sample-row">
          <span class="thought-sample-label">3. Когнитивная ошибка:</span>
          <div style="font-size: 12px; color: #5F6B61; background: rgba(37, 53, 44, 0.04); padding: 6px 10px; border-radius: 4px;">
            <strong style="color: #8C7B68;">${distortionObj.name}:</strong> ${distortionObj.desc}
          </div>
        </div>

        <div class="thought-sample-row">
          <span class="thought-sample-label">4. Рациональный ответ:</span>
          <div class="thought-sample-rational">
            ${escapeHtml(sample.rationalResponse)}
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px; padding-top: 8px; border-top: 1px dashed rgba(37, 53, 44, 0.08); flex-wrap: wrap; gap: 8px;">
          <div style="font-size: 11.5px; color: #6F927B; font-weight: 600;">
            📉 Интенсивность эмоции снизилась: ${sample.emotionIntensityBefore}% → ${sample.emotionIntensityAfter}%
          </div>
          <button type="button" class="thought-sample-use-btn" title="Использовать этот образец как шаблон для своей мысли">
            <span>📋 Использовать как образец</span>
          </button>
        </div>
      `;

      const btnUse = card.querySelector('.thought-sample-use-btn');
      if (btnUse) {
        btnUse.addEventListener('click', () => {
          if (modalThoughtExamples) {
            modalThoughtExamples.classList.remove('active');
            modalThoughtExamples.setAttribute('aria-hidden', 'true');
          }
          if (modalThoughtEditor) {
            if (inpThoughtSituation) inpThoughtSituation.value = sample.situation || '';
            if (inpThoughtAutomatic) inpThoughtAutomatic.value = sample.automaticThought || '';
            if (inpThoughtRational) inpThoughtRational.value = sample.rationalResponse || '';
            if (inpThoughtBeliefBefore) {
              inpThoughtBeliefBefore.value = String(sample.beliefBefore || 80);
              if (labelBeliefBefore) labelBeliefBefore.textContent = `${sample.beliefBefore || 80}%`;
            }
            if (inpThoughtIntensityBefore) {
              inpThoughtIntensityBefore.value = String(sample.emotionIntensityBefore || 75);
              if (labelIntensityBefore) labelIntensityBefore.textContent = `${sample.emotionIntensityBefore || 75}%`;
            }
            if (inpThoughtIntensityAfter) {
              inpThoughtIntensityAfter.value = String(sample.emotionIntensityAfter || 25);
              if (labelIntensityAfter) labelIntensityAfter.textContent = `${sample.emotionIntensityAfter || 25}%`;
            }
            thoughtsState.selectedEmotion = sample.emotion || 'anxiety';
            thoughtsState.selectedDistortion = sample.distortion || 'catastrophizing';
            resetModalScroll(modalThoughtEditor);
            setFullscreenEditor(modalThoughtEditor, true);
            modalThoughtEditor.classList.add('active');
            modalThoughtEditor.setAttribute('aria-hidden', 'false');
          }
        });
      }

      fragment.appendChild(card);
    });
    thoughtExamplesListContainer.innerHTML = '';
    thoughtExamplesListContainer.appendChild(fragment);
  }

  function setupThoughtsUI() {
    // Separate Examples Modal Wire-up
    if (btnOpenThoughtExamples && modalThoughtExamples) {
      btnOpenThoughtExamples.addEventListener('click', () => {
        renderThoughtExamplesModal();
        modalThoughtExamples.classList.add('active');
        modalThoughtExamples.setAttribute('aria-hidden', 'false');
      });
    }
    if (modalBtnThoughtExamplesClose && modalThoughtExamples) {
      modalBtnThoughtExamplesClose.addEventListener('click', () => {
        modalThoughtExamples.classList.remove('active');
        modalThoughtExamples.setAttribute('aria-hidden', 'true');
      });
    }
    if (modalBtnThoughtExamplesCloseX && modalThoughtExamples) {
      modalBtnThoughtExamplesCloseX.addEventListener('click', () => {
        modalThoughtExamples.classList.remove('active');
        modalThoughtExamples.setAttribute('aria-hidden', 'true');
      });
    }
    if (modalThoughtExamples) {
      modalThoughtExamples.addEventListener('click', (e) => {
        if (e.target === modalThoughtExamples) {
          modalThoughtExamples.classList.remove('active');
          modalThoughtExamples.setAttribute('aria-hidden', 'true');
        }
      });
    }
    if (modalBtnThoughtDetailsClose) {
      modalBtnThoughtDetailsClose.addEventListener('click', closeThoughtDetailsModal);
    }
    if (modalBtnThoughtDetailsCloseX) {
      modalBtnThoughtDetailsCloseX.addEventListener('click', closeThoughtDetailsModal);
    }
    if (modalThoughtDetails) {
      modalThoughtDetails.addEventListener('click', (e) => {
        if (e.target === modalThoughtDetails) closeThoughtDetailsModal();
      });
    }

    // Range slider updates
    if (inpThoughtBeliefBefore && labelBeliefBefore) {
      inpThoughtBeliefBefore.addEventListener('input', () => {
        labelBeliefBefore.textContent = `${inpThoughtBeliefBefore.value}%`;
      });
    }

    if (inpThoughtIntensityBefore && labelIntensityBefore) {
      inpThoughtIntensityBefore.addEventListener('input', () => {
        labelIntensityBefore.textContent = `${inpThoughtIntensityBefore.value}%`;
      });
    }

    if (inpThoughtIntensityAfter && labelIntensityAfter) {
      inpThoughtIntensityAfter.addEventListener('input', () => {
        labelIntensityAfter.textContent = `${inpThoughtIntensityAfter.value}%`;
      });
    }

    // Populate Emotion Selector
    if (thoughtEmotionsPicker && typeof THOUGHT_EMOTIONS !== 'undefined') {
      thoughtEmotionsPicker.innerHTML = '';
      THOUGHT_EMOTIONS.forEach(em => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `thought-emotion-btn ${thoughtsState.selectedEmotion === em.id ? 'active' : ''}`;
        btn.setAttribute('data-emotion-id', em.id);
        btn.style.color = em.color;
        btn.innerHTML = `<span>${em.icon}</span> <span>${em.name}</span>`;
        btn.addEventListener('click', () => {
          thoughtEmotionsPicker.querySelectorAll('.thought-emotion-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          thoughtsState.selectedEmotion = em.id;
          if (inpThoughtIntensityBefore) {
            inpThoughtIntensityBefore.disabled = false;
            const val = inpThoughtIntensityBefore.value;
            const pts = Math.round(val / 10);
            if (labelIntensityBefore) labelIntensityBefore.textContent = `${pts} из 10 (${val}%)`;
          }
        });
        thoughtEmotionsPicker.appendChild(btn);
      });
    }

    // Populate Distortions Grid
    if (thoughtDistortionsPicker && typeof THOUGHT_DISTORTIONS !== 'undefined') {
      thoughtDistortionsPicker.innerHTML = '';
      THOUGHT_DISTORTIONS.forEach(d => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = `thought-distortion-chip ${d.id === thoughtsState.selectedDistortion ? 'active' : ''}`;
        chip.setAttribute('data-distortion-id', d.id);
        chip.innerHTML = `${d.name}`;
        chip.addEventListener('click', () => {
          thoughtDistortionsPicker.querySelectorAll('.thought-distortion-chip').forEach(c => c.classList.remove('active'));
          chip.classList.add('active');
          thoughtsState.selectedDistortion = d.id;
          if (thoughtDistortionHint) {
            thoughtDistortionHint.innerHTML = `<strong>${d.name}:</strong> ${d.desc} <em>${d.example || ''}</em>`;
          }
        });
        thoughtDistortionsPicker.appendChild(chip);
      });
      // Initial hint
      const initDist = THOUGHT_DISTORTIONS.find(d => d.id === thoughtsState.selectedDistortion) || THOUGHT_DISTORTIONS[0];
      if (initDist && thoughtDistortionHint) {
        thoughtDistortionHint.innerHTML = `<strong>${initDist.name}:</strong> ${initDist.desc} <em>${initDist.example || ''}</em>`;
      }
    }

    // Populate Simple Emotion Selector
    if (simpleThoughtEmotionsPicker && typeof THOUGHT_EMOTIONS !== 'undefined') {
      simpleThoughtEmotionsPicker.innerHTML = '';
      THOUGHT_EMOTIONS.forEach(em => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `thought-emotion-btn ${thoughtsState.simpleEmotion === em.id ? 'active' : ''}`;
        btn.setAttribute('data-emotion-id', em.id);
        btn.style.color = em.color;
        btn.innerHTML = `<span>${em.icon}</span> <span>${em.name}</span>`;
        btn.addEventListener('click', () => {
          simpleThoughtEmotionsPicker.querySelectorAll('.thought-emotion-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          thoughtsState.simpleEmotion = em.id;
          if (inpSimpleIntensity) {
            inpSimpleIntensity.disabled = false;
            const val = inpSimpleIntensity.value;
            const pts = Math.round(val / 10);
            if (labelSimpleIntensity) labelSimpleIntensity.textContent = `${pts} из 10 (${val}%)`;
          }
        });
        simpleThoughtEmotionsPicker.appendChild(btn);
      });
    }

    if (inpSimpleIntensity && labelSimpleIntensity) {
      const updateSimpleIntensity = () => {
        const val = inpSimpleIntensity.value;
        const pts = Math.round(val / 10);
        labelSimpleIntensity.textContent = `${pts} из 10 (${val}%)`;
      };
      inpSimpleIntensity.addEventListener('input', updateSimpleIntensity);
      inpSimpleIntensity.addEventListener('change', updateSimpleIntensity);
    }

    if (inpThoughtIntensityBefore && labelIntensityBefore) {
      const updateIntensityBefore = () => {
        const val = inpThoughtIntensityBefore.value;
        const pts = Math.round(val / 10);
        labelIntensityBefore.textContent = `${pts} из 10 (${val}%)`;
      };
      inpThoughtIntensityBefore.addEventListener('input', updateIntensityBefore);
      inpThoughtIntensityBefore.addEventListener('change', updateIntensityBefore);
    }

    // Function to open full thought modal (optionally pre-filled)
    openFullThoughtModal = function(initialData) {
      if (!modalThoughtEditor) return;
      if (initialData) {
        if (inpThoughtSituation) inpThoughtSituation.value = initialData.situation || '';
        if (inpThoughtAutomatic) inpThoughtAutomatic.value = initialData.automaticThought || '';
        if (inpThoughtRational) inpThoughtRational.value = initialData.rationalResponse || '';
        const initialEmotionText = initialData.emotionText || (typeof THOUGHT_EMOTIONS !== 'undefined'
          ? (THOUGHT_EMOTIONS.find(e => e.id === initialData.emotion) || {}).name
          : '') || initialData.emotion || '';
        if (inpThoughtEmotion) inpThoughtEmotion.value = initialEmotionText;
        thoughtsState.selectedEmotion = initialEmotionText || null;
        if (inpThoughtIntensityBefore) {
          const val = initialData.emotionIntensityBefore || 50;
          inpThoughtIntensityBefore.value = String(val);
          inpThoughtIntensityBefore.disabled = !thoughtsState.selectedEmotion;
          if (labelIntensityBefore) {
            if (thoughtsState.selectedEmotion) {
              const pts = Math.round(val / 10);
              labelIntensityBefore.textContent = `${pts} из 10 (${val}%)`;
            } else {
              labelIntensityBefore.textContent = 'не выбрана';
            }
          }
        }
      } else {
        if (inpThoughtSituation) inpThoughtSituation.value = '';
        if (inpThoughtAutomatic) inpThoughtAutomatic.value = '';
        if (inpThoughtRational) inpThoughtRational.value = '';
        if (inpThoughtEmotion) inpThoughtEmotion.value = '';
        thoughtsState.selectedEmotion = null;
        if (inpThoughtBeliefBefore) {
          inpThoughtBeliefBefore.value = '80';
          if (labelBeliefBefore) labelBeliefBefore.textContent = '80%';
        }
        if (inpThoughtIntensityBefore) {
          inpThoughtIntensityBefore.value = '50';
          inpThoughtIntensityBefore.disabled = true;
          if (labelIntensityBefore) labelIntensityBefore.textContent = 'не выбрана';
        }
        if (inpThoughtIntensityAfter) {
          inpThoughtIntensityAfter.value = '25';
          if (labelIntensityAfter) labelIntensityAfter.textContent = '25%';
        }
      }

      if (thoughtEmotionsPicker) {
        thoughtEmotionsPicker.querySelectorAll('.thought-emotion-btn').forEach(b => {
          b.classList.toggle('active', Boolean(thoughtsState.selectedEmotion) && b.getAttribute('data-emotion-id') === thoughtsState.selectedEmotion);
        });
      }

      resetModalScroll(modalThoughtEditor);
      setFullscreenEditor(modalThoughtEditor, true);
      modalThoughtEditor.classList.add('active');
      modalThoughtEditor.setAttribute('aria-hidden', 'false');
    }

    // Simple Breakdown Open Button
    if (btnThoughtSimple && modalThoughtSimple) {
      btnThoughtSimple.addEventListener('click', () => {
        if (inpSimpleSituation) inpSimpleSituation.value = '';
        if (inpSimpleAutomatic) inpSimpleAutomatic.value = '';
        if (inpSimpleEmotion) inpSimpleEmotion.value = '';
        if (inpSimpleIntensity) {
          inpSimpleIntensity.value = '50';
          inpSimpleIntensity.disabled = true;
          if (labelSimpleIntensity) labelSimpleIntensity.textContent = 'не выбрана';
        }
        thoughtsState.simpleEmotion = null;
        if (simpleThoughtEmotionsPicker) {
          simpleThoughtEmotionsPicker.querySelectorAll('.thought-emotion-btn').forEach(b => {
            b.classList.remove('active');
          });
        }
        resetModalScroll(modalThoughtSimple);
        setFullscreenEditor(modalThoughtSimple, true);
        modalThoughtSimple.classList.add('active');
        modalThoughtSimple.setAttribute('aria-hidden', 'false');
      });
    }

    // Full Breakdown Open Button
    if (btnThoughtFull) {
      btnThoughtFull.addEventListener('click', () => openFullThoughtModal());
    }
    if (btnNewThought) {
      btnNewThought.addEventListener('click', () => openFullThoughtModal());
    }

    // Simple Modal Close / Cancel
    if (modalBtnThoughtSimpleCancel && modalThoughtSimple) {
      modalBtnThoughtSimpleCancel.addEventListener('click', () => {
        closeFullscreenModal(modalThoughtSimple);
      });
    }
    if (modalBtnThoughtSimpleCloseX && modalThoughtSimple) {
      modalBtnThoughtSimpleCloseX.addEventListener('click', () => {
        closeFullscreenModal(modalThoughtSimple);
      });
    }
    if (modalThoughtSimple) {
      modalThoughtSimple.addEventListener('click', (e) => {
        if (e.target === modalThoughtSimple) {
          closeFullscreenModal(modalThoughtSimple);
        }
      });
    }

    // Transfer from Simple to Full Breakdown
    if (btnSimpleToFull && modalThoughtSimple) {
      btnSimpleToFull.addEventListener('click', () => {
        const situation = inpSimpleSituation ? inpSimpleSituation.value : '';
        const automaticThought = inpSimpleAutomatic ? inpSimpleAutomatic.value : '';
        const emotionText = inpSimpleEmotion ? inpSimpleEmotion.value.trim() : '';
        const emotionIntensityBefore = inpSimpleIntensity ? inpSimpleIntensity.value : '50';

        closeFullscreenModal(modalThoughtSimple);

        openFullThoughtModal({ situation, automaticThought, emotionText, emotionIntensityBefore });
      });
    }

    // Simple Form Submit
    if (formThoughtSimple) {
      formThoughtSimple.addEventListener('submit', (e) => {
        e.preventDefault();
        const situation = inpSimpleSituation ? inpSimpleSituation.value.trim() : '';
        const automatic = inpSimpleAutomatic ? inpSimpleAutomatic.value.trim() : '';
        if (!automatic) {
          if (inpSimpleAutomatic) inpSimpleAutomatic.focus();
          return;
        }

        const emotionText = inpSimpleEmotion ? inpSimpleEmotion.value.trim() : '';
        const newRec = {
          id: `thought-${Date.now()}`,
          date: new Date().toISOString(),
          situation: situation,
          automaticThought: automatic,
          beliefBefore: null,
          emotion: emotionText || null,
          emotionText: emotionText,
          emotionIntensityBefore: null,
          distortion: '',
          rationalResponse: '',
          emotionIntensityAfter: null,
          isSimple: true,
          isSample: false
        };

        thoughtsState.userRecords.unshift(newRec);
        saveThoughtsRecords();

        closeFullscreenModal(modalThoughtSimple);

        if (typeof appAudio !== 'undefined' && appAudio.playChime) appAudio.playChime(659.2);
        if (navigator.vibrate) try { navigator.vibrate([40, 50, 40]); } catch (err) {}

        thoughtsState.categoryTab = 'simple';
        renderThoughtsFilters();
        renderThoughtsList();
        // Do not reveal already saved thoughts automatically after saving:
        // the user opens them explicitly with the toggle button.
        const thoughtsCollapseEl = document.getElementById('thoughts-saved-records-collapse');
        const labelThoughtsEl = document.getElementById('label-toggle-thoughts-records');
        if (thoughtsCollapseEl) thoughtsCollapseEl.style.display = 'none';
        if (labelThoughtsEl) labelThoughtsEl.textContent = 'Показать сохранённые мысли';
        showTrackerToast('⚡ Мысль зафиксирована в простом разборе!');
      });
    }

    // Full Modal Close / Cancel
    if (modalBtnThoughtCancel && modalThoughtEditor) {
      modalBtnThoughtCancel.addEventListener('click', () => {
        closeFullscreenModal(modalThoughtEditor);
      });
    }
    if (modalBtnThoughtFullCloseX && modalThoughtEditor) {
      modalBtnThoughtFullCloseX.addEventListener('click', () => {
        closeFullscreenModal(modalThoughtEditor);
      });
    }
    if (modalThoughtEditor) {
      modalThoughtEditor.addEventListener('click', (e) => {
        if (e.target === modalThoughtEditor) {
          closeFullscreenModal(modalThoughtEditor);
        }
      });
    }

    // Full Form Submit
    if (formThoughtEditor) {
      formThoughtEditor.addEventListener('submit', (e) => {
        e.preventDefault();
        const situation = inpThoughtSituation ? inpThoughtSituation.value.trim() : '';
        const automatic = inpThoughtAutomatic ? inpThoughtAutomatic.value.trim() : '';
        const rational = inpThoughtRational ? inpThoughtRational.value.trim() : '';

        if (!situation || !automatic || !rational) return;

        const emotionText = inpThoughtEmotion ? inpThoughtEmotion.value.trim() : '';
        const newRec = {
          id: `thought-${Date.now()}`,
          date: new Date().toISOString(),
          situation: situation,
          automaticThought: automatic,
          beliefBefore: parseInt(inpThoughtBeliefBefore ? inpThoughtBeliefBefore.value : '80', 10),
          emotion: emotionText || null,
          emotionText: emotionText,
          emotionIntensityBefore: null,
          distortion: thoughtsState.selectedDistortion || 'catastrophizing',
          rationalResponse: rational,
          emotionIntensityAfter: inpThoughtIntensityAfter
            ? parseInt(inpThoughtIntensityAfter.value, 10)
            : null,
          isSimple: false,
          isSample: false
        };

        thoughtsState.userRecords.unshift(newRec);
        saveThoughtsRecords();

        closeFullscreenModal(modalThoughtEditor);

        if (typeof appAudio !== 'undefined' && appAudio.playChime) appAudio.playChime(659.2);
        if (navigator.vibrate) try { navigator.vibrate([40, 50, 40]); } catch (err) {}

        thoughtsState.sourceFilter = 'my';
        // Keep the quick-thoughts view active; the breakdown is opened only
        // through its own "Показать разбор мыслей" button.
        thoughtsState.categoryTab = 'simple';
        updateThoughtsSourceTabsUI();
        renderThoughtsFilters();
        renderThoughtsList();
        if (thoughtsBreakdownsCollapse) thoughtsBreakdownsCollapse.style.display = 'none';
        if (labelToggleThoughtBreakdowns) labelToggleThoughtBreakdowns.textContent = 'Показать разбор мыслей';
        showTrackerToast('🌱 Полный разбор мысли сохранён!');
      });
    }

    // Guide Modal
    if (btnThoughtsGuide && modalThoughtsGuide) {
      btnThoughtsGuide.addEventListener('click', () => {
        modalThoughtsGuide.classList.add('active');
        modalThoughtsGuide.setAttribute('aria-hidden', 'false');
      });
    }
    if (modalBtnThoughtsGuideClose && modalThoughtsGuide) {
      modalBtnThoughtsGuideClose.addEventListener('click', () => {
        modalThoughtsGuide.classList.remove('active');
        modalThoughtsGuide.setAttribute('aria-hidden', 'true');
      });
    }
    if (modalThoughtsGuide) {
      modalThoughtsGuide.addEventListener('click', (e) => {
        if (e.target === modalThoughtsGuide) {
          modalThoughtsGuide.classList.remove('active');
          modalThoughtsGuide.setAttribute('aria-hidden', 'true');
        }
      });
    }

    // Item 4: Thoughts Category Switcher (Простые vs Подробный разбор)
    if (btnThoughtTabSimple) {
      btnThoughtTabSimple.addEventListener('click', () => {
        thoughtsState.categoryTab = 'simple';
        renderThoughtsList();
      });
    }
    if (btnThoughtTabDetailed) {
      btnThoughtTabDetailed.addEventListener('click', () => {
        thoughtsState.categoryTab = 'detailed';
        renderThoughtsList();
      });
    }

    // Item 4: Thoughts View Switcher (Список vs Таблица)
    if (btnThoughtViewList) {
      btnThoughtViewList.addEventListener('click', () => {
        thoughtsState.displayMode = 'list';
        renderThoughtsList();
      });
    }
    if (btnThoughtViewTable) {
      btnThoughtViewTable.addEventListener('click', () => {
        thoughtsState.displayMode = 'table';
        renderThoughtsList();
      });
    }

    // Edit mode toggle
    if (btnThoughtsEditMode) {
      btnThoughtsEditMode.addEventListener('click', () => {
        toggleThoughtsEditMode();
      });
    }

    // Toggle Collapse for Saved Thoughts Records
    const btnToggleThoughts = document.getElementById('btn-toggle-thoughts-records');
    const thoughtsCollapse = document.getElementById('thoughts-saved-records-collapse');
    const labelToggleThoughts = document.getElementById('label-toggle-thoughts-records');
    if (btnToggleThoughts && thoughtsCollapse) {
      btnToggleThoughts.addEventListener('click', () => {
        const isHidden = thoughtsCollapse.style.display === 'none' || !thoughtsCollapse.style.display;
        thoughtsCollapse.style.display = isHidden ? 'block' : 'none';
        if (labelToggleThoughts) {
          labelToggleThoughts.textContent = isHidden ? 'Скрыть сохранённые мысли' : 'Показать сохранённые мысли';
        }
        if (isHidden) {
          renderThoughtsTable();
        }
      });
    }

    // Export button in Thoughts
    if (btnThoughtsOpenExport) {
      btnThoughtsOpenExport.addEventListener('click', () => {
        if (typeof openExportDataModal === 'function') openExportDataModal();
      });
    }

    // Toggle Collapse for Saved Thought Breakdowns (extended mode)
    if (btnToggleThoughtBreakdowns && thoughtsBreakdownsCollapse) {
      btnToggleThoughtBreakdowns.addEventListener('click', () => {
        const isHidden = thoughtsBreakdownsCollapse.style.display === 'none' || !thoughtsBreakdownsCollapse.style.display;
        thoughtsBreakdownsCollapse.style.display = isHidden ? 'block' : 'none';
        if (labelToggleThoughtBreakdowns) {
          labelToggleThoughtBreakdowns.textContent = isHidden ? 'Скрыть разбор мыслей' : 'Показать разбор мыслей';
        }
        if (isHidden) {
          renderThoughtBreakdowns(thoughtsState.userRecords.filter(r => !r.isSimple && !!r.rationalResponse));
        }
      });
    }

    // Examples modal also opens from the breakdowns tab
    if (btnOpenThoughtExamplesExtended) {
      btnOpenThoughtExamplesExtended.addEventListener('click', () => {
        if (btnOpenThoughtExamples) btnOpenThoughtExamples.click();
      });
    }
  }

  function toggleThoughtsEditMode() {
    thoughtsState.isEditMode = !thoughtsState.isEditMode;
    updateThoughtsEditModeUI();
  }

  function updateThoughtsEditModeUI() {
    const isEdit = Boolean(thoughtsState.isEditMode);
    if (btnThoughtsEditMode) {
      btnThoughtsEditMode.classList.toggle('active', isEdit);
      btnThoughtsEditMode.innerHTML = isEdit
        ? '<span class="edit-mode-icon">✓</span><span class="edit-mode-text">Готово</span>'
        : '<span class="edit-mode-icon">✏️</span><span class="edit-mode-text">Режим правки</span>';
    }
    renderThoughtsList();
  }

  // Emotion filter strip removed per requirement (kept empty for compatibility)
  function renderThoughtsFilters() {
    if (!thoughtsFilterStrip) return;
    thoughtsFilterStrip.innerHTML = '';
  }

  function formatThoughtDate(isoStr) {
    try {
      const d = new Date(isoStr);
      const months = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
      const day = d.getDate();
      const month = months[d.getMonth()] || '';
      const hours = String(d.getHours()).padStart(2, '0');
      const mins = String(d.getMinutes()).padStart(2, '0');
      return `${day} ${month}, ${hours}:${mins}`;
    } catch(e) {
      return '';
    }
  }

  function renderThoughtsList() {
    const pool = getActiveThoughtsPool();
    const simplePool = pool.filter(r => r.isSimple || !r.rationalResponse);
    const detailedPool = pool.filter(r => !r.isSimple && !!r.rationalResponse);

    if (countThoughtsSimple) countThoughtsSimple.textContent = simplePool.length;
    if (countThoughtsDetailed) countThoughtsDetailed.textContent = detailedPool.length;

    if (thoughtsTotalCount) {
      const n = pool.length;
      let word = 'записей';
      if (n % 10 === 1 && n % 100 !== 11) word = 'запись';
      else if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) word = 'записи';
      thoughtsTotalCount.textContent = `${n} ${word}`;
    }

    const badgeCount = document.getElementById('count-my-thoughts-badge');
    if (badgeCount) {
      badgeCount.textContent = simplePool.length;
    }
    if (countThoughtBreakdownsBadge) {
      countThoughtBreakdownsBadge.textContent = detailedPool.length;
    }
    renderThoughtsTable(simplePool);
    renderThoughtBreakdowns(detailedPool);

    const currentTab = thoughtsState.categoryTab || 'simple';
    const isSimpleTab = currentTab === 'simple';
    const currentMode = thoughtsState.displayMode || 'list';

    // Update tab switch buttons
    if (btnThoughtTabSimple && btnThoughtTabDetailed) {
      if (isSimpleTab) {
        btnThoughtTabSimple.classList.add('active');
        btnThoughtTabDetailed.classList.remove('active');
      } else {
        btnThoughtTabSimple.classList.remove('active');
        btnThoughtTabDetailed.classList.add('active');
      }
    }

    // Update view switch buttons
    if (btnThoughtViewList && btnThoughtViewTable) {
      if (currentMode === 'table') {
        btnThoughtViewTable.classList.add('active');
        btnThoughtViewList.classList.remove('active');
      } else {
        btnThoughtViewList.classList.add('active');
        btnThoughtViewTable.classList.remove('active');
      }
    }

    const filtered = isSimpleTab ? simplePool : detailedPool;

    // Handle Table Mode
    if (currentMode === 'table') {
      if (thoughtsListContainer) thoughtsListContainer.style.display = 'none';
      if (thoughtsTableContainer) {
        thoughtsTableContainer.style.display = 'block';
        renderThoughtsTable(simplePool);
      }
      return;
    }

    // Handle List Mode
    if (thoughtsTableContainer) thoughtsTableContainer.style.display = 'none';
    if (!thoughtsListContainer) return;
    thoughtsListContainer.style.display = 'flex';
    thoughtsListContainer.innerHTML = '';

    if (filtered.length === 0) {
      thoughtsListContainer.innerHTML = `
        <div style="text-align: center; padding: 36px 16px; background: rgba(37, 53, 44, 0.03); border: 1px dashed rgba(37, 53, 44, 0.12); border-radius: var(--radius-md); width: 100%;">
          <div style="font-size: 32px; margin-bottom: 8px;">${isSimpleTab ? '⚡' : '🔍'}</div>
          <h4 style="font-size: 15px; color: #25352C; margin-bottom: 6px;">
            ${isSimpleTab ? 'Нет сохранённых простых мыслей' : 'Нет записей с полным разбором КПТ'}
          </h4>
          <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 0; line-height: 1.45;">
            ${isSimpleTab 
              ? 'Используйте кнопку «⚡ Записать мысль» для быстрой фиксации.' 
              : 'Используйте кнопку «🔍 Полный разбор» для 5-шагового протокола Бека.'}
          </p>
        </div>
      `;
      return;
    }

    filtered.forEach(rec => {
      const emotionObj = rec.emotion
        ? ((typeof THOUGHT_EMOTIONS !== 'undefined')
          ? THOUGHT_EMOTIONS.find(e => e.id === rec.emotion || e.name === rec.emotion) || { name: rec.emotion, icon: '⚡', color: '#B0895A' }
          : { name: rec.emotion, icon: '⚡', color: '#B0895A' })
        : { name: 'Эмоция', icon: '⚡', color: '#B0895A' };

      const distortionObj = (typeof THOUGHT_DISTORTIONS !== 'undefined')
        ? THOUGHT_DISTORTIONS.find(d => d.id === rec.distortion) || { name: 'Искажение', desc: '' }
        : { name: 'Искажение', desc: '' };

      const deleteBtnHtml = (!rec.isSample && thoughtsState.isEditMode)
        ? `<button type="button" class="btn-thought-delete" title="Удалить запись" data-rec-id="${rec.id}">🗑️</button>`
        : ``;

      if (isSimpleTab) {
        // Minimalist display for simple thoughts: ONLY thought text + reveal emotion button + delete
        const card = document.createElement('div');
        card.className = 'thought-card thought-card-simple-minimal';
        card.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;">
            <div class="thought-simple-main-text">«${escapeHtml(rec.automaticThought)}»</div>
            ${deleteBtnHtml}
          </div>
          <div style="margin-top: 10px; display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
            <button type="button" class="btn-toggle-thought-emotion" data-rec-id="${rec.id}">
              👁️ Эмоция
            </button>
            <span class="thought-simple-revealed-emotion" style="display: none;">
              ${rec.emotion ? `${emotionObj.icon} ${emotionObj.name}${rec.emotionIntensityBefore !== null && rec.emotionIntensityBefore !== undefined ? ` (${rec.emotionIntensityBefore}%)` : ''}` : 'Эмоция не указана'}
            </span>
          </div>
        `;

        const btnToggleEmotion = card.querySelector('.btn-toggle-thought-emotion');
        const revealedEmotion = card.querySelector('.thought-simple-revealed-emotion');
        if (btnToggleEmotion && revealedEmotion) {
          btnToggleEmotion.addEventListener('click', (e) => {
            e.stopPropagation();
            const isHidden = revealedEmotion.style.display === 'none';
            revealedEmotion.style.display = isHidden ? 'inline-flex' : 'none';
            btnToggleEmotion.textContent = isHidden ? 'Скрыть эмоцию' : '👁️ Эмоция';
          });
        }

        const btnDel = card.querySelector('.btn-thought-delete');
        if (btnDel) {
          btnDel.addEventListener('click', (e) => {
            e.stopPropagation();
            showConfirmDialog({
              title: 'Удалить запись мысли?',
              message: 'Вы действительно хотите удалить эту запись из дневника мыслей? Восстановить её будет невозможно.',
              confirmText: 'Удалить',
              onConfirm: () => {
                deleteThoughtRecord(rec.id);
                showTrackerToast('Запись мысли удалена');
              }
            });
          });
        }

        thoughtsListContainer.appendChild(card);
      } else {
        // Detailed Thought Card (without the "Дополнить до полного разбора" button!)
        const diff = (rec.emotionIntensityBefore || 0) - (rec.emotionIntensityAfter || 0);
        const card = document.createElement('div');
        card.className = 'thought-card';
        card.innerHTML = `
          <div class="thought-card-top">
            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
              <span class="thought-emotion-pill" style="background: ${emotionObj.color}22; color: ${emotionObj.color}; border: 1px solid ${emotionObj.color}44;">
                ${emotionObj.icon} ${emotionObj.name} • ${rec.emotionIntensityBefore || 75}%
              </span>
              <span class="thought-date">${formatThoughtDate(rec.date)}</span>
            </div>
            ${deleteBtnHtml}
          </div>

          <div style="margin-bottom: 8px;">
            <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-faint); font-weight: 700;">Ситуация:</span>
            <p class="thought-card-text" style="color: var(--text-light); margin-top: 2px;">${escapeHtml(rec.situation)}</p>
          </div>

          <div style="margin-bottom: 10px; background: rgba(37, 53, 44, 0.03); padding: 9px 12px; border-radius: var(--radius-sm); border: 1px solid rgba(37, 53, 44, 0.06);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #A87E75; font-weight: 700;">Автоматическая мысль:</span>
              <span style="font-size: 11.5px; font-weight: 700; color: #A87E75;">Вера: ${rec.beliefBefore || 80}%</span>
            </div>
            <p style="font-size: 13px; color: #25352C; font-style: italic; margin: 0;">«${escapeHtml(rec.automaticThought)}»</p>
          </div>

          <div>
            <span class="thought-distortion-tag">
              ⚠️ ${distortionObj.name}
            </span>
          </div>

          <div class="thought-rational-box">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <span style="font-size: 11.5px; font-weight: 700; color: #6F927B;">🌱 Рациональный ответ:</span>
              <span class="thought-intensity-diff" style="color: #6F927B;">
                ${rec.emotionIntensityBefore}% → ${rec.emotionIntensityAfter}% ${diff > 0 ? `(-${diff}%)` : ''}
              </span>
            </div>
            <p style="margin: 0; font-size: 13px; line-height: 1.45;">${escapeHtml(rec.rationalResponse)}</p>
          </div>

          <div class="thought-details-accordion" style="display: none; margin-top: 10px; padding-top: 10px; border-top: 1px dashed rgba(37, 53, 44, 0.1); font-size: 12px; color: var(--text-muted);">
            <p style="margin: 0 0 6px 0;"><strong>О когнитивной ловушке:</strong> ${distortionObj.desc}</p>
            ${distortionObj.example ? `<p style="margin: 0; font-style: italic; color: var(--text-faint);">${distortionObj.example}</p>` : ''}
          </div>
        `;

        card.addEventListener('click', (e) => {
          if (e.target.closest('.btn-thought-delete')) return;
          const details = card.querySelector('.thought-details-accordion');
          if (details) {
            const isHidden = details.style.display === 'none';
            details.style.display = isHidden ? 'block' : 'none';
          }
        });

        const btnDel = card.querySelector('.btn-thought-delete');
        if (btnDel) {
          btnDel.addEventListener('click', (e) => {
            e.stopPropagation();
            showConfirmDialog({
              title: 'Удалить запись мысли?',
              message: 'Вы действительно хотите удалить эту запись из дневника мыслей? Восстановить её будет невозможно.',
              confirmText: 'Удалить',
              onConfirm: () => {
                deleteThoughtRecord(rec.id);
                showTrackerToast('Запись мысли удалена');
              }
            });
          });
        }

        thoughtsListContainer.appendChild(card);
      }
    });
  }

  function openThoughtDetailsModal(recId) {
    if (!modalThoughtDetails || !thoughtDetailsContent) return;
    const rec = (thoughtsState.userRecords || []).find(r => r.id === recId);
    if (!rec) return;

    const emotionObj = rec.emotion
      ? ((typeof THOUGHT_EMOTIONS !== 'undefined')
        ? THOUGHT_EMOTIONS.find(e => e.id === rec.emotion || e.name === rec.emotion)
        : null)
      : null;

    const rows = [
      ['Дата и время', formatExportDateTime(rec.date)],
      ['Мысль', `«${rec.automaticThought || ''}»`],
      ['Ситуация', rec.situation && rec.situation.trim() ? rec.situation.trim() : 'Не указана'],
      ['Эмоция', rec.emotion ? (emotionObj ? `${emotionObj.icon} ${emotionObj.name}` : rec.emotion) : 'Не указана'],
      ['Интенсивность', (rec.emotionIntensityBefore !== null && rec.emotionIntensityBefore !== undefined)
        ? `${rec.emotionIntensityBefore}%`
        : 'Не указана']
    ];

    thoughtDetailsContent.innerHTML = rows.map(([label, value]) => `
      <div style="padding: 9px 11px; margin-bottom: 8px; background: rgba(37, 53, 44, 0.03); border: 1px solid rgba(37, 53, 44, 0.08); border-radius: var(--radius-sm);">
        <div style="font-size: 10.5px; font-weight: 800; letter-spacing: 0.04em; text-transform: uppercase; color: var(--text-faint); margin-bottom: 3px;">${escapeHtml(label)}</div>
        <div style="font-size: 13.5px; line-height: 1.45; color: #25352C; overflow-wrap: break-word; word-break: break-word;">${escapeHtml(value)}</div>
      </div>
    `).join('');

    modalThoughtDetails.classList.add('active');
    modalThoughtDetails.setAttribute('aria-hidden', 'false');
  }

  function closeThoughtDetailsModal() {
    if (!modalThoughtDetails) return;
    modalThoughtDetails.classList.remove('active');
    modalThoughtDetails.setAttribute('aria-hidden', 'true');
  }

  function renderThoughtsTable(records) {
    if (!thoughtsTableContainer) return;
    thoughtsTableContainer.innerHTML = '';

    const sourceList = records || (thoughtsState && thoughtsState.userRecords) || [];
    // The "saved thoughts" table contains only quick notes made via «Зафиксировать мысль»
    const list = sourceList.filter(r => r.isSimple || !r.rationalResponse);
    if (list.length === 0) {
      thoughtsTableContainer.innerHTML = `
        <div style="text-align: center; padding: 24px 16px; color: var(--text-muted); font-size: 13px;">
          Сохранённых мыслей пока нет
        </div>
      `;
      return;
    }

    const isEdit = Boolean(appSettings.thoughtsAdvanced && thoughtsState && thoughtsState.isEditMode);

    const table = document.createElement('table');
    table.className = 'thoughts-table thoughts-simple-table';
    table.innerHTML = `
      <thead>
        <tr>
          <th style="width: 44px; text-align: center;">№</th>
          <th style="text-align: left;">Мысль</th>
          <th style="width: 42px; text-align: center;">Детали</th>
          ${isEdit ? '<th style="width: 50px; text-align: center;">Удалить</th>' : ''}
        </tr>
      </thead>
      <tbody>
        ${list.map((rec, idx) => {
          const delBtn = isEdit
            ? `<button type="button" class="thoughts-table-del-btn" data-rec-id="${rec.id}" title="Удалить">🗑️</button>`
            : '';
          return `
            <tr>
              <td style="text-align: center; color: var(--text-faint); font-weight: 700;">${idx + 1}</td>
              <td style="font-weight: 500; font-size: 13.5px; color: #25352C; line-height: 1.45; text-align: left;">«${escapeHtml(rec.automaticThought || '')}»</td>
              <td style="text-align: center;">
                <button type="button" class="thoughts-table-details-btn" data-rec-id="${rec.id}" title="Показать подробности мысли" aria-label="Подробности мысли" style="width: 28px; height: 28px; padding: 0; border-radius: 50%; border: 1px solid rgba(47, 74, 59, 0.35); background: rgba(47, 74, 59, 0.12); color: #2F4A3B; cursor: pointer; font-size: 13px; line-height: 1; display: inline-flex; align-items: center; justify-content: center;">👁️</button>
              </td>
              ${isEdit ? `<td style="text-align: center;">${delBtn}</td>` : ''}
            </tr>
          `;
        }).join('')}
      </tbody>
    `;

    table.querySelectorAll('.thoughts-table-details-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        openThoughtDetailsModal(btn.getAttribute('data-rec-id'));
      });
    });

    table.querySelectorAll('.thoughts-table-del-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-rec-id');
        showConfirmDialog({
          title: 'Удалить мысль?',
          message: 'Вы действительно хотите удалить эту запись мысли? Восстановить её будет невозможно.',
          confirmText: 'Удалить',
          onConfirm: () => {
            deleteThoughtRecord(id);
            showTrackerToast('Запись мысли удалена');
            renderThoughtsTable();
          }
        });
      });
    });

    thoughtsTableContainer.appendChild(table);
  }

  // Separate list of saved extended-mode thought breakdowns
  function renderThoughtBreakdowns(records) {
    if (!thoughtsBreakdownsContainer) return;
    const list = (records || []).filter(r => !r.isSimple && !!r.rationalResponse);
    thoughtsBreakdownsContainer.innerHTML = '';

    if (list.length === 0) {
      thoughtsBreakdownsContainer.innerHTML = `
        <div style="text-align: center; padding: 26px 16px; background: rgba(37, 53, 44, 0.03); border: 1px dashed rgba(37, 53, 44, 0.12); border-radius: var(--radius-md);">
          <div style="font-size: 28px; margin-bottom: 8px;">🧠</div>
          <h4 style="font-size: 14px; color: #25352C; margin-bottom: 6px;">Разборов мыслей пока нет</h4>
          <p style="font-size: 12.5px; color: var(--text-muted); margin: 0; line-height: 1.45;">
            В расширенном режиме нажмите «🧠 Разбор мысли», заполните шаги и сохраните запись — она появится здесь.
          </p>
        </div>
      `;
      return;
    }

    list.forEach((rec, idx) => {
      const emotionObj = rec.emotion
        ? ((typeof THOUGHT_EMOTIONS !== 'undefined')
          ? THOUGHT_EMOTIONS.find(e => e.id === rec.emotion || e.name === rec.emotion) || { name: rec.emotion, icon: '⚡', color: '#B0895A' }
          : { name: rec.emotion, icon: '⚡', color: '#B0895A' })
        : null;
      const distortionObj = (rec.distortion && typeof THOUGHT_DISTORTIONS !== 'undefined')
        ? THOUGHT_DISTORTIONS.find(d => d.id === rec.distortion)
        : null;

      const card = document.createElement('div');
      card.className = 'thought-card';
      card.innerHTML = `
        <div class="thought-card-top">
          <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
            <span class="thought-emotion-pill" style="background: rgba(168, 126, 117, 0.14); color: #A87E75; border: 1px solid rgba(168, 126, 117, 0.32);">
              🧠 Разбор №${idx + 1}
            </span>
            ${emotionObj ? `<span class="thought-emotion-pill" style="background: ${emotionObj.color}22; color: ${emotionObj.color}; border: 1px solid ${emotionObj.color}44;">
              ${emotionObj.icon} ${emotionObj.name}${rec.emotionIntensityBefore !== null && rec.emotionIntensityBefore !== undefined ? ` • ${rec.emotionIntensityBefore}%` : ''}
            </span>` : ''}
          </div>
          ${thoughtsState.isEditMode ? `<button type="button" class="btn-thought-delete" data-rec-id="${rec.id}" title="Удалить запись">🗑️</button>` : ''}
        </div>

        ${rec.situation ? `<div style="margin-bottom: 8px;">
          <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-faint); font-weight: 700;">Ситуация:</span>
          <p class="thought-card-text" style="color: var(--text-light); margin-top: 2px;">${escapeHtml(rec.situation)}</p>
        </div>` : ''}

        <div style="margin-bottom: 10px; background: rgba(37, 53, 44, 0.03); padding: 9px 12px; border-radius: var(--radius-sm); border: 1px solid rgba(37, 53, 44, 0.06);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #A87E75; font-weight: 700;">Автоматическая мысль:</span>
            ${rec.beliefBefore !== null && rec.beliefBefore !== undefined ? `<span style="font-size: 11.5px; font-weight: 700; color: #A87E75;">Вера: ${rec.beliefBefore}%</span>` : ''}
          </div>
          <p style="font-size: 13px; color: #25352C; font-style: italic; margin: 0;">«${escapeHtml(rec.automaticThought)}»</p>
        </div>

        ${distortionObj ? `<div style="margin-bottom: 10px;"><span class="thought-distortion-tag">⚠️ ${distortionObj.name}</span></div>` : ''}

        <div class="thought-rational-box">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <span style="font-size: 11.5px; font-weight: 700; color: #6F927B;">🌱 Рациональный ответ:</span>
            ${rec.emotionIntensityBefore !== null && rec.emotionIntensityBefore !== undefined && rec.emotionIntensityAfter !== null && rec.emotionIntensityAfter !== undefined
              ? `<span class="thought-intensity-diff" style="color: #6F927B;">${rec.emotionIntensityBefore}% → ${rec.emotionIntensityAfter}%</span>`
              : ''}
          </div>
          <p style="margin: 0; font-size: 13px; line-height: 1.45;">${escapeHtml(rec.rationalResponse)}</p>
        </div>
      `;

      const btnDel = card.querySelector('.btn-thought-delete');
      if (btnDel) {
        btnDel.addEventListener('click', (e) => {
          e.stopPropagation();
          showConfirmDialog({
            title: 'Удалить разбор мысли?',
            message: 'Вы действительно хотите удалить этот разбор из дневника мыслей? Восстановить его будет невозможно.',
            confirmText: 'Удалить',
            onConfirm: () => {
              deleteThoughtRecord(rec.id);
              showTrackerToast('Разбор мысли удалён');
            }
          });
        });
      }

      thoughtsBreakdownsContainer.appendChild(card);
    });
  }

  // Thought Situation View Modal (Item 3)
  function openThoughtSituationModal(recId) {
    const modalThoughtSituationView = document.getElementById('modal-thought-situation-view');
    const thoughtSituationDetailsContent = document.getElementById('thought-situation-details-content');
    if (!modalThoughtSituationView || !thoughtSituationDetailsContent) return;

    const allRecords = [...thoughtsState.userRecords, ...(typeof SAMPLE_THOUGHT_RECORDS !== 'undefined' ? SAMPLE_THOUGHT_RECORDS : [])];
    const rec = allRecords.find(r => r.id === recId);
    if (!rec) return;

    const emotionObj = rec.emotion
      ? ((typeof THOUGHT_EMOTIONS !== 'undefined')
        ? THOUGHT_EMOTIONS.find(e => e.id === rec.emotion || e.name === rec.emotion) || { name: rec.emotion, icon: '⚡', color: '#B0895A' }
        : { name: rec.emotion, icon: '⚡', color: '#B0895A' })
      : { name: 'Эмоция', icon: '⚡', color: '#B0895A' };

    const distortionObj = (typeof THOUGHT_DISTORTIONS !== 'undefined' && rec.distortion)
      ? THOUGHT_DISTORTIONS.find(d => d.id === rec.distortion) || { name: rec.distortion, desc: '' }
      : null;

    thoughtSituationDetailsContent.innerHTML = `
      <div class="thought-situation-box">
        <div class="thought-situation-label">📌 Ситуация (где, когда, с кем, что произошло)</div>
        <div style="font-weight: 600; font-size: 14px; color: #25352C; line-height: 1.5;">${escapeHtml(rec.situation || 'Ситуация не была указана')}</div>
      </div>
      <div class="thought-situation-box">
        <div class="thought-situation-label">💭 Автоматическая мысль</div>
        <div style="font-style: italic; color: #25352C; font-size: 13.5px;">«${escapeHtml(rec.automaticThought || '')}»</div>
      </div>
      <div class="thought-situation-box" style="display: flex; align-items: center; justify-content: space-between;">
        <span class="thought-situation-label" style="margin: 0;">⚡ Ведущая эмоция</span>
        <span style="font-weight: 700; color: ${emotionObj.color || '#B0895A'};">${rec.emotion ? `${emotionObj.icon} ${emotionObj.name}${rec.emotionIntensityBefore !== null && rec.emotionIntensityBefore !== undefined ? ` (${rec.emotionIntensityBefore}%)` : ''}` : 'не указана'}</span>
      </div>
      ${distortionObj ? `
        <div class="thought-situation-box">
          <div class="thought-situation-label">🛡️ Когнитивная ловушка</div>
          <div style="font-weight: 700; color: #B0895A;">${distortionObj.name}</div>
          ${distortionObj.desc ? `<div style="font-size: 11.5px; color: var(--text-muted); margin-top: 4px;">${distortionObj.desc}</div>` : ''}
        </div>
      ` : ''}
      ${rec.rationalResponse ? `
        <div class="thought-situation-box" style="border-color: rgba(111, 146, 123, 0.3); background: rgba(111, 146, 123, 0.08);">
          <div class="thought-situation-label" style="color: #6F927B;">🌿 Рациональный ответ КПТ</div>
          <div style="color: #5F6B61; font-size: 13px;">${escapeHtml(rec.rationalResponse)}</div>
        </div>
      ` : ''}
    `;

    modalThoughtSituationView.classList.add('active');
    modalThoughtSituationView.setAttribute('aria-hidden', 'false');

    const closeBtn = document.getElementById('modal-btn-thought-situation-close');
    const closeXBtn = document.getElementById('modal-btn-thought-situation-close-x');
    const closeFn = () => {
      modalThoughtSituationView.classList.remove('active');
      modalThoughtSituationView.setAttribute('aria-hidden', 'true');
    };
    if (closeBtn) closeBtn.onclick = closeFn;
    if (closeXBtn) closeXBtn.onclick = closeFn;
    attachBackdropClose(modalThoughtSituationView, closeFn);
  }

  function deleteThoughtRecord(id) {
    thoughtsState.userRecords = thoughtsState.userRecords.filter(r => r.id !== id);
    saveThoughtsRecords();
    if (navigator.vibrate) try { navigator.vibrate(30); } catch(e) {}
    renderThoughtsFilters();
    renderThoughtsList();
  }

  function escapeHtml(text) {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // =========================================================================
  // Date Formatter Helper for Cards
  function formatDateTime(isoString) {
    if (!isoString) return 'Недавно';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return 'Недавно';
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const mins = String(d.getMinutes()).padStart(2, '0');
      return `${day}.${month}, ${hours}:${mins}`;
    } catch (e) {
      return 'Недавно';
    }
  }

  function formatThoughtDate(isoString) {
    return formatDateTime(isoString);
  }

  // =========================================================================
  // MODULE 6: STATE & MOOD TRACKER (ТРЕКЕР: КОГДА ЛУЧШЕ / КОГДА ХУЖЕ)
  // Чёткое разделение: «Мне сейчас хорошо» (ресурс) vs «Мне сейчас плохо» (спад)
  // Шкалы: Уровень счастья (1-10) и Уровень стресса (1-10)
  // Вкладки: Мои отметки / Примеры / Все
  // =========================================================================
  const trackerState = {
    sourceTab: 'my', // 'my'
    subFilter: 'all', // 'all' | 'better' | 'worse'
    entryMode: 'better', // 'better' | 'worse'
    simpleMode: 'better', // 'better' | 'worse'
    popularFilter: 'all', // 'all' | 'better' | 'worse'
    selectedMood: 'great',
    selectedMoods: new Set(['great']),
    selectedFactors: new Set(),
    userEntries: [],
    sampleEntries: [],
    isEditMode: false,
    mainNotesMode: 'simple',
    mainSimpleTab: 'better',
    notesTableVisible: false,
    initialized: false
  };

  // Main Screen DOM Elements
  const trackerEntriesContainer = document.getElementById('tracker-entries-container') || document.getElementById('tracker-entries-list');
  const trackerTopBetterFactors = document.getElementById('tracker-top-better-factors');
  const trackerTopWorseFactors = document.getElementById('tracker-top-worse-factors');
  const trackerTotalCount = document.getElementById('tracker-total-count') || document.getElementById('tracker-total-entries-count');
  const countMyTracker = document.getElementById('count-my-tracker');
  const countSampleTracker = document.getElementById('count-sample-tracker');
  const countAllTracker = document.getElementById('count-all-tracker');
  const btnTrackerEditMode = document.getElementById('btn-tracker-edit-mode');
  const modalBtnTrackerHistoryEditMode = document.getElementById('modal-btn-tracker-history-edit-mode');
  const btnTrackerOpenExport = document.getElementById('btn-tracker-open-export');

  // Quick Repeat Containers
  const trackerQuickRepeatContainer = document.getElementById('tracker-quick-repeat-container');
  const trackerQuickRepeatChips = document.getElementById('tracker-quick-repeat-chips');
  const trackerModalRecentStrip = document.getElementById('tracker-modal-recent-strip');
  const trackerModalRecentChips = document.getElementById('tracker-modal-recent-chips');

  // Experience Modal
  const btnOpenExperienceMenu = document.getElementById('btn-open-experience-menu');
  const modalTrackerExperience = document.getElementById('modal-tracker-experience');
  const modalBtnTrackerExpClose = document.getElementById('modal-btn-tracker-exp-close');
  const modalBtnTrackerExpCloseX = document.getElementById('modal-btn-tracker-exp-close-x');

  // Hero Mode Entry Buttons
  const btnTrackerSimple = document.getElementById('btn-tracker-simple');
  const btnTrackerFull = document.getElementById('btn-tracker-full');
  const btnTrackerSimpleAction = document.getElementById('btn-tracker-simple-action');
  const btnTrackerFullAction = document.getElementById('btn-tracker-full-action');
  const trackerHeroButtonsRow = document.getElementById('tracker-hero-buttons-row');
  const trackerSimpleEmotionsGrid = document.getElementById('tracker-simple-emotions-grid');
  const inpTrackerSimpleEmotion = document.getElementById('inp-tracker-simple-emotion');
  const wrapLinkTrackerToFull = document.getElementById('wrap-link-tracker-to-full');

  // Simple Tracker Modal Elements
  const modalTrackerSimple = document.getElementById('modal-tracker-simple');
  const modalBtnTrackerSimpleCloseX = document.getElementById('modal-btn-tracker-simple-close-x');
  const modalBtnTrackerSimpleCancel = document.getElementById('modal-btn-tracker-simple-cancel');
  const btnSimpleModeBetter = document.getElementById('btn-simple-mode-better');
  const btnSimpleModeWorse = document.getElementById('btn-simple-mode-worse');
  const formTrackerSimple = document.getElementById('form-tracker-simple');
  const labelTrackerSimpleCause = document.getElementById('label-tracker-simple-cause');
  const inpTrackerSimpleCause = document.getElementById('inp-tracker-simple-cause');
  const labelTrackerSimpleIntensity = document.getElementById('label-tracker-simple-intensity');
  const inpTrackerSimpleIntensity = document.getElementById('inp-tracker-simple-intensity');
  const valTrackerSimpleIntensity = document.getElementById('tracker-simple-val-intensity');
  const trackerSimpleMinLabel = document.getElementById('tracker-simple-min-label');
  const trackerSimpleMidLabel = document.getElementById('tracker-simple-mid-label');
  const trackerSimpleMaxLabel = document.getElementById('tracker-simple-max-label');
  const btnSimpleTrackerToFull = document.getElementById('btn-simple-tracker-to-full');

  // History Modal Elements (Когда лучше / Когда тяжелее)
  const btnOpenTrackerHistoryBetter = document.getElementById('btn-open-tracker-history-better');
  const btnOpenTrackerHistoryWorse = document.getElementById('btn-open-tracker-history-worse');
  const trackerNotesTabs = document.getElementById('tracker-notes-tabs');

  const badgeCountHistoryBetter = document.getElementById('badge-count-history-better');
  const badgeCountHistoryWorse = document.getElementById('badge-count-history-worse');
  const modalTrackerHistory = document.getElementById('modal-tracker-history');
  const modalTrackerHistoryTitle = document.getElementById('modal-tracker-history-title');
  const modalTrackerHistorySubtitle = document.getElementById('modal-tracker-history-subtitle');
  const modalTrackerHistoryIcon = document.getElementById('modal-tracker-history-icon');
  const modalTrackerHistoryIconWrap = document.getElementById('modal-tracker-history-icon-wrap');
  const trackerHistoryCategoryCount = document.getElementById('tracker-history-category-count');
  const trackerHistoryTotalBadge = document.getElementById('tracker-history-total-badge');
  const btnHistoryAddNew = document.getElementById('btn-history-add-new');
  const modalBtnTrackerSimple = document.getElementById('modal-btn-tracker-simple');
  const modalBtnTrackerFull = document.getElementById('modal-btn-tracker-full');
  const modalTrackerSimpleLabel = document.getElementById('modal-tracker-simple-label');
  const modalTrackerSimpleSublabel = document.getElementById('modal-tracker-simple-sublabel');
  const modalTrackerFullLabel = document.getElementById('modal-tracker-full-label');
  const modalTrackerFullSublabel = document.getElementById('modal-tracker-full-sublabel');
  const trackerHistoryCardsContainer = document.getElementById('tracker-history-cards-container');
  const modalBtnTrackerHistoryCloseX = document.getElementById('modal-btn-tracker-history-close-x');
  const modalBtnTrackerHistoryClose = document.getElementById('modal-btn-tracker-history-close');

  // Source Tabs & Subfilter
  const trackerSourceTabs = document.getElementById('tracker-source-tabs');
  const btnTabMyTracker = document.getElementById('btn-tab-my-tracker');
  const btnTabSampleTracker = document.getElementById('btn-tab-sample-tracker');
  const btnTabAllTracker = document.getElementById('btn-tab-all-tracker');

  // Modal: Add Entry (Detailed)
  const btnNewTrackerEntry = document.getElementById('btn-new-tracker-entry');
  const modalAddTrackerEntry = document.getElementById('modal-add-tracker-entry');
  const modalBtnTrackerCancel = document.getElementById('modal-btn-tracker-cancel');
  const modalBtnTrackerCloseX = document.getElementById('modal-btn-tracker-close-x');
  const formAddTrackerEntry = document.getElementById('form-add-tracker-entry');

  // Modal Mode Switcher & Dynamic Content
  const btnModeBetter = document.getElementById('btn-mode-better');
  const btnModeWorse = document.getElementById('btn-mode-worse');
  const trackerModalContextHint = document.getElementById('tracker-modal-context-hint');
  const trackerMoodSelector = document.getElementById('tracker-mood-selector') || document.getElementById('tracker-mood-picker');
  const labelTrackerMood = document.getElementById('label-tracker-mood');
  const trackerMoodHint = document.getElementById('tracker-mood-hint');
  const inpTrackerIntensity = document.getElementById('inp-tracker-intensity') || document.getElementById('inp-tracker-happiness');
  const labelTrackerIntensity = document.getElementById('label-tracker-intensity');
  const valTrackerIntensity = document.getElementById('tracker-val-intensity') || document.getElementById('tracker-val-happiness');
  const inpTrackerHappiness = document.getElementById('inp-tracker-happiness') || document.getElementById('inp-tracker-energy');
  const labelTrackerHappiness = document.getElementById('tracker-val-happiness') || document.getElementById('tracker-val-energy') || document.getElementById('label-tracker-energy');
  const inpTrackerStress = document.getElementById('inp-tracker-stress');
  const labelTrackerStress = document.getElementById('tracker-val-stress') || document.getElementById('label-tracker-stress');
  const trackerFactorsSelector = document.getElementById('tracker-factors-selector') || document.getElementById('tracker-factors-picker');
  const labelTrackerFactors = document.getElementById('label-tracker-factors');
  const selectTrackerSuggestions = document.getElementById('select-tracker-suggestions');
  const btnAddSuggestion = document.getElementById('btn-add-suggestion');
  const inpTrackerCause = document.getElementById('inp-tracker-cause');
  const inpTrackerNote = document.getElementById('inp-tracker-note');
  const labelTrackerNote = document.getElementById('label-tracker-note');
  const btnTrackerSubmit = document.getElementById('btn-tracker-submit');

  // Suggestions Guide Modal Elements (read-only reference)
  const btnOpenTrackerSuggestionsModal = document.getElementById('btn-open-tracker-suggestions-modal');
  const trackerSuggestionsBtnText = document.getElementById('tracker-suggestions-btn-text');
  const modalTrackerSuggestionsGuide = document.getElementById('modal-tracker-suggestions-guide');
  const modalBtnTrackerSuggCloseX = document.getElementById('modal-btn-tracker-sugg-close-x');
  const modalBtnTrackerSuggClose = document.getElementById('modal-btn-tracker-sugg-close');
  const trackerSuggListContainer = document.getElementById('tracker-sugg-list-container');
  const modalTrackerSuggTitle = document.getElementById('modal-tracker-sugg-title');
  const modalTrackerSuggSubtitle = document.getElementById('modal-tracker-sugg-subtitle');
  const modalTrackerSuggIcon = document.getElementById('modal-tracker-sugg-icon');
  const modalTrackerSuggIconWrap = document.getElementById('modal-tracker-sugg-icon-wrap');

  // Guide Modal
  const btnTrackerGuide = document.getElementById('btn-tracker-guide');
  const modalTrackerGuide = document.getElementById('modal-tracker-guide');
  const modalBtnTrackerGuideClose = document.getElementById('modal-btn-tracker-guide-close');

  let openFullTrackerModalWithData = null;

  function initTrackerModule() {
    loadTrackerData();
    // Tables are collapsed by default on every module opening / app restart.
    trackerState.notesTableVisible = false;
    if (!trackerState.initialized) {
      setupTrackerUI();
      trackerState.initialized = true;
    }
    updateTrackerTabsUI();
    renderTrackerInsights();
  }

  function loadTrackerData() {
    // 1. Load User entries
    try {
      const userSaved = localStorage.getItem('pocket_psy_user_tracker_entries');
      if (userSaved) {
        trackerState.userEntries = JSON.parse(userSaved);
      } else {
        const legacySaved = localStorage.getItem('pocket_psy_tracker_entries');
        if (legacySaved) {
          const parsed = JSON.parse(legacySaved);
          trackerState.userEntries = parsed.filter(item => !item.id || !item.id.includes('sample'));
          saveTrackerData();
        } else {
          trackerState.userEntries = [];
        }
      }
    } catch (e) {
      trackerState.userEntries = [];
    }

    // Normalize user entries (intensity, happiness, stress, entryType detection, moods array)
    trackerState.userEntries.forEach(entry => {
      if (typeof entry.happiness === 'undefined') {
        entry.happiness = entry.energy || 7;
      }
      if (!entry.entryType) {
        entry.entryType = (entry.happiness >= 6 || (entry.moodScore && entry.moodScore >= 1)) ? 'better' : 'worse';
      }
      if (typeof entry.intensity === 'undefined') {
        entry.intensity = entry.entryType === 'better' ? (entry.happiness || 8) : (entry.stress || 8);
      }
      if (!entry.moods) {
        entry.moods = entry.mood ? [entry.mood] : [];
      }
      if (!entry.cause && entry.note) {
        entry.cause = entry.note;
      }
    });

    // 2. Load Sample entries from data.js
    if (typeof DEFAULT_TRACKER_ENTRIES !== 'undefined') {
      trackerState.sampleEntries = DEFAULT_TRACKER_ENTRIES.map(s => {
        const isBetter = s.entryType ? (s.entryType === 'better') : ((s.happiness || s.energy || 7) >= 6);
        const intensity = typeof s.intensity !== 'undefined' ? s.intensity : (isBetter ? (s.happiness || 8) : (s.stress || 8));
        return {
          ...s,
          isSample: true,
          intensity: intensity,
          happiness: s.happiness || s.energy || 7,
          entryType: s.entryType || (isBetter ? 'better' : 'worse'),
          moods: s.moods || (s.mood ? [s.mood] : []),
          cause: s.cause || s.note || ''
        };
      });
    } else {
      trackerState.sampleEntries = [];
    }

    // Default tab: user entries
    trackerState.sourceTab = 'my';
  }

  function saveTrackerData() {
    try {
      localStorage.setItem('pocket_psy_user_tracker_entries', JSON.stringify(trackerState.userEntries));
    } catch (e) {}
  }

  function showTrackerToast(message) {
    let toast = document.getElementById('tracker-toast-notification');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'tracker-toast-notification';
      toast.className = 'tracker-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  }

  function quickLogEntry(template) {
    if (!template) return;
    const isBetter = template.entryType === 'better';
    const moods = (template.moods && template.moods.length > 0)
      ? [...template.moods]
      : (template.mood ? [template.mood] : [isBetter ? 'great' : 'anxious']);

    const intensity = typeof template.intensity !== 'undefined'
      ? template.intensity
      : (isBetter ? (template.happiness || 8) : (template.stress || 8));

    const newEntry = {
      id: `tr-${Date.now()}`,
      date: new Date().toISOString(),
      entryType: template.entryType || (isBetter ? 'better' : 'worse'),
      mood: moods[0] || (isBetter ? 'great' : 'anxious'),
      moods: moods,
      intensity: intensity,
      happiness: typeof template.happiness !== 'undefined' ? template.happiness : (isBetter ? intensity : Math.max(1, 11 - intensity)),
      stress: typeof template.stress !== 'undefined' ? template.stress : (!isBetter ? intensity : Math.max(1, 11 - intensity)),
      factors: Array.isArray(template.factors) ? [...template.factors] : [],
      cause: template.cause || template.note || '',
      note: template.note || template.cause || '',
      isSample: false
    };

    trackerState.userEntries.unshift(newEntry);
    saveTrackerData();

    // Switch to user tab so newly created record is immediately visible
    trackerState.sourceTab = 'my';
    updateTrackerTabsUI();

    if (typeof appAudio !== 'undefined' && appAudio.playChime) {
      appAudio.playChime(659.2);
    }
    if (navigator.vibrate) try { navigator.vibrate([40, 50, 40]); } catch (err) {}

    renderTrackerInsights();
    if (modalTrackerHistory && modalTrackerHistory.classList.contains('active')) {
      renderTrackerHistoryList();
    }

    // Friendly name for toast
    const moodNames = moods.map(mid => {
      const m = (typeof TRACKER_MOODS !== 'undefined') ? TRACKER_MOODS.find(x => x.id === mid) : null;
      return m ? (m.label || m.name) : mid;
    }).filter(Boolean).join(', ') || (isBetter ? 'Ресурс' : 'Спад');

    showTrackerToast(`⚡ Состояние «${moodNames}» зафиксировано!`);
  }

  function setTrackerEntryMode(mode) {
    trackerState.entryMode = mode;
    trackerState.selectedFactors.clear();

    const modalTrackerTitle = document.getElementById('modal-tracker-title');
    const modalTrackerSubtitle = document.getElementById('modal-tracker-subtitle');

    if (mode === 'better') {
      if (btnModeBetter) btnModeBetter.classList.add('active-better');
      if (btnModeWorse) btnModeWorse.classList.remove('active-worse');

      if (modalTrackerTitle) modalTrackerTitle.textContent = 'Подробный разбор: Когда лучше';
      if (modalTrackerSubtitle) modalTrackerSubtitle.textContent = 'Ресурсное состояние • Шкала 1–10, выбор факторов дня и эмоций';
      if (trackerSuggestionsBtnText) trackerSuggestionsBtnText.textContent = 'Посмотреть примеры ресурсных факторов';
      if (btnOpenTrackerSuggestionsModal) {
        btnOpenTrackerSuggestionsModal.classList.remove('btn-examples-worse');
      }

      if (trackerModalContextHint) {
        trackerModalContextHint.className = 'tracker-modal-context-hint';
        trackerModalContextHint.innerHTML = '🟢 <strong>Ресурсная фиксация:</strong> отметьте, в связи с чем вам сейчас хорошо или что вас поддержало.';
      }

      trackerState.selectedMoods = new Set(['great']);
      trackerState.selectedMood = 'great';
      if (inpTrackerIntensity) inpTrackerIntensity.value = '5';
      if (valTrackerIntensity) {
        valTrackerIntensity.textContent = '5 / 10';
        valTrackerIntensity.style.color = '#6F927B';
        valTrackerIntensity.style.background = 'rgba(111, 146, 123, 0.15)';
        valTrackerIntensity.style.borderColor = 'rgba(111, 146, 123, 0.35)';
      }
      if (labelTrackerIntensity) {
        labelTrackerIntensity.innerHTML = '<span>🟢 Степень, насколько мне хорошо:</span>';
        labelTrackerIntensity.style.color = '#6F927B';
      }
      const minLblBetter = document.getElementById('tracker-intensity-min-label');
      const midLblBetter = document.getElementById('tracker-intensity-mid-label');
      const maxLblBetter = document.getElementById('tracker-intensity-max-label');
      if (minLblBetter) minLblBetter.textContent = '1 — едва заметно';
      if (midLblBetter) midLblBetter.textContent = '5 — умеренно';
      if (maxLblBetter) maxLblBetter.textContent = '10 — предельно хорошо / ресурс';

      if (inpTrackerHappiness) inpTrackerHappiness.value = '5';
      if (labelTrackerHappiness) labelTrackerHappiness.textContent = '5 / 10';
      if (inpTrackerStress) inpTrackerStress.value = '5';
      if (labelTrackerStress) labelTrackerStress.textContent = '5 / 10';

      if (labelTrackerMood) labelTrackerMood.textContent = 'Общее самочувствие (ресурсное состояние)';
      if (labelTrackerFactors) labelTrackerFactors.textContent = 'Что помогло и создало ресурс? (напишите своими словами)';
      if (labelTrackerNote) labelTrackerNote.textContent = 'Дополнительная заметка или мысли (по желанию)';
      if (inpTrackerCause) inpTrackerCause.placeholder = 'Например: Выспался, погулял 25 минут на солнце, почувствовал спокойствие и ясность...';
      if (btnTrackerSubmit) {
        btnTrackerSubmit.textContent = 'Сохранить ресурсную запись 🟢';
        btnTrackerSubmit.style.background = 'linear-gradient(135deg, #7F9B94, #6F927B)';
      }
    } else {
      if (btnModeBetter) btnModeBetter.classList.remove('active-better');
      if (btnModeWorse) btnModeWorse.classList.add('active-worse');

      if (modalTrackerTitle) modalTrackerTitle.textContent = 'Подробный разбор: Когда хуже';
      if (modalTrackerSubtitle) modalTrackerSubtitle.textContent = 'Факторы спада • Шкала 1–10, выбор факторов дня и эмоций';
      if (trackerSuggestionsBtnText) trackerSuggestionsBtnText.textContent = 'Посмотреть примеры факторов спада';
      if (btnOpenTrackerSuggestionsModal) {
        btnOpenTrackerSuggestionsModal.classList.add('btn-examples-worse');
      }

      if (trackerModalContextHint) {
        trackerModalContextHint.className = 'tracker-modal-context-hint hint-worse';
        trackerModalContextHint.innerHTML = '🌧️ <strong>Фиксация спада:</strong> отметьте, почему стало тяжелее или что спровоцировало напряжение.';
      }

      trackerState.selectedMoods = new Set(['anxious']);
      trackerState.selectedMood = 'anxious';
      if (inpTrackerIntensity) inpTrackerIntensity.value = '5';
      if (valTrackerIntensity) {
        valTrackerIntensity.textContent = '5 / 10';
        valTrackerIntensity.style.color = '#6E7780';
        valTrackerIntensity.style.background = 'rgba(110, 119, 128, 0.15)';
        valTrackerIntensity.style.borderColor = 'rgba(110, 119, 128, 0.35)';
      }
      if (labelTrackerIntensity) {
        labelTrackerIntensity.innerHTML = '<span>🌧️ Степень, насколько мне тяжело:</span>';
        labelTrackerIntensity.style.color = '#6E7780';
      }
      const minLblWorse = document.getElementById('tracker-intensity-min-label');
      const midLblWorse = document.getElementById('tracker-intensity-mid-label');
      const maxLblWorse = document.getElementById('tracker-intensity-max-label');
      if (minLblWorse) minLblWorse.textContent = '1 — лёгкое напряжение';
      if (midLblWorse) midLblWorse.textContent = '5 — умеренно тяжело';
      if (maxLblWorse) maxLblWorse.textContent = '10 — сильный спад / стресс';

      if (inpTrackerHappiness) inpTrackerHappiness.value = '5';
      if (labelTrackerHappiness) labelTrackerHappiness.textContent = '5 / 10';
      if (inpTrackerStress) inpTrackerStress.value = '5';
      if (labelTrackerStress) labelTrackerStress.textContent = '5 / 10';

      if (labelTrackerMood) labelTrackerMood.textContent = 'Общее самочувствие (сложное состояние / спад)';
      if (labelTrackerFactors) labelTrackerFactors.textContent = 'Что повлияло или ухудшило состояние? (напишите своими словами)';
      if (labelTrackerNote) labelTrackerNote.textContent = 'Дополнительная заметка или мысли (по желанию)';
      if (inpTrackerCause) inpTrackerCause.placeholder = 'Например: Недосып, конфликт на работе, аврал, навалилась тревога...';
      if (btnTrackerSubmit) {
        btnTrackerSubmit.textContent = 'Сохранить запись о спаде 🌧️';
        btnTrackerSubmit.style.background = 'linear-gradient(135deg, #6E7780, #6E7780)';
      }
    }

    // Populate suggestions dropdown
    if (selectTrackerSuggestions && typeof TRACKER_SUGGESTIONS !== 'undefined') {
      const suggestions = TRACKER_SUGGESTIONS[mode] || [];
      selectTrackerSuggestions.innerHTML = `<option value="" disabled selected>💡 Выберите подсказку из списка вариантов...</option>` +
        suggestions.map(s => `<option value="${escapeHtml(s.text)}">${s.label}</option>`).join('');
    }

    renderMoodPickerButtons();
    renderFactorChips();
  }

  function updateMoodCounterHint() {
    if (!trackerMoodHint) return;
    const count = trackerState.selectedMoods.size;
    if (count === 0) {
      trackerMoodHint.textContent = '(ни одного не выбрано — по желанию)';
      trackerMoodHint.style.color = 'var(--text-faint)';
    } else if (count === 1) {
      trackerMoodHint.textContent = '(выбран 1 пункт)';
      trackerMoodHint.style.color = '#4F6B57';
    } else {
      trackerMoodHint.textContent = `(выбрано пунктов: ${count})`;
      trackerMoodHint.style.color = '#4F6B57';
    }
  }

  function renderMoodPickerButtons() {
    if (!trackerMoodSelector || typeof TRACKER_MOODS === 'undefined') return;
    trackerMoodSelector.innerHTML = '';

    // Filter moods for the active mode
    const currentMoods = TRACKER_MOODS.filter(m => !m.category || m.category === trackerState.entryMode);
    const listToRender = currentMoods.length > 0 ? currentMoods : TRACKER_MOODS.slice(0, 4);

    listToRender.forEach(m => {
      const btn = document.createElement('button');
      btn.type = 'button';
      const isSelected = trackerState.selectedMoods.has(m.id);
      btn.className = `tracker-mood-btn ${isSelected ? 'active' : ''}`;
      btn.setAttribute('data-mood', m.id);
      btn.innerHTML = `
        <span class="tracker-mood-icon">${m.icon}</span>
        <span class="tracker-mood-label" style="color: ${m.color};">${m.label || m.name}</span>
      `;
      btn.addEventListener('click', () => {
        if (trackerState.selectedMoods.has(m.id)) {
          trackerState.selectedMoods.delete(m.id);
          btn.classList.remove('active');
        } else {
          trackerState.selectedMoods.add(m.id);
          btn.classList.add('active');
        }
        trackerState.selectedMood = Array.from(trackerState.selectedMoods)[0] || '';
        updateMoodCounterHint();
      });
      trackerMoodSelector.appendChild(btn);
    });

    updateMoodCounterHint();
  }

  function renderFactorChips() {
    if (!trackerFactorsSelector || typeof TRACKER_FACTORS === 'undefined') return;
    trackerFactorsSelector.innerHTML = '';

    const targetCategory = trackerState.entryMode === 'better' ? 'resource' : 'trigger';
    const factorsToRender = TRACKER_FACTORS.filter(f => !f.category || f.category === targetCategory);

    factorsToRender.forEach(f => {
      const chip = document.createElement('button');
      chip.type = 'button';
      const isSelected = trackerState.selectedFactors.has(f.id);
      const isTrigger = trackerState.entryMode === 'worse';
      chip.className = `tracker-factor-chip ${isTrigger ? 'chip-trigger' : ''} ${isSelected ? 'active' : ''}`;
      chip.setAttribute('data-factor-id', f.id);
      chip.innerHTML = `<span>${f.icon}</span> <span>${f.label || f.name}</span>`;
      chip.addEventListener('click', () => {
        if (trackerState.selectedFactors.has(f.id)) {
          trackerState.selectedFactors.delete(f.id);
          chip.classList.remove('active');
        } else {
          trackerState.selectedFactors.add(f.id);
          chip.classList.add('active');

          // Also gracefully add to cause textarea if not yet mentioned
          if (inpTrackerCause) {
            const current = inpTrackerCause.value.trim();
            const factorName = f.label || f.name;
            if (!current) {
              inpTrackerCause.value = factorName;
            } else if (!current.toLowerCase().includes(factorName.toLowerCase())) {
              inpTrackerCause.value = `${current}, ${factorName}`;
            }
          }
        }
      });
      trackerFactorsSelector.appendChild(chip);
    });
  }

  function setupTrackerUI() {
    // Mode Switcher Buttons in Modal
    if (btnModeBetter) {
      btnModeBetter.addEventListener('click', () => setTrackerEntryMode('better'));
    }
    if (btnModeWorse) {
      btnModeWorse.addEventListener('click', () => setTrackerEntryMode('worse'));
    }

    // Intensity Slider Live Updates
    if (inpTrackerIntensity && valTrackerIntensity) {
      const updateIntensityDisplay = () => {
        valTrackerIntensity.textContent = `${inpTrackerIntensity.value} / 10`;
      };
      inpTrackerIntensity.addEventListener('input', updateIntensityDisplay);
      inpTrackerIntensity.addEventListener('change', updateIntensityDisplay);
    }

    // Happiness Slider Live Updates (legacy fallback)
    if (inpTrackerHappiness && labelTrackerHappiness) {
      const updateHappinessDisplay = () => {
        labelTrackerHappiness.textContent = `${inpTrackerHappiness.value} / 10`;
      };
      inpTrackerHappiness.addEventListener('input', updateHappinessDisplay);
      inpTrackerHappiness.addEventListener('change', updateHappinessDisplay);
    }

    // Stress Slider Live Updates
    if (inpTrackerStress && labelTrackerStress) {
      const updateStressDisplay = () => {
        labelTrackerStress.textContent = `${inpTrackerStress.value} / 10`;
      };
      inpTrackerStress.addEventListener('input', updateStressDisplay);
      inpTrackerStress.addEventListener('change', updateStressDisplay);
    }

    // Source Tabs Switching (Мои отметки / Примеры / Все)
    if (btnTabMyTracker) {
      btnTabMyTracker.addEventListener('click', () => {
        trackerState.sourceTab = 'my';
        updateTrackerTabsUI();
        renderTrackerEntries();
      });
    }
    if (btnTabSampleTracker) {
      btnTabSampleTracker.addEventListener('click', () => {
        trackerState.sourceTab = 'samples';
        updateTrackerTabsUI();
        renderTrackerEntries();
      });
    }
    if (btnTabAllTracker) {
      btnTabAllTracker.addEventListener('click', () => {
        trackerState.sourceTab = 'all';
        updateTrackerTabsUI();
        renderTrackerEntries();
      });
    }

    // Sub-filter buttons (Все / 🟢 Когда хорошо / 🔴 Когда плохо)
    const subFilterButtons = document.querySelectorAll('#tracker-filter-substrip .tracker-subfilter-btn');
    subFilterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        subFilterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        trackerState.subFilter = btn.getAttribute('data-subfilter') || 'all';
        renderTrackerEntries();
      });
    });

    // Open Factors Overview Modal (Read-only Reference + Click to insert)
    function openTrackerSuggestionsModal() {
      if (!modalTrackerSuggestionsGuide) return;
      const mode = trackerState.entryMode || 'better';
      const isBetter = mode === 'better';

      if (modalTrackerSuggTitle) {
        modalTrackerSuggTitle.textContent = isBetter
          ? 'Факторы ресурса (Когда лучше)'
          : 'Факторы спада (Когда хуже)';
      }
      if (modalTrackerSuggSubtitle) {
        modalTrackerSuggSubtitle.textContent = isBetter
          ? 'Ресурсные факторы дня для ознакомления'
          : 'Типичные триггеры и факторы спада для ознакомления';
      }
      if (modalTrackerSuggIcon) {
        modalTrackerSuggIcon.textContent = isBetter ? '🌿' : '🌧️';
      }
      if (modalTrackerSuggIconWrap) {
        modalTrackerSuggIconWrap.style.background = isBetter ? 'rgba(111, 146, 123, 0.15)' : 'rgba(110, 119, 128, 0.15)';
        modalTrackerSuggIconWrap.style.border = isBetter ? '1px solid rgba(111, 146, 123, 0.35)' : '1px solid rgba(110, 119, 128, 0.35)';
        modalTrackerSuggIconWrap.style.color = isBetter ? '#6F927B' : '#6E7780';
      }

      if (trackerSuggListContainer) {
        const factors = (typeof TRACKER_FACTORS !== 'undefined')
          ? TRACKER_FACTORS.filter(f => isBetter ? f.category === 'resource' : f.category === 'trigger')
          : [];

        if (factors.length === 0 && typeof TRACKER_SUGGESTIONS !== 'undefined') {
          const fallback = TRACKER_SUGGESTIONS[mode] || [];
          trackerSuggListContainer.innerHTML = fallback.map(item => `
            <div class="tracker-suggestion-read-item" style="padding: 10px 14px; background: rgba(37, 53, 44, 0.04); border: 1px solid rgba(37, 53, 44, 0.08); border-radius: 8px; margin-bottom: 6px;">
              <span>${escapeHtml(item.label)}</span>
            </div>
          `).join('');
        } else {
          trackerSuggListContainer.innerHTML = factors.map(f => `
            <div class="tracker-suggestion-read-item" style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: rgba(37, 53, 44, 0.04); border: 1px solid rgba(37, 53, 44, 0.08); border-radius: 8px; margin-bottom: 6px; gap: 8px;">
              <span style="font-size: 13.5px; font-weight: 600; color: #25352C;">${f.icon || '📌'} ${escapeHtml(f.name || f.label)}</span>
              <button type="button" class="btn-insert-factor" data-factor="${escapeHtml(f.name || f.label)}" style="padding: 4px 10px; font-size: 11.5px; font-weight: 700; border-radius: 6px; border: 1px solid rgba(79, 107, 87, 0.35); background: rgba(79, 107, 87, 0.15); color: #4F6B57; cursor: pointer; white-space: nowrap;">
                Добавить +
              </button>
            </div>
          `).join('');

          trackerSuggListContainer.querySelectorAll('.btn-insert-factor').forEach(btn => {
            btn.addEventListener('click', () => {
              const val = btn.getAttribute('data-factor');
              if (inpTrackerCause && val) {
                const cur = inpTrackerCause.value.trim();
                inpTrackerCause.value = cur ? `${cur}, ${val}` : val;
                updateKeyboardDoneStatus(inpTrackerCause);
              }
              closeTrackerSuggestionsModal();
            });
          });
        }
      }

      modalTrackerSuggestionsGuide.classList.add('active');
      modalTrackerSuggestionsGuide.setAttribute('aria-hidden', 'false');
    }

    function closeTrackerSuggestionsModal() {
      if (modalTrackerSuggestionsGuide) {
        modalTrackerSuggestionsGuide.classList.remove('active');
        modalTrackerSuggestionsGuide.setAttribute('aria-hidden', 'true');
      }
    }

    const btnTrackerFactorsOverview = document.getElementById('btn-tracker-factors-overview');
    if (btnTrackerFactorsOverview) {
      btnTrackerFactorsOverview.addEventListener('click', openTrackerSuggestionsModal);
    }
    if (btnOpenTrackerSuggestionsModal) {
      btnOpenTrackerSuggestionsModal.addEventListener('click', openTrackerSuggestionsModal);
    }
    if (modalBtnTrackerSuggClose) {
      modalBtnTrackerSuggClose.addEventListener('click', closeTrackerSuggestionsModal);
    }
    if (modalBtnTrackerSuggCloseX) {
      modalBtnTrackerSuggCloseX.addEventListener('click', closeTrackerSuggestionsModal);
    }
    attachBackdropClose(modalTrackerSuggestionsGuide, closeTrackerSuggestionsModal);

    // Experience Modal Handlers
    if (btnOpenExperienceMenu && modalTrackerExperience) {
      btnOpenExperienceMenu.addEventListener('click', () => {
        renderTrackerInsights();
        modalTrackerExperience.classList.add('active');
        modalTrackerExperience.setAttribute('aria-hidden', 'false');
      });
    }
    if (modalBtnTrackerExpClose && modalTrackerExperience) {
      modalBtnTrackerExpClose.addEventListener('click', () => {
        modalTrackerExperience.classList.remove('active');
        modalTrackerExperience.setAttribute('aria-hidden', 'true');
      });
    }
    if (modalBtnTrackerExpCloseX && modalTrackerExperience) {
      modalBtnTrackerExpCloseX.addEventListener('click', () => {
        modalTrackerExperience.classList.remove('active');
        modalTrackerExperience.setAttribute('aria-hidden', 'true');
      });
    }
    if (modalTrackerExperience) {
      modalTrackerExperience.addEventListener('click', (e) => {
        if (e.target === modalTrackerExperience) {
          modalTrackerExperience.classList.remove('active');
          modalTrackerExperience.setAttribute('aria-hidden', 'true');
        }
      });
    }

    // Function to open detailed modal with prefilled data (from simple or upgrade)
    openFullTrackerModalWithData = function(data) {
      if (!modalAddTrackerEntry) return;
      const mode = (data && data.entryType) ? data.entryType : 'better';
      setTrackerEntryMode(mode);

      if (data) {
        if (inpTrackerCause) inpTrackerCause.value = data.cause || '';
        if (inpTrackerNote) inpTrackerNote.value = data.note || '';
        const intensity = (data && typeof data.intensity !== 'undefined') ? data.intensity : 5;
        if (inpTrackerIntensity) inpTrackerIntensity.value = String(intensity);
        if (valTrackerIntensity) {
          valTrackerIntensity.textContent = `${intensity} / 10`;
          valTrackerIntensity.style.color = mode === 'better' ? '#6F927B' : '#6E7780';
        }
        if (data.moods && Array.isArray(data.moods)) {
          trackerState.selectedMoods = new Set(data.moods);
        } else if (data.mood) {
          trackerState.selectedMoods = new Set([data.mood]);
        }
        renderMoodPickerButtons();
        updateMoodCounterHint();
      }

      resetModalScroll(modalAddTrackerEntry);
      setFullscreenEditor(modalAddTrackerEntry, true);
      modalAddTrackerEntry.classList.add('active');
      modalAddTrackerEntry.setAttribute('aria-hidden', 'false');
    };

    // Mode Switcher for Simple Tracker Modal
    function setTrackerSimpleMode(mode) {
      trackerState.simpleMode = mode;
      const isBetter = mode === 'better';

      const modalTrackerSimpleTitle = document.getElementById('modal-tracker-simple-title');
      const modalTrackerSimpleSubtitle = document.getElementById('modal-tracker-simple-subtitle');
      const modalTrackerSimpleIcon = document.getElementById('modal-tracker-simple-icon');
      const modalTrackerSimpleIconWrap = document.getElementById('modal-tracker-simple-icon-wrap');

      if (modalTrackerSimpleTitle) {
        modalTrackerSimpleTitle.textContent = isBetter
          ? 'Простая отметка: Когда лучше'
          : 'Простая отметка: Когда хуже';
      }
      if (modalTrackerSimpleSubtitle) {
        modalTrackerSimpleSubtitle.textContent = isBetter
          ? 'Что помогло и насколько улучшилось самочувствие'
          : 'Что повлияло и насколько усилился спад';
      }
      if (modalTrackerSimpleIcon) {
        modalTrackerSimpleIcon.textContent = isBetter ? '🌿' : '🌧️';
      }
      if (modalTrackerSimpleIconWrap) {
        modalTrackerSimpleIconWrap.style.background = isBetter ? 'rgb(131, 190, 178, 0.15)' : 'rgba(110, 119, 128, 0.15)';
        modalTrackerSimpleIconWrap.style.borderColor = isBetter ? 'rgba(79, 107, 87, 0.3)' : 'rgba(110, 119, 128, 0.3)';
        modalTrackerSimpleIconWrap.style.color = isBetter ? '#4F6B57' : '#6E7780';
      }

      if (btnSimpleModeBetter && btnSimpleModeWorse) {
        if (isBetter) {
          btnSimpleModeBetter.classList.add('active-better');
          btnSimpleModeWorse.classList.remove('active-worse');
        } else {
          btnSimpleModeBetter.classList.remove('active-better');
          btnSimpleModeWorse.classList.add('active-worse');
        }
      }

      if (labelTrackerSimpleCause) {
        labelTrackerSimpleCause.textContent = isBetter
          ? 'Что / после чего стало лучше?'
          : 'Что / после чего стало тяжелее?';
        labelTrackerSimpleCause.style.color = isBetter ? '#4F6B57' : '#6E7780';
      }

      if (inpTrackerSimpleCause) {
        inpTrackerSimpleCause.placeholder = isBetter
          ? 'Опишите своими словами: что произошло, после чего состояние улучшилось...'
          : 'Опишите своими словами: что произошло, после чего состояние ухудшилось...';
      }

      if (labelTrackerSimpleIntensity) {
        labelTrackerSimpleIntensity.innerHTML = isBetter
          ? '<span>🟢 Степень, насколько стало лучше:</span>'
          : '<span>🌧️ Степень, насколько стало тяжелее:</span>';
        labelTrackerSimpleIntensity.style.color = isBetter ? '#6F927B' : '#6E7780';
      }

      const curVal = inpTrackerSimpleIntensity ? inpTrackerSimpleIntensity.value : '5';
      if (valTrackerSimpleIntensity) {
        valTrackerSimpleIntensity.textContent = `${curVal} / 10`;
        valTrackerSimpleIntensity.style.color = isBetter ? '#6F927B' : '#6E7780';
        valTrackerSimpleIntensity.style.background = isBetter ? 'rgba(111, 146, 123, 0.15)' : 'rgba(110, 119, 128, 0.15)';
        valTrackerSimpleIntensity.style.borderColor = isBetter ? 'rgba(111, 146, 123, 0.35)' : 'rgba(110, 119, 128, 0.35)';
      }

      if (trackerSimpleMinLabel) trackerSimpleMinLabel.textContent = isBetter ? '1 — чуть-чуть' : '1 — лёгкое напряжение';
      if (trackerSimpleMidLabel) trackerSimpleMidLabel.textContent = isBetter ? '5 — заметно' : '5 — умеренно тяжело';
      if (trackerSimpleMaxLabel) trackerSimpleMaxLabel.textContent = isBetter ? '10 — значительно лучше' : '10 — сильный спад';

      const btnSubmit = document.getElementById('btn-tracker-simple-submit');
      if (btnSubmit) {
        btnSubmit.textContent = isBetter ? 'Сохранить отметку (ресурс) 🟢' : 'Сохранить отметку (спад) 🌧️';
        btnSubmit.style.background = isBetter
          ? 'linear-gradient(135deg, #7F9B94, #4F6B57)'
          : 'linear-gradient(135deg, #6E7780, #6E7780)';
      }
    }

    if (btnSimpleModeBetter) {
      btnSimpleModeBetter.addEventListener('click', () => setTrackerSimpleMode('better'));
    }
    if (btnSimpleModeWorse) {
      btnSimpleModeWorse.addEventListener('click', () => setTrackerSimpleMode('worse'));
    }

    if (inpTrackerSimpleIntensity && valTrackerSimpleIntensity) {
      inpTrackerSimpleIntensity.addEventListener('input', () => {
        valTrackerSimpleIntensity.textContent = `${inpTrackerSimpleIntensity.value} / 10`;
      });
    }

    // Emotions list for simple state fixation
    const SIMPLE_TRACKER_EMOTIONS = [
      { name: 'Спокойствие', icon: '🌿', type: 'better' },
      { name: 'Радость', icon: '😊', type: 'better' },
      { name: 'Уверенность', icon: '🌟', type: 'better' },
      { name: 'Облегчение', icon: '🍃', type: 'better' },
      { name: 'Благодарность', icon: '🙏', type: 'better' },
      { name: 'Тревога', icon: '🌊', type: 'worse' },
      { name: 'Раздражение', icon: '🔥', type: 'worse' },
      { name: 'Грусть', icon: '🌧️', type: 'worse' },
      { name: 'Усталость', icon: '🔋', type: 'worse' },
      { name: 'Напряжение', icon: '⚡', type: 'worse' }
    ];

    let currentSimpleTrackerEmotion = 'Спокойствие';

    function renderTrackerSimpleEmotionsGrid() {
      const grid = document.getElementById('tracker-simple-emotions-grid');
      const hiddenInp = document.getElementById('inp-tracker-simple-emotion');
      if (!grid) return;
      grid.innerHTML = '';
      SIMPLE_TRACKER_EMOTIONS.forEach(em => {
        const btn = document.createElement('button');
        btn.type = 'button';
        const isSelected = (em.name === currentSimpleTrackerEmotion);
        btn.className = `tracker-simple-emotion-pill ${isSelected ? 'active' : ''}`;
        btn.innerHTML = `<span>${em.icon}</span> <span>${em.name}</span>`;
        btn.addEventListener('click', () => {
          currentSimpleTrackerEmotion = em.name;
          if (hiddenInp) hiddenInp.value = em.name;
          grid.querySelectorAll('.tracker-simple-emotion-pill').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          setTrackerSimpleMode(em.type);
        });
        grid.appendChild(btn);
      });
      if (hiddenInp) hiddenInp.value = currentSimpleTrackerEmotion;
    }

    // Open Simple Modal helper
    function openTrackerSimpleModalAction(defaultMode = 'better') {
      currentSimpleTrackerEmotion = defaultMode === 'worse' ? 'Тревога' : 'Спокойствие';
      renderTrackerSimpleEmotionsGrid();
      setTrackerSimpleMode(defaultMode);
      if (inpTrackerSimpleCause) inpTrackerSimpleCause.value = '';
      if (inpTrackerSimpleIntensity) inpTrackerSimpleIntensity.value = '5';
      if (valTrackerSimpleIntensity) {
        valTrackerSimpleIntensity.textContent = '5 / 10';
        valTrackerSimpleIntensity.style.color = defaultMode === 'worse' ? '#6E7780' : '#6F927B';
      }
      if (modalTrackerSimple) {
        resetModalScroll(modalTrackerSimple);
        setFullscreenEditor(modalTrackerSimple, true);
        modalTrackerSimple.classList.add('active');
        modalTrackerSimple.setAttribute('aria-hidden', 'false');
      }
    }

    if (btnTrackerSimple) {
      btnTrackerSimple.addEventListener('click', () => openTrackerSimpleModalAction('better'));
    }
    if (btnTrackerSimpleAction) {
      btnTrackerSimpleAction.addEventListener('click', () => openTrackerSimpleModalAction('better'));
    }
    if (btnTrackerFullAction) {
      btnTrackerFullAction.addEventListener('click', () => {
        setTrackerEntryMode('better');
        if (modalAddTrackerEntry) {
          resetModalScroll(modalAddTrackerEntry);
          setFullscreenEditor(modalAddTrackerEntry, true);
          modalAddTrackerEntry.classList.add('active');
          modalAddTrackerEntry.setAttribute('aria-hidden', 'false');
        }
      });
    }

    // Safe backdrop close helper: only fires if pointer was pressed down ON the backdrop
    function attachBackdropClose(overlay, closeFn) {
      if (!overlay) return;
      let isBackdropDown = false;
      overlay.addEventListener('pointerdown', (e) => {
        isBackdropDown = (e.target === overlay);
      });
      overlay.addEventListener('click', (e) => {
        if (isBackdropDown && e.target === overlay) {
          isBackdropDown = false;
          closeFn();
        }
      });
    }

    // Close Simple Modal
    function closeTrackerSimpleModal() {
      closeFullscreenModal(modalTrackerSimple);
      // Do not reopen the history picker underneath/after the form.
      trackerState.returnToHistoryAfterModal = null;
      if (modalTrackerHistory) {
        modalTrackerHistory.classList.remove('active');
        modalTrackerHistory.setAttribute('aria-hidden', 'true');
      }
    }

    if (modalBtnTrackerSimpleCancel && modalTrackerSimple) {
      modalBtnTrackerSimpleCancel.addEventListener('click', closeTrackerSimpleModal);
    }
    if (modalBtnTrackerSimpleCloseX && modalTrackerSimple) {
      modalBtnTrackerSimpleCloseX.addEventListener('click', closeTrackerSimpleModal);
    }
    attachBackdropClose(modalTrackerSimple, closeTrackerSimpleModal);

    // Link Simple -> Full
    if (btnSimpleTrackerToFull && modalTrackerSimple) {
      btnSimpleTrackerToFull.addEventListener('click', () => {
        const text = inpTrackerSimpleCause ? inpTrackerSimpleCause.value.trim() : '';
        const intensity = parseInt(inpTrackerSimpleIntensity ? inpTrackerSimpleIntensity.value : '5', 10);
        const mode = trackerState.simpleMode || 'better';

        closeFullscreenModal(modalTrackerSimple);

        openFullTrackerModalWithData({
          entryType: mode,
          cause: text,
          note: text,
          intensity: intensity
        });
      });
    }

    // Simple Form Submit
    if (formTrackerSimple) {
      formTrackerSimple.addEventListener('submit', (e) => {
        e.preventDefault();
        const cause = inpTrackerSimpleCause ? inpTrackerSimpleCause.value.trim() : '';
        if (!cause) {
          if (inpTrackerSimpleCause) inpTrackerSimpleCause.focus();
          return;
        }

        const chosenEmotion = currentSimpleTrackerEmotion || 'Спокойствие';
        const isBetter = trackerState.simpleMode === 'better';
        const intensity = parseInt(inpTrackerSimpleIntensity ? inpTrackerSimpleIntensity.value : '5', 10);
        const happiness = isBetter ? intensity : Math.max(1, 11 - intensity);
        const stress = !isBetter ? intensity : Math.max(1, 11 - intensity);

        const newEntry = {
          id: `tr-${Date.now()}`,
          date: new Date().toISOString(),
          entryType: trackerState.simpleMode || (isBetter ? 'better' : 'worse'),
          mood: chosenEmotion,
          moods: [chosenEmotion],
          intensity: intensity,
          happiness: happiness,
          stress: stress,
          factors: [],
          cause: cause,
          note: cause,
          isSimple: true,
          isSample: false
        };

        trackerState.userEntries.unshift(newEntry);
        saveTrackerData();

        // Close the underlying history picker BEFORE revealing the tracker screen.
        trackerState.returnToHistoryAfterModal = null;
        if (modalTrackerHistory) {
          modalTrackerHistory.classList.remove('active');
          modalTrackerHistory.setAttribute('aria-hidden', 'true');
        }

        closeFullscreenModal(modalTrackerSimple);

        if (typeof appAudio !== 'undefined' && appAudio.playChime) {
          appAudio.playChime(659.2);
        }
        if (navigator.vibrate) try { navigator.vibrate([40, 50, 40]); } catch (err) {}

        updateTrackerTabsUI();
        renderTrackerInsights();
        showTrackerToast('⚡ Простая отметка сохранена!');
        renderTrackerMainSimpleList();
      });
    }

    // Open Full (Detailed) Modal
    if (btnTrackerFull) {
      btnTrackerFull.addEventListener('click', () => {
        openFullTrackerModalWithData();
      });
    }
    if (btnNewTrackerEntry) {
      btnNewTrackerEntry.addEventListener('click', () => {
        openFullTrackerModalWithData();
      });
    }

    // Close Detailed Modal
    function closeTrackerDetailedModal() {
      closeFullscreenModal(modalAddTrackerEntry);
      // Do not reopen the history picker underneath/after the form.
      trackerState.returnToHistoryAfterModal = null;
      if (modalTrackerHistory) {
        modalTrackerHistory.classList.remove('active');
        modalTrackerHistory.setAttribute('aria-hidden', 'true');
      }
    }

    if (modalBtnTrackerCancel && modalAddTrackerEntry) {
      modalBtnTrackerCancel.addEventListener('click', closeTrackerDetailedModal);
    }
    if (modalBtnTrackerCloseX && modalAddTrackerEntry) {
      modalBtnTrackerCloseX.addEventListener('click', closeTrackerDetailedModal);
    }
    attachBackdropClose(modalAddTrackerEntry, closeTrackerDetailedModal);

    // Detailed Form Submit
    if (formAddTrackerEntry) {
      formAddTrackerEntry.addEventListener('submit', (e) => {
        e.preventDefault();

        const isBetter = trackerState.entryMode === 'better';
        const intensity = parseInt(inpTrackerIntensity ? inpTrackerIntensity.value : '8', 10);
        const happiness = isBetter ? intensity : Math.max(1, 11 - intensity);
        const stress = !isBetter ? intensity : Math.max(1, 11 - intensity);
        const cause = inpTrackerCause ? inpTrackerCause.value.trim() : '';
        const note = inpTrackerNote ? inpTrackerNote.value.trim() : '';
        const moods = Array.from(trackerState.selectedMoods);

        const newEntry = {
          id: `tr-${Date.now()}`,
          date: new Date().toISOString(),
          entryType: trackerState.entryMode, // 'better' or 'worse'
          mood: moods[0] || (trackerState.entryMode === 'better' ? 'great' : 'anxious'),
          moods: moods,
          intensity: intensity,
          happiness: happiness,
          stress: stress,
          factors: Array.from(trackerState.selectedFactors),
          cause: cause,
          note: note || cause,
          isSimple: false,
          isSample: false
        };

        trackerState.userEntries.unshift(newEntry);
        saveTrackerData();

        // Close the underlying history picker BEFORE revealing the tracker screen.
        trackerState.returnToHistoryAfterModal = null;
        if (modalTrackerHistory) {
          modalTrackerHistory.classList.remove('active');
          modalTrackerHistory.setAttribute('aria-hidden', 'true');
        }

        closeFullscreenModal(modalAddTrackerEntry);

        if (typeof appAudio !== 'undefined' && appAudio.playChime) {
          appAudio.playChime(659.2);
        }
        if (navigator.vibrate) try { navigator.vibrate([40, 50, 40]); } catch (err) {}

        updateTrackerTabsUI();
        renderTrackerInsights();
        showTrackerToast('📊 Подробный разбор сохранён!');
        renderTrackerMainSimpleList();
      });
    }

    // History Modal Open Buttons («Когда лучше» / «Когда хуже»)
    if (btnOpenTrackerHistoryBetter) {
      btnOpenTrackerHistoryBetter.addEventListener('click', () => {
        if (!appSettings.trackerAdvanced) {
          openTrackerSimpleModalAction('better');
        } else {
          openTrackerHistoryModal('better');
        }
      });
    }
    if (btnOpenTrackerHistoryWorse) {
      btnOpenTrackerHistoryWorse.addEventListener('click', () => {
        if (!appSettings.trackerAdvanced) {
          openTrackerSimpleModalAction('worse');
        } else {
          openTrackerHistoryModal('worse');
        }
      });
    }
    // Buttons inside History Modal: Simple & Detailed Analysis
    if (modalBtnTrackerSimple) {
      modalBtnTrackerSimple.addEventListener('click', () => {
        const targetType = trackerState.historyFilter || 'better';
        trackerState.returnToHistoryAfterModal = targetType;
        closeModalInstant(modalTrackerHistory);
        setTrackerSimpleMode(targetType);
        if (inpTrackerSimpleCause) inpTrackerSimpleCause.value = '';
        if (inpTrackerSimpleIntensity) inpTrackerSimpleIntensity.value = '5';
        if (valTrackerSimpleIntensity) {
          valTrackerSimpleIntensity.textContent = '5 / 10';
          valTrackerSimpleIntensity.style.color = targetType === 'better' ? '#6F927B' : '#6E7780';
        }
        if (modalTrackerSimple) {
          resetModalScroll(modalTrackerSimple);
          setFullscreenEditor(modalTrackerSimple, true);
          modalTrackerSimple.classList.add('active');
          modalTrackerSimple.setAttribute('aria-hidden', 'false');
        }
      });
    }

    if (modalBtnTrackerFull) {
      modalBtnTrackerFull.addEventListener('click', () => {
        const targetType = trackerState.historyFilter || 'better';
        trackerState.returnToHistoryAfterModal = targetType;
        closeModalInstant(modalTrackerHistory);
        openFullTrackerModalWithData({
          entryType: targetType,
          cause: '',
          note: '',
          intensity: 5
        });
      });
    }

    // Legacy Add New Button (if present)
    if (btnHistoryAddNew) {
      btnHistoryAddNew.addEventListener('click', () => {
        const targetType = trackerState.historyFilter || 'better';
        trackerState.returnToHistoryAfterModal = targetType;
        if (modalTrackerHistory) {
          modalTrackerHistory.classList.remove('active');
          modalTrackerHistory.setAttribute('aria-hidden', 'true');
        }
        setTrackerSimpleMode(targetType);
        if (inpTrackerSimpleCause) inpTrackerSimpleCause.value = '';
        if (inpTrackerSimpleIntensity) inpTrackerSimpleIntensity.value = '5';
        if (valTrackerSimpleIntensity) {
          valTrackerSimpleIntensity.textContent = '5 / 10';
        }
        if (modalTrackerSimple) {
          resetModalScroll(modalTrackerSimple);
          setFullscreenEditor(modalTrackerSimple, true);
          modalTrackerSimple.classList.add('active');
          modalTrackerSimple.setAttribute('aria-hidden', 'false');
        }
      });
    }

    // History Modal Close Handlers
    function closeTrackerHistoryModal() {
      if (modalTrackerHistory) {
        modalTrackerHistory.classList.remove('active');
        modalTrackerHistory.setAttribute('aria-hidden', 'true');
      }
      trackerState.returnToHistoryAfterModal = null;
    }

    if (modalBtnTrackerHistoryClose && modalTrackerHistory) {
      modalBtnTrackerHistoryClose.addEventListener('click', closeTrackerHistoryModal);
    }
    if (modalBtnTrackerHistoryCloseX && modalTrackerHistory) {
      modalBtnTrackerHistoryCloseX.addEventListener('click', closeTrackerHistoryModal);
    }
    attachBackdropClose(modalTrackerHistory, closeTrackerHistoryModal);

    // Guide Modal Handlers
    if (btnTrackerGuide && modalTrackerGuide) {
      btnTrackerGuide.addEventListener('click', () => {
        modalTrackerGuide.classList.add('active');
        modalTrackerGuide.setAttribute('aria-hidden', 'false');
      });
    }
    if (modalBtnTrackerGuideClose && modalTrackerGuide) {
      modalBtnTrackerGuideClose.addEventListener('click', () => {
        modalTrackerGuide.classList.remove('active');
        modalTrackerGuide.setAttribute('aria-hidden', 'true');
      });
    }
    attachBackdropClose(modalTrackerGuide, () => {
      modalTrackerGuide.classList.remove('active');
      modalTrackerGuide.setAttribute('aria-hidden', 'true');
    });

    // Four tracker note tables: simple / detailed × better / worse
    document.querySelectorAll('.tracker-notes-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        trackerState.mainSimpleTab = tab.getAttribute('data-notes-type') || 'better';
        trackerState.mainNotesMode = tab.getAttribute('data-notes-mode') || 'simple';
        trackerState.notesTableVisible = true;
        renderTrackerMainSimpleList();
      });
    });

    // Edit mode toggle
    if (btnTrackerEditMode) {
      btnTrackerEditMode.addEventListener('click', () => {
        toggleTrackerEditMode();
      });
    }
    if (modalBtnTrackerHistoryEditMode) {
      modalBtnTrackerHistoryEditMode.addEventListener('click', () => {
        toggleTrackerEditMode();
      });
    }

    // Export button in Tracker
    if (btnTrackerOpenExport) {
      btnTrackerOpenExport.addEventListener('click', () => {
        if (typeof openExportDataModal === 'function') openExportDataModal();
      });
    }
  }

  function toggleTrackerEditMode() {
    trackerState.isEditMode = !trackerState.isEditMode;
    updateTrackerEditModeUI();
  }

  function updateTrackerEditModeUI() {
    const isEdit = Boolean(trackerState.isEditMode);
    const updateBtn = (btn) => {
      if (!btn) return;
      btn.classList.toggle('active', isEdit);
      btn.innerHTML = isEdit
        ? '<span class="edit-mode-icon">✓</span><span class="edit-mode-text">Готово</span>'
        : '<span class="edit-mode-icon">✏️</span><span class="edit-mode-text">Режим правки</span>';
    };
    updateBtn(btnTrackerEditMode);
    updateBtn(modalBtnTrackerHistoryEditMode);
    renderTrackerMainSimpleList();
    if (modalTrackerHistory && modalTrackerHistory.classList.contains('active')) {
      renderTrackerHistoryList();
    }
  }

  function updateTrackerTabsUI() {
    const total = trackerState.userEntries.length;
    const betterCount = trackerState.userEntries.filter(e => e.entryType === 'better').length;
    const worseCount = trackerState.userEntries.filter(e => e.entryType === 'worse').length;

    if (badgeCountHistoryBetter) badgeCountHistoryBetter.textContent = betterCount;
    if (badgeCountHistoryWorse) badgeCountHistoryWorse.textContent = worseCount;
    if (countMyTracker) countMyTracker.textContent = total;
    if (countAllTracker) countAllTracker.textContent = total;

    renderTrackerMainSimpleList();
  }

  function renderTrackerMainSimpleList() {
    const table = document.getElementById('tracker-notes-table');
    const wrap = document.getElementById('tracker-notes-table-wrap');
    const empty = document.getElementById('tracker-notes-empty');
    if (!table) return;

    if (!trackerState.mainSimpleTab) trackerState.mainSimpleTab = 'better';
    if (!trackerState.mainNotesMode) trackerState.mainNotesMode = 'simple';

    const type = trackerState.mainSimpleTab;
    const mode = trackerState.mainNotesMode;
    const isDetailed = mode === 'detailed';
    const isBetter = type === 'better';
    const all = trackerState.userEntries || [];

    const simpleBetter = all.filter(e => e.entryType === 'better' && e.isSimple === true);
    const simpleWorse = all.filter(e => e.entryType === 'worse' && e.isSimple === true);
    const detailedBetter = all.filter(e => e.entryType === 'better' && e.isSimple === false);
    const detailedWorse = all.filter(e => e.entryType === 'worse' && e.isSimple === false);

    const counts = {
      'tracker-notes-count-better': simpleBetter.length,
      'tracker-notes-count-worse': simpleWorse.length,
      'tracker-notes-count-better-advanced': detailedBetter.length,
      'tracker-notes-count-worse-advanced': detailedWorse.length
    };
    Object.keys(counts).forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = counts[id];
    });

    if (!trackerState.notesTableVisible) {
      if (wrap) wrap.style.display = 'none';
      if (table) table.style.display = 'none';
      if (empty) {
        empty.style.display = 'block';
        empty.textContent = 'Выберите один из разделов выше, чтобы открыть таблицу записей.';
      }
      return;
    }
    if (table) table.style.display = '';

    document.querySelectorAll('.tracker-notes-tab').forEach(btn => {
      btn.classList.toggle('active',
        btn.getAttribute('data-notes-type') === type &&
        btn.getAttribute('data-notes-mode') === mode);
    });

    const entries = all.filter(e => {
      if (e.entryType !== type) return false;
      return isDetailed ? e.isSimple === false : e.isSimple === true;
    });

    if (entries.length === 0) {
      if (wrap) wrap.style.display = 'none';
      if (empty) {
        empty.style.display = 'block';
        empty.textContent = isDetailed
          ? (isBetter ? 'Подробных заметок «Когда лучше» пока нет.' : 'Подробных заметок «Когда хуже» пока нет.')
          : (isBetter ? 'Заметок «Когда лучше» пока нет.' : 'Заметок «Когда хуже» пока нет.');
      }
      return;
    }

    if (wrap) wrap.style.display = 'block';
    if (empty) empty.style.display = 'none';

    const thead = table.querySelector('thead');
    const tbody = table.querySelector('tbody');
    const showDelete = Boolean(trackerState.isEditMode);
    table.className = 'tracker-notes-table ' + (isDetailed ? 'tracker-notes-table-detailed' : 'tracker-notes-table-simple') + (showDelete ? ' tracker-notes-table-with-actions' : '');

    if (thead) {
      thead.innerHTML = isDetailed
        ? `<tr><th>Дата</th><th>Оценка</th><th>Эмоции / факторы</th><th>Что повлияло</th>${showDelete ? '<th></th>' : ''}</tr>`
        : `<tr><th>Дата</th><th>Оценка</th><th>Заметка</th>${showDelete ? '<th></th>' : ''}</tr>`;
    }

    if (tbody) {
      tbody.innerHTML = entries.map(entry => {
        const score = (entry.intensity !== undefined && entry.intensity !== null)
          ? entry.intensity
          : (isBetter ? (entry.happiness || 8) : (entry.stress || 8));
        const notesText = entry.cause || entry.note || entry.situation || 'Отметка без текста';
        const date = formatExportDateTime(entry.date);
        const delBtn = showDelete
          ? `<td class="tracker-notes-cell-action"><button type="button" class="tracker-notes-del" data-entry-id="${entry.id}" title="Удалить отметку" aria-label="Удалить отметку">🗑️</button></td>`
          : '';

        if (!isDetailed) {
          return `<tr>
            <td>${escapeHtml(date)}</td>
            <td><strong>${escapeHtml(String(score))} / 10</strong></td>
            <td>${escapeHtml(notesText)}</td>
            ${delBtn}
          </tr>`;
        }

        const moods = (Array.isArray(entry.moods) ? entry.moods : (entry.mood ? [entry.mood] : []))
          .map(mid => {
            const found = (typeof TRACKER_MOODS !== 'undefined')
              ? TRACKER_MOODS.find(m => m.id === mid || m.name === mid || m.label === mid)
              : null;
            return found ? (found.label || found.name) : mid;
          })
          .filter(Boolean);
        const factors = (Array.isArray(entry.factors) ? entry.factors : [])
          .map(fid => {
            const found = (typeof TRACKER_FACTORS !== 'undefined')
              ? TRACKER_FACTORS.find(f => f.id === fid)
              : null;
            return found ? (found.label || found.name) : fid;
          })
          .filter(Boolean);
        const moodsAndFactors = [...moods, ...factors].join(', ');

        return `<tr>
          <td>${escapeHtml(date)}</td>
          <td><strong>${escapeHtml(String(score))} / 10</strong></td>
          <td>${escapeHtml(moodsAndFactors || '—')}</td>
          <td>${escapeHtml(notesText)}</td>
          ${delBtn}
        </tr>`;
      }).join('');

      tbody.querySelectorAll('.tracker-notes-del').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = btn.getAttribute('data-entry-id');
          showConfirmDialog({
            title: 'Удалить отметку?',
            message: 'Вы уверены, что хотите удалить эту запись из трекера? Это действие нельзя отменить.',
            confirmText: 'Удалить',
            confirmButtonClass: 'btn-danger',
            onConfirm: () => deleteTrackerEntry(id)
          });
        });
      });
    }
  }

  function openTrackerHistoryModal(type) {
    trackerState.historyFilter = type;
    const isBetter = type === 'better';

    if (modalTrackerHistoryTitle) {
      modalTrackerHistoryTitle.textContent = isBetter ? 'Когда лучше' : 'Когда хуже';
    }
    if (modalTrackerHistorySubtitle) {
      modalTrackerHistorySubtitle.textContent = isBetter
        ? 'Ресурсные моменты и точки опоры'
        : 'Факторы спада и сложные состояния';
    }
    if (modalTrackerHistoryIcon) {
      modalTrackerHistoryIcon.textContent = isBetter ? '🌿' : '🌧️';
    }
    if (modalTrackerHistoryIconWrap) {
      modalTrackerHistoryIconWrap.style.background = isBetter ? 'rgba(111, 146, 123, 0.15)' : 'rgba(110, 119, 128, 0.15)';
      modalTrackerHistoryIconWrap.style.border = isBetter ? '1px solid rgba(111, 146, 123, 0.35)' : '1px solid rgba(110, 119, 128, 0.35)';
      modalTrackerHistoryIconWrap.style.color = isBetter ? '#6F927B' : '#6E7780';
    }

    if (modalBtnTrackerSimple) {
      modalBtnTrackerSimple.style.background = isBetter
        ? 'linear-gradient(135deg, #7F9B94, #6F927B)'
        : 'linear-gradient(135deg, #6E7780, #6E7780)';
      modalBtnTrackerSimple.style.borderColor = isBetter
        ? 'rgba(111, 146, 123, 0.4)'
        : 'rgba(110, 119, 128, 0.4)';
      modalBtnTrackerSimple.style.boxShadow = isBetter
        ? '0 4px 16px rgb(131, 190, 178, 0.35)'
        : '0 4px 16px rgba(110, 119, 128, 0.35)';
    }
    if (modalTrackerSimpleLabel) {
      modalTrackerSimpleLabel.textContent = '⚡ Записать состояние';
    }
    if (modalTrackerSimpleSublabel) {
      modalTrackerSimpleSublabel.textContent = isBetter
        ? 'Что помогло • Облегчение'
        : 'Что произошло • Напряжение';
    }

    if (modalBtnTrackerFull) {
      modalBtnTrackerFull.style.background = isBetter
        ? 'linear-gradient(135deg, #5E7F6A, #4F6B57)'
        : 'linear-gradient(135deg, #6A6C85, #6E7780)';
      modalBtnTrackerFull.style.borderColor = isBetter
        ? 'rgba(47, 74, 59, 0.4)'
        : 'rgba(110, 119, 128, 0.4)';
      modalBtnTrackerFull.style.boxShadow = isBetter
        ? '0 4px 16px rgba(94, 127, 106, 0.35)'
        : '0 4px 16px rgba(110, 119, 128, 0.35)';
    }
    if (modalTrackerFullSublabel) {
      modalTrackerFullSublabel.textContent = isBetter
        ? 'Шкала 1–10 • Факторы дня'
        : 'Шкала 1–10 • Триггеры спада';
    }

    if (btnHistoryAddNew) {
      btnHistoryAddNew.textContent = isBetter ? '+ Добавить «Когда лучше»' : '+ Добавить «Когда хуже»';
      btnHistoryAddNew.style.background = isBetter
        ? 'linear-gradient(135deg, #7F9B94, #6F927B)'
        : 'linear-gradient(135deg, #6E7780, #6E7780)';
    }

    renderTrackerHistoryList();

    if (modalTrackerHistory) {
      modalTrackerHistory.classList.add('active');
      modalTrackerHistory.setAttribute('aria-hidden', 'false');
    }
  }

  function renderTrackerHistoryList() {
    if (!trackerHistoryCardsContainer) return;
    trackerHistoryCardsContainer.innerHTML = '';

    const targetType = trackerState.historyFilter || 'better';
    const isBetter = targetType === 'better';

    const entries = (trackerState.userEntries || []).filter(e => {
      if (e.entryType) return e.entryType === targetType;
      return isBetter ? (e.happiness >= 6) : (e.stress >= 6);
    });

    if (trackerHistoryCategoryCount) {
      trackerHistoryCategoryCount.textContent = entries.length;
    }
    if (trackerHistoryTotalBadge) {
      trackerHistoryTotalBadge.textContent = `${entries.length} записей`;
      trackerHistoryTotalBadge.style.color = isBetter ? '#6F927B' : '#6E7780';
      trackerHistoryTotalBadge.style.background = isBetter ? 'rgba(111, 146, 123, 0.12)' : 'rgba(110, 119, 128, 0.12)';
      trackerHistoryTotalBadge.style.borderColor = isBetter ? 'rgba(111, 146, 123, 0.3)' : 'rgba(110, 119, 128, 0.3)';
    }

    if (entries.length === 0) {
      trackerHistoryCardsContainer.innerHTML = `
        <div style="text-align: center; padding: 28px 16px; background: rgba(37, 53, 44, 0.02); border: 1px dashed rgba(37, 53, 44, 0.12); border-radius: var(--radius-md);">
          <div style="font-size: 38px; margin-bottom: 10px;">${isBetter ? '🌿' : '🌧️'}</div>
          <h4 style="font-size: 15.5px; color: #25352C; margin-bottom: 6px;">
            ${isBetter ? 'Пока нет сохранённых отметок «Когда лучше»' : 'Пока нет сохранённых отметок «Когда хуже»'}
          </h4>
          <p style="font-size: 13px; color: var(--text-muted); max-width: 360px; margin: 0 auto; line-height: 1.5;">
            ${isBetter
              ? 'Выберите «Записать состояние» или «Подробный разбор» выше, чтобы зафиксировать ресурсное действие или момент облегчения.'
              : 'Выберите «Записать состояние» или «Подробный разбор» выше, чтобы зафиксировать фактор спада или эмоциональное напряжение.'}
          </p>
        </div>
      `;
      return;
    }

    const fragment = document.createDocumentFragment();
    entries.forEach(entry => {
      const isSimple = entry.isSimple || (!entry.factors?.length && !entry.note && entry.cause);
      const moodsList = (entry.moods && entry.moods.length > 0)
        ? entry.moods
        : (entry.mood ? [entry.mood] : []);

      // A simple entry only records the text/score; do not show auto-filled
      // mood or "resource/tension" labels that the user did not choose.
      const moodBadgesHtml = isSimple ? '' : moodsList.map(mid => {
        const moodObj = (typeof TRACKER_MOODS !== 'undefined')
          ? TRACKER_MOODS.find(m => m.id === mid) || { label: mid, icon: isBetter ? '🌿' : '🌧️', color: isBetter ? '#6F927B' : '#7A8490' }
          : { label: mid, icon: isBetter ? '🌿' : '🌧️', color: isBetter ? '#6F927B' : '#7A8490' };
        return `
          <span class="tracker-entry-mood-badge" style="background: ${moodObj.color}22; color: ${moodObj.color}; border: 1px solid ${moodObj.color}44; padding: 2px 7px; border-radius: 6px; font-size: 11.5px; font-weight: 600;">
            ${moodObj.icon} ${moodObj.label || moodObj.name}
          </span>
        `;
      }).join('');

      const typePillHtml = isSimple
        ? ''
        : `<span class="tracker-type-pill ${isBetter ? 'type-better' : 'type-worse'}">
              ${isBetter ? '🌿 Ресурс • Хорошо' : '🌧️ Напряжение • Спад'}
            </span>`;

      const card = document.createElement('div');
      card.className = `tracker-entry-card ${isBetter ? 'entry-better' : 'entry-worse'}`;

      const factorTagsHtml = (entry.factors || []).map(fid => {
        const factorObj = (typeof TRACKER_FACTORS !== 'undefined')
          ? TRACKER_FACTORS.find(f => f.id === fid) || { label: fid, name: fid, icon: isBetter ? '🌿' : '🌧️', category: isBetter ? 'resource' : 'trigger' }
          : { label: fid, name: fid, icon: isBetter ? '🌿' : '🌧️', category: isBetter ? 'resource' : 'trigger' };

        const isTrigger = !isBetter;
        return `
          <span class="tracker-factor-tag ${isTrigger ? 'trigger-tag' : 'resource-tag'}">
            <span>${factorObj.icon}</span> <span>${factorObj.label || factorObj.name}</span>
          </span>
        `;
      }).join('');

      const deleteBtnHtml = trackerState.isEditMode ? `
        <button type="button" class="tracker-delete-btn" title="Удалить отметку" data-entry-id="${entry.id}">🗑️</button>
      ` : '';

      const upgradeBtnHtml = isSimple
        ? `
          <div style="margin-top: 8px; display: flex; justify-content: flex-end;">
            <button type="button" class="btn-upgrade-tracker" data-entry-id="${entry.id}" style="font-size: 12px; font-weight: 600; padding: 6px 12px; border-radius: var(--radius-sm); background: rgba(110, 119, 128, 0.12); border: 1px solid rgba(110, 119, 128, 0.35); color: #6E7780; cursor: pointer; display: inline-flex; align-items: center; gap: 5px;">
              <span>🔍 Дополнить до подробной отметки →</span>
            </button>
          </div>
        `
        : '';

      const intensityVal = entry.intensity || (isBetter ? (entry.happiness || 8) : (entry.stress || 8));

      card.innerHTML = `
        <div class="tracker-entry-header">
          <div class="tracker-entry-badge-wrap">
            ${typePillHtml}
            ${moodBadgesHtml}
            <span class="tracker-entry-date">${formatDateTime(entry.date)}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 6px;">
            ${deleteBtnHtml}
          </div>
        </div>

        <div class="tracker-entry-metrics">
          <div class="tracker-metric-item">
            <span class="tracker-metric-label">${isBetter ? '🌿 Степень ресурса:' : '🌧️ Степень спада:'}</span>
            <span class="tracker-metric-val" style="color: ${isBetter ? '#6F927B' : '#6E7780'}; font-weight: 800;">${intensityVal} / 10</span>
          </div>
        </div>

        ${entry.cause ? `
          <div class="tracker-entry-cause ${isBetter ? '' : 'cause-worse'}">
            <span style="font-weight: 700; color: ${isBetter ? '#6F927B' : '#6E7780'}; margin-right: 4px;">
              ${isBetter ? '🌿 Что помогло:' : '🌧️ Что повлияло:'}
            </span>
            <span>${escapeHtml(entry.cause)}</span>
          </div>
        ` : ''}

        ${factorTagsHtml ? `<div class="tracker-entry-factors">${factorTagsHtml}</div>` : ''}

        ${entry.note && entry.note !== entry.cause ? `<p class="tracker-entry-note">«${escapeHtml(entry.note)}»</p>` : ''}

        ${upgradeBtnHtml}
      `;

      // Wire upgrade action
      const btnUpgrade = card.querySelector('.btn-upgrade-tracker');
      if (btnUpgrade) {
        btnUpgrade.addEventListener('click', (e) => {
          e.stopPropagation();
          trackerState.returnToHistoryAfterModal = targetType;
          if (modalTrackerHistory) {
            modalTrackerHistory.classList.remove('active');
            modalTrackerHistory.setAttribute('aria-hidden', 'true');
          }
          openFullTrackerModalWithData(entry);
        });
      }

      // Wire delete action with confirm dialog!
      const btnDel = card.querySelector('.tracker-delete-btn');
      if (btnDel) {
        btnDel.addEventListener('click', (e) => {
          e.stopPropagation();
          showConfirmDialog({
            title: 'Удалить отметку?',
            message: 'Вы уверены, что хотите удалить эту запись из трекера? Это действие нельзя отменить.',
            confirmText: 'Удалить',
            confirmButtonClass: 'btn-danger',
            onConfirm: () => {
              deleteTrackerEntry(entry.id);
            }
          });
        });
      }

      fragment.appendChild(card);
    });
    trackerHistoryCardsContainer.appendChild(fragment);
  }

  function deleteTrackerEntry(id) {
    trackerState.userEntries = trackerState.userEntries.filter(e => e.id !== id);
    saveTrackerData();
    if (navigator.vibrate) try { navigator.vibrate(30); } catch (e) {}
    updateTrackerTabsUI();
    renderTrackerInsights();
    if (modalTrackerHistory && modalTrackerHistory.classList.contains('active')) {
      renderTrackerHistoryList();
    }
    showTrackerToast('Запись удалена');
  }

  function renderTrackerInsights() {
    // Collect all records for analytical insights
    const allRecords = trackerState.userEntries.length >= 3 
      ? trackerState.userEntries 
      : [...trackerState.userEntries, ...trackerState.sampleEntries];

    const betterEntries = allRecords.filter(e => e.entryType === 'better' || (e.happiness || 7) >= 7);
    const worseEntries = allRecords.filter(e => e.entryType === 'worse' || (e.stress || 3) >= 6);

    // 1. Better Factors Aggregation
    if (trackerTopBetterFactors) {
      if (betterEntries.length > 0) {
        const counts = {};
        betterEntries.forEach(e => {
          (e.factors || []).forEach(fid => {
            counts[fid] = (counts[fid] || 0) + 1;
          });
        });

        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3);
        if (sorted.length > 0) {
          trackerTopBetterFactors.innerHTML = sorted.map(([fid, count]) => {
            const fObj = (typeof TRACKER_FACTORS !== 'undefined')
              ? TRACKER_FACTORS.find(f => f.id === fid) || { label: fid, name: fid, icon: '🌿' }
              : { label: fid, name: fid, icon: '🌿' };
            const pct = Math.round((count / betterEntries.length) * 100);
            return `
              <div class="insight-factor-item" style="border-left: 3px solid #6F927B;">
                <span>${fObj.icon} ${fObj.label || fObj.name}</span>
                <span class="insight-factor-score" style="color: #6F927B;">${pct}% случаев</span>
              </div>
            `;
          }).join('');
        } else {
          trackerTopBetterFactors.innerHTML = '<span style="font-size: 12px; color: var(--text-faint); font-style: italic;">Добавьте отметки, когда вам хорошо</span>';
        }
      } else {
        trackerTopBetterFactors.innerHTML = '<span style="font-size: 12px; color: var(--text-faint); font-style: italic;">Добавьте отметки, когда вам хорошо</span>';
      }
    }

    // 2. Worse Factors Aggregation (Calm slate-indigo styling, no aggressive red)
    if (trackerTopWorseFactors) {
      if (worseEntries.length > 0) {
        const counts = {};
        worseEntries.forEach(e => {
          (e.factors || []).forEach(fid => {
            counts[fid] = (counts[fid] || 0) + 1;
          });
        });

        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3);
        if (sorted.length > 0) {
          trackerTopWorseFactors.innerHTML = sorted.map(([fid, count]) => {
            const fObj = (typeof TRACKER_FACTORS !== 'undefined')
              ? TRACKER_FACTORS.find(f => f.id === fid) || { label: fid, name: fid, icon: '🌧️' }
              : { label: fid, name: fid, icon: '🌧️' };
            const pct = Math.round((count / worseEntries.length) * 100);
            return `
              <div class="insight-factor-item" style="border-left: 3px solid #7A8490;">
                <span>${fObj.icon} ${fObj.label || fObj.name}</span>
                <span class="insight-factor-score" style="color: #6E7780;">${pct}% случаев</span>
              </div>
            `;
          }).join('');
        } else {
          trackerTopWorseFactors.innerHTML = '<span style="font-size: 12px; color: var(--text-faint); font-style: italic;">Нет зафиксированных триггеров спада</span>';
        }
      } else {
        trackerTopWorseFactors.innerHTML = '<span style="font-size: 12px; color: var(--text-faint); font-style: italic;">Нет зафиксированных триггеров спада</span>';
      }
    }
  }

  // =========================================================================
  // MODULE 7: БЕЛЫЙ ШУМ ДЛЯ СНА (DSP АУДИО-СИНТЕЗ 44.1 кГц СТЕРЕО)
  // Полнофункциональная копия программы «Белый шум»
  // =========================================================================

  const whiteNoiseState = {
    initialized: false,
    currentSoundId: 2, // 3. Коричневый шум по умолчанию (как в preview.html)
    isPlaying: false,
    timerSecondsLeft: 0,
    timerInterval: null
  };
  window.whiteNoiseState = whiteNoiseState;

  let wnAudioCtx = null;
  let wnGainNode = null;
  let wnAnalyserNode = null;
  let wnScriptProcessor = null;
  let wnVisualizerRunning = false;

  // DSP State filters (буквально из preview.html)
  let wnPinkL = new Float32Array(7);
  let wnPinkR = new Float32Array(7);
  let wnBrownL = 0, wnBrownR = 0;
  let wnVelvetL = 0, wnVelvetR = 0;
  let wnGreenLpL = 0, wnGreenLpR = 0, wnGreenHpL = 0, wnGreenHpR = 0;
  let wnPrevWhiteL = 0, wnPrevWhiteR = 0;
  let wnOceanPhase1 = 0, wnOceanPhase2 = 0;
  let wnFanPhase1 = 0, wnFanPhase2 = 0, wnFanModPhase = 0;
  let wnPlanePhase1 = 0, wnPlanePhase2 = 0;
  let wnRainResL = 0, wnRainResR = 0;

  function updatePinkDsp(p, w) {
    p[0] = 0.99886 * p[0] + w * 0.0555179;
    p[1] = 0.99332 * p[1] + w * 0.0750759;
    p[2] = 0.96900 * p[2] + w * 0.1538520;
    p[3] = 0.86650 * p[3] + w * 0.3104856;
    p[4] = 0.55000 * p[4] + w * 0.5329522;
    p[5] = -0.7616 * p[5] - w * 0.0168980;
    const res = p[0] + p[1] + p[2] + p[3] + p[4] + p[5] + p[6] + w * 0.5362;
    p[6] = w * 0.115926;
    return res * 0.11;
  }

  function initWhiteNoiseAudio() {
    if (!wnAudioCtx) {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtxClass) {
        console.warn('Web Audio API не поддерживается на данном устройстве');
        return;
      }
      wnAudioCtx = new AudioCtxClass({ sampleRate: 44100 });
      wnGainNode = wnAudioCtx.createGain();
      wnAnalyserNode = wnAudioCtx.createAnalyser();
      wnAnalyserNode.fftSize = 128;

      const bufferSize = 2048;
      wnScriptProcessor = wnAudioCtx.createScriptProcessor(bufferSize, 0, 2);

      wnScriptProcessor.onaudioprocess = function(e) {
        const outL = e.outputBuffer.getChannelData(0);
        const outR = e.outputBuffer.getChannelData(1);
        const sampleRate = wnAudioCtx ? wnAudioCtx.sampleRate : 44100;

        for (let i = 0; i < bufferSize; i++) {
          const whiteL = Math.random() * 2 - 1;
          const whiteR = Math.random() * 2 - 1;

          let sL = 0, sR = 0;

          switch (whiteNoiseState.currentSoundId) {
            case 0: // 1. Чистый белый шум (White Noise)
              sL = whiteL * 0.35;
              sR = whiteR * 0.35;
              break;
            case 1: // 2. Розовый шум (Pink Noise - Kellet filter)
              sL = updatePinkDsp(wnPinkL, whiteL) * 0.42;
              sR = updatePinkDsp(wnPinkR, whiteR) * 0.42;
              break;
            case 2: // 3. Коричневый шум (Brown Noise - Leaky integrator)
              wnBrownL = wnBrownL * 0.985 + whiteL * 0.055;
              wnBrownR = wnBrownR * 0.985 + whiteR * 0.055;
              sL = wnBrownL * 0.85;
              sR = wnBrownR * 0.85;
              break;
            case 3: // 4. Бархатный бас (Deep Velvet)
              wnBrownL = wnBrownL * 0.985 + whiteL * 0.055;
              wnBrownR = wnBrownR * 0.985 + whiteR * 0.055;
              wnVelvetL = wnVelvetL * 0.93 + wnBrownL * 0.07;
              wnVelvetR = wnVelvetR * 0.93 + wnBrownR * 0.07;
              sL = wnVelvetL * 1.5;
              sR = wnVelvetR * 1.5;
              break;
            case 4: // 5. Зелёный шум (Green Noise - Nature bandpass)
              const pL = updatePinkDsp(wnPinkL, whiteL);
              const pR = updatePinkDsp(wnPinkR, whiteR);
              wnGreenLpL = wnGreenLpL * 0.82 + pL * 0.18;
              wnGreenLpR = wnGreenLpR * 0.82 + pR * 0.18;
              wnGreenHpL = 0.95 * (wnGreenHpL + wnGreenLpL - wnGreenLpL * 0.95);
              wnGreenHpR = 0.95 * (wnGreenHpR + wnGreenLpR - wnGreenLpR * 0.95);
              sL = wnGreenLpL * 0.65;
              sR = wnGreenLpR * 0.65;
              break;
            case 5: // 6. Синий шум (Blue Noise - +3 dB/oct)
              sL = (whiteL - wnPrevWhiteL) * 0.45;
              sR = (whiteR - wnPrevWhiteR) * 0.45;
              wnPrevWhiteL = whiteL;
              wnPrevWhiteR = whiteR;
              break;
            case 6: // 7. Ночной дождь (Night Rain)
              const rPinkL = updatePinkDsp(wnPinkL, whiteL) * 0.3;
              const rPinkR = updatePinkDsp(wnPinkR, whiteR) * 0.3;
              if (Math.random() < 0.003) {
                const drop = 0.4 + Math.random() * 0.5;
                if (Math.random() < 0.5) wnRainResL += drop; else wnRainResR += drop;
              }
              wnRainResL *= 0.965;
              wnRainResR *= 0.965;
              sL = (rPinkL + wnRainResL * whiteL * 0.35) * 0.75;
              sR = (rPinkR + wnRainResR * whiteR * 0.35) * 0.75;
              break;
            case 7: // 8. Морской прибой (Ocean Surf)
              wnBrownL = wnBrownL * 0.985 + whiteL * 0.055;
              wnBrownR = wnBrownR * 0.985 + whiteR * 0.055;
              const oPinkL = updatePinkDsp(wnPinkL, whiteL) * 0.25;
              const oPinkR = updatePinkDsp(wnPinkR, whiteR) * 0.25;
              wnOceanPhase1 += (2 * Math.PI * 0.10) / sampleRate;
              wnOceanPhase2 += (2 * Math.PI * 0.24) / sampleRate;
              const swell = (Math.sin(wnOceanPhase1) * 0.65 + Math.sin(wnOceanPhase2) * 0.35 + 1.0) * 0.5;
              const waveMod = Math.pow(swell, 1.8);
              sL = (wnBrownL * 0.7 + oPinkL) * (0.25 + waveMod * 0.85);
              sR = (wnBrownR * 0.7 + oPinkR) * (0.25 + waveMod * 0.85);
              break;
            case 8: // 9. Уютный вентилятор (Bedside Fan)
              wnBrownL = wnBrownL * 0.985 + whiteL * 0.055;
              wnBrownR = wnBrownR * 0.985 + whiteR * 0.055;
              const fPinkL = updatePinkDsp(wnPinkL, whiteL) * 0.3;
              const fPinkR = updatePinkDsp(wnPinkR, whiteR) * 0.3;
              wnFanPhase1 += (2 * Math.PI * 115) / sampleRate;
              wnFanPhase2 += (2 * Math.PI * 230) / sampleRate;
              wnFanModPhase += (2 * Math.PI * 1.25) / sampleRate;
              const hum = Math.sin(wnFanPhase1) * 0.08 + Math.sin(wnFanPhase2) * 0.04;
              const blade = 1.0 + Math.sin(wnFanModPhase) * 0.15;
              sL = ((wnBrownL * 0.6 + fPinkL * 0.4) * blade + hum) * 0.8;
              sR = ((wnBrownR * 0.6 + fPinkR * 0.4) * blade + hum) * 0.8;
              break;
            case 9: // 10. Салон самолёта (Airplane Cabin)
              wnBrownL = wnBrownL * 0.985 + whiteL * 0.055;
              wnBrownR = wnBrownR * 0.985 + whiteR * 0.055;
              wnVelvetL = wnVelvetL * 0.92 + wnBrownL * 0.08;
              wnVelvetR = wnVelvetR * 0.92 + wnBrownR * 0.08;
              wnPlanePhase1 += (2 * Math.PI * 78) / sampleRate;
              wnPlanePhase2 += (2 * Math.PI * 156) / sampleRate;
              const jetHum = Math.sin(wnPlanePhase1) * 0.09 + Math.sin(wnPlanePhase2) * 0.03;
              sL = (wnVelvetL * 1.1 + wnBrownL * 0.4 + jetHum) * 0.85;
              sR = (wnVelvetR * 1.1 + wnBrownR * 0.4 + jetHum) * 0.85;
              break;
            default:
              sL = whiteL * 0.35;
              sR = whiteR * 0.35;
          }

          outL[i] = Math.max(-1, Math.min(1, sL));
          outR[i] = Math.max(-1, Math.min(1, sR));
        }
      };

      wnScriptProcessor.connect(wnGainNode);
      wnGainNode.connect(wnAnalyserNode);
      wnAnalyserNode.connect(wnAudioCtx.destination);
      updateWhiteNoiseVolume();
    }
  }

  function updateWhiteNoiseVolume() {
    const volSlider = document.getElementById('whitenoise-vol-slider');
    const volText = document.getElementById('whitenoise-vol-text');
    if (volSlider && volText) {
      volText.textContent = volSlider.value + '%';
    }
    if (wnGainNode && wnAudioCtx) {
      const v = (volSlider ? parseFloat(volSlider.value) : 70) / 100.0;
      wnGainNode.gain.setTargetAtTime(v * v, wnAudioCtx.currentTime, 0.05);
    }
  }

  function startWhiteNoiseAudio() {
    initWhiteNoiseAudio();
    if (wnAudioCtx && wnAudioCtx.state === 'suspended') {
      wnAudioCtx.resume().catch(() => {});
    }
    const volSlider = document.getElementById('whitenoise-vol-slider');
    const v = (volSlider ? parseFloat(volSlider.value) : 70) / 100.0;
    if (wnGainNode && wnAudioCtx) {
      wnGainNode.gain.cancelScheduledValues(wnAudioCtx.currentTime);
      wnGainNode.gain.setValueAtTime(0, wnAudioCtx.currentTime);
      wnGainNode.gain.linearRampToValueAtTime(v * v, wnAudioCtx.currentTime + 0.5); // 500ms smooth fade-in
    }
    whiteNoiseState.isPlaying = true;
    updateWhiteNoiseControlsUI();
    renderWhiteNoiseSoundsList();
  }

  function stopWhiteNoiseAudio(smooth = true) {
    if (wnGainNode && wnAudioCtx) {
      wnGainNode.gain.cancelScheduledValues(wnAudioCtx.currentTime);
      if (smooth) {
        wnGainNode.gain.linearRampToValueAtTime(0.0001, wnAudioCtx.currentTime + 0.5); // 500ms smooth fade-out
        setTimeout(() => {
          if (!whiteNoiseState.isPlaying && wnAudioCtx) {
            wnAudioCtx.suspend().catch(() => {});
          }
        }, 520);
      } else {
        wnGainNode.gain.setValueAtTime(0.0001, wnAudioCtx.currentTime);
        wnAudioCtx.suspend().catch(() => {});
      }
    }
    whiteNoiseState.isPlaying = false;
    updateWhiteNoiseControlsUI();
    renderWhiteNoiseSoundsList();
  }

  function toggleWhiteNoiseAudio() {
    if (whiteNoiseState.isPlaying) {
      stopWhiteNoiseAudio(true);
    } else {
      startWhiteNoiseAudio();
    }
  }

  function selectWhiteNoiseSound(id) {
    if (whiteNoiseState.currentSoundId === id && whiteNoiseState.isPlaying) {
      // Повторное нажатие на активный трек останавливает его!
      stopWhiteNoiseAudio(true);
    } else {
      whiteNoiseState.currentSoundId = id;
      renderWhiteNoiseSoundsList();
      startWhiteNoiseAudio();
    }
  }

  function updateWhiteNoiseControlsUI() {
    const btnToggle = document.getElementById('btn-whitenoise-toggle');
    const btnIcon = document.getElementById('whitenoise-btn-icon');
    const btnLabel = document.getElementById('whitenoise-btn-label');
    const liveBadge = document.getElementById('whitenoise-live-badge');
    const badgeText = document.getElementById('whitenoise-badge-text');

    if (btnToggle) {
      if (whiteNoiseState.isPlaying) {
        btnToggle.className = 'btn-main-action btn-whitenoise-main playing';
        if (btnIcon) btnIcon.textContent = '⏹';
        if (btnLabel) btnLabel.textContent = 'ОСТАНОВИТЬ ШУМ';
      } else {
        btnToggle.className = 'btn-main-action btn-whitenoise-main';
        if (btnIcon) btnIcon.textContent = '▶';
        if (btnLabel) btnLabel.textContent = 'ВКЛЮЧИТЬ БЕЛЫЙ ШУМ';
      }
    }

    if (liveBadge && badgeText) {
      if (whiteNoiseState.isPlaying) {
        liveBadge.className = 'badge active';
        badgeText.textContent = 'Воспроизведение 44.1 кГц';
      } else {
        liveBadge.className = 'badge';
        badgeText.textContent = 'Готов';
      }
    }
  }

  function renderWhiteNoiseSoundsList() {
    const listContainer = document.getElementById('whitenoise-sounds-list');
    if (!listContainer) return;
    const sounds = (typeof WHITE_NOISE_SOUNDS !== 'undefined') ? WHITE_NOISE_SOUNDS : [];

    listContainer.innerHTML = '';
    sounds.forEach(s => {
      const isCurrent = s.id === whiteNoiseState.currentSoundId;
      const item = document.createElement('div');
      item.className = 'sound-item' + (isCurrent ? ' active' : '');
      item.id = 'sound-item-' + s.id;
      item.onclick = () => selectWhiteNoiseSound(s.id);

      item.innerHTML = `
        <div class="sound-play-icon">${isCurrent && whiteNoiseState.isPlaying ? '⏸' : '▶'}</div>
        <div class="sound-content">
          <div class="sound-top-row">
            <div class="sound-name">${s.icon ? `<span style="margin-right: 5px;">${s.icon}</span>` : ''}${s.name}</div>
            <div class="sound-tag">${s.tag}</div>
          </div>
          <div class="sound-desc">${s.desc}</div>
        </div>
        <div class="sound-check">✓</div>
      `;
      listContainer.appendChild(item);
    });
  }

  function setWhiteNoiseTimer(mins) {
    if (whiteNoiseState.timerInterval) {
      clearInterval(whiteNoiseState.timerInterval);
      whiteNoiseState.timerInterval = null;
    }

    const timerStrip = document.getElementById('whitenoise-timer-strip');
    const statusEl = document.getElementById('whitenoise-timer-status');

    if (timerStrip) {
      timerStrip.querySelectorAll('.timer-chip').forEach(chip => {
        const chipMins = parseInt(chip.getAttribute('data-mins'), 10) || 0;
        if (chipMins === mins) chip.classList.add('active');
        else chip.classList.remove('active');
      });
    }

    if (mins <= 0) {
      whiteNoiseState.timerSecondsLeft = 0;
      if (statusEl) statusEl.textContent = 'Без таймера';
      return;
    }

    whiteNoiseState.timerSecondsLeft = mins * 60;
    updateWhiteNoiseTimerStatus();

    whiteNoiseState.timerInterval = setInterval(() => {
      whiteNoiseState.timerSecondsLeft--;

      if (whiteNoiseState.timerSecondsLeft <= 10 && whiteNoiseState.timerSecondsLeft > 0) {
        if (wnGainNode && wnAudioCtx) {
          wnGainNode.gain.cancelScheduledValues(wnAudioCtx.currentTime);
          wnGainNode.gain.linearRampToValueAtTime(0.0001, wnAudioCtx.currentTime + whiteNoiseState.timerSecondsLeft);
        }
      }

      if (whiteNoiseState.timerSecondsLeft <= 0) {
        clearInterval(whiteNoiseState.timerInterval);
        whiteNoiseState.timerInterval = null;
        stopWhiteNoiseAudio(false);
        if (statusEl) statusEl.textContent = 'Таймер завершён (сон)';
        setTimeout(() => {
          setWhiteNoiseTimer(0);
        }, 4000);
        return;
      }

      updateWhiteNoiseTimerStatus();
    }, 1000);
  }

  function updateWhiteNoiseTimerStatus() {
    const statusEl = document.getElementById('whitenoise-timer-status');
    if (!statusEl) return;
    const totalSecs = whiteNoiseState.timerSecondsLeft;
    if (totalSecs >= 3600) {
      const h = Math.floor(totalSecs / 3600);
      const m = Math.floor((totalSecs % 3600) / 60);
      const s = totalSecs % 60;
      statusEl.textContent = `Осталось: ${h}ч ${String(m).padStart(2, '0')}м ${String(s).padStart(2, '0')}с`;
    } else {
      const m = Math.floor(totalSecs / 60);
      const s = totalSecs % 60;
      statusEl.textContent = `Осталось: ${m}:${String(s).padStart(2, '0')}`;
    }
  }

  function openWhiteNoiseGuideModal() {
    const modal = document.getElementById('modal-whitenoise-guide');
    if (modal) {
      modal.classList.add('active');
      modal.setAttribute('aria-hidden', 'false');
    }
  }

  function closeWhiteNoiseGuideModal() {
    const modal = document.getElementById('modal-whitenoise-guide');
    if (modal) {
      modal.classList.remove('active');
      modal.setAttribute('aria-hidden', 'true');
    }
  }

  function initWhiteNoiseModule() {
    renderWhiteNoiseSoundsList();

    if (!whiteNoiseState.initialized) {
      const btnToggle = document.getElementById('btn-whitenoise-toggle');
      if (btnToggle) {
        btnToggle.addEventListener('click', toggleWhiteNoiseAudio);
      }

      const volSlider = document.getElementById('whitenoise-vol-slider');
      if (volSlider) {
        volSlider.addEventListener('input', updateWhiteNoiseVolume);
      }

      const timerStrip = document.getElementById('whitenoise-timer-strip');
      if (timerStrip) {
        timerStrip.querySelectorAll('.timer-chip').forEach(chip => {
          chip.addEventListener('click', () => {
            const mins = parseInt(chip.getAttribute('data-mins'), 10) || 0;
            setWhiteNoiseTimer(mins);
          });
        });
      }

      const btnGuide = document.getElementById('btn-whitenoise-guide');
      if (btnGuide) {
        btnGuide.addEventListener('click', openWhiteNoiseGuideModal);
      }

      const modalClose = document.getElementById('modal-btn-whitenoise-close');
      if (modalClose) {
        modalClose.addEventListener('click', closeWhiteNoiseGuideModal);
      }

      const modal = document.getElementById('modal-whitenoise-guide');
      if (modal) {
        modal.addEventListener('click', (e) => {
          if (e.target === modal) closeWhiteNoiseGuideModal();
        });
      }

      whiteNoiseState.initialized = true;
    }

    updateWhiteNoiseControlsUI();
    updateWhiteNoiseVolume();
  }

  // --- Hub & Navigation System ---
  function updateNavTabs(targetId) {
    if (!navTabItems) return;
    const isSosScreen = (targetId === 'breathing' || targetId === 'grounding' || targetId === 'whitenoise');
    navTabItems.forEach(tab => {
      const dt = tab.getAttribute('data-target');
      if (dt === targetId || (isSosScreen && dt === 'sos')) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });
  }

  function maybeShowPracticeSafetyWarning() {
    const modal = document.getElementById('modal-practice-safety-warning');
    if (!modal) return;
    let alreadySeen = false;
    try {
      alreadySeen = localStorage.getItem('kp_practice_safety_notice_v1') === '1';
    } catch (e) {}
    if (alreadySeen) return;
    try {
      localStorage.setItem('kp_practice_safety_notice_v1', '1');
    } catch (e) {}
    resetModalScroll(modal);
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
  }

  function closePracticeSafetyWarning() {
    const modal = document.getElementById('modal-practice-safety-warning');
    if (!modal) return;
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
  }

  function navigateTo(targetId) {
    window.navigateTo = navigateTo;
    if (typeof APP_MODULES !== 'undefined' && APP_MODULES.some(m => m.id === targetId) && !isModuleEnabled(targetId)) {
      targetId = 'hub';
    }
    pageReturnNav = null;
    updateNavTabs(targetId);

    const headerTitle = document.getElementById('app-header-title');
    const headerSubtitle = document.getElementById('app-header-subtitle');

    if (targetId === 'hub') {
      if (headerTitle) headerTitle.textContent = 'Карманный психолог';
      if (headerSubtitle) headerSubtitle.textContent = 'Диагностика и психологическая помощь';
      showScreen(screenHub);
      return;
    }

    if (targetId === 'szondi') {
      if (headerTitle) headerTitle.textContent = 'Тест Сонди (МПВ)';
      if (headerSubtitle) headerSubtitle.textContent = 'Психодиагностика характера и темперамента';
      showScreen(screenWelcome);
      return;
    }

    if (targetId === 'breathing') {
      if (headerTitle) headerTitle.textContent = 'Дыхательная релаксация';
      if (headerSubtitle) headerSubtitle.textContent = '5 техник саморегуляции и снятия стресса';
      try {
        initBreathingModule();
      } catch (err) {
        console.error('Breathing module init error:', err);
      }
      maybeShowPracticeSafetyWarning();
      showScreen(screenBreathing);
      return;
    }

    if (targetId === 'grounding') {
      if (headerTitle) headerTitle.textContent = 'Техника заземления (5-4-3-2-1)';
      if (headerSubtitle) headerSubtitle.textContent = 'Соматическое возвращение в реальность «здесь и сейчас»';
      try {
        initGroundingModule();
      } catch (err) {
        console.error('Grounding module init error:', err);
      }
      showScreen(screenGrounding);
      return;
    }

    if (targetId === 'coping') {
      if (headerTitle) headerTitle.textContent = 'Копинг-карточки (КПТ)';
      if (headerSubtitle) headerSubtitle.textContent = 'Колода поддерживающих рациональных установок';
      try {
        initCopingModule();
      } catch (err) {
        console.error('Coping module init error:', err);
      }
      showScreen(screenCoping);
      if (typeof applyAdvancedModesUI === 'function') applyAdvancedModesUI();
      return;
    }

    if (targetId === 'thoughts') {
      if (headerTitle) headerTitle.textContent = 'Дневник мыслей (КПТ)';
      if (headerSubtitle) headerSubtitle.textContent = 'Выявление автоматических мыслей и когнитивная реструктуризация';
      try {
        initThoughtsModule();
      } catch (err) {
        console.error('Thoughts module init error:', err);
      }
      showScreen(screenThoughts);
      if (typeof applyAdvancedModesUI === 'function') applyAdvancedModesUI();
      return;
    }

    if (targetId === 'mood-tracker' || targetId === 'tracker') {
      if (headerTitle) headerTitle.textContent = 'Трекер состояний';
      if (headerSubtitle) headerSubtitle.textContent = 'Анализ факторов «Когда лучше / Когда хуже»';
      try {
        initTrackerModule();
      } catch (err) {
        console.error('Tracker module init error:', err);
      }
      showScreen(screenTracker);
      if (typeof applyAdvancedModesUI === 'function') applyAdvancedModesUI();
      return;
    }

    if (targetId === 'diary') {
      if (headerTitle) headerTitle.textContent = 'Дневник';
      if (headerSubtitle) headerSubtitle.textContent = 'Личные записи, мысли и списки дел';
      try {
        if (typeof window.initDiaryModule === 'function') window.initDiaryModule();
      } catch (err) {
        console.error('Diary module init error:', err);
      }
      showScreen(screenDiary);
      if (typeof window.afterDiaryScreenShown === 'function') window.afterDiaryScreenShown();
      return;
    }

    if (targetId === 'whitenoise') {
      if (headerTitle) headerTitle.textContent = 'Белый шум для сна';
      if (headerSubtitle) headerSubtitle.textContent = '10 вариантов монотонного шума для быстрого засыпания';
      try {
        initWhiteNoiseModule();
      } catch (err) {
        console.error('White noise module init error:', err);
      }
      maybeShowPracticeSafetyWarning();
      showScreen(screenWhitenoise);
      return;
    }

    if (targetId === 'settings') {
      if (typeof window.openSettingsModal === 'function') {
        window.openSettingsModal();
      }
      return;
    }

    if (targetId === 'sos') {
      if (typeof window.openSosEmergencyModal === 'function') {
        window.openSosEmergencyModal();
      }
      return;
    }

    if (targetId === 'author') {
      if (headerTitle) headerTitle.textContent = 'О специалисте';
      if (headerSubtitle) headerSubtitle.textContent = 'Автор проекта «Карманный психолог»';
      showScreen(screenAuthor);
      return;
    }

    // Upcoming modules
    if (typeof APP_MODULES !== 'undefined') {
      const mod = APP_MODULES.find(m => m.id === targetId);
      if (mod) {
        if (upcomingTitle) upcomingTitle.textContent = mod.title;
        if (upcomingIcon) upcomingIcon.innerHTML = (typeof uiIcon === 'function' && uiIcon(mod.id, 48)) || mod.icon;
        if (upcomingDesc) upcomingDesc.textContent = mod.desc;
        if (upcomingModuleHeaderTitle) {
          upcomingModuleHeaderTitle.textContent = `Модуль ${mod.number}: ${mod.title}`;
          upcomingModuleHeaderTitle.style.color = mod.color || '#6F927B';
        }
        if (headerTitle) headerTitle.textContent = mod.title;
        if (headerSubtitle) headerSubtitle.textContent = mod.badge || 'В разработке';
        showScreen(screenUpcoming);
        return;
      }
    }

    showScreen(screenHub);
  }
  window.navigateTo = navigateTo;

  function applyModuleVisibility() {
    navTabItems.forEach(tab => {
      const target = tab.getAttribute('data-target');
      if (!target || target === 'hub' || target === 'sos' || target === 'settings') {
        tab.style.display = '';
        return;
      }
      if (typeof APP_MODULES !== 'undefined' && APP_MODULES.some(m => m.id === target)) {
        tab.style.display = isModuleEnabled(target) ? '' : 'none';
      }
    });

    const practiceIds = ['breathing', 'grounding', 'whitenoise'];
    const allPracticesOff = practiceIds.every(id => !isModuleEnabled(id));
    const sosNav = document.getElementById('btn-bottom-nav-sos');
    if (sosNav) sosNav.style.display = allPracticesOff ? 'none' : '';

    const sosSelectMap = {
      'btn-sos-select-breathing': 'breathing',
      'btn-sos-select-grounding': 'grounding',
      'btn-sos-select-whitenoise': 'whitenoise',
      'btn-sos-breathe': 'breathing',
      'btn-sos-ground': 'grounding',
      'btn-sos-whitenoise': 'whitenoise'
    };
    Object.keys(sosSelectMap).forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = isModuleEnabled(sosSelectMap[id]) ? '' : 'none';
    });
    const sosHubBox = document.querySelector('.sos-btns');
    if (sosHubBox) sosHubBox.style.display = allPracticesOff ? 'none' : '';

    renderHubModules();
  }

  function renderHubModules() {
    if (!hubModulesGrid || typeof APP_MODULES === 'undefined') return;
    const enabledModules = APP_MODULES.filter(mod => isModuleEnabled(mod.id));
    const countEl = document.getElementById('hub-modules-count');
    if (countEl) {
      countEl.textContent = `${enabledModules.length} ${enabledModules.length === 1 ? 'направление' : (enabledModules.length > 1 && enabledModules.length < 5 ? 'направления' : 'направлений')}`;
    }
    hubModulesGrid.innerHTML = '';
    if (enabledModules.length === 0) {
      hubModulesGrid.innerHTML = '<div class="modules-empty">Все модули отключены. Включите нужные в «Опциях» → «Модули приложения».</div>';
      return;
    }

    enabledModules.forEach(mod => {
      const isReady = mod.status === 'ready';
      const card = document.createElement('div');
      card.className = `module-card ${isReady ? 'active-module' : 'upcoming-module'}`;
      card.setAttribute('data-module-id', mod.id);

      card.innerHTML = `
        <div class="module-card-top">
          <div class="module-icon-box" style="background: ${mod.colorBg || 'rgba(37, 53, 44, 0.1)'}; border: 1px solid ${mod.colorBorder || 'rgba(37, 53, 44, 0.2)'}; color: ${mod.color || '#25352C'};">
            ${(typeof uiIcon === 'function' && uiIcon(mod.id, 26)) || mod.icon}
          </div>
          <span class="module-badge" style="background: ${mod.colorBg || 'rgba(37, 53, 44, 0.1)'}; color: ${mod.color || '#25352C'}; border: 1px solid ${mod.colorBorder || 'rgba(37, 53, 44, 0.2)'};">
            ${mod.badge}
          </span>
        </div>
        <div>
          <div class="module-num">Модуль ${mod.number}</div>
          <h4 class="module-title">${mod.title}</h4>
          <p class="module-desc">${mod.desc}</p>
        </div>
        <div class="module-card-footer">
          <span class="module-action-btn" style="color: ${mod.color || '#2F4A3B'};">
            ${isReady ? 'Открыть модуль →' : 'Подробнее →'}
          </span>
          <span style="font-size: 11.5px; color: var(--text-faint);">
            ${isReady ? 'Готов к работе' : 'В разработке'}
          </span>
        </div>
      `;

      card.addEventListener('click', () => {
        navigateTo(mod.id);
      });

      hubModulesGrid.appendChild(card);
    });
  }

  // Navigation event handlers
  if (btnHeaderHome) btnHeaderHome.addEventListener('click', () => navigateTo('hub'));
  if (btnHeaderModulesToggle) btnHeaderModulesToggle.addEventListener('click', () => navigateTo('hub'));
  if (btnResultsToHub) btnResultsToHub.addEventListener('click', () => navigateTo('hub'));
  if (btnSosBreathe) btnSosBreathe.addEventListener('click', () => navigateTo('breathing'));
  if (btnSosGround) btnSosGround.addEventListener('click', () => navigateTo('grounding'));
  if (btnSosWhitenoise) btnSosWhitenoise.addEventListener('click', () => navigateTo('whitenoise'));
  if (btnHubOpenAuthor) btnHubOpenAuthor.addEventListener('click', () => navigateTo('author'));
  if (btnSettingsOpenAuthor) {
    btnSettingsOpenAuthor.addEventListener('click', () => {
      const modal = document.getElementById('modal-app-settings');
      if (modal) {
        setPageFullscreen(modal, false);
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
      }
      navigateTo('author');
    });
  }

  const btnPracticeSafetyContinue = document.getElementById('modal-btn-practice-safety-continue');
  if (btnPracticeSafetyContinue) {
    btnPracticeSafetyContinue.addEventListener('click', closePracticeSafetyWarning);
  }

  document.querySelectorAll('.btn-nav-to-hub').forEach(btn => {
    btn.addEventListener('click', () => navigateTo('hub'));
  });

  if (navTabItems) {
    navTabItems.forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.getAttribute('data-target');
        // Settings and Help have their own full-page openers.
        if (target === 'settings' || target === 'sos') return;
        if (target) navigateTo(target);
      });
    });
  }

  // =========================================================================
  // DATA EXPORT & SHARE CONTROLLER (Сонди, Карточки, Мысли, Трекер)
  // =========================================================================

  function formatExportDateTime(val) {
    if (!val) return 'Дата не указана';
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return String(val);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, '0');
      const mins = String(d.getMinutes()).padStart(2, '0');
      return `${day}.${month}.${year}, ${hours}:${mins}`;
    } catch (e) {
      return String(val);
    }
  }

  function getUserExportDatasets() {
    // 1. Szondi tests
    const szondiList = (typeof getHistoryList === 'function') ? getHistoryList() : [];

    // 2. User coping cards: own cards + popular cards added to the deck
    let copingList = (copingState && typeof getUserCopingCards === 'function')
      ? getUserCopingCards()
      : [];
    if (copingList.length === 0) {
      try {
        const stored = localStorage.getItem('pocket_psy_custom_coping');
        if (stored) {
          copingList = JSON.parse(stored);
          if (copingState) copingState.customCards = copingList;
        }
      } catch (e) {}
    }
    const favSet = new Set(copingState && Array.isArray(copingState.favorites) ? copingState.favorites : []);

    // 3. Thoughts user records
    let thoughtsList = (thoughtsState && Array.isArray(thoughtsState.userRecords) && thoughtsState.userRecords.length > 0)
      ? thoughtsState.userRecords
      : [];
    if (thoughtsList.length === 0) {
      try {
        const stored = localStorage.getItem('pocket_psy_thoughts_user');
        if (stored) {
          thoughtsList = JSON.parse(stored);
          if (thoughtsState) thoughtsState.userRecords = thoughtsList;
        }
      } catch (e) {}
    }

    // 4. Tracker user entries
    let trackerList = (trackerState && Array.isArray(trackerState.userEntries) && trackerState.userEntries.length > 0)
      ? trackerState.userEntries
      : [];
    if (trackerList.length === 0) {
      try {
        const stored = localStorage.getItem('pocket_psy_user_tracker_entries');
        if (stored) {
          trackerList = JSON.parse(stored);
          if (trackerState) trackerState.userEntries = trackerList;
        }
      } catch (e) {}
    }

    // 5. Personal diary notes and diary entries
    let diarySections = [];
    let diaryNotes = [];
    try {
      const rawDiary = localStorage.getItem('pocket_psy_diary_v1');
      if (rawDiary) {
        const diaryData = JSON.parse(rawDiary);
        diarySections = Array.isArray(diaryData.sections) ? diaryData.sections : [];
        diaryNotes = Array.isArray(diaryData.notes) ? diaryData.notes : [];
      }
    } catch (e) {}

    return { szondiList, copingList, favSet, thoughtsList, trackerList, diarySections, diaryNotes };
  }

  function generateUserDataReportText() {
    const now = new Date();
    const generatedDateStr = formatExportDateTime(now);

    const { szondiList, copingList, favSet, thoughtsList, trackerList, diarySections, diaryNotes } = getUserExportDatasets();

    const totalRecords = szondiList.length + copingList.length + thoughtsList.length + trackerList.length + diaryNotes.length;

    let text = '';
    text += '================================================================================\n';
    text += '           КАРМАННЫЙ ПСИХОЛОГ — ПЕРСОНАЛЬНЫЙ ОТЧЁТ И ВЫГРУЗКА ДАННЫХ           \n';
    text += '================================================================================\n';
    text += `Дата формирования: ${generatedDateStr}\n`;
    text += `Всего пользовательских записей: ${totalRecords}\n`;
    text += `• Модуль «Тест Сонди»: ${szondiList.length} тестов\n`;
    text += `• Модуль «Копинг-карты»: ${copingList.length} карточек\n`;
    text += `• Модуль «Дневник мыслей»: ${thoughtsList.length} записей\n`;
    text += `• Модуль «Трекер состояний»: ${trackerList.length} отметок\n`;
    text += `• Модуль «Личный дневник»: ${diaryNotes.length} записей\n`;
    text += '================================================================================\n\n';

    // -------------------------------------------------------------------------
    // 1. МОДУЛЬ «ТЕСТ СОНДИ»
    // -------------------------------------------------------------------------
    text += '--------------------------------------------------------------------------------\n';
    text += '1. МОДУЛЬ «ТЕСТ СОНДИ» (РЕЗУЛЬТАТЫ ПСИХОДИАГНОСТИКИ ВЛЕЧЕНИЙ)\n';
    text += '--------------------------------------------------------------------------------\n';
    if (szondiList.length === 0) {
      text += 'Пользовательских результатов тестирования пока нет.\n\n';
    } else {
      text += `Количество пройденных тестирований: ${szondiList.length}\n\n`;
      szondiList.forEach((item, idx) => {
        const testDate = item.dateStr || formatExportDateTime(item.timestamp || item.date);
        text += `[Тест №${idx + 1}]\n`;
        text += `• Дата и время: ${testDate}\n`;
        text += `• Режим исследования: ${item.exploreSecondPlan ? 'Полное тестирование (1-й и 2-й планы)' : 'Классический тест (1-й план)'}\n`;
        if (item.note && item.note.trim()) {
          text += `• Заметка к тесту: ${item.note.trim()}\n`;
        }
        if (item.formula) {
          text += `• Формула влечений: ${item.formula}\n`;
        }
        if (item.firstPlanScores) {
          const sc = item.firstPlanScores;
          text += `• Профиль 1-го плана:\n`;
          text += `  - Вектор S (Сексуальное влечение): h = +${sc['h+'] || 0}/-${sc['h-'] || 0}, s = +${sc['s+'] || 0}/-${sc['s-'] || 0}\n`;
          text += `  - Вектор P (Пароксизмальное влечение): e = +${sc['e+'] || 0}/-${sc['e-'] || 0}, hy = +${sc['hy+'] || 0}/-${sc['hy-'] || 0}\n`;
          text += `  - Вектор Sch (Я-влечение): k = +${sc['k+'] || 0}/-${sc['k-'] || 0}, p = +${sc['p+'] || 0}/-${sc['p-'] || 0}\n`;
          text += `  - Вектор C (Контактное влечение): d = +${sc['d+'] || 0}/-${sc['d-'] || 0}, m = +${sc['m+'] || 0}/-${sc['m-'] || 0}\n`;
        }
        if (item.secondPlanScores) {
          const sc2 = item.secondPlanScores;
          text += `• Профиль 2-го плана (фоновые и компенсаторные тенденции):\n`;
          text += `  - Вектор S: h = +${sc2['h+'] || 0}/-${sc2['h-'] || 0}, s = +${sc2['s+'] || 0}/-${sc2['s-'] || 0}\n`;
          text += `  - Вектор P: e = +${sc2['e+'] || 0}/-${sc2['e-'] || 0}, hy = +${sc2['hy+'] || 0}/-${sc2['hy-'] || 0}\n`;
          text += `  - Вектор Sch: k = +${sc2['k+'] || 0}/-${sc2['k-'] || 0}, p = +${sc2['p+'] || 0}/-${sc2['p-'] || 0}\n`;
          text += `  - Вектор C: d = +${sc2['d+'] || 0}/-${sc2['d-'] || 0}, m = +${sc2['m+'] || 0}/-${sc2['m-'] || 0}\n`;
        }
        text += '\n';
      });
    }

    // -------------------------------------------------------------------------
    // 2. МОДУЛЬ «КОПИНГ-КАРТОЧКИ»
    // -------------------------------------------------------------------------
    text += '--------------------------------------------------------------------------------\n';
    text += '2. МОДУЛЬ «КОПИНГ-КАРТОЧКИ» (ПОЛЬЗОВАТЕЛЬСКИЕ КАРТЫ САМОПОМОЩИ)\n';
    text += '--------------------------------------------------------------------------------\n';
    if (copingList.length === 0) {
      text += 'Пользовательских копинг-карточек пока нет.\n\n';
    } else {
      text += `Количество созданных карточек: ${copingList.length}\n\n`;
      copingList.forEach((card, idx) => {
        let cardDate = 'Дата создания не сохранена';
        if (card.createdAt) cardDate = formatExportDateTime(card.createdAt);
        else if (card.id && card.id.startsWith('custom-')) {
          const ts = parseInt(card.id.replace('custom-', ''), 10);
          if (!isNaN(ts) && ts > 0) cardDate = formatExportDateTime(ts);
        }
        text += `[Карточка №${idx + 1}]\n`;
        text += `• Дата и время ввода: ${cardDate}\n`;
        text += `• Категория: ${card.categoryName || card.category || 'КПТ'}\n`;
        if (card.statement && card.statement.trim()) {
          text += `• Поддерживающая мысль: «${card.statement.trim()}»\n`;
        }
        if (card.action && card.action.trim()) {
          text += `• Заземляющее действие: ${card.action.trim()}\n`;
        }
        text += `• В избранном: ${favSet.has(card.id) ? 'Да ★' : 'Нет'}\n\n`;
      });
    }

    // -------------------------------------------------------------------------
    // 3. МОДУЛЬ «ДНЕВНИК АВТОМАТИЧЕСКИХ МЫСЛЕЙ (КПТ)»
    // -------------------------------------------------------------------------
    text += '--------------------------------------------------------------------------------\n';
    text += '3. МОДУЛЬ «ДНЕВНИК АВТОМАТИЧЕСКИХ МЫСЛЕЙ (КПТ)»\n';
    text += '--------------------------------------------------------------------------------\n';
    if (thoughtsList.length === 0) {
      text += 'Записей в дневнике мыслей пока нет.\n\n';
    } else {
      text += `Количество записей в дневнике мыслей: ${thoughtsList.length}\n\n`;
      thoughtsList.forEach((rec, idx) => {
        let thoughtTs = rec.date;
        if (!thoughtTs && rec.id && /^thought-\d+$/.test(rec.id)) {
          const ts = parseInt(rec.id.replace('thought-', ''), 10);
          if (!isNaN(ts) && ts > 0) thoughtTs = new Date(ts).toISOString();
        }
        const thoughtDate = formatExportDateTime(thoughtTs);
        const emotionObj = (typeof THOUGHT_EMOTIONS !== 'undefined')
          ? THOUGHT_EMOTIONS.find(e => e.id === rec.emotion) || { name: rec.emotion || 'Эмоция', icon: '⚡' }
          : { name: rec.emotion || 'Эмоция', icon: '⚡' };
        const distortionObj = (typeof THOUGHT_DISTORTIONS !== 'undefined')
          ? THOUGHT_DISTORTIONS.find(d => d.id === rec.distortion) || { name: rec.distortion || 'Когнитивная ловушка' }
          : { name: rec.distortion || 'Когнитивная ловушка' };

        const isSimple = Boolean(rec.isSimple || !rec.rationalResponse);

        text += `[Запись №${idx + 1}]\n`;
        text += `• Дата и время: ${thoughtDate}\n`;
        text += `• Формат разбора: ${isSimple ? 'Простая мысль (краткая фиксация)' : 'Полный разбор КПТ'}\n`;
        if (rec.situation && rec.situation.trim()) {
          text += `• Ситуация / Триггер: ${rec.situation.trim()}\n`;
        }
        text += `• Автоматическая мысль: «${rec.automaticThought || ''}»\n`;
        if (rec.beliefBefore !== undefined && rec.beliefBefore !== null) {
          text += `• Исходная вера в мысль: ${rec.beliefBefore}%\n`;
        }
        text += rec.emotion
          ? `• Ведущая эмоция: ${emotionObj.name}${rec.emotionIntensityBefore !== null && rec.emotionIntensityBefore !== undefined ? ` (${rec.emotionIntensityBefore}%)` : ''}\n`
          : '• Ведущая эмоция: не указана (пользователь не отмечал)\n';
        if (!isSimple) {
          text += `• Когнитивная ошибка: ${distortionObj.name}\n`;
          if (rec.rationalResponse && rec.rationalResponse.trim()) {
            text += `• Рациональный ответ КПТ: ${rec.rationalResponse.trim()}\n`;
          }
          if (rec.emotionIntensityAfter !== undefined && rec.emotionIntensityAfter !== null) {
            text += `• Интенсивность эмоции после разбора: ${rec.emotionIntensityAfter}%\n`;
            if (rec.emotionIntensityBefore) {
              const diff = rec.emotionIntensityBefore - rec.emotionIntensityAfter;
              text += `• Снижение остроты эмоции: ${diff > 0 ? `-${diff}%` : `${diff}%`}\n`;
            }
          }
        }
        text += '\n';
      });
    }

    // -------------------------------------------------------------------------
    // 4. МОДУЛЬ «ТРЕКЕР НАСТРОЕНИЯ И САМОЧУВСТВИЯ»
    // -------------------------------------------------------------------------
    text += '--------------------------------------------------------------------------------\n';
    text += '4. МОДУЛЬ «ТРЕКЕР НАСТРОЕНИЯ И САМОЧУВСТВИЯ» («КОГДА ЛУЧШЕ / КОГДА ХУЖЕ»)\n';
    text += '--------------------------------------------------------------------------------\n';
    if (trackerList.length === 0) {
      text += 'Отметок в трекере пока нет.\n\n';
    } else {
      text += `Количество отметок в трекере: ${trackerList.length}\n\n`;
      trackerList.forEach((entry, idx) => {
        const entryDate = formatExportDateTime(entry.timestamp || entry.date);
        const isBetter = entry.entryType === 'better';
        const score = entry.intensity || (isBetter ? (entry.happiness || 8) : (entry.stress || 8));

        text += `[Отметка №${idx + 1}]\n`;
        text += `• Дата и время: ${entryDate}\n`;
        text += `• Состояние: ${isBetter ? '🌿 «Когда лучше» (Ресурсное состояние)' : '🌧️ «Когда хуже» (Фактор спада)'}\n`;
        text += `• ${isBetter ? 'Степень ресурса' : 'Уровень спада / стресса'}: ${score} из 10\n`;
        if (entry.cause && entry.cause.trim()) {
          text += `• Что произошло / Заметка: ${entry.cause.trim()}\n`;
        } else if (entry.note && entry.note.trim()) {
          text += `• Заметка: ${entry.note.trim()}\n`;
        }
        if (Array.isArray(entry.moods) && entry.moods.length > 0) {
          const moodNames = entry.moods.map(m => {
            if (typeof TRACKER_MOODS !== 'undefined') {
              const found = TRACKER_MOODS.find(item => item.id === m);
              if (found) return `${found.label || found.name || m}`;
            }
            return m;
          });
          text += `• Отмеченные эмоции: ${moodNames.join(', ')}\n`;
        }
        if (Array.isArray(entry.factors) && entry.factors.length > 0) {
          const factorNames = entry.factors.map(f => {
            if (typeof TRACKER_FACTORS !== 'undefined') {
              const found = TRACKER_FACTORS.find(item => item.id === f);
              if (found) return `${found.label || found.name || f}`;
            }
            return f;
          });
          text += `• Влияющие факторы: ${factorNames.join(', ')}\n`;
        }
        text += '\n';
      });
    }

    // -------------------------------------------------------------------------
    // 5. МОДУЛЬ «ЛИЧНЫЙ ДНЕВНИК»
    // -------------------------------------------------------------------------
    text += '--------------------------------------------------------------------------------\n';
    text += '5. МОДУЛЬ «ЛИЧНЫЙ ДНЕВНИК» (ЗАМЕТКИ И ЗАПИСИ ДНЕВНИКА)\n';
    text += '--------------------------------------------------------------------------------\n';
    if (diaryNotes.length === 0) {
      text += 'Записей в личном дневнике пока нет.\n\n';
    } else {
      const diarySectionMap = new Map(diarySections.map(sec => [sec.id, sec.title || 'Без названия']));
      text += `Количество записей: ${diaryNotes.length}\n\n`;
      diaryNotes.slice().sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0)).forEach((note, idx) => {
        const isDiary = note.kind === 'diary';
        const sectionTitle = isDiary ? 'Дневник' : (diarySectionMap.get(note.sectionId) || 'Без раздела');
        const typeLabel = isDiary ? 'Запись дневника' : (note.type === 'list' ? 'Список задач' : (note.type === 'bullets' ? 'Список пунктов' : 'Заметка'));
        text += `[Запись №${idx + 1}]\n`;
        text += `• Тип: ${typeLabel}\n`;
        text += `• Раздел: ${sectionTitle}\n`;
        text += `• Заголовок: ${note.title || 'Без названия'}\n`;
        text += `• Создано: ${formatExportDateTime(note.createdAt)}\n`;
        text += `• Обновлено: ${formatExportDateTime(note.updatedAt)}\n`;
        text += `• Содержимое:\n${note.content || ''}\n\n`;
      });
    }

    text += '================================================================================\n';
    text += 'Конец выгрузки данных приложения «Карманный психолог»\n';
    text += '================================================================================\n';

    return text;
  }

  function openExportDataModal() {
    const modal = document.getElementById('modal-export-data');
    if (!modal) return;

    const { szondiList, copingList, thoughtsList, trackerList, diaryNotes } = getUserExportDatasets();

    const elSzondi = document.getElementById('export-count-szondi');
    const elCoping = document.getElementById('export-count-coping');
    const elThoughts = document.getElementById('export-count-thoughts');
    const elTracker = document.getElementById('export-count-tracker');
    const elDiary = document.getElementById('export-count-diary');
    const previewEl = document.getElementById('export-document-preview');

    if (elSzondi) elSzondi.textContent = `${szondiList.length} тестов`;
    if (elCoping) elCoping.textContent = `${copingList.length} карт`;
    if (elThoughts) elThoughts.textContent = `${thoughtsList.length} записей`;
    if (elTracker) elTracker.textContent = `${trackerList.length} отметок`;
    if (elDiary) elDiary.textContent = `${diaryNotes.length} записей`;

    const reportText = generateUserDataReportText();
    if (previewEl) previewEl.textContent = reportText;

    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
  }

  function closeExportDataModal() {
    const modal = document.getElementById('modal-export-data');
    if (modal) {
      modal.classList.remove('active');
      modal.setAttribute('aria-hidden', 'true');
    }
  }

  function downloadTextFile(content, filename) {
    try {
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 300);
      showTrackerToast('Текстовый документ выгружен');
    } catch (e) {
      console.error('Error downloading export file:', e);
      showTrackerToast('Не удалось скачать файл');
    }
  }

  async function shareExportData() {
    const reportText = generateUserDataReportText();
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const filename = `PocketPsychologist_data_${yyyy}-${mm}-${dd}.txt`;

    // 0. Android Native App Bridge
    if (window.AndroidBridge && typeof window.AndroidBridge.shareResults === 'function') {
      window.AndroidBridge.shareResults(reportText);
      showTrackerToast('Текстовый отчёт передан');
      return;
    }

    let fileShared = false;

    // 1. Try sharing File via Web Share API
    if (typeof navigator !== 'undefined' && navigator.canShare && typeof File !== 'undefined') {
      try {
        const file = new File([reportText], filename, { type: 'text/plain;charset=utf-8' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'Карманный психолог — Данные пользователя',
            text: `Выгрузка данных пользователя (Сонди, Карточки, Мысли, Трекер) от ${dd}.${mm}.${yyyy}`
          });
          fileShared = true;
          showTrackerToast('Файл успешно передан');
          return;
        }
      } catch (err) {
        if (err.name === 'AbortError') return; // User cancelled share dialog
        console.warn('File share failed, falling back to text share:', err);
      }
    }

    // 2. Try sharing plain text via Web Share API
    if (!fileShared && typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Карманный психолог — Данные пользователя',
          text: reportText
        });
        fileShared = true;
        showTrackerToast('Данные успешно переданы');
        return;
      } catch (err) {
        if (err.name === 'AbortError') return;
        console.warn('Text share failed, falling back to file download:', err);
      }
    }

    // 3. Fallback: Download file directly
    downloadTextFile(reportText, filename);
  }

  function copyExportTextToClipboard() {
    const reportText = generateUserDataReportText();
    const iconEl = document.getElementById('export-copy-icon');
    const labelEl = document.getElementById('export-copy-label');

    const updateLabelSuccess = () => {
      if (iconEl) iconEl.textContent = '✓';
      if (labelEl) labelEl.textContent = 'Скопировано!';
      showTrackerToast('Текст скопирован в буфер обмена');
      setTimeout(() => {
        if (iconEl) iconEl.textContent = '📋';
        if (labelEl) labelEl.textContent = 'Скопировать текст';
      }, 2500);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(reportText).then(updateLabelSuccess).catch(() => {
        fallbackCopyText(reportText, updateLabelSuccess);
      });
    } else {
      fallbackCopyText(reportText, updateLabelSuccess);
    }
  }

  function fallbackCopyText(text, onSuccess) {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.top = '-9999px';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const success = document.execCommand('copy');
      document.body.removeChild(ta);
      if (success) onSuccess();
      else showTrackerToast('Не удалось скопировать текст');
    } catch (e) {
      showTrackerToast('Ошибка копирования текста');
    }
  }

  function setupExportDataController() {
    const btnHubExport = document.getElementById('btn-hub-open-export');
    const btnSzondiExport = document.getElementById('btn-szondi-open-export');
    const btnModalClose = document.getElementById('modal-btn-export-close');
    const btnModalCloseX = document.getElementById('modal-btn-export-close-x');
    const modalExport = document.getElementById('modal-export-data');
    const btnDoShare = document.getElementById('btn-export-do-share');
    const btnDownload = document.getElementById('btn-export-download-file');
    const btnCopy = document.getElementById('btn-export-copy-clipboard');

    if (btnHubExport) btnHubExport.addEventListener('click', openExportDataModal);
    if (btnSzondiExport) btnSzondiExport.addEventListener('click', openExportDataModal);
    if (btnModalClose) btnModalClose.addEventListener('click', closeExportDataModal);
    if (btnModalCloseX) btnModalCloseX.addEventListener('click', closeExportDataModal);

    if (modalExport) {
      modalExport.addEventListener('click', (e) => {
        if (e.target === modalExport) closeExportDataModal();
      });
    }

    if (btnDoShare) btnDoShare.addEventListener('click', shareExportData);
    if (btnDownload) {
      btnDownload.addEventListener('click', () => {
        const reportText = generateUserDataReportText();
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        downloadTextFile(reportText, `PocketPsychologist_data_${yyyy}-${mm}-${dd}.txt`);
      });
    }
    if (btnCopy) btnCopy.addEventListener('click', copyExportTextToClipboard);
  }

  // =========================================================================
  // ADVANCED MODES UI APPLIER
  // =========================================================================
  function applyAdvancedModesUI() {
    // 1. Coping Module
    const btnAddAdvCoping = document.getElementById('btn-add-advanced-coping');
    const btnCopingEdit = document.getElementById('btn-coping-edit-mode');
    const modalBtnCopingEdit = document.getElementById('modal-btn-coping-list-edit-mode');
    const btnCopingDelete = document.getElementById('btn-coping-delete');
    const btnCopingEditCurrent = document.getElementById('btn-coping-edit-current');

    if (btnAddAdvCoping) {
      btnAddAdvCoping.style.display = appSettings.copingAdvanced ? 'flex' : 'none';
    }
    if (btnCopingEdit) {
      btnCopingEdit.style.display = appSettings.copingAdvanced ? 'inline-flex' : 'none';
    }
    if (modalBtnCopingEdit) {
      modalBtnCopingEdit.style.display = appSettings.copingAdvanced ? 'inline-flex' : 'none';
    }
    if (!appSettings.copingAdvanced) {
      if (typeof copingState !== 'undefined' && copingState.isEditMode) {
        copingState.isEditMode = false;
        if (typeof updateCopingEditModeUI === 'function') updateCopingEditModeUI();
      }
      if (btnCopingDelete) btnCopingDelete.style.display = 'none';
      if (btnCopingEditCurrent) btnCopingEditCurrent.style.display = 'none';
    }

    // 2. Thoughts Module
    const btnThoughtFull = document.getElementById('btn-thought-full');
    const btnThoughtsEdit = document.getElementById('btn-thoughts-edit-mode');
    const thoughtsHeroButtonsRow = document.getElementById('thoughts-hero-buttons-row');

    if (btnThoughtFull) {
      btnThoughtFull.style.display = appSettings.thoughtsAdvanced ? 'flex' : 'none';
    }
    if (thoughtsHeroButtonsRow) {
      thoughtsHeroButtonsRow.style.gridTemplateColumns = appSettings.thoughtsAdvanced ? '1fr 1fr' : '1fr';
    }
    if (btnThoughtsEdit) {
      btnThoughtsEdit.style.display = appSettings.thoughtsAdvanced ? 'inline-flex' : 'none';
    }
    // "Разбор мыслей" and both "Примеры разбора" entries belong to the
    // extended mode only.
    const breakdownToggleWrap = btnToggleThoughtBreakdowns ? btnToggleThoughtBreakdowns.closest('div') : null;
    if (breakdownToggleWrap) {
      breakdownToggleWrap.style.display = appSettings.thoughtsAdvanced ? '' : 'none';
    }
    if (btnOpenThoughtExamples) {
      btnOpenThoughtExamples.style.display = appSettings.thoughtsAdvanced ? '' : 'none';
    }
    if (btnOpenThoughtExamplesExtended) {
      btnOpenThoughtExamplesExtended.style.display = appSettings.thoughtsAdvanced ? '' : 'none';
    }
    if (!appSettings.thoughtsAdvanced) {
      if (thoughtsBreakdownsCollapse) thoughtsBreakdownsCollapse.style.display = 'none';
      if (labelToggleThoughtBreakdowns) labelToggleThoughtBreakdowns.textContent = 'Показать разбор мыслей';
      if (typeof thoughtsState !== 'undefined' && thoughtsState.isEditMode) {
        thoughtsState.isEditMode = false;
        if (typeof updateThoughtsEditModeUI === 'function') updateThoughtsEditModeUI();
      }
    }
    if (typeof renderThoughtsTable === 'function') {
      renderThoughtsTable();
    }

    // 3. Tracker Module
    const btnTrackerFullAction = document.getElementById('btn-tracker-full-action');
    const trackerHeroButtonsRow = document.getElementById('tracker-hero-buttons-row');
    const modalBtnTrackerFull = document.getElementById('modal-btn-tracker-full');
    const wrapLinkTrackerToFull = document.getElementById('wrap-link-tracker-to-full');
    const btnTrackerEditMode = document.getElementById('btn-tracker-edit-mode');
    const modalBtnTrackerHistoryEdit = document.getElementById('modal-btn-tracker-history-edit-mode');

    if (btnTrackerFullAction) {
      btnTrackerFullAction.style.display = appSettings.trackerAdvanced ? 'flex' : 'none';
    }
    if (trackerHeroButtonsRow) {
      trackerHeroButtonsRow.style.gridTemplateColumns = appSettings.trackerAdvanced ? '1fr 1fr' : '1fr';
    }
    if (modalBtnTrackerFull) {
      modalBtnTrackerFull.style.display = appSettings.trackerAdvanced ? 'inline-flex' : 'none';
    }
    if (wrapLinkTrackerToFull) {
      wrapLinkTrackerToFull.style.display = appSettings.trackerAdvanced ? 'block' : 'none';
    }
    if (btnTrackerEditMode) {
      btnTrackerEditMode.style.display = appSettings.trackerAdvanced ? 'inline-flex' : 'none';
    }
    if (modalBtnTrackerHistoryEdit) {
      modalBtnTrackerHistoryEdit.style.display = appSettings.trackerAdvanced ? 'inline-flex' : 'none';
    }
    if (trackerNotesTabs) {
      trackerNotesTabs.querySelectorAll('.tracker-notes-tab-advanced').forEach(btn => {
        btn.style.display = appSettings.trackerAdvanced ? 'flex' : 'none';
      });
    }
    if (!appSettings.trackerAdvanced) {
      if (typeof trackerState !== 'undefined' && trackerState.mainNotesMode === 'detailed') {
        trackerState.mainNotesMode = 'simple';
        renderTrackerMainSimpleList();
      }
      if (typeof trackerState !== 'undefined' && trackerState.isEditMode) {
        trackerState.isEditMode = false;
        if (typeof updateTrackerEditModeUI === 'function') updateTrackerEditModeUI();
      }
    }

    // 4. Update Quick Mode Badges in Module Topbars
    const badgeCopingMode = document.getElementById('badge-coping-mode');
    const badgeCopingText = document.getElementById('badge-coping-mode-text');
    if (badgeCopingText) {
      badgeCopingText.textContent = appSettings.copingAdvanced ? 'Режим: Расширенный ⚡' : 'Режим: Обычный ⚙️';
    }
    if (badgeCopingMode) {
      badgeCopingMode.classList.toggle('advanced', Boolean(appSettings.copingAdvanced));
    }

    const badgeThoughtsMode = document.getElementById('badge-thoughts-mode');
    const badgeThoughtsText = document.getElementById('badge-thoughts-mode-text');
    if (badgeThoughtsText) {
      badgeThoughtsText.textContent = appSettings.thoughtsAdvanced ? 'Режим: Расширенный ⚡' : 'Режим: Обычный ⚙️';
    }
    if (badgeThoughtsMode) {
      badgeThoughtsMode.classList.toggle('advanced', Boolean(appSettings.thoughtsAdvanced));
    }

    const badgeTrackerMode = document.getElementById('badge-tracker-mode');
    const badgeTrackerText = document.getElementById('badge-tracker-mode-text');
    if (badgeTrackerText) {
      badgeTrackerText.textContent = appSettings.trackerAdvanced ? 'Режим: Расширенный ⚡' : 'Режим: Обычный ⚙️';
    }
    if (badgeTrackerMode) {
      badgeTrackerMode.classList.toggle('advanced', Boolean(appSettings.trackerAdvanced));
    }
  }

  window.applyAdvancedModesUI = applyAdvancedModesUI;

  // =========================================================================
  // ODS SPREADSHEET ENGINE (.ODS MULTI-SHEET GENERATION, PURE JS, ZERO DEP)
  // =========================================================================
  const ODS_CRC32_TABLE = (() => {
    const table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) {
        c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      }
      table[i] = c;
    }
    return table;
  })();

  function calculateOdsCrc32(bytes) {
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < bytes.length; i++) {
      crc = ODS_CRC32_TABLE[(crc ^ bytes[i]) & 0xFF] ^ (crc >>> 8);
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }

  let lastGeneratedOdsBytes = null;

  function createOdsZipArchive(files) {
    const textEncoder = new TextEncoder();
    const localHeaders = [];
    const cdHeaders = [];
    let offset = 0;

    const now = new Date();
    const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | (Math.floor(now.getSeconds() / 2));
    const dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();

    files.forEach(file => {
      const nameBytes = textEncoder.encode(file.name);
      const dataBytes = (typeof file.data === 'string') ? textEncoder.encode(file.data) : file.data;
      const crc = calculateOdsCrc32(dataBytes);
      const size = dataBytes.length;

      const isMime = file.name === 'mimetype';
      const flags = isMime ? 0 : 0x0800; // Bit 11 = UTF-8 filenames

      // Local Header: 30 bytes + filename
      const lfh = new Uint8Array(30 + nameBytes.length);
      const lfhView = new DataView(lfh.buffer);
      lfhView.setUint32(0, 0x04034B50, true);
      lfhView.setUint16(4, 20, true);
      lfhView.setUint16(6, flags, true);
      lfhView.setUint16(8, 0, true); // Stored (no compression)
      lfhView.setUint16(10, dosTime, true);
      lfhView.setUint16(12, dosDate, true);
      lfhView.setUint32(14, crc, true);
      lfhView.setUint32(18, size, true);
      lfhView.setUint32(22, size, true);
      lfhView.setUint16(26, nameBytes.length, true);
      lfhView.setUint16(28, 0, true);
      lfh.set(nameBytes, 30);

      localHeaders.push({ lfh, dataBytes });

      // Central Directory Header: 46 bytes + filename
      const cdh = new Uint8Array(46 + nameBytes.length);
      const cdhView = new DataView(cdh.buffer);
      cdhView.setUint32(0, 0x02014B50, true);
      cdhView.setUint16(4, 20, true);
      cdhView.setUint16(6, 20, true);
      cdhView.setUint16(8, flags, true);
      cdhView.setUint16(10, 0, true);
      cdhView.setUint16(12, dosTime, true);
      cdhView.setUint16(14, dosDate, true);
      cdhView.setUint32(16, crc, true);
      cdhView.setUint32(20, size, true);
      cdhView.setUint32(24, size, true);
      cdhView.setUint16(28, nameBytes.length, true);
      cdhView.setUint16(30, 0, true);
      cdhView.setUint16(32, 0, true);
      cdhView.setUint16(34, 0, true);
      cdhView.setUint16(36, 0, true);
      cdhView.setUint32(38, 0, true);
      cdhView.setUint32(42, offset, true);
      cdh.set(nameBytes, 46);

      cdHeaders.push(cdh);
      offset += lfh.length + dataBytes.length;
    });

    const cdStartOffset = offset;
    let cdTotalSize = 0;
    cdHeaders.forEach(c => cdTotalSize += c.length);

    // End of Central Directory: 22 bytes
    const eocd = new Uint8Array(22);
    const eocdView = new DataView(eocd.buffer);
    eocdView.setUint32(0, 0x06054B50, true);
    eocdView.setUint16(4, 0, true);
    eocdView.setUint16(6, 0, true);
    eocdView.setUint16(8, files.length, true);
    eocdView.setUint16(10, files.length, true);
    eocdView.setUint32(12, cdTotalSize, true);
    eocdView.setUint32(16, cdStartOffset, true);
    eocdView.setUint16(20, 0, true);

    const totalArchiveSize = offset + cdTotalSize + 22;
    const zipBytes = new Uint8Array(totalArchiveSize);
    let curPos = 0;
    localHeaders.forEach(h => {
      zipBytes.set(h.lfh, curPos);
      curPos += h.lfh.length;
      zipBytes.set(h.dataBytes, curPos);
      curPos += h.dataBytes.length;
    });
    cdHeaders.forEach(c => {
      zipBytes.set(c, curPos);
      curPos += c.length;
    });
    zipBytes.set(eocd, curPos);

    lastGeneratedOdsBytes = zipBytes;
    return new Blob([zipBytes], { type: 'application/vnd.oasis.opendocument.spreadsheet' });
  }

  function escapeOdsXml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  function buildOdsTableXml(name, rows) {
    let xml = `<table:table table:name="${escapeOdsXml(name)}">`;
    rows.forEach(row => {
      xml += '<table:table-row>';
      row.forEach(cell => {
        xml += `<table:table-cell office:value-type="string"><text:p>${escapeOdsXml(cell)}</text:p></table:table-cell>`;
      });
      xml += '</table:table-row>';
    });
    xml += '</table:table>';
    return xml;
  }

  function generateAllModulesOdsBlob() {
    const { szondiList, copingList, favSet, thoughtsList, trackerList, diarySections, diaryNotes } = getUserExportDatasets();

    // 1. Sheet «Мысли»
    const thoughtsRows = [
      ['№', 'Дата и время', 'Формат', 'Мысль', 'Ситуация / Триггер', 'Ведущая эмоция', 'Интенсивность (%)', 'Когнитивная ловушка', 'Рациональный ответ КПТ']
    ];
    thoughtsList.forEach((rec, idx) => {
      let thoughtTs = rec.date;
      if (!thoughtTs && rec.id && /^thought-\d+$/.test(rec.id)) {
        const ts = parseInt(rec.id.replace('thought-', ''), 10);
        if (!isNaN(ts) && ts > 0) thoughtTs = new Date(ts).toISOString();
      }
      const thoughtDate = formatExportDateTime(thoughtTs);
      const isSimple = Boolean(rec.isSimple || !rec.rationalResponse);
      const emotionObj = (typeof THOUGHT_EMOTIONS !== 'undefined')
        ? THOUGHT_EMOTIONS.find(e => e.id === rec.emotion) || { name: rec.emotion || 'Эмоция' }
        : { name: rec.emotion || 'Эмоция' };
      const distortionObj = (typeof THOUGHT_DISTORTIONS !== 'undefined')
        ? THOUGHT_DISTORTIONS.find(d => d.id === rec.distortion) || { name: rec.distortion || '' }
        : { name: rec.distortion || '' };

      thoughtsRows.push([
        String(idx + 1),
        thoughtDate,
        isSimple ? 'Простая мысль' : 'Полный разбор КПТ',
        rec.automaticThought || '',
        rec.situation || '',
        rec.emotion ? (emotionObj.name || '') : 'Не указана',
        (rec.emotion && rec.emotionIntensityBefore !== null && rec.emotionIntensityBefore !== undefined) ? String(rec.emotionIntensityBefore) : '',
        distortionObj.name || '',
        rec.rationalResponse || ''
      ]);
    });
    const thoughtsTableXml = buildOdsTableXml('Мысли', thoughtsRows);

    // 2. Sheet «Трекер»
    const trackerRows = [
      ['№', 'Дата и время', 'Состояние', 'Интенсивность (1-10)', 'Эмоция / Самочувствие', 'После чего / Причина', 'Влияющие факторы']
    ];
    trackerList.forEach((entry, idx) => {
      const entryDate = formatExportDateTime(entry.timestamp || entry.date);
      const isBetter = entry.entryType === 'better';
      const score = entry.intensity || (isBetter ? (entry.happiness || 8) : (entry.stress || 8));
      const moodsStr = Array.isArray(entry.moods) && entry.moods.length > 0 ? entry.moods.join(', ') : (entry.mood || '');
      const factorsStr = Array.isArray(entry.factors) && entry.factors.length > 0 ? entry.factors.join(', ') : '';

      trackerRows.push([
        String(idx + 1),
        entryDate,
        isBetter ? 'Когда лучше (Ресурс)' : 'Когда хуже (Спад)',
        String(score),
        moodsStr,
        entry.cause || entry.note || '',
        factorsStr
      ]);
    });
    const trackerTableXml = buildOdsTableXml('Трекер', trackerRows);

    // 3. Sheet «Карточки»
    const copingRows = [
      ['№', 'Дата и время ввода', 'Категория', 'Поддерживающая мысль', 'Заземляющее действие', 'В избранном']
    ];
    copingList.forEach((card, idx) => {
      let cardDate = '';
      if (card.createdAt) cardDate = formatExportDateTime(card.createdAt);
      else if (card.id && card.id.startsWith('custom-')) {
        const ts = parseInt(card.id.replace('custom-', ''), 10);
        if (!isNaN(ts) && ts > 0) cardDate = formatExportDateTime(ts);
      }
      copingRows.push([
        String(idx + 1),
        cardDate,
        card.categoryName || card.category || 'Копинг',
        card.statement || '',
        card.action || '',
        favSet.has(card.id) ? 'Да' : 'Нет'
      ]);
    });
    const copingTableXml = buildOdsTableXml('Карточки', copingRows);

    // 4. Sheet «Сонди»
    const szondiRows = [
      ['№', 'Дата и время', 'Режим исследования', 'Формула влечений', 'Профиль 1-го плана', 'Профиль 2-го плана', 'Заметка']
    ];
    szondiList.forEach((item, idx) => {
      const testDate = item.dateStr || formatExportDateTime(item.timestamp || item.date);
      let p1 = '';
      if (item.firstPlanScores) {
        const s = item.firstPlanScores;
        p1 = `h(+${s['h+']||0}/-${s['h-']||0}) s(+${s['s+']||0}/-${s['s-']||0}) e(+${s['e+']||0}/-${s['e-']||0}) hy(+${s['hy+']||0}/-${s['hy-']||0}) k(+${s['k+']||0}/-${s['k-']||0}) p(+${s['p+']||0}/-${s['p-']||0}) d(+${s['d+']||0}/-${s['d-']||0}) m(+${s['m+']||0}/-${s['m-']||0})`;
      }
      let p2 = '';
      if (item.secondPlanScores) {
        const s2 = item.secondPlanScores;
        p2 = `h(+${s2['h+']||0}/-${s2['h-']||0}) s(+${s2['s+']||0}/-${s2['s-']||0}) e(+${s2['e+']||0}/-${s2['e-']||0}) hy(+${s2['hy+']||0}/-${s2['hy-']||0}) k(+${s2['k+']||0}/-${s2['k-']||0}) p(+${s2['p+']||0}/-${s2['p-']||0}) d(+${s2['d+']||0}/-${s2['d-']||0}) m(+${s2['m+']||0}/-${s2['m-']||0})`;
      }
      szondiRows.push([
        String(idx + 1),
        testDate,
        item.exploreSecondPlan ? 'Полное (1-й и 2-й планы)' : 'Классический (1-й план)',
        item.formula || '',
        p1,
        p2,
        item.note || ''
      ]);
    });
    const szondiTableXml = buildOdsTableXml('Сонди', szondiRows);

    // 5. Sheet «Личный дневник»
    const diaryRows = [
      ['№', 'Тип', 'Раздел', 'Заголовок', 'Создано', 'Обновлено', 'Содержимое']
    ];
    const diarySectionMap = new Map((diarySections || []).map(sec => [sec.id, sec.title || 'Без названия']));
    (diaryNotes || []).slice().sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0)).forEach((note, idx) => {
      const isDiary = note.kind === 'diary';
      const sectionTitle = isDiary ? 'Дневник' : (diarySectionMap.get(note.sectionId) || 'Без раздела');
      const typeLabel = isDiary ? 'Запись дневника' : (note.type === 'list' ? 'Список задач' : (note.type === 'bullets' ? 'Список пунктов' : 'Заметка'));
      diaryRows.push([
        String(idx + 1),
        typeLabel,
        sectionTitle,
        note.title || 'Без названия',
        formatExportDateTime(note.createdAt),
        formatExportDateTime(note.updatedAt),
        note.content || ''
      ]);
    });
    const diaryTableXml = buildOdsTableXml('Личный дневник', diaryRows);

    const manifestXml = `<?xml version="1.0" encoding="UTF-8"?>
<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0" manifest:version="1.2">
  <manifest:file-entry manifest:full-path="/" manifest:version="1.2" manifest:media-type="application/vnd.oasis.opendocument.spreadsheet"/>
  <manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/>
  <manifest:file-entry manifest:full-path="styles.xml" manifest:media-type="text/xml"/>
  <manifest:file-entry manifest:full-path="meta.xml" manifest:media-type="text/xml"/>
</manifest:manifest>`;

    const metaXml = `<?xml version="1.0" encoding="UTF-8"?>
<office:document-meta xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:meta="urn:oasis:names:tc:opendocument:xmlns:meta:1.0" xmlns:dc="http://purl.org/dc/elements/1.1/" office:version="1.2">
  <office:meta>
    <dc:title>Данные пользователя — Карманный психолог</dc:title>
    <meta:generator>PocketPsychologist</meta:generator>
  </office:meta>
</office:document-meta>`;

    const stylesXml = `<?xml version="1.0" encoding="UTF-8"?>
<office:document-styles xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0" office:version="1.2"/>`;

    const contentXml = `<?xml version="1.0" encoding="UTF-8"?>
<office:document-content xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0" xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0" xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0" office:version="1.2">
  <office:body>
    <office:spreadsheet>
${thoughtsTableXml}
${trackerTableXml}
${copingTableXml}
${szondiTableXml}
${diaryTableXml}
    </office:spreadsheet>
  </office:body>
</office:document-content>`;

    const files = [
      { name: 'mimetype', data: 'application/vnd.oasis.opendocument.spreadsheet' },
      { name: 'META-INF/manifest.xml', data: manifestXml },
      { name: 'meta.xml', data: metaXml },
      { name: 'styles.xml', data: stylesXml },
      { name: 'content.xml', data: contentXml }
    ];

    return createOdsZipArchive(files);
  }

  async function exportAllDataToOds() {
    try {
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      const filename = `PocketPsychologist_data_${yyyy}-${mm}-${dd}.ods`;

      // 1. Android Native App Bridge (Intent Chooser: Telegram, WhatsApp, Email, etc.)
      if (window.AndroidBridge && typeof window.AndroidBridge.shareOds === 'function') {
        const base64 = generateAllModulesOdsBase64();
        window.AndroidBridge.shareOds(base64, filename);
        showTrackerToast('📊 Выберите приложение для отправки таблицы .ods');
        return;
      }

      const blob = generateAllModulesOdsBlob();

      // 2. Web Share API with File (Mobile Chrome, Safari, Edge)
      if (typeof navigator !== 'undefined' && navigator.canShare && typeof File !== 'undefined') {
        try {
          const file = new File([blob], filename, {
            type: 'application/vnd.oasis.opendocument.spreadsheet'
          });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: 'Карманный психолог — Данные (.ods)',
              text: 'Электронная таблица с данными модулей приложения «Карманный психолог» (.ods)'
            });
            showTrackerToast('📊 Таблица .ods отправлена!');
            return;
          }
        } catch (shareErr) {
          if (shareErr.name === 'AbortError') {
            return; // User cancelled share sheet
          }
          console.warn('Web Share API error:', shareErr);
        }
      }

      // 3. Desktop Browser Download Fallback
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 500);

      showTrackerToast('📊 Таблица .ODS выгружена');
    } catch (err) {
      console.error('ODS export error:', err);
      showTrackerToast('Ошибка при выгрузке таблицы .ods');
    }
  }

  function generateAllModulesOdsBase64() {
    generateAllModulesOdsBlob();
    if (!lastGeneratedOdsBytes) return '';
    let binary = '';
    const len = lastGeneratedOdsBytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(lastGeneratedOdsBytes[i]);
    }
    return btoa(binary);
  }

  window.exportAllDataToOds = exportAllDataToOds;
  window.generateAllModulesOdsBlob = generateAllModulesOdsBlob;
  window.generateAllModulesOdsBase64 = generateAllModulesOdsBase64;

  // =========================================================================
  // APPLICATION SETTINGS CONTROLLER (HUB SCREEN MODAL & TOGGLES)
  // =========================================================================
  function initAppSettingsController() {
    const btnHubSettings = document.getElementById('btn-hub-open-settings');
    const modalSettings = document.getElementById('modal-app-settings');
    const btnSettingsClose = document.getElementById('modal-btn-settings-close');
    const btnSettingsCloseX = document.getElementById('modal-btn-settings-close-x');
    const btnExportOds = document.getElementById('btn-settings-export-ods');
    const btnModalExportOds = document.getElementById('btn-export-download-ods');
    const btnOpenTxtExport = document.getElementById('btn-settings-open-txt-export');

    const toggleAdvCoping = document.getElementById('toggle-adv-coping');
    const toggleAdvThoughts = document.getElementById('toggle-adv-thoughts');
    const toggleAdvTracker = document.getElementById('toggle-adv-tracker');
    const statsRow = document.getElementById('settings-export-stats-row');
    const modulesList = document.getElementById('settings-modules-list');
    const defaultModuleSelect = document.getElementById('settings-default-module');

    function renderModuleSettings() {
      if (!modulesList || typeof APP_MODULES === 'undefined') return;
      modulesList.innerHTML = APP_MODULES.map(mod => `
        <label class="settings-module-row">
          <span class="settings-module-main">
            <span class="settings-module-icon">${(typeof uiIcon === 'function' && uiIcon(mod.id, 18)) || mod.icon}</span>
            <span class="settings-module-name">${escapeHtml(mod.shortTitle || mod.title)}<span class="settings-module-number">№${mod.number}</span></span>
          </span>
          <span class="app-switch" style="position: relative; display: inline-block; width: 44px; height: 24px; flex-shrink: 0;">
            <input type="checkbox" data-module-toggle="${mod.id}" ${isModuleEnabled(mod.id) ? 'checked' : ''} style="opacity: 0; width: 0; height: 0;">
            <span class="app-switch-slider"></span>
          </span>
        </label>
      `).join('');
      modulesList.querySelectorAll('[data-module-toggle]').forEach(cb => {
        cb.addEventListener('change', () => {
          const id = cb.getAttribute('data-module-toggle');
          if (cb.checked) appSettings.disabledModules.delete(id);
          else appSettings.disabledModules.add(id);
          if (!isModuleEnabled(appSettings.defaultModule)) appSettings.defaultModule = 'hub';
          saveModuleSettings();
          renderModuleSettings();
          applyModuleVisibility();
          showTrackerToast(cb.checked ? `Модуль «${APP_MODULES.find(m => m.id === id)?.shortTitle || id}» включён` : `Модуль «${APP_MODULES.find(m => m.id === id)?.shortTitle || id}» скрыт`);
        });
      });

      if (defaultModuleSelect) {
        const enabled = APP_MODULES.filter(mod => isModuleEnabled(mod.id));
        if (!enabled.some(mod => mod.id === appSettings.defaultModule)) appSettings.defaultModule = 'hub';
        defaultModuleSelect.innerHTML = '<option value="hub">🏠 Главная (меню модулей)</option>' +
          enabled.map(mod => `<option value="${mod.id}">${mod.icon || ''} ${escapeHtml(mod.shortTitle || mod.title)}</option>`).join('');
        defaultModuleSelect.value = appSettings.defaultModule;
      }
    }

    function updateSettingsStats() {
      if (!statsRow) return;
      const { szondiList, copingList, thoughtsList, trackerList, diaryNotes } = getUserExportDatasets();
      statsRow.innerHTML = `
        <span style="font-size: 11px; padding: 3px 8px; border-radius: 6px; background: rgba(47, 74, 59, 0.12); color: #2F4A3B; border: 1px solid rgba(47, 74, 59, 0.25);">💭 Мысли: ${thoughtsList.length}</span>
        <span style="font-size: 11px; padding: 3px 8px; border-radius: 6px; background: rgba(79, 107, 87, 0.12); color: #4F6B57; border: 1px solid rgba(79, 107, 87, 0.25);">📊 Трекер: ${trackerList.length}</span>
        <span style="font-size: 11px; padding: 3px 8px; border-radius: 6px; background: rgba(176, 137, 90, 0.12); color: #B0895A; border: 1px solid rgba(176, 137, 90, 0.25);">🎴 Карточки: ${copingList.length}</span>
        <span style="font-size: 11px; padding: 3px 8px; border-radius: 6px; background: rgba(140, 123, 104, 0.12); color: #8C7B68; border: 1px solid rgba(140, 123, 104, 0.25);">🧬 Сонди: ${szondiList.length}</span>
        <span style="font-size: 11px; padding: 3px 8px; border-radius: 6px; background: rgba(176, 137, 90, 0.12); color: #B0895A; border: 1px solid rgba(176, 137, 90, 0.25);">📔 Дневник: ${diaryNotes.length}</span>
      `;
    }

    function openSettingsModal() {
      if (!modalSettings) return;
      if (toggleAdvCoping) toggleAdvCoping.checked = Boolean(appSettings.copingAdvanced);
      if (toggleAdvThoughts) toggleAdvThoughts.checked = Boolean(appSettings.thoughtsAdvanced);
      if (toggleAdvTracker) toggleAdvTracker.checked = Boolean(appSettings.trackerAdvanced);
      updateSettingsStats();
      renderModuleSettings();
      resetModalScroll(modalSettings);
      setPageFullscreen(modalSettings, true);
      setNavPageActive('btn-bottom-nav-settings');
      modalSettings.classList.add('active');
      modalSettings.setAttribute('aria-hidden', 'false');
    }

    function closeSettingsModal(goHome = true) {
      if (modalSettings) {
        setPageFullscreen(modalSettings, false);
        modalSettings.classList.remove('active');
        modalSettings.setAttribute('aria-hidden', 'true');
      }
      // Return to the screen that was open before Options, without a screen jump.
      if (goHome) restorePageNav();
    }

    window.openSettingsModal = openSettingsModal;

    if (defaultModuleSelect) {
      defaultModuleSelect.addEventListener('change', () => {
        appSettings.defaultModule = defaultModuleSelect.value || 'hub';
        if (!isModuleEnabled(appSettings.defaultModule)) appSettings.defaultModule = 'hub';
        saveModuleSettings();
        defaultModuleSelect.value = appSettings.defaultModule;
        showTrackerToast('Стартовый экран сохранён');
      });
    }

    document.querySelectorAll('.nav-tab-item').forEach(tab => {
      tab.addEventListener('click', () => {
        if (!modalSettings || !modalSettings.classList.contains('active')) return;
        if (tab.id === 'btn-bottom-nav-settings') return;
        closeSettingsModal(false);
      }, true);
    });

    if (btnHubSettings) btnHubSettings.addEventListener('click', openSettingsModal);
    if (btnSettingsClose) btnSettingsClose.addEventListener('click', closeSettingsModal);
    if (btnSettingsCloseX) btnSettingsCloseX.addEventListener('click', closeSettingsModal);
    if (modalSettings) {
      modalSettings.addEventListener('click', (e) => {
        if (e.target === modalSettings) closeSettingsModal();
      });
    }

    // Attach to all .btn-open-settings elements (bottom nav, module headers, mode badges)
    document.querySelectorAll('.btn-open-settings').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openSettingsModal();
      });
    });

    if (toggleAdvCoping) {
      toggleAdvCoping.checked = Boolean(appSettings.copingAdvanced);
      toggleAdvCoping.addEventListener('change', () => {
        appSettings.copingAdvanced = toggleAdvCoping.checked;
        localStorage.setItem('kp_advanced_mode_coping', String(appSettings.copingAdvanced));
        applyAdvancedModesUI();
        showTrackerToast(appSettings.copingAdvanced ? 'Включён расширенный режим «Карточек»' : 'Включён обычный режим «Карточек»');
      });
    }

    if (toggleAdvThoughts) {
      toggleAdvThoughts.checked = Boolean(appSettings.thoughtsAdvanced);
      toggleAdvThoughts.addEventListener('change', () => {
        appSettings.thoughtsAdvanced = toggleAdvThoughts.checked;
        localStorage.setItem('kp_advanced_mode_thoughts', String(appSettings.thoughtsAdvanced));
        applyAdvancedModesUI();
        showTrackerToast(appSettings.thoughtsAdvanced ? 'Включён расширенный режим «Мыслей»' : 'Включён обычный режим «Мыслей»');
      });
    }

    if (toggleAdvTracker) {
      toggleAdvTracker.checked = Boolean(appSettings.trackerAdvanced);
      toggleAdvTracker.addEventListener('change', () => {
        appSettings.trackerAdvanced = toggleAdvTracker.checked;
        localStorage.setItem('kp_advanced_mode_tracker', String(appSettings.trackerAdvanced));
        applyAdvancedModesUI();
        showTrackerToast(appSettings.trackerAdvanced ? 'Включён расширенный режим «Трекера»' : 'Включён обычный режим «Трекера»');
      });
    }

    if (btnExportOds) btnExportOds.addEventListener('click', exportAllDataToOds);
    if (btnModalExportOds) btnModalExportOds.addEventListener('click', exportAllDataToOds);

    if (btnOpenTxtExport) {
      btnOpenTxtExport.addEventListener('click', () => {
        // This is a sub-action, not closing the Options menu to leave it.
        closeSettingsModal(false);
        if (typeof openExportDataModal === 'function') openExportDataModal();
      });
    }
  }

  window.openExportDataModal = openExportDataModal;

  // =========================================================================
  // EMERGENCY SELF-HELP & LEGAL MODALS CONTROLLER
  // =========================================================================

  function setupSosEmergencyPicker() {
    const modalSos = document.getElementById('modal-sos-emergency-picker');
    const btnBottomNavSos = document.getElementById('btn-bottom-nav-sos');
    const btnSosCloseX = document.getElementById('modal-btn-sos-close-x');
    const btnSosClose = document.getElementById('modal-btn-sos-close');
    const btnPickBreathe = document.getElementById('btn-sos-select-breathing');
    const btnPickGround = document.getElementById('btn-sos-select-grounding');
    const btnPickWhitenoise = document.getElementById('btn-sos-select-whitenoise');

    function openSosEmergencyModal() {
      if (!modalSos) return;
      resetModalScroll(modalSos);
      setPageFullscreen(modalSos, true);
      setNavPageActive('btn-bottom-nav-sos');
      modalSos.classList.add('active');
      modalSos.setAttribute('aria-hidden', 'false');
    }

    function closeSosEmergencyModal(goHome = true) {
      if (modalSos) {
        setPageFullscreen(modalSos, false);
        modalSos.classList.remove('active');
        modalSos.setAttribute('aria-hidden', 'true');
      }
      // Return to the screen that was open before Help, without a screen jump.
      if (goHome) restorePageNav();
    }

    window.openSosEmergencyModal = openSosEmergencyModal;
    window.closeSosEmergencyModal = closeSosEmergencyModal;

    document.querySelectorAll('.nav-tab-item').forEach(tab => {
      tab.addEventListener('click', () => {
        if (!modalSos || !modalSos.classList.contains('active')) return;
        if (tab.id === 'btn-bottom-nav-sos') return;
        closeSosEmergencyModal(false);
      }, true);
    });

    if (btnBottomNavSos) {
      btnBottomNavSos.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openSosEmergencyModal();
      });
    }

    if (btnSosCloseX) btnSosCloseX.addEventListener('click', closeSosEmergencyModal);
    if (btnSosClose) btnSosClose.addEventListener('click', closeSosEmergencyModal);
    if (modalSos) {
      modalSos.addEventListener('click', (e) => {
        if (e.target === modalSos) closeSosEmergencyModal();
      });
    }

    if (btnPickBreathe) {
      btnPickBreathe.addEventListener('click', () => {
        closeSosEmergencyModal(false);
        navigateTo('breathing');
      });
    }

    if (btnPickGround) {
      btnPickGround.addEventListener('click', () => {
        closeSosEmergencyModal(false);
        navigateTo('grounding');
      });
    }

    if (btnPickWhitenoise) {
      btnPickWhitenoise.addEventListener('click', () => {
        closeSosEmergencyModal(false);
        navigateTo('whitenoise');
      });
    }
  }

  function setupLegalModalsController() {
    const modalPrivacy = document.getElementById('modal-privacy-policy');
    const modalTerms = document.getElementById('modal-terms-of-use');
    const btnOpenPrivacy = document.getElementById('btn-open-privacy-policy');
    const btnOpenTerms = document.getElementById('btn-open-terms-of-use');
    const btnPrivacyClose = document.getElementById('modal-btn-privacy-close');
    const btnPrivacyCloseX = document.getElementById('modal-btn-privacy-close-x');
    const btnTermsClose = document.getElementById('modal-btn-terms-close');
    const btnTermsCloseX = document.getElementById('modal-btn-terms-close-x');

    function openPrivacyPolicyModal() {
      if (!modalPrivacy) return;
      if (modalTerms) {
        modalTerms.classList.remove('active');
        modalTerms.setAttribute('aria-hidden', 'true');
      }
      resetModalScroll(modalPrivacy);
      const body = modalPrivacy.querySelector('.legal-scroll-body');
      if (body) body.scrollTop = 0;
      modalPrivacy.classList.add('active');
      modalPrivacy.setAttribute('aria-hidden', 'false');
    }

    function closePrivacyPolicyModal() {
      if (!modalPrivacy) return;
      modalPrivacy.classList.remove('active');
      modalPrivacy.setAttribute('aria-hidden', 'true');
    }

    function openTermsOfUseModal() {
      if (!modalTerms) return;
      if (modalPrivacy) {
        modalPrivacy.classList.remove('active');
        modalPrivacy.setAttribute('aria-hidden', 'true');
      }
      resetModalScroll(modalTerms);
      const body = modalTerms.querySelector('.legal-scroll-body');
      if (body) body.scrollTop = 0;
      modalTerms.classList.add('active');
      modalTerms.setAttribute('aria-hidden', 'false');
    }

    function closeTermsOfUseModal() {
      if (!modalTerms) return;
      modalTerms.classList.remove('active');
      modalTerms.setAttribute('aria-hidden', 'true');
    }

    window.openPrivacyPolicyModal = openPrivacyPolicyModal;
    window.closePrivacyPolicyModal = closePrivacyPolicyModal;
    window.openTermsOfUseModal = openTermsOfUseModal;
    window.closeTermsOfUseModal = closeTermsOfUseModal;

    if (btnOpenPrivacy) btnOpenPrivacy.addEventListener('click', openPrivacyPolicyModal);
    if (btnPrivacyClose) btnPrivacyClose.addEventListener('click', closePrivacyPolicyModal);
    if (btnPrivacyCloseX) btnPrivacyCloseX.addEventListener('click', closePrivacyPolicyModal);
    if (modalPrivacy) {
      modalPrivacy.addEventListener('click', (e) => {
        if (e.target === modalPrivacy) closePrivacyPolicyModal();
      });
    }

    if (btnOpenTerms) btnOpenTerms.addEventListener('click', openTermsOfUseModal);
    if (btnTermsClose) btnTermsClose.addEventListener('click', closeTermsOfUseModal);
    if (btnTermsCloseX) btnTermsCloseX.addEventListener('click', closeTermsOfUseModal);
    if (modalTerms) {
      modalTerms.addEventListener('click', (e) => {
        if (e.target === modalTerms) closeTermsOfUseModal();
      });
    }
  }

  // Initial startup: show Hub screen
  window.navigateTo = navigateTo;
  try {
    setupExportDataController();
  } catch (err) {
    console.error('setupExportDataController ERROR:', err);
  }
  try {
    initAppSettingsController();
  } catch (err) {
    console.error('initAppSettingsController ERROR:', err);
  }
  try {
    setupSosEmergencyPicker();
  } catch (err) {
    console.error('setupSosEmergencyPicker ERROR:', err);
  }
  try {
    setupLegalModalsController();
  } catch (err) {
    console.error('setupLegalModalsController ERROR:', err);
  }
  try {
    applyAdvancedModesUI();
  } catch (err) {
    console.error('applyAdvancedModesUI ERROR:', err);
  }
  try {
    renderHubModules();
  } catch (err) {
    console.error('renderHubModules ERROR:', err);
  }
  enhanceAllRangeSliders();

  function enhanceAllRangeSliders() {
    try {
      const sliders = document.querySelectorAll('input[type="range"]');
      sliders.forEach(slider => {
        if (slider.dataset.enhancedTouchHitbox) return;
        slider.dataset.enhancedTouchHitbox = 'true';
        slider.addEventListener('input', () => {
          if (navigator.vibrate) {
            try { navigator.vibrate(8); } catch(e) {}
          }
        }, { passive: true });
      });
    } catch(e) {}
  }

  // -----------------------------------------------------------------------
  // Keyboard visibility: keep the focused field above the on-screen keyboard
  // -----------------------------------------------------------------------
  function setupKeyboardVisibilitySupport() {
    const isTextField = (el) => {
      if (!el) return false;
      if (el.tagName === 'TEXTAREA') return true;
      if (el.tagName !== 'INPUT') return false;
      return ['text', 'search', 'email', 'url', 'tel', 'password', 'number'].includes((el.type || '').toLowerCase());
    };

    const bringIntoView = (el) => {
      if (!isTextField(el)) return;
      try {
        const rect = el.getBoundingClientRect();
        const vv = window.visualViewport;
        const viewportTop = vv ? vv.offsetTop : 0;
        const viewportHeight = vv ? vv.height : window.innerHeight;
        const safeBottom = viewportTop + viewportHeight - 24;
        const safeTop = viewportTop + 70;
        if (rect.bottom > safeBottom || rect.top < safeTop) {
          el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' });
        }
      } catch (e) {}
    };

    document.addEventListener('focusin', (e) => {
      if (!isTextField(e.target)) return;
      setTimeout(() => bringIntoView(e.target), 320);
    });

    if (window.visualViewport) {
      let resizeTimer = null;
      window.visualViewport.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          const el = document.activeElement;
          if (isTextField(el)) bringIntoView(el);
        }, 260);
      }, { passive: true });
    }
  }

  // -----------------------------------------------------------------------
  // Android hardware Back: close the top modal / leave a subview first.
  // The Activity calls this function from onBackPressed(); only the literal
  // "exit" result lets Android minimize the app.
  // -----------------------------------------------------------------------
  function getTopActiveModal() {
    const modals = Array.from(document.querySelectorAll('.modal-overlay.active'))
      .filter(m => getComputedStyle(m).display !== 'none');
    if (modals.length === 0) return null;
    const allModals = Array.from(document.querySelectorAll('.modal-overlay'));
    return modals.sort((a, b) => {
      const za = parseInt(getComputedStyle(a).zIndex, 10) || 9999;
      const zb = parseInt(getComputedStyle(b).zIndex, 10) || 9999;
      if (za !== zb) return za - zb;
      return allModals.indexOf(a) - allModals.indexOf(b);
    }).pop();
  }

  function closeTopActiveModal(modal) {
    if (!modal) return false;
    const closeBtn = modal.querySelector('[id$="-close-x"]')
      || modal.querySelector('.tracker-modal-close-btn')
      || modal.querySelector('[id$="-close"]')
      || modal.querySelector('[id$="-cancel"]')
      || modal.querySelector('#modal-btn-cancel');
    if (closeBtn) {
      closeBtn.click();
    } else {
      modal.classList.remove('active');
      modal.setAttribute('aria-hidden', 'true');
    }
    return true;
  }

  window.handleAndroidBack = function() {
    const topModal = getTopActiveModal();
    if (topModal) {
      // "Опции" is a top-level menu: from here Back may minimize the app.
      if (topModal.id === 'modal-app-settings') return 'exit';
      closeTopActiveModal(topModal);
      return 'handled';
    }

    const activeScreen = document.querySelector('.screen.active');
    if (activeScreen && activeScreen.id === 'screen-diary' && typeof window.handleDiaryBack === 'function' && window.handleDiaryBack()) {
      return 'handled';
    }
    if (!activeScreen || activeScreen.id === 'screen-hub') return 'exit';

    // Subviews inside the Szondi module go back to its welcome screen.
    if (['screen-test', 'screen-results', 'screen-history'].includes(activeScreen.id)) {
      navigateTo('szondi');
      return 'handled';
    }

    // Module root screens and "О специалисте" behave like top-level menus:
    // here the Back button may minimize the app, as requested.
    return 'exit';
  };

  setupKeyboardVisibilitySupport();
  try {
    applyModuleVisibility();
  } catch (err) {
    console.error('applyModuleVisibility ERROR:', err);
  }
  navigateTo(getStartupModule());
  } catch (err) {
    console.error('DOMContentLoaded ERROR:', err);
    window.__err = err.stack || err.message;
  }
});