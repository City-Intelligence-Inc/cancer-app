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
import { getSheetCities } from "../../services/api";
import { colors, fontSize, radius, spacing } from "../../utils/theme";

export default function LocationStep() {
  const router = useRouter();
  const { answers, saveAnswer } = useSession();
  const [query, setQuery] = useState(answers.location ?? "");
  const [loading, setLoading] = useState(false);
  const [sheetCities, setSheetCities] = useState<string[]>([]);
  const [citiesLoading, setCitiesLoading] = useState(true);

  useEffect(() => {
    getSheetCities()
      .then(setSheetCities)
      .catch(() => setSheetCities([]))
      .finally(() => setCitiesLoading(false));
  }, []);

  // Find exact case-insensitive match in the database
  const matchedCity = useMemo(
    () => sheetCities.find((c) => c.toLowerCase() === query.trim().toLowerCase()),
    [query, sheetCities]
  );

  // Dropdown suggestions — only when no exact match yet
  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || matchedCity) return [];
    return sheetCities.filter((c) => c.toLowerCase().startsWith(q));
  }, [query, sheetCities, matchedCity]);

  const isValid = !!matchedCity;

  const handleSelect = (city: string) => {
    setQuery(city);
  };

  const handleNext = async () => {
    if (!matchedCity) return;
    setLoading(true);
    try {
      await saveAnswer("location", matchedCity);
      router.push("/wizard/diagnosis");
    } finally {
      setLoading(false);
    }
  };

  return (
    <StepContainer
      heading="Where are you located?"
      description="Type your city and select it from the list below."
      onNext={handleNext}
      nextDisabled={!isValid}
      loading={loading}
    >
      <View style={styles.container}>
        <TextInput
          style={[styles.input, isValid && styles.inputSelected]}
          value={query}
          onChangeText={setQuery}
          placeholder="e.g. London"
          placeholderTextColor={colors.textSecondary}
          autoFocus
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="done"
        />

        {citiesLoading && (
          <ActivityIndicator
            size="small"
            color={colors.primary}
            style={styles.spinner}
          />
        )}

        {suggestions.length > 0 && (
          <View style={styles.dropdown}>
            {suggestions.map((city, index) => (
              <TouchableOpacity
                key={city}
                style={[
                  styles.item,
                  index === suggestions.length - 1 && styles.itemLast,
                ]}
                onPress={() => handleSelect(city)}
                activeOpacity={0.7}
              >
                <Text style={styles.itemText}>{city}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {isValid && (
          <View style={styles.selectedBadge}>
            <Text style={styles.selectedBadgeText}>✓ {matchedCity}</Text>
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
  itemText: {
    fontSize: fontSize.body,
    color: colors.text,
    fontWeight: "500",
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
