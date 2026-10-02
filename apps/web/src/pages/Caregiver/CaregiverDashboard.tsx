import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext.js";
import { Navbar } from "../../components/Navbar.js";
import { QuickLogDashboard } from "../../components/Caregiver/QuickLogDashboard.js";
import { InterventionPlaybook } from "../../components/Caregiver/InterventionPlaybook.js";
import { PreventiveReminders } from "../../components/Caregiver/PreventiveReminders.js";
import { CaregiverMedicationList } from "../../components/Caregiver/CaregiverMedicationList.js";
import { CaregiverAIChatbot } from "../../components/Caregiver/CaregiverAIChatbot.js";
import { SymptomTag, InterventionGuide, CaregiverQuickLog } from "../../types/caregiver.js";
import { getSocket } from "../../utils/socket.js";
import { playGentleChime } from "../../utils/audio.js";

import {
  HeartHandshake,
  CheckCircle2,
  AlertTriangle,
  Bell,
  Clock,
  Radio,
  BookOpen,
  History,
  Mic,
  FileText,
  Bot,
  Sparkles,
  LayoutDashboard,
} from "lucide-react";

export const CaregiverDashboard: React.FC = () => {
  const { user } = useAuth();
  const caregiverId = user?.profileId || user?.id || "cg-demo-001";
  const patientId = "prof-pat-001"; // Mateo Silva

  // Real-time alerts
  const [realtimeMedicationAlert, setRealtimeMedicationAlert] = useState<{
    medicationName?: string;
    takenAt?: string;
    time?: string;
  } | null>(null);

  const [realtimeMissedAlert, setRealtimeMissedAlert] = useState<{
    message?: string;
    time?: string;
  } | null>(null);



  // Active view tab: dashboard or AI chatbot
  const [activeTab, setActiveTab] = useState<"dashboard" | "ai-chatbot">("dashboard");

  // Playbook visibility and active guide
  const [showPlaybook, setShowPlaybook] = useState(false);
  const [activeGuide, setActiveGuide] = useState<InterventionGuide | null>(null);
  const [playbookReason, setPlaybookReason] = useState<string>(
    "Guía rápida activada por reporte de síntoma crítico."
  );

  // Quick logs history
  const [recentLogs, setRecentLogs] = useState<CaregiverQuickLog[]>([]);

  // Socket.io Real-Time Listeners
  useEffect(() => {
    const socket = getSocket();

    // Join caregiver room
    socket.emit("join-room", "caregiver-room");
    socket.emit("join-room", `caregiver-${patientId}`);

    // Listen for medication taken in real time
    const handleMedicationTaken = (data: any) => {
      console.log("🟢 [Socket.io] Medicación tomada en tiempo real:", data);
      playGentleChime();
      setRealtimeMedicationAlert({
        medicationName: data.medicationName || "Medicación programada",
        takenAt: data.takenAt,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      });
      // Auto clear after 10s
      setTimeout(() => setRealtimeMedicationAlert(null), 10000);
    };

    // Listen for medication missed alert (30 minutes passed)
    const handleMedicationMissed = (data: any) => {
      console.log("🚨 [Socket.io] Alerta de medicación no tomada:", data);
      setRealtimeMissedAlert({
        message: data.message || "30 minutos transcurridos sin confirmación de medicación.",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      });
    };

    // Listen for patient calm mode trigger
    const handleCalmModeAlert = (data: any) => {
      console.log("⚠️ [Socket.io] Paciente activó Modo Calma:", data);
      setPlaybookReason(
        `El paciente ha activado el Modo Calma (${data.technique || "Respiración"}). Se recomienda aplicar el playbook ahora.`
      );
      setShowPlaybook(true);
    };

    socket.on("medication:taken", handleMedicationTaken);
    socket.on("medication-confirmed", handleMedicationTaken);
    socket.on("medication-missed-alert", handleMedicationMissed);
    socket.on("calm-mode-alert", handleCalmModeAlert);

    return () => {
      socket.off("medication:taken", handleMedicationTaken);
      socket.off("medication-confirmed", handleMedicationTaken);
      socket.off("medication-missed-alert", handleMedicationMissed);
      socket.off("calm-mode-alert", handleCalmModeAlert);
    };
  }, [patientId]);

  // Fetch initial quick logs history
  const fetchLogs = async () => {
    try {
      const res = await fetch(`/api/caregiver/quick-logs?patientId=${patientId}`);
      const data = await res.json();
      if (data.success && data.data) {
        setRecentLogs(data.data.slice(0, 5));
      }
    } catch (err) {
      console.error("Error al cargar historial de bitácora:", err);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [patientId]);



  // Handle QuickLog submission
  const handleQuickLogSubmitted = (tag: SymptomTag, guide?: any) => {
    fetchLogs();

    // If tag is Agitation or Hallucination, immediately open playbook!
    if (tag === "AGITATION" || tag === "HALLUCINATION") {
      setActiveGuide(guide || null);
      setPlaybookReason(
        `Se registró ${tag === "AGITATION" ? "Agitación" : "Alucinaciones"} en la bitácora. Aquí tienes los 3 pasos de acción:`
      );
      setShowPlaybook(true);
    }
  };

  const getSymptomLabel = (tag: SymptomTag) => {
    switch (tag) {
      case "NO_SLEEP":
        return "No durmió";
      case "AGITATION":
        return "Agitado";
      case "FOOD_REFUSAL":
        return "No comió";
      case "HALLUCINATION":
        return "Alucinaciones";
      default:
        return tag;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Real-time Socket.io Live Alert: Medication Taken Confirmed - Square & Muted */}
        {realtimeMedicationAlert && (
          <div
            role="status"
            aria-live="assertive"
            className="p-4 rounded-none bg-slate-800 text-white font-bold text-base sm:text-lg flex items-center justify-between border-2 border-slate-950 shadow-none"
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-stone-300 stroke-[2.5]" />
              <span>
                Confirmación: Mateo tomó su medicación ({realtimeMedicationAlert.medicationName}) a las{" "}
                {realtimeMedicationAlert.time}.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setRealtimeMedicationAlert(null)}
              className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-xs font-bold rounded-none text-slate-200 border border-slate-600"
            >
              Cerrar
            </button>
          </div>
        )}

        {/* Real-time Socket.io Live Alert: Medication Missed 30 Min Alert */}
        {realtimeMissedAlert && (
          <div
            role="alert"
            className="p-4 rounded-none bg-stone-900 text-stone-100 font-bold text-base sm:text-lg flex items-center justify-between border-2 border-stone-700 shadow-none"
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-stone-300 stroke-[2.5]" />
              <span>{realtimeMissedAlert.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setRealtimeMissedAlert(null)}
              className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-xs font-bold rounded-none text-stone-200 border border-stone-600"
            >
              Entendido
            </button>
          </div>
        )}

        {/* Header / Acompañamiento del Cuidado - Warm, soft rounded & reassuring */}
        <header className="bg-white border-1.5 border-[#E6E0D6] rounded-3xl p-6 sm:p-7 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#EBF3EE] text-[#2E5A44] font-bold text-xs uppercase tracking-wider rounded-full mb-2 border border-[#D0E2D6]">
              <span>🌿</span>
              <span>Acompañamiento y Cuidado Activo</span>
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-[#232B28] tracking-tight">
              Panel de {user?.fullName || "Elena Silva"}
            </h1>
            <p className="text-base sm:text-lg text-[#58635D] font-medium mt-0.5">
              Cuidado diario de <span className="text-[#232B28] font-bold underline">Mateo Silva</span> (26 años)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveTab(activeTab === "ai-chatbot" ? "dashboard" : "ai-chatbot")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-sm border transition-all ${
                activeTab === "ai-chatbot"
                  ? "bg-[#2E5A44] hover:bg-[#254A37] text-white border-[#224433] shadow-xs"
                  : "bg-[#EBF3EE] hover:bg-[#DDECE2] text-[#2E5A44] border-[#CCE0D4]"
              }`}
            >
              <BookOpen className="w-4 h-4 text-[#2E5A44]" />
              <span>{activeTab === "ai-chatbot" ? "Volver a la Bitácora" : "Guía de Consulta y Apoyo"}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPlaybookReason("Consulta manual de guía de intervención.");
                setShowPlaybook((prev) => !prev);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#F6F2EB] hover:bg-[#EDE6DC] text-[#3E4742] font-bold text-sm border border-[#D9D1C5] transition-all focus:outline-none focus:ring-2 focus:ring-[#345D47]"
            >
              <BookOpen className="w-4 h-4 text-[#5A635E]" />
              <span>{showPlaybook ? "Ocultar Guía Rápida" : "Guía Rápida de Crisis"}</span>
            </button>

            <div className="flex items-center gap-2 bg-[#EBF3EE] border border-[#CCE0D4] px-3.5 py-2 rounded-full text-[#2E5A44] text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-[#2E5A44] animate-pulse" />
              <span>Conexión en Directo</span>
            </div>
          </div>
        </header>

        {/* View Mode Navigation Tabs */}
        <div className="flex border-b border-[#E6E0D6] gap-3">
          <button
            type="button"
            onClick={() => setActiveTab("dashboard")}
            className={`px-5 py-3 font-bold text-sm flex items-center gap-2.5 rounded-t-2xl border-t-1.5 border-l-1.5 border-r-1.5 -mb-[1.5px] transition-all ${
              activeTab === "dashboard"
                ? "bg-white border-[#E6E0D6] border-b-2 border-b-white text-[#232B28] shadow-2xs"
                : "bg-[#F3EFE9] border-transparent text-[#647068] hover:text-[#232B28]"
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-[#345D47]" />
            <span>Cuaderno de Cuidado y Bitácora</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("ai-chatbot")}
            className={`px-5 py-3 font-bold text-sm flex items-center gap-2.5 rounded-t-2xl border-t-1.5 border-l-1.5 border-r-1.5 -mb-[1.5px] transition-all ${
              activeTab === "ai-chatbot"
                ? "bg-white border-[#E6E0D6] border-b-2 border-b-white text-[#232B28] shadow-2xs"
                : "bg-[#F3EFE9] border-transparent text-[#647068] hover:text-[#232B28]"
            }`}
          >
            <BookOpen className="w-4 h-4 text-[#2E5A44]" />
            <span>Guía de Consulta y Apoyo Clínico</span>
          </button>
        </div>

        {activeTab === "ai-chatbot" ? (
          /* SECCIÓN DE CONSULTA Y APOYO CLÍNICO */
          <CaregiverAIChatbot patientId={patientId} patientName="Mateo Silva" />
        ) : (
          /* PANEL OPERATIVO HABITUAL */
          <>
            {/* Quick Banner to Consultation */}
            <div className="bg-[#FAF7F2] border-1.5 border-[#E6E0D6] rounded-3xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 bg-[#EAF2EC] text-[#2E5A44] border border-[#CCE0D4] rounded-2xl flex items-center justify-center text-xl shrink-0">
                  🌿
                </div>
                <div>
                  <h4 className="text-base font-black text-[#232B28]">
                    ¿Dudas con la medicación o necesitas pautas para un momento de agitación?
                  </h4>
                  <p className="text-xs sm:text-sm text-[#5B6660] font-medium">
                    Consulta la guía clínica empática para recibir recomendaciones no farmacológicas y apoyo inmediato.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab("ai-chatbot")}
                className="px-4 py-2.5 bg-[#2E5A44] hover:bg-[#254A37] text-white font-bold text-xs sm:text-sm rounded-xl border border-[#203E2F] transition-all shrink-0 shadow-xs cursor-pointer"
              >
                Abrir Guía de Consulta
              </button>
            </div>

            {/* Pautas Médicas y Medicamentos enviados por el Doctor */}
            <CaregiverMedicationList
              patientId={patientId}
              patientName="Mateo Silva"
            />

            {/* 2. Componente InterventionPlaybook (Mostrado condicionalmente o por alerta) */}
            {showPlaybook && (
              <InterventionPlaybook
                guide={activeGuide}
                triggerReason={playbookReason}
                onDismiss={() => setShowPlaybook(false)}
              />
            )}

            {/* 1. Componente QuickLogDashboard (Bitácora Rápida: 4 Botones Gigantes + MediaRecorder) */}
            <QuickLogDashboard
              patientId={patientId}
              caregiverId={caregiverId}
              onQuickLogSubmitted={handleQuickLogSubmitted}
            />

            {/* Grid: Preventive Reminders & Recent Activity History */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* 3. Componente PreventiveReminders (2 columnas) */}
              <div className="lg:col-span-2">
                <PreventiveReminders patientId={patientId} />
              </div>

              {/* Historial Reciente de Bitácora (1 columna) */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <History className="w-5 h-5 text-slate-700" />
                  <h3 className="text-xl font-black text-slate-900">
                    Últimos Registros
                  </h3>
                </div>

                <div className="bg-white border border-slate-300 rounded-none p-4 shadow-none space-y-2.5">
                  {recentLogs.length === 0 ? (
                    <p className="text-slate-500 font-medium text-xs py-4 text-center">
                      Aún no hay registros de bitácora hoy.
                    </p>
                  ) : (
                    recentLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-3 bg-stone-50 rounded-none border border-slate-200 flex flex-col gap-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-slate-900">
                            {getSymptomLabel(log.symptomTag)}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(log.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>

                        {log.notes && (
                          <p className="text-xs text-slate-700 font-medium line-clamp-2">
                            {log.notes}
                          </p>
                        )}

                        {log.audioUrl && (
                          <div className="mt-1">
                            <audio controls src={log.audioUrl} className="w-full h-7" />
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default CaregiverDashboard;