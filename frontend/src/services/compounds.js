// src/services/compounds.js
import { ensureCsrf } from "./auth";

// PUBLIC list (no auth)
export async function fetchPublicCompounds({ q = "", limit = 20, offset = 0 } = {}) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  params.set("limit", String(limit));
  params.set("offset", String(offset));
  const res = await fetch(`/api/compounds/public/?${params.toString()}`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load compounds");
  return res.json();
}

// PRIVATE list (auth required)
export async function fetchPrivateCompounds({ q = "", limit = 20, offset = 0 } = {}) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  params.set("limit", String(limit));
  params.set("offset", String(offset));
  const res = await fetch(`/api/compounds/private/?${params.toString()}`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load private compounds");
  return res.json();
}

// CREATE (auth + CSRF)
export async function addCompound(payload) {
  const csrftoken = await ensureCsrf();
  const res = await fetch(`/api/compounds/add/`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", "X-CSRFToken": csrftoken || "" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "Failed to create compound");
  return data;
}

// UPDATE (auth + CSRF)
export async function updateCompound(id, payload) {
  const csrftoken = await ensureCsrf();
  const res = await fetch(`/api/compounds/${id}/update/`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", "X-CSRFToken": csrftoken || "" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "Failed to update compound");
  return data;
}

// DELETE (auth + CSRF)
export async function deleteCompound(id) {
  const csrftoken = await ensureCsrf();
  const res = await fetch(`/api/compounds/${id}/delete/`, {
    method: "POST",
    credentials: "include",
    headers: { "X-CSRFToken": csrftoken || "" },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "Failed to delete compound");
  return data;
}
