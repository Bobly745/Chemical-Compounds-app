// src/services/admin.js
import { authFetch } from "./auth";

// ---------- USERS ----------
export async function adminFetchUsers({ q = "", limit = 50, offset = 0 } = {}) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  params.set("limit", String(limit));
  params.set("offset", String(offset));
  const res = await authFetch(`/api/admin/users/?${params.toString()}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "Failed to load users");
  return data; // { total, offset, limit, results: [] }
}

export async function adminSetAdmin(id, isAdmin) {
  const res = await authFetch(`/api/admin/users/${id}/set_admin/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ is_admin: !!isAdmin }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "Failed to update role");
  return data;
}

export async function adminSetActive(id, isActive) {
  const res = await authFetch(`/api/admin/users/${id}/set_active/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ is_active: !!isActive }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "Failed to update status");
  return data;
}

// ---------- COMPOUNDS ----------
export async function adminFetchCompounds({ q = "", limit = 50, offset = 0 } = {}) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  params.set("limit", String(limit));
  params.set("offset", String(offset));
  const res = await authFetch(`/api/admin/compounds/?${params.toString()}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "Failed to load compounds");
  return data;
}

export async function adminDeleteCompound(id) {
  const res = await authFetch(`/api/admin/compounds/${id}/delete/`, { method: "POST" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "Failed to delete compound");
  return data;
}

export async function adminUpdateCompound(id, payload) {
  let options = { method: "POST" };

  if (payload instanceof FormData) {
    options.body = payload; // boundary auto
  } else {
    const fd = new FormData();
    if ("name" in payload) fd.append("name", String(payload.name ?? ""));
    if ("formula" in payload) fd.append("formula", String(payload.formula ?? ""));
    if ("smiles" in payload) fd.append("smiles", String(payload.smiles ?? ""));
    if ("molecular_weight" in payload) {
      const mw = payload.molecular_weight;
      fd.append("molecular_weight", mw === null || mw === "" ? "" : String(Number(mw)));
    }
    if ("description" in payload) fd.append("description", String(payload.description ?? ""));
    if ("is_public" in payload) fd.append("is_public", String(!!payload.is_public));
    if (payload.structure_file) fd.append("structure_file", payload.structure_file);
    if (payload.remove_structure_file) fd.append("remove_structure_file", "true");
    options.body = fd;
  }

  const res = await authFetch(`/api/admin/compounds/${id}/update/`, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "Failed to update compound");
  return data;
}
