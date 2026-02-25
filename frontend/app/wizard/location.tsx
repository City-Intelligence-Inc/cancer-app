import React, { useState } from "react";
import { TextInput, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import StepContainer from "../../components/StepContainer";
import { useSession } from "../../context/SessionContext";
import { colors, fontSize, radius, spacing } from "../../utils/theme";

export default function LocationStep() {
  const router = useRouter();
  const { answers, saveAnswer } = useSession();
  const [location, setLocation] = useState(answers.location ?? "");
  const [loading, setLoading] = useState(false);

  const isValid = location.trim().length > 0;

  const handleNext = async () => {
    if (!isValid) return;
    setLoading(true);
    try {
      await saveAnswer("location", location.trim());
      router.push("/wizard/diagnosis");
    } finally {
      setLoading(false);
    }
  };

  return (
    <StepContainer
      heading="Where are you located?"
      description="Enter your city or state so we can find resources near you."
      onNext={handleNext}
      nextDisabled={!isValid}
      loading={loading}
    >
      <TextInput
        style={styles.input}
        value={location}
        onChangeText={setLocation}
        placeholder="e.g. New York, NY"
        placeholderTextColor={colors.textSecondary}
        keyboardType="default"
        returnKeyType="done"
        autoFocus
      />
    </StepContainer>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: fontSize.lg,
    color: colors.text,
    marginTop: spacing.sm,
  },
});
