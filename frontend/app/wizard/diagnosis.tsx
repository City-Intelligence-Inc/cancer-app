import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import StepContainer from "../../components/StepContainer";
import SelectableChip from "../../components/SelectableChip";
import { useSession } from "../../context/SessionContext";
import { DIAGNOSES } from "../../data/resources";

export default function DiagnosisStep() {
  const router = useRouter();
  const { answers, saveAnswer } = useSession();
  const [selected, setSelected] = useState<string>(answers.diagnosis ?? "");
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
      <View style={styles.chips}>
        {DIAGNOSES.map((d) => (
          <SelectableChip
            key={d}
            label={d}
            selected={selected === d}
            onPress={() => setSelected(selected === d ? "" : d)}
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
