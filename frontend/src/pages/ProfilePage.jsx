/* eslint-disable no-unused-vars */
// src/pages/ProfilePage.jsx
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  subscribeAuth,
  getAuthState,
  initAuth,
  whoAmI,
  updateProfileAuth,
  changePasswordAuth,
  logoutAndRedirect,   // ← helper unifié
} from "../services/auth";

export default function ProfilePage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Store global (avatar, etc.)
  const [auth, setAuth] = useState(() => getAuthState()); // { user, loading, ... }
  const { user, loading } = auth;

  // Gate locale pour éviter tout flash : on attend le verdict serveur
  const [gate, setGate] = useState("loading"); // 'loading' | 'authed' | 'guest'

  // État de vérif via bouton "Refresh"
  const [serverState, setServerState] = useState(null);
  const [checking, setChecking] = useState(false);

  // UI
  const [err, setErr] = useState("");
  const [notice, setNotice] = useState("");

  // Edition profil
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "" });

  // Change password
  const [pwd, setPwd] = useState({ current_password: "", new_password: "", confirm: "" });
  const [pwdBusy, setPwdBusy] = useState(false);

  // Abonnement au store + init
  useEffect(() => {
    const unsub = subscribeAuth(setAuth);
    initAuth(); // synchronise le store au montage
    return () => unsub();
  }, []);

  // Gate: on demande le verdict au serveur AVANT d'afficher
  useEffect(() => {
    let mounted = true;
    (async () => {
      const me = await whoAmI();
      if (!mounted) return;
      if (me.authenticated) {
        setGate("authed");
      } else {
        setGate("guest");
        navigate("/login", {
          replace: true,
          state: { requireAuth: true, from: location.pathname + location.search },
        });
      }
    })();
    return () => { mounted = false; };
  }, [navigate, location]);

  // Préremplir le formulaire d'édition quand l'user est dispo
  useEffect(() => {
    if (user) setForm({ full_name: user.full_name || "", email: user.email || "" });
  }, [user]);

  const refreshServer = async () => {
    setChecking(true);
    setErr(""); setNotice("");
    try {
      const res = await whoAmI(); // { authenticated, user? }
      setServerState(res);
    } catch (e) {
      setServerState({ authenticated: false, error: e?.message || "Unable to fetch" });
      setErr(e?.message || "Unable to fetch");
    } finally {
      setChecking(false);
    }
  };

  const whiteField =
    "rounded-md border border-gray-300 dark:border-gray-300 " +
    "bg-white dark:bg-white text-gray-900 dark:text-gray-900 " +
    "placeholder:text-gray-400 dark:placeholder:text-gray-500 " +
    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500";

  // Handlers
  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setErr(""); setNotice(""); setSaving(true);
    try {
      if (!form.full_name.trim()) throw new Error("Full name is required.");
      await updateProfileAuth({
        full_name: form.full_name.trim(),
        email: form.email.trim(),
      });
      setNotice("✅ Profile updated.");
      setEditMode(false);
    } catch (e) {
      setErr(e.message || "Update failed.");
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setErr(""); setNotice(""); setPwdBusy(true);
    try {
      if (!pwd.current_password || !pwd.new_password) throw new Error("Both password fields are required.");
      if (pwd.new_password.length < 6) throw new Error("New password must be at least 6 characters.");
      if (pwd.new_password !== pwd.confirm) throw new Error("Passwords do not match.");
      await changePasswordAuth({ current_password: pwd.current_password, new_password: pwd.new_password });
      setNotice("✅ Password updated.");
      setPwd({ current_password: "", new_password: "", confirm: "" });
    } catch (e) {
      setErr(e.message || "Password update failed.");
    } finally {
      setPwdBusy(false);
    }
  };

  // UI states
  if (gate === "loading") {
    return (
      <main className="bg-white dark:bg-neutral-950 min-h-[60vh] grid place-items-center">
        <p className="text-sm text-gray-500">Checking authentication…</p>
      </main>
    );
  }
  if (gate === "guest") {
    return (
      <main className="bg-white dark:bg-neutral-950 min-h-[60vh] grid place-items-center">
        <p className="text-sm text-gray-500">Redirecting to login…</p>
      </main>
    );
  }

  const u = user || {};
  const displayName =
    u.full_name || u.username || u.email || (u.id ? `User #${u.id}` : "Profile");

  return (
    <main className="bg-white dark:bg-neutral-950">
      <section className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My profile</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setEditMode(v => !v); setErr(""); setNotice(""); }}
              className="inline-flex items-center rounded-md bg-blue-600 text-white px-3 py-2 text-sm hover:bg-blue-700"
            >
              {editMode ? "Close" : "Edit"}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center rounded-md bg-gray-200 dark:bg-neutral-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm"
              aria-label="Close profile page"
              title="Close"
            >
              Close
            </button>
            <button
              onClick={async () => {
                try {
                  await logoutAndRedirect(navigate, "/");
                } catch (e) {
                  setErr(e.message || "Logout failed.");
                }
              }}
              className="inline-flex items-center rounded-md bg-gray-900/90 dark:bg-gray-200 text-white dark:text-gray-900 px-3 py-2 text-sm hover:opacity-90"
            >
              Logout
            </button>
          </div>
        </div>

        {notice && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800 dark:border-green-800/60 dark:bg-green-900/20 dark:text-green-200">
            {notice}
          </div>
        )}
        {err && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-800/60 dark:bg-red-900/20 dark:text-red-200">
            {err}
          </div>
        )}

        <div className="rounded-2xl ring-1 ring-gray-200 dark:ring-neutral-800 p-6 bg-gray-50 dark:bg-neutral-900">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Infos utilisateur */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Informations</h2>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex gap-2">
                  <dt className="w-32 text-gray-500 dark:text-gray-400">Name</dt>
                  <dd className="text-gray-900 dark:text-gray-100">{displayName}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-32 text-gray-500 dark:text-gray-400">Email</dt>
                  <dd className="text-gray-900 dark:text-gray-100">{u.email ?? "—"}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-32 text-gray-500 dark:text-gray-400">Role</dt>
                  <dd className="text-gray-900 dark:text-gray-100">{u.role ?? "—"}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-32 text-gray-500 dark:text-gray-400">ID</dt>
                  <dd className="text-gray-900 dark:text-gray-100">{u.id ?? "—"}</dd>
                </div>
              </dl>

              {/* Etat serveur */}
              <div className="mt-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Session</h2>
                <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
                  Server side State (via <code>/api/auth/me</code>).
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={refreshServer}
                    disabled={checking}
                    className={`inline-flex items-center rounded-md px-3 py-2 text-sm text-white ${
                      checking ? "bg-blue-600/70" : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    {checking ? "Checking…" : "Refresh"}
                  </button>
                  {serverState && (
                    <span
                      className={`text-sm ${
                        serverState.authenticated ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {serverState.authenticated ? "Authenticated ✅" : "Not authenticated"}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Edition du profil (toggle via bouton Edit) */}
            <div>
              {editMode ? (
                <form onSubmit={saveProfile} className="rounded-xl ring-1 ring-gray-200 dark:ring-neutral-800 p-4 bg-white dark:bg-neutral-800">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">Edit profile</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Full name *</label>
                      <input
                        name="full_name"
                        value={form.full_name}
                        onChange={onChange}
                        className={`mt-1 w-full px-3 py-2 text-sm ${whiteField}`}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Email</label>
                      <input
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={onChange}
                        className={`mt-1 w-full px-3 py-2 text-sm ${whiteField}`}
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-3">
                    <button
                      type="submit"
                      disabled={saving}
                      className={`inline-flex items-center rounded-md px-4 py-2 text-sm text-white ${
                        saving ? "bg-blue-600/70" : "bg-blue-600 hover:bg-blue-700"
                      }`}
                    >
                      {saving ? "Saving…" : "Save changes"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditMode(false)}
                      className="inline-flex items-center rounded-md bg-gray-200 dark:bg-neutral-700 text-gray-900 dark:text-gray-100 px-4 py-2 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="rounded-xl ring-1 ring-gray-200 dark:ring-neutral-800 p-4 bg-white dark:bg-neutral-800">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Click on <strong>Edit</strong> to modify your information.
                  </p>
                </div>
              )}

              {/* Change password */}
              <div className="mt-6 rounded-xl ring-1 ring-gray-200 dark:ring-neutral-800 p-4 bg-white dark:bg-neutral-800">
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">Change password</h3>
                <form onSubmit={changePassword} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Current password</label>
                    <input
                      type="password"
                      value={pwd.current_password}
                      onChange={(e)=>setPwd(p=>({...p, current_password: e.target.value}))}
                      className={`mt-1 w-full px-3 py-2 text-sm ${whiteField}`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">New password</label>
                    <input
                      type="password"
                      value={pwd.new_password}
                      onChange={(e)=>setPwd(p=>({...p, new_password: e.target.value}))}
                      className={`mt-1 w-full px-3 py-2 text-sm ${whiteField}`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Confirm</label>
                    <input
                      type="password"
                      value={pwd.confirm}
                      onChange={(e)=>setPwd(p=>({...p, confirm: e.target.value}))}
                      className={`mt-1 w-full px-3 py-2 text-sm ${whiteField}`}
                    />
                  </div>
                  <div className="md:col-span-3">
                    <button
                      type="submit"
                      disabled={pwdBusy}
                      className={`inline-flex items-center rounded-md px-4 py-2 text-sm text-white ${
                        pwdBusy ? "bg-blue-600/70" : "bg-blue-600 hover:bg-blue-700"
                      }`}
                    >
                      {pwdBusy ? "Updating…" : "Update password"}
                    </button>
                  </div>
                </form>
              </div>
            </div>

          </div>
        </div>
      </section>
    </main>
  );
}
