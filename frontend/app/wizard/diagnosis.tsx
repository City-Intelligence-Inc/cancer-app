import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import StepContainer from "../../components/StepContainer";
import { useSession } from "../../context/SessionContext";
import { getSheetDiagnoses } from "../../services/api";
import { colors, fontSize, radius, spacing } from "../../utils/theme";

const OTHER = "Other / Unsure";

export default function DiagnosisStep() {
  const router = useRouter();
  const { answers, saveAnswer } = useSession();
  const [query, setQuery] = useState(answers.diagnosis ?? "");
  const [loading, setLoading] = useState(false);
  const [diagnoses, setDiagnoses] = useState<string[]>([]);
  const [diagLoading, setDiagLoading] = useState(true);

  useEffect(() => {
    getSheetDiagnoses()
      .then(setDiagnoses)
      .catch(() => setDiagnoses([OTHER]))
      .finally(() => setDiagLoading(false));
  }, []);

  // Exact case-insensitive match (including "Other / Unsure")
  const matchedDiagnosis = useMemo(
    () => diagnoses.find((d) => d.toLowerCase() === query.trim().toLowerCase()),
    [query, diagnoses]
  );

  // Autocomplete suggestions — hide once matched
  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || matchedDiagnosis) return [];
    const matches = diagnoses.filter(
      (d) => d !== OTHER && d.toLowerCase().includes(q)
    );
    // Always offer "Other / Unsure" at the bottom if it doesn't already match
    if (diagnoses.includes(OTHER)) matches.push(OTHER);
    return matches;
  }, [query, diagnoses, matchedDiagnosis]);

  const isValid = !!matchedDiagnosis;

  const handleNext = async () => {
    if (!matchedDiagnosis) return;
    setLoading(true);
    try {
      await saveAnswer("diagnosis", matchedDiagnosis);
      router.push("/wizard/treatment-stage");
    } finally {
      setLoading(false);
    }
  };

  return (
    <StepContainer
      heading="What is your diagnosis?"
      description="Start typing your cancer type and select from the suggestions."
      onNext={handleNext}
      nextDisabled={!isValid}
      loading={loading}
    >
      <View style={styles.container}>
        <TextInput
          style={[styles.input, isValid && styles.inputSelected]}
          value={query}
          onChangeText={setQuery}
          placeholder="e.g. Breast Cancer"
          placeholderTextColor={colors.textSecondary}
          autoFocus
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="done"
        />

        {diagLoading && (
          <ActivityIndicator
            size="small"
            color={colors.primary}
            style={styles.spinner}
          />
        )}

        {suggestions.length > 0 && (
          <View style={styles.dropdown}>
            {suggestions.map((d, index) => (
              <TouchableOpacity
                key={d}
                style={[
                  styles.item,
                  index === suggestions.length - 1 && styles.itemLast,
                  d === OTHER && styles.itemOther,
                ]}
                onPress={() => setQuery(d)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.itemText,
                    d === OTHER && styles.itemTextOther,
                  ]}
                >
                  {d}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {isValid && (
          <View style={styles.selectedBadge}>
            <Text style={styles.selectedBadgeText}>✓ {matchedDiagnosis}</Text>
          </View>
        )}
      </View>
    </StepContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.sm,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: fontSize.lg,
    color: colors.text,
  },
  inputSelected: {
    borderColor: colors.primary,
  },
  spinner: {
    marginTop: spacing.sm,
  },
  dropdown: {
    marginTop: 4,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    overflow: "hidden",
  },
  item: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemLast: {
    borderBottomWidth: 0,
  },
  itemOther: {
    backgroundColor: colors.background,
  },
  itemText: {
    fontSize: fontSize.body,
    color: colors.text,
    fontWeight: "500",
  },
  itemTextOther: {
    color: colors.textSecondary,
    fontStyle: "italic",
  },
  selectedBadge: {
    marginTop: spacing.sm,
    backgroundColor: colors.chipSelected,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    alignSelf: "flex-start",
  },
  selectedBadgeText: {
    color: colors.chipSelectedText,
    fontWeight: "600",
    fontSize: fontSize.sm,
  },
});
