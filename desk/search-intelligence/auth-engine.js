/* ============================================================
   Desk — Auth Engine
   Thin client for the login/session endpoints on the Apps Script
   backend. Session is a signed, stateless token (not a DB session) —
   the server verifies it fresh on every privileged call, so logging
   out is just forgetting the token locally.
   ============================================================ */
(function (global) {
  const GSC_URL = 'https://script.google.com/macros/s/AKfycbyijNimY56S9pRdVvCpXv4LmCtirWHTmLpASLzttJ-xRqUjSuXeBU-zvlhyBhD9MzEK/exec';
  const STORAGE_KEY = 'desk.si.session.v1';

  function saveSession(sess) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(sess)); } catch (e) {}
  }

  function getSession() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const sess = JSON.parse(raw);
      if (!sess || !sess.token) return null;
      // Soft client-side expiry check only — the real check happens
      // server-side on every privileged call regardless.
      if (sess.expiresAt && Date.now() > sess.expiresAt) { clearSession(); return null; }
      return sess;
    } catch (e) { return null; }
  }

  function clearSession() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
  }

  async function login(username, password) {
    let res;
    try {
      res = await fetch(GSC_URL, {
        method: 'POST',
        body: JSON.stringify({ mode: 'login', username, password })
      });
    } catch (networkErr) {
      return { ok: false, error: 'Network error reaching the login server: ' + (networkErr.message || networkErr) };
    }
    let data;
    try {
      data = await res.json();
    } catch (parseErr) {
      return { ok: false, error: 'Server returned an unexpected response (HTTP ' + res.status + '). Check the Apps Script deployment and Script Properties.' };
    }
    if (!data.ok) return { ok: false, error: data.error || 'Login failed' };
    const sess = {
      token: data.token,
      username: data.username,
      service: data.service,
      isAdmin: !!data.isAdmin,
      // Client-side hint only, mirrors the server's 8h token TTL.
      expiresAt: Date.now() + 8 * 60 * 60 * 1000
    };
    saveSession(sess);
    return { ok: true, session: sess };
  }

  function logout() {
    clearSession();
  }

  /* Wrapper for POST calls that need auth: injects the token automatically
     and clears the local session if the server reports it's no longer valid,
     so the next page check re-shows the login gate. */
  async function authedPost(payload) {
    const sess = getSession();
    if (!sess) return { ok: false, error: 'Not logged in', authError: true };
    let res;
    try {
      res = await fetch(GSC_URL, {
        method: 'POST',
        body: JSON.stringify(Object.assign({ token: sess.token }, payload))
      });
    } catch (networkErr) {
      return { ok: false, error: 'Network error: ' + (networkErr.message || networkErr) };
    }
    let data;
    try {
      data = await res.json();
    } catch (parseErr) {
      return { ok: false, error: 'Server returned an unexpected response (HTTP ' + res.status + ').' };
    }
    if (!data.ok && data.authError) clearSession();
    return data;
  }

  /* Wrapper for GET calls that need auth: appends the token as a query param. */
  function authedGetUrl(baseParams) {
    const sess = getSession();
    if (!sess) return null;
    const usp = new URLSearchParams(Object.assign({}, baseParams, { token: sess.token }));
    return GSC_URL + '?' + usp.toString();
  }

  global.AuthEngine = { GSC_URL, getSession, saveSession, clearSession, login, logout, authedPost, authedGetUrl };
})(window);
