import { prisma, Role, SymptomTag } from "./index.js";
import bcrypt from "bcryptjs";

export async function seed() {
  console.log("🌱 [Seed] Verificando e inicializando datos semilla en PostgreSQL...");

  // Check if users already exist
  const count = await prisma.user.count();
  if (count > 0) {
    console.log(`ℹ️ [Seed] Ya existen ${count} usuarios en la base de datos. Omitiendo seed.`);
    return;
  }

  // 1. Patient user
  const patientPassword = await bcrypt.hash("paciente123", 10);
  const patient = await prisma.user.create({
    data: {
      email: "paciente@eje.salud",
      passwordHash: patientPassword,
      role: Role.PATIENT,
      patientProfile: {
        create: {
          fullName: "Mateo Silva",
          dateOfBirth: new Date("1998-05-14"),
          emergencyContactPhone: "+34 600 123 456",
        },
      },
    },
    include: {
      patientProfile: true,
    },
  });

  const patientProfileId = patient.patientProfile!.id;

  // 2. Caregiver user
  const caregiverPassword = await bcrypt.hash("cuidador123", 10);
  await prisma.user.create({
    data: {
      email: "cuidador@eje.salud",
      passwordHash: caregiverPassword,
      role: Role.CAREGIVER,
      caregiverProfile: {
        create: {
          fullName: "Elena Silva",
          relationToPatient: "Madre",
          patientId: patientProfileId,
        },
      },
    },
  });

  // 3. Professional user
  const docPassword = await bcrypt.hash("clinica123", 10);
  await prisma.user.create({
    data: {
      email: "clinica@eje.salud",
      passwordHash: docPassword,
      role: Role.PROFESSIONAL,
      professionalProfile: {
        create: {
          fullName: "Dra. Sofía Martínez",
          licenseNumber: "MED-ESP-29831",
          specialty: "Psiquiatría y Salud Neurocognitiva",
        },
      },
    },
  });

  // 4. Medication Schedules
  await prisma.medicationSchedule.createMany({
    data: [
      {
        patientId: patientProfileId,
        timeOfDay: "08:30",
        medicationName: "Risperidona 1mg",
        dosage: "1 comprimido (1mg)",
        frequency: "Diario (Con el desayuno)",
        instructions: "Dar con abundante agua tras ingerir alimentos sólidos. Vigilar somnolencia excesiva o marcha inestable durante las mañanas.",
        prescribedBy: "Dra. Sofía Martínez",
        imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80",
      },
      {
        patientId: patientProfileId,
        timeOfDay: "20:00",
        medicationName: "Sertralina 50mg",
        dosage: "1 cápsula (50mg)",
        frequency: "Diario (Con la cena)",
        instructions: "Tomar durante o inmediatamente después de la cena para evitar molestias gástricas. Regula el estado de ánimo y descanso nocturno.",
        prescribedBy: "Dra. Sofía Martínez",
        imageUrl: "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=600&auto=format&fit=crop&q=80",
      },
    ],
  });

  // 5. Intervention Guides
  await prisma.interventionGuide.createMany({
    data: [
      {
        triggerTag: SymptomTag.AGITATION,
        step1: "No hagas preguntas abiertas ni discutas. Mantén el espacio despejado.",
        step2: "Baja el tono y ritmo de tu voz; usa frases cortas de máximo 4 palabras.",
        step3: "Ofrece un vaso de agua fresca con sorbete y reduce luces y sonidos.",
      },
      {
        triggerTag: SymptomTag.NO_SLEEP,
        step1: "Mantén luces tenues y cálidas. No enciendas pantallas ni televisores.",
        step2: "No fuerces permanecer en la cama; acompaña a un asiento cómodo con manta.",
        step3: "Pon música rítmica suave o activa la sesión de respiración guiada.",
      },
      {
        triggerTag: SymptomTag.FOOD_REFUSAL,
        step1: "No presiones para terminar todo el plato ni insistas verbalmente.",
        step2: "Presenta solo un alimento a la vez en porciones pequeñas y temperatura templada.",
        step3: "Permite comer con la mano si los cubiertos causan molestia o confusión motriz.",
      },
      {
        triggerTag: SymptomTag.HALLUCINATION,
        step1: "No confirmes ni niegues lo que ve o escucha; valida la emoción: 'Entiendo que esto te asuste'.",
        step2: "Transmite calma física: ponte a su altura, ofrece tu mano y respira lento.",
        step3: "Redirige suavemente la atención a una actividad táctil o sensorial conocida.",
      },
    ],
  });

  console.log("✅ [Seed] Base de datos PostgreSQL inicializada exitosamente con usuarios y datos demo.");
}

if (process.argv[1]?.includes("seed")) {
  seed()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
