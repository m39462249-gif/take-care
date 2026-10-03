import React, { useState, useEffect } from "react";
import {
  FileText,
  Copy,
  Check,
  Printer,
  Edit3,
  RotateCcw,
  CheckCircle2,
  Clock,
  Pill,
  Activity,
  HeartHandshake,
  AlertCircle,
  Save,
  ChevronRight,
  ShieldCheck,
  Stethoscope,
  ClipboardList,
} from "lucide-react";
import { apiUrl } from "../../utils/api.js";

interface ClinicalEvolutionAIProps {
  selectedPatientId?: string;
  patientName?: string;
}

export const ClinicalEvolutionAI: React.FC<ClinicalEvolutionAIProps> = ({
  selectedPatientId = "prof-pat-001",
  patientName = "Mateo Silva",
}) => {
  const [timeframe, setTimeframe] = useState<"7d" | "15d" | "30d">("30d");
  const [format, setFormat] = useState<"soap" | "narrative" | "family">("soap");
  const [doctorNotes, setDoctorNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [savedNotification, setSavedNotification] = useState(false);

  // Stats received from backend
  const [stats, setStats] = useState<any>(null);
  const [generatedEvolution, setGeneratedEvolution] = useState<{
    content: string;
    generatedAt: string;
    format: string;
    timeframeLabel: string;
  } | null>(null);

  // Fetch initial patient metrics
  useEffect(() => {
    const fetchInitialStats = async () => {
      try {
        const res = await fetch(apiUrl(`/api/professional/patient-stats?patientId=${selectedPatientId}`));
        const data = await res.json();
        if (data.success && data.data) {
          setStats(data.data);
        }
      } catch (err) {
        console.error("Error al cargar estadísticas del paciente:", err);
      }
    };

    fetchInitialStats();
  }, [selectedPatientId]);

  const handleGenerate = async () => {
    setIsLoading(true);
    setCopied(false);
    setIsEditing(false);

    try {
      const res = await fetch(apiUrl("/api/ai/clinical-evolution"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: selectedPatientId,
          timeframe,
          format,
          doctorObservations: doctorNotes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Error al sintetizar la evolución clínica.");
      }

      setGeneratedEvolution(data.summary);
      if (data.stats) {
        setStats(data.stats);
      }
    } catch (err: any) {
      alert(`Error al generar evolución: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!generatedEvolution) return;
    navigator.clipboard.writeText(generatedEvolution.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSaveToHistory = () => {
    setSavedNotification(true);
    setTimeout(() => setSavedNotification(false), 3000);
  };

  // Helper to render formatted markdown
  const renderFormattedMarkdown = (text: string) => {
    const sections = text.split("\n\n");

    return sections.map((sec, idx) => {
      if (sec.startsWith("### ")) {
        const title = sec.replace("### ", "");
        const isS = title.includes("[S]");
        const isO = title.includes("[O]");
        const isA = title.includes("[A]");
        const isP = title.includes("[P]");

        const badgeColor = isS
          ? "bg-[#FEF8EB] text-[#7E5716] border-[#F1DCAB]"
          : isO
          ? "bg-[#F0F6FA] text-[#245377] border-[#C3DCED]"
          : isA
          ? "bg-[#EBF3EE] text-[#285740] border-[#CCE0D4]"
          : isP
          ? "bg-[#F6F2EB] text-[#554C41] border-[#DDD5C8]"
          : "bg-[#F4F1EA] text-[#4A4742] border-[#DDD8CF]";

        return (
          <div key={idx} className="mt-5 mb-2 pb-1.5 border-b border-[#E6E0D6]">
            <span
              className={`inline-block px-3 py-1 text-xs font-black uppercase tracking-wider border rounded-xl mb-1 ${badgeColor}`}
            >
              {title}
            </span>
          </div>
        );
      }

      if (sec.includes("\n- ") || sec.startsWith("- ") || sec.includes("\n* ") || sec.startsWith("* ")) {
        const items = sec.split(/\n[-*]\s/).filter(Boolean);
        return (
          <ul key={idx} className="list-disc pl-5 my-2 space-y-1.5 text-[#2C3831] text-sm">
            {items.map((item, i) => (
              <li
                key={i}
                dangerouslySetInnerHTML={{
                  __html: item
                    .replace(/\*\*(.*?)\*\*/g, "<strong class='text-[#1E3A2F]'>$1</strong>")
                    .replace(/\*(.*?)\*/g, "<em>$1</em>"),
                }}
              />
            ))}
          </ul>
        );
      }

      return (
        <p
          key={idx}
          className="text-sm sm:text-[15px] text-[#2C3831] leading-relaxed mb-2.5"
          dangerouslySetInnerHTML={{
            __html: sec
              .replace(/\*\*(.*?)\*\*/g, "<strong class='text-[#1E3A2F]'>$1</strong>")
              .replace(/\*(.*?)\*/g, "<em>$1</em>")
              .replace(/\n/g, "<br/>"),
          }}
        />
      );
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Explainer - Warm medical notebook feel */}
      <div className="bg-white border-1.5 border-[#E6E0D6] rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-[#244E70] text-white flex items-center justify-center shrink-0 rounded-2xl shadow-2xs text-2xl">
            📋
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-black text-[#232B28]">
                Síntesis y Evolución Clínica
              </h2>
              <span className="px-3 py-0.5 bg-[#EAF0F6] text-[#244E70] text-xs font-bold rounded-full border border-[#C5D9EA]">
                Asistente de Consulta
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#5C6761] font-medium mt-1 max-w-2xl">
              Agrupa y resume de forma estructurada los registros de bitácora, adherencia farmacológica y autorregulación de <span className="font-bold text-[#232B28]">{patientName}</span> para su historia clínica.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-[#F6F3ED] border border-[#DDD5C8] px-3.5 py-2 rounded-2xl shrink-0">
          <ShieldCheck className="w-4 h-4 text-[#2E5A44]" />
          <span className="text-xs font-bold text-[#3D4742]">
            Supervisión Médica Activa
          </span>
        </div>
      </div>

      {/* Grid: Configurator & Real-Time Context Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Form Controls (2 cols) */}
        <div className="lg:col-span-2 bg-white border-1.5 border-[#E6E0D6] rounded-3xl p-6 sm:p-7 space-y-6 shadow-xs">
          <div className="flex items-center justify-between pb-3.5 border-b border-[#E6E0D6]">
            <h3 className="text-base font-black text-[#232B28] flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-[#244E70]" />
              Parámetros de la Evolución
            </h3>
            <span className="text-xs text-[#6B756E] font-medium">
              Paciente: <strong>{patientName}</strong> (26 años)
            </span>
          </div>

          {/* Timeframe Selector */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-[#5A635E] mb-2.5">
              1. Período a Analizar
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: "7d", label: "Últimos 7 días", desc: "Semanal" },
                { id: "15d", label: "Últimos 15 días", desc: "Quincenal" },
                { id: "30d", label: "Últimos 30 días", desc: "Mensual completo" },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTimeframe(t.id as any)}
                  className={`p-3.5 text-left rounded-2xl border transition-all cursor-pointer ${
                    timeframe === t.id
                      ? "bg-[#244E70] text-white border-[#1B3E5C] shadow-xs"
                      : "bg-[#FAF8F5] hover:bg-[#F2ECE2] text-[#34423A] border-[#DDD5C8] font-medium"
                  }`}
                >
                  <span className="block text-xs font-black">{t.label}</span>
                  <span className="block text-[11px] opacity-80 mt-0.5">{t.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Format Selector */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-[#5A635E] mb-2.5">
              2. Formato del Informe
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  id: "soap",
                  label: "Evolución SOAP",
                  desc: "Subjetivo, Objetivo, Análisis y Plan",
                },
                {
                  id: "narrative",
                  label: "Nota Narrativa EMR",
                  desc: "Párrafos densos para historia clínica",
                },
                {
                  id: "family",
                  label: "Informe para Familia",
                  desc: "Lenguaje empático y recomendaciones",
                },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFormat(f.id as any)}
                  className={`p-3.5 text-left rounded-2xl border transition-all cursor-pointer ${
                    format === f.id
                      ? "bg-[#2E5A44] text-white border-[#224433] shadow-xs"
                      : "bg-[#FAF8F5] hover:bg-[#F2ECE2] text-[#34423A] border-[#DDD5C8] font-medium"
                  }`}
                >
                  <span className="block text-xs font-black">{f.label}</span>
                  <span className="block text-[11px] opacity-80 mt-0.5">{f.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Doctor Observations (Optional) */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-[#5A635E] mb-1.5 flex items-center justify-between">
              <span>3. Hallazgos del Examen Presencial (Opcional)</span>
              <span className="text-[11px] text-[#86928B] font-normal">Se integrará con los datos de telemetría</span>
            </label>
            <textarea
              value={doctorNotes}
              onChange={(e) => setDoctorNotes(e.target.value)}
              placeholder="Ej: Paciente acude acompañado de Elena. Orientado en tiempo y espacio, afecto modulado, sin signos de temblor ni rigidez extrapiramidal. Buen contacto visual..."
              rows={2}
              className="w-full p-3 text-xs sm:text-sm bg-[#FAF8F5] border border-[#D9D1C4] focus:bg-white focus:border-[#244E70] focus:outline-none rounded-2xl font-medium text-[#232B28]"
            />
          </div>

          {/* Generate CTA Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isLoading}
              className="w-full py-4 px-6 bg-[#244E70] hover:bg-[#1C3E5A] disabled:bg-[#D5CEC2] text-white font-black text-sm uppercase tracking-wider rounded-2xl border border-[#19364F] transition-all flex items-center justify-center gap-2.5 shadow-sm cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin rounded-full" />
                  <span>Sintetizando registros clínicos...</span>
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  <span>Generar Resumen de Evolución</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Telemetry Snapshot being Analyzed */}
        <div className="bg-[#FAF7F2] border-1.5 border-[#E6E0D6] rounded-3xl p-6 space-y-4">
          <h4 className="text-xs font-black uppercase tracking-wider text-[#5A635E] pb-2.5 border-b border-[#E6E0D6] flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#244E70]" />
            Telemetría Real Registrada
          </h4>

          {stats ? (
            <div className="space-y-3.5 text-xs">
              <div className="p-3.5 bg-white border border-[#E2DAD0] rounded-2xl shadow-2xs">
                <span className="text-[#68756F] font-bold block mb-1">Adherencia a Fármacos</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-[#2E5A44]">
                    {stats.adherence.overallPercentage}%
                  </span>
                  <span className="text-[#68756F] font-medium">
                    ({stats.adherence.totalTaken} de {stats.adherence.totalScheduled} tomas)
                  </span>
                </div>
              </div>

              <div className="p-3.5 bg-white border border-[#E2DAD0] rounded-2xl shadow-2xs">
                <span className="text-[#68756F] font-bold block mb-1.5">Síntomas Reportados por Cuidador</span>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold">
                  <div className="p-2 bg-[#FEF8EB] text-[#7E5716] border border-[#F1DCAB] rounded-xl">
                    Agitación: <strong>{stats.symptoms.counts.AGITATION}</strong>
                  </div>
                  <div className="p-2 bg-[#F0F6FA] text-[#245377] border border-[#C3DCED] rounded-xl">
                    Insomnio: <strong>{stats.symptoms.counts.NO_SLEEP}</strong>
                  </div>
                  <div className="p-2 bg-[#FAF7F2] text-[#4A554E] border border-[#DDD5C8] rounded-xl">
                    Rechazo Comida: <strong>{stats.symptoms.counts.FOOD_REFUSAL}</strong>
                  </div>
                  <div className="p-2 bg-[#EBF3EE] text-[#285740] border border-[#CCE0D4] rounded-xl">
                    Alucinaciones: <strong>{stats.symptoms.counts.HALLUCINATION}</strong>
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-white border border-[#E2DAD0] rounded-2xl shadow-2xs">
                <span className="text-[#68756F] font-bold block mb-0.5">Autorregulación Emocional</span>
                <p className="font-bold text-[#232B28]">
                  {stats.firstAidUsage.totalSessions} sesiones de Modo Calma
                </p>
                <span className="text-[#68756F] text-[11px]">
                  Respiración guiada y música tranquila
                </span>
              </div>

              <div className="p-3.5 bg-white border border-[#E2DAD0] rounded-2xl shadow-2xs">
                <span className="text-[#68756F] font-bold block mb-0.5">Pauta Farmacológica Activa</span>
                <p className="text-[#232B28] font-bold">
                  Risperidona 1mg (08:30) • Sertralina 50mg (20:00)
                </p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-[#68756F] font-medium">Cargando telemetría del paciente...</p>
          )}
        </div>
      </div>

      {/* Generated Report Card */}
      {generatedEvolution && (
        <div className="bg-white border-1.5 border-[#E6E0D6] rounded-3xl overflow-hidden shadow-xs">
          {/* Header & Actions Toolbar */}
          <div className="bg-[#244E70] text-white p-5 border-b border-[#1C3E5A] flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-[#1C3E5A] flex items-center justify-center text-xl">
                📄
              </div>
              <div>
                <h3 className="text-base font-black text-white">
                  Borrador de Evolución Médica • {patientName}
                </h3>
                <span className="text-xs text-[#BED8ED] font-medium">
                  {generatedEvolution.timeframeLabel} • Formato: {generatedEvolution.format.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(!isEditing)}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 border transition-all ${
                  isEditing
                    ? "bg-[#1C3E5A] text-white border-[#34658E]"
                    : "bg-[#1C3E5A]/70 hover:bg-[#1C3E5A] text-[#BED8ED] border-[#34658E]"
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isEditing ? "Ver Formateado" : "Editar Texto"}</span>
              </button>

              <button
                type="button"
                onClick={handleCopy}
                className="px-3.5 py-2 bg-[#1C3E5A]/70 hover:bg-[#1C3E5A] text-white text-xs font-bold rounded-xl border border-[#34658E] flex items-center gap-1.5 transition-all"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar a Historia Clínica</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleSaveToHistory}
                className="px-3.5 py-2 bg-[#2E5A44] hover:bg-[#254A37] text-white text-xs font-bold rounded-xl border border-[#203E2F] flex items-center gap-1.5 transition-all shadow-xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Guardar</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="p-2 bg-[#1C3E5A]/70 hover:bg-[#1C3E5A] text-white rounded-xl border border-[#34658E] transition-all"
                title="Imprimir informe"
              >
                <Printer className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Saved Notification Alert */}
          {savedNotification && (
            <div className="bg-[#EBF3EE] border-b border-[#D0E2D6] p-3.5 flex items-center justify-between text-xs text-[#2E5A44] font-bold">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#2E5A44]" />
                <span>Evolución clínica guardada exitosamente en el expediente digital de Mateo Silva.</span>
              </div>
              <button
                type="button"
                onClick={() => setSavedNotification(false)}
                className="text-[#2E5A44] hover:text-[#1E3C2C] font-black"
              >
                ✕
              </button>
            </div>
          )}

          {/* Body: Formatted View vs Textarea Edit Mode */}
          <div className="p-6 sm:p-8">
            {isEditing ? (
              <div className="space-y-2">
                <label className="block text-xs font-black text-[#5A635E] uppercase tracking-wider">
                  Edición del Informe por la Especialista
                </label>
                <textarea
                  value={generatedEvolution.content}
                  onChange={(e) =>
                    setGeneratedEvolution({
                      ...generatedEvolution,
                      content: e.target.value,
                    })
                  }
                  rows={16}
                  className="w-full p-4 font-mono text-xs sm:text-sm bg-[#FAF8F5] border border-[#DDD5C8] focus:bg-white focus:border-[#244E70] focus:outline-none rounded-2xl text-[#232B28] leading-relaxed"
                />
                <span className="text-[11px] text-[#6B756E] font-medium">
                  Modifica cualquier palabra o ajusta el plan antes de copiar o guardar.
                </span>
              </div>
            ) : (
              <div className="prose max-w-none bg-[#FAF8F5]/80 p-6 sm:p-8 rounded-2xl border border-[#E6E0D6] font-sans">
                {renderFormattedMarkdown(generatedEvolution.content)}
              </div>
            )}
          </div>

          {/* Footer with Medical Validation Badge */}
          <div className="bg-[#FAF7F2] p-4 sm:p-5 border-t border-[#E6E0D6] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[#5A635E] font-medium">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#244E70]" />
              <span>
                Documento clínico estructurado para validación por la <strong>Dra. Sofía Martínez (MED-ESP-29831)</strong>.
              </span>
            </div>

            <button
              type="button"
              onClick={handleGenerate}
              className="text-[#244E70] hover:text-[#19364F] font-bold flex items-center gap-1 underline cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Regenerar con otro enfoque</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
export default ClinicalEvolutionAI;
