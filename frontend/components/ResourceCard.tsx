import React from "react";
import { View, Text, StyleSheet, Linking, TouchableOpacity } from "react-native";
import { Resource } from "../data/resources";
import { colors, fontSize, radius, spacing } from "../utils/theme";

interface ResourceCardProps {
  resource: Resource;
}

export default function ResourceCard({ resource }: ResourceCardProps) {
  const locationLabel = resource.entireCountry
    ? "Available UK-wide"
    : resource.cities.length > 0
    ? resource.cities.join(", ")
    : resource.countries.length > 0
    ? resource.countries.join(", ")
    : null;

  const cancerLabel =
    resource.diagnoses.length > 0 ? resource.diagnoses.join(", ") : null;

  const eligibilityLabel =
    resource.patientCarer === "Both"
      ? "Patients & Carers"
      : resource.patientCarer === "Patient"
      ? "Patients only"
      : "Carers only";

  return (
    <View style={styles.card}>
      <Text style={styles.name}>{resource.name}</Text>
      <Text style={styles.description}>{resource.description}</Text>

      <View style={styles.meta}>
        <Text style={styles.metaText}>{locationLabel}</Text>
        <Text style={styles.metaDot}> · </Text>
        <Text style={styles.metaText}>{eligibilityLabel}</Text>
      </View>

      {cancerLabel && (
        <Text style={styles.cancerText}>{cancerLabel}</Text>
      )}

      <View style={styles.tags}>
        {resource.helpTypes.map((t) => (
          <View key={t} style={styles.tag}>
            <Text style={styles.tagText}>{t}</Text>
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          onPress={() => Linking.openURL(resource.url)}
          style={styles.link}
        >
          <Text style={styles.linkText}>Visit Website</Text>
        </TouchableOpacity>
        {resource.phone && (
          <TouchableOpacity
            onPress={() => Linking.openURL(`tel:${resource.phone}`)}
            style={styles.link}
          >
            <Text style={styles.linkText}>{resource.phone}</Text>
          </TouchableOpacity>
        )}
        {resource.contact && !resource.phone && (
          <Text style={styles.contactText}>{resource.contact}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  name: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  metaText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  metaDot: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  cancerText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: spacing.md,
  },
  tag: {
    backgroundColor: colors.chipBg,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  tagText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: "600",
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  link: {
    paddingVertical: spacing.xs,
  },
  linkText: {
    fontSize: fontSize.sm,
    color: colors.accent,
    fontWeight: "600",
  },
  contactText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    paddingVertical: spacing.xs,
  },
});
