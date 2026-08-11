import React from "react";
import {
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from "react-native";
import {
  Colors,
  Radius,
  Spacing,
} from "../../theme";
import AppText from "./AppText";

type Props = {
  label: string;
  selected?: boolean;
  onPress: () => void;
  style?: ViewStyle;
};

export default function AppChip({
  label,
  selected = false,
  onPress,
  style,
}: Props) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[
        styles.chip,
        selected && styles.selected,
        style,
      ]}
    >
      <AppText
        variant="caption"
        color={
          selected
            ? Colors.textInverse
            : Colors.textSecondary
        }
      >
        {label}
      </AppText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    backgroundColor: Colors.surfaceSecondary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
    marginRight: Spacing.sm,
    marginBottom: Spacing.sm,
  },

  selected: {
    backgroundColor: Colors.primary,
  },
});