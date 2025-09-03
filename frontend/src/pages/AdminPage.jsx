// src/pages/AdminPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import {useNavigate } from "react-router-dom";
import { getAuthState } from "../services/auth";
import {
  adminFetchUsers, adminSetAdmin, adminSetActive,
  adminFetchCompounds, adminDeleteCompound, adminUpdateCompound
} from "../services/admin";

export default function AdminPage() {
  const { user: me } = getAuthState();
  const meId = me?.id;
  const navigate = useNavigate();

  const [tab, setTab] = useState("users"); // "users" | "compounds"

  // Users state
  const [users, setUsers] = useState([]);
  const [uq, setUq] = useState("");
  const [uLoading, setULoading] = useState(true);
  const [uErr, setUErr] = useState("");

  // Compounds state
  const [comps, setComps] = useState([]);
  const [cq, setCq] = useState("");
  const [cLoading, setCLoading] = useState(true);
  const [cErr, setCErr] = useState("");

  // Notices
  const [notice, setNotice] = useState("");
  const [err, setErr] = useState("");

  // Edit compound panel
  const [editOpen, setEditOpen] = useState(false);
  const [editComp, setEditComp] = useState(null);
  const [editFile, setEditFile] = useState(null);
  const [removeFile, setRemoveFile] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadUsers = async (query = "") => {
    setULoading(true); setUErr("");
    try {
      const data = await adminFetchUsers({ q: query, limit: 100, offset: 0 });
      setUsers(Array.isArray(data?.results) ? data.results : []);
    } catch (e) {
      setUErr(e.message || "Failed to load users.");
    } finally {
      setULoading(false);
    }
  };

  const loadComps = async (query = "") => {
    setCLoading(true); setCErr("");
    try {
      const data = await adminFetchCompounds({ q: query, limit: 100, offset: 0 });
      setComps(Array.isArray(data?.results) ? data.results : []);
    } catch (e) {
      setCErr(e.message || "Failed to load compounds.");
    } finally {
      setCLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    loadComps();
  }, []);

  const whiteField =
    "rounded-md border border-gray-300 dark:border-gray-300 " +
    "bg-white dark:bg-white text-gray-900 dark:text-gray-900 " +
    "placeholder:text-gray-400 dark:placeholder:text-gray-500 " +
    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500";

  // Filters
  const filteredUsers = useMemo(() => {
    const q = uq.trim().toLowerCase();
    if (!q) return users;
    return users.filter(u =>
      (u.email || "").toLowerCase().includes(q) ||
      (u.full_name || "").toLowerCase().includes(q)
    );
  }, [users, uq]);

  const filteredComps = useMemo(() => {
    const q = cq.trim().toLowerCase();
    if (!q) return comps;
    return comps.filter(c =>
      (c.name || "").toLowerCase().includes(q) ||
      (c.formula || "").toLowerCase().includes(q) ||
      (c.smiles || "").toLowerCase().includes(q) ||
      (c.description || "").toLowerCase().includes(q)
    );
  }, [comps, cq]);

  // Actions: Users
  const toggleAdmin = async (u) => {
    setErr(""); setNotice("");
    const targetFlag = !(u.is_staff || u.role === "admin");
    try {
      await adminSetAdmin(u.id, targetFlag);
      setNotice(targetFlag ? "User promoted to admin." : "User demoted.");
      await loadUsers(uq);
    } catch (e) {
      setErr(e.message || "Failed to update role.");
    }
  };

  const toggleActive = async (u) => {
    setErr(""); setNotice("");
    const targetActive = !u.is_active;

    // Garde-fou basique côté UI (le serveur revalidera aussi)
    if (u.id === meId && !targetActive) {
      setErr("You cannot deactivate your own account.");
      return;
    }

    if (!targetActive) {
      const ok = window.confirm(`Deactivate user ${u.email || u.full_name || u.id} ? They won't be able to sign in.`);
      if (!ok) return;
    }

    try {
      await adminSetActive(u.id, targetActive);
      setNotice(targetActive ? "User reactivated." : "User deactivated.");
      await loadUsers(uq);
    } catch (e) {
      setErr(e.message || "Failed to update status.");
    }
  };

  // Actions: Compounds
  const startEdit = (c) => {
    setEditComp({
      id: c.id,
      name: c.name || "",
      formula: c.formula || "",
      smiles: c.smiles || "",
      molecular_weight: c.molecular_weight ?? "",
      description: c.description || "",
      is_public: !!c.is_public,
    });
    setEditFile(null);
    setRemoveFile(false);
    setErr(""); setNotice("");
    setEditOpen(true);
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    if (!editComp) return;
    setSaving(true); setErr(""); setNotice("");
    try {
      const fd = new FormData();
      fd.append("name", editComp.name.trim());
      fd.append("formula", editComp.formula.trim());
      fd.append("smiles", editComp.smiles.trim());
      fd.append("molecular_weight", editComp.molecular_weight === "" ? "" : String(Number(editComp.molecular_weight)));
      fd.append("description", editComp.description.trim());
      fd.append("is_public", String(!!editComp.is_public));
      if (editFile) fd.append("structure_file", editFile);
      if (removeFile) fd.append("remove_structure_file", "true");

      await adminUpdateCompound(editComp.id, fd);
      setNotice("Compound updated.");
      setEditOpen(false);
      await loadComps(cq);
    } catch (e2) {
      setErr(e2.message || "Failed to update compound.");
    } finally {
      setSaving(false);
    }
  };

  const removeComp = async (c) => {
    setErr(""); setNotice("");
    const ok = window.confirm(`Delete compound "${c.name}" (#${c.id})? This cannot be undone.`);
    if (!ok) return;
    try {
      await adminDeleteCompound(c.id);
      setNotice("Compound deleted.");
      await loadComps(cq);
    } catch (e) {
      setErr(e.message || "Failed to delete compound.");
    }
  };

  return (
    <main className="bg-white dark:bg-neutral-950">
      <section className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Administrator</h1>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center rounded-md bg-gray-2 00 dark:bg-neutral-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm"
          aria-label="Close admin page"
          title="Close"
        >
          Close
</button>

        </div>

        {/* Messages globaux */}
        <div aria-live="polite">
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
        </div>

        {/* Tabs */}
        <div className="mb-4 inline-flex rounded-xl ring-1 ring-gray-200 dark:ring-neutral-700 overflow-hidden">
          <button
            type="button"
            onClick={() => setTab("users")}
            className={`px-4 py-2 text-sm ${tab === "users" ? "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"}`}
          >
            Users
          </button>
          <button
            type="button"
            onClick={() => setTab("compounds")}
            className={`px-4 py-2 text-sm ${tab === "compounds" ? "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"}`}
          >
            Compounds
          </button>
        </div>

        {/* Users tab */}
        {tab === "users" && (
          <div className="rounded-2xl ring-1 ring-gray-200 dark:ring-neutral-800 p-6 bg-gray-50 dark:bg-neutral-900">
            <div className="mb-3 flex items-center gap-2">
              <input
                value={uq}
                onChange={(e)=>setUq(e.target.value)}
                placeholder="Search users (email, name)…"
                className={`px-3 py-2 text-sm w-full md:w-80 ${whiteField}`}
              />
              <button
                type="button"
                onClick={()=>loadUsers(uq)}
                className="rounded-md bg-blue-600 text-white px-3 py-2 text-sm hover:bg-blue-700"
              >
                Refresh
              </button>
            </div>

            {uLoading ? (
              <p className="text-sm text-gray-600 dark:text-gray-300">Loading users…</p>
            ) : uErr ? (
              <p className="text-sm text-red-600">{uErr}</p>
            ) : filteredUsers.length === 0 ? (
              <p className="text-sm text-gray-600 dark:text-gray-300">No users.</p>
            ) : (
              <div className="overflow-x-auto rounded-xl ring-1 ring-gray-200 dark:ring-neutral-800">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-neutral-900 text-gray-700 dark:text-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3">Full name</th>
                      <th className="text-left px-4 py-3">Email</th>
                      <th className="text-left px-4 py-3">Role</th>
                      <th className="text-left px-4 py-3">Admin</th>
                      <th className="text-left px-4 py-3">Active</th> {/* ✅ NEW */}
                      <th className="text-right px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-neutral-800">
                    {filteredUsers.map(u => {
                      const isAdmin = !!(u.is_staff || u.role === "admin");
                      return (
                        <tr key={u.id}>
                          <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{u.full_name || "—"}</td>
                          <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{u.email}</td>
                          <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{u.role || "—"}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${
                              isAdmin ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200"
                                      : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200"
                            }`}>
                              {isAdmin ? "Yes" : "No"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${
                              u.is_active
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200"
                                : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200"
                            }`}>
                              {u.is_active ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="inline-flex gap-2">
                              <button
                                onClick={() => toggleAdmin(u)}
                                className="rounded-md bg-gray-900/80 dark:bg-gray-200 text-white dark:text-gray-900 px-3 py-1.5 hover:opacity-90"
                              >
                                {isAdmin ? "Demote" : "Promote"}
                              </button>
                              <button
                                onClick={() => toggleActive(u)}
                                className={`rounded-md px-3 py-1.5 text-white ${
                                  u.is_active ? "bg-amber-600 hover:bg-amber-700" : "bg-green-600 hover:bg-green-700"
                                }`}
                              >
                                {u.is_active ? "Deactivate" : "Activate"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Compounds tab (identique sauf UI) */}
        {tab === "compounds" && (
          <div className="rounded-2xl ring-1 ring-gray-200 dark:ring-neutral-800 p-6 bg-gray-50 dark:bg-neutral-900">
            <div className="mb-3 flex items-center gap-2">
              <input
                value={cq}
                onChange={(e)=>setCq(e.target.value)}
                placeholder="Search compounds (name, formula, smiles, description)…"
                className={`px-3 py-2 text-sm w-full md:w-96 ${whiteField}`}
              />
              <button
                type="button"
                onClick={()=>loadComps(cq)}
                className="rounded-md bg-blue-600 text-white px-3 py-2 text-sm hover:bg-blue-700"
              >
                Refresh
              </button>
            </div>

            {cLoading ? (
              <p className="text-sm text-gray-600 dark:text-gray-300">Loading compounds…</p>
            ) : cErr ? (
              <p className="text-sm text-red-600">{cErr}</p>
            ) : filteredComps.length === 0 ? (
              <p className="text-sm text-gray-600 dark:text-gray-300">No compounds.</p>
            ) : (
              <div className="overflow-x-auto rounded-xl ring-1 ring-gray-200 dark:ring-neutral-800">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-neutral-900 text-gray-700 dark:text-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3">Name</th>
                      <th className="text-left px-4 py-3">Formula</th>
                      <th className="text-left px-4 py-3">SMILES</th>
                      <th className="text-right px-4 py-3">MW</th>
                      <th className="text-left px-4 py-3">Public</th>
                      <th className="text-right px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-neutral-800">
                    {filteredComps.map(c => (
                      <tr key={c.id}>
                        <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{c.name}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{c.formula}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200 truncate max-w-[340px]">{c.smiles}</td>
                        <td className="px-4 py-3 text-right text-gray-900 dark:text-gray-100">{c.molecular_weight ?? "—"}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${
                            c.is_public
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200"
                              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200"
                          }`}>
                            {c.is_public ? "Yes" : "No"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex gap-2">
                            <button
                              onClick={() => startEdit(c)}
                              className="rounded-md bg-gray-900/80 dark:bg-gray-200 text-white dark:text-gray-900 px-3 py-1.5 hover:opacity-90"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => removeComp(c)}
                              className="rounded-md bg-red-600 text-white px-3 py-1.5 hover:bg-red-700"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {editOpen && editComp && (
              <form onSubmit={saveEdit} className="mt-6 rounded-xl ring-1 ring-gray-200 dark:ring-neutral-800 p-4 bg-white dark:bg-neutral-800">
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  Edit compound #{editComp.id}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Name *</label>
                    <input
                      value={editComp.name}
                      onChange={(e)=>setEditComp(p=>({...p, name: e.target.value}))}
                      className={`mt-1 w-full px-3 py-2 text-sm ${whiteField}`} required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Formula *</label>
                    <input
                      value={editComp.formula}
                      onChange={(e)=>setEditComp(p=>({...p, formula: e.target.value}))}
                      className={`mt-1 w-full px-3 py-2 text-sm ${whiteField}`} required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">SMILES *</label>
                    <input
                      value={editComp.smiles}
                      onChange={(e)=>setEditComp(p=>({...p, smiles: e.target.value}))}
                      className={`mt-1 w-full px-3 py-2 text-sm ${whiteField}`} required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Molecular Weight (g/mol)</label>
                    <input
                      type="number" step="0.0001" min="0"
                      value={editComp.molecular_weight}
                      onChange={(e)=>setEditComp(p=>({...p, molecular_weight: e.target.value}))}
                      className={`mt-1 w-full px-3 py-2 text-sm ${whiteField}`}
                    />
                  </div>
                  <div className="flex items-end">
                    <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                      <input
                        type="checkbox"
                        checked={!!editComp.is_public}
                        onChange={(e)=>setEditComp(p=>({...p, is_public: e.target.checked}))}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      Public
                    </label>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Structure file (3D)</label>
                    <input
                      type="file"
                      onChange={(e)=>setEditFile(e.target.files?.[0] || null)}
                      accept=".mol,.sdf,.pdb,.cif,.xyz,.mol2,.gz,.zip"
                      className="mt-1 block w-full text-sm text-gray-700 dark:text-gray-200 file:mr-4 file:py-2 file:px-3 file:rounded-md file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                    />
                    <label className="mt-2 inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                      <input
                        type="checkbox"
                        checked={removeFile}
                        onChange={(e)=>setRemoveFile(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      Remove current file
                    </label>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Description</label>
                    <textarea
                      rows={4}
                      value={editComp.description}
                      onChange={(e)=>setEditComp(p=>({...p, description: e.target.value}))}
                      className={`mt-1 w-full px-3 py-2 text-sm ${whiteField}`}
                    />
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className={`inline-flex items-center rounded-md px-4 py-2 text-sm text-white ${saving ? "bg-blue-600/70" : "bg-blue-600 hover:bg-blue-700"}`}
                  >
                    {saving ? "Saving…" : "Save changes"}
                  </button>
                  <button
                    type="button"
                    onClick={()=>setEditOpen(false)}
                    className="inline-flex items-center rounded-md bg-gray-200 dark:bg-neutral-700 text-gray-900 dark:text-gray-100 px-4 py-2 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
