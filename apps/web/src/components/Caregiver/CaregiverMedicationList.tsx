import React, { useState, useEffect } from "react";
import {
  Pill,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Stethoscope,
  Info,
  Calendar,
  Sparkles,
  HeartHandshake,
  UserCheck,
  ChevronRight,
  Filter,
} from "lucide-react";
import { getSocket } from "../../utils/socket.js";
import { playGentleChime } from "../../utils/audio.js";
import { MedicationPrescription } from "../../types/clinical.js";
import { apiUrl, smartFetch } from "../../utils/api.js";

interface CaregiverMedicationListProps {
  patientId: string;
  patientName?: string;
}

export const CaregiverMedicationList: React.FC<CaregiverMedicationListProps> = ({
  patientId,
  patientName = "Mateo",
}) => {
  const [schedules, setSchedules] = useState<MedicationPrescription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "MORNING" | "AFTERNOON" | "NIGHT">("ALL");

  // Real-time prescription alert notification banner
  const [realtimePrescriptionAlert, setRealtimePrescriptionAlert] = useState<{
    medicationName: string;
    dosage?: string;
    timeOfDay: string;
    prescribedBy: string;
    instructions?: string;
    timestamp: string;
  } | null>(null);

  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const fetchSchedules = async () => {
    try {
      const res = await smartFetch(apiUrl(`/api/medications/schedules?patientId=${patientId}`));
      const data = await res.json();
      if (data.success && data.data) {
        setSchedules(data.data);
      }
    } catch (err) {
      console.error("Error al obtener pautas de medicación para el cuidador:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, [patientId]);

  // Socket.io Real-time listener for doctor prescriptions & intakes
  useEffect(() => {
    const socket = getSocket();

    const handlePrescriptionReceived = (data: any) => {
      console.log("🩺 [Socket.io] Nueva prescripción médica recibida en tiempo real:", data);
      playGentleChime();

      setRealtimePrescriptionAlert({
        medicationName: data.medicationName || "Nuevo medicamento",
        dosage: data.dosage,
        timeOfDay: data.timeOfDay || "--:--",
        prescribedBy: data.prescribedBy || "El doctor",
        instructions: data.instructions,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      });

      // Refresh schedule list
      fetchSchedules();
    };

    const handleMedicationDeleted = (data: any) => {
      console.log("🗑️ [Socket.io] Pauta médica retirada:", data);
      setActionFeedback(`La pauta de ${data.medicationName || "un medicamento"} ha sido retirada por el médico.`);
      setTimeout(() => setActionFeedback(null), 6000);
      fetchSchedules();
    };

    const handleMedicationTaken = () => {
      fetchSchedules();
    };

    socket.on("medication:prescribed", handlePrescriptionReceived);
    socket.on("medication:deleted", handleMedicationDeleted);
    socket.on("medication:taken", handleMedicationTaken);
    socket.on("medication-confirmed", handleMedicationTaken);

    return () => {
      socket.off("medication:prescribed", handlePrescriptionReceived);
      socket.off("medication:deleted", handleMedicationDeleted);
      socket.off("medication:taken", handleMedicationTaken);
      socket.off("medication-confirmed", handleMedicationTaken);
    };
  }, [patientId]);

  // Check if taken today
  const isTakenToday = (schedule: MedicationPrescription) => {
    if (!schedule.logs || schedule.logs.length === 0) return false;
    const today = new Date().toDateString();
    return schedule.logs.some((log) => new Date(log.takenAt).toDateString() === today);
  };

  const getLogToday = (schedule: MedicationPrescription) => {
    if (!schedule.logs || schedule.logs.length === 0) return null;
    const today = new Date().toDateString();
    return schedule.logs.find((log) => new Date(log.takenAt).toDateString() === today) || null;
  };

  // Manual caregiver confirmation
  const handleManualConfirm = async (scheduleId: string, medName: string) => {
    try {
      playGentleChime();
      const res = await smartFetch(apiUrl("/api/medications/log"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduleId,
          patientId,
          confirmedByDragAndDrop: true,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setActionFeedback(`✓ Confirmada la administración de ${medName} por el cuidador.`);
        setTimeout(() => setActionFeedback(null), 5000);
        fetchSchedules();
      }
    } catch (err) {
      console.error("Error al registrar toma manual:", err);
    }
  };

  // Filter schedules by time of day
  const filteredSchedules = schedules.filter((schedule) => {
    if (filter === "ALL") return true;
    const hour = parseInt(schedule.timeOfDay.split(":")[0], 10);
    if (filter === "MORNING") return hour >= 6 && hour < 13;
    if (filter === "AFTERNOON") return hour >= 13 && hour < 19;
    if (filter === "NIGHT") return hour >= 19 || hour < 6;
    return true;
  });

  const totalSchedules = schedules.length;
  const takenCount = schedules.filter((s) => isTakenToday(s)).length;
  const percentage = totalSchedules > 0 ? Math.round((takenCount / totalSchedules) * 100) : 0;

  return (
    <section
      aria-label="Pauta Médica del Paciente - Indicaciones del Doctor"
      className="bg-white border border-[#E6E0D6] rounded-3xl p-6 sm:p-7 shadow-sm space-y-6"
    >
      {/* Real-time Alert Banner: Doctor Prescribed New Medication */}
      {realtimePrescriptionAlert && (
        <div
          role="status"
          aria-live="assertive"
          className="p-4 sm:p-5 bg-[#1F3D2E] text-white rounded-2xl border border-[#2E5A44] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md animate-in fade-in"
        >
          <div className="flex items-start gap-3">
            <Stethoscope className="w-6 h-6 text-[#A3D9BD] stroke-[2.2] flex-shrink-0 mt-0.5" />
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-[#2E5A44] text-[11px] font-bold text-white uppercase tracking-wider rounded-full">
                  Nueva Indicación Médica • {realtimePrescriptionAlert.timestamp}
                </span>
                <span className="text-xs text-[#EBF3EE] font-medium">
                  {realtimePrescriptionAlert.prescribedBy}
                </span>
              </div>
              <p className="text-base font-bold text-white mt-1">
                La clínica ha actualizado la pauta:{" "}
                <span className="underline decoration-[#A3D9BD]">{realtimePrescriptionAlert.medicationName}</span>
                {realtimePrescriptionAlert.dosage ? ` (${realtimePrescriptionAlert.dosage})` : ""} para las{" "}
                {realtimePrescriptionAlert.timeOfDay}.
              </p>
              {realtimePrescriptionAlert.instructions && (
                <p className="text-xs text-[#D8EADB] font-medium mt-1">
                  Indicación: {realtimePrescriptionAlert.instructions}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setRealtimePrescriptionAlert(null)}
            className="px-3.5 py-1.5 bg-white/15 hover:bg-white/25 text-xs font-bold rounded-xl text-white border border-white/20 self-end sm:self-auto transition-colors"
          >
            Entendido
          </button>
        </div>
      )}

      {/* Action Feedback message */}
      {actionFeedback && (
        <div className="p-3.5 bg-[#FAF0E4] border border-[#E5C79E] text-[#7A4B1A] text-xs font-bold rounded-2xl flex items-center justify-between">
          <span>{actionFeedback}</span>
          <button type="button" onClick={() => setActionFeedback(null)} className="underline ml-2">
            Cerrar
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E6E0D6]">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-[#EBF3EE] text-[#2E5A44] text-xs font-bold rounded-full">
              Pauta Médica Oficial
            </span>
            <span className="text-xs font-medium text-[#7D8883]">• Indicada por el equipo médico</span>
          </div>
          <h2 className="text-2xl font-bold text-[#232B28] mt-1.5">
            Medicamentos y Pautas de {patientName}
          </h2>
          <p className="text-sm text-[#57645E] font-medium mt-0.5">
            Instrucciones y dosis prescritas por la clínica para la supervisión y acompañamiento del paciente.
          </p>
        </div>

        {/* Progress Adherence Today */}
        <div className="bg-[#FAF8F5] border border-[#E6E0D6] p-3.5 sm:p-4 rounded-2xl min-w-[220px]">
          <div className="flex justify-between items-center text-xs font-bold text-[#232B28] mb-1.5">
            <span>Tomas del día:</span>
            <span className="text-[#2E5A44]">
              {takenCount} de {totalSchedules} ({percentage}%)
            </span>
          </div>
          <div className="w-full bg-[#E6E0D6] h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-[#2E5A44] h-full rounded-full transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <span className="text-[11px] text-[#57645E] block font-medium mt-1.5">
            {takenCount === totalSchedules && totalSchedules > 0
              ? "✓ Todas las tomas del día completadas"
              : `${totalSchedules - takenCount} toma(s) pendiente(s)`}
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <Filter className="w-4 h-4 text-[#7D8883]" />
          <span className="text-xs font-bold text-[#57645E] mr-1">
            Filtrar:
          </span>
          <button
            type="button"
            onClick={() => setFilter("ALL")}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
              filter === "ALL"
                ? "bg-[#2E5A44] text-white shadow-xs"
                : "bg-[#FAF8F5] text-[#57645E] border border-[#E6E0D6] hover:bg-[#EBF3EE]"
            }`}
          >
            Todas ({schedules.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("MORNING")}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
              filter === "MORNING"
                ? "bg-[#2E5A44] text-white shadow-xs"
                : "bg-[#FAF8F5] text-[#57645E] border border-[#E6E0D6] hover:bg-[#EBF3EE]"
            }`}
          >
            ☀️ Mañana
          </button>
          <button
            type="button"
            onClick={() => setFilter("AFTERNOON")}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
              filter === "AFTERNOON"
                ? "bg-[#2E5A44] text-white shadow-xs"
                : "bg-[#FAF8F5] text-[#57645E] border border-[#E6E0D6] hover:bg-[#EBF3EE]"
            }`}
          >
            🥪 Tarde
          </button>
          <button
            type="button"
            onClick={() => setFilter("NIGHT")}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
              filter === "NIGHT"
                ? "bg-[#2E5A44] text-white shadow-xs"
                : "bg-[#FAF8F5] text-[#57645E] border border-[#E6E0D6] hover:bg-[#EBF3EE]"
            }`}
          >
            🌙 Noche
          </button>
        </div>

        <span className="text-xs font-medium text-[#7D8883]">
          Mostrando {filteredSchedules.length} de {schedules.length} pauta(s)
        </span>
      </div>

      {/* Medication Cards List */}
      {isLoading ? (
        <div className="p-8 text-center bg-[#FAF8F5] border border-[#E6E0D6] rounded-2xl">
          <div className="w-8 h-8 mx-auto border-2 border-[#2E5A44] border-t-transparent animate-spin rounded-full mb-2" />
          <p className="text-xs font-bold text-[#57645E]">Cargando pautas médicas del doctor...</p>
        </div>
      ) : filteredSchedules.length === 0 ? (
        <div className="p-8 text-center bg-[#FAF8F5] border border-[#E6E0D6] rounded-2xl">
          <Pill className="w-8 h-8 text-[#9E9689] mx-auto mb-2" />
          <p className="text-sm font-bold text-[#232B28]">
            No hay medicamentos programados en este horario.
          </p>
          <p className="text-xs text-[#57645E] mt-1">
            Cualquier prescripción que el médico agregue en la clínica aparecerá aquí automáticamente.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSchedules.map((schedule) => {
            const taken = isTakenToday(schedule);
            const todayLog = getLogToday(schedule);

            return (
              <div
                key={schedule.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                  taken
                    ? "bg-[#F7F4EE]/60 border-[#E6E0D6]"
                    : "bg-[#FAF8F5] border-[#E6E0D6] shadow-xs hover:border-[#2E5A44]/40"
                }`}
              >
                <div className="space-y-3">
                  {/* Top Bar: Time and Status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#2E5A44] text-white text-xs font-bold rounded-full">
                        <Clock className="w-3.5 h-3.5 text-[#A3D9BD]" />
                        <span>{schedule.timeOfDay}</span>
                      </span>

                      {schedule.frequency && (
                        <span className="text-xs font-medium text-[#57645E] bg-white border border-[#E6E0D6] px-2.5 py-0.5 rounded-full">
                          {schedule.frequency}
                        </span>
                      )}
                    </div>

                    {taken ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#EBF3EE] text-[#2E5A44] text-xs font-bold rounded-full">
                        <CheckCircle2 className="w-4 h-4 text-[#2E5A44]" />
                        <span>Tomada</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#FAF0E4] text-[#8C5E24] text-xs font-bold rounded-full">
                        <Clock className="w-4 h-4 text-[#8C5E24]" />
                        <span>Pendiente</span>
                      </span>
                    )}
                  </div>

                  {/* Medication Identification: Name, Dosage, Image */}
                  <div className="flex items-start gap-3.5">
                    <div className="w-16 h-16 bg-white border border-[#E6E0D6] rounded-2xl overflow-hidden flex-shrink-0 flex items-center justify-center shadow-xs">
                      {schedule.imageUrl ? (
                        <img
                          src={schedule.imageUrl}
                          alt={schedule.medicationName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Pill className="w-8 h-8 text-[#2E5A44]/60" />
                      )}
                    </div>

                    <div>
                      <h3 className="text-xl font-bold text-[#232B28] leading-tight">
                        {schedule.medicationName}
                      </h3>
                      {schedule.dosage && (
                        <span className="inline-block mt-1 px-2.5 py-0.5 text-xs font-bold bg-[#EBF3EE] text-[#2E5A44] rounded-full">
                          Dosis: {schedule.dosage}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Doctor's Clinical Instructions for Caregiver */}
                  {schedule.instructions ? (
                    <div className="p-3.5 bg-white border border-[#E6E0D6] rounded-xl space-y-1">
                      <div className="flex items-center gap-1.5 text-[#2E5A44] text-xs font-bold uppercase tracking-wider">
                        <Stethoscope className="w-3.5 h-3.5 text-[#2E5A44]" />
                        <span>Indicación Médica ({schedule.prescribedBy || "Doctor"}):</span>
                      </div>
                      <p className="text-xs sm:text-sm text-[#232B28] font-medium leading-relaxed">
                        {schedule.instructions}
                      </p>
                    </div>
                  ) : (
                    <div className="p-2.5 bg-white border border-[#E6E0D6] rounded-xl text-xs text-[#57645E] font-medium">
                      Tomar según pauta habitual con abundante agua.
                    </div>
                  )}

                  {/* Intake Verification Details */}
                  {taken && todayLog && (
                    <div className="text-xs text-[#57645E] font-medium flex items-center gap-1.5 pt-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#2E5A44]" />
                      <span>
                        Confirmada hoy a las{" "}
                        {new Date(todayLog.takenAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        vía ritual de confirmación.
                      </span>
                    </div>
                  )}
                </div>

                {/* Footer Actions for Caregiver */}
                <div className="pt-3 border-t border-[#E6E0D6] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <span className="text-[11px] text-[#7D8883] font-medium">
                    Pautado por: {schedule.prescribedBy || "Dra. Sofía Martínez"}
                  </span>

                  {!taken ? (
                    <button
                      type="button"
                      onClick={() => handleManualConfirm(schedule.id, schedule.medicationName)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#2E5A44] hover:bg-[#244736] text-white font-bold text-xs rounded-xl shadow-xs transition-colors self-end sm:self-auto cursor-pointer"
                      title="Registrar que ya se le suministró la medicina al paciente"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-white" />
                      <span>Registrar toma manual</span>
                    </button>
                  ) : (
                    <span className="text-xs font-bold text-[#2E5A44] flex items-center gap-1">
                      ✓ Toma registrada
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
