/* ==========================================================================
   ule-nav.js — <ule-nav>
   Barra de navegación única del sitio público.

   Misma estructura en todas las páginas (excepto herramientas didácticas).
   Light DOM: reutiliza .nav / .theme-toggle de components.css y base.css.

   Incluye:
     - Enlaces principales
     - Enlace Editorial (solo contributor/admin)
     - Botón de sesión (Entrar / nombre de usuario)
     - Toggle de tema
     - Menú responsive (hamburguesa)

   Depende de: js/main.js (tema + aria-current), js/auth-ui.js (sesión).
   ========================================================================== */

(function () {
  'use strict';

  window.ULE = window.ULE || {};

  var THEME_ICON =
    '<span class="theme-toggle__icon">' +
    '<svg class="icon-sol" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"></path></svg>' +
    '<svg class="icon-luna" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"></path></svg>' +
    '</span>';

  function basePrefix() {
    // Páginas bajo herramientas/ necesitan subir un nivel.
    try {
      if (window.location.pathname.indexOf('/herramientas/') !== -1) return '../';
    } catch (e) { /* noop */ }
    return '';
  }

  class UleNav extends HTMLElement {
    connectedCallback() {
      if (this._ready) return;
      this._ready = true;
      this._render();
      this._bindMobile();
      // main.js ya se ejecutó o se ejecutará en DOMContentLoaded; re-bind seguro
      if (window.ULE && ULE.theme && typeof ULE.theme.bindToggleButton === 'function') {
        ULE.theme.bindToggleButton();
      }
      if (window.ULE && ULE.nav && typeof ULE.nav.highlightActiveLink === 'function') {
        ULE.nav.highlightActiveLink();
      } else if (window.ULE && ULE.nav && typeof ULE.nav.init === 'function') {
        // Si aún no hubo DOMContentLoaded, main.js lo hará; si ya pasó, re-init parcial
      }
    }

    _render() {
      var p = basePrefix();
      this.innerHTML =
        '<header class="container">' +
        '  <nav class="nav" aria-label="Navegación principal">' +
        '    <button type="button" class="nav__toggle" id="nav-toggle" aria-expanded="false" aria-controls="nav-panel" aria-label="Abrir menú">' +
        '      <span class="nav__toggle-bar" aria-hidden="true"></span>' +
        '      <span class="nav__toggle-bar" aria-hidden="true"></span>' +
        '      <span class="nav__toggle-bar" aria-hidden="true"></span>' +
        '    </button>' +
        '    <div class="nav__panel" id="nav-panel">' +
        '      <ul class="nav__lista">' +
        '        <li><a class="nav__link" href="' + p + 'index.html">Inicio</a></li>' +
        '        <li><a class="nav__link" href="' + p + 'articulos.html">Artículos</a></li>' +
        '        <li><a class="nav__link" href="' + p + 'bibliografia.html">Bibliografía</a></li>' +
        '        <li><a class="nav__link" href="' + p + 'catalogos.html">Colecciones</a></li>' +
        '        <li><a class="nav__link" id="editorial-link" href="' + p + 'herramientas/editorial.html" hidden>Editorial</a></li>' +
        '      </ul>' +
        '      <div class="nav__acciones">' +
        '        <span class="nav__user" id="nav-user" hidden></span>' +
        '        <button class="nav__link nav__auth" type="button" id="auth-toggle">Entrar</button>' +
        '        <button class="theme-toggle" type="button" id="theme-toggle" aria-label="Cambiar tema">' +
        THEME_ICON +
        '          <span id="theme-label">Oscuro</span>' +
        '        </button>' +
        '      </div>' +
        '    </div>' +
        '  </nav>' +
        '</header>';
    }

    _bindMobile() {
      var toggle = this.querySelector('#nav-toggle');
      var nav = this.querySelector('.nav');
      if (!toggle || !nav) return;

      function closeMenu() {
        nav.classList.remove('nav--open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'Abrir menú');
      }

      function openMenu() {
        nav.classList.add('nav--open');
        toggle.setAttribute('aria-expanded', 'true');
        toggle.setAttribute('aria-label', 'Cerrar menú');
      }

      toggle.addEventListener('click', function () {
        if (nav.classList.contains('nav--open')) closeMenu();
        else openMenu();
      });

      this.querySelectorAll('.nav__link').forEach(function (link) {
        link.addEventListener('click', closeMenu);
      });

      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeMenu();
      });
    }
  }

  if (!customElements.get('ule-nav')) {
    customElements.define('ule-nav', UleNav);
  }
})();
