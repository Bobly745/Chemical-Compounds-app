// src/pages/AdvancedSearchPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { authFetch } from "../services/auth";

export default function AdvancedSearchPage() {
  const [base, setBase] = useState([]);     // private dataset
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Filters
  const [name, setName] = useState("");
  const [formula, setFormula] = useState("");
  const [smiles, setSmiles] = useState("");
  const [mwMin, setMwMin] = useState("");
  const [mwMax, setMwMax] = useState("");
  const [desc, setDesc] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const res = await authFetch("/api/compounds/private/");
        const data = await res.json();
        const list =
          Array.isArray(data) ? data :
          Array.isArray(data?.results) ? data.results :
          Array.isArray(data?.compounds) ? data.compounds : [];
        if (mounted) setBase(list);
      } catch {
        setErr("Failed to load Compounds.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Force white inputs in both themes
  const whiteField =
    "rounded-md border border-gray-300 dark:border-gray-300 " +
    "bg-white dark:bg-white text-gray-900 dark:text-gray-900 " +
    "placeholder:text-gray-400 dark:placeholder:text-gray-500 " +
    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500";

  const results = useMemo(() => {
    const n = name.trim().toLowerCase();
    const f = formula.trim().toLowerCase();
    const s = smiles.trim().toLowerCase();
    const d = desc.trim().toLowerCase();
    const min = mwMin === "" ? -Infinity : Number(mwMin);
    const max = mwMax === "" ? Infinity : Number(mwMax);

    return base.filter((c) => {
      const nm   = (c.name || "").toLowerCase();
      const fm   = (c.formula || "").toLowerCase();
      const sm   = (c.smiles || "").toLowerCase();
      const dd   = (c.description || "").toLowerCase();
      const mw   = Number(c.molecular_weight ?? NaN);

      if (n && !nm.includes(n)) return false;
      if (f && !fm.includes(f)) return false;
      if (s && !sm.includes(s)) return false;
      if (d && !dd.includes(d)) return false;
      if (!Number.isNaN(mw)) {
        if (mw < min) return false;
        if (mw > max) return false;
      } else {
        // if filtering by weight, exclude unknowns
        if (mwMin !== "" || mwMax !== "") return false;
      }
      return true;
    });
  }, [base, name, formula, smiles, desc, mwMin, mwMax]);

  const reset = () => {
    setName(""); setFormula(""); setSmiles("");
    setMwMin(""); setMwMax(""); setDesc("");
  };

  return (
    <main className="bg-white dark:bg-neutral-950">
      <section className="max-w-6xl mx-auto px-4 py-6">
        <header className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Advanced Search</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Combine several criteria (name, formula, SMILES, mass range, description).
          </p>
        </header>

        {/* Filters */}
        <div className="rounded-2xl ring-1 ring-gray-200 dark:ring-neutral-800 p-4 bg-gray-50 dark:bg-neutral-900 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              value={name}
              onChange={(e)=>setName(e.target.value)}
              placeholder="Name (eg: Glucose)"
              className={`px-3 py-2 text-sm ${whiteField}`}
            />
            <input
              value={formula}
              onChange={(e)=>setFormula(e.target.value)}
              placeholder="Formula (eg: C6H12O6)"
              className={`px-3 py-2 text-sm ${whiteField}`}
            />
            <input
              value={smiles}
              onChange={(e)=>setSmiles(e.target.value)}
              placeholder="SMILES"
              className={`px-3 py-2 text-sm ${whiteField}`}
            />
            <div className="flex gap-2">
              <input
                value={mwMin}
                onChange={(e)=>setMwMin(e.target.value)}
                placeholder="Min. mass"
                className={`w-1/2 px-3 py-2 text-sm ${whiteField}`}
                type="number" min="0" step="0.01"
              />
              <input
                value={mwMax}
                onChange={(e)=>setMwMax(e.target.value)}
                placeholder="Max. mass"
                className={`w-1/2 px-3 py-2 text-sm ${whiteField}`}
                type="number" min="0" step="0.01"
              />
            </div>
            <input
              value={desc}
              onChange={(e)=>setDesc(e.target.value)}
              placeholder="Description contains…"
              className={`md:col-span-2 px-3 py-2 text-sm ${whiteField}`}
            />
          </div>

          <div className="mt-3 flex gap-2">
            <button
              onClick={() => {}}
              className="inline-flex items-center rounded-md bg-blue-600 text-white px-4 py-2 text-sm hover:bg-blue-700"
            >
              Search
            </button>
            <button
              onClick={reset}
              className="inline-flex items-center rounded-md bg-gray-200 dark:bg-neutral-800 text-gray-900 dark:text-gray-100 px-4 py-2 text-sm"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="rounded-2xl ring-1 ring-gray-200 dark:ring-neutral-800 p-6">
            <p className="text-sm text-gray-600 dark:text-gray-300">Loading…</p>
          </div>
        ) : err ? (
          <div className="rounded-2xl ring-1 ring-red-200 dark:ring-red-800 p-6 bg-red-50 dark:bg-red-950/30">
            <p className="text-sm text-red-700 dark:text-red-300">{err}</p>
          </div>
        ) : results.length === 0 ? (
          <div className="rounded-2xl ring-1 ring-gray-200 dark:ring-neutral-800 p-6">
            <p className="text-sm text-gray-600 dark:text-gray-300">No results with these criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl ring-1 ring-gray-200 dark:ring-neutral-800">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 dark:bg-neutral-900 text-gray-700 dark:text-gray-200">
                <tr>
                  <th className="text-left px-4 py-3">Name</th>
                  <th className="text-left px-4 py-3">Molecular Formula</th>
                  <th className="text-left px-4 py-3">SMILES</th>
                  <th className="text-right px-4 py-3">Molecular Weight (g/mol)</th>
                  <th className="text-right px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-neutral-800">
                {results.map((c) => (
                  <tr key={c.id ?? `${c.name}-${c.formula}`}>
                    <td className="px-4 py-3 text-gray-900 dark:text-gray-100 font-medium">{c.name}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{c.formula}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200 truncate max-w-[320px]">{c.smiles}</td>
                    <td className="px-4 py-3 text-right text-gray-900 dark:text-gray-100">
                      {c.molecular_weight ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {c.id ? (
                        <Link
                          to={`/compounds/${c.id}`}
                          className="inline-flex items-center rounded-md bg-gray-900/80 dark:bg-gray-200 text-white dark:text-gray-900 px-3 py-1.5 text-xs hover:opacity-90"
                        >
                          Details
                        </Link>
                      ) : (
                        <span className="text-xs text-gray-400">No ID</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
