import React, { useMemo } from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import ResourceCard from "../components/ResourceCard";
import Button from "../components/Button";
import { useSession } from "../context/SessionContext";
import { matchResources } from "../utils/match";
import { Resource } from "../data/resources";
import { colors, fontSize, spacing } from "../utils/theme";

export default function ResultsScreen() {
  const router = useRouter();
  const { answers } = useSession();

  const matched = useMemo(() => matchResources(answers), [answers]);

  const renderItem = ({ item }: { item: Resource }) => (
    <ResourceCard resource={item} />
  );

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
});
