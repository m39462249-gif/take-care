export type Role = "PATIENT" | "CAREGIVER" | "PROFESSIONAL";

export interface User {
  id: string;
  email: string;
  role: Role;
  fullName: string;
  profileId?: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  data?: {
    user: User;
    token: string;
  };
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

export interface RegisterPatientPayload {
  email: string;
  password: string;
  role: "PATIENT";
  fullName: string;
  dateOfBirth?: string;
  emergencyContactPhone?: string;
}

export interface RegisterCaregiverPayload {
  email: string;
  password: string;
  role: "CAREGIVER";
  fullName: string;
  relationToPatient: string;
  patientId?: string;
}

export interface RegisterProfessionalPayload {
  email: string;
  password: string;
  role: "PROFESSIONAL";
  fullName: string;
  licenseNumber: string;
  specialty: string;
}

export type RegisterPayload =
  | RegisterPatientPayload
  | RegisterCaregiverPayload
  | RegisterProfessionalPayload;
