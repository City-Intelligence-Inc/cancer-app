"use client";
import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import StepContainer from "../../components/StepContainer";
import SelectableChip from "../../components/SelectableChip";
import { useSession } from "../../context/SessionContext";
import { CITIES } from "../../data/resources";
import { spacing } from "../../utils/theme";

const ALL_OPTIONS = [...CITIES, "Other / Not listed"] as const;

export default function LocationStep() {
  const router = useRouter();
  const { answers, saveAnswer } = useSession();
  const [selected, setSelected] = useState<string>(answers.location ?? "");
  const [loading, setLoading] = useState(false);

  const handleNext = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      await saveAnswer("location", selected);
      router.push("/wizard/diagnosis");
    } finally {
      setLoading(false);
    }
  };

  return (
    <StepContainer
      heading="Where are you located?"
      description="Select your city so we can find resources near you."
      onNext={handleNext}
      nextDisabled={!selected}
      loading={loading}
    >
      <View style={styles.chips}>
        {ALL_OPTIONS.map((city) => (
          <SelectableChip
            key={city}
            label={city}
            selected={selected === city}
            onPress={() => setSelected(city)}
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
    marginTop: spacing.sm,
  },
});
