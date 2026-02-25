import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { colors, fontSize, radius, spacing, MIN_TOUCH_TARGET } from "../utils/theme";

interface SelectableChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

export default function SelectableChip({
  label,
  selected,
  onPress,
}: SelectableChipProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.chip, selected && styles.selected]}
    >
      <Text style={[styles.label, selected && styles.selectedLabel]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: MIN_TOUCH_TARGET,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.full,
    backgroundColor: colors.chipBg,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  selected: {
    backgroundColor: colors.chipSelected,
    borderColor: colors.chipSelected,
  },
  label: {
    fontSize: fontSize.body,
    color: colors.text,
    fontWeight: "500",
  },
  selectedLabel: {
    color: colors.chipSelectedText,
  },
});
