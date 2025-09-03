import React from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import RequireAuth from "./components/RequireAuth";
import RequireAdmin from "./components/RequireAdmin";  // ✅ NEW

import HomePage from "./pages/HomePage";
import AuthPage from "./pages/AuthPage";
import AboutPage from "./pages/AboutPage";
import AdvancedSearchPage from "./pages/AdvancedSearchPage";
import CompoundsPage from "./pages/CompoundsPage";
import ProfilePage from "./pages/ProfilePage";
import AddCompound from "./pages/AddCompound";
import CompoundDetail from "./pages/CompoundDetail";
import AdminPage from "./pages/AdminPage";             // ✅ NEW

export default function App() {
  return (
    <>
      <Navbar />

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />

        <Route
          path="/advanced-search"
          element={
            <RequireAuth>
              <AdvancedSearchPage />
            </RequireAuth>
          }
        />
        <Route
          path="/compounds"
          element={
            <RequireAuth>
              <CompoundsPage />
            </RequireAuth>
          }
        />

        <Route
          path="/add-compound"
          element={
            <RequireAuth>
              <AddCompound />
            </RequireAuth>
          }
        />
        <Route
          path="/compounds/:id"
          element={
            <RequireAuth>
              <CompoundDetail />
            </RequireAuth>
          }
        />

        <Route
          path="/profile"
          element={
            <RequireAuth>
              <ProfilePage />
            </RequireAuth>
          }
        />

        {/* ✅ Admin route protégée */}
        <Route
          path="/administrator"
          element={
            <RequireAuth>
              <RequireAdmin>
                <AdminPage />
              </RequireAdmin>
            </RequireAuth>
          }
        />

        <Route path="/login" element={<AuthPage />} />
      </Routes>

      <Footer />
    </>
  );
}
