import { useEffect, useMemo, useState } from "react";
import * as Location from "expo-location";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

import CategoryChart from "../../components/home/CategoryChart";
import StatisticsCard from "../../components/home/StatisticsCards";
import TopStatisticsCard from "../../components/home/TopStatisticsCard";
import ResolutionCard from "../../components/home/ResolutionCards";
import RecentReports from "../../components/home/RecentReports";

import { getAuthData } from "../../lib/auth";

import {
  categoryLabels,
  statusLabels,
  priorityLabels,
} from "../../constants/report";

import { Colors } from "../../theme/colors";

import {
  fetchAllReports,
  fetchReports,
  fetchStatistics,
  fetchCategoryStatistics,
  ReportStatistics,
  CategoryStatistics,
} from "../../lib/api";

import { Report } from "../../types/report";
import { useUserLocation } from "../../hooks/useUserLocation";
import { filterReportsByCity } from "../../utils/location";

export default function HomeScreen() {
  const REPORTS_PER_PAGE = 10;
  const { width: windowWidth } = useWindowDimensions();
  const { currentCity, currentMunicipality } = useUserLocation();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const [stats, setStats] = useState<ReportStatistics | null>(null);

  const [categories, setCategories] = useState<CategoryStatistics[]>([]);

  const [reports, setReports] = useState<Report[]>([]);
  const [locationReports, setLocationReports] = useState<Report[]>([]);
  const [activeOverviewPage, setActiveOverviewPage] = useState(0);
  const [cityReports, setCityReports] = useState<Report[]>([]);
  const [municipalityReports, setMunicipalityReports] = useState<Report[]>([]);

  useEffect(() => {
    let isActive = true;

    async function updateLocationReports() {
      if (!currentCity) {
        setCityReports([]);
        setMunicipalityReports([]);
        return;
      }

      const locations = await Promise.all(
        locationReports.map(async (report) => {
          try {
            const [address] = await Location.reverseGeocodeAsync({
              latitude: report.latitude,
              longitude: report.longitude,
            });

            return {
              city: address?.region === currentCity,
              municipality:
                Boolean(currentMunicipality) &&
                (address?.subregion ?? address?.city ?? address?.district) ===
                  currentMunicipality,
            };
          } catch {
            return {
              city: filterReportsByCity([report], currentCity).length > 0,
              municipality: false,
            };
          }
        })
      );

      if (isActive) {
        setCityReports(
          locationReports.filter((_, index) => locations[index].city)
        );
        setMunicipalityReports(
          locationReports.filter((_, index) => locations[index].municipality)
        );
      }
    }

    updateLocationReports();

    return () => {
      isActive = false;
    };
  }, [locationReports, currentCity, currentMunicipality]);

  const cityCategories = useMemo(() => {
    const counts = new Map<string, number>();

    cityReports.forEach((report) => {
      counts.set(report.category, (counts.get(report.category) ?? 0) + 1);
    });

    return Array.from(counts, ([category, count]) => ({ category, count }));
  }, [cityReports]);

  const municipalityCategories = useMemo(() => {
    const counts = new Map<string, number>();

    municipalityReports.forEach((report) => {
      counts.set(report.category, (counts.get(report.category) ?? 0) + 1);
    });

    return Array.from(counts, ([category, count]) => ({ category, count }));
  }, [municipalityReports]);

  useEffect(() => {
    loadData();

    async function loadAuth() {
      try {
        const auth = await getAuthData();

        setAccessToken(
          auth?.access_token ?? null
        );
      } catch (error) {
        console.log(
          "AUTH DATA ERROR:",
          error
        );
        setAccessToken(null);
      }
    }

    loadAuth();
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
        allReportList,
      ] = await Promise.all([
        fetchStatistics(),

        fetchCategoryStatistics(),

        fetchReports({
          skip: 0,
          limit: REPORTS_PER_PAGE,
          sort: "newest",
        }),

        fetchAllReports({
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
      setLocationReports(allReportList);

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
  const visibleReports =
    activeOverviewPage === 0
      ? reports
      : activeOverviewPage === 1
      ? cityReports
      : municipalityReports;
  
  const activeReports =
    activeOverviewPage === 0
      ? locationReports
      : activeOverviewPage === 1
      ? cityReports
      : municipalityReports;

  const activeTotalReports =
    activeReports.length;

  const activeResolvedReports =
    activeReports.filter(
      (report) => report.progress === 100
    ).length;

  const activePendingReports =
    activeReports.filter(
      (report) => report.progress < 100
    ).length;

  const activeAverageProgress =
    activeTotalReports > 0
      ? activeReports.reduce(
          (total, report) =>
            total + report.progress,
          0
        ) / activeTotalReports
      : 0;

  const activeResolutionRate =
    activeTotalReports > 0
      ? (
          activeResolvedReports /
          activeTotalReports
        ) * 100
      : 0;
  const overviewPageWidth = windowWidth - 40;

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
                %{Math.round(activeResolutionRate)}
              </Text>

              <Text style={styles.heroLabel}>çözüm oranı</Text>
            </View>
          </View>
        </View>
      </View>

      {/* =====================================================
          STATISTICS
      ===================================================== */}
      <TopStatisticsCard
        totalReports={activeTotalReports}
        resolvedReports={activeResolvedReports}
        pendingReports={activePendingReports}
        averageProgress={activeAverageProgress}
      />

      {/* =====================================================
          CATEGORY DISTRIBUTION
      ===================================================== */}

      <View style={styles.section}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          onMomentumScrollEnd={({ nativeEvent }) => {
            const page = Math.round(
              nativeEvent.contentOffset.x / overviewPageWidth
            );
            setActiveOverviewPage(page);
          }}
        >
          <View style={[styles.overviewPage, { width: overviewPageWidth }]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Tüm Raporlar</Text>
              <Text style={styles.sectionSubtitle}>
                Bildirimlerin kategorilere göre dağılımı
              </Text>
            </View>
            <CategoryChart categories={categories} total={totalReports} />
          </View>

          <View style={[styles.overviewPage, { width: overviewPageWidth }]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {currentCity ? `${currentCity} Raporları` : "Bulunduğunuz İl"}
              </Text>
              <Text style={styles.sectionSubtitle}>
                {currentCity
                  ? "Bulunduğunuz ildeki bildirimlerin dağılımı"
                  : "Konumunuza erişildiğinde ilinizin verileri gösterilecek"}
              </Text>
            </View>
            <CategoryChart categories={cityCategories} total={cityReports.length} />
          </View>

          <View style={[styles.overviewPage, { width: overviewPageWidth }]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {currentMunicipality
                  ? `${currentMunicipality} Belediyesi`
                  : "Bulunduğunuz Belediye"}
              </Text>
              <Text style={styles.sectionSubtitle}>
                {currentMunicipality
                  ? "Bulunduğunuz belediyedeki bildirimlerin dağılımı"
                  : "Konumunuza erişildiğinde belediye verileri gösterilecek"}
              </Text>
            </View>
            <CategoryChart
              categories={municipalityCategories}
              total={municipalityReports.length}
            />
          </View>

        </ScrollView>

        <View style={styles.pageIndicators} accessibilityLabel="Rapor görünümü sayfaları">
          {[0, 1, 2].map((page) => (
            <View
              key={page}
              style={[
                styles.pageIndicator,
                activeOverviewPage === page && styles.pageIndicatorActive,
              ]}
            />
          ))}
        </View>
      </View>

      {/* =====================================================
          RESOLUTION
      ===================================================== */}

      <ResolutionCard
        resolutionRate={activeResolutionRate}
        resolvedReports={activeResolvedReports}
        pendingReports={activePendingReports}
      />

      {/* =====================================================
          RECENT REPORTS
      ===================================================== */}

      <RecentReports
        reports={visibleReports}
        activeOverviewPage={activeOverviewPage}
        currentCity={currentCity}
        currentMunicipality={currentMunicipality}
        loadingMore={loadingMore}
        hasMore={hasMore}
        onLoadMore={loadMoreReports}
        accessToken={accessToken}
      />
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

  /* SECTIONS */

  section: {
    marginBottom: 28,
  },

  sectionHeader: {
    marginBottom: 14,
  },

  overviewPage: {
    paddingHorizontal: 1,
  },

  pageIndicators: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 7,
    marginTop: 14,
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
});
