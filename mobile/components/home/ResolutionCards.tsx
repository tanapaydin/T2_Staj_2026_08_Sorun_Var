import { StyleSheet, Text, View } from "react-native";

import { Colors } from "../../theme/colors";

type ResolutionCardProps = {
  resolutionRate: number;
  resolvedReports: number;
  pendingReports: number;
};

export default function ResolutionCard({
  resolutionRate,
  resolvedReports,
  pendingReports,
}: ResolutionCardProps) {
  const safeResolutionRate = Math.min(
    Math.max(resolutionRate, 0),
    100
  );

  return (
    <View style={styles.section}>
      <View style={styles.resolutionCard}>
        <View style={styles.resolutionHeader}>
          <View>
            <Text style={styles.resolutionTitle}>
              Çözüm Durumu
            </Text>

            <Text style={styles.resolutionSubtitle}>
              Bildirimlerin ne kadarı çözüldü?
            </Text>
          </View>

          <Text style={styles.resolutionValue}>
            %{Math.round(resolutionRate)}
          </Text>
        </View>

        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${safeResolutionRate}%`,
              },
            ]}
          />
        </View>

        <View style={styles.resolutionFooter}>
          <Text style={styles.resolutionFooterText}>
            {resolvedReports} çözülen
          </Text>

          <Text style={styles.resolutionFooterText}>
            {pendingReports} bekleyen
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 28,
  },

  resolutionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    elevation: 2,
  },

  resolutionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  resolutionTitle: {
    color: "#0F172A",
    fontSize: 17,
    fontWeight: "800",
  },

  resolutionSubtitle: {
    color: "#64748B",
    fontSize: 13,
    marginTop: 3,
  },

  resolutionValue: {
    color: Colors.resolution.text,
    fontSize: 24,
    fontWeight: "800",
  },

  progressTrack: {
    height: 10,
    backgroundColor: Colors.resolution.track,
    borderRadius: 999,
    overflow: "hidden",
    marginTop: 18,
  },

  progressFill: {
    height: "100%",
    backgroundColor: "#86C99E",
    borderRadius: 999,
  },

  resolutionFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },

  resolutionFooterText: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "600",
  },
});