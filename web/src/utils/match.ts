import { Resource } from "../data/resources";

interface Answers {
  age?: number;
  location?: string;
  diagnosis?: string;
  help_needed?: string[];
}

export function matchResources(answers: Answers, resources: Resource[]): Resource[] {
  const city = answers.location ?? "";
  const diagnosis = answers.diagnosis ?? "";
  const helpNeeded = answers.help_needed ?? [];

  const filtered = resources.filter((r) => {
    if (!r.entireCountry && r.cities.length > 0 && !r.cities.includes(city)) return false;

    if (r.diagnoses.length > 0 && diagnosis) {
      if (!r.diagnoses.includes(diagnosis)) return false;
    }

    return true;
  });

  return filtered
    .map((r) => ({
      resource: r,
      score: helpNeeded.filter((h) => r.helpTypes.includes(h)).length,
    }))
    .sort((a, b) => b.score - a.score)
    .map((s) => s.resource);
}
