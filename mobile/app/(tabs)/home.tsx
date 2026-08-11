import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import CategoryChart from "../../components/home/CategoryChart";

import {
  categoryLabels,
  statusLabels,
  priorityLabels,
} from "../../constants/report";

import { Colors } from "../../theme/colors";

import {
  fetchReports,
  fetchStatistics,
  fetchCategoryStatistics,
  ReportStatistics,
  CategoryStatistics,
} from "../../lib/api";

import { Report } from "../../types/report";

export default function HomeScreen() {
  const REPORTS_PER_PAGE = 10;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const [stats, setStats] = useState<ReportStatistics | null>(null);

  const [categories, setCategories] = useState<CategoryStatistics[]>([]);

  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  // =========================================================
  // İLK VERİLERİ YÜKLE
  // =========================================================

  async function loadData() {
    try {
      const [
        statistics,
        categoryStats,
        reportList,
      ] = await Promise.all([
        fetchStatistics(),

        fetchCategoryStatistics(),

        fetchReports({
          skip: 0,
          limit: REPORTS_PER_PAGE,
          sort: "newest",
        }),
      ]);

      console.log(
        "İLK GELEN RAPOR SAYISI:",
        reportList.length
      );

      setStats(statistics);
      setCategories(categoryStats);

      // İlk sayfayı tamamen yenile
      setReports(reportList);

      setHasMore(
        reportList.length >=
          REPORTS_PER_PAGE
      );
    } catch (error) {
      console.log(
        "Home data error:",
        error
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  // =========================================================
  // REFRESH
  // =========================================================

  function onRefresh() {
    setRefreshing(true);
    setLoadingMore(false);
    setHasMore(true);

    loadData();
  }

  // =========================================================
  // DAHA FAZLA RAPOR YÜKLE (Cursor Pagination)
  // =========================================================

  async function loadMoreReports() {
    if (loadingMore || !hasMore) {
      return;
    }

    try {
      setLoadingMore(true);

      console.log("Daha fazla rapor isteniyor. Skip:", reports.length);

      const nextReports = await fetchReports({
        skip: reports.length,
        limit: REPORTS_PER_PAGE,
        sort: "newest",
      });

      console.log(
        "SONRAKİ GELEN RAPOR SAYISI:",
        nextReports.length
      );

      // Gelen raporları doğrudan mevcut listeye ekle
      setReports((currentReports) => [
        ...currentReports,
        ...nextReports,
      ]);

      // Backend limitten az kayıt döndürdüyse artık veri bitmiştir
      if (nextReports.length < REPORTS_PER_PAGE) {
        console.log("Tüm raporlar yüklendi.");
        setHasMore(false);
      }
    } catch (error) {
      console.log("Load more reports error:", error);
    } finally {
      setLoadingMore(false);
    }
  }

  // =========================================================
  // İLK SAYFA LOADING
  // =========================================================

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Veriler yükleniyor...</Text>
      </View>
    );
  }

  const totalReports = stats?.total_reports ?? 0;
  const resolutionRate = stats?.resolution_rate ?? 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
      onMomentumScrollEnd={({ nativeEvent }) => {
        const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;

        const distanceFromBottom =
          contentSize.height -
          (layoutMeasurement.height + contentOffset.y);

        console.log("BOTTOM MESAFESİ:", distanceFromBottom);

        // Sayfanın sonuna yaklaşıldıysa
        if (distanceFromBottom < 100 && !loadingMore && hasMore) {
          console.log("Daha Fazla Rapor Yükleniyor...");
          loadMoreReports();
        }
      }}
    >
      {/* =====================================================
          HEADER
      ===================================================== */}

      <View style={styles.hero}>
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>Sorun Var</Text>

          <Text style={styles.heroSubtitle}>
            Şehrinizdeki sorunları takip edin, değişimi birlikte görün.
          </Text>

          <View style={styles.heroStats}>
            <View>
              <Text style={styles.heroNumber}>{totalReports}</Text>
              <Text style={styles.heroLabel}>toplam bildirim</Text>
            </View>

            <View style={styles.heroDivider} />

            <View>
              <Text style={styles.heroNumber}>
                %{Math.round(resolutionRate)}
              </Text>

              <Text style={styles.heroLabel}>çözüm oranı</Text>
            </View>
          </View>
        </View>
      </View>

      {/* =====================================================
          STATISTICS
      ===================================================== */}

      <View style={styles.statsGrid}>
        <View style={[styles.statCard, styles.statCardBlue]}>
          <View style={styles.statAccent} />
          <Text style={styles.statLabel}>Toplam Bildirim</Text>
          <Text style={styles.statValue}>
            {stats?.total_reports ?? 0}
          </Text>
        </View>

        <View style={[styles.statCard, styles.statCardGreen]}>
          <View style={styles.statAccent} />
          <Text style={styles.statLabel}>Çözülen</Text>
          <Text style={styles.statValue}>
            {stats?.resolved_reports ?? 0}
          </Text>
        </View>

        <View style={[styles.statCard, styles.statCardOrange]}>
          <View style={styles.statAccent} />
          <Text style={styles.statLabel}>Bekleyen</Text>
          <Text style={styles.statValue}>
            {stats?.pending_reports ?? 0}
          </Text>
        </View>

        <View style={[styles.statCard, styles.statCardPurple]}>
          <View style={styles.statAccent} />
          <Text style={styles.statLabel}>Ortalama İlerleme</Text>
          <Text style={styles.statValue}>
            %{Math.round(stats?.average_progress ?? 0)}
          </Text>
        </View>
      </View>

      {/* =====================================================
          CATEGORY DISTRIBUTION
      ===================================================== */}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Kategori Dağılımı</Text>
            <Text style={styles.sectionSubtitle}>
              Bildirimlerin kategorilere göre dağılımı
            </Text>
          </View>
        </View>

        <CategoryChart categories={categories} total={totalReports} />
      </View>

      {/* =====================================================
          RESOLUTION
      ===================================================== */}

      <View style={styles.section}>
        <View style={styles.resolutionCard}>
          <View style={styles.resolutionHeader}>
            <View>
              <Text style={styles.resolutionTitle}>Çözüm Durumu</Text>
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
                  width: `${Math.min(
                    Math.max(resolutionRate, 0),
                    100
                  )}%`,
                },
              ]}
            />
          </View>

          <View style={styles.resolutionFooter}>
            <Text style={styles.resolutionFooterText}>
              {stats?.resolved_reports ?? 0} çözülen
            </Text>

            <Text style={styles.resolutionFooterText}>
              {stats?.pending_reports ?? 0} bekleyen
            </Text>
          </View>
        </View>
      </View>

      {/* =====================================================
          RECENT REPORTS
      ===================================================== */}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Son Bildirilen Sorunlar</Text>
            <Text style={styles.sectionSubtitle}>
              En son eklenen bildirimler
            </Text>
          </View>
        </View>

        {reports.map((report) => {
          const priorityColor =
            Colors.priority[
              report.priority as keyof typeof Colors.priority
            ] ?? Colors.textMuted;

          return (
            <TouchableOpacity
              key={report.id}
              style={styles.reportCard}
              activeOpacity={0.8}
            >
              <View style={styles.reportTopRow}>
                <View
                  style={[
                    styles.categoryBadge,
                    {
                      backgroundColor:
                        Colors.category[
                          report.category as keyof typeof Colors.category
                        ] ?? Colors.category.other,
                    },
                  ]}
                >
                  <Text style={styles.categoryBadgeText}>
                    {categoryLabels[report.category] ?? report.category}
                  </Text>
                </View>

                <View style={styles.statusContainer}>
                  <View
                    style={[
                      styles.statusDot,
                      {
                        backgroundColor:
                          report.status === "resolved"
                            ? Colors.success
                            : report.status === "in_progress"
                            ? Colors.warning
                            : Colors.border,
                      },
                    ]}
                  />

                  <Text style={styles.reportStatus}>
                    {statusLabels[report.status] ?? report.status}
                  </Text>
                </View>
              </View>

              <Text
                style={styles.reportTitle}
                numberOfLines={2}
              >
                {report.title}
              </Text>

              <View style={styles.reportFooter}>
                <View style={styles.priorityContainer}>
                  <View
                    style={[
                      styles.priorityDot,
                      {
                        backgroundColor: priorityColor,
                      },
                    ]}
                  />

                  <Text style={styles.reportPriority}>
                    Öncelik:{" "}
                    {priorityLabels[report.priority] ?? report.priority}
                  </Text>
                </View>

                <Text style={styles.reportViews}>
                  {report.view_count} görüntülenme
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}

        {/* ===================================================
            LOAD MORE SPINNER
        =================================================== */}

        {loadingMore && (
          <View style={styles.loadMoreContainer}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.loadMoreText}>
              Daha fazla bildirim yükleniyor...
            </Text>
          </View>
        )}

        {/* ===================================================
            LİSTE BİTTİ
        =================================================== */}

        {!hasMore && reports.length > 0 && (
          <View style={styles.endContainer}>
            <Text style={styles.endText}>
              Tüm bildirimler gösteriliyor.
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  content: {
    padding: 20,
    paddingTop: 48,
    paddingBottom: 40,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },

  loadingText: {
    marginTop: 12,
    color: "#475569",
    fontWeight: "600",
  },

  /* HERO */

  hero: {
    backgroundColor: Colors.heroBackground,
    borderRadius: 28,
    marginBottom: 20,
    overflow: "hidden",
    elevation: 5,
  },

  heroContent: {
    padding: 24,
  },

  heroTitle: {
    color: Colors.heroText,
    fontSize: 32,
    fontWeight: "800",
  },

  heroSubtitle: {
    color: "#64748B",
    fontSize: 15,
    lineHeight: 22,
    marginTop: 6,
    maxWidth: 320,
  },

  heroStats: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 24,
  },

  heroNumber: {
    color: Colors.primary,
    fontSize: 24,
    fontWeight: "800",
  },

  heroLabel: {
    color: "#64748B",
    fontSize: 12,
    marginTop: 2,
  },

  heroDivider: {
    width: 1,
    height: 42,
    backgroundColor: Colors.heroDivider,
    marginHorizontal: 24,
  },

  /* STATS */

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

  /* SECTIONS */

  section: {
    marginBottom: 28,
  },

  sectionHeader: {
    marginBottom: 14,
  },

  sectionTitle: {
    fontSize: 21,
    fontWeight: "800",
    color: "#0F172A",
  },

  sectionSubtitle: {
    marginTop: 4,
    color: "#64748B",
    fontSize: 13,
  },

  /* RESOLUTION */

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

  /* REPORTS */

  reportCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 17,
    marginBottom: 12,
    elevation: 2,
  },

  reportTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 11,
  },

  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },

  categoryBadgeText: {
    color: "white",
    fontWeight: "700",
    fontSize: 11,
  },

  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },

  reportStatus: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "600",
  },

  reportTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A",
    lineHeight: 22,
    marginBottom: 13,
  },

  reportFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  priorityContainer: {
    flexDirection: "row",
    alignItems: "center",
  },

  priorityDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },

  reportPriority: {
    color: "#475569",
    fontSize: 12,
    fontWeight: "600",
  },

  reportViews: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "600",
  },

  /* LOAD MORE */

  loadMoreContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },

  loadMoreText: {
    marginTop: 8,
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: "600",
  },

  endContainer: {
    alignItems: "center",
    paddingVertical: 16,
  },

  endText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: "600",
  },
});