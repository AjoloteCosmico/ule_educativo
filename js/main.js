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
      // localStorage puede fallar en modo privado/incógnito en algunos navegadores
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
        /* noop: no se pudo persistir, no es crítico */
      }
    }

    updateToggleUI();
  }

  function toggle() {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';

    // Habilita transición suave solo durante el cambio manual
    root.classList.add('theme-transition');
    apply(next);
    window.setTimeout(function () {
      root.classList.remove('theme-transition');
    }, 300);
  }

  function init() {
    const stored = getStoredPreference();
    const theme = stored || getSystemPreference();
    apply(theme, { persist: false }); // no reescribir localStorage si vino del sistema

    // Si el usuario no ha elegido tema manualmente, seguir los cambios del SO
    if (!stored && window.matchMedia) {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = function (e) {
        if (!getStoredPreference()) {
          apply(e.matches ? 'dark' : 'light', { persist: false });
        }
      };
      if (mq.addEventListener) mq.addEventListener('change', handleChange);
      else if (mq.addListener) mq.addListener(handleChange); // Safari antiguo
    }
  }

  function bindToggleButton() {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;
    updateToggleUI();
    btn.addEventListener('click', toggle);
  }

  // Aplicar tema inmediatamente (antes de DOMContentLoaded si es posible)
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
   Espera a que el DOM esté listo: resalta el enlace activo, controla el
   menú móvil (si existe) y mejora el foco al navegar por anclas internas.
   ========================================================================== */
ULE.nav = (function () {
  function normalizePath(path) {
    // Trata "" , "/" y "/index.html" como equivalentes
    if (!path || path === '/') return '/index.html';
    return path.endsWith('/') ? path + 'index.html' : path;
  }

  function highlightActiveLink() {
    const links = document.querySelectorAll('.nav__link');
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
    // Opcional: solo actúa si el marcado incluye un botón #nav-toggle.
    // No requiere que este botón exista para que el resto de main.js funcione.
    const toggleBtn = document.getElementById('nav-toggle');
    const nav = document.querySelector('.nav');
    if (!toggleBtn || !nav) return;

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

    // Cierra el menú al elegir un enlace o presionar Escape
    nav.querySelectorAll('.nav__link').forEach(function (link) {
      link.addEventListener('click', closeMenu);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
    });
  }

  function initAnchorFocus() {
    // Al navegar a un ancla interna (#seccion), mueve el foco al destino
    // para usuarios de teclado/lector de pantalla (mejor accesibilidad
    // que solo depender del scroll del navegador).
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
      link.addEventListener('click', function () {
        const id = link.getAttribute('href').slice(1);
        if (!id) return;
        const target = document.getElementById(id);
        if (!target) return;

        if (!target.hasAttribute('tabindex')) {
          target.setAttribute('tabindex', '-1');
        }
        // Espera al scroll nativo antes de mover el foco
        window.setTimeout(function () {
          target.focus({ preventScroll: true });
        }, 50);
      });
    });
  }

  function init() {
    highlightActiveLink();
    initMobileMenu();
    initAnchorFocus();
  }

  return { init: init };
})();

document.addEventListener('DOMContentLoaded', function () {
  ULE.theme.bindToggleButton();
  ULE.nav.init();
});