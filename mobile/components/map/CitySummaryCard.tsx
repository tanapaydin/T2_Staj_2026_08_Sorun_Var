import React from "react";
import { StyleSheet } from "react-native";

import {
  AppButton,
  AppCard,
  AppText,
} from "../common";

import { Spacing } from "../../theme";

type Props = {
  city: {
    name: string;
    count: number;
  } | null;
  onClose: () => void;
};

export default function CitySummaryCard({
  city,
  onClose,
}: Props) {
  if (!city) return null;

  return (
    <AppCard style={styles.container}>
      <AppText variant="title" style={styles.title}>
        {city.name}
      </AppText>

      <AppText variant="bodyMedium">
        Toplam Şikayet
      </AppText>

      <AppText style={styles.count}>
        {city.count}
      </AppText>

      <AppButton
        title="Kapat"
        onPress={onClose}
        style={styles.button}
      />
    </AppCard>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
  },

  title: {
    marginBottom: Spacing.lg,
  },

  count: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
    fontSize: 28,
    fontWeight: "800",
  },

  button: {
    marginTop: Spacing.md,
  },
});