window.ANCAuth = (() => {
  'use strict';

  const TOKEN_KEY = 'anc_google_id_token';
  const PROFILE_KEY = 'anc_user_profile';

  function token() {
    return sessionStorage.getItem(TOKEN_KEY) || '';
  }

  function profile() {
    try {
      return JSON.parse(sessionStorage.getItem(PROFILE_KEY) || 'null');
    } catch {
      return null;
    }
  }

  function saveProfile(user) {
    sessionStorage.setItem(PROFILE_KEY, JSON.stringify(user || null));
    return user;
  }

  function clear() {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(PROFILE_KEY);
  }

  function idempotencyKey() {
    if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
    const bytes = new Uint8Array(16);
    globalThis.crypto?.getRandomValues?.(bytes);
    return Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('') || String(Date.now());
  }

  async function request(route, method = 'GET', data = {}, options = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), APP_CONFIG.REQUEST_TIMEOUT_MS);
    const payload = { route, method, data, idempotencyKey: idempotencyKey() };
    if (!options.public) payload.idToken = token();

    try {
      const response = await fetch(APP_CONFIG.API_BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
        body: JSON.stringify(payload),
        signal: controller.signal,
        redirect: 'follow'
      });
      let result;
      try {
        result = await response.json();
      } catch {
        throw new Error('استجابة الخادم غير صالحة.');
      }
      if (!response.ok || !result?.ok) {
        const error = new Error(result?.error?.message || `تعذر الوصول إلى الخادم (${response.status}).`);
        error.code = result?.error?.code || 'API_ERROR';
        error.status = response.status;
        error.details = result?.error?.details;
        throw error;
      }
      return result.data;
    } catch (error) {
      if (error.name === 'AbortError') throw new Error('انتهت مهلة الاتصال بالخادم. حاول مرة أخرى.');
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  async function acceptCredential(credential) {
    clear();
    sessionStorage.setItem(TOKEN_KEY, credential);
    try {
      const result = await request('auth.google', 'POST', {});
      return saveProfile(result.user);
    } catch (error) {
      clear();
      throw error;
    }
  }

  async function requireUser() {
    if (!token()) return null;
    try {
      const result = await request('auth.me', 'GET', {});
      return saveProfile(result.user);
    } catch (error) {
      clear();
      throw error;
    }
  }

  async function logout() {
    try {
      if (token()) await request('auth.logout', 'POST', {});
    } catch {
      // Clearing browser state is authoritative when the remote token is already expired.
    }
    clear();
    window.google?.accounts?.id?.disableAutoSelect();
  }

  return Object.freeze({ token, profile, request, acceptCredential, requireUser, logout, clear });
})();

function approvalDescriptor(route, method, data) {
  const definitions = {
    'PUT tasks': ['TASK','taskId','UPDATE'],
    'PUT ads': ['AD','adId','UPDATE'],
    'POST ads.archive': ['AD','adId',data.archived === false ? 'RESTORE' : 'ARCHIVE'],
    'POST ads.cancel': ['AD','adId','DELETE'],
    'PUT studio.jobs': ['STUDIO_JOB','studioJobId','UPDATE'],
    'PUT studio.assignments': ['STUDIO_JOB','studioJobId','UPDATE'],
    'PUT users': ['USER','userId','UPDATE'],
    'POST users.setActive': ['USER','userId',data.active ? 'RESTORE' : 'ARCHIVE'],
    'DELETE users': ['USER','userId','DELETE'],
    'POST users.permissions': ['USER','userId','PERMISSIONS'],
    'DELETE documents': ['DOCUMENT','documentId','ARCHIVE'],
    'PUT invoices': ['INVOICE','invoiceId','UPDATE'],
    'PUT bank.accounts': ['BANK_ACCOUNT','bankAccountId',data.active === false ? 'ARCHIVE' : 'UPDATE'],
    'PUT expenses': ['EXPENSE','expenseId','UPDATE'],
    'POST expenses.archive': ['EXPENSE','expenseId','ARCHIVE']
  };
  const definition = definitions[`${method} ${route}`];
  if (!definition) return null;
  return { entityType: definition[0], entityId: data[definition[1]], action: definition[2] };
}

async function governedRequest(route, method = 'GET', data = {}, options = {}) {
  const user = window.ANC_CURRENT_USER;
  const role = String(user?.role || '').toUpperCase();
  const previewRole = localStorage.getItem('anc-erp-preview-role') || '';
  const isAssistant = role === 'ASSISTANT_MANAGER' || previewRole === 'ASSISTANT_MANAGER';
  const descriptor = isAssistant ? approvalDescriptor(route, method, data) : null;
  if (descriptor?.entityId) {
    return ANCAuth.request('approvals','POST',{
      ...descriptor,
      payload: data,
      description: data.approvalReason || `${descriptor.action} ${descriptor.entityType} ${descriptor.entityId}`
    });
  }
  return ANCAuth.request(route,method,data,options);
}

window.API = Object.freeze({
  request: governedRequest,
  get: (route, data = {}) => governedRequest(route, 'GET', data),
  post: (route, data = {}) => governedRequest(route, 'POST', data),
  put: (route, data = {}) => governedRequest(route, 'PUT', data),
  delete: (route, data = {}) => governedRequest(route, 'DELETE', data),
  health: () => ANCAuth.request('health', 'GET', {}, { public: true })
});
