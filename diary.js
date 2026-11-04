/* =========================================================================
   ЛИЧНЫЙ ДНЕВНИК — быстрые заметки + хронологический дневник.
   Данные хранятся только локально в localStorage.
   ========================================================================= */
(function() {
  'use strict';

  const STORAGE_KEY = 'pocket_psy_diary_v1';
  const DEFAULT_LAUNCH = 'home';
  const SECTION_ICONS = ['📔', '✅', '💡', '❤️', '💼', '🌿', '✨', '🎯'];
  const state = {
    data: null,
    activeSectionId: null,
    view: 'home',
    editingId: null,
    query: '',
    historyQuery: '',
    preview: false,
    sectionEditId: null,
    sectionIcon: '📔',
    saveTimer: null,
    initialized: false,
    pendingFocus: false,
    pendingHistory: false,
    sessionId: null,
    linePrefix: null,
    linePrefixSuppressed: false
  };
  let els = {};

  const $ = (id) => document.getElementById(id);
  const uid = () => (window.crypto && typeof window.crypto.randomUUID === 'function')
    ? window.crypto.randomUUID()
    : `d-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const PAGE_SESSION_ID = uid();
  const nowIso = () => new Date().toISOString();

  function defaultData() {
    return {
      version: 2,
      sections: [
        { id: uid(), title: 'Личное', icon: '📔', createdAt: nowIso() },
        { id: uid(), title: 'Планы', icon: '✅', createdAt: nowIso() }
      ],
      notes: [],
      settings: { launchMode: DEFAULT_LAUNCH },
      activeSectionId: null
    };
  }

  function load() {
    let data = null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) data = JSON.parse(raw);
    } catch (e) {}
    if (!data || typeof data !== 'object') data = defaultData();
    if (!Array.isArray(data.sections) || data.sections.length === 0) data.sections = defaultData().sections;
    if (!Array.isArray(data.notes)) data.notes = [];
    data.sections = data.sections.map(s => ({
      id: s.id || uid(),
      title: String(s.title || 'Без названия'),
      icon: s.icon || '📔',
      createdAt: s.createdAt || nowIso()
    }));
    data.notes = data.notes.map(n => ({
      id: n.id || uid(),
      kind: n.kind === 'diary' ? 'diary' : 'note',
      sectionId: data.sections.some(s => s.id === n.sectionId) ? n.sectionId : data.sections[0].id,
      title: typeof n.title === 'string' ? n.title : '',
      content: typeof n.content === 'string' ? n.content : '',
      type: n.type === 'list' ? 'list' : (n.type === 'bullets' ? 'bullets' : 'entry'),
      pinned: Boolean(n.pinned),
      sessionId: n.sessionId || null,
      isDraft: false,
      createdAt: n.createdAt || nowIso(),
      updatedAt: n.updatedAt || n.createdAt || nowIso()
    }));
    // Never keep empty notes or empty general-diary entries.
    data.notes = data.notes.filter(n => isMeaningfulItem(n));
    data.settings = Object.assign({ launchMode: DEFAULT_LAUNCH }, data.settings || {});
    if (!['new-note', 'history', 'new-diary', 'home'].includes(data.settings.launchMode)) {
      data.settings.launchMode = DEFAULT_LAUNCH;
    }
    try {
      if (!localStorage.getItem('kp_diary_launch_home_v1')) {
        if (data.settings.launchMode === 'new-note') data.settings.launchMode = 'home';
        localStorage.setItem('kp_diary_launch_home_v1', '1');
      }
    } catch (e) {}
    data.version = 2;
    if (!data.sections.some(s => s.id === data.activeSectionId)) {
      data.activeSectionId = data.sections[0].id;
    }
    return data;
  }

  function isMeaningfulContent(value) {
    return String(value || '').split('\n').map(line =>
      line.replace(/^\s*(?:[•*\-–—]|\d+[.)])\s*/, '')
    ).join('').trim().length > 0;
  }

  function isMeaningfulItem(item) {
    if (!item) return false;
    if (item.kind === 'diary') return isMeaningfulContent(item.content);
    return isMeaningfulContent(item.content) || String(item.title || '').trim().length > 0;
  }

  function save() {
    try {
      const payload = Object.assign({}, state.data, {
        notes: (state.data.notes || []).filter(n => !n.isDraft)
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      setSaveStatus('Не удалось сохранить');
    }
  }

  function sectionById(id) {
    return state.data.sections.find(s => s.id === id) || state.data.sections[0];
  }

  function itemById(id) {
    return state.data.notes.find(n => n.id === id) || null;
  }

  function activeSection() {
    return sectionById(state.activeSectionId);
  }

  function setSaveStatus(text) {
    if (els.saveStatus) els.saveStatus.textContent = text;
  }

  function formatDateTime(iso) {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) +
      ', ' + d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  }

  function formatShortDate(iso) {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    const today = new Date();
    if (d.toDateString() === today.toDateString()) {
      return 'Сегодня, ' + d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) + ', ' +
      d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  }

  function diaryTitle(date) {
    const d = date ? new Date(date) : new Date();
    return 'Дневник • ' + d.toLocaleDateString('ru-RU', {
      day: 'numeric', month: 'long', year: 'numeric'
    }) + ', ' + d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  }

  function plainText(content) {
    return String(content || '')
      .replace(/^#{1,3}\s+/gm, '')
      .replace(/^\s*[-*]\s+\[[ xX]\]\s*/gm, '')
      .replace(/^\s*[•*-]\s+/gm, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function taskStats(content) {
    let total = 0;
    let done = 0;
    String(content || '').split('\n').forEach(line => {
      const m = line.match(/^\s*[-*]\s+\[([ xX])\]\s+(.*)$/);
      if (m) { total += 1; if (m[1].toLowerCase() === 'x') done += 1; }
    });
    return { total, done };
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function inlineMarkdown(text) {
    let out = escapeHtml(text);
    out = out.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    out = out.replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');
    return out;
  }

  function renderPreview(content) {
    if (!els.preview) return;
    const lines = String(content || '').split('\n');
    let html = '';
    lines.forEach((line, index) => {
      const task = line.match(/^\s*[-*]\s+\[([ xX])\]\s+(.*)$/);
      if (task) {
        const checked = task[1].toLowerCase() === 'x';
        html += `<label class="diary-preview-task ${checked ? 'done' : ''}">
          <input type="checkbox" data-diary-task-line="${index}" ${checked ? 'checked' : ''}>
          <span>${inlineMarkdown(task[2])}</span>
        </label>`;
        return;
      }
      const heading = line.match(/^(#{1,3})\s+(.*)$/);
      if (heading) {
        const level = Math.min(3, heading[1].length) + 2;
        html += `<h${level}>${inlineMarkdown(heading[2])}</h${level}>`;
        return;
      }
      const bullet = line.match(/^\s*[•*-]\s+(.*)$/);
      if (bullet) {
        html += `<div class="diary-preview-bullet">• ${inlineMarkdown(bullet[1])}</div>`;
        return;
      }
      if (!line.trim()) {
        html += '<div class="diary-preview-gap"></div>';
        return;
      }
      html += `<p>${inlineMarkdown(line)}</p>`;
    });
    els.preview.innerHTML = html || '<p class="diary-preview-placeholder">Пока ничего не написано.</p>';
    els.preview.querySelectorAll('[data-diary-task-line]').forEach(cb => {
      cb.addEventListener('change', () => {
        const idx = Number(cb.getAttribute('data-diary-task-line'));
        const current = String(els.content.value || '').split('\n');
        if (!current[idx]) return;
        current[idx] = current[idx].replace(/^(\s*[-*]\s+\[)[ xX](\])/, `$1${cb.checked ? 'x' : ' '}$2`);
        els.content.value = current.join('\n');
        flushEditor();
        renderPreview(els.content.value);
        if (typeof window.updateKeyboardDoneStatus === 'function') window.updateKeyboardDoneStatus(els.content);
      });
    });
  }

  function currentType() {
    const active = document.querySelector('[data-diary-type].active');
    return active ? active.getAttribute('data-diary-type') : 'entry';
  }

  function updateTypeUI(type) {
    document.querySelectorAll('[data-diary-type]').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-diary-type') === type);
    });
  }

  function applyEditorModeState() {
    const item = state.editingId ? itemById(state.editingId) : null;
    if (!item) return;
    const isDiary = item.kind === 'diary';
    const readOnly = Boolean(state.preview);
    if (els.titleInput) {
      els.titleInput.readOnly = isDiary || readOnly;
      els.titleInput.classList.toggle('readonly', isDiary || readOnly);
    }
    if (els.noteSectionSelect) els.noteSectionSelect.disabled = readOnly;
    if (els.sectionLabel) els.sectionLabel.style.display = isDiary || readOnly ? 'none' : 'flex';
    if (els.typeSwitch) els.typeSwitch.style.display = isDiary || readOnly ? 'none' : 'flex';
    if (els.pinBtn) els.pinBtn.style.display = isDiary || readOnly ? 'none' : 'inline-flex';
  }

  function setPreview(on) {
    state.preview = Boolean(on);
    if (!els.preview || !els.content) return;
    if (state.preview) flushEditor();
    if (els.contentWrap) els.contentWrap.style.display = state.preview ? 'none' : 'block';
    els.content.style.display = state.preview ? 'none' : 'block';
    els.preview.style.display = state.preview ? 'block' : 'none';
    if (els.previewToggle) els.previewToggle.textContent = state.preview ? 'Редактировать' : 'Просмотр';
    if (state.preview) renderPreview(els.content.value);
    applyEditorModeState();
  }

  function renderTabs() {
    const noteCount = state.data.notes.filter(n => n.kind !== 'diary' && !n.isDraft).length;
    const diaryCount = state.data.notes.filter(n => n.kind === 'diary' && !n.isDraft).length;
    if (els.notesTabCount) els.notesTabCount.textContent = noteCount;
    if (els.diaryTabCount) els.diaryTabCount.textContent = diaryCount;
    document.querySelectorAll('[data-diary-tab]').forEach(tab => {
      tab.classList.toggle('active', tab.getAttribute('data-diary-tab') === state.view);
    });
  }

  function renderHome() {
    const notes = state.data.notes.filter(n => n.kind !== 'diary' && !n.isDraft);
    const entries = state.data.notes.filter(n => n.kind === 'diary' && !n.isDraft);
    if (els.homeNotesCount) els.homeNotesCount.textContent = notes.length;
    if (els.homeEntriesCount) els.homeEntriesCount.textContent = entries.length;
    if (!els.homeRecent) return;
    const recent = state.data.notes.filter(n => !n.isDraft).sort((a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    ).slice(0, 5);
    if (!recent.length) {
      els.homeRecent.innerHTML = '<div class="diary-home-empty">Пока нет записей. Начните с быстрой мысли.</div>';
      return;
    }
    els.homeRecent.innerHTML = recent.map(item => {
      const isDiary = item.kind === 'diary';
      const sec = isDiary ? null : sectionById(item.sectionId);
      return `<button type="button" class="diary-home-recent-item" data-home-item="${escapeHtml(item.id)}">
        <span class="diary-home-recent-type">${isDiary ? '📔' : (item.type === 'list' ? '☑' : (item.type === 'bullets' ? '•' : '📝'))}</span>
        <span class="diary-home-recent-main"><strong>${escapeHtml(item.title || 'Без названия')}</strong><small>${escapeHtml(isDiary ? formatShortDate(item.createdAt) : (sec.icon + ' ' + sec.title + ' · ' + formatShortDate(item.updatedAt)))}</small></span>
        <span class="diary-home-recent-arrow">→</span>
      </button>`;
    }).join('');
    els.homeRecent.querySelectorAll('[data-home-item]').forEach(btn => {
      btn.addEventListener('click', () => openEditor(btn.getAttribute('data-home-item')));
    });
  }

  function renderSections() {
    if (!els.sectionsList) return;
    els.sectionsList.innerHTML = state.data.sections.map(section => {
      const count = state.data.notes.filter(n => n.kind !== 'diary' && n.sectionId === section.id).length;
      return `<button type="button" class="diary-section-chip ${section.id === state.activeSectionId ? 'active' : ''}" data-section-id="${escapeHtml(section.id)}">
        <span class="diary-section-chip-icon">${escapeHtml(section.icon || '📔')}</span>
        <span class="diary-section-chip-title">${escapeHtml(section.title)}</span>
        <span class="diary-section-chip-count">${count}</span>
      </button>`;
    }).join('');
    els.sectionsList.querySelectorAll('[data-section-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (state.editingId) closeEditor();
        state.activeSectionId = btn.getAttribute('data-section-id');
        state.data.activeSectionId = state.activeSectionId;
        save();
        state.view = 'notes';
        renderAll();
      });
    });
  }

  function getNotes() {
    const q = state.query.trim().toLowerCase();
    let notes = state.data.notes.filter(n => n.kind !== 'diary');
    if (!q) notes = notes.filter(n => n.sectionId === state.activeSectionId);
    if (q) notes = notes.filter(n => `${n.title} ${n.content}`.toLowerCase().includes(q));
    notes.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
    return notes;
  }

  function renderNotes() {
    if (!els.notesList) return;
    const notes = getNotes();
    const q = state.query.trim();
    const section = activeSection();
    if (els.currentSectionIcon) els.currentSectionIcon.textContent = q ? '⌕' : (section.icon || '📔');
    if (els.currentSectionTitle) els.currentSectionTitle.textContent = q ? `Поиск: «${q}»` : section.title;
    if (els.notesCount) els.notesCount.textContent = `${notes.length} ${notes.length === 1 ? 'заметка' : (notes.length > 1 && notes.length < 5 ? 'заметки' : 'заметок')}`;

    els.notesList.innerHTML = notes.map(note => {
      const sec = sectionById(note.sectionId);
      const excerpt = plainText(note.content).slice(0, 150);
      const tasks = taskStats(note.content);
      const typeIcon = note.type === 'list' ? '☑' : (note.type === 'bullets' ? '•' : '📝');
      const progress = tasks.total ? ` · ${tasks.done}/${tasks.total}` : '';
      return `<div class="diary-note-card ${note.pinned ? 'pinned' : ''}" data-note-id="${escapeHtml(note.id)}" role="button" tabindex="0">
        <div class="diary-note-card-top">
          <span class="diary-note-card-type">${typeIcon}</span>
          <span class="diary-note-card-title">${escapeHtml(note.title || 'Без названия')}</span>
          ${note.pinned ? '<span class="diary-note-card-pin" title="Закреплено">★</span>' : ''}
        </div>
        <p class="diary-note-card-excerpt">${escapeHtml(excerpt || 'Пустая заметка')}</p>
        <div class="diary-note-card-meta">
          ${q ? `<span class="diary-note-card-section">${escapeHtml(sec.icon || '📔')} ${escapeHtml(sec.title)}</span>` : ''}
          <span>${escapeHtml(formatShortDate(note.updatedAt))}${progress}</span>
          <span>Читать →</span>
        </div>
      </div>`;
    }).join('');

    els.notesList.querySelectorAll('[data-note-id]').forEach(card => {
      const open = () => openEditor(card.getAttribute('data-note-id'), false, true);
      card.addEventListener('click', open);
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
      });
    });

    if (els.emptyState) {
      els.emptyState.style.display = notes.length ? 'none' : 'flex';
      els.notesList.style.display = notes.length ? 'flex' : 'none';
    }
  }

  function renderDiaryEntries() {
    if (!els.entriesList) return;
    const entries = state.data.notes.filter(n => n.kind === 'diary' && !n.isDraft)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (els.entriesCount) els.entriesCount.textContent = `${entries.length} ${entries.length === 1 ? 'запись' : (entries.length > 1 && entries.length < 5 ? 'записи' : 'записей')}`;
    els.entriesList.innerHTML = entries.map(entry => {
      const excerpt = plainText(entry.content).slice(0, 190);
      return `<div class="diary-diary-card" data-diary-entry="${escapeHtml(entry.id)}" role="button" tabindex="0">
        <div class="diary-diary-card-date">${escapeHtml(formatDateTime(entry.createdAt))}</div>
        <div class="diary-diary-card-title">${escapeHtml(entry.title || 'Запись дня')}</div>
        <p class="diary-diary-card-excerpt">${escapeHtml(excerpt || 'Пустая запись — откройте и дополните её.')}</p>
        <div class="diary-diary-card-meta"><span>${escapeHtml(formatShortDate(entry.updatedAt))}</span><span>Читать →</span></div>
      </div>`;
    }).join('');
    els.entriesList.querySelectorAll('[data-diary-entry]').forEach(card => {
      const open = () => openEditor(card.getAttribute('data-diary-entry'), false, true);
      card.addEventListener('click', open);
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
      });
    });
    if (els.entriesEmpty) {
      els.entriesEmpty.style.display = entries.length ? 'none' : 'flex';
      els.entriesList.style.display = entries.length ? 'flex' : 'none';
    }
  }

  function renderSectionSelect(selectedId) {
    if (!els.noteSectionSelect) return;
    els.noteSectionSelect.innerHTML = state.data.sections.map(s =>
      `<option value="${escapeHtml(s.id)}">${escapeHtml(s.icon || '📔')} ${escapeHtml(s.title)}</option>`
    ).join('');
    if (selectedId) els.noteSectionSelect.value = selectedId;
  }

  function renderPanels() {
    if (!els.homePanel || !els.notesPanel || !els.diaryPanel) return;
    const editing = Boolean(state.editingId);
    els.homePanel.style.display = (!editing && state.view === 'home') ? 'block' : 'none';
    els.notesPanel.style.display = (!editing && state.view === 'notes') ? 'block' : 'none';
    els.diaryPanel.style.display = (!editing && state.view === 'diary') ? 'block' : 'none';
    els.editorPanel.style.display = editing ? 'block' : 'none';
  }

  function renderAll() {
    renderTabs();
    renderHome();
    renderSections();
    renderNotes();
    renderDiaryEntries();
    renderPanels();
    if (els.noteSectionSelect && state.editingId) {
      renderSectionSelect(els.noteSectionSelect.value || state.activeSectionId);
    }
  }

  function focusContentNow() {
    if (!state.pendingFocus) return;
    state.pendingFocus = false;
    if (!els.content) return;
    try {
      els.content.focus({ preventScroll: false });
      const pos = els.content.value.length;
      els.content.setSelectionRange(pos, pos);
    } catch (e) {}
  }

  function openEditor(id, focusContent, readMode) {
    const item = itemById(id);
    if (!item) return;
    if (state.editingId && state.editingId !== id) flushEditor();
    state.editingId = id;
    state.preview = false;
    state.linePrefix = null;
    state.linePrefixSuppressed = false;
    if (item.kind !== 'diary') {
      state.activeSectionId = item.sectionId;
      state.data.activeSectionId = item.sectionId;
    }
    const isDiary = item.kind === 'diary';
    els.editorKicker.textContent = isDiary ? 'Общий дневник' : 'Заметка';
    els.content.placeholder = isDiary
      ? 'Дорогой дневник, сегодня…'
      : '• Мысль, которая пришла в голову...';
    els.titleInput.value = item.title || '';
    els.titleInput.readOnly = isDiary;
    els.titleInput.classList.toggle('readonly', isDiary);
    els.timestamp.style.display = isDiary ? 'block' : 'none';
    els.timestamp.textContent = isDiary ? formatDateTime(item.createdAt) : '';
    els.sectionLabel.style.display = isDiary ? 'none' : 'flex';
    els.typeSwitch.style.display = isDiary ? 'none' : 'flex';
    els.pinBtn.style.display = isDiary ? 'none' : 'inline-flex';
    els.pinBtn.textContent = item.pinned ? '★' : '☆';
    els.pinBtn.classList.toggle('active', item.pinned);
    els.content.value = item.content || '';
    renderSectionSelect(item.sectionId);
    updateTypeUI(isDiary ? 'entry' : (item.type || 'entry'));
    setPreview(false);
    if (els.contentWrap) els.contentWrap.style.display = 'block';
    setSaveStatus('Сохранено');
    renderPanels();
    if (typeof window.updateKeyboardDoneStatus === 'function') window.updateKeyboardDoneStatus(els.content);
    state.pendingFocus = Boolean(focusContent);
    if (focusContent) {
      if (document.getElementById('screen-diary').classList.contains('active')) {
        focusContentNow();
      }
    } else {
      state.pendingFocus = false;
    }
    if (readMode) {
      state.pendingFocus = false;
      setPreview(true);
    }
    if (els.editorPanel) els.editorPanel.scrollIntoView({ block: 'start' });
  }

  function flushEditor() {
    if (!state.editingId) return;
    const item = itemById(state.editingId);
    if (!item) return;
    if (item.kind === 'diary') {
      item.content = els.content.value;
      item.type = 'entry';
      item.updatedAt = nowIso();
      if (item.content.trim()) {
        item.isDraft = false;
        save();
      } else {
        item.isDraft = true;
        setSaveStatus('Черновик — введите текст');
      }
    } else {
      item.title = els.titleInput.value.trim();
      item.content = els.content.value;
      item.sectionId = els.noteSectionSelect.value || item.sectionId;
      item.type = currentType();
      item.updatedAt = nowIso();
      state.activeSectionId = item.sectionId;
      state.data.activeSectionId = item.sectionId;
      if (isMeaningfulItem(item)) {
        item.isDraft = false;
        save();
      } else {
        item.isDraft = true;
        setSaveStatus('Черновик — введите текст');
      }
    }
  }

  function scheduleSave() {
    setSaveStatus('Сохраняю…');
    clearTimeout(state.saveTimer);
    state.saveTimer = setTimeout(() => {
      flushEditor();
      const current = state.editingId ? itemById(state.editingId) : null;
      setSaveStatus(current && current.isDraft ? 'Черновик' : 'Сохранено');
    }, 300);
  }

  function closeEditor() {
    const closingId = state.editingId;
    flushEditor();
    if (closingId) {
      const closingItem = itemById(closingId);
      if (closingItem && !isMeaningfulItem(closingItem)) {
        state.data.notes = state.data.notes.filter(n => n.id !== closingId);
        save();
      }
    }
    state.editingId = null;
    state.preview = false;
    state.pendingFocus = false;
    if (els.editorPanel) els.editorPanel.style.display = 'none';
    renderAll();
  }

  function showView(view) {
    if (state.editingId) closeEditor();
    state.view = view;
    state.query = '';
    if (els.searchInput) els.searchInput.value = '';
    if (els.searchClear) els.searchClear.style.display = 'none';
    renderAll();
  }

  function newQuickNote(focus) {
    if (state.editingId) closeEditor();
    const section = activeSection();
    const note = {
      id: uid(), kind: 'note', sectionId: section.id, title: '',
      content: '• ', type: 'bullets', pinned: false, isDraft: true,
      createdAt: nowIso(), updatedAt: nowIso()
    };
    state.data.notes.unshift(note);
    state.view = 'notes';
    renderAll();
    openEditor(note.id, focus !== false);
  }

  function newRegularNote() {
    if (state.editingId) closeEditor();
    const section = activeSection();
    const note = {
      id: uid(), kind: 'note', sectionId: section.id, title: '',
      content: '', type: 'entry', pinned: false, isDraft: true,
      createdAt: nowIso(), updatedAt: nowIso()
    };
    state.data.notes.unshift(note);
    state.view = 'notes';
    renderAll();
    openEditor(note.id, false);
  }

  function newDiaryEntry(focus) {
    if (state.editingId) closeEditor();
    const entry = {
      id: uid(), kind: 'diary', sectionId: state.activeSectionId, title: diaryTitle(),
      content: '', type: 'entry', pinned: false, isDraft: true,
      createdAt: nowIso(), updatedAt: nowIso()
    };
    state.data.notes.unshift(entry);
    state.view = 'diary';
    renderAll();
    openEditor(entry.id, focus !== false);
  }

  function getSessionId() {
    // One diary entry per full app/page start. In-app navigation does not
    // create another entry; closing and reopening the app creates a new one.
    if (!state.sessionId) state.sessionId = PAGE_SESSION_ID;
    return state.sessionId;
  }

  function ensureLaunchEntry() {
    const sid = getSessionId();
    let entry = state.data.notes.find(n => n.kind === 'diary' && n.sessionId === sid);
    if (!entry) {
      entry = {
        id: uid(), kind: 'diary', sectionId: state.activeSectionId,
        title: diaryTitle(), content: '', type: 'entry', pinned: false,
        sessionId: sid, isDraft: true, createdAt: nowIso(), updatedAt: nowIso()
      };
      state.data.notes.unshift(entry);
      // Draft is kept in memory only. It is saved after the first non-empty text.
    }
    return entry;
  }

  function applyLaunchMode() {
    const mode = state.data.settings.launchMode || DEFAULT_LAUNCH;
    if (mode === 'new-note') {
      newQuickNote(true);
    } else if (mode === 'new-diary') {
      const entry = ensureLaunchEntry();
      showView('diary');
      openEditor(entry.id, true);
    } else if (mode === 'history') {
      if (state.editingId) closeEditor();
      state.pendingFocus = false;
      showView('notes');
      state.pendingHistory = true;
      if (document.getElementById('screen-diary').classList.contains('active')) {
        state.pendingHistory = false;
        openHistory();
      }
    } else {
      showView('home');
    }
  }

  function afterDiaryScreenShown() {
    if (state.pendingHistory) {
      state.pendingHistory = false;
      openHistory();
    }
    if (state.pendingFocus) focusContentNow();
  }

  function deleteCurrentItem() {
    if (!state.editingId) return;
    const item = itemById(state.editingId);
    if (!item) return;
    const id = state.editingId;
    const finish = () => {
      state.editingId = null;
      state.data.notes = state.data.notes.filter(n => n.id !== id);
      save();
      if (els.editorPanel) els.editorPanel.style.display = 'none';
      renderAll();
    };
    if (typeof window.showConfirmDialog === 'function') {
      window.showConfirmDialog({
        title: 'Удалить запись?',
        message: 'Запись будет удалена без возможности восстановления.',
        confirmText: 'Удалить',
        confirmButtonClass: 'btn-danger',
        onConfirm: finish
      });
    } else if (window.confirm('Удалить запись?')) {
      finish();
    }
  }

  function togglePin() {
    if (!state.editingId) return;
    const item = itemById(state.editingId);
    if (!item || item.kind === 'diary') return;
    item.pinned = !item.pinned;
    item.updatedAt = nowIso();
    els.pinBtn.textContent = item.pinned ? '★' : '☆';
    els.pinBtn.classList.toggle('active', item.pinned);
    save();
    setSaveStatus('Сохранено');
  }

  function currentLineStart(value, pos) {
    return value.lastIndexOf('\n', Math.max(0, pos - 1)) + 1;
  }

  function linePrefixOf(line) {
    if (line.startsWith('- [ ] ')) return '- [ ] ';
    if (line.startsWith('• ')) return '• ';
    return '';
  }

  function insertMarkup(kind) {
    if (!els.content) return;
    const start = els.content.selectionStart || 0;
    const end = els.content.selectionEnd || 0;
    const value = els.content.value;
    const before = value.slice(0, start);
    const selected = value.slice(start, end);

    if (kind === 'bold') {
      const inner = selected || '';
      const insertion = '**' + inner + '**';
      els.content.value = before + insertion + value.slice(end);
      const cursor = before.length + (selected ? insertion.length : 2);
      els.content.focus();
      els.content.setSelectionRange(cursor, cursor);
      scheduleSave();
      if (typeof window.updateKeyboardDoneStatus === 'function') window.updateKeyboardDoneStatus(els.content);
      return;
    }

    let prefix = '';
    if (kind === 'task') prefix = '- [ ] ';
    else if (kind === 'bullet') prefix = '• ';
    else if (kind === 'heading') prefix = '## ';
    if (!prefix) return;
    const needsNewline = before.length > 0 && !before.endsWith('\n');
    const insertion = (needsNewline ? '\n' : '') + prefix + selected;
    els.content.value = before + insertion + value.slice(end);
    const pos = before.length + insertion.length;
    els.content.focus();
    els.content.setSelectionRange(pos, pos);
    state.linePrefix = prefix;
    state.linePrefixSuppressed = false;
    scheduleSave();
    if (typeof window.updateKeyboardDoneStatus === 'function') window.updateKeyboardDoneStatus(els.content);
  }

  function handleEnter(e) {
    if (e.key !== 'Enter' || e.shiftKey || e.isComposing) return;
    if (!state.editingId) return;
    const item = itemById(state.editingId);
    if (!item || item.kind === 'diary') return;

    const start = els.content.selectionStart || 0;
    const end = els.content.selectionEnd || 0;
    const value = els.content.value;
    const lineStart = currentLineStart(value, start);
    const currentLine = value.slice(lineStart, start);
    const type = currentType();

    let prefix = linePrefixOf(currentLine);
    if (!prefix && !state.linePrefixSuppressed) {
      if (type === 'bullets') prefix = '• ';
      else if (type === 'list') prefix = '- [ ] ';
    }
    if (!prefix) return;

    e.preventDefault();
    const insertion = '\n' + prefix;
    els.content.value = value.slice(0, start) + insertion + value.slice(end);
    const pos = start + insertion.length;
    els.content.setSelectionRange(pos, pos);
    state.linePrefix = prefix;
    state.linePrefixSuppressed = false;
    scheduleSave();
    if (typeof window.updateKeyboardDoneStatus === 'function') window.updateKeyboardDoneStatus(els.content);
    if (state.preview) renderPreview(els.content.value);
  }

  function handlePrefixBackspace(e) {
    if (e.key !== 'Backspace' || e.shiftKey || e.altKey || e.metaKey || e.ctrlKey) return;
    if (!state.editingId) return;
    const start = els.content.selectionStart || 0;
    const end = els.content.selectionEnd || 0;
    if (start !== end) return;
    const value = els.content.value;
    const lineStart = currentLineStart(value, start);
    const before = value.slice(lineStart, start);
    const prefix = linePrefixOf(before);
    if (!prefix) return;

    e.preventDefault();
    els.content.value = value.slice(0, lineStart) + value.slice(start);
    els.content.setSelectionRange(lineStart, lineStart);
    state.linePrefix = null;
    state.linePrefixSuppressed = true;
    scheduleSave();
    if (typeof window.updateKeyboardDoneStatus === 'function') window.updateKeyboardDoneStatus(els.content);
    if (state.preview) renderPreview(els.content.value);
  }

  function openQuickOpen() {
    if (!els.quickOpen) return;
    els.quickOpen.classList.add('active');
    els.quickOpen.setAttribute('aria-hidden', 'false');
    els.quickInput.value = '';
    renderQuickResults('');
    setTimeout(() => { try { els.quickInput.focus(); } catch (e) {} }, 50);
  }

  function closeQuickOpen() {
    if (!els.quickOpen) return;
    els.quickOpen.classList.remove('active');
    els.quickOpen.setAttribute('aria-hidden', 'true');
  }

  function renderQuickResults(query) {
    if (!els.quickResults) return;
    const q = query.trim().toLowerCase();
    const sections = state.data.sections.filter(s => !q || s.title.toLowerCase().includes(q));
    let items = state.data.notes.filter(n => !n.isDraft);
    if (q) items = items.filter(n => `${n.title} ${n.content}`.toLowerCase().includes(q));
    items.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    items = items.slice(0, 30);
    let html = '';
    if (sections.length) {
      html += '<div class="diary-quick-group-title">Разделы заметок</div>';
      html += sections.map(s => {
        const count = state.data.notes.filter(n => n.kind !== 'diary' && n.sectionId === s.id).length;
        return `<button type="button" class="diary-quick-item" data-quick-section="${escapeHtml(s.id)}">
          <span class="diary-quick-item-icon">${escapeHtml(s.icon || '📔')}</span>
          <span class="diary-quick-item-main"><strong>${escapeHtml(s.title)}</strong><small>${count} заметок</small></span>
          <span class="diary-quick-item-type">раздел</span>
        </button>`;
      }).join('');
    }
    if (items.length) {
      html += '<div class="diary-quick-group-title">Заметки и дневник</div>';
      html += items.map(n => {
        const isDiary = n.kind === 'diary';
        const sec = isDiary ? null : sectionById(n.sectionId);
        return `<button type="button" class="diary-quick-item" data-quick-note="${escapeHtml(n.id)}">
          <span class="diary-quick-item-icon">${isDiary ? '📔' : (n.type === 'list' ? '☑' : (n.type === 'bullets' ? '•' : '📝'))}</span>
          <span class="diary-quick-item-main"><strong>${escapeHtml(n.title || 'Без названия')}</strong><small>${escapeHtml(isDiary ? formatShortDate(n.createdAt) : (sec.icon + ' ' + sec.title + ' · ' + plainText(n.content).slice(0, 60)))}</small></span>
          <span class="diary-quick-item-type">${isDiary ? 'дневник' : (n.pinned ? '★' : 'заметка')}</span>
        </button>`;
      }).join('');
    }
    if (!html) html = '<div class="diary-quick-empty">Ничего не найдено. Попробуйте другой запрос.</div>';
    els.quickResults.innerHTML = html;
    els.quickResults.querySelectorAll('[data-quick-note]').forEach(btn => {
      btn.addEventListener('click', () => {
        closeQuickOpen();
        openEditor(btn.getAttribute('data-quick-note'));
      });
    });
    els.quickResults.querySelectorAll('[data-quick-section]').forEach(btn => {
      btn.addEventListener('click', () => {
        closeQuickOpen();
        if (state.editingId) closeEditor();
        state.view = 'notes';
        state.activeSectionId = btn.getAttribute('data-quick-section');
        state.data.activeSectionId = state.activeSectionId;
        save();
        state.query = '';
        if (els.searchInput) els.searchInput.value = '';
        renderAll();
      });
    });
  }

  function readableContent(content) {
    const lines = String(content || '').split('\n');
    let html = '';
    lines.forEach(line => {
      const task = line.match(/^\s*[-*]\s+\[([ xX])\]\s+(.*)$/);
      if (task) {
        html += `<div class="diary-reader-line">${task[1].toLowerCase() === 'x' ? '☑' : '☐'} ${inlineMarkdown(task[2])}</div>`;
        return;
      }
      const bullet = line.match(/^\s*[•*-]\s+(.*)$/);
      if (bullet) {
        html += `<div class="diary-reader-line">• ${inlineMarkdown(bullet[1])}</div>`;
        return;
      }
      const heading = line.match(/^(#{1,3})\s+(.*)$/);
      if (heading) {
        html += `<strong class="diary-reader-heading">${inlineMarkdown(heading[2])}</strong>`;
        return;
      }
      if (!line.trim()) {
        html += '<div class="diary-reader-gap"></div>';
        return;
      }
      html += `<p>${inlineMarkdown(line)}</p>`;
    });
    return html || '<p class="diary-reader-empty">Пустая запись.</p>';
  }

  function openDiaryReader() {
    if (!els.readerModal) return;
    renderDiaryReader();
    els.readerModal.classList.add('active');
    els.readerModal.setAttribute('aria-hidden', 'false');
  }

  function closeDiaryReader() {
    if (!els.readerModal) return;
    els.readerModal.classList.remove('active');
    els.readerModal.setAttribute('aria-hidden', 'true');
  }

  function renderDiaryReader() {
    if (!els.readerContent) return;
    const entries = state.data.notes.filter(n => n.kind === 'diary' && !n.isDraft)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    if (!entries.length) {
      els.readerContent.innerHTML = '<div class="diary-reader-zero">В дневнике пока нет записей.</div>';
      return;
    }
    els.readerContent.innerHTML = entries.map(entry => `
      <article class="diary-reader-entry">
        <div class="diary-reader-date">${escapeHtml(formatDateTime(entry.createdAt))}</div>
        <div class="diary-reader-body">${readableContent(entry.content)}</div>
      </article>
    `).join('');
  }

  function openHistory() {
    if (!els.historyModal) return;
    els.historySearch.value = '';
    renderHistory('');
    els.historyModal.classList.add('active');
    els.historyModal.setAttribute('aria-hidden', 'false');
  }

  function closeHistory() {
    if (!els.historyModal) return;
    els.historyModal.classList.remove('active');
    els.historyModal.setAttribute('aria-hidden', 'true');
  }

  function renderHistory(query) {
    if (!els.historyList) return;
    const q = query.trim().toLowerCase();
    let items = state.data.notes.filter(n => !n.isDraft).sort((a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    if (q) items = items.filter(n => `${n.title} ${n.content}`.toLowerCase().includes(q));
    if (!items.length) {
      els.historyList.innerHTML = '<div class="diary-quick-empty">История пока пуста.</div>';
      return;
    }
    els.historyList.innerHTML = items.map(item => {
      const isDiary = item.kind === 'diary';
      const sec = isDiary ? null : sectionById(item.sectionId);
      return `<button type="button" class="diary-history-item" data-history-item="${escapeHtml(item.id)}">
        <span class="diary-history-type">${isDiary ? '📔' : (item.type === 'list' ? '☑' : (item.type === 'bullets' ? '•' : '📝'))}</span>
        <span class="diary-history-main"><strong>${escapeHtml(item.title || 'Без названия')}</strong><small>${escapeHtml(isDiary ? formatDateTime(item.createdAt) : (sec.icon + ' ' + sec.title + ' · ' + formatShortDate(item.updatedAt)))}</small></span>
        <span class="diary-history-arrow">→</span>
      </button>`;
    }).join('');
    els.historyList.querySelectorAll('[data-history-item]').forEach(btn => {
      btn.addEventListener('click', () => {
        closeHistory();
        openEditor(btn.getAttribute('data-history-item'));
      });
    });
  }

  function openSettings() {
    if (!els.settingsModal) return;
    const mode = state.data.settings.launchMode || DEFAULT_LAUNCH;
    els.settingsModal.querySelectorAll('input[name="diary-launch-mode"]').forEach(input => {
      input.checked = input.value === mode;
    });
    els.settingsModal.classList.add('active');
    els.settingsModal.setAttribute('aria-hidden', 'false');
  }

  function closeSettings() {
    if (!els.settingsModal) return;
    els.settingsModal.classList.remove('active');
    els.settingsModal.setAttribute('aria-hidden', 'true');
  }

  function saveSettings() {
    const selected = els.settingsModal ? els.settingsModal.querySelector('input[name="diary-launch-mode"]:checked') : null;
    if (selected) {
      state.data.settings.launchMode = selected.value;
      save();
    }
    closeSettings();
  }

  function openSectionModal(editId) {
    if (!els.sectionModal) return;
    state.sectionEditId = editId || null;
    const section = editId ? sectionById(editId) : null;
    els.sectionModalTitle.textContent = section ? 'Переименовать раздел' : 'Новый раздел';
    els.sectionName.value = section ? section.title : '';
    state.sectionIcon = section ? (section.icon || '📔') : '📔';
    renderIconPicker();
    els.sectionModal.classList.add('active');
    els.sectionModal.setAttribute('aria-hidden', 'false');
    setTimeout(() => { try { els.sectionName.focus(); } catch (e) {} }, 50);
  }

  function closeSectionModal() {
    if (!els.sectionModal) return;
    els.sectionModal.classList.remove('active');
    els.sectionModal.setAttribute('aria-hidden', 'true');
    state.sectionEditId = null;
  }

  function renderIconPicker() {
    if (!els.iconPicker) return;
    els.iconPicker.innerHTML = SECTION_ICONS.map(icon =>
      `<button type="button" class="diary-icon-choice ${icon === state.sectionIcon ? 'active' : ''}" data-icon="${icon}">${icon}</button>`
    ).join('');
    els.iconPicker.querySelectorAll('[data-icon]').forEach(btn => {
      btn.addEventListener('click', () => {
        state.sectionIcon = btn.getAttribute('data-icon');
        renderIconPicker();
      });
    });
  }

  function saveSection() {
    const title = els.sectionName.value.trim();
    if (!title) { els.sectionName.focus(); return; }
    if (state.sectionEditId) {
      const section = sectionById(state.sectionEditId);
      section.title = title;
      section.icon = state.sectionIcon;
    } else {
      const section = { id: uid(), title, icon: state.sectionIcon, createdAt: nowIso() };
      state.data.sections.push(section);
      state.activeSectionId = section.id;
      state.data.activeSectionId = section.id;
    }
    save();
    closeSectionModal();
    if (els.manageModal && els.manageModal.classList.contains('active')) renderManageList();
    renderAll();
  }

  function openManage() {
    if (!els.manageModal) return;
    renderManageList();
    els.manageModal.classList.add('active');
    els.manageModal.setAttribute('aria-hidden', 'false');
  }

  function closeManage() {
    if (!els.manageModal) return;
    els.manageModal.classList.remove('active');
    els.manageModal.setAttribute('aria-hidden', 'true');
  }

  function renderManageList() {
    if (!els.manageList) return;
    els.manageList.innerHTML = state.data.sections.map(s => {
      const count = state.data.notes.filter(n => n.kind !== 'diary' && n.sectionId === s.id).length;
      return `<div class="diary-manage-row">
        <span class="diary-manage-icon">${escapeHtml(s.icon || '📔')}</span>
        <span class="diary-manage-title">${escapeHtml(s.title)}<small>${count} заметок</small></span>
        <button type="button" class="diary-manage-action" data-edit-section="${escapeHtml(s.id)}" title="Переименовать">✎</button>
        <button type="button" class="diary-manage-action diary-manage-delete" data-delete-section="${escapeHtml(s.id)}" title="Удалить">🗑</button>
      </div>`;
    }).join('');
    els.manageList.querySelectorAll('[data-edit-section]').forEach(btn => {
      btn.addEventListener('click', () => { closeManage(); openSectionModal(btn.getAttribute('data-edit-section')); });
    });
    els.manageList.querySelectorAll('[data-delete-section]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-delete-section');
        const section = sectionById(id);
        if (state.data.sections.length <= 1) { window.alert('Должен остаться хотя бы один раздел.'); return; }
        const finish = () => {
          const fallback = state.data.sections.find(s => s.id !== id);
          state.data.notes.forEach(n => { if (n.kind !== 'diary' && n.sectionId === id) n.sectionId = fallback.id; });
          state.data.sections = state.data.sections.filter(s => s.id !== id);
          if (state.activeSectionId === id) state.activeSectionId = fallback.id;
          state.data.activeSectionId = state.activeSectionId;
          save();
          renderManageList();
          renderAll();
        };
        if (typeof window.showConfirmDialog === 'function') {
          window.showConfirmDialog({
            title: 'Удалить раздел?',
            message: `Раздел «${section.title}» будет удалён. Заметки перейдут в другой раздел.`,
            confirmText: 'Удалить', confirmButtonClass: 'btn-danger', onConfirm: finish
          });
        } else if (window.confirm('Удалить раздел? Заметки перейдут в другой раздел.')) {
          finish();
        }
      });
    });
  }

  function init() {
    if (state.initialized) {
      renderAll();
      return;
    }
    els = {
      homePanel: $('diary-home-panel'), notesPanel: $('diary-notes-panel'), diaryPanel: $('diary-diary-panel'),
      editorPanel: $('diary-editor-panel'), sectionsList: $('diary-sections-list'),
      notesList: $('diary-notes-list'), entriesList: $('diary-entries-list'),
      emptyState: $('diary-empty-state'), entriesEmpty: $('diary-entries-empty'),
      currentSectionIcon: $('diary-current-section-icon'), currentSectionTitle: $('diary-current-section-title'),
      notesCount: $('diary-notes-count'), entriesCount: $('diary-entries-count'),
      notesTabCount: $('diary-notes-tab-count'), diaryTabCount: $('diary-diary-tab-count'),
      homeNotesCount: $('diary-home-notes-count'), homeEntriesCount: $('diary-home-entries-count'),
      homeRecent: $('diary-home-recent'),
      searchInput: $('diary-search-input'), searchClear: $('diary-search-clear'),
      titleInput: $('diary-note-title'), content: $('diary-note-content'),
      contentWrap: $('diary-content-wrap'), noteSectionSelect: $('diary-note-section-select'),
      sectionLabel: $('diary-section-label'), typeSwitch: $('diary-type-switch'),
      editorKicker: $('diary-editor-kicker'), timestamp: $('diary-editor-timestamp'),
      preview: $('diary-note-preview'), previewToggle: $('diary-preview-toggle'),
      saveStatus: $('diary-save-status'), pinBtn: $('diary-pin-note'),
      quickOpen: $('diary-quick-open'), quickInput: $('diary-quick-input'), quickResults: $('diary-quick-results'),
      historyModal: $('diary-history-modal'), historySearch: $('diary-history-search'), historyList: $('diary-history-list'),
      readerModal: $('diary-reader-modal'), readerContent: $('diary-reader-content'),
      settingsModal: $('diary-settings-modal'),
      sectionModal: $('diary-section-modal'), sectionModalTitle: $('diary-section-modal-title'),
      sectionName: $('diary-section-name'), iconPicker: $('diary-section-icon-picker'),
      manageModal: $('diary-manage-modal'), manageList: $('diary-manage-list')
    };
    if (!els.sectionsList || !els.notesPanel) return;
    state.data = load();
    state.activeSectionId = state.data.activeSectionId;
    ensureLaunchEntry();

    // Static controls and tabs
    document.querySelectorAll('[data-diary-tab]').forEach(tab => {
      tab.addEventListener('click', () => showView(tab.getAttribute('data-diary-tab')));
    });
    document.querySelectorAll('[data-diary-open]').forEach(card => {
      card.addEventListener('click', () => showView(card.getAttribute('data-diary-open')));
    });
    $('diary-home-history-link')?.addEventListener('click', openHistory);
    $('diary-history-btn')?.addEventListener('click', openHistory);
    $('diary-read-all-btn')?.addEventListener('click', openDiaryReader);
    $('diary-reader-close')?.addEventListener('click', closeDiaryReader);
    $('diary-settings-btn')?.addEventListener('click', openSettings);
    $('diary-quick-open-btn')?.addEventListener('click', openQuickOpen);
    $('diary-quick-close')?.addEventListener('click', closeQuickOpen);
    $('diary-history-close')?.addEventListener('click', closeHistory);
    $('diary-settings-cancel')?.addEventListener('click', closeSettings);
    $('diary-settings-close-x')?.addEventListener('click', closeSettings);
    $('diary-settings-save')?.addEventListener('click', saveSettings);
    $('diary-new-thought-btn')?.addEventListener('click', () => newQuickNote(true));
    $('diary-new-note-btn')?.addEventListener('click', newRegularNote);
    $('diary-empty-thought-btn')?.addEventListener('click', () => newQuickNote(true));
    $('diary-empty-note-btn')?.addEventListener('click', newRegularNote);
    $('diary-new-entry-btn')?.addEventListener('click', () => newDiaryEntry(true));
    $('diary-empty-entry-btn')?.addEventListener('click', () => newDiaryEntry(true));
    $('diary-new-section-btn')?.addEventListener('click', () => openSectionModal());
    $('diary-manage-sections-btn')?.addEventListener('click', openManage);
    $('diary-manage-new')?.addEventListener('click', () => { closeManage(); openSectionModal(); });
    $('diary-manage-close')?.addEventListener('click', closeManage);
    $('diary-manage-close-x')?.addEventListener('click', closeManage);
    $('diary-section-cancel')?.addEventListener('click', closeSectionModal);
    $('diary-section-close-x')?.addEventListener('click', closeSectionModal);
    $('diary-section-save')?.addEventListener('click', saveSection);
    $('diary-editor-back')?.addEventListener('click', closeEditor);
    $('diary-delete-note')?.addEventListener('click', deleteCurrentItem);
    els.pinBtn?.addEventListener('click', togglePin);
    els.quickInput?.addEventListener('input', () => renderQuickResults(els.quickInput.value));
    els.historySearch?.addEventListener('input', () => renderHistory(els.historySearch.value));
    els.sectionName?.addEventListener('keydown', (e) => { if (e.key === 'Enter') saveSection(); });
    els.searchInput?.addEventListener('input', () => {
      state.query = els.searchInput.value;
      if (els.searchClear) els.searchClear.style.display = state.query ? 'flex' : 'none';
      renderNotes();
    });
    els.searchClear?.addEventListener('click', () => {
      state.query = '';
      els.searchInput.value = '';
      els.searchClear.style.display = 'none';
      renderNotes();
    });
    els.titleInput?.addEventListener('input', scheduleSave);
    els.content?.addEventListener('input', () => {
      scheduleSave();
      if (state.preview) renderPreview(els.content.value);
    });
    els.content?.addEventListener('keydown', handleEnter);
    els.content?.addEventListener('keydown', handlePrefixBackspace);
    els.content?.addEventListener('input', () => {
      if (!els.content) return;
      if (state.linePrefix) {
        const pos = els.content.selectionStart || 0;
        const lineStart = currentLineStart(els.content.value, pos);
        const line = els.content.value.slice(lineStart, pos);
        if (!line.startsWith(state.linePrefix)) {
          state.linePrefix = null;
          state.linePrefixSuppressed = true;
        }
      }
    });
    els.noteSectionSelect?.addEventListener('change', scheduleSave);
    document.querySelectorAll('[data-diary-type]').forEach(btn => {
      btn.addEventListener('click', () => {
        updateTypeUI(btn.getAttribute('data-diary-type'));
        scheduleSave();
      });
    });
    document.querySelectorAll('[data-diary-insert]').forEach(btn => {
      btn.addEventListener('click', () => insertMarkup(btn.getAttribute('data-diary-insert')));
    });
    els.previewToggle?.addEventListener('click', () => setPreview(!state.preview));
    // In the diary editor the green check opens reading mode instead of
    // moving focus/hiding the keyboard.
    const diaryCheckBtn = els.contentWrap ? els.contentWrap.querySelector('.btn-keyboard-done') : null;
    if (diaryCheckBtn) {
      diaryCheckBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!state.editingId) return;
        flushEditor();
        setPreview(true);
      });
    }

    [els.quickOpen, els.historyModal, els.readerModal, els.settingsModal, els.sectionModal, els.manageModal].forEach(overlay => {
      if (!overlay) return;
      overlay.addEventListener('click', (e) => {
        if (e.target !== overlay) return;
        if (overlay === els.quickOpen) closeQuickOpen();
        else if (overlay === els.historyModal) closeHistory();
        else if (overlay === els.readerModal) closeDiaryReader();
        else if (overlay === els.settingsModal) closeSettings();
        else if (overlay === els.sectionModal) closeSectionModal();
        else closeManage();
      });
    });

    document.addEventListener('keydown', (e) => {
      if (!document.getElementById('screen-diary')?.classList.contains('active')) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        openQuickOpen();
      } else if (e.key === 'Escape') {
        if (els.quickOpen?.classList.contains('active')) closeQuickOpen();
        else if (els.historyModal?.classList.contains('active')) closeHistory();
        else if (els.readerModal?.classList.contains('active')) closeDiaryReader();
        else if (els.settingsModal?.classList.contains('active')) closeSettings();
        else if (els.sectionModal?.classList.contains('active')) closeSectionModal();
        else if (els.manageModal?.classList.contains('active')) closeManage();
        else if (state.editingId) closeEditor();
      }
    });
    document.addEventListener('visibilitychange', () => { if (document.hidden) flushEditor(); });
    window.addEventListener('beforeunload', flushEditor);

    state.initialized = true;
    renderAll();
  }

  window.initDiaryModule = function() {
    if (!state.initialized) init();
    ensureLaunchEntry();
    applyLaunchMode();
  };

  window.afterDiaryScreenShown = function() {
    afterDiaryScreenShown();
  };

  window.handleDiaryBack = function() {
    if (els.quickOpen?.classList.contains('active')) { closeQuickOpen(); return true; }
    if (els.historyModal?.classList.contains('active')) { closeHistory(); return true; }
    if (els.readerModal?.classList.contains('active')) { closeDiaryReader(); return true; }
    if (els.settingsModal?.classList.contains('active')) { closeSettings(); return true; }
    if (els.manageModal?.classList.contains('active')) { closeManage(); return true; }
    if (els.sectionModal?.classList.contains('active')) { closeSectionModal(); return true; }
    if (state.editingId) { closeEditor(); return true; }
    return false;
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
