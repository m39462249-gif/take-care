export interface PatientOverviewItem {
  id: string;
  fullName: string;
  age: number;
  status: "Estable" | "Atención Requerida";
  statusColor: "emerald" | "amber";
  weeklyAdherence: number;
  caregiver: string;
  lastEvent: string;
}

export interface WeeklyAdherence {
  week: string;
  percentage: number;
  taken: number;
  scheduled: number;
}

export interface PatientStats {
  patient: {
    id: string;
    fullName: string;
    dateOfBirth?: string | null;
    age: number;
    emergencyContactPhone?: string | null;
    caregiverName?: string;
    caregiverRelation?: string;
  };
  adherence: {
    overallPercentage: number;
    totalTaken: number;
    totalScheduled: number;
    weeklyBreakdown: WeeklyAdherence[];
  };
  symptoms: {
    counts: {
      NO_SLEEP: number;
      AGITATION: number;
      FOOD_REFUSAL: number;
      HALLUCINATION: number;
    };
    totalReports: number;
    mostFrequent: string;
  };
  firstAidUsage: {
    totalSessions: number;
    techniqueCounts: {
      BREATHING: number;
      MUSIC: number;
      PHOTOS: number;
    };
  };
  timeline: Array<{
    id: string;
    type: "QUICK_LOG" | "CALM_SESSION" | "MEDICATION_ALERT";
    title: string;
    detail: string;
    timestamp: string;
    badgeColor: string;
  }>;
}

export interface MedicationPrescription {
  id: string;
  patientId: string;
  timeOfDay: string;
  medicationName: string;
  dosage?: string | null;
  instructions?: string | null;
  prescribedBy?: string | null;
  frequency?: string | null;
  imageUrl?: string | null;
  createdAt?: string;
  logs?: Array<{
    id: string;
    scheduleId: string;
    patientId: string;
    takenAt: string;
    confirmedByDragAndDrop: boolean;
  }>;
}
