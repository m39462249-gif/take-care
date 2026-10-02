import { FastifyInstance, FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { memoryStore } from "../db.js";
import { ProfessionalService } from "../services/professional.service.js";

const MessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().min(1, "El mensaje no puede estar vacío"),
});

const ChatRequestSchema = z.object({
  messages: z.array(MessageSchema),
  patientId: z.string().optional(),
  model: z.string().optional(),
  includePatientContext: z.boolean().optional().default(true),
});

const ClinicalEvolutionSchema = z.object({
  patientId: z.string().default("prof-pat-001"),
  timeframe: z.enum(["7d", "15d", "30d"]).default("30d"),
  format: z.enum(["soap", "narrative", "family"]).default("soap"),
  doctorObservations: z.string().optional(),
  model: z.string().optional().default("openrouter/auto"),
});

export const aiRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Check AI health / status
  fastify.get("/status", async (_request, reply) => {
    const hasKey = Boolean(process.env.OPENROUTER_API_KEY);
    return reply.send({
      success: true,
      service: "OpenRouter AI Assistant",
      configured: hasKey,
      defaultModel: "openrouter/auto",
    });
  });

  // POST /api/ai/chat
  fastify.post("/chat", async (request, reply) => {
    try {
      const apiKey = process.env.OPENROUTER_API_KEY;
      if (!apiKey) {
        return reply.status(500).send({
          success: false,
          message: "OPENROUTER_API_KEY no está configurada en el servidor.",
        });
      }

      const parsed = ChatRequestSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          message: "Parámetros de conversación inválidos",
          errors: parsed.error.errors,
        });
      }

      const { messages, model = "openrouter/auto", includePatientContext } = parsed.data;

      // Build clinical context if requested
      let clinicalContext = "";
      if (includePatientContext) {
        const recentLogs = memoryStore.caregiverQuickLogs
          .slice(-3)
          .map(
            (l) =>
              `- [${new Date(l.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}] Síntoma: ${l.symptomTag} ${l.notes ? `(Nota: ${l.notes})` : ""}`
          )
          .join("\n");

        const schedules = memoryStore.medicationSchedules
          .map((s) => `- ${s.medicationName} (${s.dosage}): ${s.timeOfDay} - ${s.frequency}`)
          .join("\n");

        clinicalContext = `
CONTEXTO CLÍNICO DEL PACIENTE ACTIVO:
- Paciente: Mateo Silva (26 años)
- Cuidadora principal: Elena Silva (Madre)
- Médico tratante: Dra. Sofía Martínez (Psiquiatría y Salud Neurocognitiva)
- Medicación programada actual:
${schedules || "- Risperidona 1mg (08:30 desayuno)\n- Sertralina 50mg (20:00 cena)"}
- Registros recientes de bitácora hoy:
${recentLogs || "- Sin incidencias críticas registradas en las últimas horas."}
`;
      }

      const systemPrompt = `
Eres el "Copiloto IA Especializado en Cuidado y Salud Mental" de la plataforma Eje / Ritmo.
Tu rol es asistir con rigor clínico, empatía y orientación práctica a cuidadores familiares y profesionales que atienden a personas con trastornos cognitivos, demencia, TEA o afecciones psiquiátricas complejas.

${clinicalContext}

DIRECTRICES CLAVE:
1. TONO: Cálido, empático, profesional y tranquilizador. Sé directo y evita lenguaje técnico innecesario.
2. ESTRUCTURA: Para consultas sobre crisis, agitación, alucinaciones o rechazo, provee un plan de acción concreto en 3 pasos breves ("Paso 1: Ambiente...", "Paso 2: Comunicación...", "Paso 3: Redirección...").
3. DESESCALADA NO CONFRONTATIVA: Promueve la validación emocional ("Entiendo que sientas miedo/molestia"), postura corporal relajada, no discutir ni forzar argumentos lógicos.
4. FARMACOLOGÍA Y EFECTOS SECUNDARIOS: Si preguntan sobre la Risperidona o Sertralina de Mateo, orienta sobre qué es esperable (ej. somnolencia matutina leve, náusea pasajera) y qué signos exigen contactar a la Dra. Sofía Martínez o acudir a urgencias. Nunca indiques cambiar la dosis por cuenta propia.
5. CUIDADO DEL CUIDADOR: Valida la sobrecarga emocional y física del cuidador; ofrece pequeñas pausas y pautas de autocuidado si detectas angustia.
`.trim();

      // Format messages payload for OpenRouter
      const payloadMessages = [
        { role: "system", content: systemPrompt },
        ...messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      ];

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:5173",
          "X-Title": "Eje - Plataforma de Cuidado Cognitivo",
        },
        body: JSON.stringify({
          model,
          messages: payloadMessages,
          temperature: 0.6,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        request.log.error(`OpenRouter error response: ${errorText}`);
        return reply.status(response.status).send({
          success: false,
          message: `Error de OpenRouter (${response.status})`,
          detail: errorText,
        });
      }

      const data: any = await response.json();
      const choice = data.choices?.[0];

      if (!choice || !choice.message) {
        return reply.status(502).send({
          success: false,
          message: "No se recibió respuesta válida del modelo de IA.",
        });
      }

      return reply.send({
        success: true,
        message: {
          role: "assistant",
          content: choice.message.content || "",
        },
        model: data.model || model,
        usage: data.usage,
      });
    } catch (err: any) {
      request.log.error(err);
      return reply.status(500).send({
        success: false,
        message: "Error interno al comunicarse con el asistente IA",
        error: err.message,
      });
    }
  });

  // POST /api/ai/clinical-evolution
  fastify.post("/clinical-evolution", async (request, reply) => {
    try {
      const apiKey = process.env.OPENROUTER_API_KEY;
      if (!apiKey) {
        return reply.status(500).send({
          success: false,
          message: "OPENROUTER_API_KEY no está configurada en el servidor.",
        });
      }

      const parsed = ClinicalEvolutionSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          message: "Parámetros de evolución clínica inválidos",
          errors: parsed.error.errors,
        });
      }

      const { patientId, timeframe, format, doctorObservations, model } = parsed.data;

      // 1. Fetch patient stats and current meds
      const stats = await ProfessionalService.getPatientStats(patientId);
      const schedules = memoryStore.medicationSchedules.filter(
        (s) => s.patientId === patientId || s.patientId === "prof-pat-001"
      );

      const timeframeLabel =
        timeframe === "7d"
          ? "últimos 7 días (semana actual)"
          : timeframe === "15d"
          ? "últimos 15 días (quincena)"
          : "últimos 30 días (mes en curso)";

      // Format description for prompt
      let formatInstructions = "";
      if (format === "soap") {
        formatInstructions = `
Redacta el informe estrictamente en FORMATO SOAP CLÍNICO, con estas secciones exactas usando títulos claros:
### [S] SUBJETIVO (Reporte de Cuidadora y Anamnesis)
- Estado general referido por Elena Silva (cuidadora).
- Calidad subjetiva de descanso, apetito y conducta.

### [O] OBJETIVO (Telemetría, Medicación y Métricas Registradas)
- Tasa de adherencia farmacológica con números concretos (${stats.adherence.overallPercentage}%).
- Registro específico de síntomas conductuales (${stats.symptoms.totalReports} eventos: ${stats.symptoms.counts.AGITATION} agitación, ${stats.symptoms.counts.NO_SLEEP} insomnio, etc.).
- Uso de herramientas de autorregulación (${stats.firstAidUsage.totalSessions} sesiones de Modo Calma).

### [A] APRECIACIÓN / ANÁLISIS MÉDICO
- Correlación clínica entre la pauta farmacológica (Risperidona + Sertralina) y la respuesta conductual del paciente.
- Valoración de estabilidad o signos de alarma.

### [P] PLAN TERAPÉUTICO SUGERIDO
- Pautas de manejo no farmacológico para el hogar.
- Indicaciones de ajuste o continuidad de medicación.
- Próxima fecha de control médico.
        `;
      } else if (format === "narrative") {
        formatInstructions = `
Redacta una NOTA DE EVOLUCIÓN NARRATIVA FORMAL, densa y profesional, estructurada en 2 o 3 párrafos compactos listos para copiar y pegar directamente en la Historia Clínica Electrónica (EMR) de un hospital o clínica psiquiátrica.
        `;
      } else {
        formatInstructions = `
Redacta un INFORME EXPLICATIVO PARA LA FAMILIA Y CUIDADORES:
- Lenguaje cálido, empático, claro y sin jerga médica incomprensible.
- Destaca los progresos y aspectos positivos logrados en este período.
- Explica de forma sencilla por qué la adherencia a la medicación ha sido clave.
- Provee 3 recomendaciones prácticas claras para el día a día en casa.
        `;
      }

      const prompt = `
Actúa como un médico psiquiatra y neurocognitivo de alta experiencia elaborando el RESUMEN DE EVOLUCIÓN CLÍNICA oficial para el paciente.

DATOS OBJETIVOS DEL PACIENTE Y PERÍODO:
- Paciente: ${stats.patient.fullName}, ${stats.patient.age} años.
- Cuidadora principal: ${stats.patient.caregiverName} (${stats.patient.caregiverRelation}).
- Período evaluado: ${timeframeLabel}.
- Adherencia farmacológica global: ${stats.adherence.overallPercentage}% (${stats.adherence.totalTaken} tomas confirmadas de ${stats.adherence.totalScheduled} pautadas).
- Medicación actual activa:
${schedules.map((s) => `  * ${s.medicationName} (${s.dosage}): ${s.timeOfDay} - ${s.frequency} (Prescrito por: ${s.prescribedBy || "Dra. Sofía Martínez"})`).join("\n")}
- Bitácora de síntomas reportados:
  * Agitación/Irritabilidad: ${stats.symptoms.counts.AGITATION} episodios
  * Despertares/Insomnio: ${stats.symptoms.counts.NO_SLEEP} noches
  * Rechazo de alimentos: ${stats.symptoms.counts.FOOD_REFUSAL} ocasiones
  * Alucinaciones: ${stats.symptoms.counts.HALLUCINATION} episodios
- Sesiones de contención / Modo Calma: ${stats.firstAidUsage.totalSessions} sesiones (Respiración: ${stats.firstAidUsage.techniqueCounts.BREATHING}, Música: ${stats.firstAidUsage.techniqueCounts.MUSIC}, Fotos: ${stats.firstAidUsage.techniqueCounts.PHOTOS})
- Eventos de bitácora recientes:
${stats.timeline.map((t) => `  * [${t.timestamp}] ${t.title}: ${t.detail}`).join("\n")}
${doctorObservations ? `- Observaciones presenciales añadidas por el médico tratante:\n  "${doctorObservations}"` : ""}

INSTRUCCIONES DE FORMATO:
${formatInstructions}
      `.trim();

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:5173",
          "X-Title": "Eje - Resumen de Evolución Clínica IA",
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "system",
              content:
                "Eres un especialista en psiquiatría y neurocognición redactando evoluciones médicas de alta precisión, coherencia clínica y fundamentadas en datos reales.",
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.3,
          max_tokens: 1500,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        return reply.status(response.status).send({
          success: false,
          message: `Error al generar evolución con OpenRouter (${response.status})`,
          detail: errText,
        });
      }

      const data: any = await response.json();
      const content = data.choices?.[0]?.message?.content || "";

      return reply.send({
        success: true,
        summary: {
          patientId,
          patientName: stats.patient.fullName,
          timeframe,
          timeframeLabel,
          format,
          content,
          generatedAt: new Date().toISOString(),
        },
        stats,
        model: data.model || model,
        usage: data.usage,
      });
    } catch (err: any) {
      request.log.error(err);
      return reply.status(500).send({
        success: false,
        message: "Error interno al generar el resumen de evolución médica",
        error: err.message,
      });
    }
  });
};
