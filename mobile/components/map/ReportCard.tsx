import React from "react";
import { View, StyleSheet } from "react-native";
import { Report } from "../../types/report";
import { getCategoryLabel } from "../../utils/map";

import {
  AppButton,
  AppCard,
  AppText,
} from "../common";

import {
  Colors,
  Spacing,
} from "../../theme";

type Props = {
  report: Report | null;
  onClose: () => void;
};

function getPriorityLabel(priority?: string) {
  switch (priority) {
    case "high":
      return "Yüksek";
    case "medium":
      return "Orta";
    case "low":
      return "Düşük";
    default:
      return "Belirtilmemiş";
  }
}

export default function ReportCard({
  report,
  onClose,
}: Props) {
  if (!report) return null;

  return (
    <AppCard style={styles.bottomCard}>
      <AppText variant="title" style={styles.cardTitle}>
        {report.title}
      </AppText>

      <View style={styles.infoGroup}>
        <AppText variant="bodyMedium">
          Kategori
        </AppText>
        <AppText color={Colors.textSecondary}>
          {getCategoryLabel(report.category)}
        </AppText>
      </View>

      <View style={styles.infoGroup}>
        <AppText variant="bodyMedium">
          Durum
        </AppText>
        <AppText color={Colors.textSecondary}>
          {report.status}
        </AppText>
      </View>

      <View style={styles.infoGroup}>
        <AppText variant="bodyMedium">
          Öncelik
        </AppText>
        <AppText color={Colors.textSecondary}>
          {getPriorityLabel(report.priority)}
        </AppText>
      </View>

      <View style={styles.infoGroup}>
        <AppText variant="bodyMedium">
          Görüntülenme
        </AppText>
        <AppText color={Colors.textSecondary}>
          {report.view_count}
        </AppText>
      </View>

      <AppButton
        title="Kapat"
        onPress={onClose}
        style={styles.closeButton}
      />
    </AppCard>
  );
}

const styles = StyleSheet.create({
  bottomCard: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
  },

  cardTitle: {
    marginBottom: Spacing.lg,
  },

  infoGroup: {
    marginBottom: Spacing.md,
  },

  closeButton: {
    marginTop: Spacing.lg,
  },
});