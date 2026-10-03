import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Phone,
  HeartHandshake,
  Activity,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Wind,
  Music,
  Users,
  Pill,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  LineChart,
  Line,
} from "recharts";
import { PatientStats } from "../../types/clinical.js";
import { MedicalReportGenerator } from "./MedicalReportGenerator.js";
import { PrescriptionManager } from "./PrescriptionManager.js";
import { Navbar } from "../Navbar.js";
import { apiUrl } from "../../utils/api.js";

export const PatientDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [stats, setStats] = useState<PatientStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(apiUrl(`/api/professional/patients/${id || "prof-pat-001"}/stats`));
        const data = await res.json();
        if (data.success && data.data) {
          setStats(data.data);
        }
      } catch (err) {
        console.error("Error al obtener estadísticas del paciente:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [id]);

  if (isLoading || !stats) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 py-16 text-center">
          <div className="w-12 h-12 mx-auto rounded-full border-4 border-purple-300 border-t-purple-700 animate-spin mb-4" />
          <p className="text-xl font-bold text-slate-700">Cargando expediente clínico...</p>
        </div>
      </div>
    );
  }

  // Format symptoms data for Recharts
  const symptomsChartData = [
    { name: "No durmió", episodios: stats.symptoms.counts.NO_SLEEP, fill: "#6366f1" },
    { name: "Agitado", episodios: stats.symptoms.counts.AGITATION, fill: "#f59e0b" },
    { name: "No comió", episodios: stats.symptoms.counts.FOOD_REFUSAL, fill: "#f43f5e" },
    { name: "Alucinaciones", episodios: stats.symptoms.counts.HALLUCINATION, fill: "#a855f7" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-8">
        {/* Navigation Breadcrumb / Back button */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate("/clinica")}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-base transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Volver a la lista de pacientes</span>
          </button>

          {/* Export PDF Button */}
          <MedicalReportGenerator stats={stats} />
        </div>

        {/* Patient Profile Header Card */}
        <header className="bg-white border-2 border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-3xl bg-purple-100 text-purple-800 font-black text-3xl flex items-center justify-center shadow-inner">
              {stats.patient.fullName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl sm:text-4xl font-black text-slate-950">
                  {stats.patient.fullName}
                </h1>
                <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
                  Seguimiento Activo
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm sm:text-base font-semibold text-slate-600">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-purple-600" />
                  <span>26 años ({stats.patient.dateOfBirth})</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <HeartHandshake className="w-4 h-4 text-sky-600" />
                  <span>Cuidador: {stats.patient.caregiverName} ({stats.patient.caregiverRelation})</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-slate-500" />
                  <span>{stats.patient.emergencyContactPhone}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-purple-50 border-2 border-purple-200 px-6 py-4 rounded-2xl">
            <div>
              <span className="block text-xs font-extrabold uppercase text-purple-800 tracking-wider">
                Adherencia Mensual
              </span>
              <span className="text-3xl font-black text-purple-950">
                {stats.adherence.overallPercentage}%
              </span>
            </div>
            <Activity className="w-10 h-10 text-purple-600" />
          </div>
        </header>

        {/* Prescription and Medical Regimen Manager for Caregiver */}
        <PrescriptionManager
          patientId={stats.patient.id || id || "prof-pat-001"}
          patientName={stats.patient.fullName}
          caregiverName={stats.patient.caregiverName || "Elena Silva"}
        />

        {/* Clinical Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Chart 1: Medication Adherence (Last 4 Weeks) */}
          <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h2 className="text-2xl font-black text-slate-950">
                  Adherencia a Medicación
                </h2>
                <p className="text-sm font-semibold text-slate-500">
                  % de pastillas confirmadas con el ritual del vaso por semana
                </p>
              </div>
              <Pill className="w-6 h-6 text-emerald-600" />
            </div>

            <div className="h-72 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.adherence.weeklyBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="week" stroke="#64748b" fontSize={12} tickLine={false} />
                  <YAxis domain={[0, 100]} unit="%" stroke="#64748b" fontSize={12} tickLine={false} />
                  <Tooltip
                    formatter={(val: any) => [`${val}%`, "Adherencia"]}
                    contentStyle={{ borderRadius: "12px", border: "2px solid #e2e8f0" }}
                  />
                  <Bar dataKey="percentage" name="% Cumplimiento" fill="#0d9488" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs sm:text-sm font-bold text-teal-950">
              ✓ Total de tomas registradas en el mes: {stats.adherence.totalTaken} de {stats.adherence.totalScheduled} pautadas.
            </div>
          </div>

          {/* Chart 2: Symptoms Reported (Last Month) */}
          <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h2 className="text-2xl font-black text-slate-950">
                  Frecuencia de Síntomas
                </h2>
                <p className="text-sm font-semibold text-slate-500">
                  Eventos reportados en la Bitácora Rápida del Cuidador
                </p>
              </div>
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>

            <div className="h-72 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={symptomsChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" stroke="#64748b" fontSize={12} />
                  <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={12} width={100} />
                  <Tooltip
                    formatter={(val: any) => [`${val} episodios`, "Frecuencia"]}
                    contentStyle={{ borderRadius: "12px", border: "2px solid #e2e8f0" }}
                  />
                  <Bar dataKey="episodios" name="Episodios" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs sm:text-sm font-bold text-amber-950">
              ℹ️ Total de eventos reportados: {stats.symptoms.totalReports}. Principal motivo de alerta: {stats.symptoms.mostFrequent}.
            </div>
          </div>
        </div>

        {/* Regulation Tools (Modo Calma Usage) Summary */}
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
          <h2 className="text-2xl font-black text-slate-950 mb-2">
            Uso de Herramientas de Regulación (Modo Calma)
          </h2>
          <p className="text-base text-slate-600 font-semibold mb-6">
            Sesiones autónomas completadas por el paciente para autorregulación emocional.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="p-5 bg-teal-50 border-2 border-teal-200 rounded-2xl flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center">
                <Wind className="w-7 h-7" />
              </div>
              <div>
                <span className="text-xs font-black uppercase text-teal-800">Respiración Guiada</span>
                <p className="text-2xl font-black text-teal-950">{stats.firstAidUsage.techniqueCounts.BREATHING} sesiones</p>
              </div>
            </div>

            <div className="p-5 bg-sky-50 border-2 border-sky-200 rounded-2xl flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-sky-600 text-white flex items-center justify-center">
                <Music className="w-7 h-7" />
              </div>
              <div>
                <span className="text-xs font-black uppercase text-sky-800">Mi Música</span>
                <p className="text-2xl font-black text-sky-950">{stats.firstAidUsage.techniqueCounts.MUSIC} sesiones</p>
              </div>
            </div>

            <div className="p-5 bg-purple-50 border-2 border-purple-200 rounded-2xl flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center">
                <Users className="w-7 h-7" />
              </div>
              <div>
                <span className="text-xs font-black uppercase text-purple-800">Galería Familiar</span>
                <p className="text-2xl font-black text-purple-950">{stats.firstAidUsage.techniqueCounts.PHOTOS} sesiones</p>
              </div>
            </div>
          </div>
        </div>

        {/* Chronological Event Timeline */}
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-2xl font-black text-slate-950">
                Timeline Cronológico de Eventos
              </h2>
              <p className="text-base text-slate-600 font-semibold">
                Registro histórico de intervenciones, bitácoras y sesiones de calma
              </p>
            </div>
            <Clock className="w-6 h-6 text-slate-400" />
          </div>

          <div className="space-y-4">
            {stats.timeline.map((item) => (
              <div
                key={item.id}
                className="p-5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-xs font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                        item.badgeColor === "amber"
                          ? "bg-amber-100 text-amber-900 border border-amber-300"
                          : item.badgeColor === "teal"
                          ? "bg-teal-100 text-teal-900 border border-teal-300"
                          : "bg-sky-100 text-sky-900 border border-sky-300"
                      }`}
                    >
                      {item.type}
                    </span>
                    <h3 className="text-lg font-black text-slate-950">
                      {item.title}
                    </h3>
                  </div>
                  <p className="text-sm font-semibold text-slate-700">
                    {item.detail}
                  </p>
                </div>

                <span className="text-xs font-extrabold text-slate-500 whitespace-nowrap">
                  {item.timestamp}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default PatientDetail;
