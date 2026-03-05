import React, { useEffect, useMemo, useState } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import ResourceCard from "../components/ResourceCard";
import Button from "../components/Button";
import { useSession } from "../context/SessionContext";
import { matchResources } from "../utils/match";
import { Resource } from "../data/resources";
import { getSheetResources } from "../services/api";
import { colors, fontSize, spacing } from "../utils/theme";

const UK_TERMS = [
  "uk", "united kingdom", "england", "scotland", "wales",
  "northern ireland", "london", "manchester", "birmingham",
  "leeds", "liverpool", "bristol", "sheffield", "edinburgh",
  "glasgow", "cardiff", "belfast", "oxford", "cambridge",
];

function isUKLocation(location?: string): boolean {
  if (!location) return false;
  const loc = location.toLowerCase().trim();
  return UK_TERMS.some((term) => loc.includes(term));
}

export default function ResultsScreen() {
  const router = useRouter();
  const { answers } = useSession();
  const [sheetResources, setSheetResources] = useState<Resource[] | null>(null);
  const [sheetError, setSheetError] = useState(false);
  const [loading, setLoading] = useState(true);

  const ukLocation = isUKLocation(answers.location);

  useEffect(() => {
    if (!ukLocation) {
      setLoading(false);
      return;
    }
    getSheetResources()
      .then((r) => {
        setSheetResources(r);
        setLoading(false);
      })
      .catch(() => {
        setSheetError(true);
        setLoading(false);
      });
  }, [ukLocation]);

  const matched = useMemo(() => {
    if (ukLocation) {
      if (!sheetResources) return [];
      return matchResources(answers, sheetResources);
    }
    return matchResources(answers);
  }, [answers, ukLocation, sheetResources]);

  const renderItem = ({ item }: { item: Resource }) => (
    <ResourceCard resource={item} />
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Finding resources near you…</Text>
      </SafeAreaView>
    );
  }

  if (ukLocation && sheetError) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.errorEmoji}>⚠️</Text>
        <Text style={styles.errorTitle}>Couldn't load resources</Text>
        <Text style={styles.errorBody}>
          We had trouble fetching live data. Please try again.
        </Text>
        <Button title="Go Back" variant="secondary" onPress={() => router.back()} />
      </SafeAreaView>
    );
  }

  if (!ukLocation) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.errorEmoji}>🌍</Text>
        <Text style={styles.errorTitle}>Not available yet</Text>
        <Text style={styles.errorBody}>
          We currently have resources for the UK. Support for{" "}
          {answers.location ? `"${answers.location}"` : "your location"} is
          coming soon.
        </Text>
        <View style={{ marginTop: spacing.lg }}>
          <Button title="Start Over" variant="secondary" onPress={() => router.replace("/")} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={matched}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.heading}>Your Matches</Text>
            <Text style={styles.subtitle}>
              We found {matched.length} resource{matched.length !== 1 ? "s" : ""}{" "}
              based on your answers.
            </Text>
          </View>
        }
        ListFooterComponent={
          <View style={styles.footer}>
            <Button
              title="Start Over"
              variant="secondary"
              onPress={() => router.replace("/")}
            />
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  list: {
    padding: spacing.lg,
  },
  header: {
    marginBottom: spacing.lg,
  },
  heading: {
    fontSize: fontSize.heading,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.body,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  footer: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: fontSize.body,
    color: colors.textSecondary,
  },
  errorEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  errorTitle: {
    fontSize: fontSize.heading,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  errorBody: {
    fontSize: fontSize.body,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
});
