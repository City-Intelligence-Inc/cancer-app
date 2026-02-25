"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import StepContainer from "@/components/StepContainer";
import SelectableChip from "@/components/SelectableChip";
import { useSession } from "@/context/SessionContext";
import { DIAGNOSES } from "@/data/resources";

export default function DiagnosisPage() {
  const router = useRouter();
  const { answers, saveAnswer } = useSession();
  const [selected, setSelected] = useState(answers.diagnosis ?? "");
  const [loading, setLoading] = useState(false);

  const handleNext = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      await saveAnswer("diagnosis", selected);
      router.push("/wizard/help-needed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <StepContainer
      heading="What is your diagnosis?"
      description="Select the option that best describes your cancer type. This helps us find specialized resources."
      onNext={handleNext}
      nextDisabled={!selected}
      loading={loading}
    >
      <div className="flex flex-wrap gap-2">
        {DIAGNOSES.map((d) => (
          <SelectableChip
            key={d}
            label={d}
            selected={selected === d}
            onClick={() => setSelected(selected === d ? "" : d)}
          />
        ))}
      </div>
    </StepContainer>
  );
}
