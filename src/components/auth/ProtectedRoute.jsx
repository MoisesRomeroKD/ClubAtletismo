import React from "react";
import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute({ role, allowedRoles, redirectTo = "/login", children }) {
  // Si no hay rol (usuario no autenticado)
  if (!role) {
    return <Navigate to={redirectTo} replace />;
  }

  // Normalización estricta para comparar roles
  const normalizedRole = role.toLowerCase().trim();
  const normalizedAllowed = allowedRoles?.map((r) => r.toLowerCase().trim()) || [];

  // Si se especifica una lista de roles permitidos y el rol actual no está en ella
  if (allowedRoles && !normalizedAllowed.includes(normalizedRole)) {
    // Redirige al dashboard por defecto según el rol para evitar ir a una ruta prohibida
    const defaultHome = normalizedRole === "admin" || normalizedRole === "gestion" ? "/admin" : "/dashboard";
    return <Navigate to={defaultHome} replace />;
  }

  // Si pasa las validaciones, renderiza la ruta protegida (children) o el Outlet
  return children ? children : <Outlet />;
}