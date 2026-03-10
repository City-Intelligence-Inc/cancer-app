"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import StepContainer from "@/components/StepContainer";
import SelectableChip from "@/components/SelectableChip";
import { useSession } from "@/context/SessionContext";
import { TREATMENT_STAGES } from "@/data/resources";

export default function TreatmentStagePage() {
  const router = useRouter();
  const { answers, saveAnswer } = useSession();
  const [selected, setSelected] = useState<string>(answers.treatment_stage ?? "");
  const [loading, setLoading] = useState(false);

  const handleNext = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      await saveAnswer("treatment_stage", selected);
      router.push("/wizard/help-needed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <StepContainer
      heading="What stage of treatment are you at?"
      description="This helps us find resources relevant to where you are in your journey."
      onNext={handleNext}
      nextDisabled={!selected}
      loading={loading}
    >
      <div className="flex flex-wrap gap-2">
        {TREATMENT_STAGES.map((s) => (
          <SelectableChip
            key={s}
            label={s}
            selected={selected === s}
            onClick={() => setSelected(selected === s ? "" : s)}
          />
        ))}
      </div>
    </StepContainer>
  );
}
