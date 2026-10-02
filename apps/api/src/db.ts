import {
  prisma,
  Role,
  AlertStatus,
  MessageType,
  SymptomTag,
  EmotionalFirstAidTechnique,
} from "@eje/db";
import bcrypt from "bcryptjs";

// Check if Prisma database connection is available
let isPrismaAvailable: boolean | null = null;

export async function checkPrismaConnection(): Promise<boolean> {
  if (isPrismaAvailable !== null) return isPrismaAvailable;
  try {
    await prisma.$queryRaw`SELECT 1`;
    isPrismaAvailable = true;
    console.log("✅ [Database] Conectado exitosamente a PostgreSQL vía Prisma ORM.");
    return true;
  } catch (error) {
    isPrismaAvailable = false;
    console.warn(
      "⚠️ [Database] PostgreSQL no está disponible localmente (conexión rechazada o no iniciada). " +
      "Activando almacenamiento determinista en memoria para desarrollo local sin interrupciones."
    );
    return false;
  }
}

// In-memory fallback entities matching Prisma schema exactly
export interface MemoryUser {
  id: string;
  email: string;
  passwordHash: string;
  role: Role;
  createdAt: Date;
  patientProfile?: {
    id: string;
    userId: string;
    fullName: string;
    dateOfBirth?: Date | null;
    emergencyContactPhone?: string | null;
  };
  caregiverProfile?: {
    id: string;
    userId: string;
    fullName: string;
    relationToPatient: string;
    patientId?: string | null;
  };
  professionalProfile?: {
    id: string;
    userId: string;
    fullName: string;
    licenseNumber: string;
    specialty: string;
  };
}

export interface MemoryRoutineStep {
  id: string;
  routineId: string;
  order: number;
  instructionText: string;
  imageUrl?: string | null;
  audioUrl?: string | null;
}

export interface MemoryRoutine {
  id: string;
  title: string;
  patientId: string;
  isActive: boolean;
  createdAt: Date;
  steps: MemoryRoutineStep[];
}

export interface MemoryMedicationSchedule {
  id: string;
  patientId: string;
  timeOfDay: string;
  medicationName: string;
  dosage?: string | null;
  instructions?: string | null;
  prescribedBy?: string | null;
  frequency?: string | null;
  imageUrl?: string | null;
  createdAt: Date;
}

export interface MemoryMedicationLog {
  id: string;
  scheduleId: string;
  patientId: string;
  takenAt: Date;
  confirmedByDragAndDrop: boolean;
  createdAt: Date;
}

export interface MemoryCaregiverQuickLog {
  id: string;
  patientId: string;
  caregiverId: string;
  symptomTag: SymptomTag;
  notes?: string | null;
  createdAt: Date;
}

export interface MemoryInterventionGuide {
  id: string;
  triggerTag: SymptomTag;
  step1: string;
  step2: string;
  step3: string;
  audioGuideUrl?: string | null;
}

// Demo seeds for instant testing
const demoUsers: MemoryUser[] = [
  {
    id: "pat-demo-001",
    email: "paciente@eje.salud",
    passwordHash: bcrypt.hashSync("paciente123", 10),
    role: "PATIENT",
    createdAt: new Date(),
    patientProfile: {
      id: "prof-pat-001",
      userId: "pat-demo-001",
      fullName: "Mateo Silva",
      dateOfBirth: new Date("1998-05-14"),
      emergencyContactPhone: "+34 600 123 456",
    },
  },
  {
    id: "cg-demo-001",
    email: "cuidador@eje.salud",
    passwordHash: bcrypt.hashSync("cuidador123", 10),
    role: "CAREGIVER",
    createdAt: new Date(),
    caregiverProfile: {
      id: "prof-cg-001",
      userId: "cg-demo-001",
      fullName: "Elena Silva",
      relationToPatient: "Madre",
      patientId: "prof-pat-001",
    },
  },
  {
    id: "doc-demo-001",
    email: "clinica@eje.salud",
    passwordHash: bcrypt.hashSync("clinica123", 10),
    role: "PROFESSIONAL",
    createdAt: new Date(),
    professionalProfile: {
      id: "prof-doc-001",
      userId: "doc-demo-001",
      fullName: "Dra. Sofía Martínez",
      licenseNumber: "MED-ESP-29831",
      specialty: "Psiquiatría y Salud Neurocognitiva",
    },
  },
];

// Preloaded routines for active daily care (Rutina de Baño y Rutina de Desayuno)
const demoRoutines: MemoryRoutine[] = [
  {
    id: "rout-001",
    title: "Rutina de Baño",
    patientId: "prof-pat-001",
    isActive: true,
    createdAt: new Date(),
    steps: [
      {
        id: "step-101",
        routineId: "rout-001",
        order: 1,
        instructionText: "Abre la llave del agua tibia",
        imageUrl: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&auto=format&fit=crop&q=80",
        audioUrl: null,
      },
      {
        id: "step-102",
        routineId: "rout-001",
        order: 2,
        instructionText: "Entra con cuidado y moja tu cuerpo",
        imageUrl: "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=600&auto=format&fit=crop&q=80",
        audioUrl: null,
      },
      {
        id: "step-103",
        routineId: "rout-001",
        order: 3,
        instructionText: "Pasa el jabón por tus brazos y piernas",
        imageUrl: "https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?w=600&auto=format&fit=crop&q=80",
        audioUrl: null,
      },
      {
        id: "step-104",
        routineId: "rout-001",
        order: 4,
        instructionText: "Enjuágate con abundante agua",
        imageUrl: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&auto=format&fit=crop&q=80",
        audioUrl: null,
      },
      {
        id: "step-105",
        routineId: "rout-001",
        order: 5,
        instructionText: "Cierra la llave y sécate con la toalla suave",
        imageUrl: "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=600&auto=format&fit=crop&q=80",
        audioUrl: null,
      },
    ],
  },
  {
    id: "rout-002",
    title: "Rutina de Desayuno",
    patientId: "prof-pat-001",
    isActive: true,
    createdAt: new Date(),
    steps: [
      {
        id: "step-201",
        routineId: "rout-002",
        order: 1,
        instructionText: "Siéntate en tu silla favorita de la cocina",
        imageUrl: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600&auto=format&fit=crop&q=80",
        audioUrl: null,
      },
      {
        id: "step-202",
        routineId: "rout-002",
        order: 2,
        instructionText: "Toma tu vaso de agua o leche",
        imageUrl: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&auto=format&fit=crop&q=80",
        audioUrl: null,
      },
      {
        id: "step-203",
        routineId: "rout-002",
        order: 3,
        instructionText: "Come tu fruta o tostada despacio",
        imageUrl: "https://images.unsplash.com/photo-1494390248081-4e521a5940db?w=600&auto=format&fit=crop&q=80",
        audioUrl: null,
      },
    ],
  },
];

// Preloaded Medication Schedules
const demoSchedules: MemoryMedicationSchedule[] = [
  {
    id: "sched-001",
    patientId: "prof-pat-001",
    timeOfDay: "08:30",
    medicationName: "Risperidona 1mg",
    dosage: "1 comprimido (1mg)",
    frequency: "Diario (Con el desayuno)",
    instructions: "Dar con abundante agua tras ingerir alimentos sólidos. Vigilar somnolencia excesiva o marcha inestable durante las mañanas.",
    prescribedBy: "Dra. Sofía Martínez",
    imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80",
    createdAt: new Date(),
  },
  {
    id: "sched-002",
    patientId: "prof-pat-001",
    timeOfDay: "20:00",
    medicationName: "Sertralina 50mg",
    dosage: "1 cápsula (50mg)",
    frequency: "Diario (Con la cena)",
    instructions: "Tomar durante o inmediatamente después de la cena para evitar molestias gástricas. Regula el estado de ánimo y descanso nocturno.",
    prescribedBy: "Dra. Sofía Martínez",
    imageUrl: "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=600&auto=format&fit=crop&q=80",
    createdAt: new Date(),
  },
];

// Preloaded Intervention Guides (Evidence-based practical action cards)
const demoGuides: MemoryInterventionGuide[] = [
  {
    id: "guide-agit",
    triggerTag: "AGITATION",
    step1: "No hagas preguntas abiertas ni discutas. Mantén el espacio despejado.",
    step2: "Baja el tono y ritmo de tu voz; usa frases cortas de máximo 4 palabras.",
    step3: "Ofrece un vaso de agua fresca con sorbete y reduce luces y sonidos.",
    audioGuideUrl: null,
  },
  {
    id: "guide-sleep",
    triggerTag: "NO_SLEEP",
    step1: "Mantén luces tenues y cálidas. No enciendas pantallas ni televisores.",
    step2: "No fuerces permanecer en la cama; acompaña a un asiento cómodo con manta.",
    step3: "Pon música rítmica suave o activa la sesión de respiración guiada.",
    audioGuideUrl: null,
  },
  {
    id: "guide-food",
    triggerTag: "FOOD_REFUSAL",
    step1: "No presiones para terminar todo el plato ni insistas verbalmente.",
    step2: "Presenta solo un alimento a la vez en porciones pequeñas y temperatura templada.",
    step3: "Permite comer con la mano si los cubiertos causan molestia o confusión motriz.",
    audioGuideUrl: null,
  },
  {
    id: "guide-halluc",
    triggerTag: "HALLUCINATION",
    step1: "No confirmes ni niegues lo que ve o escucha; valida la emoción: 'Entiendo que esto te asuste'.",
    step2: "Transmite calma física: ponte a su altura, ofrece tu mano y respira lento.",
    step3: "Redirige suavemente la atención a una actividad táctil o sensorial conocida.",
    audioGuideUrl: null,
  },
];

export const memoryStore = {
  users: demoUsers,
  routines: demoRoutines,
  medicationSchedules: demoSchedules,
  medicationLogs: [] as MemoryMedicationLog[],
  caregiverQuickLogs: [] as MemoryCaregiverQuickLog[],
  interventionGuides: demoGuides,
};

export { prisma };
