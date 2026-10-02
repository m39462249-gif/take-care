import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext.js";
import { Navbar } from "../../components/Navbar.js";
import { PatientOverview } from "../../components/Clinical/PatientOverview.js";
import { PrescriptionManager } from "../../components/Clinical/PrescriptionManager.js";
import { ClinicalEvolutionAI } from "../../components/Clinical/ClinicalEvolutionAI.js";
import { Stethoscope, Users, CheckCircle2, ShieldCheck, Activity, Pill, Send, Sparkles, Bot, FileText } from "lucide-react";

export const ClinicalDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"patients" | "prescriptions" | "ai-evolution">("patients");
  const [selectedPatientId, setSelectedPatientId] = useState("prof-pat-001");

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#232B28] pb-20">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Header - Warm, soft rounded & clinical */}
        <div className="bg-white border-1.5 border-[#E6E0D6] rounded-3xl p-6 sm:p-7 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <span className="inline-block px-3 py-1 bg-[#EBF3EE] text-[#2E5A44] font-bold text-xs uppercase tracking-wider rounded-full mb-2 border border-[#D0E2D6]">
              Portal Clínico y Terapéutico
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-[#232B28]">
              Área Médica • {user?.fullName || "Dra. Sofía Martínez"}
            </h1>
            <p className="text-sm sm:text-base text-[#5B6660] mt-0.5 font-medium">
              Seguimiento de adherencia, prescripción para cuidadores y evolución clínica estructurada.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveTab("ai-evolution")}
              className={`inline-flex items-center gap-2 px-4 py-2.5 font-bold text-sm rounded-2xl border transition-all shadow-2xs ${
                activeTab === "ai-evolution"
                  ? "bg-[#244E70] text-white border-[#193850]"
                  : "bg-[#F0F6FA] hover:bg-[#E2EDF5] text-[#244E70] border-[#CCE0EE]"
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Síntesis de Evolución</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("prescriptions")}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#2E5A44] hover:bg-[#254A37] text-white font-bold text-sm rounded-2xl border border-[#203E2F] transition-all shadow-2xs"
            >
              <Pill className="w-4 h-4" />
              <span>Pautar Medicamento</span>
            </button>

            <div className="flex items-center gap-3 bg-[#FAF7F2] border border-[#DDD5C8] px-4 py-2 rounded-2xl">
              <Stethoscope className="w-5 h-5 text-[#5A635E]" aria-hidden="true" />
              <div>
                <span className="block text-[10px] uppercase tracking-wider text-[#737E77] font-bold">
                  Matrícula Profesional
                </span>
                <span className="text-xs font-bold text-[#232B28]">
                  MED-ESP-29831 • Psiquiatría
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Clinical Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border-1.5 border-[#E6E0D6] rounded-2xl p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[#647068] font-bold text-xs uppercase tracking-wider">
                Pacientes en Seguimiento
              </span>
              <Users className="w-4 h-4 text-[#345D47]" aria-hidden="true" />
            </div>
            <p className="text-2xl font-black text-[#232B28] mt-1">2 Activos</p>
            <span className="text-xs text-[#58635D] font-medium mt-0.5 block">
              100% con cuidadores activos
            </span>
          </div>

          <div className="bg-white border-1.5 border-[#E6E0D6] rounded-2xl p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[#647068] font-bold text-xs uppercase tracking-wider">
                Adherencia Global
              </span>
              <CheckCircle2 className="w-4 h-4 text-[#2E5A44]" aria-hidden="true" />
            </div>
            <p className="text-2xl font-black text-[#2E5A44] mt-1">92.8%</p>
            <span className="text-xs text-[#58635D] font-medium mt-0.5 block">
              Confirmaciones en tiempo y forma
            </span>
          </div>

          <div className="bg-white border-1.5 border-[#E6E0D6] rounded-2xl p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[#647068] font-bold text-xs uppercase tracking-wider">
                Eventos Intervenidos
              </span>
              <Activity className="w-4 h-4 text-[#244E70]" aria-hidden="true" />
            </div>
            <p className="text-2xl font-black text-[#232B28] mt-1">100%</p>
            <span className="text-xs text-[#58635D] font-medium mt-0.5 block">
              Con guías de acción no farmacológica
            </span>
          </div>
        </div>

        {/* Main Navigation Tabs */}
        <div className="flex items-center border-b border-[#E6E0D6] gap-3">
          <button
            type="button"
            onClick={() => setActiveTab("patients")}
            className={`py-3 px-5 text-sm font-bold flex items-center gap-2 rounded-t-2xl border-t-1.5 border-l-1.5 border-r-1.5 -mb-[1.5px] transition-all ${
              activeTab === "patients"
                ? "border-[#E6E0D6] border-b-2 border-b-white text-[#232B28] bg-white shadow-2xs"
                : "border-transparent text-[#647068] hover:text-[#232B28] hover:bg-[#F2ECE2]"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Expedientes de Pacientes</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("prescriptions")}
            className={`py-3 px-5 text-sm font-bold flex items-center gap-2 rounded-t-2xl border-t-1.5 border-l-1.5 border-r-1.5 -mb-[1.5px] transition-all ${
              activeTab === "prescriptions"
                ? "border-[#E6E0D6] border-b-2 border-b-white text-[#232B28] bg-white shadow-2xs"
                : "border-transparent text-[#647068] hover:text-[#232B28] hover:bg-[#F2ECE2]"
            }`}
          >
            <Pill className="w-4 h-4 text-[#2E5A44]" />
            <span>Pauta Médica para Cuidadores</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("ai-evolution")}
            className={`py-3 px-5 text-sm font-bold flex items-center gap-2 rounded-t-2xl border-t-1.5 border-l-1.5 border-r-1.5 -mb-[1.5px] transition-all ${
              activeTab === "ai-evolution"
                ? "border-[#E6E0D6] border-b-2 border-b-white text-[#232B28] bg-white shadow-2xs"
                : "border-transparent text-[#647068] hover:text-[#232B28] hover:bg-[#F2ECE2]"
            }`}
          >
            <FileText className="w-4 h-4 text-[#244E70]" />
            <span>Síntesis de Evolución Médica</span>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "patients" ? (
          /* 1. Componente PatientOverview (Lista y Estado de Pacientes) */
          <PatientOverview />
        ) : activeTab === "prescriptions" ? (
          /* 2. Componente PrescriptionManager (Enviar Medicamentos al Cuidador) */
          <div className="space-y-4">
            {/* Patient Selector for prescribing */}
            <div className="bg-white border border-slate-300 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase text-slate-600 tracking-wider">
                  Paciente Seleccionado:
                </span>
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-300 text-sm font-bold text-slate-900 rounded-none focus:outline-none focus:border-slate-800"
                >
                  <option value="prof-pat-001">Mateo Silva (26 años) • Cuidador: Elena Silva (Madre)</option>
                </select>
              </div>

              <span className="text-xs font-semibold text-slate-500">
                Transmisión en tiempo real vía Socket.io al panel del cuidador
              </span>
            </div>

            <PrescriptionManager
              patientId={selectedPatientId}
              patientName="Mateo Silva"
              caregiverName="Elena Silva"
            />
          </div>
        ) : (
          /* 3. Componente ClinicalEvolutionAI (Asistente IA de Evolución Médica) */
          <ClinicalEvolutionAI
            selectedPatientId={selectedPatientId}
            patientName="Mateo Silva"
          />
        )}
      </main>
    </div>
  );
};

export default ClinicalDashboard;
