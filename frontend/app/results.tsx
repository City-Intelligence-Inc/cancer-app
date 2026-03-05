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

export default function ResultsScreen() {
  const router = useRouter();
  const { answers } = useSession();
  const [sheetResources, setSheetResources] = useState<Resource[] | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  const notAvailable = answers.location === "Other / Not listed";

  useEffect(() => {
    if (notAvailable) { setLoading(false); return; }
    getSheetResources()
      .then((r) => { setSheetResources(r); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, [notAvailable]);

  const matched = useMemo(() => {
    if (!sheetResources) return [];
    return matchResources(answers, sheetResources);
  }, [answers, sheetResources]);

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Finding resources near you…</Text>
      </SafeAreaView>
    );
  }

  if (notAvailable) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.emoji}>🌍</Text>
        <Text style={styles.title}>Not available yet</Text>
        <Text style={styles.body}>
          We don't have resources for your location yet. We're adding new cities
          regularly — check back soon.
        </Text>
        <View style={{ marginTop: spacing.lg }}>
          <Button title="Start Over" variant="secondary" onPress={() => router.replace("/")} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.emoji}>⚠️</Text>
        <Text style={styles.title}>Couldn't load resources</Text>
        <Text style={styles.body}>Please check your connection and try again.</Text>
        <Button title="Go Back" variant="secondary" onPress={() => router.back()} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={matched}
        renderItem={({ item }: { item: Resource }) => <ResourceCard resource={item} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.heading}>Your Matches</Text>
            <Text style={styles.subtitle}>
              {matched.length > 0
                ? `${matched.length} resource${matched.length !== 1 ? "s" : ""} found in ${answers.location}`
                : `No resources found matching your criteria in ${answers.location}`}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <Text style={styles.empty}>
            Try adjusting your diagnosis or help type to see more results.
          </Text>
        }
        ListFooterComponent={
          <View style={styles.footer}>
            <Button title="Start Over" variant="secondary" onPress={() => router.replace("/")} />
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: {
    flex: 1, backgroundColor: colors.background,
    alignItems: "center", justifyContent: "center", padding: spacing.xl,
  },
  list: { padding: spacing.lg },
  header: { marginBottom: spacing.lg },
  heading: { fontSize: fontSize.heading, fontWeight: "700", color: colors.text, marginBottom: spacing.xs },
  subtitle: { fontSize: fontSize.body, color: colors.textSecondary, lineHeight: 24 },
  footer: { paddingTop: spacing.md, paddingBottom: spacing.xl },
  loadingText: { marginTop: spacing.md, fontSize: fontSize.body, color: colors.textSecondary },
  emoji: { fontSize: 48, marginBottom: spacing.md },
  title: { fontSize: fontSize.heading, fontWeight: "700", color: colors.text, marginBottom: spacing.sm, textAlign: "center" },
  body: { fontSize: fontSize.body, color: colors.textSecondary, textAlign: "center", lineHeight: 24, marginBottom: spacing.lg },
  empty: { fontSize: fontSize.body, color: colors.textSecondary, textAlign: "center", lineHeight: 24, paddingHorizontal: spacing.md },
});
