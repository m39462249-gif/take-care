export type SymptomTag = "NO_SLEEP" | "HALLUCINATION" | "FOOD_REFUSAL" | "AGITATION";

export interface InterventionGuide {
  id: string;
  triggerTag: SymptomTag;
  step1: string;
  step2: string;
  step3: string;
  audioGuideUrl?: string | null;
}

export interface CaregiverQuickLog {
  id: string;
  patientId: string;
  caregiverId: string;
  symptomTag: SymptomTag;
  notes?: string | null;
  audioUrl?: string | null;
  createdAt: string;
}

export interface PreventiveReminder {
  id: string;
  type: "MEDICATION" | "ROUTINE" | "HYDRATION" | "SYMPTOM";
  priority: "HIGH" | "MEDIUM" | "NORMAL";
  title: string;
  description: string;
  actionText: string;
  createdAt: string;
}
