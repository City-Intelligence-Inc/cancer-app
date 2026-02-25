import React from "react";
import { View, StyleSheet } from "react-native";
import { Slot, usePathname } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import ProgressBar from "../../components/ProgressBar";
import { colors, spacing } from "../../utils/theme";

const STEPS = ["/wizard/age", "/wizard/location", "/wizard/diagnosis", "/wizard/help-needed"];

export default function WizardLayout() {
  const pathname = usePathname();
  const currentIndex = STEPS.indexOf(pathname);
  const progress = currentIndex >= 0 ? (currentIndex + 1) / STEPS.length : 0;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.progressWrapper}>
        <ProgressBar progress={progress} />
      </View>
      <View style={styles.slot}>
        <Slot />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  progressWrapper: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  slot: {
    flex: 1,
  },
});
