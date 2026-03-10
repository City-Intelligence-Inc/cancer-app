"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import StepContainer from "@/components/StepContainer";
import SelectableChip from "@/components/SelectableChip";
import { useSession } from "@/context/SessionContext";
import { getSheetDiagnoses } from "@/services/api";

export default function DiagnosisPage() {
  const router = useRouter();
  const { answers, saveAnswer } = useSession();
  const [selected, setSelected] = useState(answers.diagnosis ?? "");
  const [loading, setLoading] = useState(false);
  const [diagnoses, setDiagnoses] = useState<string[]>([]);
  const [diagLoading, setDiagLoading] = useState(true);

  useEffect(() => {
    getSheetDiagnoses()
      .then(setDiagnoses)
      .catch(() => setDiagnoses(["Other / Unsure"]))
      .finally(() => setDiagLoading(false));
  }, []);

  const handleNext = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      await saveAnswer("diagnosis", selected);
      router.push("/wizard/treatment-stage");
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
      {diagLoading ? (
        <p className="text-sm text-text-secondary">Loading cancer types...</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {diagnoses.map((d) => (
            <SelectableChip
              key={d}
              label={d}
              selected={selected === d}
              onClick={() => setSelected(selected === d ? "" : d)}
            />
          ))}
        </div>
      )}
    </StepContainer>
  );
}
