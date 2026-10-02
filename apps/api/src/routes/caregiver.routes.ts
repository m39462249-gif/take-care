import { FastifyInstance, FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { Server as SocketIOServer } from "socket.io";
import { SymptomTag } from "@eje/db";
import { CaregiverService } from "../services/caregiver.service.js";

const SymptomTagSchema = z.enum(["NO_SLEEP", "HALLUCINATION", "FOOD_REFUSAL", "AGITATION"]);

const QuickLogSchema = z.object({
  patientId: z.string().min(1, "El ID del paciente es obligatorio"),
  caregiverId: z.string().min(1, "El ID del cuidador es obligatorio"),
  symptomTag: SymptomTagSchema,
  notes: z.string().optional().nullable(),
  audioUrl: z.string().optional().nullable(),
});

export const caregiverRoutes = (io: SocketIOServer): FastifyPluginAsync => {
  return async (fastify: FastifyInstance) => {
    // POST register a QuickLog
    fastify.post("/quick-log", async (request, reply) => {
      try {
        const parsed = QuickLogSchema.safeParse(request.body);
        if (!parsed.success) {
          return reply.status(400).send({
            success: false,
            message: "Datos de bitácora rápida inválidos",
            errors: parsed.error.errors,
          });
        }

        const { quickLog, interventionGuide } = await CaregiverService.createQuickLog(
          parsed.data as {
            patientId: string;
            caregiverId: string;
            symptomTag: SymptomTag;
            notes?: string | null;
            audioUrl?: string | null;
          },
          io
        );

        return reply.status(201).send({
          success: true,
          message: "Bitácora rápida registrada",
          data: {
            quickLog,
            interventionGuide,
          },
        });
      } catch (err: any) {
        request.log.error(err);
        return reply.status(500).send({
          success: false,
          message: "Error al registrar la bitácora rápida",
        });
      }
    });

    // GET preventive reminders based on deterministic rules
    fastify.get("/reminders", async (request, reply) => {
      try {
        const { patientId } = request.query as { patientId?: string };
        const reminders = await CaregiverService.getReminders(patientId);
        return reply.send({
          success: true,
          data: reminders,
        });
      } catch (err: any) {
        request.log.error(err);
        return reply.status(500).send({
          success: false,
          message: "Error al obtener los recordatorios preventivos",
        });
      }
    });

    // POST upload voice note (base64 audio or data URL)
    fastify.post("/upload-audio", async (request, reply) => {
      try {
        const body = (request.body as { audioData?: string; fileName?: string }) || {};
        if (!body.audioData) {
          return reply.status(400).send({
            success: false,
            message: "No se recibieron datos de audio",
          });
        }

        // Return data URL or generated reference
        const audioUrl = body.audioData;

        return reply.send({
          success: true,
          message: "Audio guardado exitosamente",
          data: {
            audioUrl,
          },
        });
      } catch (err: any) {
        request.log.error(err);
        return reply.status(500).send({
          success: false,
          message: "Error al guardar el archivo de audio",
        });
      }
    });

    // GET quick logs history
    fastify.get("/quick-logs", async (request, reply) => {
      try {
        const { patientId } = request.query as { patientId?: string };
        const logs = await CaregiverService.getQuickLogs(patientId);
        return reply.send({
          success: true,
          data: logs,
        });
      } catch (err: any) {
        request.log.error(err);
        return reply.status(500).send({
          success: false,
          message: "Error al obtener el historial de bitácora",
        });
      }
    });

    // GET intervention guide for a specific symptom tag
    fastify.get("/playbook/:tag", async (request, reply) => {
      try {
        const { tag } = request.params as { tag: string };
        const parsedTag = SymptomTagSchema.safeParse(tag);
        if (!parsedTag.success) {
          return reply.status(400).send({
            success: false,
            message: "Etiqueta de síntoma no válida. Debe ser NO_SLEEP, HALLUCINATION, FOOD_REFUSAL o AGITATION",
          });
        }

        const guide = await CaregiverService.getGuideByTag(parsedTag.data as SymptomTag);
        if (!guide) {
          return reply.status(404).send({
            success: false,
            message: "Guía de intervención no encontrada",
          });
        }

        return reply.send({
          success: true,
          data: guide,
        });
      } catch (err: any) {
        request.log.error(err);
        return reply.status(500).send({
          success: false,
          message: "Error al obtener la guía de intervención",
        });
      }
    });

    // GET all intervention guides
    fastify.get("/playbook", async (_request, reply) => {
      try {
        const guides = await CaregiverService.getAllGuides();
        return reply.send({
          success: true,
          data: guides,
        });
      } catch (err: any) {
        return reply.status(500).send({
          success: false,
          message: "Error al obtener el catálogo de guías",
        });
      }
    });
  };
};
