import fastifyCors from "@fastify/cors";
import fastifyJwt from "@fastify/jwt";
import dotenv from "dotenv";
import Fastify from "fastify";
import { Server as SocketIOServer } from "socket.io";
import { checkPrismaConnection } from "./db.js";
import { authRoutes } from "./routes/auth.routes.js";
import { routineRoutes } from "./routes/routine.routes.js";
import { medicationRoutes } from "./routes/medication.routes.js";
import { caregiverRoutes } from "./routes/caregiver.routes.js";
import { firstAidRoutes } from "./routes/firstAid.routes.js";
import { professionalRoutes } from "./routes/professional.routes.js";
import { aiRoutes } from "./routes/ai.routes.js";

dotenv.config();

const port = Number(process.env.PORT) || 4000;
const jwtSecret = process.env.JWT_SECRET || "ritmo-super-secret-jwt-key-2026";

// Local development origins are always allowed as a fallback.
const localOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
];

// CLIENT_URL may hold one or more comma-separated production origins
// (e.g. https://ejeweb-production.up.railway.app). Trailing slashes are stripped
// because browsers send the Origin header without them.
const clientOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map((origin) => origin.trim().replace(/\/+$/, ""))
  .filter(Boolean);

const allowedOrigins = Array.from(new Set([...clientOrigins, ...localOrigins]));

// Check if an origin is permitted (matches local dev, CLIENT_URL, or Railway deployment domains)
function isOriginAllowed(origin?: string): boolean {
  if (!origin) return true; // allow same-origin, curl, server-to-server or non-browser requests
  const cleanOrigin = origin.replace(/\/+$/, "");

  if (allowedOrigins.includes(cleanOrigin)) return true;
  
  // Allow any Railway app domain (*.up.railway.app) and local development hosts
  if (/^https?:\/\/localhost(:\d+)?$/.test(cleanOrigin)) return true;
  if (/^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(cleanOrigin)) return true;
  if (/^https:\/\/[a-zA-Z0-9_-]+\.up\.railway\.app$/.test(cleanOrigin)) return true;

  return false;
}

const app = Fastify({
  logger: true,
});

async function main() {
  // Register CORS
  await app.register(fastifyCors, {
    origin: (origin, cb) => {
      if (isOriginAllowed(origin)) {
        cb(null, true);
      } else {
        cb(null, false);
      }
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  });

  // Register JWT
  await app.register(fastifyJwt, {
    secret: jwtSecret,
  });

  // Attach Socket.io to Fastify's raw HTTP server
  const io = new SocketIOServer(app.server, {
    cors: {
      origin: (origin, callback) => {
        if (isOriginAllowed(origin)) {
          callback(null, true);
        } else {
          callback(null, false);
        }
      },
      credentials: true,
    },
  });

  // Health check routes (root for Railway default probes and /api/health)
  const healthHandler = async () => {
    const dbConnected = await checkPrismaConnection();
    return {
      status: "ok",
      platform: "Take Care (Eje Platform) - Asistente Activo de Cuidado Diario",
      timestamp: new Date().toISOString(),
      database: dbConnected ? "PostgreSQL (Prisma)" : "In-Memory Dev Store",
    };
  };

  app.get("/", healthHandler);
  app.get("/health", healthHandler);
  app.get("/api/health", healthHandler);

  // Register All Functional Routes
  await app.register(authRoutes, { prefix: "/api/auth" });
  await app.register(routineRoutes, { prefix: "/api/routines" });
  await app.register(medicationRoutes(io), { prefix: "/api/medications" });
  await app.register(medicationRoutes(io), { prefix: "/api/medication" }); // alias
  await app.register(caregiverRoutes(io), { prefix: "/api/caregiver" });
  await app.register(firstAidRoutes(io), { prefix: "/api/first-aid" });
  await app.register(professionalRoutes, { prefix: "/api/professional" });
  await app.register(aiRoutes, { prefix: "/api/ai" });

  // Socket.io Real-time Channel Setup
  io.on("connection", (socket) => {
    app.log.info(`[Socket.io] Cliente conectado: ${socket.id}`);

    // Join patient or caregiver specific rooms
    socket.on("join-room", (room: string) => {
      socket.join(room);
      app.log.info(`[Socket.io] ${socket.id} se unió a la sala: ${room}`);
    });

    // Patient activates Emotional First Aid / Calm Mode -> notify caregiver with playbook
    socket.on("calm-mode-activated", (data: { patientId: string; technique?: string }) => {
      app.log.info(`[Socket.io] Modo Calma activado por paciente: ${data.patientId}`);
      const payload = {
        type: "CALM_MODE_TRIGGERED",
        patientId: data.patientId,
        technique: data.technique || "BREATHING",
        timestamp: new Date().toISOString(),
        message: "El paciente ha iniciado una sesión de Primeros Auxilios Emocionales (Modo Calma).",
      };
      io.to(`caregiver-${data.patientId}`).emit("calm-mode-alert", payload);
      io.to("caregiver-room").emit("calm-mode-alert", payload);
      io.emit("calm-mode-alert", payload);
    });

    // Live direct chat between Caregiver and Clinical Team
    socket.on("send-direct-chat", (data: {
      patientId: string;
      senderId: string;
      senderName: string;
      senderRole: "CAREGIVER" | "PROFESSIONAL";
      text: string;
      timestamp?: string;
    }) => {
      const chatMessage = {
        id: `chat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        patientId: data.patientId,
        senderId: data.senderId,
        senderName: data.senderName,
        senderRole: data.senderRole,
        text: data.text,
        timestamp: data.timestamp || new Date().toISOString(),
      };
      app.log.info(`[Socket.io Chat] Mensaje de ${data.senderName} (${data.senderRole}): ${data.text.substring(0, 30)}`);
      
      // Emit to patient specific room, caregiver room, and professional room
      io.to(`caregiver-${data.patientId}`).emit("new-direct-chat", chatMessage);
      io.to(`clinic-${data.patientId}`).emit("new-direct-chat", chatMessage);
      io.to("caregiver-room").emit("new-direct-chat", chatMessage);
      io.to("clinic-room").emit("new-direct-chat", chatMessage);
      io.emit("new-direct-chat", chatMessage);
    });

    socket.on("disconnect", () => {
      app.log.info(`[Socket.io] Cliente desconectado: ${socket.id}`);
    });
  });

  // Check database connectivity on boot
  await checkPrismaConnection();

  try {
    await app.listen({ port, host: "0.0.0.0" });
    console.log(`🚀 [Ritmo API] Servidor iniciado en http://localhost:${port}`);
    console.log(`📡 [Socket.io] Listo para rutinas activas, drag & drop de medicación y alertas.`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
