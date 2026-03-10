import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import StepContainer from "../../components/StepContainer";
import SelectableChip from "../../components/SelectableChip";
import { useSession } from "../../context/SessionContext";
import { ROLES } from "../../data/resources";

export default function RoleStep() {
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
      <View style={styles.chips}>
        {ROLES.map((r) => (
          <SelectableChip
            key={r}
            label={r}
            selected={selected === r}
            onPress={() => setSelected(selected === r ? "" : r)}
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
