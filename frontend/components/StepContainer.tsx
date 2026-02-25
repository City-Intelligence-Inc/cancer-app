import React from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import Button from "./Button";
import { colors, fontSize, spacing } from "../utils/theme";

interface StepContainerProps {
  heading: string;
  description: string;
  children: React.ReactNode;
  onNext: () => void | Promise<void>;
  nextLabel?: string;
  nextDisabled?: boolean;
  loading?: boolean;
  showBack?: boolean;
}

export default function StepContainer({
  heading,
  description,
  children,
  onNext,
  nextLabel = "Next",
  nextDisabled = false,
  loading = false,
  showBack = true,
}: StepContainerProps) {
  const router = useRouter();

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={100}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.heading}>{heading}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>

        <View style={styles.body}>{children}</View>

        <View style={styles.buttons}>
          {showBack && (
            <Button
              title="Back"
              variant="secondary"
              onPress={() => router.back()}
              style={styles.backButton}
            />
          )}
          <Button
            title={nextLabel}
            onPress={onNext}
            disabled={nextDisabled}
            loading={loading}
            style={styles.nextButton}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  header: {
    marginBottom: spacing.xl,
  },
  heading: {
    fontSize: fontSize.heading,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: fontSize.body,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  body: {
    flex: 1,
  },
  buttons: {
    flexDirection: "row",
    gap: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  backButton: {
    flex: 1,
  },
  nextButton: {
    flex: 2,
  },
});
