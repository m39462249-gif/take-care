import crypto from "crypto";
import { Server as SocketIOServer } from "socket.io";
import {
  checkPrismaConnection,
  prisma,
  memoryStore,
  MemoryMedicationLog,
  MemoryMedicationSchedule,
} from "../db.js";

export class MedicationService {
  /**
   * Get medication schedules for a patient
   */
  static async getSchedules(patientId?: string): Promise<any[]> {
    const isDb = await checkPrismaConnection();

    if (isDb) {
      const whereClause = patientId ? { patientId } : {};
      const schedules = await prisma.medicationSchedule.findMany({
        where: whereClause,
        include: {
          logs: {
            orderBy: { takenAt: "desc" },
            take: 5,
          },
        },
        orderBy: { timeOfDay: "asc" },
      });

      if (schedules.length === 0) {
        return memoryStore.medicationSchedules.map((s) => ({
          ...s,
          logs: memoryStore.medicationLogs
            .filter((l) => l.scheduleId === s.id)
            .sort((a, b) => b.takenAt.getTime() - a.takenAt.getTime()),
        }));
      }
      return schedules;
    } else {
      let schedules = memoryStore.medicationSchedules;
      if (patientId) {
        const patientSchedules = schedules.filter((s) => s.patientId === patientId);
        if (patientSchedules.length > 0) schedules = patientSchedules;
      }
      return schedules.map((s) => ({
        ...s,
        logs: memoryStore.medicationLogs
          .filter((l) => l.scheduleId === s.id)
          .sort((a, b) => b.takenAt.getTime() - a.takenAt.getTime()),
      }));
    }
  }

  /**
   * Create a medication schedule / prescription
   */
  static async createSchedule(
    data: {
      patientId: string;
      timeOfDay: string;
      medicationName: string;
      dosage?: string | null;
      instructions?: string | null;
      prescribedBy?: string | null;
      frequency?: string | null;
      imageUrl?: string | null;
    },
    io?: SocketIOServer
  ): Promise<any> {
    const isDb = await checkPrismaConnection();
    let createdSchedule: any;

    if (isDb) {
      createdSchedule = await prisma.medicationSchedule.create({
        data: {
          patientId: data.patientId,
          timeOfDay: data.timeOfDay,
          medicationName: data.medicationName,
          dosage: data.dosage || null,
          instructions: data.instructions || null,
          prescribedBy: data.prescribedBy || null,
          frequency: data.frequency || null,
          imageUrl: data.imageUrl || null,
        },
        include: {
          logs: true,
        },
      });
    } else {
      const newSchedule: MemoryMedicationSchedule = {
        id: `sched-${crypto.randomUUID().substring(0, 8)}`,
        patientId: data.patientId,
        timeOfDay: data.timeOfDay,
        medicationName: data.medicationName,
        dosage: data.dosage || null,
        instructions: data.instructions || null,
        prescribedBy: data.prescribedBy || null,
        frequency: data.frequency || null,
        imageUrl: data.imageUrl || null,
        createdAt: new Date(),
      };
      memoryStore.medicationSchedules.push(newSchedule);
      createdSchedule = { ...newSchedule, logs: [] };
    }

    // Real-time broadcast to caregiver
    if (io) {
      const payload = {
        type: "MEDICATION_PRESCRIBED",
        schedule: createdSchedule,
        patientId: data.patientId,
        medicationName: data.medicationName,
        dosage: data.dosage,
        timeOfDay: data.timeOfDay,
        instructions: data.instructions,
        prescribedBy: data.prescribedBy || "Dra. Sofía Martínez",
        message: `🩺 El doctor ha indicado una nueva pauta médica: ${data.medicationName}${
          data.dosage ? ` (${data.dosage})` : ""
        } a las ${data.timeOfDay}.`,
        timestamp: new Date().toISOString(),
      };
      io.to(`caregiver-${data.patientId}`).emit("medication:prescribed", payload);
      io.to("caregiver-room").emit("medication:prescribed", payload);
      io.emit("medication:prescribed", payload);
      console.log(`🩺 [Socket.io] Nueva prescripción emitida al cuidador: ${payload.message}`);
    }

    return createdSchedule;
  }

  /**
   * Delete / Suspend a medication schedule
   */
  static async deleteSchedule(scheduleId: string, io?: SocketIOServer): Promise<boolean> {
    const isDb = await checkPrismaConnection();
    let deleted = false;
    let patientId: string | null = null;
    let medName: string = "Medicación";

    if (isDb) {
      try {
        const existing = await prisma.medicationSchedule.findUnique({ where: { id: scheduleId } });
        if (existing) {
          patientId = existing.patientId;
          medName = existing.medicationName;
          await prisma.medicationSchedule.delete({ where: { id: scheduleId } });
          deleted = true;
        }
      } catch (e) {
        console.error("Error deleting schedule in prisma:", e);
      }
    } else {
      const index = memoryStore.medicationSchedules.findIndex((s) => s.id === scheduleId);
      if (index !== -1) {
        patientId = memoryStore.medicationSchedules[index].patientId;
        medName = memoryStore.medicationSchedules[index].medicationName;
        memoryStore.medicationSchedules.splice(index, 1);
        deleted = true;
      }
    }

    if (deleted && io && patientId) {
      const payload = {
        type: "MEDICATION_DELETED",
        scheduleId,
        patientId,
        medicationName: medName,
        message: `La pauta de ${medName} ha sido retirada o suspendida por el doctor.`,
        timestamp: new Date().toISOString(),
      };
      io.to(`caregiver-${patientId}`).emit("medication:deleted", payload);
      io.to("caregiver-room").emit("medication:deleted", payload);
      io.emit("medication:deleted", payload);
      console.log(`🗑️ [Socket.io] Pauta suspendida notificada al cuidador: ${medName}`);
    }

    return deleted;
  }

  /**
   * Register a medication intake log (MedicationLog)
   * If isMissedTimeout is true or confirmedByDragAndDrop is false, triggers Socket.io notification to caregiver
   */
  static async logMedication(
    data: {
      scheduleId: string;
      patientId: string;
      takenAt?: string;
      confirmedByDragAndDrop: boolean;
      isMissedTimeout?: boolean;
    },
    io?: SocketIOServer
  ): Promise<{ log: any; alertEmitted: boolean }> {
    const isDb = await checkPrismaConnection();
    const takenDate = data.takenAt ? new Date(data.takenAt) : new Date();

    let createdLog: any;
    let scheduleInfo: any = null;

    if (isDb) {
      createdLog = await prisma.medicationLog.create({
        data: {
          scheduleId: data.scheduleId,
          patientId: data.patientId,
          takenAt: takenDate,
          confirmedByDragAndDrop: data.confirmedByDragAndDrop,
        },
        include: {
          schedule: true,
          patient: true,
        },
      });
      scheduleInfo = createdLog.schedule;
    } else {
      const logId = `medlog-${crypto.randomUUID().substring(0, 8)}`;
      createdLog = {
        id: logId,
        scheduleId: data.scheduleId,
        patientId: data.patientId,
        takenAt: takenDate,
        confirmedByDragAndDrop: data.confirmedByDragAndDrop,
        createdAt: new Date(),
      };
      memoryStore.medicationLogs.push(createdLog);
      scheduleInfo = memoryStore.medicationSchedules.find((s) => s.id === data.scheduleId);
    }

    let alertEmitted = false;

    // Check if missed (either explicit isMissedTimeout or not confirmed)
    if (data.isMissedTimeout || !data.confirmedByDragAndDrop) {
      alertEmitted = true;
      if (io) {
        const payload = {
          type: "MEDICATION_MISSED_ALERT",
          severity: "HIGH",
          patientId: data.patientId,
          scheduleId: data.scheduleId,
          medicationName: scheduleInfo?.medicationName || "Medicación programada",
          scheduledTime: scheduleInfo?.timeOfDay || "Hora pautada",
          minutesOverdue: 30,
          timestamp: new Date().toISOString(),
          message: `⚠️ Alerta de Medicación: El paciente no ha confirmado la toma de ${
            scheduleInfo?.medicationName || "su medicina"
          } tras 30 minutos de la hora programada.`,
        };

        // Notify specific rooms and global broadcast
        io.to(`caregiver-${data.patientId}`).emit("medication-missed-alert", payload);
        io.to("caregiver-room").emit("medication-missed-alert", payload);
        io.emit("medication-missed-alert", payload);
        console.log(`🚨 [Socket.io] Alerta de toma fallida emitida para el cuidador: ${payload.message}`);
      }
    } else {
      // Confirmed successfully by Drag & Drop
      if (io) {
        const successPayload = {
          type: "MEDICATION_TAKEN_CONFIRMED",
          patientId: data.patientId,
          scheduleId: data.scheduleId,
          medicationName: scheduleInfo?.medicationName,
          takenAt: takenDate.toISOString(),
          confirmedByDragAndDrop: true,
        };
        io.to(`caregiver-${data.patientId}`).emit("medication-confirmed", successPayload);
        io.to("caregiver-room").emit("medication-confirmed", successPayload);
        io.emit("medication-confirmed", successPayload);
        io.emit("medication:taken", successPayload);
        io.to("caregiver-room").emit("medication:taken", successPayload);
        console.log(`✅ [Socket.io] Evento medication:taken emitido al cuidador.`);
      }
    }

    return { log: createdLog, alertEmitted };
  }

  /**
   * Get all medication logs
   */
  static async getLogs(patientId?: string): Promise<any[]> {
    const isDb = await checkPrismaConnection();

    if (isDb) {
      const whereClause = patientId ? { patientId } : {};
      return prisma.medicationLog.findMany({
        where: whereClause,
        include: {
          schedule: true,
        },
        orderBy: { takenAt: "desc" },
      });
    } else {
      let logs = memoryStore.medicationLogs;
      if (patientId) {
        logs = logs.filter((l) => l.patientId === patientId);
      }
      return logs;
    }
  }
}
