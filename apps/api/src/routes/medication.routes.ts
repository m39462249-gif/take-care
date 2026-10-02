import { FastifyInstance, FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { Server as SocketIOServer } from "socket.io";
import { MedicationService } from "../services/medication.service.js";

const CreateScheduleSchema = z.object({
  patientId: z.string().min(1, "El ID del paciente es obligatorio"),
  timeOfDay: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato de hora debe ser HH:mm (ej. 08:30)"),
  medicationName: z.string().min(2, "El nombre de la medicación es obligatorio"),
  dosage: z.string().optional().nullable(),
  instructions: z.string().optional().nullable(),
  prescribedBy: z.string().optional().nullable(),
  frequency: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
});

const MedicationLogSchema = z.object({
  scheduleId: z.string().min(1, "El ID de la pauta es obligatorio"),
  patientId: z.string().min(1, "El ID del paciente es obligatorio"),
  takenAt: z.string().optional(),
  confirmedByDragAndDrop: z.boolean().default(true),
  isMissedTimeout: z.boolean().optional(),
});

export const medicationRoutes = (io: SocketIOServer): FastifyPluginAsync => {
  return async (fastify: FastifyInstance) => {
    // GET all medication schedules
    fastify.get("/schedules", async (request, reply) => {
      try {
        const { patientId } = request.query as { patientId?: string };
        const schedules = await MedicationService.getSchedules(patientId);
        return reply.send({
          success: true,
          data: schedules,
        });
      } catch (err: any) {
        request.log.error(err);
        return reply.status(500).send({
          success: false,
          message: "Error al obtener las pautas de medicación",
        });
      }
    });

    // POST create schedule / prescription from doctor
    fastify.post("/schedules", async (request, reply) => {
      try {
        const parsed = CreateScheduleSchema.safeParse(request.body);
        if (!parsed.success) {
          return reply.status(400).send({
            success: false,
            message: "Datos de pauta inválidos",
            errors: parsed.error.errors,
          });
        }

        const schedule = await MedicationService.createSchedule(parsed.data, io);
        return reply.status(201).send({
          success: true,
          message: "Pauta de medicación creada y enviada al cuidador",
          data: schedule,
        });
      } catch (err: any) {
        request.log.error(err);
        return reply.status(500).send({
          success: false,
          message: "Error al crear la pauta",
        });
      }
    });

    // DELETE medication schedule (doctor suspends / removes prescription)
    fastify.delete("/schedules/:id", async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const success = await MedicationService.deleteSchedule(id, io);
        if (!success) {
          return reply.status(404).send({
            success: false,
            message: "Pauta de medicación no encontrada",
          });
        }
        return reply.send({
          success: true,
          message: "Pauta de medicación retirada correctamente",
        });
      } catch (err: any) {
        request.log.error(err);
        return reply.status(500).send({
          success: false,
          message: "Error al suspender la pauta de medicación",
        });
      }
    });

    // POST log medication intake (or report 30-min missed timeout)
    fastify.post("/log", async (request, reply) => {
      try {
        const parsed = MedicationLogSchema.safeParse(request.body);
        if (!parsed.success) {
          return reply.status(400).send({
            success: false,
            message: "Datos de registro inválidos",
            errors: parsed.error.errors,
          });
        }

        const result = await MedicationService.logMedication(parsed.data, io);

        return reply.status(201).send({
          success: true,
          message: result.alertEmitted
            ? "Toma no confirmada registrada (alerta emitida al cuidador)"
            : "Medicación confirmada mediante Drag & Drop",
          data: result.log,
          alertEmitted: result.alertEmitted,
        });
      } catch (err: any) {
        request.log.error(err);
        return reply.status(500).send({
          success: false,
          message: "Error al registrar la toma de medicación",
        });
      }
    });

    // GET logs
    fastify.get("/logs", async (request, reply) => {
      try {
        const { patientId } = request.query as { patientId?: string };
        const logs = await MedicationService.getLogs(patientId);
        return reply.send({
          success: true,
          data: logs,
        });
      } catch (err: any) {
        request.log.error(err);
        return reply.status(500).send({
          success: false,
          message: "Error al obtener el historial de medicación",
        });
      }
    });
  };
};
