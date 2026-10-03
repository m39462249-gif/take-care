import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  MessageSquare,
  Stethoscope,
  HeartHandshake,
  Clock,
  CheckCheck,
  Shield,
  Phone,
  Video,
  Sparkles,
  Info,
  ChevronDown,
  User,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.js";
import { getSocket } from "../../utils/socket.js";
import { apiUrl, smartFetch } from "../../utils/api.js";
import { playGentleChime } from "../../utils/audio.js";

export interface DirectChatMessage {
  id: string;
  patientId: string;
  senderId: string;
  senderName: string;
  senderRole: "CAREGIVER" | "PROFESSIONAL";
  text: string;
  timestamp: string;
}

interface DirectChatProps {
  patientId?: string;
  patientName?: string;
  title?: string;
  subtitle?: string;
}

export const DirectCaregiverClinicChat: React.FC<DirectChatProps> = ({
  patientId = "prof-pat-001",
  patientName = "Mateo Silva",
  title,
  subtitle,
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<DirectChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentRole = user?.role || "CAREGIVER";
  const isCaregiver = currentRole === "CAREGIVER";
  const defaultTitle = isCaregiver
    ? "Comunicación Directa con Equipo Clínico"
    : "Canal de Comunicación con la Cuidadora";
  const defaultSubtitle = isCaregiver
    ? "Canal en vivo y seguro con la Dra. Sofía Martínez (Psiquiatría y Salud Neurocognitiva)"
    : "Contacto directo y en tiempo real con Elena Silva (Madre y cuidadora principal)";

  // Auto-scroll to latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat messages
  const fetchMessages = async () => {
    try {
      const res = await smartFetch(apiUrl(`/api/chat/messages?patientId=${patientId}`));
      const data = await res.json();
      if (data.success && data.data) {
        setMessages(data.data);
      }
    } catch (err) {
      console.error("Error al cargar historial de chat:", err);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [patientId]);

  // Real-time socket listener
  useEffect(() => {
    const socket = getSocket();

    // Join rooms
    socket.emit("join-room", `caregiver-${patientId}`);
    socket.emit("join-room", `clinic-${patientId}`);
    socket.emit("join-room", "caregiver-room");
    socket.emit("join-room", "clinic-room");

    const handleNewMessage = (newMsg: DirectChatMessage) => {
      // Avoid duplicate append if already present
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });

      // Play soft chime if message came from the other person
      if (newMsg.senderRole !== currentRole) {
        try {
          playGentleChime();
        } catch {}
      }
    };

    socket.on("new-direct-chat", handleNewMessage);
    socket.on("connect", () => setIsConnected(true));
    socket.on("disconnect", () => setIsConnected(false));

    return () => {
      socket.off("new-direct-chat", handleNewMessage);
    };
  }, [patientId, currentRole]);

  // Send message handler
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSending) return;

    const messageText = inputText.trim();
    setInputText("");
    setIsSending(true);

    const senderName = user?.fullName || (isCaregiver ? "Elena Silva" : "Dra. Sofía Martínez");
    const senderId = user?.profileId || user?.id || (isCaregiver ? "prof-cg-001" : "prof-doc-001");

    const payload = {
      patientId,
      senderId,
      senderName,
      senderRole: (isCaregiver ? "CAREGIVER" : "PROFESSIONAL") as "CAREGIVER" | "PROFESSIONAL",
      text: messageText,
      timestamp: new Date().toISOString(),
    };

    // 1. Emit via Socket.io for immediate real-time delivery
    try {
      const socket = getSocket();
      socket.emit("send-direct-chat", payload);
    } catch (err) {
      console.warn("Socket emit error:", err);
    }

    // 2. Persist via smartFetch
    try {
      const res = await smartFetch(apiUrl("/api/chat/messages"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.data.id)) return prev;
          return [...prev, data.data];
        });
      }
    } catch (err) {
      console.error("Error guardando mensaje:", err);
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  return (
    <div className="bg-white border-1.5 border-[#E6E0D6] rounded-3xl shadow-xs overflow-hidden flex flex-col h-[650px] transition-all">
      {/* Header */}
      <div className="p-4 sm:p-5 bg-[#FAF8F5] border-b border-[#E6E0D6] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-2xs ${
              isCaregiver ? "bg-[#244E70]" : "bg-[#2E5A44]"
            }`}
          >
            {isCaregiver ? (
              <Stethoscope className="w-5 h-5 text-sky-100" />
            ) : (
              <HeartHandshake className="w-5 h-5 text-emerald-100" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#232B28] tracking-tight">
                {title || defaultTitle}
              </h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>En vivo</span>
              </span>
            </div>
            <p className="text-xs text-[#5E6B65] font-medium mt-0.5">
              {subtitle || defaultSubtitle}
            </p>
          </div>
        </div>

        {/* Quick Context Tag */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-[#E6E0D6] text-xs text-[#3E4742] font-semibold">
          <Shield className="w-3.5 h-3.5 text-[#2E5A44]" />
          <span>Caso: {patientName} (26 a)</span>
        </div>
      </div>

      {/* Messages List Area */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-[#FAF8F5]/40">
        {/* Safe Care Reminder Banner */}
        <div className="p-3 bg-[#EBF3EE] border border-[#CCE0D4] rounded-2xl flex items-center gap-2 text-xs text-[#2E5A44] font-medium">
          <Sparkles className="w-4 h-4 shrink-0 text-[#2E5A44]" />
          <span>
            Canal de teleorientación continua y dudas no urgentes. Para urgencias vitales, llamar al 112 / centro asistencial local.
          </span>
        </div>

        {messages.map((msg) => {
          const isMyMessage = msg.senderRole === currentRole;

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isMyMessage ? "items-end" : "items-start"}`}
            >
              <div className="flex items-center gap-1.5 mb-1 px-1">
                <span className="text-[11px] font-bold text-[#6B7871]">
                  {msg.senderName}
                </span>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md ${
                    msg.senderRole === "PROFESSIONAL"
                      ? "bg-[#EAF0F6] text-[#244E70]"
                      : "bg-[#F3EFE8] text-[#5A4A3B]"
                  }`}
                >
                  {msg.senderRole === "PROFESSIONAL" ? "Clínica" : "Cuidadora"}
                </span>
                <span className="text-[10px] text-[#9EA8A2]">
                  {formatTime(msg.timestamp)}
                </span>
              </div>

              <div
                className={`max-w-[85%] sm:max-w-[70%] p-3.5 sm:p-4 rounded-2xl text-sm leading-relaxed shadow-2xs ${
                  isMyMessage
                    ? isCaregiver
                      ? "bg-[#2E5A44] text-white rounded-br-xs font-medium"
                      : "bg-[#244E70] text-white rounded-br-xs font-medium"
                    : "bg-white text-[#232B28] border border-[#E6E0D6] rounded-bl-xs font-normal"
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.text}</p>
              </div>

              {isMyMessage && (
                <div className="flex items-center gap-1 text-[10px] text-[#8C9690] mt-0.5 px-1">
                  <span>Enviado</span>
                  <CheckCheck className="w-3 h-3 text-[#2E5A44]" />
                </div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Message Form */}
      <form
        onSubmit={handleSendMessage}
        className="p-3 sm:p-4 bg-white border-t border-[#E6E0D6] flex items-center gap-2"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={
            isCaregiver
              ? "Escribe tu consulta o reporte para la Dra. Sofía..."
              : "Escribe una indicación o respuesta para la cuidadora Elena..."
          }
          className="flex-1 px-4 py-3 bg-[#FAF8F5] border border-[#DDD5C8] rounded-2xl text-sm text-[#232B28] placeholder-[#8F9993] focus:outline-none focus:border-[#2E5A44] focus:bg-white transition-all"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isSending}
          className={`px-5 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 transition-all shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
            isCaregiver
              ? "bg-[#2E5A44] hover:bg-[#254A37] text-white"
              : "bg-[#244E70] hover:bg-[#1D3E59] text-white"
          }`}
          aria-label="Enviar mensaje"
        >
          <span>Enviar</span>
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
