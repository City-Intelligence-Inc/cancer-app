import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import StepContainer from "../../components/StepContainer";
import SelectableChip from "../../components/SelectableChip";
import { useSession } from "../../context/SessionContext";
import { TREATMENT_STAGES } from "../../data/resources";

export default function TreatmentStageStep() {
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
      <View style={styles.chips}>
        {TREATMENT_STAGES.map((s) => (
          <SelectableChip
            key={s}
            label={s}
            selected={selected === s}
            onPress={() => setSelected(selected === s ? "" : s)}
          />
        ))}
      </View>
    </StepContainer>
  );
}

const styles = StyleSheet.create({
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
});
