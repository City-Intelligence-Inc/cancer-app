import { Resource } from "@/data/resources";

export default function ResourceCard({ resource }: { resource: Resource }) {
  const locationLabel = resource.entireCountry
    ? "Available UK-wide"
    : resource.cities.length > 0
    ? resource.cities.join(", ")
    : resource.countries.length > 0
    ? resource.countries.join(", ")
    : null;

  const cancerLabel =
    resource.diagnoses.length > 0 ? resource.diagnoses.join(", ") : "All cancer types";

  const eligibilityLabel =
    resource.patientCarer === "Both"
      ? "Patients & Carers"
      : resource.patientCarer === "Patient"
      ? "Patients only"
      : "Carers only";

  return (
    <div className="bg-white rounded-2xl p-6 border border-border shadow-sm">
      <h3 className="text-lg font-bold text-text-primary mb-1">{resource.name}</h3>
      <p className="text-sm text-text-secondary leading-relaxed mb-2">{resource.description}</p>

      <p className="text-xs text-text-secondary mb-1">
        {locationLabel} · {eligibilityLabel}
      </p>
      {cancerLabel !== "All cancer types" && (
        <p className="text-xs text-text-secondary mb-3">{cancerLabel}</p>
      )}

      <div className="flex flex-wrap gap-1.5 mb-4">
        {resource.helpTypes.map((t) => (
          <span key={t} className="bg-chip-bg text-sage text-xs font-semibold px-2.5 py-1 rounded-full">
            {t}
          </span>
        ))}
      </div>

      <div className="flex flex-wrap gap-4">
        <a
          href={resource.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold text-terracotta hover:underline"
        >
          Visit Website
        </a>
        {resource.phone && (
          <a href={`tel:${resource.phone}`} className="text-sm font-semibold text-terracotta hover:underline">
            {resource.phone}
          </a>
        )}
        {resource.contact && !resource.phone && (
          <span className="text-sm text-text-secondary">{resource.contact}</span>
        )}
      </div>
    </div>
  );
}
