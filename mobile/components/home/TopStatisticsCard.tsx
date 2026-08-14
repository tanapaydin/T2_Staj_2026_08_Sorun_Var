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

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
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
          <View style={styles.topHeader}>
            <View>
              <Text style={styles.topTitle}>
                En Yoğun Bildirimler
              </Text>

              <Text style={styles.topSubtitle}>
                Seçilen döneme göre en fazla
                bildirimin olduğu alanlar
              </Text>
            </View>
          </View>

          {/* ZAMAN FİLTRELERİ */}

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

          {/* İKİ KART */}

          <View style={styles.topCardsRow}>
            {/* KATEGORİ */}

            <View style={styles.topCard}>
              <Text
                style={styles.topCardLabel}
              >
                En Çok Şikayet Edilen
              </Text>

              <Text
                style={styles.topCardTitle}
              >
                Kategori
              </Text>

              <View
                style={styles.resultWrapper}
              >
                <View
                  style={[
                    styles.resultDot,
                    {
                      backgroundColor:
                        Colors.primary,
                    },
                  ]}
                />

                <View
                  style={
                    styles.resultContent
                  }
                >
                  {loading ? (
                    <ActivityIndicator
                      size="small"
                      color={Colors.primary}
                    />
                  ) : (
                    <>
                      <Text
                        style={
                          styles.resultValue
                        }
                        numberOfLines={1}
                      >
                        {getCategoryLabel(
                          topStatistics
                            ?.top_category
                            ?.category
                        )}
                      </Text>

                      <Text
                        style={
                          styles.resultCount
                        }
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
              <Text
                style={styles.topCardLabel}
              >
                En Çok Şikayet Edilen
              </Text>

              <Text
                style={styles.topCardTitle}
              >
                İl
              </Text>

              <View
                style={styles.resultWrapper}
              >
                <View
                  style={styles.cityDot}
                />

                <View
                  style={
                    styles.resultContent
                  }
                >
                  {loading ? (
                    <ActivityIndicator
                      size="small"
                      color={Colors.primary}
                    />
                  ) : (
                    <>
                      <Text
                        style={
                          styles.resultValue
                        }
                        numberOfLines={1}
                      >
                        {topStatistics
                          ?.top_city?.city ??
                          "Veri yok"}
                      </Text>

                      <Text
                        style={
                          styles.resultCount
                        }
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
      </ScrollView>

      {/* SAYFA GÖSTERGELERİ */}

      <View style={styles.pageIndicators}>
        {[0, 1].map((page) => (
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
    marginBottom: 28,
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

  /* SAYFA 2 */

  topHeader: {
    marginBottom: 12,
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
    marginBottom: 12,
    gap: 7,
  },

  periodChip: {
    paddingHorizontal: 11,
    height: 32,
    borderRadius: 16,
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

  topCardsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  topCard: {
    width: "48%",
    minHeight: 178,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 17,
    elevation: 2,
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
    marginTop: 15,
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

  /* INDICATORS */

  pageIndicators: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 7,
    marginTop: 1,
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