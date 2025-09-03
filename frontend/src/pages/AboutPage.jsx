import React from "react";

export default function AboutPage() {
  return (
    <main className="bg-white dark:bg-neutral-950">
      {/* Hero compact */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100">
        About <span className="text-blue-600">ChemPlatform</span>
        </h1>
        <p className="mt-3 text-gray-600 dark:text-gray-300 max-w-2xl">
        A modern platform for exploring, researching and managing chemical compounds:
        structures, properties, formulas, and more - with a fast, simple interface.
        </p>
      </section>

      {/* 3 colonnes */}
      <section className="max-w-6xl mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl ring-1 ring-gray-200 dark:ring-neutral-800 p-6 bg-gray-50 dark:bg-neutral-900">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Vision</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Making chemical information accessible and actionable for students, researchers
            and industry, from a simple glance to in-depth analysis.
            </p>
          </div>
          <div className="rounded-2xl ring-1 ring-gray-200 dark:ring-neutral-800 p-6 bg-gray-50 dark:bg-neutral-900">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Features</h3>
            <ul className="mt-2 space-y-2 text-sm text-gray-600 dark:text-gray-300 list-disc pl-5">
              <li>Search by name, formula, SMILES or properties</li>
              <li>Display key molecular properties</li>
              <li>Private management of your compounds</li>
            </ul>
          </div>
          <div className="rounded-2xl ring-1 ring-gray-200 dark:ring-neutral-800 p-6 bg-gray-50 dark:bg-neutral-900">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Technos</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              Frontend React + Tailwind. Backend Django (sessions, CSRF) + PostgreSQL. Design sobre, focus performance.
            </p>
          </div>
        </div>
      </section>

      {/* Callout */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="rounded-2xl p-6 ring-1 ring-blue-200/60 dark:ring-blue-900/60 bg-blue-50 dark:bg-blue-950/30">
          <p className="text-sm text-blue-900 dark:text-blue-200">
          Need a specific feature? Contact us and we'll add it to the roadmap.
          </p>
        </div>
      </section>
    </main>
  );
}
