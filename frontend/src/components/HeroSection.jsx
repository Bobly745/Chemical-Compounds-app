import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const HeroSection = () => {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  // Handle search form submit
  const handleSubmit = (e) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <section
      className="relative h-[520px] md:h-[620px] bg-cover bg-center"
      style={{ backgroundImage: "url(/images/lab-banner.jpg)" }}
      role="banner"
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60" />


      {/* Main content with horizontal padding */}
      <div className="relative z-10 w-full h-full flex items-center justify-center px-4">
        <div className="w-full max-w-3xl text-center">
          <h1 className="text-white font-bold leading-tight text-3xl sm:text-4xl md:text-5xl">
            Discover the properties, structures and formulas of thousands of chemical compounds
          </h1>

          {/* Search form */}
          <form
            onSubmit={handleSubmit}
            className="mt-6 mx-auto flex w-full max-w-2xl gap-2"
            role="search"
          >
            <label htmlFor="compound-search" className="sr-only">
              Search for a compound by name or formula
            </label>
            <input
              id="compound-search"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or formula (e.g., H2O, Glucose...)"
              aria-label="Search for a compound by name or formula"
              className="flex-1 rounded-md border border-white/20 bg-white/90 backdrop-blur px-4 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoComplete="off"
            />
            <button
              type="submit"
              className="shrink-0 rounded-md px-5 py-2 bg-blue-600 text-white font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Search
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
