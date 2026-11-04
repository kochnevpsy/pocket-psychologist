/* Light / dark theme switch for the «Новый дизайн» variant. */
(function() {
  var STORAGE_KEY = 'kp_design_theme';
  var root = document.documentElement;

  function readTheme() {
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'light') return 'light';
      return 'dark';
    } catch (e) {
      return 'dark';
    }
  }

  function updateUi(theme) {
    var isDark = theme === 'dark';

    var hubBtn = document.getElementById('btn-hub-theme-toggle');
    var hubIcon = document.getElementById('hub-theme-icon');
    var hubLabel = document.getElementById('hub-theme-label');
    if (hubBtn) {
      hubBtn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
      hubBtn.setAttribute('aria-label', isDark ? 'Включить светлую тему' : 'Включить тёмную тему');
      hubBtn.setAttribute('title', isDark ? 'Включить светлую тему' : 'Включить тёмную тему');
    }
    if (hubIcon) hubIcon.textContent = isDark ? '☀️' : '🌙';
    if (hubLabel) hubLabel.textContent = isDark ? 'Светлая тема' : 'Тёмная тема';

    var settingsToggle = document.getElementById('toggle-dark-theme');
    if (settingsToggle) settingsToggle.checked = isDark;
    var settingsIcon = document.getElementById('settings-theme-icon');
    if (settingsIcon) settingsIcon.textContent = isDark ? '☀️' : '🌙';
    var settingsDesc = document.getElementById('settings-theme-desc');
    if (settingsDesc) settingsDesc.textContent = isDark ? 'Включена' : 'Выключена';

    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', isDark ? '#121713' : '#F3F0E8');
  }

  function applyTheme(theme, persist) {
    var next = theme === 'dark' ? 'dark' : 'light';
    root.setAttribute('data-theme', next);
    root.style.backgroundColor = next === 'dark' ? '#121713' : '#F3F0E8';
    if (persist) {
      try { localStorage.setItem(STORAGE_KEY, next); } catch (e) {}
    }
    try {
      if (window.AndroidBridge && typeof window.AndroidBridge.setDesignTheme === 'function') {
        window.AndroidBridge.setDesignTheme(next);
      }
    } catch (e) {}
    updateUi(next);
  }

  function toggleTheme() {
    applyTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark', true);
  }

  function init() {
    applyTheme(readTheme(), false);

    var hubBtn = document.getElementById('btn-hub-theme-toggle');
    if (hubBtn) hubBtn.addEventListener('click', toggleTheme);

    var settingsToggle = document.getElementById('toggle-dark-theme');
    if (settingsToggle) {
      settingsToggle.addEventListener('change', function() {
        applyTheme(settingsToggle.checked ? 'dark' : 'light', true);
      });
    }

    window.addEventListener('storage', function(event) {
      if (event.key === STORAGE_KEY) applyTheme(event.newValue === 'dark' ? 'dark' : 'light', false);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
