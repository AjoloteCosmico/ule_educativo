/* ==========================================================================
   session.js — Estado mínimo de sesión para páginas editoriales
   ========================================================================== */
window.ULE = window.ULE || {};
ULE.auth = ULE.auth || {};

ULE.auth.state = {
  status: 'checking',
  user: null
};

ULE.auth.checkSession = async function () {
  ULE.auth.state.status = 'checking';
  ULE.auth.state.user = null;

  try {
    const user = await ULE.auth.me();
    ULE.auth.state.user = user;
    ULE.auth.state.status = user ? 'authenticated' : 'anonymous';
    return user;
  } catch (error) {
    ULE.auth.state.status = 'error';
    throw error;
  }
};

ULE.auth.requireRole = async function (roles) {
  const user = await ULE.auth.checkSession();
  const allowed = Array.isArray(roles) ? roles : [roles];

  if (!user) {
    const error = new Error('AUTH_REQUIRED');
    error.status = 401;
    throw error;
  }

  if (allowed.length && !allowed.includes(user.role)) {
    const error = new Error('FORBIDDEN');
    error.status = 403;
    throw error;
  }

  return user;
};
