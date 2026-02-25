import { Resource } from "@/data/resources";

export default function ResourceCard({ resource }: { resource: Resource }) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-border shadow-sm">
      <h3 className="text-lg font-bold text-text-primary mb-1">{resource.name}</h3>
      <p className="text-sm text-text-secondary leading-relaxed mb-4">{resource.description}</p>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {resource.helpTypes.map((t) => (
          <span key={t} className="bg-chip-bg text-sage text-xs font-semibold px-2.5 py-1 rounded-full">
            {t}
          </span>
        ))}
      </div>

      <div className="flex gap-4">
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
      </div>
    </div>
  );
}
