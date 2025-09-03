// src/pages/AuthPage.jsx
import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { signInAuth, register as registerUser, whoAmI } from "../services/auth";

// Simple email validation
const isValidEmail = (val) => /\S+@\S+\.\S+/.test(val);

export default function AuthPage({ initialTab = "login" }) {
  const navigate = useNavigate();
  const location = useLocation();

  // from: string (ex: "/advanced-search?x=1")
  const redirectTo = location.state?.from || "/";

  // UI helper: consistent input styling (lighter palette; soft focus ring)
  const fieldClass =
    "mt-1 w-full rounded-md border border-slate-300 dark:border-neutral-600 " +
    "bg-white dark:bg-neutral-800 px-3 py-2 text-slate-800 dark:text-slate-100 " +
    "placeholder:text-slate-400 dark:placeholder:text-slate-400 " +
    "focus:outline-none focus:ring-2 focus:ring-sky-400/50 focus:border-sky-400 " +
    "transition";

  const [tab, setTab] = useState(initialTab === "register" ? "register" : "login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(
    location.state?.requireAuth ? "Please login to access this page." : ""
  );

  // If already authenticated, redirect to `redirectTo`
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const me = await whoAmI();
        if (mounted && me?.authenticated) navigate(redirectTo, { replace: true });
      } catch (err) {
        void err;
      }
    })();
    return () => {
      mounted = false;
    };
  }, [navigate, redirectTo]);

  // --- LOGIN
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setNotice("");
    if (!isValidEmail(email)) return setError("Please enter a valid email address.");
    if (!password || password.length < 6)
      return setError("Password must be at least 6 characters.");

    setLoading(true);
    try {
      await signInAuth({ email, password }); // notify Navbar immediately
      navigate(redirectTo, { replace: true, state: { flash: "Successful connection." } });
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // --- REGISTER
  const [fullName, setFullName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setNotice("");
    if (!fullName.trim()) return setError("Full name is required.");
    if (!isValidEmail(regEmail)) return setError("Please enter a valid email address.");
    if (!regPassword || regPassword.length < 6)
      return setError("Password must be at least 6 characters.");

    setLoading(true);
    try {
      await registerUser({
        full_name: fullName.trim(),
        email: regEmail.trim(),
        password: regPassword,
      });
      setNotice("🎉 Account created successfully. You can now log in.");
      setTab("login");
      setEmail(regEmail.trim());
      setPassword("");
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[70vh] bg-gradient-to-b from-sky-50 to-white dark:from-neutral-800 dark:to-neutral-900">
      <div className="max-w-md mx-auto px-4 py-12">
        <header className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Welcome to ChemPlatform
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Sign in or create your account.
          </p>
        </header>

        {/* Tabs */}
        <div className="mb-4 grid grid-cols-2 rounded-xl ring-1 ring-slate-200 dark:ring-neutral-700 overflow-hidden bg-slate-100/60 dark:bg-neutral-800/50">
          <button
            type="button"
            onClick={() => {
              setTab("login");
              setError("");
              setNotice("");
            }}
            className={`py-2 text-sm font-medium transition ${
              tab === "login"
               ? "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
               : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("register");
              setError("");
              setNotice("");
            }}
            className={`py-2 text-sm font-medium transition ${
              tab === "register"
                ? "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
            }`}
          >
            Create account
          </button>
        </div>

        {/* Messages */}
        {notice && (
          <div className="mb-4 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-800 dark:border-sky-800/60 dark:bg-sky-900/20 dark:text-sky-200">
            {notice}
          </div>
        )}
        {error && (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800 dark:border-rose-800/60 dark:bg-rose-900/20 dark:text-rose-200">
            {error}
          </div>
        )}

        <div className="rounded-2xl bg-white dark:bg-neutral-800 ring-1 ring-slate-200 dark:ring-neutral-700 p-6 shadow-md">
          {tab === "login" ? (
            <form onSubmit={handleLogin} noValidate>
              <div className="mb-4">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-200"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={fieldClass}
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div className="mb-4">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-200"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={fieldClass}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full inline-flex items-center justify-center rounded-md px-4 py-2 text-white font-medium transition ${
                  loading
                    ? "bg-sky-500/70"
                    : "bg-sky-500 hover:bg-sky-600 active:bg-sky-700"
                }`}
              >
                {loading ? "Signing in…" : "Sign in"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} noValidate>
              <div className="mb-4">
                <label
                  htmlFor="full_name"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-200"
                >
                  Full name
                </label>
                <input
                  id="full_name"
                  type="text"
                  autoComplete="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={fieldClass}
                  placeholder="Ada Lovelace"
                  required
                />
              </div>
              <div className="mb-4">
                <label
                  htmlFor="reg_email"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-200"
                >
                  Email
                </label>
                <input
                  id="reg_email"
                  type="email"
                  autoComplete="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className={fieldClass}
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div className="mb-6">
                <label
                  htmlFor="reg_password"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-200"
                >
                  Password
                </label>
                <input
                  id="reg_password"
                  type="password"
                  autoComplete="new-password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className={fieldClass}
                  placeholder="At least 6 characters"
                  required
                  minLength={6}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full inline-flex items-center justify-center rounded-md px-4 py-2 text-white font-medium transition ${
                  loading
                    ? "bg-sky-500/70"
                    : "bg-sky-500 hover:bg-sky-600 active:bg-sky-700"
                }`}
              >
                {loading ? "Creating account…" : "Create account"}
              </button>
            </form>
          )}
        </div>

        <div className="mt-6 text-center">
          <Link to="/" className="text-sm text-slate-700 dark:text-slate-300 underline">
            ← Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
