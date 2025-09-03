// src/components/Navbar.jsx
import React, { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  subscribeAuth, getAuthState, initAuth, attachAuthAutoRefresh,
  logoutAndRedirect
} from "../services/auth";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [state, setState] = useState(() => getAuthState());
  const { user, loading } = state;

  const [openMobile, setOpenMobile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // S’abonner au store + init + auto-refresh (focus/visibility/storage)
  useEffect(() => {
    const unsub = subscribeAuth(setState);
    initAuth();
    const detach = attachAuthAutoRefresh();
    return () => { unsub(); detach(); };
  }, []);

  // Fermer menus sur changement de route
  useEffect(() => { setOpenMobile(false); setMenuOpen(false); }, [location.pathname]);

  // Fermer le menu compte si clic à l'extérieur
  useEffect(() => {
    const onDocClick = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // Fermer le menu mobile quand on repasse en desktop
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setOpenMobile(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Déconnexion (message unifié)
  const onLogout = async () => {
    await logoutAndRedirect(navigate, "/");
  };

  const linkBase = "inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition";
  const linkActive = "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-neutral-800";
  const linkInactive = "text-gray-700 hover:text-gray-900 dark:text-gray-200 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-neutral-800";

  const label = user ? (user.full_name || user.email || String(user)) : "";
  const initials = (label ? label.charAt(0) : "?").toUpperCase();
  const isAdmin = !!(user && (user.is_staff || user.role === "admin"));

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200/80 dark:border-neutral-800/80 bg-white/80 dark:bg-neutral-900/70 backdrop-blur">
      <nav className="max-w-6xl mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-full bg-blue-600" aria-hidden="true" />
            <span className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">ChemPlatform</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            <NavLink to="/" end className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>Home</NavLink>
            <NavLink to="/about" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>About</NavLink>
            <NavLink to="/advanced-search" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>Advanced Search</NavLink>
            <NavLink to="/compounds" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>Compounds</NavLink>
          </div>

          {/* Right zone: Login ou Avatar + menu */}
          <div className="hidden md:flex items-center">
            {loading ? null : !user ? (
              <NavLink
                to="/login"
                className={({ isActive }) =>
                  `${linkBase} ${isActive ? linkActive : "bg-blue-600 text-white hover:bg-blue-700"} ml-2`
                }
              >
                Login
              </NavLink>
            ) : (
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen(v => !v)}
                  className="inline-flex items-center gap-2 rounded-full ring-1 ring-gray-200 dark:ring-neutral-700 px-2 py-1 hover:bg-gray-100 dark:hover:bg-neutral-800 focus:outline-none"
                  aria-haspopup="menu" aria-expanded={menuOpen}
                >
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white text-sm font-semibold">
                    {initials}
                  </span>
                  <span className="hidden sm:block text-sm text-gray-800 dark:text-gray-100">
                    {user.full_name || user.email}
                  </span>
                </button>

                {menuOpen && (
                  <div role="menu" className="absolute right-0 mt-2 w-48 rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-lg p-1">
                    <Link
                      to="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="block rounded-md px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-800"
                      role="menuitem"
                    >
                      Profile
                    </Link>

                    {isAdmin && (
                      <Link
                        to="/administrator"
                        onClick={() => setMenuOpen(false)}
                        className="block rounded-md px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-800"
                        role="menuitem"
                      >
                        Administrator
                      </Link>
                    )}

                    <button
                      onClick={onLogout}
                      className="w-full text-left block rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                      role="menuitem"
                    >
                      Log out
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile toggler */}
          <div className="md:hidden">
            <button
              type="button"
              onClick={() => setOpenMobile(v => !v)}
              className="inline-flex items-center justify-center rounded-md p-2 ring-1 ring-gray-200 dark:ring-neutral-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-controls="mobile-menu" aria-expanded={openMobile} aria-label="Toggle menu"
            >
              <span className="sr-only">Open main menu</span>
              <span className={`block h-0.5 w-5 ${openMobile ? "bg-transparent" : "bg-current"} transition`} />
              <span className={`block h-0.5 w-5 mt-1 ${openMobile ? "bg-transparent" : "bg-current"} transition`} />
              <span className={`block h-0.5 w-5 mt-1 ${openMobile ? "bg-transparent" : "bg-current"} transition`} />
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {openMobile && (
          <div id="mobile-menu" className="md:hidden pb-3">
            <div className="flex flex-col gap-1 pt-2">
              <NavLink to="/" end onClick={() => setOpenMobile(false)} className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>Home</NavLink>
              <NavLink to="/about" onClick={() => setOpenMobile(false)} className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>About</NavLink>
              <NavLink to="/advanced-search" onClick={() => setOpenMobile(false)} className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>Advanced Search</NavLink>
              <NavLink to="/compounds" onClick={() => setOpenMobile(false)} className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>Compounds</NavLink>

              {isAdmin && (
                <NavLink to="/administrator" onClick={() => setOpenMobile(false)} className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>
                  Administrator
                </NavLink>
              )}

              {!loading && (!user ? (
                <NavLink to="/login" onClick={() => setOpenMobile(false)} className={({ isActive }) => `${linkBase} ${isActive ? linkActive : "bg-blue-600 text-white hover:bg-blue-700"}`}>
                  Login
                </NavLink>
              ) : (
                <>
                  <Link to="/profile" onClick={() => setOpenMobile(false)} className={`${linkBase} ${linkInactive}`}>Profile</Link>
                  <button
                    onClick={async () => { setOpenMobile(false); await onLogout(); }}
                    className="inline-flex items-center px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                  >
                    Log out
                  </button>
                </>
              ))}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
