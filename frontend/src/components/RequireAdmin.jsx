// src/components/RequireAdmin.jsx
import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { subscribeAuth, getAuthState, initAuth } from "../services/auth";

export default function RequireAdmin({ children }) {
  const location = useLocation();
  const [state, setState] = useState(() => getAuthState());
  const { user, loading } = state;

  useEffect(() => {
    const unsub = subscribeAuth(setState);
    initAuth();
    return () => unsub();
  }, []);

  if (loading) return null;

  if (!user) {
    const from = location.pathname + location.search + location.hash;
    return <Navigate to="/login" replace state={{ from, requireAuth: true }} />;
  }

  const isAdmin = Boolean(user.is_staff) || user.role === "admin";
  if (!isAdmin) {
    return <Navigate to="/" replace state={{ flash: "Admin only." }} />;
  }

  return children;
}
