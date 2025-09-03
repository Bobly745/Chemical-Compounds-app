import React, { useEffect, useMemo, useState } from "react";
import { authFetch } from "../services/auth";
import { Link } from "react-router-dom";


export default function CompoundsPage() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("name_asc");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let mounted = true;
    // inputs must stay white: handled in classes below
    (async () => {
      setLoading(true);
      setErr("");
      try {
        // private endpoint (protected page)
        const res = await authFetch("/api/compounds/private/");
        const data = await res.json();
        const list =
          Array.isArray(data) ? data :
          Array.isArray(data?.results) ? data.results :
          Array.isArray(data?.compounds) ? data.compounds : [];
        if (mounted) setItems(list);
      } catch {
        setErr("Unable to load compounds.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const filtered = useMemo(() => {
    const text = q.trim().toLowerCase();
    let arr = items.filter((c) => {
      const name = (c.name || "").toLowerCase();
      const formula = (c.formula || "").toLowerCase();
      const smiles = (c.smiles || "").toLowerCase();
      return !text || name.includes(text) || formula.includes(text) || smiles.includes(text);
    });
    switch (sort) {
      case "mw_asc":  arr = arr.sort((a,b)=>(a.molecular_weight??0)-(b.molecular_weight??0)); break;
      case "mw_desc": arr = arr.sort((a,b)=>(b.molecular_weight??0)-(a.molecular_weight??0)); break;
      case "name_desc": arr = arr.sort((a,b)=>String(b.name||"").localeCompare(String(a.name||""))); break;
      default: arr = arr.sort((a,b)=>String(a.name||"").localeCompare(String(b.name||""))); // name_asc
    }
    return arr;
  }, [items, q, sort]);

  // Shared white field styles (forced white in both themes)
  const whiteField =
    "rounded-md border border-gray-300 dark:border-gray-300 " +
    "bg-white dark:bg-white text-gray-900 dark:text-gray-900 " +
    "placeholder:text-gray-400 dark:placeholder:text-gray-500 " +
    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500";

  return (
    <main className="bg-white dark:bg-neutral-950">
      <section className="max-w-6xl mx-auto px-4 py-6">
        <header className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Compounds</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            List of compounds. Use search and sort to filter quickly.
          </p>
        </header>
        <div className="mb-4 flex justify-end">
          <Link
            to="/add-compound"
            className="inline-flex items-center rounded-md bg-blue-600 text-white px-4 py-2 text-sm hover:bg-blue-700"
            title="Add a new compound">
            + Add Compound
          </Link>
        </div>
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search (name, formula, SMILES)…"
            className={`flex-1 px-3 py-2 text-sm ${whiteField}`}
          />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className={`w-full sm:w-56 px-3 py-2 text-sm ${whiteField}`}
          >
            <option value="name_asc">Name (A→Z)</option>
            <option value="name_desc">Name (Z→A)</option>
            <option value="mw_asc">Molecular Weight (↑)</option>
            <option value="mw_desc">Molecular Weight (↓)</option>
          </select>
        </div>

        {/* Content */}
        {loading ? (
          <div className="rounded-2xl ring-1 ring-gray-200 dark:ring-neutral-800 p-6">
            <p className="text-sm text-gray-600 dark:text-gray-300">Loading…</p>
          </div>
        ) : err ? (
          <div className="rounded-2xl ring-1 ring-red-200 dark:ring-red-800 p-6 bg-red-50 dark:bg-red-950/30">
            <p className="text-sm text-red-700 dark:text-red-300">{err}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl ring-1 ring-gray-200 dark:ring-neutral-800 p-6">
            <p className="text-sm text-gray-600 dark:text-gray-300">No results.</p>
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
                  <th className="text-right px-4 py-3">Actions</th> {/* NEW */}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-neutral-800">
                {filtered.map((c) => (
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
