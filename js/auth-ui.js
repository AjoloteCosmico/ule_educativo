/* ==========================================================================
   auth-ui.js — Puente entre sesión y la UI de navegación
   Actualiza: #auth-toggle, #nav-user, #editorial-link, #editorial-home
   ========================================================================== */
(function () {
  'use strict';
  window.ULE = window.ULE || {};

  function canEdit(user) {
    return !!user && (user.role === 'contributor' || user.role === 'admin');
  }

  function displayName(user) {
    if (!user) return '';
    return user.username || user.name || user.display_name || user.email || '';
  }

  function setState(user) {
    var button = document.getElementById('auth-toggle');
    var editorial = document.getElementById('editorial-link');
    var navUser = document.getElementById('nav-user');
    var editorialHome = document.getElementById('editorial-home');

    if (button) {
      if (user) {
        var name = displayName(user);
        // Si el backend aún no envía username, el botón sigue siendo usable.
        button.textContent = 'Cerrar sesión';
        button.setAttribute(
          'aria-label',
          name ? 'Sesión de ' + name + '. Abrir para cerrar sesión' : 'Ver sesión y cerrar sesión'
        );
      } else {
        button.textContent = 'Entrar';
        button.setAttribute('aria-label', 'Iniciar sesión');
      }
    }

    if (navUser) {
      var label = displayName(user);
      if (user && label) {
        navUser.hidden = false;
        navUser.textContent = label;
        navUser.title = user.role ? 'Rol: ' + user.role : '';
      } else {
        navUser.hidden = true;
        navUser.textContent = '';
        navUser.removeAttribute('title');
      }
    }

    if (editorial) editorial.hidden = !canEdit(user);
    if (editorialHome) editorialHome.hidden = !canEdit(user);
  }

  async function refresh() {
    if (!window.ULE || !ULE.auth || typeof ULE.auth.me !== 'function') {
      setState(null);
      return null;
    }
    try {
      var user = await ULE.auth.me();
      ULE.auth.state = ULE.auth.state || {};
      ULE.auth.state.user = user;
      ULE.auth.state.status = user ? 'authenticated' : 'anonymous';
      setState(user);
      return user;
    } catch (e) {
      setState(null);
      return null;
    }
  }

  function init() {
    var button = document.getElementById('auth-toggle');
    var modal = document.getElementById('auth-modal');
    if (!button || !modal) return;

    button.addEventListener('click', function () {
      // Con sesión abierta el modal muestra "Tu sesión" + cerrar sesión.
      modal.open('login');
    });

    document.addEventListener('auth-modal:success', function (event) {
      setState(event.detail && event.detail.user ? event.detail.user : null);
    });
    document.addEventListener('auth-modal:logout', function () {
      setState(null);
    });
    refresh();
  }

  document.addEventListener('DOMContentLoaded', init);
  ULE.authUI = { refresh: refresh, canEdit: canEdit, displayName: displayName, setState: setState };
})();
