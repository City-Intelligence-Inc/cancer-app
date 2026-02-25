import { Resource, resources } from "../data/resources";

interface Answers {
  age?: number;
  location?: string;
  diagnosis?: string;
  help_needed?: string[];
}

export function matchResources(answers: Answers): Resource[] {
  const scored = resources.map((r) => {
    let score = 0;

    // Help-type overlap (strongest signal)
    if (answers.help_needed?.length) {
      const overlap = r.helpTypes.filter((h) =>
        answers.help_needed!.includes(h)
      );
      score += overlap.length * 10;
    }

    // Diagnosis match
    if (
      answers.diagnosis &&
      r.diagnoses.length > 0 &&
      r.diagnoses.includes(answers.diagnosis)
    ) {
      score += 5;
    }

    // Age range match
    if (answers.age != null && r.ageRange) {
      if (answers.age >= r.ageRange[0] && answers.age <= r.ageRange[1]) {
        score += 3;
      }
    }

    // Location match (simple substring)
    if (answers.location && r.locations.length > 0) {
      const loc = answers.location.toLowerCase();
      if (
        r.locations.some(
          (l) => l.toLowerCase() === "nationwide" || l.toLowerCase().includes(loc)
        )
      ) {
        score += 3;
      }
    }

    // Boost resources with no diagnosis restriction when nothing specific matched
    if (r.diagnoses.length === 0 && score > 0) {
      score += 1;
    }

    return { resource: r, score };
  });

  const matched = scored.filter((s) => s.score > 0);

  // Fallback: return all resources sorted by general relevance
  if (matched.length === 0) {
    return resources;
  }

  return matched
    .sort((a, b) => b.score - a.score)
    .map((s) => s.resource);
}
