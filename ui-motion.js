// ui-motion.js - микро-анимации интерфейса на Motion (https://motion.dev)
// Анимируются только transform/opacity небольших элементов: крупные блоки
// (выше полутора экранов) не трогаем, чтобы не создавать тяжёлые GPU-слои в WebView.
(function () {
  'use strict';

  const M = window.Motion;
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!M || reduceMotion) return;

  const { animate, stagger } = M;
  document.documentElement.classList.add('has-motion');

  const EASE_OUT = [0.16, 1, 0.3, 1];
  const SPRING_SOFT = { type: 'spring', stiffness: 380, damping: 32 };
  const SPRING_PRESS = { type: 'spring', stiffness: 700, damping: 35 };

  // ---------------------------------------------------------------
  // 1. Появление экрана: каскад видимых блоков
  // ---------------------------------------------------------------
  let screenControls = null;

  function isVisible(el) {
    return el.offsetParent !== null || getComputedStyle(el).position === 'fixed';
  }

  function collectEnterItems(screen) {
    const maxHeight = window.innerHeight * 1.5;
    const items = [];
    const walk = (parent, depth) => {
      for (const el of parent.children) {
        if (items.length >= 10) return;
        if (!isVisible(el)) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top > window.innerHeight) return;
        if (rect.height > maxHeight) {
          if (depth < 2) walk(el, depth + 1);
          continue;
        }
        items.push(el);
      }
    };
    walk(screen, 0);
    return items;
  }

  function enterScreen(screen) {
    // Instant transition without animation or darkening per requirement
    if (screenControls) screenControls.complete();
  }

  // ---------------------------------------------------------------
  // 2. Отклик на нажатие (пружинное сжатие)
  // ---------------------------------------------------------------
  const PRESS_SELECTOR = 'button:not(:disabled), .module-card';
  const PRESS_EXCLUDE = '.app-bottom-nav, .portrait-card, .modal-overlay, .btn-module-help, .btn-module-help *';
  let pressed = null;

  function release() {
    if (!pressed) return;
    const el = pressed;
    pressed = null;
    animate(el, { scale: 1 }, SPRING_SOFT).then(() => {
      if (pressed !== el) el.style.transform = '';
    });
  }

  document.addEventListener('pointerdown', (e) => {
    const el = e.target.closest(PRESS_SELECTOR);
    if (!el || el.closest(PRESS_EXCLUDE)) return;
    release();
    pressed = el;
    const scale = el.classList.contains('module-card') ? 0.98 : 0.95;
    animate(el, { scale }, SPRING_PRESS);
  }, { passive: true });
  ['pointerup', 'pointercancel', 'blur'].forEach(type => {
    window.addEventListener(type, release, { passive: true, capture: true });
  });
  document.addEventListener('scroll', release, { passive: true, capture: true });

  // ---------------------------------------------------------------
  // 3. Нижнее меню: скользящий индикатор + отскок иконки
  // ---------------------------------------------------------------
  function setupNav() {
    const nav = document.querySelector('.app-bottom-nav');
    if (!nav) return;
    const tabs = Array.from(nav.querySelectorAll('.nav-tab-item'));
    const indicator = document.createElement('span');
    indicator.className = 'nav-indicator';
    indicator.setAttribute('aria-hidden', 'true');
    nav.appendChild(indicator);

    let current = null;
    const place = (instant) => {
      const tab = tabs.find(t => t.classList.contains('active'));
      if (!tab) {
        animate(indicator, { opacity: 0 }, { duration: 0.15 });
        current = null;
        return;
      }
      const x = tab.offsetLeft + tab.offsetWidth / 2 - indicator.offsetWidth / 2;
      if (instant || !current) {
        animate(indicator, { x, opacity: 1 }, { duration: 0 });
      } else if (tab !== current) {
        animate(indicator, { x, opacity: 1 }, SPRING_SOFT);
      }
      if (tab !== current && current) {
        const icon = tab.querySelector('.nav-tab-icon');
        if (icon) animate(icon, { scale: [0.8, 1] }, { type: 'spring', stiffness: 500, damping: 15 });
      }
      current = tab;
    };

    const observer = new MutationObserver(() => place(false));
    tabs.forEach(t => observer.observe(t, { attributes: true, attributeFilter: ['class'] }));
    window.addEventListener('resize', () => place(true));
    place(true);
  }

  // ---------------------------------------------------------------
  // Подключение
  // ---------------------------------------------------------------
  function init() {
    const screens = document.querySelectorAll('.screen');
    const screenObserver = new MutationObserver(mutations => {
      for (const m of mutations) {
        const el = m.target;
        if (el.classList.contains('active') && !(m.oldValue || '').split(' ').includes('active')) {
          enterScreen(el);
        }
      }
    });
    screens.forEach(s => screenObserver.observe(s, { attributes: true, attributeFilter: ['class'], attributeOldValue: true }));

    const active = document.querySelector('.screen.active');
    if (active) enterScreen(active);

    setupNav();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
