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

export interface MatchReason {
  filter: string;
  passed: boolean;
  detail: string;
}

export interface MatchResult {
  resource: Resource;
  score: number;
  reasons: MatchReason[];
}

export interface MatchLog {
  timestamp: string;
  answers: Answers;
  totalResources: number;
  matchedCount: number;
  rejectedCount: number;
  matches: Array<{
    resourceId: string;
    resourceName: string;
    score: number;
    reasons: MatchReason[];
  }>;
  rejections: Array<{
    resourceId: string;
    resourceName: string;
    rejectedBy: string;
    detail: string;
  }>;
}

// Resources must always be passed explicitly — never falls back to hardcoded data.
export function matchResourcesWithLog(answers: Answers, resources: Resource[]): {
  matched: Resource[];
  log: MatchLog;
} {
  const city = answers.location ?? "";
  const country = answers.country ?? "";
  const diagnosis = answers.diagnosis ?? "";
  const helpNeeded = answers.help_needed ?? [];
  const role = answers.role;
  const age = answers.age;
  const treatmentStage = answers.treatment_stage;

  const matches: MatchResult[] = [];
  const rejections: MatchLog["rejections"] = [];

  for (const r of resources) {
    const reasons: MatchReason[] = [];
    let rejected = false;
    let rejectedBy = "";
    let rejectedDetail = "";

    // --- Location ---
    if (r.entireCountry) {
      reasons.push({ filter: "location", passed: true, detail: "Available UK-wide" });
    } else {
      const cityMatch = r.cities.length > 0 && r.cities.includes(city);
      const countryMatch = r.countries.length > 0 && !!country && r.countries.includes(country);
      if (cityMatch) {
        reasons.push({ filter: "location", passed: true, detail: `City match: "${city}" in [${r.cities.join(", ")}]` });
      } else if (countryMatch) {
        reasons.push({ filter: "location", passed: true, detail: `Country match: "${country}" in [${r.countries.join(", ")}]` });
      } else {
        rejected = true;
        rejectedBy = "location";
        rejectedDetail = `User city "${city}" / country "${country}" not in cities [${r.cities.join(", ")}] or countries [${r.countries.join(", ")}]`;
        reasons.push({ filter: "location", passed: false, detail: rejectedDetail });
      }
    }

    // --- Diagnosis ---
    if (r.diagnoses.length === 0) {
      reasons.push({ filter: "diagnosis", passed: true, detail: "Covers all cancer types" });
    } else if (!diagnosis) {
      reasons.push({ filter: "diagnosis", passed: true, detail: "No diagnosis specified by user" });
    } else if (r.diagnoses.includes(diagnosis)) {
      reasons.push({ filter: "diagnosis", passed: true, detail: `Diagnosis match: "${diagnosis}"` });
    } else {
      if (!rejected) { rejected = true; rejectedBy = "diagnosis"; rejectedDetail = `User diagnosis "${diagnosis}" not in [${r.diagnoses.join(", ")}]`; }
      reasons.push({ filter: "diagnosis", passed: false, detail: `User diagnosis "${diagnosis}" not in [${r.diagnoses.join(", ")}]` });
    }

    // --- Help type ---
    if (r.helpTypes.length === 0) {
      reasons.push({ filter: "helpType", passed: true, detail: "General resource (no specific help type)" });
    } else if (helpNeeded.length === 0) {
      reasons.push({ filter: "helpType", passed: true, detail: "No help types specified by user" });
    } else {
      const overlapping = helpNeeded.filter((h) => r.helpTypes.includes(h));
      if (overlapping.length > 0) {
        reasons.push({ filter: "helpType", passed: true, detail: `Help type overlap: [${overlapping.join(", ")}]` });
      } else {
        if (!rejected) { rejected = true; rejectedBy = "helpType"; rejectedDetail = `No overlap: user wants [${helpNeeded.join(", ")}], resource offers [${r.helpTypes.join(", ")}]`; }
        reasons.push({ filter: "helpType", passed: false, detail: `No overlap: user wants [${helpNeeded.join(", ")}], resource offers [${r.helpTypes.join(", ")}]` });
      }
    }

    // --- Age ---
    if (!r.ageRange) {
      reasons.push({ filter: "age", passed: true, detail: "No age restriction" });
    } else if (!age) {
      reasons.push({ filter: "age", passed: true, detail: "No age specified by user" });
    } else {
      const [min, max] = r.ageRange;
      if (age >= min && age <= max) {
        reasons.push({ filter: "age", passed: true, detail: `Age ${age} within range [${min}-${max}]` });
      } else {
        if (!rejected) { rejected = true; rejectedBy = "age"; rejectedDetail = `Age ${age} outside range [${min}-${max}]`; }
        reasons.push({ filter: "age", passed: false, detail: `Age ${age} outside range [${min}-${max}]` });
      }
    }

    // --- Patient / Carer ---
    if (r.patientCarer === "Both") {
      reasons.push({ filter: "role", passed: true, detail: "Available for patients and carers" });
    } else if (!role) {
      reasons.push({ filter: "role", passed: true, detail: "No role specified by user" });
    } else if (r.patientCarer === role) {
      reasons.push({ filter: "role", passed: true, detail: `Role match: "${role}"` });
    } else {
      if (!rejected) { rejected = true; rejectedBy = "role"; rejectedDetail = `User is "${role}" but resource is for "${r.patientCarer}" only`; }
      reasons.push({ filter: "role", passed: false, detail: `User is "${role}" but resource is for "${r.patientCarer}" only` });
    }

    // --- Treatment stage ---
    if (r.treatmentStage === "All") {
      reasons.push({ filter: "treatmentStage", passed: true, detail: "All treatment stages" });
    } else if (!treatmentStage) {
      reasons.push({ filter: "treatmentStage", passed: true, detail: "No treatment stage specified by user" });
    } else if (r.treatmentStage === treatmentStage) {
      reasons.push({ filter: "treatmentStage", passed: true, detail: `Treatment stage match: "${treatmentStage}"` });
    } else {
      if (!rejected) { rejected = true; rejectedBy = "treatmentStage"; rejectedDetail = `User stage "${treatmentStage}" != resource stage "${r.treatmentStage}"`; }
      reasons.push({ filter: "treatmentStage", passed: false, detail: `User stage "${treatmentStage}" != resource stage "${r.treatmentStage}"` });
    }

    if (rejected) {
      rejections.push({ resourceId: r.id, resourceName: r.name, rejectedBy, detail: rejectedDetail });
    } else {
      const score = helpNeeded.filter((h) => r.helpTypes.includes(h)).length;
      matches.push({ resource: r, score, reasons });
    }
  }

  // Sort by score descending
  matches.sort((a, b) => b.score - a.score);

  const log: MatchLog = {
    timestamp: new Date().toISOString(),
    answers,
    totalResources: resources.length,
    matchedCount: matches.length,
    rejectedCount: rejections.length,
    matches: matches.map((m) => ({
      resourceId: m.resource.id,
      resourceName: m.resource.name,
      score: m.score,
      reasons: m.reasons,
    })),
    rejections,
  };

  return { matched: matches.map((m) => m.resource), log };
}

// Convenience wrapper that just returns resources (backwards compatible)
export function matchResources(answers: Answers, resources: Resource[]): Resource[] {
  return matchResourcesWithLog(answers, resources).matched;
}
