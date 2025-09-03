/* eslint-disable no-unused-vars */
import React from "react";
import { FiSearch, FiDatabase, FiBarChart2 } from "react-icons/fi";

// Default features
const DEFAULT_FEATURES = [
  {
    id: "search",
    title: "Advanced search",
    desc: "Search by name, formula, SMILES or properties.",
    Icon: FiSearch,
    accent: "text-blue-600 dark:text-blue-400"
  },
  {
    id: "structures",
    title: "Molecular structures",
    desc: "View 3D structures and detailed representations.",
    Icon: FiDatabase,
    accent: "text-green-600 dark:text-green-400"
  },
  {
    id: "properties",
    title: "Rich properties",
    desc: "Access molecular weight, descriptions and more.",
    Icon: FiBarChart2,
    accent: "text-purple-600 dark:text-purple-400"
  }
];

export default function FeatureSection({ items = DEFAULT_FEATURES }) {
  return (
    <section
      className="bg-gradient-to-b from-gray-50 to-white dark:from-neutral-800 dark:to-neutral-900 py-16 border-t border-gray-200 dark:border-neutral-700 shadow-inner"
      aria-labelledby="features-heading"
    >
      {/* Container with horizontal padding */}
      <div className="max-w-6xl mx-auto px-4 text-center">
        <header className="max-w-3xl mx-auto">
          <h2
            id="features-heading"
            className="text-3xl font-bold mb-3 text-gray-900 dark:text-gray-100"
          >
            Key features
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-10">
            Explore chemical compounds like never before. Search, visualize and
            understand the molecular world with a modern and intuitive platform.
          </p>
        </header>

        {/* Feature grid */}
        <ul className="grid grid-cols-1 md:grid-cols-3 gap-6" role="list">
          {items.map(({ id, title, desc, Icon, accent }) => (
            <li
              key={id}
              role="listitem"
              className="bg-white dark:bg-neutral-700 rounded-2xl p-6 shadow transition hover:shadow-md focus-within:shadow-md ring-1 ring-gray-200 dark:ring-neutral-700"
            >
              <div
                className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-50 dark:bg-neutral-600 shadow mb-4"
                aria-hidden="true"
              >
                <Icon className={`w-6 h-6 ${accent}`} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm mt-2">
                {desc}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
