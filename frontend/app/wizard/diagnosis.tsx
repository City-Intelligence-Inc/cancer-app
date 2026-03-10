import React, { useState, useEffect } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import StepContainer from "../../components/StepContainer";
import SelectableChip from "../../components/SelectableChip";
import { useSession } from "../../context/SessionContext";
import { getSheetDiagnoses } from "../../services/api";
import { colors } from "../../utils/theme";

export default function DiagnosisStep() {
  const router = useRouter();
  const { answers, saveAnswer } = useSession();
  const [selected, setSelected] = useState<string>(answers.diagnosis ?? "");
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
        <ActivityIndicator size="small" color={colors.primary} />
      ) : (
        <View style={styles.chips}>
          {diagnoses.map((d) => (
            <SelectableChip
              key={d}
              label={d}
              selected={selected === d}
              onPress={() => setSelected(selected === d ? "" : d)}
            />
          ))}
        </View>
      )}
    </StepContainer>
  );
}

const styles = StyleSheet.create({
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
});
