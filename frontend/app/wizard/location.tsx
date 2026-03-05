import React, { useState, useMemo } from "react";
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import StepContainer from "../../components/StepContainer";
import { useSession } from "../../context/SessionContext";
import { CITIES } from "../../data/resources";
import { colors, fontSize, radius, spacing } from "../../utils/theme";

const OTHER = "Other / Not listed";

export default function LocationStep() {
  const router = useRouter();
  const { answers, saveAnswer } = useSession();
  const [query, setQuery] = useState(answers.location ?? "");
  const [selected, setSelected] = useState(answers.location ?? "");
  const [loading, setLoading] = useState(false);

  // Filter cities by query; always append "Other / Not listed" at bottom
  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const matches = CITIES.filter((c) =>
      c.toLowerCase().startsWith(q)
    ) as string[];
    if (!matches.includes(OTHER)) matches.push(OTHER);
    return matches;
  }, [query]);

  const isValid = selected.length > 0 && query === selected;

  const handleSelect = (city: string) => {
    setSelected(city);
    setQuery(city);
  };

  const handleChangeText = (text: string) => {
    setQuery(text);
    setSelected(""); // clear selection when user keeps typing
  };

  const handleNext = async () => {
    if (!isValid) return;
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
      description="Type your city and select it from the list below."
      onNext={handleNext}
      nextDisabled={!isValid}
      loading={loading}
    >
      <View style={styles.container}>
        <TextInput
          style={[styles.input, isValid && styles.inputSelected]}
          value={query}
          onChangeText={handleChangeText}
          placeholder="e.g. London"
          placeholderTextColor={colors.textSecondary}
          autoFocus
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="done"
        />

        {suggestions.length > 0 && !isValid && (
          <View style={styles.dropdown}>
            {suggestions.map((city, index) => (
              <TouchableOpacity
                key={city}
                style={[
                  styles.item,
                  index === suggestions.length - 1 && styles.itemLast,
                  city === OTHER && styles.itemOther,
                ]}
                onPress={() => handleSelect(city)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.itemText,
                    city === OTHER && styles.itemTextOther,
                  ]}
                >
                  {city}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {isValid && (
          <View style={styles.selectedBadge}>
            <Text style={styles.selectedBadgeText}>✓ {selected}</Text>
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
