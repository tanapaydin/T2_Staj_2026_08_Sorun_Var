import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import Svg, { Circle, G, Path } from "react-native-svg";

import { MapOverview } from "../../lib/api";
import {
  Colors,
  Radius,
  Shadows,
  Spacing,
  Typography,
} from "../../theme";
import { AppButton, AppText } from "../common";

type Props = {
  visible: boolean;
  overview: MapOverview | null;
  loading: boolean;
  onClose: () => void;
};

type PieItem = {
  name: string;
  count: number;
  color: string;
};

const pieColors = [
  Colors.primary,
  Colors.category.road,
  Colors.category.trash,
  Colors.category.lighting,
  Colors.category.traffic,
  Colors.category.water,
  Colors.category.construction,
];

export default function MapOverviewCard({
  visible,
  overview,
  loading,
  onClose,
}: Props) {
  const [expandedCity, setExpandedCity] = useState<string | null>(null);
  const pieItems = useMemo(
    () => buildPieItems(overview),
    [overview]
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Özeti kapat"
          style={styles.backdrop}
          onPress={onClose}
        />

        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <AppText variant="title">Harita genel özeti</AppText>
              <AppText variant="caption" color={Colors.textSecondary}>
                Şikayetlerin şehirlere göre dağılımı
              </AppText>
            </View>

            <View style={styles.totalBadge}>
              <AppText style={styles.totalNumber}>
                {overview?.total_reports ?? 0}
              </AppText>
              <AppText style={styles.totalLabel}>şikayet</AppText>
            </View>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <AppText color={Colors.textSecondary} style={styles.loadingText}>
                Özet hazırlanıyor...
              </AppText>
            </View>
          ) : (
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
            >
              <CityPieChart
                items={pieItems}
                total={overview?.total_reports ?? 0}
              />

              <View style={styles.listHeader}>
                <AppText style={styles.sectionTitle}>İllere göre şikayetler</AppText>
                <AppText variant="caption" color={Colors.textMuted}>
                  İlçeleri görmek için bir ile dokunun
                </AppText>
              </View>

              {overview && overview.cities.length > 0 ? (
                overview.cities.map((city) => {
                  const expanded = expandedCity === city.city;

                  return (
                    <View key={city.city} style={styles.cityContainer}>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityState={{ expanded }}
                        onPress={() =>
                          setExpandedCity((current) =>
                            current === city.city ? null : city.city
                          )
                        }
                        style={({ pressed }) => [
                          styles.cityRow,
                          expanded && styles.cityRowExpanded,
                          pressed && styles.rowPressed,
                        ]}
                      >
                        <AppText
                          variant="bodyMedium"
                          style={styles.cityName}
                          numberOfLines={1}
                        >
                          {city.city}
                        </AppText>
                        <AppText style={styles.cityCount}>{city.count}</AppText>
                      </Pressable>

                      {expanded && (
                        <View style={styles.districtList}>
                          {city.districts.map((district) => (
                            <View
                              key={`${city.city}-${district.district}`}
                              style={styles.districtRow}
                            >
                              <View style={styles.districtDot} />
                              <AppText
                                variant="caption"
                                color={Colors.textSecondary}
                                style={styles.districtName}
                                numberOfLines={1}
                              >
                                {district.district}
                              </AppText>
                              <AppText variant="caption" style={styles.districtCount}>
                                {district.count}
                              </AppText>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  );
                })
              ) : (
                <AppText color={Colors.textSecondary} style={styles.emptyText}>
                  Bildirim bulunmuyor.
                </AppText>
              )}
            </ScrollView>
          )}

          <AppButton title="Kapat" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

function CityPieChart({
  items,
  total,
}: {
  items: PieItem[];
  total: number;
}) {
  const size = 190;
  const center = size / 2;
  const radius = 72;
  const strokeWidth = 30;
  let currentAngle = 0;

  return (
    <View style={styles.chartCard} pointerEvents="none">
      <View style={styles.chartWrapper}>
        {total === 0 ? (
          <AppText color={Colors.textMuted}>Henüz şikayet yok</AppText>
        ) : (
          <>
            <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
              <G>
                {items.map((item) => {
                  const angle = (item.count / total) * 360;
                  const startAngle = currentAngle;
                  const endAngle = currentAngle + angle;
                  currentAngle = endAngle;

                  if (angle >= 359.9) {
                    return (
                      <Circle
                        key={item.name}
                        cx={center}
                        cy={center}
                        r={radius}
                        fill="none"
                        stroke={item.color}
                        strokeWidth={strokeWidth}
                      />
                    );
                  }

                  return (
                    <Path
                      key={item.name}
                      d={describeArc(
                        center,
                        center,
                        radius,
                        startAngle,
                        endAngle
                      )}
                      fill={item.color}
                    />
                  );
                })}

                <Circle
                  cx={center}
                  cy={center}
                  r={radius - strokeWidth / 2}
                  fill={Colors.surface}
                />
              </G>
            </Svg>

            <View style={styles.chartCenter}>
              <AppText style={styles.chartTotal}>{total}</AppText>
              <AppText style={styles.chartLabel}>şikayet</AppText>
            </View>
          </>
        )}
      </View>

      {items.map((item) => (
        <View key={item.name} style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: item.color }]} />
          <AppText
            variant="caption"
            color={Colors.textSecondary}
            style={styles.legendName}
            numberOfLines={1}
          >
            {item.name}
          </AppText>
          <AppText variant="caption" style={styles.legendCount}>
            {item.count}
          </AppText>
        </View>
      ))}
    </View>
  );
}

function buildPieItems(overview: MapOverview | null): PieItem[] {
  if (!overview || overview.cities.length === 0) {
    return [];
  }

  const visibleCities = overview.cities.slice(0, 6);
  const remainingCount = overview.cities
    .slice(6)
    .reduce((sum, city) => sum + city.count, 0);
  const items: PieItem[] = visibleCities.map((city, index) => ({
    name: city.city,
    count: city.count,
    color: pieColors[index % pieColors.length],
  }));

  if (remainingCount > 0) {
    items.push({
      name: "Diğer iller",
      count: remainingCount,
      color: Colors.category.other,
    });
  }

  return items;
}

function polarToCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number
) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;

  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

function describeArc(
  centerX: number,
  centerY: number,
  radius: number,
  startAngle: number,
  endAngle: number
) {
  const start = polarToCartesian(centerX, centerY, radius, endAngle);
  const end = polarToCartesian(centerX, centerY, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  return [
    "M",
    centerX,
    centerY,
    "L",
    start.x,
    start.y,
    "A",
    radius,
    radius,
    0,
    largeArcFlag,
    0,
    end.x,
    end.y,
    "Z",
  ].join(" ");
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: Colors.overlay,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    maxHeight: "88%",
    padding: Spacing.xl,
    borderTopLeftRadius: Radius.xxl,
    borderTopRightRadius: Radius.xxl,
    backgroundColor: Colors.background,
    ...Shadows.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerText: {
    flex: 1,
    gap: Spacing.xs,
  },
  totalBadge: {
    minWidth: 68,
    marginLeft: Spacing.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    alignItems: "center",
    borderRadius: Radius.lg,
    backgroundColor: Colors.primaryLight,
  },
  totalNumber: {
    color: Colors.primary,
    fontSize: 20,
    fontWeight: "800",
  },
  totalLabel: {
    color: Colors.primaryDark,
    ...Typography.meta,
  },
  loadingContainer: {
    minHeight: 300,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: Spacing.md,
  },
  scroll: {
    flexGrow: 0,
    marginVertical: Spacing.md,
  },
  scrollContent: {
    paddingBottom: Spacing.lg,
  },
  chartCard: {
    padding: Spacing.lg,
    borderRadius: Radius.xxl,
    backgroundColor: Colors.surface,
    ...Shadows.sm,
  },
  chartWrapper: {
    height: 190,
    alignItems: "center",
    justifyContent: "center",
  },
  chartCenter: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  chartTotal: {
    ...Typography.titleLarge,
    color: Colors.text,
  },
  chartLabel: {
    ...Typography.meta,
    color: Colors.textMuted,
    marginTop: -2,
  },
  legendRow: {
    minHeight: 28,
    flexDirection: "row",
    alignItems: "center",
  },
  legendDot: {
    width: 9,
    height: 9,
    marginRight: Spacing.sm,
    borderRadius: Radius.xs,
  },
  legendName: {
    flex: 1,
  },
  legendCount: {
    color: Colors.text,
    fontWeight: "800",
  },
  listHeader: {
    marginTop: Spacing.xxl,
    marginBottom: Spacing.md,
    gap: Spacing.xs,
  },
  sectionTitle: {
    ...Typography.heading,
    color: Colors.text,
  },
  cityContainer: {
    marginBottom: Spacing.sm,
  },
  cityRow: {
    minHeight: 48,
    paddingHorizontal: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surface,
  },
  cityRowExpanded: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  rowPressed: {
    opacity: 0.75,
  },
  cityName: {
    flex: 1,
    marginRight: Spacing.md,
  },
  cityCount: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: "800",
  },
  districtList: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: Colors.primary,
    borderBottomLeftRadius: Radius.lg,
    borderBottomRightRadius: Radius.lg,
    backgroundColor: Colors.surface,
  },
  districtRow: {
    minHeight: 34,
    flexDirection: "row",
    alignItems: "center",
  },
  districtDot: {
    width: 6,
    height: 6,
    marginRight: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
  },
  districtName: {
    flex: 1,
    marginRight: Spacing.md,
  },
  districtCount: {
    color: Colors.text,
    fontWeight: "800",
  },
  emptyText: {
    paddingVertical: Spacing.xl,
    textAlign: "center",
  },
});
