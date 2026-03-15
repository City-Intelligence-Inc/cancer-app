import { Resource } from "@/data/resources";

/** Try to extract a phone number from the contact string */
function extractPhone(resource: Resource): string | null {
  if (resource.phone) return resource.phone;
  const contact = resource.contact || "";
  // Match patterns like +1-800-123-4567, (415) 674-4770, 888-793-9355, Tel: 0330 995 0400
  const m = contact.match(/([\+]?[\d][\d\s\-\(\)]{6,}[\d])/);
  return m ? m[1].trim() : null;
}

export default function ResourceCard({ resource }: { resource: Resource }) {
  const phone = extractPhone(resource);

  const locationLabel = resource.entireCountry
    ? "Available nationwide"
    : resource.cities.length > 0
    ? resource.cities.slice(0, 4).join(", ") + (resource.cities.length > 4 ? ` +${resource.cities.length - 4} more` : "")
    : resource.countries.length > 0
    ? resource.countries.slice(0, 3).join(", ")
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

      <div className="flex flex-col gap-2">
        {/* Phone number - most prominent if available */}
        {phone && (
          <a
            href={`tel:${phone.replace(/\s/g, "")}`}
            className="flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl py-3 px-4 text-sm font-bold text-emerald-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            Call {phone}
          </a>
        )}

        {/* Website link */}
        <div className="flex gap-3">
          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center justify-center gap-2 rounded-xl py-2.5 px-4 text-sm font-semibold transition-colors ${
              phone
                ? "text-text-secondary hover:text-text-primary hover:bg-gray-50 border border-border"
                : "bg-terracotta/10 hover:bg-terracotta/20 text-terracotta border border-terracotta/20"
            } flex-1`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Visit Website
          </a>
        </div>
      </div>
    </div>
  );
}
