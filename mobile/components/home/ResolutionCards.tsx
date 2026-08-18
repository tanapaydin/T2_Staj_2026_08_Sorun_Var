import { StyleSheet, Text, View } from "react-native";

import { Colors, HomeTokens, Radius, Shadows, Spacing, Typography } from "../../theme";

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
    marginBottom: HomeTokens.sectionMarginBottom,
  },

  resolutionCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xxl,
    padding: Spacing.xl,
    ...Shadows.sm,
  },

  resolutionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  resolutionTitle: {
    ...Typography.heading,
    color: Colors.text,
  },

  resolutionSubtitle: {
    ...Typography.label,
    color: Colors.textMuted,
    marginTop: 3,
  },

  resolutionValue: {
    color: Colors.resolution.text,
    ...Typography.titleLarge,
  },

  progressTrack: {
    height: 10,
    backgroundColor: Colors.resolution.track,
    borderRadius: Radius.full,
    overflow: "hidden",
    marginTop: Spacing.lg + 2,
  },

  progressFill: {
    height: "100%",
    backgroundColor: Colors.resolution.fill,
    borderRadius: Radius.full,
  },

  resolutionFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: Spacing.sm,
  },

  resolutionFooterText: {
    ...Typography.meta,
    color: Colors.textMuted,
    fontWeight: "600",
  },
});
