"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import ResourceCard from "@/components/ResourceCard";
import Button from "@/components/Button";
import { useSession } from "@/context/SessionContext";
import { matchResources } from "@/utils/match";

export default function ResultsPage() {
  const router = useRouter();
  const { answers } = useSession();
  const matched = useMemo(() => matchResources(answers), [answers]);

  return (
    <main className="min-h-screen max-w-lg mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-[26px] font-bold text-text-primary mb-1">Your Matches</h1>
        <p className="text-base text-text-secondary leading-relaxed">
          We found {matched.length} resource{matched.length !== 1 ? "s" : ""} based on your answers.
        </p>
      </div>

      <div className="flex flex-col gap-4 mb-6">
        {matched.map((r) => (
          <ResourceCard key={r.id} resource={r} />
        ))}
      </div>

      <Button title="Start Over" variant="secondary" onClick={() => router.push("/")} className="w-full" />
    </main>
  );
}
