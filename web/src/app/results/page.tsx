"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ResourceCard from "@/components/ResourceCard";
import Button from "@/components/Button";
import { useSession, Answers } from "@/context/SessionContext";
import { matchResourcesWithLog } from "@/utils/match";
import { Resource } from "@/data/resources";
import { getAllResources, saveMatchLog } from "@/services/api";

function MatchExplainer({ onClose, answers, matchedCount, totalCount }: {
  onClose: () => void;
  answers: Answers;
  matchedCount: number;
  totalCount: number;
}) {
  const rejectedCount = totalCount - matchedCount;
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-text-primary">How We Found Your Matches</h2>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary p-1 cursor-pointer">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="space-y-3 text-sm text-text-secondary leading-relaxed">
          <p>We searched <strong>{totalCount.toLocaleString()} resources</strong> and found <strong>{matchedCount}</strong> that match your profile. {rejectedCount > 0 && `${rejectedCount.toLocaleString()} were filtered out.`}</p>

          <p className="font-semibold text-text-primary pt-1">Your filters:</p>
          <ul className="space-y-2 ml-1">
            <li className="flex gap-2">
              <span className={answers.location ? "text-emerald-500" : "text-gray-300"}>
                {answers.location ? "✓" : "—"}
              </span>
              <span>
                <strong>Location:</strong>{" "}
                {answers.location
                  ? <>Only showing resources available in <strong>{answers.location}</strong>{answers.country ? `, ${answers.country}` : ""}{answers.zipcode ? ` (${answers.zipcode})` : ""}.</>
                  : "Not set — showing all locations."}
              </span>
            </li>
            <li className="flex gap-2">
              <span className={answers.diagnosis ? "text-emerald-500" : "text-gray-300"}>
                {answers.diagnosis ? "✓" : "—"}
              </span>
              <span>
                <strong>Cancer type:</strong>{" "}
                {answers.diagnosis
                  ? <>Filtered for <strong>{answers.diagnosis}</strong> and resources covering all cancer types.</>
                  : "Not set — showing all cancer types."}
              </span>
            </li>
            <li className="flex gap-2">
              <span className={answers.help_needed?.length ? "text-emerald-500" : "text-gray-300"}>
                {answers.help_needed?.length ? "✓" : "—"}
              </span>
              <span>
                <strong>Help types:</strong>{" "}
                {answers.help_needed?.length
                  ? <>Looking for <strong>{answers.help_needed.join(", ")}</strong>. Resources offering more of these rank higher.</>
                  : "Not set — showing all help types."}
              </span>
            </li>
            <li className="flex gap-2">
              <span className={answers.age ? "text-emerald-500" : "text-gray-300"}>
                {answers.age ? "✓" : "—"}
              </span>
              <span>
                <strong>Age:</strong>{" "}
                {answers.age
                  ? <>Filtered for age <strong>{answers.age}</strong> — excluding resources outside your age range.</>
                  : "Not set — showing all ages."}
              </span>
            </li>
            <li className="flex gap-2">
              <span className={answers.role ? "text-emerald-500" : "text-gray-300"}>
                {answers.role ? "✓" : "—"}
              </span>
              <span>
                <strong>Role:</strong>{" "}
                {answers.role
                  ? <>Showing resources for <strong>{answers.role === "Patient" ? "patients" : "carers"}</strong> and those serving both.</>
                  : "Not set — showing all."}
              </span>
            </li>
            <li className="flex gap-2">
              <span className={answers.treatment_stage ? "text-emerald-500" : "text-gray-300"}>
                {answers.treatment_stage ? "✓" : "—"}
              </span>
              <span>
                <strong>Treatment stage:</strong>{" "}
                {answers.treatment_stage
                  ? <>Filtered for <strong>{answers.treatment_stage}</strong> and resources covering all stages.</>
                  : "Not set — showing all stages."}
              </span>
            </li>
          </ul>
          <p className="pt-2 border-t border-border"><strong>Ranking:</strong> Resources with more matching help types appear first. Those matching your postcode get a boost, and resources with a <strong>direct phone number</strong> you can call are prioritised.</p>
        </div>
      </div>
    </div>
  );
}

export default function ResultsPage() {
  const router = useRouter();
  const { sessionId, answers } = useSession();
  const [sheetResources, setSheetResources] = useState<Resource[] | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showExplainer, setShowExplainer] = useState(false);

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

  // Summary of user's current filters
  const filterSummary = [
    answers.location,
    answers.diagnosis,
    answers.role,
    answers.treatment_stage,
    answers.age ? `Age ${answers.age}` : null,
  ].filter(Boolean).join(" · ");

  return (
    <main className="min-h-screen max-w-lg mx-auto px-6 py-8">
      {showExplainer && (
        <MatchExplainer
          onClose={() => setShowExplainer(false)}
          answers={answers}
          matchedCount={matched.length}
          totalCount={sheetResources?.length ?? 0}
        />
      )}

      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-[26px] font-bold text-text-primary">Your Matches</h1>
          <button
            onClick={() => setShowExplainer(true)}
            className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
            title="How matching works"
          >
            <span className="text-sm font-bold">?</span>
          </button>
        </div>
        <p className="text-base text-text-secondary leading-relaxed">
          {matched.length > 0
            ? `${matched.length} resource${matched.length !== 1 ? "s" : ""} found`
            : `No resources found matching your criteria`}
        </p>
      </div>

      {/* Current filters + edit link */}
      {filterSummary && (
        <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 mb-4">
          <p className="text-xs text-text-secondary leading-relaxed flex-1">{filterSummary}</p>
          <button
            onClick={() => router.push("/settings")}
            className="text-xs font-semibold text-terracotta hover:underline ml-3 whitespace-nowrap cursor-pointer"
          >
            Edit
          </button>
        </div>
      )}

      <div className="flex flex-col gap-4 mb-6">
        {matched.length > 0 ? (
          matched.map((r) => <ResourceCard key={r.id} resource={r} />)
        ) : (
          <div className="text-center py-10">
            <p className="text-5xl mb-4">🔍</p>
            <h2 className="text-xl font-bold text-text-primary mb-2">No matches yet</h2>
            <p className="text-base text-text-secondary leading-relaxed px-4">
              Try broadening your criteria — you can change your selections in settings.
            </p>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Button title="Settings" variant="secondary" onClick={() => router.push("/settings")} className="flex-1" />
        <Button title="Start Over" variant="secondary" onClick={() => router.push("/")} className="flex-1" />
      </div>
    </main>
  );
}
