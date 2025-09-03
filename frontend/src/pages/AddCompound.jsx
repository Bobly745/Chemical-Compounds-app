// src/pages/AddCompound.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authFetch } from "../services/auth";

export default function AddCompound() {
  const navigate = useNavigate();

  // Force white inputs in both themes
  const whiteField =
    "rounded-md border border-gray-300 dark:border-gray-300 " +
    "bg-white dark:bg-white text-gray-900 dark:text-gray-900 " +
    "placeholder:text-gray-400 dark:placeholder:text-gray-500 " +
    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500";

  // Form state (matches models.py)
  const [form, setForm] = useState({
    name: "",
    formula: "",
    smiles: "",
    molecular_weight: "",
    description: "",
    is_public: true,
  });
  const [structureFile, setStructureFile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [notice, setNotice] = useState("");

  // Generic change handler for text/number/checkbox
  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const validate = () => {
    if (!form.name.trim()) return "Name is required.";
    if (!form.formula.trim()) return "Formula is required.";
    if (!form.smiles.trim()) return "SMILES is required.";
    if (form.molecular_weight !== "" && Number.isNaN(Number(form.molecular_weight))) {
      return "Molecular weight must be a number.";
    }
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr(""); setNotice("");

    const v = validate();
    if (v) { setErr(v); return; }

    // Build multipart/form-data payload (required for FileField)
    const fd = new FormData();
    fd.append("name", form.name.trim());
    fd.append("formula", form.formula.trim());
    fd.append("smiles", form.smiles.trim());
    // Only append if provided
    if (form.molecular_weight !== "") fd.append("molecular_weight", String(Number(form.molecular_weight)));
    if (form.description.trim()) fd.append("description", form.description.trim());
    fd.append("is_public", String(form.is_public));
    if (structureFile) fd.append("structure_file", structureFile);

    setLoading(true);
    try {
      // NOTE: do NOT set Content-Type manually (browser sets multipart boundary)
      const res = await authFetch("/api/compounds/add/", {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.detail || j?.message || "Failed to create compound.");
      }

      setNotice("✅ Compound created successfully.");
      navigate("/advanced-search", { replace: true, state: { flash: "Compound created." } });
    } catch (e) {
      setErr(e.message || "Failed to create compound.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setForm({
      name: "",
      formula: "",
      smiles: "",
      molecular_weight: "",
      description: "",
      is_public: true,
    });
    setStructureFile(null);
    setErr(""); setNotice("");
  };

  return (
    <main className="bg-white dark:bg-neutral-950 min-h-[70vh]">
      <section className="max-w-3xl mx-auto px-4 py-6">
        <header className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Add Compound</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Fill in the fields below to create a new compound.
          </p>
        </header>

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

        <form onSubmit={handleSubmit} className="rounded-2xl ring-1 ring-gray-200 dark:ring-neutral-800 p-6 bg-gray-50 dark:bg-neutral-900">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name (required) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Name *</label>
              <input
                name="name"
                value={form.name}
                onChange={onChange}
                placeholder="e.g., Glucose"
                className={`mt-1 w-full px-3 py-2 text-sm ${whiteField}`}
                required
              />
            </div>

            {/* Formula (required) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Molecular Formula *</label>
              <input
                name="formula"
                value={form.formula}
                onChange={onChange}
                placeholder="e.g., C6H12O6"
                className={`mt-1 w-full px-3 py-2 text-sm ${whiteField}`}
                required
              />
            </div>

            {/* SMILES (required) */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">SMILES *</label>
              <input
                name="smiles"
                value={form.smiles}
                onChange={onChange}
                placeholder="SMILES string"
                className={`mt-1 w-full px-3 py-2 text-sm ${whiteField}`}
                required
              />
            </div>

            {/* Molecular Weight (optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Molecular Weight (g/mol)</label>
              <input
                name="molecular_weight"
                type="number"
                step="0.0001"
                min="0"
                value={form.molecular_weight}
                onChange={onChange}
                placeholder="e.g., 180.156"
                className={`mt-1 w-full px-3 py-2 text-sm ${whiteField}`}
              />
            </div>

            {/* is_public (bool) */}
            <div className="flex items-end">
              <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                <input
                  type="checkbox"
                  name="is_public"
                  checked={form.is_public}
                  onChange={onChange}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Public
              </label>
            </div>

            {/* Structure file (optional) */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Structure File (3D)</label>
              <input  type="file"
                onChange={(e) => setStructureFile(e.target.files?.[0] || null)}
                accept=".mol,.sdf,.pdb,.cif,.xyz,.mol2,.cube,.dx,.gz,.zip"
                className="mt-1 block w-full text-sm text-gray-700 dark:text-gray-200 file:mr-4 file:py-2 file:px-3 file:rounded-md file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700"
              />

              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Accepted formats: .mol, .sdf, .pdb, .cif, .xyz, .mol2, .cube, .dx (archives allowed).
              </p>
            </div>

            {/* Description (optional) */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={onChange}
                placeholder="Short description"
                rows={4}
                className={`mt-1 w-full px-3 py-2 text-sm ${whiteField}`}
              />
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <button
              type="submit"
              disabled={loading}
              className={`inline-flex items-center rounded-md px-4 py-2 text-sm text-white ${loading ? "bg-blue-600/70" : "bg-blue-600 hover:bg-blue-700"}`}
            >
              {loading ? "Saving…" : "Save Compound"}
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center rounded-md bg-gray-200 dark:bg-neutral-800 text-gray-900 dark:text-gray-100 px-4 py-2 text-sm"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center rounded-md bg-gray-100 dark:bg-neutral-800 text-gray-800 dark:text-gray-100 px-4 py-2 text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
