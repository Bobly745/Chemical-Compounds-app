/* eslint-disable no-empty */
// src/pages/CompoundDetail.jsx
import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { authFetch, whoAmI } from "../services/auth";

// Charge 3Dmol une seule fois
function ensure3Dmol() {
  return new Promise((resolve, reject) => {
    if (window.$3Dmol) return resolve(window.$3Dmol);
    const id = "three-dmol-cdn";
    if (document.getElementById(id)) {
      const check = () => (window.$3Dmol ? resolve(window.$3Dmol) : setTimeout(check, 100));
      return check();
    }
    const s = document.createElement("script");
    s.id = id;
    s.src = "https://unpkg.com/3dmol@2.0.4/build/3Dmol-min.js";
    s.async = true;
    s.onload = () => resolve(window.$3Dmol);
    s.onerror = () => reject(new Error("Failed to load 3Dmol.js"));
    document.body.appendChild(s);
  });
}

// Détecte format + compression + type (modèle vs volumétrique)
function detectSource(url) {
  try {
    const clean = url.split("?")[0].toLowerCase();
    const compressed = clean.endsWith(".gz");
    const base = compressed ? clean.slice(0, -3) : clean;

    // Volumétriques
    if (base.endsWith(".cube")) return { format: "cube", kind: "volume", compressed };
    if (base.endsWith(".dx")) return { format: "dx", kind: "volume", compressed };

    // Modèles
    if (base.endsWith(".sdf")) return { format: "sdf", kind: "model", compressed };
    if (base.endsWith(".mol")) return { format: "mol", kind: "model", compressed };
    if (base.endsWith(".mol2")) return { format: "mol2", kind: "model", compressed };
    if (base.endsWith(".pdb")) return { format: "pdb", kind: "model", compressed };
    if (base.endsWith(".cif") || base.endsWith(".mmcif")) return { format: "cif", kind: "model", compressed };
    if (base.endsWith(".xyz")) return { format: "xyz", kind: "model", compressed };

    return { format: "sdf", kind: "model", compressed };
  } catch {
    return { format: "sdf", kind: "model", compressed: false };
  }
}

export default function CompoundDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [compound, setCompound] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [me, setMe] = useState(null);
  const meId = me?.id ?? me?.user?.id ?? null;
  const isOwner = compound?.owner?.id && meId && compound.owner.id === meId;
  const canEdit = Boolean(isOwner);

  // Édition
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [delBusy, setDelBusy] = useState(false);
  const [notice, setNotice] = useState("");

  // Formulaire d'édition
  const [form, setForm] = useState({
    name: "",
    formula: "",
    smiles: "",
    molecular_weight: "",
    description: "",
    is_public: true,
  });
  const [structureFile, setStructureFile] = useState(null);
  const [removeStructureFile, setRemoveStructureFile] = useState(false);

  // 3D viewer
  const viewerRef = useRef(null);
  const [viewerReady, setViewerReady] = useState(false);

  // Inputs blancs
  const whiteField =
    "rounded-md border border-gray-300 dark:border-gray-300 " +
    "bg-white dark:bg-white text-gray-900 dark:text-gray-900 " +
    "placeholder:text-gray-400 dark:placeholder:text-gray-500 " +
    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500";

  // Charge me + compound
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const [meVal, res] = await Promise.all([
          whoAmI().catch(() => null),
          authFetch(`/api/compounds/${id}/`),
        ]);
        if (!res.ok) throw new Error(`Failed to load compound #${id}`);
        const data = await res.json();
        if (mounted) {
          setMe(meVal);
          setCompound(data?.compound || null);
        }
      } catch (e) {
        if (mounted) setErr(e.message || "Failed to load compound.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  // Préremplir formulaire en édition
  useEffect(() => {
    if (editMode && compound) {
      setForm({
        name: compound.name || "",
        formula: compound.formula || "",
        smiles: compound.smiles || "",
        molecular_weight:
          compound.molecular_weight === null || compound.molecular_weight === undefined
            ? ""
            : String(compound.molecular_weight),
        description: compound.description || "",
        is_public: Boolean(compound.is_public),
      });
      setStructureFile(null);
      setRemoveStructureFile(false);
      setNotice("");
      setErr("");
    }
  }, [editMode, compound]);

  // Viewer 3D (support .gz + CUBE/DX)
  useEffect(() => {
    if (!compound?.structure_file_url) return;

    setViewerReady(false);
    let disposed = false;
    let viewer = null;
    let resizeHandler = null;
    let ro = null;

    (async () => {
      try {
        const $3Dmol = await ensure3Dmol();
        if (disposed || !viewerRef.current) return;

        const mountEl = viewerRef.current;
        mountEl.innerHTML = "";
        mountEl.style.position = "relative";
        mountEl.style.overflow = "hidden";

        viewer = $3Dmol.createViewer(mountEl, { backgroundColor: "white" });

        const url = compound.structure_file_url;
        const { format, kind, compressed } = detectSource(url);

        if (kind === "model") {
          if (compressed) {
            await viewer.addModelFromUrl(url, format, { doAssembly: true });
          } else {
            const resp = await fetch(url, { credentials: "omit" });
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const text = await resp.text();
            if (!text || text.trim().length === 0) throw new Error("Empty file");
            viewer.addModel(text, format);
          }

          const model = viewer.getModel(0);
          if (model) model.setStyle({}, { stick: {}, sphere: { scale: 0.28 } });
          viewer.zoomTo();
          viewer.render();
          setViewerReady(true);
        } else {
          // Volumétrique: Gaussian CUBE / OpenDX
          if (compressed) {
            throw new Error("Compressed volumetric (.cube.gz / .dx.gz) not supported yet.");
          }
          const resp = await fetch(url, { credentials: "omit" });
          if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
          const text = await resp.text();
          if (!text || text.trim().length === 0) throw new Error("Empty file");

          viewer.addVolumetricData(
            text,
            format,
            { isoval: 0.03, opacity: 0.85, color: "white" },
            () => {
              viewer.zoomTo();
              viewer.render();
              setViewerReady(true);
            }
          );
        }

        requestAnimationFrame(() => {
          try { viewer.resize(); viewer.zoomTo(); viewer.render(); } catch {}
        });

        resizeHandler = () => { try { viewer.resize(); } catch {} };
        window.addEventListener("resize", resizeHandler);

        if ("ResizeObserver" in window) {
          ro = new ResizeObserver(() => { try { viewer.resize(); } catch {} });
          ro.observe(mountEl);
        }
      } catch (e) {
        if (viewerRef.current) {
          viewerRef.current.innerHTML =
            `<div style="padding:8px;color:#bbb;font-size:12px;background:#111;border-radius:6px;">
               Unable to render the 3D file.<br/>
               <span style="color:#e99">Reason:</span> ${e.message || "Unknown error"}<br/>
               Try the download link below.
             </div>`;
        }
      }
    })();

    return () => {
      disposed = true;
      if (resizeHandler) window.removeEventListener("resize", resizeHandler);
      try { ro && ro.disconnect(); } catch {}
      try { viewer && viewer.clear(); } catch {}
    };
  }, [compound?.structure_file_url]);

  // Handlers
  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
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

  const handleSave = async (e) => {
    e.preventDefault();
    if (!canEdit) return;

    const v = validate();
    if (v) { setErr(v); return; }

    setSaving(true);
    setErr(""); setNotice("");

    try {
      const fd = new FormData();
      fd.append("name", form.name.trim());
      fd.append("formula", form.formula.trim());
      fd.append("smiles", form.smiles.trim());
      if (form.molecular_weight !== "") {
        fd.append("molecular_weight", String(Number(form.molecular_weight)));
      } else {
        fd.append("molecular_weight", "");
      }
      fd.append("description", form.description.trim());
      fd.append("is_public", String(form.is_public));
      if (structureFile) fd.append("structure_file", structureFile);
      if (removeStructureFile) fd.append("remove_structure_file", "true");

      const res = await authFetch(`/api/compounds/${id}/update/`, { method: "POST", body: fd });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || j?.detail || j?.message || "Update failed.");
      }
      const j = await res.json();
      setCompound(j?.compound || compound);
      setNotice("✅ Updated successfully.");
      setEditMode(false);
    } catch (e) {
      setErr(e.message || "Update failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!canEdit) return;
    const ok = window.confirm("Are you sure you want to delete this compound? This cannot be undone.");
    if (!ok) return;
    setDelBusy(true); setErr(""); setNotice("");
    try {
      const res = await authFetch(`/api/compounds/${id}/delete/`, { method: "POST" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || j?.detail || j?.message || "Delete failed.");
      }
      navigate("/compounds", { replace: true, state: { flash: "Compound deleted." } });
    } catch (e) {
      setErr(e.message || "Delete failed.");
    } finally {
      setDelBusy(false);
    }
  };

  return (
    <main className="bg-white dark:bg-neutral-950 min-h-[70vh]">
      <section className="max-w-5xl mx-auto px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Compound details</h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">ID: {id}</p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/compounds" className="text-sm underline">← Back to list</Link>

            {/* NEW: bouton Close */}
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center rounded-md bg-gray-200 dark:bg-neutral-800 text-gray-900 dark:text-gray-100 px-3 py-1.5 text-sm"
              aria-label="Close detail page"
              title="Close"
            >
              Close
            </button>

            {canEdit && (
              <>
                <button
                  onClick={() => setEditMode((v) => !v)}
                  className="inline-flex items-center rounded-md bg-blue-600 text-white px-3 py-1.5 text-sm hover:bg-blue-700"
                >
                  {editMode ? "Close edit" : "Edit"}
                </button>
                <button
                  onClick={handleDelete}
                  disabled={delBusy}
                  className={`inline-flex items-center rounded-md px-3 py-1.5 text-sm text-white ${delBusy ? "bg-red-600/70" : "bg-red-600 hover:bg-red-700"}`}
                >
                  {delBusy ? "Deleting…" : "Delete"}
                </button>
              </>
            )}
          </div>
        </div>

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

        {loading ? (
          <div className="rounded-2xl ring-1 ring-gray-200 dark:ring-neutral-800 p-6">
            <p className="text-sm text-gray-600 dark:text-gray-300">Loading…</p>
          </div>
        ) : !compound ? (
          <div className="rounded-2xl ring-1 ring-gray-200 dark:ring-neutral-800 p-6">
            <p className="text-sm text-gray-600 dark:text-gray-300">Not found.</p>
          </div>
        ) : (
          <>
            {/* Info + 3D */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Infos */}
              <div className="lg:col-span-1 rounded-2xl ring-1 ring-gray-200 dark:ring-neutral-800 p-6 bg-gray-50 dark:bg-neutral-900">
                <dl className="grid grid-cols-1 gap-3 text-sm">
                  <div>
                    <dt className="text-gray-500 dark:text-gray-400">Name</dt>
                    <dd className="font-medium text-gray-900 dark:text-gray-100">{compound.name}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500 dark:text-gray-400">Formula</dt>
                    <dd className="text-gray-900 dark:text-gray-100">{compound.formula}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500 dark:text-gray-400">SMILES</dt>
                    <dd className="text-gray-900 dark:text-gray-100 break-all">{compound.smiles}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500 dark:text-gray-400">Molecular Weight</dt>
                    <dd className="text-gray-900 dark:text-gray-100">
                      {compound.molecular_weight ?? "—"} {compound.molecular_weight ? "g/mol" : ""}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500 dark:text-gray-400">Visibility</dt>
                    <dd>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${
                        compound.is_public
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200"
                          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200"
                      }`}>
                        {compound.is_public ? "Public" : "Private"}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500 dark:text-gray-400">Owner</dt>
                    <dd className="text-gray-900 dark:text-gray-100">
                      {compound.owner?.email ?? `User #${compound.owner?.id ?? "—"}`}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500 dark:text-gray-400">Created</dt>
                    <dd className="text-gray-900 dark:text-gray-100">{compound.created_at?.replace("T"," ").slice(0,19) ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500 dark:text-gray-400">Updated</dt>
                    <dd className="text-gray-900 dark:text-gray-100">{compound.updated_at?.replace("T"," ").slice(0,19) ?? "—"}</dd>
                  </div>
                  <div className="lg:col-span-1">
                    <dt className="text-gray-500 dark:text-gray-400">Description</dt>
                    <dd className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                      {compound.description || "—"}
                    </dd>
                  </div>
                </dl>

                {compound.structure_file_url && (
                  <div className="mt-4">
                    <a
                      href={compound.structure_file_url}
                      className="inline-flex items-center rounded-md bg-blue-600 text-white px-3 py-2 text-sm hover:bg-blue-700"
                      target="_blank" rel="noreferrer"
                    >
                      Download structure file
                    </a>
                  </div>
                )}
              </div>

              {/* Viewer 3D */}
              <div className="lg:col-span-2 rounded-2xl ring-1 ring-gray-200 dark:ring-neutral-800 p-4 bg-gray-50 dark:bg-neutral-900">
                <h2 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">3D Structure</h2>
                {compound.structure_file_url ? (
                  <div>
                    <div
                      ref={viewerRef}
                      className="viewer3d relative overflow-hidden w-full h-[420px] rounded-lg border border-gray-200 dark:border-neutral-800"
                      style={{ background: "#fff" }}
                    />
                    {!viewerReady && (
                      <p className="mt-2 text-xs text-gray-500">
                        Rendering the 3D structure… If nothing appears, try the download link.
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600 dark:text-gray-300">No 3D structure provided.</p>
                )}
              </div>
            </div>

            {/* Édition (si autorisé) */}
            {canEdit && editMode && (
              <form onSubmit={handleSave} className="mt-6 rounded-2xl ring-1 ring-gray-200 dark:ring-neutral-800 p-6 bg-gray-50 dark:bg-neutral-900">
                <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Edit compound
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Name *</label>
                    <input name="name" value={form.name} onChange={onChange} className={`mt-1 w-full px-3 py-2 text-sm ${whiteField}`} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Molecular Formula *</label>
                    <input name="formula" value={form.formula} onChange={onChange} className={`mt-1 w-full px-3 py-2 text-sm ${whiteField}`} required />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">SMILES *</label>
                    <input name="smiles" value={form.smiles} onChange={onChange} className={`mt-1 w-full px-3 py-2 text-sm ${whiteField}`} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Molecular Weight (g/mol)</label>
                    <input name="molecular_weight" type="number" step="0.0001" min="0" value={form.molecular_weight} onChange={onChange} className={`mt-1 w-full px-3 py-2 text-sm ${whiteField}`} />
                  </div>
                  <div className="flex items-end">
                    <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                      <input type="checkbox" name="is_public" checked={form.is_public} onChange={onChange} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      Public
                    </label>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Structure File (3D)</label>
                    <input
                      type="file"
                      onChange={(e) => setStructureFile(e.target.files?.[0] || null)}
                      accept=".mol,.sdf,.pdb,.cif,.xyz,.mol2,.cube,.dx,.gz,.zip"
                      className="mt-1 block w-full text-sm text-gray-700 dark:text-gray-200 file:mr-4 file:py-2 file:px-3 file:rounded-md file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                    />
                    {compound.structure_file_url && (
                      <label className="mt-2 inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                        <input
                          type="checkbox"
                          checked={removeStructureFile}
                          onChange={(e) => setRemoveStructureFile(e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        Remove current file
                      </label>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Description</label>
                    <textarea name="description" value={form.description} onChange={onChange} rows={4} className={`mt-1 w-full px-3 py-2 text-sm ${whiteField}`} />
                  </div>
                </div>

                <div className="mt-6 flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className={`inline-flex items-center rounded-md px-4 py-2 text-sm text-white ${saving ? "bg-blue-600/70" : "bg-blue-600 hover:bg-blue-700"}`}
                  >
                    {saving ? "Saving…" : "Save changes"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditMode(false)}
                    className="inline-flex items-center rounded-md bg-gray-200 dark:bg-neutral-800 text-gray-900 dark:text-gray-100 px-4 py-2 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </section>
    </main>
  );
}
