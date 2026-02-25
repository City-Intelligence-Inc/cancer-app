import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import StepContainer from "../../components/StepContainer";
import SelectableChip from "../../components/SelectableChip";
import { useSession } from "../../context/SessionContext";
import { HELP_TYPES } from "../../data/resources";

export default function HelpNeededStep() {
  const router = useRouter();
  const { answers, saveAnswer } = useSession();
  const [selected, setSelected] = useState<string[]>(
    answers.help_needed ?? []
  );
  const [loading, setLoading] = useState(false);

  const toggle = (item: string) => {
    setSelected((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handleNext = async () => {
    if (selected.length === 0) return;
    setLoading(true);
    try {
      await saveAnswer("help_needed", selected);
      router.replace("/results");
    } finally {
      setLoading(false);
    }
  };

  return (
    <StepContainer
      heading="What kind of help do you need?"
      description="Select all that apply. We'll match you with the most relevant resources."
      onNext={handleNext}
      nextLabel="See My Matches"
      nextDisabled={selected.length === 0}
      loading={loading}
    >
      <View style={styles.chips}>
        {HELP_TYPES.map((h) => (
          <SelectableChip
            key={h}
            label={h}
            selected={selected.includes(h)}
            onPress={() => toggle(h)}
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
