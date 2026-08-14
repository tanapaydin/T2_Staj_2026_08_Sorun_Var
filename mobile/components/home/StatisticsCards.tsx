import { StyleSheet, Text, View } from "react-native";

import { Colors } from "../../theme/colors";

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
    marginBottom: 28,
  },

  statCard: {
    width: "48%",
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    elevation: 1,
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
    color: "#64748B",
    fontSize: 13,
    fontWeight: "600",
  },

  statValue: {
    marginTop: 8,
    fontSize: 28,
    fontWeight: "800",
    color: "#0F172A",
  },
});