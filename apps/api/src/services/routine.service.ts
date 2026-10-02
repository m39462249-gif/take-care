import crypto from "crypto";
import { checkPrismaConnection, prisma, memoryStore, MemoryRoutine, MemoryRoutineStep } from "../db.js";

export class RoutineService {
  /**
   * Get all active routines for a patient with steps ordered by order ASC
   */
  static async getRoutinesByPatient(patientId?: string): Promise<any[]> {
    const isDb = await checkPrismaConnection();

    if (isDb) {
      const whereClause = patientId ? { patientId, isActive: true } : { isActive: true };
      const routines = await prisma.routine.findMany({
        where: whereClause,
        include: {
          steps: {
            orderBy: { order: "asc" },
          },
        },
        orderBy: { createdAt: "asc" },
      });

      // If DB has none yet, we can return the preseeded structures
      if (routines.length === 0) {
        return memoryStore.routines;
      }
      return routines;
    } else {
      let filtered = memoryStore.routines.filter((r) => r.isActive);
      if (patientId) {
        const patientRoutines = filtered.filter((r) => r.patientId === patientId);
        if (patientRoutines.length > 0) return patientRoutines;
      }
      return filtered;
    }
  }

  /**
   * Get single routine by ID with ordered steps
   */
  static async getRoutineById(id: string): Promise<any | null> {
    const isDb = await checkPrismaConnection();

    if (isDb) {
      return prisma.routine.findUnique({
        where: { id },
        include: {
          steps: {
            orderBy: { order: "asc" },
          },
        },
      });
    } else {
      const routine = memoryStore.routines.find((r) => r.id === id);
      if (!routine) return null;
      return {
        ...routine,
        steps: [...routine.steps].sort((a, b) => a.order - b.order),
      };
    }
  }

  /**
   * Create a new Routine with optional steps
   */
  static async createRoutine(data: {
    title: string;
    patientId: string;
    steps?: Array<{
      order: number;
      instructionText: string;
      imageUrl?: string | null;
      audioUrl?: string | null;
    }>;
  }): Promise<any> {
    const isDb = await checkPrismaConnection();

    if (isDb) {
      return prisma.routine.create({
        data: {
          title: data.title,
          patientId: data.patientId,
          isActive: true,
          ...(data.steps && data.steps.length > 0
            ? {
                steps: {
                  create: data.steps.map((s, idx) => ({
                    order: s.order ?? idx + 1,
                    instructionText: s.instructionText,
                    imageUrl: s.imageUrl || null,
                    audioUrl: s.audioUrl || null,
                  })),
                },
              }
            : {}),
        },
        include: {
          steps: {
            orderBy: { order: "asc" },
          },
        },
      });
    } else {
      const routineId = `rout-${crypto.randomUUID().substring(0, 8)}`;
      const newSteps: MemoryRoutineStep[] = (data.steps || []).map((s, idx) => ({
        id: `step-${crypto.randomUUID().substring(0, 8)}`,
        routineId,
        order: s.order ?? idx + 1,
        instructionText: s.instructionText,
        imageUrl: s.imageUrl || null,
        audioUrl: s.audioUrl || null,
      }));

      const newRoutine: MemoryRoutine = {
        id: routineId,
        title: data.title,
        patientId: data.patientId,
        isActive: true,
        createdAt: new Date(),
        steps: newSteps,
      };

      memoryStore.routines.push(newRoutine);
      return newRoutine;
    }
  }

  /**
   * Add a single step to an existing routine
   */
  static async addStep(
    routineId: string,
    step: {
      order: number;
      instructionText: string;
      imageUrl?: string | null;
      audioUrl?: string | null;
    }
  ): Promise<any> {
    const isDb = await checkPrismaConnection();

    if (isDb) {
      return prisma.routineStep.create({
        data: {
          routineId,
          order: step.order,
          instructionText: step.instructionText,
          imageUrl: step.imageUrl || null,
          audioUrl: step.audioUrl || null,
        },
      });
    } else {
      const routine = memoryStore.routines.find((r) => r.id === routineId);
      if (!routine) throw new Error("Rutina no encontrada");

      const newStep: MemoryRoutineStep = {
        id: `step-${crypto.randomUUID().substring(0, 8)}`,
        routineId,
        order: step.order,
        instructionText: step.instructionText,
        imageUrl: step.imageUrl || null,
        audioUrl: step.audioUrl || null,
      };

      routine.steps.push(newStep);
      return newStep;
    }
  }
}
