import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "../components/Button";
import { useSession } from "../context/SessionContext";
import { colors, fontSize, spacing } from "../utils/theme";

export default function WelcomeScreen() {
  const router = useRouter();
  const { startSession } = useSession();
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    setLoading(true);
    try {
      await startSession();
      router.push("/wizard/age");
    } catch {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.emoji}>💚</Text>
          <Text style={styles.title}>Find Support{"\n"}That Fits You</Text>
          <Text style={styles.subtitle}>
            Answer a few quick questions and we'll match you with cancer support
            resources tailored to your needs.
          </Text>
        </View>

        <View style={styles.features}>
          {[
            ["🔒", "Private & anonymous"],
            ["⚡", "Takes under 2 minutes"],
            ["🎯", "Personalized matches"],
          ].map(([icon, text]) => (
            <View key={text} style={styles.featureRow}>
              <Text style={styles.featureIcon}>{icon}</Text>
              <Text style={styles.featureText}>{text}</Text>
            </View>
          ))}
        </View>

        <Button
          title="Get Started"
          onPress={handleStart}
          loading={loading}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: "center",
  },
  hero: {
    alignItems: "center",
    marginBottom: spacing.xxl,
  },
  emoji: {
    fontSize: 56,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.text,
    textAlign: "center",
    lineHeight: 40,
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: fontSize.body,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: spacing.md,
  },
  features: {
    marginBottom: spacing.xxl,
    gap: spacing.md,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: 12,
    gap: spacing.md,
  },
  featureIcon: {
    fontSize: 20,
  },
  featureText: {
    fontSize: fontSize.body,
    color: colors.text,
    fontWeight: "500",
  },
});
