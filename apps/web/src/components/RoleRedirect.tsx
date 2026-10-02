import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth, getRoleRedirectPath } from "../context/AuthContext.js";

export const RoleRedirect: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex min-h-screen items-center justify-center bg-calm-50 p-6 text-center"
      >
        <div className="space-y-4">
          <div className="h-12 w-12 mx-auto rounded-full border-4 border-calm-300 border-t-calm-700 animate-spin" />
          <p className="text-xl font-medium text-slate-800">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={getRoleRedirectPath(user.role)} replace />;
};
