import { StyleSheet, Text, View } from "react-native";

import { Colors, HomeTokens, Radius, Shadows, Spacing, Typography } from "../../theme";

type StatisticsCardProps = {
  totalReports: number;
  resolvedReports: number;
  pendingReports: number;
  averageProgress: number;
};

export default function StatisticsCard({
  totalReports,
  resolvedReports,
  pendingReports,
  averageProgress,
}: StatisticsCardProps) {
  return (
    <View style={styles.statsGrid}>
      <View style={[styles.statCard, styles.statCardBlue]}>
        <View style={styles.statAccent} />

        <Text style={styles.statLabel}>
          Toplam Bildirim
        </Text>

        <Text style={styles.statValue}>
          {totalReports}
        </Text>
      </View>

      <View style={[styles.statCard, styles.statCardGreen]}>
        <View style={styles.statAccent} />

        <Text style={styles.statLabel}>
          Çözülen
        </Text>

        <Text style={styles.statValue}>
          {resolvedReports}
        </Text>
      </View>

      <View style={[styles.statCard, styles.statCardOrange]}>
        <View style={styles.statAccent} />

        <Text style={styles.statLabel}>
          Bekleyen
        </Text>

        <Text style={styles.statValue}>
          {pendingReports}
        </Text>
      </View>

      <View style={[styles.statCard, styles.statCardPurple]}>
        <View style={styles.statAccent} />

        <Text style={styles.statLabel}>
          Ortalama İlerleme
        </Text>

        <Text style={styles.statValue}>
          %{Math.round(averageProgress)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: HomeTokens.sectionMarginBottom,
  },

  statCard: {
    width: "48%",
    borderRadius: Radius.xl,
    padding: Spacing.lg + 2,
    marginBottom: HomeTokens.sectionHeaderMarginBottom,
    ...Shadows.sm,
    overflow: "hidden",
  },

  statAccent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },

  statCardBlue: {
    backgroundColor: Colors.statCard.blue,
  },

  statCardGreen: {
    backgroundColor: Colors.statCard.green,
  },

  statCardOrange: {
    backgroundColor: Colors.statCard.orange,
  },

  statCardPurple: {
    backgroundColor: Colors.statCard.purple,
  },

  statLabel: {
    ...Typography.label,
    color: Colors.textMuted,
  },

  statValue: {
    marginTop: Spacing.sm,
    ...Typography.titleLarge,
    color: Colors.text,
  },
});
