/* ==========================================================================
   client.js — Cliente HTTP autenticado de ule educativo
   ========================================================================== */
window.ULE = window.ULE || {};
ULE.api = ULE.api || {};

ULE.api.request = async function (path, options) {
  const opts = options || {};
  const base = String(ULE.config.apiBaseUrl || '').replace(/\/+$/, '');

  if (!base) {
    throw new Error('[ULE.api] ULE.config.apiBaseUrl no está configurada.');
  }

  const headers = Object.assign(
    { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    opts.headers || {}
  );

  const requestOptions = Object.assign({}, opts, {
    credentials: 'include',
    headers: headers
  });

  const response = await fetch(base + path, requestOptions);
  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json')
    ? await response.json()
    : null;

  if (!response.ok) {
    const error = new Error('[ULE.api] HTTP ' + response.status + ' en ' + path);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};
