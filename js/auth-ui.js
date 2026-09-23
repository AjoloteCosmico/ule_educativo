(function () {
  'use strict';
  window.ULE = window.ULE || {};

  function canEdit(user) {
    return !!user && (user.role === 'contributor' || user.role === 'admin');
  }

  function setState(user) {
    var button = document.getElementById('auth-toggle');
    var editorial = document.getElementById('editorial-link');
    if (!button) return;
    button.textContent = user ? 'Sign-out' : 'Sign-in';
    button.setAttribute('aria-label', user ? 'Ver sesión y cerrar sesión' : 'Iniciar sesión');
    if (editorial) editorial.hidden = !canEdit(user);
  }

  async function refresh() {
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
  ULE.authUI = { refresh: refresh, canEdit: canEdit };
})();