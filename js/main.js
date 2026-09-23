/* ==========================================================================
   main.js — Lógica global: tema (claro/oscuro) y navegación
   ule educativo

   Namespace global: window.ULE.theme / window.ULE.nav
   Sin dependencias externas, sin módulos ES (script plano <script src="js/main.js">).

   Contrato esperado en el HTML (ver test_identidad.html):
     <html lang="es" data-theme="light">
     ...
     <button class="theme-toggle" id="theme-toggle" aria-label="Cambiar tema">
       <span class="theme-toggle__icon"> ...svg sol/luna opcional... </span>
       <span id="theme-label">Oscuro</span>
     </button>
   ========================================================================== */

window.ULE = window.ULE || {};

/* ==========================================================================
   1. TEMA (claro/oscuro)
   Se ejecuta de inmediato (no espera DOMContentLoaded) para aplicar el tema
   guardado lo antes posible y minimizar el "flash" de tema incorrecto.
   Para el mejor resultado, cargar este script en <head> (sin defer) antes
   del <body>, o al menos antes de que se pinte contenido visible.
   ========================================================================== */
ULE.theme = (function () {
  const STORAGE_KEY = 'ule-theme';
  const root = document.documentElement;

  function getStoredPreference() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved === 'dark' || saved === 'light' ? saved : null;
    } catch (e) {
      return null;
    }
  }

  function getSystemPreference() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }

  function currentTheme() {
    return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }

  function updateToggleUI() {
    const isDark = currentTheme() === 'dark';
    const btn = document.getElementById('theme-toggle');
    const label = document.getElementById('theme-label');

    if (label) {
      label.textContent = isDark ? 'Claro' : 'Oscuro';
    }
    if (btn) {
      btn.setAttribute('aria-pressed', String(isDark));
      btn.setAttribute('aria-label', isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
    }
  }

  function apply(theme, options) {
    options = options || {};
    root.setAttribute('data-theme', theme === 'dark' ? 'dark' : 'light');

    if (options.persist !== false) {
      try {
        localStorage.setItem(STORAGE_KEY, theme);
      } catch (e) {
        /* noop */
      }
    }

    updateToggleUI();
  }

  function toggle() {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';

    root.classList.add('theme-transition');
    apply(next);
    window.setTimeout(function () {
      root.classList.remove('theme-transition');
    }, 300);
  }

  function init() {
    const stored = getStoredPreference();
    const theme = stored || getSystemPreference();
    apply(theme, { persist: false });

    if (!stored && window.matchMedia) {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = function (e) {
        if (!getStoredPreference()) {
          apply(e.matches ? 'dark' : 'light', { persist: false });
        }
      };
      if (mq.addEventListener) mq.addEventListener('change', handleChange);
      else if (mq.addListener) mq.addListener(handleChange);
    }
  }

  function bindToggleButton() {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;
    // Evitar listeners duplicados si <ule-nav> se monta después
    if (btn.dataset.uleThemeBound === '1') {
      updateToggleUI();
      return;
    }
    btn.dataset.uleThemeBound = '1';
    updateToggleUI();
    btn.addEventListener('click', toggle);
  }

  init();

  return {
    apply: apply,
    toggle: toggle,
    current: currentTheme,
    bindToggleButton: bindToggleButton
  };
})();

/* ==========================================================================
   2. NAVEGACIÓN GLOBAL
   ========================================================================== */
ULE.nav = (function () {
  function normalizePath(path) {
    if (!path || path === '/') return '/index.html';
    return path.endsWith('/') ? path + 'index.html' : path;
  }

  function highlightActiveLink() {
    const links = document.querySelectorAll('.nav__link[href]');
    if (!links.length) return;

    const currentPath = normalizePath(window.location.pathname);

    links.forEach(function (link) {
      let linkPath;
      try {
        linkPath = normalizePath(new URL(link.href, window.location.origin).pathname);
      } catch (e) {
        return;
      }

      if (linkPath === currentPath) {
        link.setAttribute('aria-current', 'page');
      } else if (link.getAttribute('aria-current') === 'page') {
        link.removeAttribute('aria-current');
      }
    });
  }

  function initMobileMenu() {
    // El menú móvil vive en <ule-nav>; este fallback cubre marcado legacy.
    const toggleBtn = document.getElementById('nav-toggle');
    const nav = document.querySelector('.nav');
    if (!toggleBtn || !nav) return;
    if (toggleBtn.dataset.uleNavBound === '1') return;
    toggleBtn.dataset.uleNavBound = '1';

    function closeMenu() {
      nav.classList.remove('nav--open');
      toggleBtn.setAttribute('aria-expanded', 'false');
    }

    function openMenu() {
      nav.classList.add('nav--open');
      toggleBtn.setAttribute('aria-expanded', 'true');
    }

    toggleBtn.setAttribute('aria-expanded', 'false');
    toggleBtn.addEventListener('click', function () {
      const isOpen = nav.classList.contains('nav--open');
      if (isOpen) closeMenu();
      else openMenu();
    });

    nav.querySelectorAll('.nav__link').forEach(function (link) {
      link.addEventListener('click', closeMenu);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
    });
  }

  function initHeaderScroll() {
    // <ule-nav> envuelve el <header>; no usar solo body > header.
    const header =
      document.querySelector('ule-nav header') ||
      document.querySelector('body > header') ||
      document.querySelector('header');
    if (!header) return;

    let lastScrollY = window.scrollY;
    const SCROLL_THRESHOLD = 50;
    let ticking = false;

    function show() {
      header.classList.remove('header--hidden');
      header.classList.add('header--visible');
    }

    function updateOnScroll() {
      const currentScrollY = window.scrollY;
      const isScrollingDown = currentScrollY > lastScrollY;
      const isAtTop = currentScrollY < SCROLL_THRESHOLD;

      if (isAtTop || !isScrollingDown) {
        show();
      } else {
        header.classList.add('header--hidden');
        header.classList.remove('header--visible');
      }

      lastScrollY = currentScrollY;
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) {
        window.requestAnimationFrame(updateOnScroll);
        ticking = true;
      }
    });

    document.addEventListener('mousemove', function (e) {
      if (e.clientY < 50) show();
    });
  }

  function initAnchorFocus() {
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
      link.addEventListener('click', function () {
        const id = link.getAttribute('href').slice(1);
        if (!id) return;
        const target = document.getElementById(id);
        if (!target) return;

        if (!target.hasAttribute('tabindex')) {
          target.setAttribute('tabindex', '-1');
        }
        window.setTimeout(function () {
          target.focus({ preventScroll: true });
        }, 50);
      });
    });
  }

  function init() {
    highlightActiveLink();
    initMobileMenu();
    initHeaderScroll();
    initAnchorFocus();
  }

  return {
    init: init,
    highlightActiveLink: highlightActiveLink
  };
})();

document.addEventListener('DOMContentLoaded', function () {
  ULE.theme.bindToggleButton();
  ULE.nav.init();
});
