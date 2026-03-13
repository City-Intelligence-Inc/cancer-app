"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ResourceCard from "@/components/ResourceCard";
import Button from "@/components/Button";
import { useSession } from "@/context/SessionContext";
import { matchResourcesWithLog } from "@/utils/match";
import { Resource } from "@/data/resources";
import { getAllResources, saveMatchLog } from "@/services/api";

export default function ResultsPage() {
  const router = useRouter();
  const { sessionId, answers } = useSession();
  const [sheetResources, setSheetResources] = useState<Resource[] | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  const notAvailable = answers.location === "Other / Not listed";

  useEffect(() => {
    if (notAvailable) { setLoading(false); return; }
    getAllResources()
      .then((r) => { setSheetResources(r); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, [notAvailable]);

  const { matched, log } = useMemo(() => {
    if (!sheetResources) return { matched: [], log: null };
    const result = matchResourcesWithLog(answers, sheetResources);
    return { matched: result.matched, log: result.log };
  }, [answers, sheetResources]);

  // Save match log to DynamoDB
  useEffect(() => {
    if (log && sessionId && !sessionId.startsWith("local-")) {
      saveMatchLog(sessionId, log as unknown as Record<string, unknown>).catch(() => {});
    }
  }, [log, sessionId]);

  if (loading) {
    return (
      <main className="min-h-screen max-w-lg mx-auto px-6 py-8 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-terracotta mb-4" />
        <p className="text-base text-text-secondary">Finding resources near you...</p>
      </main>
    );
  }

  if (notAvailable) {
    return (
      <main className="min-h-screen max-w-lg mx-auto px-6 py-8 flex flex-col items-center justify-center text-center">
        <p className="text-5xl mb-4">🌍</p>
        <h1 className="text-[26px] font-bold text-text-primary mb-2">Not available yet</h1>
        <p className="text-base text-text-secondary leading-relaxed mb-6">
          We don&apos;t have resources for your location yet. We&apos;re adding new cities regularly — check back soon.
        </p>
        <Button title="Start Over" variant="secondary" onClick={() => router.push("/")} className="w-full" />
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen max-w-lg mx-auto px-6 py-8 flex flex-col items-center justify-center text-center">
        <p className="text-5xl mb-4">⚠️</p>
        <h1 className="text-[26px] font-bold text-text-primary mb-2">Couldn&apos;t load resources</h1>
        <p className="text-base text-text-secondary leading-relaxed mb-6">
          Please check your connection and try again.
        </p>
        <Button title="Go Back" variant="secondary" onClick={() => router.back()} className="w-full" />
      </main>
    );
  }

  return (
    <main className="min-h-screen max-w-lg mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-[26px] font-bold text-text-primary mb-1">Your Matches</h1>
        <p className="text-base text-text-secondary leading-relaxed">
          {matched.length > 0
            ? `${matched.length} resource${matched.length !== 1 ? "s" : ""} found in ${answers.location}`
            : `No resources found matching your criteria in ${answers.location}`}
        </p>
      </div>

      <div className="flex flex-col gap-4 mb-6">
        {matched.length > 0 ? (
          matched.map((r) => <ResourceCard key={r.id} resource={r} />)
        ) : (
          <div className="text-center py-10">
            <p className="text-5xl mb-4">🚧</p>
            <h2 className="text-xl font-bold text-text-primary mb-2">Not implemented yet</h2>
            <p className="text-base text-text-secondary leading-relaxed px-4">
              We don&apos;t have resources matching your criteria yet. We&apos;re working on adding more — check back soon.
            </p>
          </div>
        )}
      </div>

      <Button title="Start Over" variant="secondary" onClick={() => router.push("/")} className="w-full" />
    </main>
  );
}
