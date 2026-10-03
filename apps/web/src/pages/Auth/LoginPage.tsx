import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User as UserIcon,
  HeartHandshake,
  Stethoscope,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Shield,
  KeyRound,
  Mail,
  UserCheck,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.js";
import { Role } from "../../types/auth.js";

export const LoginPage: React.FC = () => {
  const { login, loginDemo, register, getRoleRedirectPath } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [selectedRole, setSelectedRole] = useState<Role>("PATIENT");

  // Common fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  // Role-specific fields
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [relationToPatient, setRelationToPatient] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [specialty, setSpecialty] = useState("");

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Quick Demo Logins: Instant access to Cuidador / Clínica dashboards!
  const handleQuickDemo = (role: Role) => {
    loginDemo(role);
    navigate(getRoleRedirectPath(role));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    if (mode === "login") {
      const res = await login(email, password);
      setIsSubmitting(false);
      if (res.success) {
        // Redirection will be handled automatically or we can read me
        navigate("/");
      } else {
        setErrorMessage(res.error || "Error al iniciar sesión.");
      }
    } else {
      // Register
      let payload: any = {
        email,
        password,
        role: selectedRole,
        fullName,
      };

      if (selectedRole === "PATIENT") {
        payload.dateOfBirth = dateOfBirth || undefined;
        payload.emergencyContactPhone = emergencyPhone || undefined;
      } else if (selectedRole === "CAREGIVER") {
        payload.relationToPatient = relationToPatient;
      } else if (selectedRole === "PROFESSIONAL") {
        payload.licenseNumber = licenseNumber;
        payload.specialty = specialty;
      }

      const res = await register(payload);
      setIsSubmitting(false);
      if (res.success) {
        navigate(getRoleRedirectPath(selectedRole));
      } else {
        setErrorMessage(res.error || "Error al registrar la cuenta.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 font-sans">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#2E5A44] text-white shadow-sm mb-3">
          <span className="text-2xl font-serif font-bold">R</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#232B28] tracking-tight">
          Take Care
        </h1>
        <p className="mt-1 text-sm sm:text-base text-[#57645E] font-medium">
          Acompañamiento sereno, rutinas estructuradas y cuidado coordinado
        </p>
        <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EBF3EE] text-[#2E5A44] text-xs font-medium">
          <span>🌿 Espacio accesible y predecible</span>
        </div>
      </div>

      {/* Main Container */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-8 px-6 sm:px-10 border border-[#E6E0D6] shadow-sm rounded-3xl">

          {/* Quick Demo Access Bar */}
          <div className="mb-6 p-4 bg-[#F7F4EE] border border-[#E6E0D6] rounded-2xl">
            <div className="flex items-center gap-2 mb-1.5 text-[#232B28] font-bold text-sm">
              <Shield className="w-4 h-4 text-[#2E5A44]" aria-hidden="true" />
              <span>Accesos Rápidos Directos (Modo Autónomo Instantáneo)</span>
            </div>
            <p className="text-xs text-[#57645E] mb-3">
              Haz clic para ingresar inmediatamente al dashboard con datos clínicos y asistente IA activos:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleQuickDemo("CAREGIVER")}
                className="flex items-center justify-center gap-2.5 px-4 py-3 bg-[#2E5A44] hover:bg-[#254A37] text-white font-bold rounded-2xl text-sm transition-all shadow-sm min-h-[48px] cursor-pointer"
                aria-label="Acceder como Cuidador: Elena Silva"
              >
                <HeartHandshake className="w-4 h-4 text-emerald-200" aria-hidden="true" />
                <span>Panel de Cuidador (Elena)</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo("PROFESSIONAL")}
                className="flex items-center justify-center gap-2.5 px-4 py-3 bg-[#244E70] hover:bg-[#1D3E59] text-white font-bold rounded-2xl text-sm transition-all shadow-sm min-h-[48px] cursor-pointer"
                aria-label="Acceder como Profesional Clínico: Dra. Sofía"
              >
                <Stethoscope className="w-4 h-4 text-sky-200" aria-hidden="true" />
                <span>Portal Clínico (Dra. Sofía)</span>
              </button>
            </div>
          </div>

          {/* Mode Switcher (Login / Register) */}
          <div className="flex bg-[#F7F4EE] p-1 border border-[#E6E0D6] mb-6 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setErrorMessage(null);
              }}
              className={`flex-1 py-2.5 text-center font-bold text-sm sm:text-base rounded-xl transition-all ${mode === "login"
                ? "bg-white text-[#232B28] shadow-xs border border-[#E6E0D6]"
                : "text-[#57645E] hover:text-[#232B28]"
                }`}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setErrorMessage(null);
              }}
              className={`flex-1 py-2.5 text-center font-bold text-sm sm:text-base rounded-xl transition-all ${mode === "register"
                ? "bg-white text-[#232B28] shadow-xs border border-[#E6E0D6]"
                : "text-[#57645E] hover:text-[#232B28]"
                }`}
            >
              Crear Cuenta
            </button>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div
              role="alert"
              className="mb-5 p-3.5 bg-[#FAF0E4] border border-[#E5C79E] rounded-2xl flex items-start gap-3 text-[#7A4B1A]"
            >
              <AlertCircle className="w-5 h-5 text-[#8C5E24] flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <strong className="block text-sm font-bold">Nota de aviso:</strong>
                <p className="text-xs font-medium mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>

            {/* If Register: Role Selector */}
            {mode === "register" && (
              <div>
                <label className="block text-sm font-bold text-[#232B28] mb-2">
                  Selecciona el rol de la cuenta:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedRole("PATIENT")}
                    className={`p-3 rounded-2xl border flex flex-col items-center justify-center text-center transition-all ${selectedRole === "PATIENT"
                      ? "border-[#2E5A44] bg-[#EBF3EE] text-[#2E5A44] font-bold"
                      : "border-[#E6E0D6] bg-white text-[#57645E] hover:border-[#2E5A44]"
                      }`}
                  >
                    <UserIcon className="w-5 h-5 mb-1" aria-hidden="true" />
                    <span className="text-xs font-bold">Paciente</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedRole("CAREGIVER")}
                    className={`p-3 rounded-2xl border flex flex-col items-center justify-center text-center transition-all ${selectedRole === "CAREGIVER"
                      ? "border-[#2E5A44] bg-[#EBF3EE] text-[#2E5A44] font-bold"
                      : "border-[#E6E0D6] bg-white text-[#57645E] hover:border-[#2E5A44]"
                      }`}
                  >
                    <HeartHandshake className="w-5 h-5 mb-1" aria-hidden="true" />
                    <span className="text-xs font-bold">Cuidador</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedRole("PROFESSIONAL")}
                    className={`p-3 rounded-2xl border flex flex-col items-center justify-center text-center transition-all ${selectedRole === "PROFESSIONAL"
                      ? "border-[#2E5A44] bg-[#EBF3EE] text-[#2E5A44] font-bold"
                      : "border-[#E6E0D6] bg-white text-[#57645E] hover:border-[#2E5A44]"
                      }`}
                  >
                    <Stethoscope className="w-5 h-5 mb-1" aria-hidden="true" />
                    <span className="text-xs font-bold">Clínica</span>
                  </button>
                </div>
              </div>
            )}

            {/* Full Name (if register) */}
            {mode === "register" && (
              <div>
                <label
                  htmlFor="fullName"
                  className="block text-sm font-semibold text-[#232B28] mb-1"
                >
                  Nombre Completo
                </label>
                <input
                  id="fullName"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ej. Mateo Silva"
                  className="w-full px-4 py-2.5 text-base rounded-2xl border border-[#D5CFC4] bg-[#FAF8F5] focus:bg-white focus:border-[#2E5A44] focus:outline-none text-[#232B28] placeholder-[#9E9689]"
                />
              </div>
            )}

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-[#232B28] mb-1"
              >
                Correo Electrónico
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@correo.com"
                className="w-full px-4 py-2.5 text-base rounded-2xl border border-[#D5CFC4] bg-[#FAF8F5] focus:bg-white focus:border-[#2E5A44] focus:outline-none text-[#232B28] placeholder-[#9E9689]"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-[#232B28] mb-1"
              >
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full px-4 py-2.5 text-base rounded-2xl border border-[#D5CFC4] bg-[#FAF8F5] focus:bg-white focus:border-[#2E5A44] focus:outline-none text-[#232B28] placeholder-[#9E9689]"
              />
            </div>

            {/* Role-Specific fields on Register */}
            {mode === "register" && selectedRole === "PATIENT" && (
              <div className="space-y-3 pt-2 border-t border-[#E6E0D6]">
                <div>
                  <label
                    htmlFor="dateOfBirth"
                    className="block text-sm font-semibold text-[#232B28] mb-1"
                  >
                    Fecha de Nacimiento (Opcional)
                  </label>
                  <input
                    id="dateOfBirth"
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full px-4 py-2.5 text-base rounded-2xl border border-[#D5CFC4] bg-[#FAF8F5] focus:bg-white focus:border-[#2E5A44] focus:outline-none text-[#232B28]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="emergencyPhone"
                    className="block text-sm font-semibold text-[#232B28] mb-1"
                  >
                    Teléfono de Contacto de Emergencia
                  </label>
                  <input
                    id="emergencyPhone"
                    type="tel"
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                    placeholder="+34 600 000 000"
                    className="w-full px-4 py-2.5 text-base rounded-2xl border border-[#D5CFC4] bg-[#FAF8F5] focus:bg-white focus:border-[#2E5A44] focus:outline-none text-[#232B28] placeholder-[#9E9689]"
                  />
                </div>
              </div>
            )}

            {mode === "register" && selectedRole === "CAREGIVER" && (
              <div className="space-y-3 pt-2 border-t border-[#E6E0D6]">
                <div>
                  <label
                    htmlFor="relation"
                    className="block text-sm font-semibold text-[#232B28] mb-1"
                  >
                    Parentesco o Relación con el Paciente
                  </label>
                  <input
                    id="relation"
                    type="text"
                    required
                    value={relationToPatient}
                    onChange={(e) => setRelationToPatient(e.target.value)}
                    placeholder="Ej. Madre, Padre, Hermano/a, Tutor Legal"
                    className="w-full px-4 py-2.5 text-base rounded-2xl border border-[#D5CFC4] bg-[#FAF8F5] focus:bg-white focus:border-[#2E5A44] focus:outline-none text-[#232B28] placeholder-[#9E9689]"
                  />
                </div>
              </div>
            )}

            {mode === "register" && selectedRole === "PROFESSIONAL" && (
              <div className="space-y-3 pt-2 border-t border-[#E6E0D6]">
                <div>
                  <label
                    htmlFor="license"
                    className="block text-sm font-semibold text-[#232B28] mb-1"
                  >
                    Número de Colegiatura / Matrícula Profesional
                  </label>
                  <input
                    id="license"
                    type="text"
                    required
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    placeholder="Ej. MED-ESP-29831"
                    className="w-full px-4 py-2.5 text-base rounded-2xl border border-[#D5CFC4] bg-[#FAF8F5] focus:bg-white focus:border-[#2E5A44] focus:outline-none text-[#232B28] placeholder-[#9E9689]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="specialty"
                    className="block text-sm font-semibold text-[#232B28] mb-1"
                  >
                    Especialidad Médica o de Acompañamiento
                  </label>
                  <input
                    id="specialty"
                    type="text"
                    required
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    placeholder="Ej. Psiquiatría, Neurología, Terapia Ocupacional"
                    className="w-full px-4 py-2.5 text-base rounded-2xl border border-[#D5CFC4] bg-[#FAF8F5] focus:bg-white focus:border-[#2E5A44] focus:outline-none text-[#232B28] placeholder-[#9E9689]"
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full min-h-[50px] bg-[#2E5A44] hover:bg-[#244736] text-white font-bold text-base rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2 focus:ring-2 focus:ring-[#2E5A44] focus:outline-none disabled:opacity-50 mt-5 cursor-pointer"
              aria-label={mode === "login" ? "Ingresar a mi cuenta" : "Registrar nueva cuenta"}
            >
              {isSubmitting ? (
                <span>Abriendo espacio...</span>
              ) : (
                <>
                  <span>{mode === "login" ? "Entrar a Take Care" : "Completar Registro"}</span>
                  <ArrowRight className="w-5 h-5" aria-hidden="true" />
                </>
              )}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};
