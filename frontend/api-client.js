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

window.API = Object.freeze({
  request: (route, method = 'GET', data = {}, options = {}) => ANCAuth.request(route, method, data, options),
  get: (route, data = {}) => ANCAuth.request(route, 'GET', data),
  post: (route, data = {}) => ANCAuth.request(route, 'POST', data),
  put: (route, data = {}) => ANCAuth.request(route, 'PUT', data),
  delete: (route, data = {}) => ANCAuth.request(route, 'DELETE', data),
  health: () => ANCAuth.request('health', 'GET', {}, { public: true })
});