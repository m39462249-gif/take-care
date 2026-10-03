import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Shield,
  Activity,
  HeartHandshake,
} from "lucide-react";
import { PatientOverviewItem } from "../../types/clinical.js";
import { apiUrl, smartFetch } from "../../utils/api.js";

export const PatientOverview: React.FC = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<PatientOverviewItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await smartFetch(apiUrl("/api/professional/patients"));
        const data = await res.json();
        if (data.success && data.data) {
          setPatients(data.data);
        }
      } catch (err) {
        console.error("Error al cargar pacientes:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPatients();
  }, []);

  const filteredPatients = patients.filter((p) =>
    p.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="bg-white rounded-none p-8 border border-slate-300 text-center">
        <div className="w-10 h-10 mx-auto rounded-none border-2 border-slate-400 border-t-slate-800 animate-spin mb-4" />
        <p className="text-base font-bold text-slate-700">Cargando pacientes asignados...</p>
      </div>
    );
  }

  return (
    <section aria-label="Lista de Pacientes en Seguimiento" className="space-y-4">
      {/* Top Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre de paciente..."
            className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-none border border-slate-400 focus:border-slate-800 focus:outline-none"
          />
        </div>

        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Mostrando {filteredPatients.length} paciente(s) activos
        </div>
      </div>

      {/* Patient Table - Square & Muted */}
      <div className="bg-white border border-slate-300 rounded-none shadow-none overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 text-[11px] uppercase font-bold tracking-wider">
                <th className="py-3 px-5">Paciente</th>
                <th className="py-3 px-5">Cuidador Vinculado</th>
                <th className="py-3 px-5">Estado Actual</th>
                <th className="py-3 px-5">Adherencia Semanal</th>
                <th className="py-3 px-5">Último Registro</th>
                <th className="py-3 px-5 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800 font-medium text-sm">
              {filteredPatients.map((patient) => {
                const isStable = patient.status === "Estable";

                return (
                  <tr
                    key={patient.id}
                    onClick={() => navigate(`/clinica/patient/${patient.id}`)}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    {/* Patient Name */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-none bg-stone-200 border border-slate-300 text-slate-900 font-bold text-sm flex items-center justify-center">
                          {patient.fullName.charAt(0)}
                        </div>
                        <div>
                          <span className="block font-bold text-slate-900">
                            {patient.fullName}
                          </span>
                          <span className="text-xs text-slate-500">
                            {patient.age} años
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Caregiver */}
                    <td className="py-4 px-5 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <HeartHandshake className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                        <span>{patient.caregiver}</span>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 px-5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-none text-xs font-bold border uppercase tracking-wider ${
                          isStable
                            ? "bg-stone-100 text-stone-900 border-stone-300"
                            : "bg-slate-200 text-slate-900 border-slate-400"
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-none ${
                            isStable ? "bg-stone-700" : "bg-slate-700"
                          }`}
                        />
                        <span>{patient.status}</span>
                      </span>
                    </td>

                    {/* Adherence */}
                    <td className="py-4 px-5">
                      <div className="w-32 space-y-1">
                        <div className="flex justify-between text-xs font-bold">
                          <span>{patient.weeklyAdherence}%</span>
                          <span className="text-slate-400 text-[10px]">7 días</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-none overflow-hidden">
                          <div
                            className={`h-full rounded-none ${
                              patient.weeklyAdherence >= 90
                                ? "bg-slate-800"
                                : "bg-stone-600"
                            }`}
                            style={{ width: `${patient.weeklyAdherence}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Last Event */}
                    <td className="py-4 px-5 text-xs text-slate-500 font-normal">
                      {patient.lastEvent}
                    </td>

                    {/* Action Button */}
                    <td className="py-4 px-5 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/clinica/patient/${patient.id}`);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-none border border-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-700"
                        aria-label={`Ver detalle clínico de ${patient.fullName}`}
                      >
                        <span>Ver Detalle</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
