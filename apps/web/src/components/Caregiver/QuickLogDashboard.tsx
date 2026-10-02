import React, { useState, useRef } from "react";
import {
  Moon,
  Zap,
  UtensilsCrossed,
  EyeOff,
  Mic,
  Square,
  Play,
  RotateCcw,
  Send,
  X,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { SymptomTag } from "../../types/caregiver.js";

interface QuickLogDashboardProps {
  patientId: string;
  caregiverId: string;
  onQuickLogSubmitted: (symptomTag: SymptomTag, guide?: any) => void;
}

interface SymptomButtonConfig {
  tag: SymptomTag;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  bgClass: string;
  borderClass: string;
  hoverClass: string;
  textClass: string;
}

const SYMPTOM_BUTTONS: SymptomButtonConfig[] = [
  {
    tag: "NO_SLEEP",
    label: "No durmió",
    description: "Insomnio, vigilia nocturna o interrupciones constantes",
    icon: Moon,
    bgClass: "bg-slate-50",
    borderClass: "border-slate-300",
    hoverClass: "hover:bg-slate-100 hover:border-slate-500",
    textClass: "text-slate-900",
  },
  {
    tag: "AGITATION",
    label: "Agitado",
    description: "Inquietud motriz, irritabilidad o angustia verbal",
    icon: Zap,
    bgClass: "bg-stone-50",
    borderClass: "border-stone-300",
    hoverClass: "hover:bg-stone-100 hover:border-stone-500",
    textClass: "text-stone-900",
  },
  {
    tag: "FOOD_REFUSAL",
    label: "No comió",
    description: "Rechazo del plato, falta de apetito o dificultad para tragar",
    icon: UtensilsCrossed,
    bgClass: "bg-zinc-50",
    borderClass: "border-zinc-300",
    hoverClass: "hover:bg-zinc-100 hover:border-zinc-500",
    textClass: "text-zinc-900",
  },
  {
    tag: "HALLUCINATION",
    label: "Alucinaciones",
    description: "Percepciones visuales o auditivas no compartidas",
    icon: EyeOff,
    bgClass: "bg-neutral-50",
    borderClass: "border-neutral-300",
    hoverClass: "hover:bg-neutral-100 hover:border-neutral-500",
    textClass: "text-neutral-900",
  },
];

export const QuickLogDashboard: React.FC<QuickLogDashboardProps> = ({
  patientId,
  caregiverId,
  onQuickLogSubmitted,
}) => {
  const [selectedTag, setSelectedTag] = useState<SymptomTag | null>(null);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Audio recording state (MediaRecorder API)
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  const activeConfig = SYMPTOM_BUTTONS.find((b) => b.tag === selectedTag);

  const handleOpenModal = (tag: SymptomTag) => {
    setSelectedTag(tag);
    setNotes("");
    setAudioBlob(null);
    setAudioUrl(null);
    setIsRecording(false);
    setRecordingSeconds(0);
  };

  const handleCloseModal = () => {
    if (isRecording) {
      handleStopRecording();
    }
    setSelectedTag(null);
    setNotes("");
    setAudioBlob(null);
    setAudioUrl(null);
  };

  // Start Voice Recording via MediaRecorder API
  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(audioBlob);
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);

        // Stop all audio tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.warn("Permiso de micrófono no disponible:", err);
      alert("No se pudo acceder al micrófono. Puedes escribir una nota de texto.");
    }
  };

  // Stop Recording
  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  // Reset audio
  const handleResetAudio = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingSeconds(0);
  };

  // Submit QuickLog
  const handleSubmit = async () => {
    if (!selectedTag) return;
    setIsSubmitting(true);

    try {
      let finalAudioUrl: string | null = null;

      // Convert audio blob to base64 data URL if recorded
      if (audioBlob) {
        finalAudioUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(audioBlob);
        });
      }

      const res = await fetch("/api/caregiver/quick-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId,
          caregiverId,
          symptomTag: selectedTag,
          notes: notes.trim() || undefined,
          audioUrl: finalAudioUrl,
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        onQuickLogSubmitted(selectedTag, data.data.interventionGuide);
        handleCloseModal();
      }
    } catch (err) {
      console.error("Error al registrar bitácora:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section aria-label="Bitácora Rápida del Cuidador" className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-950">
            Bitácora Rápida
          </h2>
          <p className="text-base sm:text-lg text-slate-600 font-semibold mt-0.5">
            Toca una tarjeta para registrar de inmediato lo ocurrido sin teclear.
          </p>
        </div>
      </div>

      {/* 4 Giant Symptom Cards (min-h-[150px]) - Square & Muted */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {SYMPTOM_BUTTONS.map((btn) => {
          const Icon = btn.icon;
          return (
            <button
              key={btn.tag}
              type="button"
              onClick={() => handleOpenModal(btn.tag)}
              className={`min-h-[150px] p-5 rounded-none border-2 ${btn.borderClass} ${btn.bgClass} ${btn.hoverClass} shadow-none transition-colors text-left flex flex-col justify-between focus:outline-none focus:ring-2 focus:ring-slate-700`}
              aria-label={`Registrar síntoma: ${btn.label}. ${btn.description}`}
            >
              <div className="flex items-center justify-between w-full">
                <div className="w-11 h-11 rounded-none bg-white border border-slate-300 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-slate-800" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-none bg-white border border-slate-300 text-slate-700">
                  1 Toque
                </span>
              </div>

              <div className="mt-3">
                <span className={`block text-xl font-black ${btn.textClass} leading-tight`}>
                  {btn.label}
                </span>
                <span className="block text-xs font-medium text-slate-600 mt-1 line-clamp-2">
                  {btn.description}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Quick Log Modal with Audio & Text Options - Square & Muted */}
      {selectedTag && activeConfig && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Registrar detalle para ${activeConfig.label}`}
          className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-none max-w-xl w-full p-6 shadow-none border-2 border-slate-800 space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-none ${activeConfig.bgClass} border border-slate-300 flex items-center justify-center`}>
                  <activeConfig.icon className="w-5 h-5 text-slate-900" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">
                    {activeConfig.label}
                  </h3>
                  <span className="text-xs font-semibold text-slate-500">
                    Registro de evento conductual
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseModal}
                className="w-8 h-8 rounded-none bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-700"
                aria-label="Cerrar ventana"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Voice Recorder Section (MediaRecorder API) */}
            <div className="p-4 bg-stone-50 rounded-none border border-slate-300 space-y-3">
              <span className="block text-sm font-bold text-slate-900">
                Nota de voz rápida (Opcional):
              </span>

              {!audioUrl ? (
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  {!isRecording ? (
                    <button
                      type="button"
                      onClick={handleStartRecording}
                      className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-sm rounded-none border border-slate-950 flex items-center justify-center gap-2 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-700 min-h-[46px]"
                    >
                      <Mic className="w-4 h-4" />
                      <span>Grabar Nota de Voz</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-3 w-full">
                      <div className="flex items-center gap-2.5 flex-1 bg-stone-200 px-3 py-2 rounded-none border border-stone-300">
                        <span className="w-3 h-3 rounded-none bg-stone-800" />
                        <span className="text-sm font-black text-stone-900">
                          Grabando: 00:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleStopRecording}
                        className="px-4 py-2 bg-stone-900 hover:bg-black text-white font-bold text-sm rounded-none flex items-center gap-1.5"
                      >
                        <Square className="w-4 h-4 fill-white" />
                        <span>Detener</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="p-2.5 bg-white border border-slate-300 rounded-none flex items-center gap-2">
                    <audio controls src={audioUrl} className="w-full h-8" />
                  </div>
                  <button
                    type="button"
                    onClick={handleResetAudio}
                    className="text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Borrar y volver a grabar</span>
                  </button>
                </div>
              )}
            </div>

            {/* Text Note Input */}
            <div>
              <label
                htmlFor="quickLogNotes"
                className="block text-sm font-bold text-slate-800 mb-1"
              >
                O escribe un texto breve (Opcional):
              </label>
              <textarea
                id="quickLogNotes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej. Se despertó inquieto después de cenar, busca a su hermana..."
                className="w-full p-3 text-sm rounded-none border border-slate-400 focus:border-slate-800 focus:outline-none text-slate-900 placeholder-slate-400"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={handleCloseModal}
                className="flex-1 py-2.5 px-4 rounded-none border border-slate-400 font-bold text-sm text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 py-2.5 px-4 rounded-none bg-slate-800 hover:bg-slate-900 active:bg-slate-950 text-white font-bold text-sm border border-slate-950 flex items-center justify-center gap-2 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-700 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Guardando...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Guardar y Ver Guía</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
