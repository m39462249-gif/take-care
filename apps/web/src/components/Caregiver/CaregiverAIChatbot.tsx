import React, { useState, useRef, useEffect } from "react";
import {
  BookOpen,
  Send,
  User,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Copy,
  Check,
  RotateCcw,
  ShieldCheck,
  HelpCircle,
  Pill,
  Moon,
  AlertTriangle,
  Heart,
  Info,
  Compass,
} from "lucide-react";
import { apiUrl } from "../../utils/api.js";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isError?: boolean;
}

interface CaregiverAIChatbotProps {
  patientId?: string;
  patientName?: string;
}

const QUICK_PROMPTS = [
  {
    icon: AlertTriangle,
    label: "Agitación o enfado",
    query: "Mateo está muy agitado, irritable y no se deja hablar. ¿Qué pasos inmediatos puedo seguir para calmar la situación sin confrontar?",
  },
  {
    icon: Pill,
    label: "Efectos de Risperidona",
    query: "¿Qué efectos secundarios habituales tiene la Risperidona 1mg y cuándo debería alertar a la Dra. Sofía Martínez?",
  },
  {
    icon: Moon,
    label: "Insomnio nocturno",
    query: "Son las 2:00 AM, Mateo se levantó desorientado y no puede dormir. ¿Qué pauta no farmacológica me recomiendas?",
  },
  {
    icon: HelpCircle,
    label: "Rechazo de comida y pastilla",
    query: "Mateo rechaza desayunar y no quiere tomar la medicación de la mañana. ¿Cómo puedo manejarlo con paciencia y eficacia?",
  },
  {
    icon: Heart,
    label: "Desahogo del cuidador",
    query: "Me siento agotada, sobrepasada y frustrada hoy con el cuidado. ¿Qué ejercicio breve de calma o apoyo puedo hacer ahora?",
  },
];

export const CaregiverAIChatbot: React.FC<CaregiverAIChatbotProps> = ({
  patientId = "prof-pat-001",
  patientName = "Mateo Silva",
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-msg",
      role: "assistant",
      content: `👋 **Hola, Elena.** Este es tu **Cuaderno de Orientación y Apoyo Clínico**.\n\nAquí tienes un espacio tranquilo para consultar pautas de manejo, dudas sobre la medicación de **${patientName}**, estrategias de desescalada sensorial o simplemente tomarte un momento de alivio ante el cansancio del cuidado.\n\n*¿En qué situación necesitas orientación en este momento?*`,
      timestamp: new Date(),
    },
  ]);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [includeContext, setIncludeContext] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Setup Web Speech Recognition if available
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = "es-ES";
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("El reconocimiento de voz no está soportado en este navegador.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const handleSpeak = (id: string, text: string) => {
    if (!("speechSynthesis" in window)) {
      alert("La síntesis de voz no está soportada en este navegador.");
      return;
    }

    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#_`]/g, "");
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "es-ES";
    utterance.rate = 0.92;

    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);

    setSpeakingId(id);
    window.speechSynthesis.speak(utterance);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearHistory = () => {
    if (window.confirm("¿Deseas reiniciar la consulta?")) {
      window.speechSynthesis?.cancel();
      setSpeakingId(null);
      setMessages([
        {
          id: `welcome-${Date.now()}`,
          role: "assistant",
          content: `Espacio reiniciado. Estoy listo para orientarte con cualquier duda o situación de cuidado de **${patientName}**.`,
          timestamp: new Date(),
        },
      ]);
    }
  };

  const sendMessage = async (contentToSend?: string) => {
    const text = (contentToSend || input).trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const historyPayload = messages
        .concat(userMessage)
        .slice(-10)
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const res = await fetch(apiUrl("/api/ai/chat"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: historyPayload,
          patientId,
          includePatientContext: includeContext,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Error al comunicarse con la guía clínica");
      }

      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: data.message?.content || "No se recibió respuesta.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err: any) {
      console.error("Error en consulta:", err);
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: `⚠️ **Inconveniente de conexión:**\n\n${err.message || "Verifica la conexión a internet o intenta en unos instantes."}`,
        timestamp: new Date(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const renderFormattedContent = (content: string) => {
    const paragraphs = content.split("\n\n");

    return paragraphs.map((para, i) => {
      if (para.includes("\n- ") || para.startsWith("- ")) {
        const items = para.split("\n- ").filter(Boolean);
        return (
          <ul key={i} className="list-disc pl-5 my-2 space-y-1.5 text-[#303B35]">
            {items.map((item, idx) => (
              <li key={idx} dangerouslySetInnerHTML={{ __html: formatInline(item) }} />
            ))}
          </ul>
        );
      }

      if (/^\d+\.\s/.test(para)) {
        const items = para.split(/\n(?=\d+\.\s)/).filter(Boolean);
        return (
          <ol key={i} className="list-decimal pl-5 my-2 space-y-2 text-[#303B35]">
            {items.map((item, idx) => (
              <li
                key={idx}
                dangerouslySetInnerHTML={{
                  __html: formatInline(item.replace(/^\d+\.\s*/, "")),
                }}
              />
            ))}
          </ol>
        );
      }

      return (
        <p
          key={i}
          className="mb-2 leading-relaxed text-[#303B35]"
          dangerouslySetInnerHTML={{ __html: formatInline(para) }}
        />
      );
    });
  };

  const formatInline = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong class='text-[#1E3A2F]'>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/`([^`]+)`/g, "<code class='bg-[#EDE8E0] px-1.5 py-0.5 rounded text-xs text-[#2A4D3B]'>$1</code>")
      .replace(/\n/g, "<br/>");
  };

  return (
    <div className="bg-white border-1.5 border-[#E6E0D6] rounded-3xl shadow-xs flex flex-col h-[740px] max-h-[85vh] overflow-hidden">
      {/* Top Header - Warm Forest Sage, calm and human */}
      <div className="bg-[#2E5A44] text-white p-5 border-b border-[#244836] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 bg-[#234533] border border-[#3E7056] rounded-2xl flex items-center justify-center text-white text-2xl shadow-2xs">
            🌿
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-white">Guía de Apoyo y Consulta</h3>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#EBF3EE]/20 text-[#D2EBDC] border border-[#EBF3EE]/30 text-[11px] font-bold rounded-full">
                Soporte Activo
              </span>
            </div>
            <p className="text-xs text-[#C6E2D2] font-medium">
              Orientación clínica empática para el cuidado de <span className="text-white font-bold">{patientName}</span>
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Toggle Patient Context */}
          <button
            type="button"
            onClick={() => setIncludeContext(!includeContext)}
            title="Toma en cuenta la medicación y rutinas actuales de Mateo"
            className={`px-3 py-1.5 text-xs font-bold rounded-full flex items-center gap-1.5 border transition-all ${
              includeContext
                ? "bg-[#234735] text-[#D2EBDC] border-[#3E7358]"
                : "bg-[#234735]/60 text-[#8AA897] border-[#345744]"
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>{includeContext ? "Con datos de Mateo" : "Consulta general"}</span>
          </button>

          {/* Reset Conversation */}
          <button
            type="button"
            onClick={handleClearHistory}
            title="Reiniciar consulta"
            className="p-2 bg-[#234735] hover:bg-[#1C3B2C] text-[#C6E2D2] border border-[#3E7358] rounded-full text-xs font-bold transition-all"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Prompt Carousel / Pills */}
      <div className="bg-[#FAF7F2] border-b border-[#EBE4D8] px-4 py-3 overflow-x-auto flex items-center gap-2 scrollbar-thin">
        <span className="text-xs font-black text-[#6B756E] uppercase tracking-wider shrink-0 flex items-center gap-1.5">
          <span>💡</span>
          Consultas habituales:
        </span>
        {QUICK_PROMPTS.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => sendMessage(item.query)}
              disabled={isLoading}
              className="shrink-0 flex items-center gap-2 px-3.5 py-1.5 bg-white hover:bg-[#F2ECE1] active:bg-[#EAE2D4] text-[#34423A] border border-[#DDD5C8] rounded-full text-xs font-bold transition-all disabled:opacity-50 shadow-2xs"
            >
              <Icon className="w-3.5 h-3.5 text-[#345D47]" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#FBF9F5]">
        {messages.map((msg) => {
          const isUser = msg.role === "user";

          return (
            <div
              key={msg.id}
              className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
            >
              {/* Assistant Avatar */}
              {!isUser && (
                <div className="w-9 h-9 rounded-2xl bg-[#EAF2EC] text-[#2E5A44] flex items-center justify-center shrink-0 border border-[#CCE0D4] mt-1 text-lg shadow-2xs">
                  🌱
                </div>
              )}

              {/* Message Bubble Card */}
              <div
                className={`max-w-[85%] sm:max-w-[75%] p-5 border text-sm transition-all ${
                  isUser
                    ? "bg-[#345D47] text-white border-[#2A4E3B] rounded-3xl rounded-tr-xs shadow-xs font-medium"
                    : msg.isError
                    ? "bg-[#FDF3F2] text-[#8C3A35] border-[#E8C2BF] rounded-3xl rounded-tl-xs font-medium"
                    : "bg-white text-[#2B3530] border-[#E6E0D6] rounded-3xl rounded-tl-xs shadow-xs"
                }`}
              >
                {/* Header inside bubble */}
                <div className="flex items-center justify-between gap-4 mb-2 pb-1.5 border-b border-current/10 text-xs">
                  <span className="font-black opacity-85">
                    {isUser ? "Tú (Elena)" : "Orientación de Cuidado"}
                  </span>
                  <span className="opacity-60 text-[11px]">
                    {msg.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                {/* Body Content */}
                <div className="text-sm sm:text-[15px]">
                  {isUser ? (
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  ) : (
                    renderFormattedContent(msg.content)
                  )}
                </div>

                {/* Assistant Actions: Audio Read Aloud & Copy */}
                {!isUser && !msg.isError && (
                  <div className="mt-3.5 pt-2.5 border-t border-[#EDE8E0] flex items-center justify-between text-xs text-[#6F7A74]">
                    <span className="text-[11px] font-medium flex items-center gap-1.5 text-[#6F7A74]">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#345D47]" />
                      Recomendaciones basadas en pautas de salud
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleSpeak(msg.id, msg.content)}
                        className={`p-1.5 rounded-lg hover:bg-[#F2ECE3] border border-transparent font-bold flex items-center gap-1 transition-colors ${
                          speakingId === msg.id ? "text-[#2E5A44] bg-[#EAF3EC] border-[#CCE0D4]" : ""
                        }`}
                        title={speakingId === msg.id ? "Detener voz" : "Escuchar respuesta"}
                      >
                        {speakingId === msg.id ? (
                          <>
                            <VolumeX className="w-3.5 h-3.5 text-[#2E5A44] animate-pulse" />
                            <span className="text-[11px]">Detener</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5" />
                            <span className="text-[11px]">Escuchar</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="p-1.5 rounded-lg hover:bg-[#F2ECE3] border border-transparent font-bold flex items-center gap-1 transition-colors text-[#55615A]"
                        title="Copiar texto"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-[#2E5A44]" />
                            <span className="text-[11px] text-[#2E5A44]">Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span className="text-[11px]">Copiar</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* User Avatar */}
              {isUser && (
                <div className="w-9 h-9 rounded-2xl bg-[#EAE3D5] text-[#4A4033] flex items-center justify-center shrink-0 border border-[#D8CEBD] mt-1 shadow-2xs font-bold text-sm">
                  👩
                </div>
              )}
            </div>
          );
        })}

        {/* Loading Indicator - Calm pulse */}
        {isLoading && (
          <div className="flex gap-3 justify-start items-center">
            <div className="w-9 h-9 rounded-2xl bg-[#EAF2EC] text-[#2E5A44] flex items-center justify-center shrink-0 border border-[#CCE0D4] text-lg">
              🌱
            </div>
            <div className="p-3.5 bg-white border border-[#E6E0D6] rounded-2xl text-[#526058] text-xs font-bold flex items-center gap-2.5 shadow-2xs">
              <div className="w-2.5 h-2.5 rounded-full bg-[#345D47] animate-ping" />
              <span>Buscando las mejores pautas de cuidado...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form Bar - Warm paper aesthetic */}
      <div className="p-4 bg-[#FAF7F2] border-t border-[#E6E0D6] rounded-b-3xl">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="flex items-end gap-2.5"
        >
          {/* Dictation button */}
          <button
            type="button"
            onClick={toggleListening}
            title={isListening ? "Detener dictado" : "Dictar consulta con voz"}
            className={`p-3.5 rounded-2xl border transition-all ${
              isListening
                ? "bg-[#964734] text-white border-[#7A3626] animate-pulse"
                : "bg-white hover:bg-[#F2ECE1] text-[#4A5750] border-[#D9D1C4] shadow-2xs"
            }`}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Text Area */}
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe tu consulta aquí con tranquilidad (ej: '¿Cómo calmar la irritabilidad?', '¿Es normal que tenga sueño tras la medicina?')..."
              rows={2}
              disabled={isLoading}
              className="w-full resize-none p-3 text-sm sm:text-[15px] bg-white border border-[#D9D1C4] focus:border-[#345D47] focus:outline-none rounded-2xl font-medium text-[#232B28] disabled:opacity-50 shadow-2xs placeholder:text-[#8D9690]"
            />
            <span className="absolute right-3 bottom-2 text-[10px] text-[#8E9792] hidden sm:inline">
              Presiona Enter para enviar
            </span>
          </div>

          {/* Send Button */}
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-3.5 bg-[#2E5A44] hover:bg-[#254A37] disabled:bg-[#D5CEC2] text-white rounded-2xl border border-[#203E2F] font-bold transition-all shrink-0 flex items-center justify-center shadow-xs cursor-pointer"
            title="Enviar mensaje"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>

        <p className="mt-2.5 text-[11px] text-[#717D77] font-medium text-center">
          🌿 Este espacio ofrece acompañamiento práctico para el hogar. En situaciones médicas imprevistas de urgencia, comunícate con el centro de salud.
        </p>
      </div>
    </div>
  );
};
export default CaregiverAIChatbot;
