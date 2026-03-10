"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ResourceCard from "@/components/ResourceCard";
import { Resource } from "@/data/resources";
import { getSheetResources } from "@/services/api";

export default function ResourcesPage() {
  const router = useRouter();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("All");

  useEffect(() => {
    getSheetResources()
      .then((r) => { setResources(r); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, []);

  // Gather unique help types for filter
  const allHelpTypes = Array.from(
    new Set(resources.flatMap((r) => r.helpTypes))
  ).sort();

  const filtered = resources.filter((r) => {
    const matchesSearch =
      !search ||
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.description.toLowerCase().includes(search.toLowerCase());
    const matchesType =
      filterType === "All" || r.helpTypes.includes(filterType);
    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <main className="min-h-screen max-w-4xl mx-auto px-6 py-12">
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sage mb-4" />
          <p className="text-base text-text-secondary">Loading resources...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen max-w-4xl mx-auto px-6 py-12">
        <div className="text-center py-20">
          <p className="text-5xl mb-4">⚠️</p>
          <h1 className="text-2xl font-bold text-text-primary mb-2">Couldn&apos;t load resources</h1>
          <p className="text-base text-text-secondary mb-6">Please check your connection and try again.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen max-w-4xl mx-auto px-6 py-12">
      <div className="mb-8">
        <button
          onClick={() => router.push("/")}
          className="text-sm text-sage font-semibold mb-4 hover:underline cursor-pointer"
        >
          &larr; Back to Home
        </button>
        <h1 className="text-3xl font-extrabold text-text-primary mb-2">
          Cancer Support Resources
        </h1>
        <p className="text-base text-text-secondary leading-relaxed">
          Browse all {resources.length} resources in our database. Use the search and filters to find what you need, or{" "}
          <button onClick={() => router.push("/")} className="text-sage font-semibold hover:underline cursor-pointer">
            take the quiz
          </button>{" "}
          for personalized matches.
        </p>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search resources..."
          className="flex-1 bg-white border-2 border-border rounded-xl px-4 py-3 text-base text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-sage transition-colors"
        />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="bg-white border-2 border-border rounded-xl px-4 py-3 text-base text-text-primary focus:outline-none focus:border-sage transition-colors cursor-pointer"
        >
          <option value="All">All categories</option>
          {allHelpTypes.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <p className="text-sm text-text-secondary mb-4">
        Showing {filtered.length} of {resources.length} resources
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((r) => (
          <ResourceCard key={r.id} resource={r} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-base text-text-secondary">No resources match your search.</p>
        </div>
      )}
    </main>
  );
}
