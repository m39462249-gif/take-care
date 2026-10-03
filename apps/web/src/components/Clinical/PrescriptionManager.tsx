import React, { useState, useEffect } from "react";
import {
  Pill,
  Clock,
  Send,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Sparkles,
  Info,
  ShieldCheck,
  Stethoscope,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.js";
import { MedicationPrescription } from "../../types/clinical.js";
import { apiUrl, smartFetch } from "../../utils/api.js";

interface PrescriptionManagerProps {
  patientId: string;
  patientName?: string;
  caregiverName?: string;
  onPrescriptionAdded?: () => void;
}

const COMMON_MEDICATIONS = [
  {
    name: "Risperidona",
    dosage: "1 comprimido (1mg)",
    frequency: "Diario (Con el desayuno)",
    time: "08:30",
    instructions: "Dar con abundante agua tras comida sólida. Vigilar marcha o somnolencia matutina.",
    imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80",
  },
  {
    name: "Sertralina",
    dosage: "1 cápsula (50mg)",
    frequency: "Diario (Con la cena)",
    time: "20:00",
    instructions: "Tomar durante la cena con agua. Regula el estado de ánimo y disminuye la ansiedad vespertina.",
    imageUrl: "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=600&auto=format&fit=crop&q=80",
  },
  {
    name: "Quetiapina",
    dosage: "1 comprimido (25mg)",
    frequency: "Nocturno (Antes de dormir)",
    time: "22:00",
    instructions: "Administrar 30 minutos antes de acostarse. Favorece la conciliación del sueño y reduce agitación.",
    imageUrl: "https://images.unsplash.com/photo-1550572017-edb79984244b?w=600&auto=format&fit=crop&q=80",
  },
  {
    name: "Memantina",
    dosage: "1 comprimido (10mg)",
    frequency: "Cada 24 horas",
    time: "09:00",
    instructions: "Protección cognitiva. Tomar a la misma hora cada día, preferentemente en el desayuno.",
    imageUrl: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=600&auto=format&fit=crop&q=80",
  },
];

const TIME_PRESETS = [
  { label: "☀️ Desayuno (08:30)", time: "08:30", frequency: "Mañana (Desayuno)" },
  { label: "🥪 Almuerzo (14:00)", time: "14:00", frequency: "Mediodía (Almuerzo)" },
  { label: "🌅 Merienda (18:00)", time: "18:00", frequency: "Tarde (Merienda)" },
  { label: "🌙 Cena (20:30)", time: "20:30", frequency: "Noche (Cena)" },
  { label: "🛏️ Antes de dormir (22:30)", time: "22:30", frequency: "Nocturno (Dormir)" },
];

const INSTRUCTION_PRESETS = [
  "Tomar tras alimento sólido con abundante agua.",
  "No triturar ni suspender bruscamente. Notificar cualquier rigidez.",
  "Tomar con la cena para reducir malestar gástrico y ayudar al descanso.",
  "Observar tolerancia gástrica y reportar en bitácora si hay rechazo o náuseas.",
];

export const PrescriptionManager: React.FC<PrescriptionManagerProps> = ({
  patientId,
  patientName = "Mateo Silva",
  caregiverName = "Elena Silva",
  onPrescriptionAdded,
}) => {
  const { user } = useAuth();
  const doctorName = user?.fullName || "Dra. Sofía Martínez";

  const [schedules, setSchedules] = useState<MedicationPrescription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(true);

  // Form State
  const [medicationName, setMedicationName] = useState("");
  const [dosage, setDosage] = useState("");
  const [timeOfDay, setTimeOfDay] = useState("08:30");
  const [frequency, setFrequency] = useState("Diario (Con el desayuno)");
  const [instructions, setInstructions] = useState("");
  const [imageUrl, setImageUrl] = useState(
    "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80"
  );

  const fetchSchedules = async () => {
    try {
      setIsLoading(true);
      const res = await smartFetch(apiUrl(`/api/medications/schedules?patientId=${patientId}`));
      const data = await res.json();
      if (data.success && data.data) {
        setSchedules(data.data);
      }
    } catch (err) {
      console.error("Error al obtener pautas de medicación:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, [patientId]);

  const handleApplyPreset = (preset: (typeof COMMON_MEDICATIONS)[0]) => {
    setMedicationName(preset.name);
    setDosage(preset.dosage);
    setFrequency(preset.frequency);
    setTimeOfDay(preset.time);
    setInstructions(preset.instructions);
    setImageUrl(preset.imageUrl);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!medicationName.trim()) {
      setFeedbackMessage({ type: "error", text: "Por favor indique el nombre del medicamento." });
      return;
    }

    try {
      setIsSubmitting(true);
      setFeedbackMessage(null);

      const res = await smartFetch(apiUrl("/api/medications/schedules"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId,
          medicationName: medicationName.trim(),
          dosage: dosage.trim() || null,
          timeOfDay,
          frequency: frequency.trim() || null,
          instructions: instructions.trim() || null,
          prescribedBy: doctorName,
          imageUrl: imageUrl || null,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setFeedbackMessage({
          type: "success",
          text: `✅ Pauta médica enviada inmediatamente al panel del cuidador (${caregiverName}) vía Socket.io.`,
        });

        // Reset form to defaults
        setMedicationName("");
        setDosage("");
        setInstructions("");

        // Refresh list
        fetchSchedules();
        if (onPrescriptionAdded) {
          onPrescriptionAdded();
        }
      } else {
        setFeedbackMessage({
          type: "error",
          text: data.message || "Error al enviar la prescripción médica.",
        });
      }
    } catch (err: any) {
      setFeedbackMessage({
        type: "error",
        text: "Error de red al comunicarse con el servidor clínico.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSchedule = async (scheduleId: string, name: string) => {
    const confirmDelete = window.confirm(
      `¿Está seguro de suspender o retirar la pauta de ${name}? Se notificará inmediatamente al cuidador.`
    );
    if (!confirmDelete) return;

    try {
      const res = await smartFetch(apiUrl(`/api/medications/schedules/${scheduleId}`), {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setFeedbackMessage({
          type: "success",
          text: `Pauta de ${name} retirada y notificada en tiempo real al cuidador.`,
        });
        fetchSchedules();
      } else {
        setFeedbackMessage({ type: "error", text: data.message || "No se pudo retirar la pauta." });
      }
    } catch (err) {
      setFeedbackMessage({ type: "error", text: "Error de red al retirar la pauta médica." });
    }
  };

  const isTakenToday = (schedule: MedicationPrescription) => {
    if (!schedule.logs || schedule.logs.length === 0) return false;
    const today = new Date().toDateString();
    return schedule.logs.some((log) => new Date(log.takenAt).toDateString() === today);
  };

  return (
    <section
      aria-label="Prescripción y Pauta Médica al Cuidador"
      className="bg-white border-2 border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-5 border-b border-slate-100 gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 border-2 border-teal-200 text-teal-700 flex items-center justify-center flex-shrink-0">
            <Stethoscope className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-teal-100 text-teal-900 border border-teal-300">
                Sincronización en Tiempo Real
              </span>
              <span className="text-xs text-slate-500 font-semibold">• Médico a Cuidador</span>
            </div>
            <h2 className="text-2xl font-black text-slate-950 mt-1">
              Prescripción y Pautas Médicas para el Cuidador
            </h2>
            <p className="text-sm font-semibold text-slate-600 mt-0.5">
              Los medicamentos indicados aquí se transmiten al instante al panel de{" "}
              <strong className="text-slate-900">{caregiverName}</strong> y a la pauta diaria de{" "}
              <strong className="text-slate-900">{patientName}</strong>.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsFormOpen((prev) => !prev)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold transition-colors self-start md:self-auto"
        >
          {isFormOpen ? (
            <>
              <ChevronUp className="w-4 h-4" />
              <span>Ocultar Formulario</span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              <span>Prescribir Nuevo Medicamento</span>
            </>
          )}
        </button>
      </div>

      {/* Real-time status banner */}
      {feedbackMessage && (
        <div
          role="status"
          className={`p-4 rounded-2xl border flex items-center justify-between ${
            feedbackMessage.type === "success"
              ? "bg-teal-50 border-teal-300 text-teal-950"
              : "bg-rose-50 border-rose-300 text-rose-950"
          }`}
        >
          <div className="flex items-center gap-3">
            {feedbackMessage.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-teal-700 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-700 flex-shrink-0" />
            )}
            <span className="text-sm font-bold">{feedbackMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMessage(null)}
            className="text-xs font-bold underline px-2 py-1"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Prescription Form Section */}
      {isFormOpen && (
        <form
          onSubmit={handleSubmit}
          className="p-5 sm:p-6 bg-slate-50 border-2 border-slate-200 rounded-2xl space-y-5"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Pill className="w-5 h-5 text-teal-600" />
              <span>Nueva Indicación Farmacológica</span>
            </h3>
            <span className="text-xs font-bold text-slate-500">
              Prescriptor: <strong className="text-slate-800">{doctorName}</strong>
            </span>
          </div>

          {/* Quick Presets */}
          <div>
            <span className="block text-xs font-extrabold uppercase text-slate-500 tracking-wider mb-2">
              ⚡ Fármacos Habituales (Cargar con 1 Clic):
            </span>
            <div className="flex flex-wrap gap-2">
              {COMMON_MEDICATIONS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className="px-3 py-1.5 text-xs font-bold bg-white hover:bg-teal-50 hover:border-teal-400 border border-slate-300 rounded-xl text-slate-800 transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <span className="w-2 h-2 rounded-full bg-teal-500" />
                  <span>{preset.name}</span>
                  <span className="text-slate-400 text-[11px]">({preset.dosage.split(" ")[0]})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Medication Name */}
            <div className="lg:col-span-2">
              <label htmlFor="medName" className="block text-xs font-black uppercase text-slate-700 tracking-wider mb-1">
                Nombre del Medicamento *
              </label>
              <input
                id="medName"
                type="text"
                required
                value={medicationName}
                onChange={(e) => setMedicationName(e.target.value)}
                placeholder="Ej. Risperidona, Sertralina, Donepezilo..."
                className="w-full px-3.5 py-2.5 text-sm font-semibold rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
              />
            </div>

            {/* Dosage */}
            <div>
              <label htmlFor="dosage" className="block text-xs font-black uppercase text-slate-700 tracking-wider mb-1">
                Dosis y Presentación
              </label>
              <input
                id="dosage"
                type="text"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                placeholder="Ej. 1 comprimido (1mg), 10 gotas"
                className="w-full px-3.5 py-2.5 text-sm font-semibold rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
              />
            </div>

            {/* Time of Day */}
            <div>
              <label htmlFor="timeOfDay" className="block text-xs font-black uppercase text-slate-700 tracking-wider mb-1">
                Horario de Toma (HH:mm) *
              </label>
              <input
                id="timeOfDay"
                type="time"
                required
                value={timeOfDay}
                onChange={(e) => setTimeOfDay(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm font-semibold rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
              />
            </div>
          </div>

          {/* Time presets & Frequency */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <span className="block text-xs font-extrabold uppercase text-slate-500 tracking-wider mb-1.5">
                Horario Frecuente:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {TIME_PRESETS.map((tp) => (
                  <button
                    key={tp.time}
                    type="button"
                    onClick={() => {
                      setTimeOfDay(tp.time);
                      setFrequency(tp.frequency);
                    }}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-colors ${
                      timeOfDay === tp.time
                        ? "bg-teal-700 text-white border-teal-800"
                        : "bg-white text-slate-700 border-slate-200 hover:border-slate-400"
                    }`}
                  >
                    {tp.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="frequency" className="block text-xs font-black uppercase text-slate-700 tracking-wider mb-1">
                Pauta / Frecuencia
              </label>
              <input
                id="frequency"
                type="text"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                placeholder="Ej. Diario (Con el desayuno), Cada 12 horas, Rescate"
                className="w-full px-3.5 py-2 text-sm font-semibold rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
              />
            </div>
          </div>

          {/* Clinical Instructions for the Caregiver */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="instructions" className="block text-xs font-black uppercase text-slate-700 tracking-wider">
                Instrucciones Médicas Claras para el Cuidador ({caregiverName}) *
              </label>
              <span className="text-[11px] font-semibold text-slate-500">
                Se mostrarán destacadas en su panel
              </span>
            </div>
            <textarea
              id="instructions"
              rows={2}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Ej. Administrar siempre con un vaso lleno de agua tras ingerir alimentos. No triturar. Notificar en bitácora si nota marcha inestable o somnolencia diurna excesiva."
              className="w-full px-3.5 py-2.5 text-sm font-medium rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
            />

            {/* Quick templates for instructions */}
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {INSTRUCTION_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setInstructions(preset)}
                  className="px-2 py-0.5 text-[11px] font-medium bg-slate-200 hover:bg-slate-300 rounded-md text-slate-800 transition-colors"
                >
                  + {preset.slice(0, 38)}...
                </button>
              ))}
            </div>
          </div>

          {/* Submit button */}
          <div className="flex items-center justify-end pt-2 border-t border-slate-200">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-3 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-sm font-black transition-colors shadow-sm disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? "Enviando pauta..." : "Enviar Medicamento al Panel del Cuidador"}</span>
            </button>
          </div>
        </form>
      )}

      {/* Active Prescriptions List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <span>Pautas Activas Pautadas</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
              {schedules.length}
            </span>
          </h3>
          <span className="text-xs font-semibold text-slate-500">
            Estado de tomas sincronizado con el Ritual del Vaso
          </span>
        </div>

        {isLoading ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200">
            <div className="w-8 h-8 mx-auto border-2 border-teal-500 border-t-transparent animate-spin rounded-full mb-2" />
            <p className="text-xs font-bold text-slate-600">Cargando pautas del paciente...</p>
          </div>
        ) : schedules.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200">
            <Pill className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">No hay pautas de medicación activas registradas.</p>
            <p className="text-xs text-slate-500 mt-1">
              Use el formulario superior para prescribir un medicamento al paciente y enviarlo al cuidador.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {schedules.map((schedule) => {
              const taken = isTakenToday(schedule);

              return (
                <div
                  key={schedule.id}
                  className="p-5 bg-white rounded-2xl border-2 border-slate-200 hover:border-slate-300 transition-colors shadow-xs flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    {/* Header of card: Time + Status Badge */}
                    <div className="flex items-center justify-between">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-50 text-teal-900 border border-teal-200 text-xs font-black">
                        <Clock className="w-3.5 h-3.5 text-teal-700" />
                        <span>{schedule.timeOfDay}</span>
                        {schedule.frequency && (
                          <span className="text-teal-700 font-semibold">• {schedule.frequency}</span>
                        )}
                      </div>

                      {taken ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Tomada hoy</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                          <Clock className="w-3.5 h-3.5 text-amber-700" />
                          <span>Pendiente hoy</span>
                        </span>
                      )}
                    </div>

                    {/* Pill name & Dosage */}
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0 flex items-center justify-center">
                        {schedule.imageUrl ? (
                          <img
                            src={schedule.imageUrl}
                            alt={schedule.medicationName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Pill className="w-6 h-6 text-slate-500" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-base font-black text-slate-950">
                          {schedule.medicationName}
                        </h4>
                        {schedule.dosage && (
                          <span className="inline-block text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md mt-0.5">
                            {schedule.dosage}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Caregiver instructions block */}
                    {schedule.instructions && (
                      <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs space-y-1">
                        <span className="font-extrabold uppercase text-[10px] text-stone-600 block tracking-wider">
                          📋 Indicación directa para {caregiverName}:
                        </span>
                        <p className="text-slate-800 font-medium leading-relaxed">
                          {schedule.instructions}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Footer: Prescriber + Delete button */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-semibold">
                    <span>
                      Pautado por: <strong className="text-slate-700">{schedule.prescribedBy || doctorName}</strong>
                    </span>

                    <button
                      type="button"
                      onClick={() => handleDeleteSchedule(schedule.id, schedule.medicationName)}
                      className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-800 font-bold px-2 py-1 rounded-md hover:bg-rose-50 transition-colors"
                      title="Suspender esta pauta"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Suspender</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
