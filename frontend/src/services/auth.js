/* eslint-disable no-empty */
// src/services/auth.js
// Sessions Django via cookies HttpOnly (pas de JWT en localStorage).
// Vite proxy conseillé: /api -> http://localhost:8000
const API_BASE = "";

/* ========== Cookies & CSRF ========== */
function getCookie(name) {
  const prefix = name + "=";
  return document.cookie
    .split(";")
    .map((s) => s.trim())
    .find((c) => c.startsWith(prefix))
    ?.slice(prefix.length) || null;
}

export async function ensureCsrf(force = false) {
  let token = getCookie("csrftoken");
  if (!token || force) {
    await fetch(`/api/csrf/`, { credentials: "include" });
    token = getCookie("csrftoken");
  }
  return token;
}

/* ========== fetch helper (CSRF + cookies) ========== */
export async function authFetch(url, options = {}) {
  const opts = { credentials: "include", ...options };
  const method = (opts.method || "GET").toUpperCase();
  const needsCsrf = ["POST", "PUT", "PATCH", "DELETE"].includes(method);

  const headers = new Headers(opts.headers || {});
  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  if (!headers.has("X-Requested-With")) headers.set("X-Requested-With", "XMLHttpRequest");

  if (needsCsrf) {
    let token = getCookie("csrftoken");
    if (!token) token = await ensureCsrf(true);
    headers.set("X-CSRFToken", token || "");
  }

  return fetch(`${url}`, { ...opts, headers });
}

/* ========== Auth API ========== */
async function apiLogin({ email, password }) {
  const res = await authFetch(`/api/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || data?.error || "Login failed");
  return data; // { message, user? }
}

async function apiRegister({ full_name, email, password }) {
  const res = await authFetch(`/api/auth/register/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ full_name, email, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || data?.error || "Registration failed");
  return data;
}

async function apiLogout() {
  await authFetch(`/api/auth/logout/`, { method: "POST" });
}

/* ========== whoAmI robuste (JSON only) ========== */
export async function whoAmI() {
  try {
    const res = await authFetch(`/api/auth/me/`, { method: "GET" });
    const ct = res.headers.get("content-type") || "";
    if (!res.ok || !ct.includes("application/json")) {
      return { authenticated: false, user: null, is_staff: false };
    }
    const data = await res.json();

    const rootLooksLikeUser =
      data && (data.id || data.email || data.username || data.full_name);
    const userRaw = data.user ?? (rootLooksLikeUser ? data : null);

    const authenticated = Boolean(
      data.authenticated ??
      data.is_authenticated ??
      (userRaw && (userRaw.id || userRaw.email || userRaw.username || userRaw.full_name))
    );

    let user = userRaw ?? (authenticated ? {} : null);
    const is_staff = Boolean(user?.is_staff ?? data.is_staff ?? false);

    if (user) {
      user = {
        id: user.id ?? null,
        email: user.email ?? null,
        username: user.username ?? null,
        full_name: user.full_name ?? null,
        role: user.role ?? null,
        is_staff,
      };
    }

    return { authenticated, user, is_staff };
  } catch {
    return { authenticated: false, user: null, is_staff: false };
  }
}

/* ========== Store d’auth minimal (pub/sub) ========== */
function normalizeUser(raw) {
  const obj = (raw && typeof raw === "object") ? raw : {};
  const {
    id = null, full_name = null, email = null, role = null,
    username = null, is_staff = false,
  } = obj;
  return { id, full_name, email, role, username, is_staff };
}

function getUserCached() {
  try { return JSON.parse(localStorage.getItem("auth_user") || "null"); }
  catch { return null; }
}
function setUserCached(user) {
  try { localStorage.setItem("auth_user", JSON.stringify(user)); } catch {}
}
function clearUserCached() {
  try { localStorage.removeItem("auth_user"); } catch {}
}

const listeners = new Set();
let authState = { user: getUserCached(), loading: true, isLoggingOut: false };

function notify() {
  for (const fn of Array.from(listeners)) { try { fn(authState); } catch {} }
}

export function subscribeAuth(listener) {
  listeners.add(listener);
  try { listener(authState); } catch {}
  return () => listeners.delete(listener);
}
export function getAuthState() { return authState; }

export async function refreshAuth() {
  if (authState.isLoggingOut) return;
  const wasLoading = authState.loading;
  authState = { ...authState, loading: true };
  if (!wasLoading) notify();
  try {
    const me = await whoAmI();
    if (me?.authenticated) {
      const user = normalizeUser(me.user ?? {});
      authState = { ...authState, user, loading: false };
      setUserCached(user);
    } else {
      authState = { ...authState, user: null, loading: false };
      clearUserCached();
    }
  } catch {
    authState = { ...authState, user: null, loading: false };
    clearUserCached();
  }
  notify();
}

export async function signInAuth({ email, password }) {
  const data = await apiLogin({ email, password });
  const user = normalizeUser(data.user ?? {});
  authState = { ...authState, user, loading: false };
  setUserCached(user);
  notify();
  return data;
}

export async function signOutAuth() {
  authState = { ...authState, isLoggingOut: true, user: null, loading: false };
  clearUserCached();
  notify();
  try { await apiLogout(); } catch {}
  await refreshAuth();
  authState = { ...authState, isLoggingOut: false };
  notify();
}

export async function initAuth() { await refreshAuth(); }

export function attachAuthAutoRefresh() {
  const onFocus = () => refreshAuth();
  const onVis = () => { if (document.visibilityState === "visible") refreshAuth(); };
  const onStorage = (e) => { if (e.key === "auth_user") refreshAuth(); };
  window.addEventListener("focus", onFocus);
  document.addEventListener("visibilitychange", onVis);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener("focus", onFocus);
    document.removeEventListener("visibilitychange", onVis);
    window.removeEventListener("storage", onStorage);
  };
}

/* ========== API profil (pour ProfilePage) ========== */
export async function updateProfileAuth({ full_name, email }) {
  const res = await authFetch(`/api/auth/update-profile/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ full_name, email }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || data?.message || "Update failed");

  // si l'API renvoie l'utilisateur, on met à jour le store
  if (data?.user) {
    const user = normalizeUser(data.user);
    authState = { ...authState, user, loading: false };
    setUserCached(user);
    notify();
  } else {
    await refreshAuth();
  }
  return data;
}

export async function changePasswordAuth({ current_password, new_password }) {
  const res = await authFetch(`/api/auth/change-password/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ current_password, new_password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || data?.message || "Password update failed");
  return data;
}

/* ========== Helper unifié de logout + redirection ========== */
export async function logoutAndRedirect(navigate, to = "/") {
  await signOutAuth();
  navigate(to, { replace: true, state: { flash: "Logout successful" } });
}

/* ========== Expose register pour l’UI ========== */
export const register = apiRegister;
