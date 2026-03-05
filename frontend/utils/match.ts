import { Resource } from "../data/resources";

interface Answers {
  age?: number;
  location?: string;
  diagnosis?: string;
  help_needed?: string[];
}

// Resources must always be passed explicitly — never falls back to hardcoded data.
export function matchResources(answers: Answers, resources: Resource[]): Resource[] {
  const city = answers.location ?? "";
  const diagnosis = answers.diagnosis ?? "";
  const helpNeeded = answers.help_needed ?? [];

  const filtered = resources.filter((r) => {
    // Location: pass if entire-country, no city restriction, or user's city matches
    if (!r.entireCountry && r.cities.length > 0 && !r.cities.includes(city)) return false;

    // Diagnosis: empty diagnoses means "All" — otherwise user's diagnosis must match
    if (r.diagnoses.length > 0 && diagnosis) {
      if (!r.diagnoses.includes(diagnosis)) return false;
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
