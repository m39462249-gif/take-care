import { FastifyInstance, FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { Server as SocketIOServer } from "socket.io";
import { EmotionalFirstAidTechnique } from "@eje/db";
import { checkPrismaConnection, prisma } from "../db.js";
import crypto from "crypto";

const SessionSchema = z.object({
  patientId: z.string().min(1, "El ID del paciente es obligatorio"),
  durationSeconds: z.number().int().nonnegative().default(0),
  techniqueUsed: z.enum(["BREATHING", "MUSIC", "PHOTOS"]),
});

export const firstAidRoutes = (io: SocketIOServer): FastifyPluginAsync => {
  return async (fastify: FastifyInstance) => {
    // POST trigger play-audio
    fastify.post("/play-audio", async (request, reply) => {
      try {
        const body = (request.body as { patientId?: string }) || {};
        const patientId = body.patientId || "pat-demo-001";

        // Notify caregiver in real-time
        io.to("caregiver-room").emit("calm-mode-alert", {
          type: "CALM_MODE_TRIGGERED",
          patientId,
          technique: "MUSIC",
          timestamp: new Date().toISOString(),
          message: "El paciente ha activado la música de calma en sus Primeros Auxilios Emocionales.",
        });

        return reply.send({
          success: true,
          message: "Reproduciendo audio de calma preconfigurado",
          data: {
            title: "Melodía de Calma y Tranquilidad",
            artist: "Configurado por el cuidador",
            // Accessible calming ambient wave sound / meditation tone
            audioUrl: "https://cdn.freesound.org/previews/243/243701_3509815-lq.mp3",
          },
        });
      } catch (err: any) {
        request.log.error(err);
        return reply.status(500).send({
          success: false,
          message: "Error al activar el audio de calma",
        });
      }
    });

    // POST log emotional first aid session
    fastify.post("/session", async (request, reply) => {
      try {
        const parsed = SessionSchema.safeParse(request.body);
        if (!parsed.success) {
          return reply.status(400).send({
            success: false,
            message: "Datos de sesión inválidos",
            errors: parsed.error.errors,
          });
        }

        const isDb = await checkPrismaConnection();
        let session: any;

        if (isDb) {
          session = await prisma.emotionalFirstAidSession.create({
            data: {
              patientId: parsed.data.patientId,
              durationSeconds: parsed.data.durationSeconds,
              techniqueUsed: parsed.data.techniqueUsed as EmotionalFirstAidTechnique,
            },
          });
        } else {
          session = {
            id: `firstaid-${crypto.randomUUID().substring(0, 8)}`,
            patientId: parsed.data.patientId,
            durationSeconds: parsed.data.durationSeconds,
            techniqueUsed: parsed.data.techniqueUsed,
            triggeredAt: new Date(),
            createdAt: new Date(),
          };
        }

        // Notify caregiver via Socket.io
        io.to("caregiver-room").emit("calm-mode-alert", {
          type: "CALM_MODE_TRIGGERED",
          patientId: parsed.data.patientId,
          technique: parsed.data.techniqueUsed,
          timestamp: new Date().toISOString(),
          message: `El paciente ha completado una sesión de calma (${parsed.data.techniqueUsed}).`,
        });

        return reply.status(201).send({
          success: true,
          message: "Sesión de primeros auxilios emocionales registrada",
          data: session,
        });
      } catch (err: any) {
        request.log.error(err);
        return reply.status(500).send({
          success: false,
          message: "Error al registrar la sesión de calma",
        });
      }
    });
  };
};
