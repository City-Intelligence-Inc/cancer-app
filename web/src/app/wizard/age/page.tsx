"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import StepContainer from "@/components/StepContainer";
import { useSession } from "@/context/SessionContext";

export default function AgePage() {
  const router = useRouter();
  const { answers, saveAnswer } = useSession();
  const [age, setAge] = useState(answers.age?.toString() ?? "");
  const [loading, setLoading] = useState(false);

  const numericAge = parseInt(age, 10);
  const isValid = !isNaN(numericAge) && numericAge > 0 && numericAge < 130;

  const handleNext = async () => {
    if (!isValid) return;
    setLoading(true);
    try {
      await saveAnswer("age", numericAge);
      router.push("/wizard/location");
    } finally {
      setLoading(false);
    }
  };

  return (
    <StepContainer
      heading="How old are you?"
      description="Some resources are tailored to specific age groups. This helps us find the best fit."
      onNext={handleNext}
      nextDisabled={!isValid}
      loading={loading}
    >
      <input
        type="number"
        value={age}
        onChange={(e) => setAge(e.target.value)}
        placeholder="Enter your age"
        autoFocus
        className="w-full bg-white border-2 border-border rounded-xl p-4 text-lg text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-sage transition-colors"
      />
    </StepContainer>
  );
}
