import { FastifyInstance, FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { RoutineService } from "../services/routine.service.js";

const CreateRoutineSchema = z.object({
  title: z.string().min(2, "El título de la rutina es obligatorio"),
  patientId: z.string().min(1, "El ID del paciente es obligatorio"),
  steps: z
    .array(
      z.object({
        order: z.number().int().positive(),
        instructionText: z.string().min(1, "El texto de instrucción es obligatorio"),
        imageUrl: z.string().url().optional().nullable(),
        audioUrl: z.string().url().optional().nullable(),
      })
    )
    .optional(),
});

const AddStepSchema = z.object({
  order: z.number().int().positive(),
  instructionText: z.string().min(1, "El texto de instrucción es obligatorio"),
  imageUrl: z.string().url().optional().nullable(),
  audioUrl: z.string().url().optional().nullable(),
});

export const routineRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // GET all routines (optionally by patientId)
  fastify.get("/", async (request, reply) => {
    try {
      const { patientId } = request.query as { patientId?: string };
      const routines = await RoutineService.getRoutinesByPatient(patientId);
      return reply.send({
        success: true,
        data: routines,
      });
    } catch (err: any) {
      request.log.error(err);
      return reply.status(500).send({
        success: false,
        message: "Error al obtener las rutinas",
      });
    }
  });

  // GET single routine by id
  fastify.get("/:id", async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const routine = await RoutineService.getRoutineById(id);
      if (!routine) {
        return reply.status(404).send({
          success: false,
          message: "Rutina no encontrada",
        });
      }
      return reply.send({
        success: true,
        data: routine,
      });
    } catch (err: any) {
      request.log.error(err);
      return reply.status(500).send({
        success: false,
        message: "Error al obtener la rutina",
      });
    }
  });

  // POST create routine
  fastify.post("/", async (request, reply) => {
    try {
      const parsed = CreateRoutineSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          message: "Datos de rutina inválidos",
          errors: parsed.error.errors,
        });
      }

      const newRoutine = await RoutineService.createRoutine(parsed.data);
      return reply.status(201).send({
        success: true,
        message: "Rutina creada exitosamente",
        data: newRoutine,
      });
    } catch (err: any) {
      request.log.error(err);
      return reply.status(500).send({
        success: false,
        message: "Error al crear la rutina",
      });
    }
  });

  // POST add step to routine
  fastify.post("/:id/steps", async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const parsed = AddStepSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          message: "Datos del paso inválidos",
          errors: parsed.error.errors,
        });
      }

      const step = await RoutineService.addStep(id, parsed.data);
      return reply.status(201).send({
        success: true,
        message: "Paso añadido a la rutina exitosamente",
        data: step,
      });
    } catch (err: any) {
      request.log.error(err);
      return reply.status(500).send({
        success: false,
        message: err.message || "Error al añadir el paso",
      });
    }
  });

  // POST complete a step in a routine
  fastify.post("/:id/steps/:stepId/complete", async (request, reply) => {
    try {
      const { id, stepId } = request.params as { id: string; stepId: string };
      const body = (request.body as { patientId?: string }) || {};

      console.log(`✅ [Routine] Paso completado: Rutina ${id}, Paso ${stepId} por paciente ${body.patientId || "anónimo"}`);

      return reply.send({
        success: true,
        message: "Paso marcado como completado",
        data: {
          routineId: id,
          stepId,
          completedAt: new Date().toISOString(),
        },
      });
    } catch (err: any) {
      request.log.error(err);
      return reply.status(500).send({
        success: false,
        message: "Error al registrar paso completado",
      });
    }
  });
};
