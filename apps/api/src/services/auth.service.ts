import bcrypt from "bcryptjs";
import crypto from "crypto";
import { checkPrismaConnection, prisma, memoryStore } from "../db.js";
import { RegisterInput, LoginInput, AuthUserPayload, Role } from "../types/index.js";

// Helper for generating IDs when fallback is active
function generateId(prefix: string) {
  return `${prefix}-${crypto.randomUUID().substring(0, 8)}`;
}

export class AuthService {
  /**
   * Register a new user with their role-specific profile
   */
  static async register(input: RegisterInput): Promise<{
    user: AuthUserPayload;
  }> {
    const isDbConnected = await checkPrismaConnection();

    if (isDbConnected) {
      const existingUser = await prisma.user.findUnique({
        where: { email: input.email.toLowerCase() },
      });

      if (existingUser) {
        throw new Error("El correo electrónico ya está registrado");
      }

      const passwordHash = await bcrypt.hash(input.password, 10);

      // Create user and profile in a transaction
      const newUser = await prisma.user.create({
        data: {
          email: input.email.toLowerCase(),
          passwordHash,
          role: input.role,
          ...(input.role === "PATIENT"
            ? {
                patientProfile: {
                  create: {
                    fullName: input.fullName,
                    dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null,
                    emergencyContactPhone: input.emergencyContactPhone || null,
                  },
                },
              }
            : {}),
          ...(input.role === "CAREGIVER"
            ? {
                caregiverProfile: {
                  create: {
                    fullName: input.fullName,
                    relationToPatient: input.relationToPatient,
                    patientId: input.patientId || null,
                  },
                },
              }
            : {}),
          ...(input.role === "PROFESSIONAL"
            ? {
                professionalProfile: {
                  create: {
                    fullName: input.fullName,
                    licenseNumber: input.licenseNumber,
                    specialty: input.specialty,
                  },
                },
              }
            : {}),
        },
        include: {
          patientProfile: true,
          caregiverProfile: true,
          professionalProfile: true,
        },
      });

      const profileId =
        newUser.patientProfile?.id ||
        newUser.caregiverProfile?.id ||
        newUser.professionalProfile?.id;

      return {
        user: {
          id: newUser.id,
          email: newUser.email,
          role: newUser.role as Role,
          fullName: input.fullName,
          profileId,
        },
      };
    } else {
      // Fallback in-memory registration
      const existing = memoryStore.users.find(
        (u) => u.email.toLowerCase() === input.email.toLowerCase()
      );
      if (existing) {
        throw new Error("El correo electrónico ya está registrado");
      }

      const passwordHash = await bcrypt.hash(input.password, 10);
      const userId = generateId("usr");
      const profileId = generateId("prof");

      const newUser: any = {
        id: userId,
        email: input.email.toLowerCase(),
        passwordHash,
        role: input.role,
        createdAt: new Date(),
      };

      if (input.role === "PATIENT") {
        newUser.patientProfile = {
          id: profileId,
          userId,
          fullName: input.fullName,
          dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null,
          emergencyContactPhone: input.emergencyContactPhone || null,
        };
      } else if (input.role === "CAREGIVER") {
        newUser.caregiverProfile = {
          id: profileId,
          userId,
          fullName: input.fullName,
          relationToPatient: input.relationToPatient,
          patientId: input.patientId || null,
        };
      } else if (input.role === "PROFESSIONAL") {
        newUser.professionalProfile = {
          id: profileId,
          userId,
          fullName: input.fullName,
          licenseNumber: input.licenseNumber,
          specialty: input.specialty,
        };
      }

      memoryStore.users.push(newUser);

      return {
        user: {
          id: userId,
          email: newUser.email,
          role: newUser.role,
          fullName: input.fullName,
          profileId,
        },
      };
    }
  }

  /**
   * Login user with email and password
   */
  static async login(input: LoginInput): Promise<{
    user: AuthUserPayload;
  }> {
    const isDbConnected = await checkPrismaConnection();

    if (isDbConnected) {
      const user = await prisma.user.findUnique({
        where: { email: input.email.toLowerCase() },
        include: {
          patientProfile: true,
          caregiverProfile: true,
          professionalProfile: true,
        },
      });

      if (!user) {
        throw new Error("Credenciales inválidas. Comprueba el correo o la contraseña.");
      }

      const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);
      if (!isPasswordValid) {
        throw new Error("Credenciales inválidas. Comprueba el correo o la contraseña.");
      }

      const fullName =
        user.patientProfile?.fullName ||
        user.caregiverProfile?.fullName ||
        user.professionalProfile?.fullName ||
        user.email;

      const profileId =
        user.patientProfile?.id ||
        user.caregiverProfile?.id ||
        user.professionalProfile?.id;

      return {
        user: {
          id: user.id,
          email: user.email,
          role: user.role as Role,
          fullName,
          profileId,
        },
      };
    } else {
      // Fallback in-memory
      const user = memoryStore.users.find(
        (u) => u.email.toLowerCase() === input.email.toLowerCase()
      );

      if (!user) {
        throw new Error("Credenciales inválidas. Comprueba el correo o la contraseña.");
      }

      const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);
      if (!isPasswordValid) {
        throw new Error("Credenciales inválidas. Comprueba el correo o la contraseña.");
      }

      const fullName =
        user.patientProfile?.fullName ||
        user.caregiverProfile?.fullName ||
        user.professionalProfile?.fullName ||
        user.email;

      const profileId =
        user.patientProfile?.id ||
        user.caregiverProfile?.id ||
        user.professionalProfile?.id;

      return {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          fullName,
          profileId,
        },
      };
    }
  }

  /**
   * Get user details by ID
   */
  static async getUserById(userId: string): Promise<AuthUserPayload | null> {
    const isDbConnected = await checkPrismaConnection();

    if (isDbConnected) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          patientProfile: true,
          caregiverProfile: true,
          professionalProfile: true,
        },
      });

      if (!user) return null;

      const fullName =
        user.patientProfile?.fullName ||
        user.caregiverProfile?.fullName ||
        user.professionalProfile?.fullName ||
        user.email;

      const profileId =
        user.patientProfile?.id ||
        user.caregiverProfile?.id ||
        user.professionalProfile?.id;

      return {
        id: user.id,
        email: user.email,
        role: user.role as Role,
        fullName,
        profileId,
      };
    } else {
      const user = memoryStore.users.find((u) => u.id === userId);
      if (!user) return null;

      const fullName =
        user.patientProfile?.fullName ||
        user.caregiverProfile?.fullName ||
        user.professionalProfile?.fullName ||
        user.email;

      const profileId =
        user.patientProfile?.id ||
        user.caregiverProfile?.id ||
        user.professionalProfile?.id;

      return {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName,
        profileId,
      };
    }
  }
}
