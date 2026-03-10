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

  useEffect(() => {
    getSheetResources()
      .then((r) => { setSheetResources(r); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, []);

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
            <View style={styles.headerActions}>
              <Button
                title="Edit Answers"
                variant="secondary"
                onPress={() => router.push("/wizard/age")}
                style={styles.headerButton}
              />
              <Button
                title="Start Over"
                variant="secondary"
                onPress={() => router.replace("/")}
                style={styles.headerButton}
              />
            </View>
          </View>
        }
        ListEmptyComponent={
          <Text style={styles.empty}>
            Try adjusting your answers to see more results.
          </Text>
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
  subtitle: { fontSize: fontSize.body, color: colors.textSecondary, lineHeight: 24, marginBottom: spacing.md },
  headerActions: { flexDirection: "row", gap: spacing.sm },
  headerButton: { flex: 1 },
  loadingText: { marginTop: spacing.md, fontSize: fontSize.body, color: colors.textSecondary },
  emoji: { fontSize: 48, marginBottom: spacing.md },
  title: { fontSize: fontSize.heading, fontWeight: "700", color: colors.text, marginBottom: spacing.sm, textAlign: "center" },
  body: { fontSize: fontSize.body, color: colors.textSecondary, textAlign: "center", lineHeight: 24, marginBottom: spacing.lg },
  empty: { fontSize: fontSize.body, color: colors.textSecondary, textAlign: "center", lineHeight: 24, paddingHorizontal: spacing.md },
});
