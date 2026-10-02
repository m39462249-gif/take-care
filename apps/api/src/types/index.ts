import { z } from "zod";

export const RoleEnum = z.enum(["PATIENT", "CAREGIVER", "PROFESSIONAL"]);
export type Role = z.infer<typeof RoleEnum>;

// Register schemas depending on role
export const RegisterPatientSchema = z.object({
  email: z.string().email("Correo electrónico no válido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  role: z.literal("PATIENT"),
  fullName: z.string().min(2, "El nombre completo es requerido"),
  dateOfBirth: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
});

export const RegisterCaregiverSchema = z.object({
  email: z.string().email("Correo electrónico no válido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  role: z.literal("CAREGIVER"),
  fullName: z.string().min(2, "El nombre completo es requerido"),
  relationToPatient: z.string().min(2, "Indica el parentesco o relación con el paciente"),
  patientId: z.string().optional(),
});

export const RegisterProfessionalSchema = z.object({
  email: z.string().email("Correo electrónico no válido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  role: z.literal("PROFESSIONAL"),
  fullName: z.string().min(2, "El nombre completo es requerido"),
  licenseNumber: z.string().min(3, "Número de colegiatura o matrícula profesional requerido"),
  specialty: z.string().min(2, "Especialidad requerida (ej. Psiquiatría, Terapia Ocupacional)"),
});

export const RegisterSchema = z.discriminatedUnion("role", [
  RegisterPatientSchema,
  RegisterCaregiverSchema,
  RegisterProfessionalSchema,
]);

export type RegisterInput = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: z.string().email("Correo electrónico no válido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

export type LoginInput = z.infer<typeof LoginSchema>;

export interface AuthUserPayload {
  id: string;
  email: string;
  role: Role;
  fullName: string;
  profileId?: string;
}
