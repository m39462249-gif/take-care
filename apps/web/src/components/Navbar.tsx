import React from "react";
import { LogOut, HeartHandshake, User, ShieldCheck, Stethoscope, Sparkles, Compass } from "lucide-react";
import { useAuth } from "../context/AuthContext.js";

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  const getRoleInfo = (role: string) => {
    switch (role) {
      case "CAREGIVER":
        return {
          label: "Acompañamiento",
          sublabel: "Familiar y Cuidador",
          icon: HeartHandshake,
          badgeBg: "bg-[#F3EFE8] text-[#5A4A3B] border-[#DDD5C7]",
        };
      case "PROFESSIONAL":
        return {
          label: "Área Médica",
          sublabel: "Equipo de Salud",
          icon: Stethoscope,
          badgeBg: "bg-[#EAF0F6] text-[#2C5270] border-[#C8D9E8]",
        };
      default:
        return {
          label: "Comunidad",
          sublabel: "Usuario",
          icon: ShieldCheck,
          badgeBg: "bg-[#F5F2ED] text-[#4A4742] border-[#DDD8CF]",
        };
    }
  };

  const roleInfo = getRoleInfo(user.role);
  const RoleIcon = roleInfo.icon;

  return (
    <header className="bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#E6E0D6] sticky top-0 z-40 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">
          {/* Logo & Platform Name - Friendly, tactile & calm */}
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#345D47] flex items-center justify-center text-white font-black text-xl shadow-xs border border-[#2B4E3C]">
              🌱
            </div>
            <div>
              <span className="text-xl sm:text-2xl font-black tracking-tight text-[#232B28] block leading-tight">
                Take Care
              </span>
              <span className="text-[11px] font-bold text-[#6B756E] block">
                Guía de Bienestar y Rutina
              </span>
            </div>
          </div>

          {/* User Status & Actions */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Role Badge - Soft, rounded, non-threatening */}
            <div
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs sm:text-sm font-bold ${roleInfo.badgeBg}`}
              aria-label={`Espacio activo: ${roleInfo.label}`}
            >
              <RoleIcon className="w-4 h-4" aria-hidden="true" />
              <span>{roleInfo.label}</span>
            </div>

            {/* User Name */}
            <div className="hidden sm:block text-right">
              <span className="block text-sm font-black text-[#232B28] leading-tight">
                {user.fullName}
              </span>
              <span className="block text-xs text-[#6B756E] font-medium">
                {roleInfo.sublabel}
              </span>
            </div>

            {/* Logout Button - Soft rounded & tactile */}
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#D9D1C5] hover:border-[#B5ACA0] bg-[#FFFFFF] hover:bg-[#FDF6F3] text-[#3D4742] font-bold text-xs sm:text-sm transition-all focus:outline-none focus:ring-2 focus-ring-[#345D47] min-h-[42px] shadow-xs"
              aria-label="Cerrar sesión actual"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4 text-[#5A635E]" aria-hidden="true" />
              <span className="hidden sm:inline">Cerrar sesión</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
export default Navbar;
