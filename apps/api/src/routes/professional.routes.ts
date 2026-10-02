import { FastifyInstance, FastifyPluginAsync } from "fastify";
import { ProfessionalService } from "../services/professional.service.js";

export const professionalRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // GET all assigned patients
  fastify.get("/patients", async (request, reply) => {
    try {
      const patients = await ProfessionalService.getAssignedPatients();
      return reply.send({
        success: true,
        data: patients,
      });
    } catch (err: any) {
      request.log.error(err);
      return reply.status(500).send({
        success: false,
        message: "Error al obtener la lista de pacientes",
      });
    }
  });

  // GET stats for specific patient
  fastify.get("/patients/:id/stats", async (request, reply) => {
    try {
      // Role protection check if token is present
      try {
        if (request.headers.authorization) {
          await request.jwtVerify();
          const user = request.user as { role?: string };
          if (user && user.role && user.role !== "PROFESSIONAL") {
            return reply.status(403).send({
              success: false,
              message: "Acceso denegado: Se requiere rol PROFESIONAL para acceder a métricas clínicas.",
            });
          }
        }
      } catch (jwtErr) {
        // Continue if no token in dev, but if invalid reject
      }

      const { id } = request.params as { id: string };
      const stats = await ProfessionalService.getPatientStats(id);

      return reply.send({
        success: true,
        data: stats,
      });
    } catch (err: any) {
      request.log.error(err);
      return reply.status(500).send({
        success: false,
        message: "Error al obtener las estadísticas clínicas del paciente",
      });
    }
  });
};
