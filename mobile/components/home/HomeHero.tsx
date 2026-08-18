import { StyleSheet, Text, View } from "react-native";

import { Colors, HomeTokens, Shadows, Spacing, Typography } from "../../theme";

type HomeHeroProps = {
  totalReports: number;
  resolutionRate: number;
};

export default function HomeHero({
  totalReports,
  resolutionRate,
}: HomeHeroProps) {
  return (
    <View style={styles.hero}>
      <View style={styles.content}>
        <Text style={styles.title}>Sorun Var</Text>
        <Text style={styles.subtitle}>
          Şehrinizdeki sorunları takip edin, değişimi birlikte görün.
        </Text>

        <View style={styles.stats}>
          <View>
            <Text style={styles.number}>{totalReports}</Text>
            <Text style={styles.label}>toplam bildirim</Text>
          </View>

          <View style={styles.divider} />

          <View>
            <Text style={styles.number}>%{Math.round(resolutionRate)}</Text>
            <Text style={styles.label}>çözüm oranı</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: Colors.heroBackground,
    borderRadius: HomeTokens.heroRadius,
    marginBottom: Spacing.xl,
    overflow: "hidden",
    ...Shadows.md,
  },
  content: {
    padding: HomeTokens.heroPadding,
  },
  title: {
    ...Typography.display,
    color: Colors.heroText,
  },
  subtitle: {
    ...Typography.subtitle,
    color: Colors.textMuted,
    marginTop: 6,
    maxWidth: 320,
  },
  stats: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: HomeTokens.heroStatsMarginTop,
  },
  number: {
    ...Typography.titleLarge,
    color: Colors.primary,
  },
  label: {
    ...Typography.meta,
    color: Colors.textMuted,
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: HomeTokens.heroDividerHeight,
    backgroundColor: Colors.heroDivider,
    marginHorizontal: HomeTokens.heroDividerMargin,
  },
});
