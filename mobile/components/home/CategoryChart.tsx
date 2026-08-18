import { StyleSheet, Text, View } from "react-native";
import Svg, {
  Circle,
  G,
  Path,
} from "react-native-svg";

import { CategoryStatistics } from "../../lib/api";
import { Colors, Radius, Shadows, Spacing, Typography } from "../../theme";

const categoryLabels: Record<string, string> = {
  road: "Yol",
  trash: "Çöp",
  lighting: "Aydınlatma",
  construction: "İnşaat",
  water: "Su",
  park: "Park",
  traffic: "Trafik",
  noise: "Gürültü",
  animal: "Hayvan",
  other: "Diğer",
};

const categoryColors: Record<string, string> = {
  ...Colors.category,
};

function polarToCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number
) {
  const angleInRadians =
    ((angleInDegrees - 90) * Math.PI) / 180;

  return {
    x:
      centerX +
      radius * Math.cos(angleInRadians),
    y:
      centerY +
      radius * Math.sin(angleInRadians),
  };
}

function describeArc(
  centerX: number,
  centerY: number,
  radius: number,
  startAngle: number,
  endAngle: number
) {
  const start = polarToCartesian(
    centerX,
    centerY,
    radius,
    endAngle
  );

  const end = polarToCartesian(
    centerX,
    centerY,
    radius,
    startAngle
  );

  const largeArcFlag =
    endAngle - startAngle <= 180
      ? "0"
      : "1";

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

type CategoryChartProps = {
  categories: CategoryStatistics[];
  total: number;
};

export default function CategoryChart({
  categories,
  total,
}: CategoryChartProps) {
  const size = 190;
  const center = size / 2;
  const radius = 72;
  const strokeWidth = 30;

  let currentAngle = 0;

  return (
    <View style={styles.categoryCard}>
      <View style={styles.chartWrapper}>
        {total === 0 ? (
          <View style={styles.chartEmpty}>
            <Text style={styles.chartEmptyText}>
              Henüz bildirim yok
            </Text>
          </View>
        ) : (
          <>
            <Svg
              width={size}
              height={size}
              viewBox={`0 0 ${size} ${size}`}
            >
              <G>
                {categories.map((category) => {
                  const percentage =
                    category.count / total;

                  const angle =
                    percentage * 360;

                  const startAngle =
                    currentAngle;

                  const endAngle =
                    currentAngle + angle;

                  currentAngle = endAngle;

                  const color =
                    categoryColors[
                      category.category
                    ] ?? Colors.category.other;

                  if (angle >= 359.9) {
                    return (
                      <Circle
                        key={category.category}
                        cx={center}
                        cy={center}
                        r={radius}
                        fill="none"
                        stroke={color}
                        strokeWidth={
                          strokeWidth
                        }
                      />
                    );
                  }

                  return (
                    <Path
                      key={category.category}
                      d={describeArc(
                        center,
                        center,
                        radius,
                        startAngle,
                        endAngle
                      )}
                      fill={color}
                    />
                  );
                })}

                <Circle
                  cx={center}
                  cy={center}
                  r={
                    radius -
                    strokeWidth / 2
                  }
                  fill={Colors.surface}
                />
              </G>
            </Svg>

            <View style={styles.chartCenter}>
              <Text style={styles.chartTotal}>
                {total}
              </Text>

              <Text
                style={
                  styles.chartCenterLabel
                }
              >
                bildirim
              </Text>
            </View>
          </>
        )}
      </View>

      {total > 0 && (
        <View style={styles.categoryLegend}>
          {categories.map((category) => (
            <View
              key={category.category}
              style={styles.legendRow}
            >
              <View
                style={[
                  styles.legendDot,
                  {
                    backgroundColor:
                      categoryColors[
                        category.category
                      ] ?? Colors.category.other,
                  },
                ]}
              />

              <Text
                style={styles.legendLabel}
                numberOfLines={1}
              >
                {categoryLabels[
                  category.category
                ] ?? category.category}
              </Text>

              <Text
                style={styles.legendCount}
              >
                {category.count}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  categoryCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xxl,
    padding: Spacing.lg + 2,
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

  chartCenterLabel: {
    ...Typography.meta,
    color: Colors.textMuted,
    marginTop: -2,
  },

  chartEmpty: {
    height: 190,
    alignItems: "center",
    justifyContent: "center",
  },

  chartEmptyText: {
    color: Colors.category.other,
    fontWeight: "600",
  },

  categoryLegend: {
    marginTop: 8,
  },

  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  legendDot: {
    width: 9,
    height: 9,
    borderRadius: Radius.xs,
    marginRight: 9,
  },

  legendLabel: {
    flex: 1,
    ...Typography.label,
    color: Colors.textSecondary,
  },

  legendCount: {
    ...Typography.label,
    fontWeight: "800",
    color: Colors.text,
  },
});
