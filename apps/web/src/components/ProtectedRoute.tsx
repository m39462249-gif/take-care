import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth, getRoleRedirectPath } from "../context/AuthContext.js";
import { Role } from "../types/auth.js";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRole?: Role;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRole,
}) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex min-h-screen items-center justify-center bg-calm-50 p-6 text-center"
      >
        <div className="space-y-4">
          <div className="h-12 w-12 mx-auto rounded-full border-4 border-calm-300 border-t-calm-700 animate-spin" />
          <p className="text-xl font-medium text-slate-800">
            Cargando la plataforma Eje...
          </p>
        </div>
      </div>
    );
  }

  // Not logged in -> go to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Logged in, but unauthorized for this role view -> redirect to their authorized role dashboard
  if (allowedRole && user.role !== allowedRole) {
    const targetPath = getRoleRedirectPath(user.role);
    return <Navigate to={targetPath} replace />;
  }

  return <>{children}</>;
};
