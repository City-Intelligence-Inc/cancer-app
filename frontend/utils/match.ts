import { Resource, resources as hardcodedResources } from "../data/resources";

interface Answers {
  age?: number;
  location?: string;
  diagnosis?: string;
  help_needed?: string[];
}

const NATIONWIDE = ["National", "Online", ""];

export function matchResources(
  answers: Answers,
  resources: Resource[] = hardcodedResources
): Resource[] {
  const city = answers.location ?? "";
  const diagnosis = answers.diagnosis ?? "";
  const helpNeeded = answers.help_needed ?? [];

  const filtered = resources.filter((r) => {
    // City: must be in the user's city, OR be national/online
    const resourceCity = r.city ?? "";
    const cityMatch =
      NATIONWIDE.includes(resourceCity) || resourceCity === city;
    if (!cityMatch) return false;

    // Diagnosis: if resource has specific diagnoses, user's diagnosis must be one of them
    if (r.diagnoses.length > 0 && diagnosis) {
      if (!r.diagnoses.includes(diagnosis)) return false;
    }

    return true;
  });

  // Rank by help type overlap — more overlap = higher up
  return filtered
    .map((r) => {
      const overlap = helpNeeded.filter((h) => r.helpTypes.includes(h)).length;
      return { resource: r, score: overlap };
    })
    .sort((a, b) => b.score - a.score)
    .map((s) => s.resource);
}
