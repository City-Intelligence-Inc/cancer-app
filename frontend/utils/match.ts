import { Resource } from "../data/resources";

interface Answers {
  age?: number;
  location?: string;
  country?: string;
  diagnosis?: string;
  help_needed?: string[];
  role?: "Patient" | "Carer";
  treatment_stage?: string;
}

// Resources must always be passed explicitly — never falls back to hardcoded data.
export function matchResources(answers: Answers, resources: Resource[]): Resource[] {
  const city = answers.location ?? "";
  const country = answers.country ?? "";
  const diagnosis = answers.diagnosis ?? "";
  const helpNeeded = answers.help_needed ?? [];
  const role = answers.role;
  const age = answers.age;
  const treatmentStage = answers.treatment_stage;

  const filtered = resources.filter((r) => {
    // Location: pass if entire-country, user's city matches, or user's country matches
    if (!r.entireCountry) {
      const cityMatch = r.cities.length > 0 && r.cities.includes(city);
      const countryMatch = r.countries.length > 0 && country && r.countries.includes(country);
      if (!cityMatch && !countryMatch) return false;
    }

    // Diagnosis: empty diagnoses means "All" — otherwise user's diagnosis must match
    if (r.diagnoses.length > 0 && diagnosis) {
      if (!r.diagnoses.includes(diagnosis)) return false;
    }

    // Help type: at least one of the user's selected types must match
    // Resources with no helpTypes are treated as "general" and pass
    if (r.helpTypes.length > 0 && helpNeeded.length > 0) {
      const overlap = helpNeeded.some((h) => r.helpTypes.includes(h));
      if (!overlap) return false;
    }

    // Age: skip resources outside the user's age range
    if (age && r.ageRange) {
      const [min, max] = r.ageRange;
      if (age < min || age > max) return false;
    }

    // Patient / Carer: skip resources that don't match the user's role
    if (role && r.patientCarer !== "Both" && r.patientCarer !== role) {
      return false;
    }

    // Treatment stage: skip resources not matching the user's stage
    // "All" means the resource is for any stage
    if (treatmentStage && r.treatmentStage !== "All" && r.treatmentStage !== treatmentStage) {
      return false;
    }

    return true;
  });

  // Rank by help type overlap so best matches appear first
  return filtered
    .map((r) => ({
      resource: r,
      score: helpNeeded.filter((h) => r.helpTypes.includes(h)).length,
    }))
    .sort((a, b) => b.score - a.score)
    .map((s) => s.resource);
}
