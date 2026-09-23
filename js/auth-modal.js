/* ==========================================================================
   auth-modal.js — <auth-modal>
   Modal de autenticación (login / registro / sesión activa).

   Depende de:
     - ULE.api (js/api/client.js)
     - ULE.auth (js/api/auth.js, js/api/session.js)
     - variables.css (custom properties atraviesan el Shadow DOM)

   Uso:
     <auth-modal id="auth"></auth-modal>
     document.getElementById('auth').open('login');   // o 'register'
     document.getElementById('auth').close();

   Eventos:
     auth-modal:success  — detail: { user, mode }
     auth-modal:logout   — sin detail
   ========================================================================== */

(function () {
  'use strict';

  window.ULE = window.ULE || {};

  var STYLES =
    ':host { display: contents; }' +
    'dialog.auth-modal {' +
    '  margin: auto;' +
    '  max-width: min(24rem, calc(100vw - 2 * var(--space-md)));' +
    '  width: 100%;' +
    '  padding: 0;' +
    '  border: none;' +
    '  border-radius: var(--radius-lg);' +
    '  background: var(--color-card);' +
    '  color: var(--color-cuerpo-card);' +
    '  box-shadow: var(--shadow-card);' +
    '  max-height: calc(100dvh - 2 * var(--space-md));' +
    '  overflow-y: auto;' +
    '  font-family: var(--font-principal);' +
    '}' +
    'dialog.auth-modal::backdrop {' +
    '  background: rgba(0, 0, 0, 0.55);' +
    '}' +
    '.auth-modal__header {' +
    '  display: flex;' +
    '  align-items: center;' +
    '  justify-content: space-between;' +
    '  gap: var(--space-md);' +
    '  padding: var(--space-lg) var(--space-lg) var(--space-sm);' +
    '}' +
    '.auth-modal__logo {' +
    '  width: 2.5rem;' +
    '  height: 2.5rem;' +
    '  object-fit: contain;' +
    '  flex-shrink: 0;' +
    '}' +
    '.auth-modal__titulo {' +
    '  flex: 1;' +
    '  font-size: var(--fs-h2);' +
    '  font-weight: 700;' +
    '  color: var(--color-titulo-card);' +
    '  margin: 0;' +
    '  line-height: var(--lh-titulo);' +
    '}' +
    '.auth-modal__cerrar {' +
    '  all: unset;' +
    '  box-sizing: border-box;' +
    '  cursor: pointer;' +
    '  width: 2.25rem;' +
    '  height: 2.25rem;' +
    '  display: grid;' +
    '  place-items: center;' +
    '  border-radius: var(--radius-sm);' +
    '  color: var(--color-texto);' +
    '  font-size: 1.35rem;' +
    '  line-height: 1;' +
    '  flex-shrink: 0;' +
    '}' +
    '.auth-modal__cerrar:hover {' +
    '  background: color-mix(in srgb, var(--color-texto) 10%, transparent);' +
    '}' +
    '.auth-modal__cerrar:focus-visible {' +
    '  outline: 2px solid var(--color-link-focus);' +
    '  outline-offset: 2px;' +
    '}' +
    '.auth-modal__body {' +
    '  padding: var(--space-sm) var(--space-lg) var(--space-lg);' +
    '  display: flex;' +
    '  flex-direction: column;' +
    '  gap: var(--space-md);' +
    '}' +
    '.auth-modal__campo {' +
    '  display: flex;' +
    '  flex-direction: column;' +
    '  gap: var(--space-xs);' +
    '}' +
    '.auth-modal__campo label {' +
    '  font-family: var(--font-anotaciones);' +
    '  font-style: italic;' +
    '  font-size: var(--fs-anotacion);' +
    '  color: var(--color-cuerpo-card);' +
    '  opacity: 0.9;' +
    '}' +
    '.auth-modal__campo input {' +
    '  font-family: var(--font-principal);' +
    '  font-size: var(--fs-cuerpo);' +
    '  color: var(--color-texto);' +
    '  background: var(--color-fondo);' +
    '  border: 1px solid color-mix(in srgb, var(--color-texto) 25%, transparent);' +
    '  border-radius: var(--radius-sm);' +
    '  padding: 0.5rem 0.75rem;' +
    '  min-height: 2.5rem;' +
    '  box-sizing: border-box;' +
    '  width: 100%;' +
    '}' +
    '.auth-modal__campo input:focus-visible {' +
    '  outline: 2px solid var(--color-link-focus);' +
    '  outline-offset: 2px;' +
    '}' +
    '.auth-modal__submit {' +
    '  display: inline-flex;' +
    '  align-items: center;' +
    '  justify-content: center;' +
    '  min-height: 2.75rem;' +
    '  padding: 0.5rem var(--space-lg);' +
    '  border: none;' +
    '  border-radius: var(--radius-sm);' +
    '  background: var(--color-principal-accion);' +
    '  color: #fff;' +
    '  font-family: var(--font-principal);' +
    '  font-weight: 500;' +
    '  font-size: var(--fs-cuerpo);' +
    '  cursor: pointer;' +
    '  transition: background-color 0.15s ease;' +
    '  width: 100%;' +
    '}' +
    '.auth-modal__submit:hover:not(:disabled) {' +
    '  background: var(--color-principal-accion-hover);' +
    '}' +
    '.auth-modal__submit:disabled {' +
    '  opacity: 0.65;' +
    '  cursor: not-allowed;' +
    '}' +
    '.auth-modal__submit:focus-visible {' +
    '  outline: 2px solid var(--color-link-focus);' +
    '  outline-offset: 2px;' +
    '}' +
    '.auth-modal__switch {' +
    '  text-align: center;' +
    '  font-size: var(--fs-anotacion);' +
    '  color: var(--color-cuerpo-card);' +
    '  margin: 0;' +
    '}' +
    '.auth-modal__switch button {' +
    '  all: unset;' +
    '  cursor: pointer;' +
    '  color: var(--color-link);' +
    '  font-weight: 500;' +
    '  text-decoration: underline;' +
    '  text-underline-offset: 0.15em;' +
    '}' +
    '.auth-modal__switch button:hover {' +
    '  color: var(--color-link-hover);' +
    '}' +
    '.auth-modal__switch button:focus-visible {' +
    '  outline: 2px solid var(--color-link-focus);' +
    '  outline-offset: 2px;' +
    '  border-radius: var(--radius-sm);' +
    '}' +
    '.auth-modal__alerta {' +
    '  padding: var(--space-sm) var(--space-md);' +
    '  border-radius: var(--radius-sm);' +
    '  font-size: var(--fs-anotacion);' +
    '  background: color-mix(in srgb, #b00020 12%, var(--color-card));' +
    '  color: var(--color-cuerpo-card);' +
    '  border: 1px solid color-mix(in srgb, #b00020 35%, transparent);' +
    '}' +
    '.auth-modal__ok {' +
    '  padding: var(--space-sm) var(--space-md);' +
    '  border-radius: var(--radius-sm);' +
    '  font-size: var(--fs-anotacion);' +
    '  background: color-mix(in srgb, var(--color-principal) 15%, var(--color-card));' +
    '  border: 1px solid color-mix(in srgb, var(--color-principal) 35%, transparent);' +
    '  color: var(--color-cuerpo-card);' +
    '}' +
    '.auth-modal__sesion {' +
    '  display: flex;' +
    '  flex-direction: column;' +
    '  gap: var(--space-md);' +
    '}' +
    '.auth-modal__sesion p {' +
    '  margin: 0;' +
    '  line-height: var(--lh-cuerpo);' +
    '  color: var(--color-cuerpo-card);' +
    '}' +
    '.auth-modal__meta {' +
    '  font-size: var(--fs-anotacion);' +
    '  opacity: 0.85;' +
    '}' +
    '@media (prefers-reduced-motion: reduce) {' +
    '  .auth-modal__submit { transition: none; }' +
    '}';

  class AuthModal extends HTMLElement {
    static get observedAttributes() {
      return ['open', 'mode'];
    }

    constructor() {
      super();
      this._mode = 'login';
      this._busy = false;
      this._user = null;
      this._dialogBound = false;
    }

    connectedCallback() {
      if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
      this._renderShell();
      this._bindDialog();
      if (this.hasAttribute('open')) {
        this._openDialog();
      }
    }

    attributeChangedCallback(name, oldVal, newVal) {
      if (!this.shadowRoot) return;

      if (name === 'open') {
        if (this.hasAttribute('open')) {
          this._openDialog();
        } else {
          this._closeDialog();
        }
      }

      if (name === 'mode' && newVal) {
        if (newVal === 'register' || newVal === 'login') {
          this._mode = newVal;
          this._clearMessages();
          this._renderForm();
        }
      }
    }

    /* ---------- API pública ---------- */

    open(mode) {
      if (mode === 'register' || mode === 'login') {
        this._mode = mode;
      }
      this.setAttribute('open', '');
    }

    close() {
      this.removeAttribute('open');
    }

    /* ---------- Shell y diálogo ---------- */

    _renderShell() {
      this.shadowRoot.innerHTML =
        '<style>' + STYLES + '</style>' +
        '<dialog class="auth-modal" aria-labelledby="auth-modal-titulo">' +
        '  <div class="auth-modal__header">' +
        '    <img class="auth-modal__logo" src="assets/logo/logo.png" alt="" width="40" height="40">' +
        '    <h2 class="auth-modal__titulo" id="auth-modal-titulo">Inicia sesión</h2>' +
        '    <button type="button" class="auth-modal__cerrar" aria-label="Cerrar">×</button>' +
        '  </div>' +
        '  <div class="auth-modal__body" data-body></div>' +
        '</dialog>';

      var logo = this.shadowRoot.querySelector('.auth-modal__logo');
      if (logo && window.location.pathname.indexOf('/herramientas/') !== -1) logo.src = '../assets/logo/logo.png';

      var cerrar = this.shadowRoot.querySelector('.auth-modal__cerrar');
      var self = this;
      cerrar.addEventListener('click', function () {
        self.close();
      });

      this._renderForm();
    }

    _bindDialog() {
      var dialog = this.shadowRoot.querySelector('dialog');
      if (!dialog || this._dialogBound) return;
      this._dialogBound = true;

      var self = this;
      dialog.addEventListener('close', function () {
        self.removeAttribute('open');
        self._clearMessages();
      });

      dialog.addEventListener('click', function (e) {
        if (e.target === dialog) {
          self.close();
        }
      });
    }

    _openDialog() {
      var dialog = this.shadowRoot && this.shadowRoot.querySelector('dialog');
      if (!dialog) return;
      if (!dialog.open) {
        dialog.showModal();
      }
      this._refreshSessionView();
    }

    _closeDialog() {
      var dialog = this.shadowRoot && this.shadowRoot.querySelector('dialog');
      if (dialog && dialog.open) {
        dialog.close();
      }
    }

    /* ---------- Sesión ---------- */

    async _refreshSessionView() {
      if (!window.ULE || !ULE.auth || typeof ULE.auth.me !== 'function') {
        this._renderForm();
        return;
      }
      try {
        var user = await ULE.auth.me();
        if (user) {
          this._mode = 'session';
          this._user = user;
        } else if (this._mode === 'session') {
          this._mode = 'login';
          this._user = null;
        }
      } catch (e) {
        /* red caída: dejamos el formulario actual */
      }
      this._renderForm();
    }

    /* ---------- Formulario ---------- */

    _renderForm() {
      var body = this.shadowRoot.querySelector('[data-body]');
      var titulo = this.shadowRoot.querySelector('#auth-modal-titulo');
      if (!body || !titulo) return;

      var self = this;

      if (this._mode === 'session' && this._user) {
        titulo.textContent = 'Tu sesión';
        body.innerHTML =
          '<div class="auth-modal__sesion">' +
          '  <p>Hola, <strong data-name></strong>.</p>' +
          '  <p class="auth-modal__meta" data-meta></p>' +
          '  <button type="button" class="auth-modal__submit" data-logout>Cerrar sesión</button>' +
          '</div>';

        var nameEl = body.querySelector('[data-name]');
        nameEl.textContent =
          this._user.username || this._user.email || 'usuario';

        var metaEl = body.querySelector('[data-meta]');
        if (this._user.role) {
          metaEl.textContent = 'Rol: ' + this._user.role;
        } else {
          metaEl.remove();
        }

        body.querySelector('[data-logout]').addEventListener('click', function () {
          self._onLogout();
        });
        return;
      }

      var isRegister = this._mode === 'register';
      titulo.textContent = isRegister ? 'Crea tu cuenta' : 'Inicia sesión';

      var fields = '';
      if (isRegister) {
        fields +=
          '<div class="auth-modal__campo">' +
          '  <label for="auth-username">Nombre de usuario</label>' +
          '  <input id="auth-username" name="username" type="text" autocomplete="username" required minlength="3">' +
          '</div>';
      }

      fields +=
        '<div class="auth-modal__campo">' +
        '  <label for="auth-email">Correo electrónico</label>' +
        '  <input id="auth-email" name="email" type="email" autocomplete="email" required>' +
        '</div>' +
        '<div class="auth-modal__campo">' +
        '  <label for="auth-password">Contraseña</label>' +
        '  <input id="auth-password" name="password" type="password" autocomplete="' +
        (isRegister ? 'new-password' : 'current-password') +
        '" required minlength="8">' +
        '</div>';

      if (isRegister) {
        fields +=
          '<div class="auth-modal__campo">' +
          '  <label for="auth-code">Código de registro</label>' +
          '  <input id="auth-code" name="registration_code" type="text" autocomplete="off" required>' +
          '</div>';
      }

      var switchHtml = isRegister
        ? '¿Ya tienes cuenta? <button type="button" data-switch="login">Inicia sesión</button>'
        : '¿No tienes cuenta? <button type="button" data-switch="register">Regístrate</button>';

      body.innerHTML =
        '<div data-msg></div>' +
        '<form class="auth-modal__form" novalidate>' +
        fields +
        '  <button type="submit" class="auth-modal__submit" data-submit>' +
        (isRegister ? 'Crear cuenta' : 'Iniciar sesión') +
        '  </button>' +
        '</form>' +
        '<p class="auth-modal__switch">' + switchHtml + '</p>';

      body.querySelector('form').addEventListener('submit', function (e) {
        e.preventDefault();
        self._onSubmit(e.target);
      });

      var switchBtn = body.querySelector('[data-switch]');
      if (switchBtn) {
        switchBtn.addEventListener('click', function (e) {
          self._mode = e.currentTarget.getAttribute('data-switch');
          self._clearMessages();
          self._renderForm();
        });
      }
    }

    _clearMessages() {
      var msg = this.shadowRoot && this.shadowRoot.querySelector('[data-msg]');
      if (msg) msg.innerHTML = '';
    }

    _showError(text) {
      var msg = this.shadowRoot.querySelector('[data-msg]');
      if (!msg) return;
      msg.innerHTML = '<div class="auth-modal__alerta" role="alert"></div>';
      msg.querySelector('[role="alert"]').textContent = text;
    }

    _showOk(text) {
      var msg = this.shadowRoot.querySelector('[data-msg]');
      if (!msg) return;
      msg.innerHTML = '<div class="auth-modal__ok" role="status"></div>';
      msg.querySelector('[role="status"]').textContent = text;
    }

    _setBusy(busy) {
      this._busy = busy;
      var btn = this.shadowRoot.querySelector('[data-submit], [data-logout]');
      if (!btn) return;
      btn.disabled = busy;
      if (busy) {
        btn.dataset.label = btn.textContent;
        btn.textContent = 'Un momento…';
      } else if (btn.dataset.label) {
        btn.textContent = btn.dataset.label;
        delete btn.dataset.label;
      }
    }

    async _onSubmit(form) {
      if (this._busy) return;
      if (!window.ULE || !ULE.auth) {
        this._showError('El módulo de autenticación no está disponible.');
        return;
      }

      var fd = new FormData(form);
      var email = String(fd.get('email') || '').trim();
      var password = String(fd.get('password') || '');

      this._clearMessages();
      this._setBusy(true);

      try {
        var user;
        if (this._mode === 'register') {
          var username = String(fd.get('username') || '').trim();
          var code = String(fd.get('registration_code') || '').trim();
          user = await ULE.auth.register(username, email, password, code);
        } else {
          user = await ULE.auth.login(email, password);
        }

        if (!user || (!user.email && !user.username)) {
          user = await ULE.auth.me();
        }

        ULE.auth.state = ULE.auth.state || {};
        ULE.auth.state.user = user;
        ULE.auth.state.status = user ? 'authenticated' : 'anonymous';

        this.dispatchEvent(
          new CustomEvent('auth-modal:success', {
            detail: { user: user, mode: this._mode },
            bubbles: true,
            composed: true
          })
        );

        this._mode = 'session';
        this._user = user;
        this._renderForm();

        var self = this;
        setTimeout(function () {
          self.close();
        }, 700);
      } catch (err) {
        var status = err && err.status;
        var text = 'No se pudo completar la operación. Inténtalo de nuevo.';
        if (status === 401) text = 'Correo o contraseña incorrectos.';
        if (status === 403) text = 'No tienes permiso para esta acción.';
        if (status === 409) text = 'Ese correo o usuario ya está registrado.';
        if (status === 400) {
          var dataMsg =
            err.data && (err.data.message || err.data.error || err.data.detail);
          text = dataMsg || 'Revisa los datos del formulario.';
        }
        if (!status && err && err.message && /apiBaseUrl|config/i.test(err.message)) {
          text = 'La API no está configurada. Revisa ULE.config.apiBaseUrl.';
        }
        this._showError(text);
      } finally {
        this._setBusy(false);
      }
    }

    async _onLogout() {
      if (this._busy) return;
      this._setBusy(true);
      try {
        if (window.ULE && ULE.auth && typeof ULE.auth.logout === 'function') {
          await ULE.auth.logout();
        }
      } catch (e) {
        /* limpiamos estado local de todos modos */
      }
      ULE.auth.state = { status: 'anonymous', user: null };
      this._user = null;
      this._mode = 'login';
      this.dispatchEvent(
        new CustomEvent('auth-modal:logout', {
          bubbles: true,
          composed: true
        })
      );
      this._setBusy(false);
      this._renderForm();
    }
  }

  if (!customElements.get('auth-modal')) {
    customElements.define('auth-modal', AuthModal);
  }
})();
