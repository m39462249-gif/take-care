import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.js";
import { ProtectedRoute } from "./components/ProtectedRoute.js";
import { RoleRedirect } from "./components/RoleRedirect.js";
import { LoginPage } from "./pages/Auth/LoginPage.js";

import { CaregiverDashboard } from "./pages/Caregiver/CaregiverDashboard.js";
import { ClinicalDashboard } from "./pages/Clinical/ClinicalDashboard.js";
import { PatientDetail } from "./components/Clinical/PatientDetail.js";

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Root redirector */}
          <Route path="/" element={<RoleRedirect />} />

          {/* Authentication Page */}
          <Route path="/login" element={<LoginPage />} />

          {/* Caregiver Portal (Supervision, Alerts, Reassurance) */}
          <Route
            path="/cuidador"
            element={
              <ProtectedRoute allowedRole="CAREGIVER">
                <CaregiverDashboard />
              </ProtectedRoute>
            }
          />

          {/* Clinical Portal (Clinical Data, Adherence, Notes) */}
          <Route
            path="/clinica"
            element={
              <ProtectedRoute allowedRole="PROFESSIONAL">
                <ClinicalDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clinica/patient/:id"
            element={
              <ProtectedRoute allowedRole="PROFESSIONAL">
                <PatientDetail />
              </ProtectedRoute>
            }
          />

          {/* Fallback route */}
          <Route path="*" element={<RoleRedirect />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
