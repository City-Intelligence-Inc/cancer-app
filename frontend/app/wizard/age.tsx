import React, { useState } from "react";
import { TextInput, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import StepContainer from "../../components/StepContainer";
import { useSession } from "../../context/SessionContext";
import { colors, fontSize, radius, spacing } from "../../utils/theme";

export default function AgeStep() {
  const router = useRouter();
  const { answers, saveAnswer } = useSession();
  const [age, setAge] = useState(answers.age?.toString() ?? "");
  const [loading, setLoading] = useState(false);

  const numericAge = parseInt(age, 10);
  const isValid = !isNaN(numericAge) && numericAge > 0 && numericAge < 130;

  const handleNext = async () => {
    if (!isValid) return;
    setLoading(true);
    try {
      await saveAnswer("age", numericAge);
      router.push("/wizard/location");
    } finally {
      setLoading(false);
    }
  };

  return (
    <StepContainer
      heading="How old are you?"
      description="Some resources are tailored to specific age groups. This helps us find the best fit."
      onNext={handleNext}
      nextDisabled={!isValid}
      loading={loading}
      showBack={true}
    >
      <TextInput
        style={styles.input}
        value={age}
        onChangeText={setAge}
        placeholder="Enter your age"
        placeholderTextColor={colors.textSecondary}
        keyboardType="number-pad"
        maxLength={3}
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
