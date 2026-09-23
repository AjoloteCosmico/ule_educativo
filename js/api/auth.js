/* ==========================================================================
   auth.js — Sesión de ule educativo
   ========================================================================== */
window.ULE = window.ULE || {};
ULE.auth = ULE.auth || {};

ULE.auth.login = function (email, password) {
  return ULE.api.request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: email, password: password })
  });
};

ULE.auth.register = function (username, email, password, registrationCode) {
  return ULE.api.request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      username: username,
      email: email,
      password: password,
      registration_code: registrationCode
    })
  });
};

ULE.auth.logout = function () {
  return ULE.api.request('/auth/logout', { method: 'POST' });
};

ULE.auth.me = async function () {
  try {
    return await ULE.api.request('/auth/me');
  } catch (error) {
    if (error.status === 401) return null;
    throw error;
  }
};
