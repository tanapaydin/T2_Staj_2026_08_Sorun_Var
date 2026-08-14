import React from "react";
import {
  View,
  StyleSheet,
  ViewStyle,
} from "react-native";
import {
  Colors,
  Radius,
  Spacing,
  Shadows,
} from "../../theme";

type Props = {
  children: React.ReactNode;
  style?: ViewStyle;
};

export default function AppCard({
  children,
  style,
}: Props) {
  return (
    <View style={[styles.card, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    ...Shadows.lg,
  },
});
