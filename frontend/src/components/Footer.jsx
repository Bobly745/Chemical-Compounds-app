import React from "react";
import { Link, NavLink } from "react-router-dom";
import { FiGithub, FiTwitter, FiMail, FiChevronUp } from "react-icons/fi";

export default function Footer() {
  const year = new Date().getFullYear();

  // Smooth scroll to top
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const linkBase =
    "inline-flex items-center gap-1 text-sm font-medium transition " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded";
  const linkMuted =
    "text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white";

  return (
    <footer
      className="border-t border-gray-200 dark:border-neutral-800 bg-gradient-to-b from-gray-50 to-white dark:from-neutral-900 dark:to-neutral-950 shadow-inner"
      aria-labelledby="site-footer"
    >
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Top area: brand + nav + contact */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand / short description */}
          <div>
            <Link to="/" className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-full bg-blue-600" aria-hidden="true" />
              <span className="text-lg font-bold text-gray-900 dark:text-gray-100">ChemPlatform</span>
            </Link>
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
              Explore, search and understand chemical compounds with modern tools for
              structures, properties and advanced queries.
            </p>

            {/* Socials */}
            <div className="mt-4 flex items-center gap-3">
              {/* Replace href values with your real URLs */}
              <a
                href="#"
                className={`${linkBase} ${linkMuted} p-2 ring-1 ring-transparent hover:bg-gray-100 dark:hover:bg-neutral-800`}
                aria-label="GitHub"
              >
                <FiGithub className="h-5 w-5" />
              </a>
              <a
                href="#"
                className={`${linkBase} ${linkMuted} p-2 ring-1 ring-transparent hover:bg-gray-100 dark:hover:bg-neutral-800`}
                aria-label="Twitter"
              >
                <FiTwitter className="h-5 w-5" />
              </a>
              <a
                href="mailto:contact@chemplatform.dev"
                className={`${linkBase} ${linkMuted} p-2 ring-1 ring-transparent hover:bg-gray-100 dark:hover:bg-neutral-800`}
                aria-label="Email"
              >
                <FiMail className="h-5 w-5" />
                <span className="sr-only">Email</span>
              </a>
            </div>
          </div>

          {/* Quick links */}
          <nav aria-label="Footer" className="md:justify-self-center">
            <h3 id="site-footer" className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Quick links
            </h3>
            <ul className="mt-3 space-y-2">
              <li>
                <NavLink to="/" end className={({ isActive }) =>
                  `${linkBase} ${linkMuted} ${isActive ? "text-blue-600 dark:text-blue-400" : ""}`
                }>
                  Home
                </NavLink>
              </li>
              <li>
                <NavLink to="/about" className={({ isActive }) =>
                  `${linkBase} ${linkMuted} ${isActive ? "text-blue-600 dark:text-blue-400" : ""}`
                }>
                  About
                </NavLink>
              </li>
              <li>
                <NavLink to="/advanced-search" className={({ isActive }) =>
                  `${linkBase} ${linkMuted} ${isActive ? "text-blue-600 dark:text-blue-400" : ""}`
                }>
                  Advanced Search
                </NavLink>
              </li>
              <li>
                <NavLink to="/compounds" className={({ isActive }) =>
                  `${linkBase} ${linkMuted} ${isActive ? "text-blue-600 dark:text-blue-400" : ""}`
                }>
                  Compounds
                </NavLink>
              </li>
              <li>
                <NavLink to="/profile" className={({ isActive }) =>
                  `${linkBase} ${linkMuted} ${isActive ? "text-blue-600 dark:text-blue-400" : ""}`
                }>
                  Profile
                </NavLink>
              </li>
            </ul>
          </nav>

          {/* Contact / small CTA */}
          <div className="md:justify-self-end">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Contact</h3>
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
              Email: <a href="mailto:contact@chemplatform.dev" className="underline">contact@chemplatform.dev</a>
            </p>
            <button
              type="button"
              onClick={scrollToTop}
              className="mt-4 inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium
                         text-gray-700 dark:text-gray-200 ring-1 ring-gray-200 dark:ring-neutral-700
                         hover:bg-gray-100 dark:hover:bg-neutral-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-label="Back to top"
            >
              <FiChevronUp className="h-4 w-4" />
              Back to top
            </button>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-gray-200 dark:border-neutral-800 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            © {year} ChemPlatform. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs">
            <Link to="/privacy" className={`${linkBase} ${linkMuted}`}>Privacy</Link>
            <Link to="/terms" className={`${linkBase} ${linkMuted}`}>Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
