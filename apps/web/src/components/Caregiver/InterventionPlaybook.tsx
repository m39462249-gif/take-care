import React, { useState, useRef } from "react";
import {
  AlertTriangle,
  Volume2,
  Play,
  Pause,
  CheckCircle,
  ShieldAlert,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { InterventionGuide, SymptomTag } from "../../types/caregiver.js";

interface InterventionPlaybookProps {
  guide?: InterventionGuide | null;
  triggerReason?: string;
  onDismiss?: () => void;
}

export const InterventionPlaybook: React.FC<InterventionPlaybookProps> = ({
  guide,
  triggerReason = "Alerta activada: El paciente necesita regulación o se reportó agitación.",
  onDismiss,
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioSeconds, setAudioSeconds] = useState(30);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<any>(null);

  // Default steps if guide is not provided
  const step1 =
    guide?.step1 || "1. No hagas preguntas abiertas ni discutas. Mantén el espacio despejado.";
  const step2 =
    guide?.step2 || "2. Baja tu tono y ritmo de voz. Usa frases cortas de máximo 4 palabras.";
  const step3 =
    guide?.step3 || "3. Ofrece un vaso de agua fresca con sorbete. Reduce luces y apaga pantallas.";

  const audioSrc =
    guide?.audioGuideUrl ||
    "https://cdn.freesound.org/previews/243/243701_3509815-lq.mp3";

  const handleToggleAudio = () => {
    if (!audioRef.current) return;

    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
      if (timerRef.current) clearInterval(timerRef.current);
    } else {
      audioRef.current.play().then(() => {
        setIsPlayingAudio(true);
        setAudioSeconds(30);
        timerRef.current = setInterval(() => {
          setAudioSeconds((prev) => {
            if (prev <= 1) {
              clearInterval(timerRef.current);
              setIsPlayingAudio(false);
              return 30;
            }
            return prev - 1;
          });
        }, 1000);
      }).catch(() => {});
    }
  };

  return (
    <div
      role="region"
      aria-label="Playbook de Intervención Rápida"
      className="mb-8 bg-stone-100 border-2 border-stone-600 rounded-none p-6 shadow-none"
    >
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-300">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-none bg-stone-800 text-stone-200 flex items-center justify-center border border-stone-900 flex-shrink-0">
            <ShieldAlert className="w-6 h-6" aria-hidden="true" />
          </div>
          <div>
            <span className="inline-block px-2 py-0.5 bg-stone-300 text-stone-900 font-bold text-xs uppercase tracking-wider rounded-none mb-0.5">
              Intervención Inmediata
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-stone-900 leading-tight">
              QUÉ HACER AHORA
            </h3>
          </div>
        </div>

        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="self-start sm:self-center px-3.5 py-2 bg-white hover:bg-stone-200 text-stone-900 font-bold text-xs rounded-none border border-stone-400 transition-colors focus:outline-none focus:ring-2 focus:ring-stone-700"
          >
            Marcar como Estabilizado
          </button>
        )}
      </div>

      {/* Reason Pill - Square & Muted */}
      <div className="mt-3 p-2.5 bg-white border border-stone-300 rounded-none text-stone-900 text-sm font-semibold flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-stone-700 flex-shrink-0" aria-hidden="true" />
        <span>{triggerReason}</span>
      </div>

      {/* 3 Action Steps with Square Badges */}
      <div className="mt-5 space-y-3">
        {/* Step 1 */}
        <div className="p-4 bg-white rounded-none border border-stone-300 shadow-none flex items-start gap-3">
          <div className="w-7 h-7 rounded-none bg-stone-200 text-stone-900 font-black text-base flex items-center justify-center flex-shrink-0 mt-0.5 border border-stone-400">
            1
          </div>
          <div>
            <h4 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
              No hagas preguntas abiertas ni discutas
            </h4>
            <p className="text-sm sm:text-base text-slate-700 font-medium mt-0.5">
              {step1}
            </p>
          </div>
        </div>

        {/* Step 2 */}
        <div className="p-4 bg-white rounded-none border border-stone-300 shadow-none flex items-start gap-3">
          <div className="w-7 h-7 rounded-none bg-stone-200 text-stone-900 font-black text-base flex items-center justify-center flex-shrink-0 mt-0.5 border border-stone-400">
            2
          </div>
          <div>
            <h4 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
              Baja tu tono y ritmo de voz
            </h4>
            <p className="text-sm sm:text-base text-slate-700 font-medium mt-0.5">
              {step2}
            </p>
          </div>
        </div>

        {/* Step 3 */}
        <div className="p-4 bg-white rounded-none border border-stone-300 shadow-none flex items-start gap-3">
          <div className="w-7 h-7 rounded-none bg-stone-200 text-stone-900 font-black text-base flex items-center justify-center flex-shrink-0 mt-0.5 border border-stone-400">
            3
          </div>
          <div>
            <h4 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
              Ofrece agua fresca y reduce estímulos
            </h4>
            <p className="text-sm sm:text-base text-slate-700 font-medium mt-0.5">
              {step3}
            </p>
          </div>
        </div>
      </div>

      {/* Giant Audio Guide Button (30s calming guide) - Square & Muted */}
      <div className="mt-5 pt-4 border-t border-stone-300">
        <audio ref={audioRef} src={audioSrc} preload="auto" />

        <button
          type="button"
          onClick={handleToggleAudio}
          className="w-full min-h-[56px] p-3 bg-stone-800 hover:bg-stone-900 text-white rounded-none font-bold text-base sm:text-lg shadow-none flex items-center justify-center gap-2 border border-stone-950 transition-colors focus:outline-none focus:ring-2 focus:ring-stone-600"
          aria-label={
            isPlayingAudio
              ? "Pausar guía de audio de 30 segundos"
              : "Reproducir guía de audio de 30 segundos para intervención"
          }
        >
          {isPlayingAudio ? (
            <>
              <Pause className="w-5 h-5 fill-white" aria-hidden="true" />
              <span>Pausar Guía ({audioSeconds}s restantes)</span>
            </>
          ) : (
            <>
              <Play className="w-5 h-5 fill-white ml-0.5" aria-hidden="true" />
              <span>Reproducir Guía de Audio (30s)</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
