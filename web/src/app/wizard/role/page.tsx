"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import StepContainer from "@/components/StepContainer";
import SelectableChip from "@/components/SelectableChip";
import { useSession } from "@/context/SessionContext";
import { ROLES } from "@/data/resources";

export default function RolePage() {
  const router = useRouter();
  const { answers, saveAnswer } = useSession();
  const [selected, setSelected] = useState<string>(answers.role ?? "");
  const [loading, setLoading] = useState(false);

  const handleNext = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      await saveAnswer("role", selected as "Patient" | "Carer");
      router.push("/wizard/location");
    } finally {
      setLoading(false);
    }
  };

  return (
    <StepContainer
      heading="Are you a patient or a carer?"
      description="This helps us show resources designed for your situation."
      onNext={handleNext}
      nextDisabled={!selected}
      loading={loading}
    >
      <div className="flex flex-wrap gap-2">
        {ROLES.map((r) => (
          <SelectableChip
            key={r}
            label={r}
            selected={selected === r}
            onClick={() => setSelected(selected === r ? "" : r)}
          />
        ))}
      </div>
    </StepContainer>
  );
}
