import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useEffect, useState } from "react";

import { Colors } from "../../theme/colors";
import {
  fetchTopStatistics,
  StatisticsPeriod,
  TopStatistics,
} from "../../lib/api";

type TopStatisticsCardProps = {
  totalReports: number;
  resolvedReports: number;
  pendingReports: number;
  averageProgress: number;
};

const periodLabels: Record<
  StatisticsPeriod,
  string
> = {
  all: "Tüm Zamanlar",
  month: "Son 1 Ay",
  week: "Son 1 Hafta",
};

export default function TopStatisticsCard({
  totalReports,
  resolvedReports,
  pendingReports,
  averageProgress,
}: TopStatisticsCardProps) {
  const { width } = useWindowDimensions();

  const pageWidth = width - 40;

  const [activePage, setActivePage] =
    useState(0);

  const [period, setPeriod] =
    useState<StatisticsPeriod>("all");

  const [topStatistics, setTopStatistics] =
    useState<TopStatistics | null>(null);

  const [loading, setLoading] =
    useState(false);

  useEffect(() => {
    loadTopStatistics("all");
  }, []);

  async function loadTopStatistics(
    selectedPeriod: StatisticsPeriod
  ) {
    try {
      setLoading(true);

      const result =
        await fetchTopStatistics(
          selectedPeriod
        );

      setTopStatistics(result);
    } catch (error) {
      console.log(
        "TOP STATISTICS ERROR:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  async function changePeriod(
    selectedPeriod: StatisticsPeriod
  ) {
    if (selectedPeriod === period) {
      return;
    }

    setPeriod(selectedPeriod);

    await loadTopStatistics(
      selectedPeriod
    );
  }

  const priorityCounts =
    topStatistics?.priority_counts ?? {
      high: 0,
      medium: 0,
      low: 0,
    };

  const totalPriorityReports =
    priorityCounts.high +
    priorityCounts.medium +
    priorityCounts.low;

  const highPercentage =
    totalPriorityReports > 0
      ? Math.round(
          (priorityCounts.high /
            totalPriorityReports) *
            100
        )
      : 0;

  const mediumPercentage =
    totalPriorityReports > 0
      ? Math.round(
          (priorityCounts.medium /
            totalPriorityReports) *
            100
        )
      : 0;

  const lowPercentage =
    totalPriorityReports > 0
      ? Math.round(
          (priorityCounts.low /
            totalPriorityReports) *
            100
        )
      : 0;

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        contentContainerStyle={styles.scrollContent}
        onMomentumScrollEnd={({
          nativeEvent,
        }) => {
          const page = Math.round(
            nativeEvent.contentOffset.x /
              pageWidth
          );

          setActivePage(page);
        }}
      >
        {/* =====================================================
            SAYFA 1 — 4'LÜ İSTATİSTİKLER
        ===================================================== */}

        <View
          style={[
            styles.page,
            {
              width: pageWidth,
            },
          ]}
        >
          <View style={styles.statsGrid}>
            <View
              style={[
                styles.statCard,
                styles.statCardBlue,
              ]}
            >
              <View style={styles.statAccent} />

              <Text style={styles.statLabel}>
                Toplam Bildirim
              </Text>

              <Text style={styles.statValue}>
                {totalReports}
              </Text>
            </View>

            <View
              style={[
                styles.statCard,
                styles.statCardGreen,
              ]}
            >
              <View style={styles.statAccent} />

              <Text style={styles.statLabel}>
                Çözülen
              </Text>

              <Text style={styles.statValue}>
                {resolvedReports}
              </Text>
            </View>

            <View
              style={[
                styles.statCard,
                styles.statCardOrange,
              ]}
            >
              <View style={styles.statAccent} />

              <Text style={styles.statLabel}>
                Bekleyen
              </Text>

              <Text style={styles.statValue}>
                {pendingReports}
              </Text>
            </View>

            <View
              style={[
                styles.statCard,
                styles.statCardPurple,
              ]}
            >
              <View style={styles.statAccent} />

              <Text style={styles.statLabel}>
                Ortalama İlerleme
              </Text>

              <Text style={styles.statValue}>
                %{Math.round(
                  averageProgress
                )}
              </Text>
            </View>
          </View>
        </View>

        {/* =====================================================
            SAYFA 2 — EN YOĞUNLAR
        ===================================================== */}

        <View
          style={[
            styles.page,
            {
              width: pageWidth,
            },
          ]}
        >
          <View style={styles.pageHeader}>
            <Text style={styles.topTitle}>
              En Yoğun Bildirimler
            </Text>

            <Text style={styles.topSubtitle}>
              Seçilen döneme göre en fazla
              bildirimin olduğu alanlar
            </Text>
          </View>

          <View style={styles.periodRow}>
            {(
              Object.keys(
                periodLabels
              ) as StatisticsPeriod[]
            ).map((item) => {
              const active =
                period === item;

              return (
                <TouchableOpacity
                  key={item}
                  activeOpacity={0.8}
                  onPress={() =>
                    changePeriod(item)
                  }
                  style={[
                    styles.periodChip,
                    active &&
                      styles.periodChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.periodChipText,
                      active &&
                        styles.periodChipTextActive,
                    ]}
                  >
                    {periodLabels[item]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.topCardsRow}>
            {/* KATEGORİ */}

            <View style={styles.topCard}>
              <Text style={styles.topCardLabel}>
                En Çok Şikayet Edilen
              </Text>

              <Text style={styles.topCardTitle}>
                Kategori
              </Text>

              <View style={styles.resultWrapper}>
                <View
                  style={[
                    styles.resultDot,
                    {
                      backgroundColor:
                        Colors.primary,
                    },
                  ]}
                />

                <View style={styles.resultContent}>
                  {loading ? (
                    <ActivityIndicator
                      size="small"
                      color={Colors.primary}
                    />
                  ) : (
                    <>
                      <Text
                        style={styles.resultValue}
                        numberOfLines={1}
                      >
                        {getCategoryLabel(
                          topStatistics
                            ?.top_category
                            ?.category
                        )}
                      </Text>

                      <Text
                        style={styles.resultCount}
                      >
                        {topStatistics
                          ?.top_category
                          ?.count ?? 0}{" "}
                        bildirim
                      </Text>
                    </>
                  )}
                </View>
              </View>
            </View>

            {/* İL */}

            <View style={styles.topCard}>
              <Text style={styles.topCardLabel}>
                En Çok Şikayet Edilen
              </Text>

              <Text style={styles.topCardTitle}>
                İl
              </Text>

              <View style={styles.resultWrapper}>
                <View
                  style={styles.cityDot}
                />

                <View style={styles.resultContent}>
                  {loading ? (
                    <ActivityIndicator
                      size="small"
                      color={Colors.primary}
                    />
                  ) : (
                    <>
                      <Text
                        style={styles.resultValue}
                        numberOfLines={1}
                      >
                        {topStatistics
                          ?.top_city
                          ?.city ?? "Veri yok"}
                      </Text>

                      <Text
                        style={styles.resultCount}
                      >
                        {topStatistics
                          ?.top_city
                          ?.count ?? 0}{" "}
                        bildirim
                      </Text>
                    </>
                  )}
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* =====================================================
            SAYFA 3 — ÖNCELİKLER
        ===================================================== */}

        <View
          style={[
            styles.page,
            {
              width: pageWidth,
            },
          ]}
        >
          <View style={styles.pageHeader}>
            <Text style={styles.topTitle}>
              Bildirim Öncelikleri
            </Text>

            <Text style={styles.topSubtitle}>
              Seçilen döneme göre öncelik dağılımı
            </Text>
          </View>

          <View style={styles.periodRow}>
            {(
              Object.keys(
                periodLabels
              ) as StatisticsPeriod[]
            ).map((item) => {
              const active =
                period === item;

              return (
                <TouchableOpacity
                  key={item}
                  activeOpacity={0.8}
                  onPress={() =>
                    changePeriod(item)
                  }
                  style={[
                    styles.periodChip,
                    active &&
                      styles.periodChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.periodChipText,
                      active &&
                        styles.periodChipTextActive,
                    ]}
                  >
                    {periodLabels[item]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {loading ? (
            <View style={styles.priorityLoading}>
              <ActivityIndicator
                size="small"
                color={Colors.primary}
              />
            </View>
          ) : (
            <View style={styles.priorityList}>
              {/* YÜKSEK */}

              <View style={styles.priorityItem}>
                <View
                  style={[
                    styles.priorityDot,
                    styles.highDot,
                  ]}
                />

                <Text style={styles.priorityLabel}>
                  Yüksek
                </Text>

                <Text style={styles.priorityCount}>
                  {priorityCounts.high}
                </Text>

                <Text style={styles.priorityPercentage}>
                  %{highPercentage}
                </Text>
              </View>

              {/* ORTA */}

              <View style={styles.priorityItem}>
                <View
                  style={[
                    styles.priorityDot,
                    styles.mediumDot,
                  ]}
                />

                <Text style={styles.priorityLabel}>
                  Orta
                </Text>

                <Text style={styles.priorityCount}>
                  {priorityCounts.medium}
                </Text>

                <Text style={styles.priorityPercentage}>
                  %{mediumPercentage}
                </Text>
              </View>

              {/* DÜŞÜK */}

              <View style={styles.priorityItem}>
                <View
                  style={[
                    styles.priorityDot,
                    styles.lowDot,
                  ]}
                />

                <Text style={styles.priorityLabel}>
                  Düşük
                </Text>

                <Text style={styles.priorityCount}>
                  {priorityCounts.low}
                </Text>

                <Text style={styles.priorityPercentage}>
                  %{lowPercentage}
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* SAYFA GÖSTERGELERİ */}

      <View style={styles.pageIndicators}>
        {[0, 1, 2].map((page) => (
          <View
            key={page}
            style={[
              styles.pageIndicator,
              activePage === page &&
                styles.pageIndicatorActive,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

function getCategoryLabel(
  category?: string | null
) {
  if (!category) {
    return "Veri yok";
  }

  const labels: Record<
    string,
    string
  > = {
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

  return (
    labels[category] ??
    category
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 20,
  },

  scrollContent: {
    alignItems: "flex-start",
  },

  page: {
    paddingHorizontal: 1,
  },

  /* SAYFA 1 */

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
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
    backgroundColor:
      Colors.statCard.blue,
  },

  statCardGreen: {
    backgroundColor:
      Colors.statCard.green,
  },

  statCardOrange: {
    backgroundColor:
      Colors.statCard.orange,
  },

  statCardPurple: {
    backgroundColor:
      Colors.statCard.purple,
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

  /* ORTAK SAYFA */

  pageHeader: {
    marginBottom: 10,
  },

  topTitle: {
    color: "#0F172A",
    fontSize: 21,
    fontWeight: "800",
  },

  topSubtitle: {
    color: "#64748B",
    fontSize: 12,
    marginTop: 4,
  },

  periodRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 7,
  },

  periodChip: {
    paddingHorizontal: 11,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },

  periodChipActive: {
    backgroundColor: "#E8F0FE",
    borderColor: Colors.primary,
  },

  periodChipText: {
    color: "#64748B",
    fontSize: 10,
    fontWeight: "700",
  },

  periodChipTextActive: {
    color: Colors.primary,
  },

  /* SAYFA 2 */

  topCardsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  topCard: {
    width: "48%",
    minHeight: 150,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 17,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  topCardLabel: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "700",
  },

  topCardTitle: {
    color: "#0F172A",
    fontSize: 20,
    fontWeight: "800",
    marginTop: 3,
  },

  resultWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },

  resultDot: {
    width: 13,
    height: 13,
    borderRadius: 7,
    marginRight: 9,
  },

  cityDot: {
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: "#64748B",
    marginRight: 9,
  },

  resultContent: {
    flex: 1,
  },

  resultValue: {
    color: "#0F172A",
    fontSize: 17,
    fontWeight: "800",
  },

  resultCount: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 3,
  },

  /* SAYFA 3 */

  priorityLoading: {
    height: 150,
    alignItems: "center",
    justifyContent: "center",
  },

  priorityList: {
    gap: 10,
  },

  priorityItem: {
    minHeight: 48,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    flexDirection: "row",
    alignItems: "center",
  },

  priorityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 9,
  },

  highDot: {
    backgroundColor: "#DC2626",
  },

  mediumDot: {
    backgroundColor: "#F59E0B",
  },

  lowDot: {
    backgroundColor: "#22C55E",
  },

  priorityLabel: {
    flex: 1,
    color: "#0F172A",
    fontSize: 13,
    fontWeight: "800",
  },

  priorityCount: {
    color: "#475569",
    fontSize: 13,
    fontWeight: "800",
    marginRight: 14,
  },

  priorityPercentage: {
    minWidth: 38,
    textAlign: "right",
    color: "#64748B",
    fontSize: 12,
    fontWeight: "700",
  },

  /* GÖSTERGELER */

  pageIndicators: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 7,
    marginTop: 2,
  },

  pageIndicator: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#CBD5E1",
  },

  pageIndicatorActive: {
    backgroundColor: Colors.primary,
  },
});