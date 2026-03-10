export interface Resource {
  id: string;
  name: string;
  description: string;
  helpTypes: string[];
  diagnoses: string[];
  ageRange: [number, number] | null;
  locations: string[];
  entireCountry: boolean;
  cities: string[];
  countries: string[];
  url: string;
  phone?: string;
  contact?: string;
  patientCarer: "Patient" | "Carer" | "Both";
  treatmentStage: string;
}

export const HELP_TYPES = [
  "Mental Health",
  "Peer Support",
  "Financial Aid",
  "Practical Help",
  "Legal & Employment",
  "Information & Education",
  "Carer Support",
  "Wellness & Nutrition",
  "End-of-Life Care",
] as const;

export const DIAGNOSES = [
  "Breast Cancer",
  "Lung Cancer",
  "Bowel / Colorectal Cancer",
  "Prostate Cancer",
  "Blood / Leukaemia",
  "Gynaecological Cancer",
  "Head & Neck Cancer",
  "Skin Cancer",
  "Pancreatic Cancer",
  "Brain Cancer",
  "Other / Unsure",
] as const;

export const TREATMENT_STAGES = [
  "Newly Diagnosed",
  "During Treatment",
  "Post-Treatment",
  "Palliative / End-of-Life",
] as const;

export const ROLES = ["Patient", "Carer"] as const;
