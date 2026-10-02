import { FastifyInstance, FastifyPluginAsync } from "fastify";
import { RegisterSchema, LoginSchema } from "../types/index.js";
import { AuthService } from "../services/auth.service.js";

export const authRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Register route
  fastify.post("/register", async (request, reply) => {
    try {
      const parsedBody = RegisterSchema.safeParse(request.body);
      if (!parsedBody.success) {
        return reply.status(400).send({
          success: false,
          message: "Datos de registro inválidos",
          errors: parsedBody.error.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        });
      }

      const { user } = await AuthService.register(parsedBody.data);
      const token = fastify.jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role,
          fullName: user.fullName,
        },
        { expiresIn: "7d" }
      );

      return reply.status(201).send({
        success: true,
        message: "Registro exitoso",
        data: {
          user,
          token,
        },
      });
    } catch (error: any) {
      request.log.error(error);
      return reply.status(400).send({
        success: false,
        message: error.message || "Error al procesar el registro",
      });
    }
  });

  // Login route
  fastify.post("/login", async (request, reply) => {
    try {
      const parsedBody = LoginSchema.safeParse(request.body);
      if (!parsedBody.success) {
        return reply.status(400).send({
          success: false,
          message: "Credenciales inválidas",
          errors: parsedBody.error.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        });
      }

      const { user } = await AuthService.login(parsedBody.data);
      const token = fastify.jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role,
          fullName: user.fullName,
        },
        { expiresIn: "7d" }
      );

      return reply.send({
        success: true,
        message: "Inicio de sesión exitoso",
        data: {
          user,
          token,
        },
      });
    } catch (error: any) {
      request.log.error(error);
      return reply.status(401).send({
        success: false,
        message: error.message || "Credenciales incorrectas",
      });
    }
  });

  // Get current user (me)
  fastify.get("/me", async (request, reply) => {
    try {
      await request.jwtVerify();
      const decodedUser = request.user as { id: string };
      const user = await AuthService.getUserById(decodedUser.id);

      if (!user) {
        return reply.status(404).send({
          success: false,
          message: "Usuario no encontrado",
        });
      }

      return reply.send({
        success: true,
        data: { user },
      });
    } catch (err) {
      return reply.status(401).send({
        success: false,
        message: "Sesión no válida o expirada",
      });
    }
  });
};
