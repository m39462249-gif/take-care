import React, { useState, useEffect } from "react";
import {
  Bell,
  CheckCircle2,
  Clock,
  Pill,
  Footprints,
  Droplets,
  AlertTriangle,
  Lightbulb,
} from "lucide-react";
import { PreventiveReminder } from "../../types/caregiver.js";
import { apiUrl, smartFetch } from "../../utils/api.js";

interface PreventiveRemindersProps {
  patientId: string;
}

export const PreventiveReminders: React.FC<PreventiveRemindersProps> = ({
  patientId,
}) => {
  const [reminders, setReminders] = useState<PreventiveReminder[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReminders = async () => {
      try {
        const res = await smartFetch(apiUrl(`/api/caregiver/reminders?patientId=${patientId}`));
        const data = await res.json();
        if (data.success && data.data) {
          setReminders(data.data);
        }
      } catch (err) {
        console.error("Error cargando recordatorios preventivos:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReminders();
  }, [patientId]);

  const handleDismiss = (id: string) => {
    setDismissedIds((prev) => new Set(prev).add(id));
  };

  const activeReminders = reminders.filter((r) => !dismissedIds.has(r.id));

  const getReminderIcon = (type: string) => {
    switch (type) {
      case "MEDICATION":
        return Pill;
      case "ROUTINE":
        return Footprints;
      case "HYDRATION":
        return Droplets;
      case "SYMPTOM":
        return AlertTriangle;
      default:
        return Lightbulb;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return {
          label: "Atención Alta",
          className: "bg-stone-200 text-stone-900 border-stone-400",
        };
      case "MEDIUM":
        return {
          label: "Sugerencia",
          className: "bg-slate-200 text-slate-900 border-slate-400",
        };
      default:
        return {
          label: "Bienestar",
          className: "bg-zinc-100 text-zinc-800 border-zinc-300",
        };
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 bg-white rounded-none border border-slate-300 text-center">
        <p className="text-base font-bold text-slate-600">
          Analizando pautas y recordatorios preventivos...
        </p>
      </div>
    );
  }

  if (activeReminders.length === 0) {
    return (
      <div className="p-5 bg-stone-100 rounded-none border border-slate-300 text-slate-900 flex items-center gap-3">
        <CheckCircle2 className="w-5 h-5 text-slate-700 flex-shrink-0" />
        <span className="text-sm font-bold">
          Todos los recordatorios preventivos están al día.
        </span>
      </div>
    );
  }

  return (
    <section aria-label="Recordatorios Preventivos" className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <Lightbulb className="w-5 h-5 text-slate-700" aria-hidden="true" />
        <h3 className="text-xl font-black text-slate-900">
          Recordatorios Preventivos
        </h3>
      </div>

      <div className="space-y-3">
        {activeReminders.map((rem) => {
          const Icon = getReminderIcon(rem.type);
          const badge = getPriorityBadge(rem.priority);

          return (
            <div
              key={rem.id}
              className="p-4 sm:p-5 bg-white rounded-none border border-slate-300 hover:border-slate-500 shadow-none flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-none bg-stone-100 border border-slate-300 flex items-center justify-center flex-shrink-0 mt-0.5 text-slate-800">
                  <Icon className="w-5 h-5" aria-hidden="true" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-none border ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                    <h4 className="text-base sm:text-lg font-bold text-slate-900">
                      {rem.title}
                    </h4>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-2xl leading-relaxed">
                    {rem.description}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleDismiss(rem.id)}
                className="self-end sm:self-center px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-none border border-slate-400 transition-colors flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-slate-700 whitespace-nowrap"
                aria-label={`Marcar como completado: ${rem.title}`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-slate-700" />
                <span>Listo</span>
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
};
