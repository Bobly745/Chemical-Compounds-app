// src/components/RequireAuth.jsx
import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { subscribeAuth, getAuthState, initAuth } from "../services/auth";

export default function RequireAuth({ children }) {
  const location = useLocation();
  const [{ user, loading }, setState] = useState(() => getAuthState());

  useEffect(() => {
    const unsub = subscribeAuth(setState);
    initAuth(); // synchronise /api/auth/me au montage
    return () => unsub();
  }, []);

  // ⬇️ NE cacher que si on charge ET qu'on n'a pas encore d'user
  if (loading && !user) return null;

  if (!user) {
    const from = location.pathname + location.search + location.hash;
    return <Navigate to="/login" replace state={{ from, requireAuth: true }} />;
  }

  return children;
}
