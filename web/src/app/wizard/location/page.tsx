"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import StepContainer from "@/components/StepContainer";
import { useSession } from "@/context/SessionContext";

export default function LocationPage() {
  const router = useRouter();
  const { answers, saveAnswer } = useSession();
  const [location, setLocation] = useState(answers.location ?? "");
  const [loading, setLoading] = useState(false);

  const isValid = location.trim().length > 0;

  const handleNext = async () => {
    if (!isValid) return;
    setLoading(true);
    try {
      await saveAnswer("location", location.trim());
      router.push("/wizard/diagnosis");
    } finally {
      setLoading(false);
    }
  };

  return (
    <StepContainer
      heading="Where are you located?"
      description="Enter your city or state so we can find resources near you."
      onNext={handleNext}
      nextDisabled={!isValid}
      loading={loading}
    >
      <input
        type="text"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        placeholder="e.g. New York, NY"
        autoFocus
        className="w-full bg-white border-2 border-border rounded-xl p-4 text-lg text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-sage transition-colors"
      />
    </StepContainer>
  );
}
