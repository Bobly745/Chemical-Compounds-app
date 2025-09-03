// src/pages/HomePage.jsx
import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import HeroSection from "../components/HeroSection";
import FeatureSection from "../components/FeatureSection";
// (Optionnel) import Footer from "../components/Footer";

export default function HomePage() {
  const location = useLocation();
  const [flash, setFlash] = useState(location.state?.flash || "");

  // Disparition auto du flash après 2.5s
  useEffect(() => {
    if (!flash) return;
    const id = setTimeout(() => setFlash(""), 2500);
    return () => clearTimeout(id);
  }, [flash]);

  return (
    <main className="bg-white dark:bg-neutral-950">
      {/* Flash message aligné aux marges horizontales du site */}
      {flash && (
        <div className="max-w-6xl mx-auto px-4 pt-4">
          <div
            className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700 dark:border-green-800 dark:bg-green-950/40 dark:text-green-300"
            role="status"
            aria-live="polite"
          >
            {flash}
          </div>
        </div>
      )}

      {/* Sections sans marge verticale externe ; Hero en pleine largeur */}
      <HeroSection />
      <FeatureSection />
      {/* <Footer /> */}
    </main>
  );
}
