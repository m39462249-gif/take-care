import crypto from "crypto";
import { Server as SocketIOServer } from "socket.io";
import { SymptomTag } from "@eje/db";
import {
  checkPrismaConnection,
  prisma,
  memoryStore,
  MemoryCaregiverQuickLog,
} from "../db.js";

export interface PreventiveReminder {
  id: string;
  type: "MEDICATION" | "ROUTINE" | "HYDRATION" | "SYMPTOM";
  priority: "HIGH" | "MEDIUM" | "NORMAL";
  title: string;
  description: string;
  actionText: string;
  createdAt: string;
}

export class CaregiverService {
  /**
   * Get intervention guide by symptom tag
   */
  static async getGuideByTag(tag: SymptomTag): Promise<any | null> {
    const isDb = await checkPrismaConnection();

    if (isDb) {
      const guide = await prisma.interventionGuide.findUnique({
        where: { triggerTag: tag },
      });
      if (guide) return guide;
    }

    return memoryStore.interventionGuides.find((g) => g.triggerTag === tag) || null;
  }

  /**
   * Create a CaregiverQuickLog and return both the log and contextual intervention guide
   */
  static async createQuickLog(
    data: {
      patientId: string;
      caregiverId: string;
      symptomTag: SymptomTag;
      notes?: string | null;
      audioUrl?: string | null;
    },
    io?: SocketIOServer
  ): Promise<{ quickLog: any; interventionGuide: any }> {
    const isDb = await checkPrismaConnection();

    // Consolidate text notes and audioUrl
    let notesContent = data.notes || "";
    if (data.audioUrl) {
      notesContent = notesContent
        ? `${notesContent} [Audio: ${data.audioUrl}]`
        : `[Audio Nota de Voz: ${data.audioUrl}]`;
    }

    let createdLog: any;

    if (isDb) {
      createdLog = await prisma.caregiverQuickLog.create({
        data: {
          patientId: data.patientId,
          caregiverId: data.caregiverId,
          symptomTag: data.symptomTag,
          notes: notesContent || null,
        },
        include: {
          patient: true,
          caregiver: true,
        },
      });
    } else {
      const logId = `qlog-${crypto.randomUUID().substring(0, 8)}`;
      createdLog = {
        id: logId,
        patientId: data.patientId,
        caregiverId: data.caregiverId,
        symptomTag: data.symptomTag,
        notes: notesContent || null,
        audioUrl: data.audioUrl || null,
        createdAt: new Date(),
      };
      memoryStore.caregiverQuickLogs.push(createdLog);
    }

    const guide = await this.getGuideByTag(data.symptomTag);

    // Emit real-time event to socket rooms
    if (io) {
      const payload = {
        type: "CAREGIVER_QUICK_LOG_ADDED",
        patientId: data.patientId,
        caregiverId: data.caregiverId,
        symptomTag: data.symptomTag,
        notes: notesContent,
        audioUrl: data.audioUrl,
        createdAt: createdLog.createdAt,
        interventionGuide: guide,
      };

      io.to(`caregiver-${data.patientId}`).emit("quick-log-alert", payload);
      io.to("caregiver-room").emit("quick-log-alert", payload);
      io.emit("caregiver:quick-log", payload);
      io.emit("quick-log-alert", payload);
      console.log(`📋 [Socket.io] QuickLog registrado: ${data.symptomTag} con guía de intervención.`);
    }

    return {
      quickLog: {
        ...createdLog,
        audioUrl: data.audioUrl || (createdLog as any).audioUrl || null,
      },
      interventionGuide: guide,
    };
  }

  /**
   * Get all quick logs for a patient
   */
  static async getQuickLogs(patientId?: string): Promise<any[]> {
    const isDb = await checkPrismaConnection();

    if (isDb) {
      const whereClause = patientId ? { patientId } : {};
      return prisma.caregiverQuickLog.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
      });
    } else {
      let logs = memoryStore.caregiverQuickLogs;
      if (patientId) {
        logs = logs.filter((l) => l.patientId === patientId);
      }
      return logs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
  }

  /**
   * Get all intervention guides
   */
  static async getAllGuides(): Promise<any[]> {
    const isDb = await checkPrismaConnection();

    if (isDb) {
      const guides = await prisma.interventionGuide.findMany();
      if (guides.length > 0) return guides;
    }

    return memoryStore.interventionGuides;
  }

  /**
   * Generate simple rule-based preventive reminders for the caregiver
   */
  static async getReminders(patientId?: string): Promise<PreventiveReminder[]> {
    const reminders: PreventiveReminder[] = [];
    const isDb = await checkPrismaConnection();

    // 1. Check medication logs
    let missedMedsCount = 0;
    if (isDb) {
      missedMedsCount = await prisma.medicationLog.count({
        where: {
          ...(patientId ? { patientId } : {}),
          confirmedByDragAndDrop: false,
        },
      });
    } else {
      missedMedsCount = memoryStore.medicationLogs.filter(
        (l) => (!patientId || l.patientId === patientId) && !l.confirmedByDragAndDrop
      ).length;
    }

    if (missedMedsCount > 0) {
      reminders.push({
        id: "rem-med-01",
        type: "MEDICATION",
        priority: "HIGH",
        title: "Revisión de Medicación",
        description:
          "Mateo ha tenido demoras o problemas para confirmar su pastilla con el ritual del vaso. ¿Necesita ayuda para organizar su pastillero?",
        actionText: "Revisar pastillero",
        createdAt: new Date().toISOString(),
      });
    }

    // 2. Check recent symptom logs
    let recentSymptoms: any[] = [];
    if (isDb) {
      recentSymptoms = await prisma.caregiverQuickLog.findMany({
        where: patientId ? { patientId } : {},
        orderBy: { createdAt: "desc" },
        take: 3,
      });
    } else {
      recentSymptoms = memoryStore.caregiverQuickLogs.slice(-3);
    }

    const hasAgitation = recentSymptoms.some(
      (s) => s.symptomTag === "AGITATION" || s.symptomTag === "HALLUCINATION"
    );
    if (hasAgitation) {
      reminders.push({
        id: "rem-sym-02",
        type: "SYMPTOM",
        priority: "HIGH",
        title: "Seguimiento Conductual",
        description:
          "Se registró inquietud o agitación reciente. Mantener el entorno predecible, evitar preguntas complejas y usar tono de voz bajo y pausado.",
        actionText: "Ver Playbook",
        createdAt: new Date().toISOString(),
      });
    }

    const hasSleepIssue = recentSymptoms.some((s) => s.symptomTag === "NO_SLEEP");
    if (hasSleepIssue) {
      reminders.push({
        id: "rem-sleep-03",
        type: "ROUTINE",
        priority: "MEDIUM",
        title: "Higiene del Sueño",
        description:
          "Mateo no descansó bien anoche. Es aconsejable evitar pantallas luminosas dos horas antes de dormir y mantener luces ámbar.",
        actionText: "Ajustar ambiente",
        createdAt: new Date().toISOString(),
      });
    }

    // 3. Routine Activity reminder
    reminders.push({
      id: "rem-routine-04",
      type: "ROUTINE",
      priority: "MEDIUM",
      title: "Actividad y Caminata",
      description:
        "Hace días que Mateo no completa una caminata o paseo al aire libre. Sugiero dar una vuelta corta y tranquila hoy.",
      actionText: "Planear paseo",
      createdAt: new Date().toISOString(),
    });

    // 4. Hydration preventive rule
    reminders.push({
      id: "rem-hydra-05",
      type: "HYDRATION",
      priority: "NORMAL",
      title: "Hidratación Preventiva",
      description:
        "Ofrecer un vaso de agua fresca templada a media mañana para mantener la regulación fisiológica y el confort neurocognitivo.",
      actionText: "Ofrecer agua",
      createdAt: new Date().toISOString(),
    });

    return reminders;
  }
}
