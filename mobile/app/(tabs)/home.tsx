import { useEffect, useRef, useState } from "react";
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

import HomeHero from "../../components/home/HomeHero";
import ReportScopeCarousel from "../../components/home/ReportScopeCarousel";
import TopStatisticsCard from "../../components/home/TopStatisticsCard";
import ResolutionCard from "../../components/home/ResolutionCards";
import RecentReports from "../../components/home/RecentReports";
import { Colors, Layout, Spacing } from "../../theme";
import {
  fetchReports,
  fetchScopeStatistics,
  ReportFilters,
  ScopeStatistics,
} from "../../lib/api";
import { getAuthData } from "../../lib/auth";
import { Report } from "../../types/report";
import { useUserLocation } from "../../hooks/useUserLocation";

const PAGE_SIZE = 50;

type ReportScope = "all" | "city" | "municipality";

type ScopeState = {
  reports: Report[];
  statistics: ScopeStatistics | null;
  hasMore: boolean;
  initialized: boolean;
  loading: boolean;
  loadingMore: boolean;
};

function createScopeState(): ScopeState {
  return {
    reports: [],
    statistics: null,
    hasMore: false,
    initialized: false,
    loading: false,
    loadingMore: false,
  };
}

function getScopeFromPage(page: number): ReportScope {
  if (page === 1) {
    return "city";
  }

  if (page === 2) {
    return "municipality";
  }

  return "all";
}

function normalizeDistrict(value: string | null | undefined) {
  return value
    ?.trim()
    .replace(/\s+belediyesi$/iu, "")
    .trim();
}

function getScopeFilters(
  scope: ReportScope,
  city: string | null,
  municipality: string | null
): ReportFilters | null {
  if (scope === "all") {
    return {};
  }

  if (!city) {
    return null;
  }

  if (scope === "city") {
    return { city };
  }

  const district = normalizeDistrict(municipality);

  return district
    ? { city, district }
    : null;
}

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const { currentCity, currentMunicipality } = useUserLocation();
  const scrollViewRef = useRef<ScrollView>(null);
  const requestVersionRef = useRef<Record<ReportScope, number>>({
    all: 0,
    city: 0,
    municipality: 0,
  });

  const [activeOverviewPage, setActiveOverviewPage] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [scopeData, setScopeData] = useState<
    Record<ReportScope, ScopeState>
  >({
    all: createScopeState(),
    city: createScopeState(),
    municipality: createScopeState(),
  });

  const activeScope = getScopeFromPage(activeOverviewPage);
  const activeScopeData = scopeData[activeScope];
  const allStatistics = scopeData.all.statistics;

  useEffect(() => {
    void getAuthData().then((data) => {
      setToken(data?.access_token ?? null);
    });
  }, []);

  useEffect(() => {
    // Konum değiştiğinde il ve belediye verileri başka bir yere ait kalmasın.
    requestVersionRef.current.city += 1;
    requestVersionRef.current.municipality += 1;

    setScopeData((current) => ({
      ...current,
      city: createScopeState(),
      municipality: createScopeState(),
    }));
  }, [currentCity, currentMunicipality]);

  async function loadScope(
    scope: ReportScope,
    force = false
  ) {
    const filters = getScopeFilters(
      scope,
      currentCity,
      currentMunicipality
    );

    if (!filters) {
      return;
    }

    const current = scopeData[scope];

    if (!force && (current.loading || current.initialized)) {
      return;
    }

    const requestVersion = requestVersionRef.current[scope] + 1;
    requestVersionRef.current[scope] = requestVersion;

    setScopeData((items) => ({
      ...items,
      [scope]: {
        ...items[scope],
        reports: force ? [] : items[scope].reports,
        statistics: force ? null : items[scope].statistics,
        hasMore: false,
        initialized: false,
        loading: true,
        loadingMore: false,
      },
    }));

    try {
      const [statistics, reports] = await Promise.all([
        fetchScopeStatistics(filters),
        fetchReports({
          ...filters,
          skip: 0,
          limit: PAGE_SIZE,
          sort: "newest",
        }),
      ]);

      if (requestVersion !== requestVersionRef.current[scope]) {
        return;
      }

      setScopeData((items) => ({
        ...items,
        [scope]: {
          reports,
          statistics,
          hasMore: reports.length < statistics.total_reports,
          initialized: true,
          loading: false,
          loadingMore: false,
        },
      }));
    } catch (error) {
      console.log("HOME SCOPE LOAD ERROR:", error);

      if (requestVersion !== requestVersionRef.current[scope]) {
        return;
      }

      setScopeData((items) => ({
        ...items,
        [scope]: {
          ...items[scope],
          initialized: true,
          loading: false,
          loadingMore: false,
        },
      }));
    }
  }

  useEffect(() => {
    void loadScope(activeScope);
  }, [
    activeScope,
    activeScopeData.initialized,
    activeScopeData.loading,
    currentCity,
    currentMunicipality,
  ]);

  async function loadMore() {
    const filters = getScopeFilters(
      activeScope,
      currentCity,
      currentMunicipality
    );
    const current = scopeData[activeScope];

    if (
      !filters ||
      !current.statistics ||
      current.loading ||
      current.loadingMore ||
      !current.hasMore
    ) {
      return;
    }

    const requestVersion = requestVersionRef.current[activeScope];
    const skip = current.reports.length;

    setScopeData((items) => ({
      ...items,
      [activeScope]: {
        ...items[activeScope],
        loadingMore: true,
      },
    }));

    try {
      const nextReports = await fetchReports({
        ...filters,
        skip,
        limit: PAGE_SIZE,
        sort: "newest",
      });

      if (requestVersion !== requestVersionRef.current[activeScope]) {
        return;
      }

      setScopeData((items) => {
        const scope = items[activeScope];
        const reportIds = new Set(scope.reports.map((report) => report.id));
        const reports = [
          ...scope.reports,
          ...nextReports.filter((report) => !reportIds.has(report.id)),
        ];

        return {
          ...items,
          [activeScope]: {
            ...scope,
            reports,
            hasMore: reports.length < (scope.statistics?.total_reports ?? 0),
            loadingMore: false,
          },
        };
      });
    } catch (error) {
      console.log("HOME SCOPE LOAD MORE ERROR:", error);

      if (requestVersion === requestVersionRef.current[activeScope]) {
        setScopeData((items) => ({
          ...items,
          [activeScope]: {
            ...items[activeScope],
            loadingMore: false,
          },
        }));
      }
    }
  }

  async function refreshActiveScope() {
    setRefreshing(true);
    await loadScope(activeScope, true);
    setRefreshing(false);
  }

  const isInitialLoading =
    scopeData.all.loading &&
    !scopeData.all.initialized;

  if (isInitialLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.text}>Veriler yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.scroll}
        contentContainerStyle={styles.content}
        scrollEventThrottle={16}
        onScroll={({ nativeEvent }) => {
          setShowScrollTop(nativeEvent.contentOffset.y > 320);
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshActiveScope}
          />
        }
        onMomentumScrollEnd={({ nativeEvent }) => {
          const distanceFromBottom =
            nativeEvent.contentSize.height -
            (
              nativeEvent.layoutMeasurement.height +
              nativeEvent.contentOffset.y
            );

          if (distanceFromBottom < 100) {
            void loadMore();
          }
        }}
      >
        <HomeHero
          totalReports={allStatistics?.total_reports ?? 0}
          resolutionRate={allStatistics?.resolution_rate ?? 0}
        />

        <TopStatisticsCard
          totalReports={allStatistics?.total_reports ?? 0}
          resolvedReports={allStatistics?.resolved_reports ?? 0}
          pendingReports={allStatistics?.pending_reports ?? 0}
          averageProgress={allStatistics?.average_progress ?? 0}
        />

        <ReportScopeCarousel
          width={width - 40}
          activePage={activeOverviewPage}
          onPageChange={setActiveOverviewPage}
          totalCategories={allStatistics?.categories ?? []}
          totalReports={allStatistics?.total_reports ?? 0}
          totalLoading={scopeData.all.loading}
          city={currentCity}
          cityCategories={scopeData.city.statistics?.categories ?? []}
          cityReports={scopeData.city.statistics?.total_reports ?? 0}
          cityLoading={scopeData.city.loading}
          municipality={currentMunicipality}
          municipalityCategories={
            scopeData.municipality.statistics?.categories ?? []
          }
          municipalityReports={
            scopeData.municipality.statistics?.total_reports ?? 0
          }
          municipalityLoading={scopeData.municipality.loading}
        />

        <ResolutionCard
          resolutionRate={activeScopeData.statistics?.resolution_rate ?? 0}
          resolvedReports={activeScopeData.statistics?.resolved_reports ?? 0}
          pendingReports={activeScopeData.statistics?.pending_reports ?? 0}
        />

        <RecentReports
          reports={activeScopeData.reports}
          activeOverviewPage={activeOverviewPage}
          currentCity={currentCity}
          currentMunicipality={currentMunicipality}
          loadingMore={activeScopeData.loadingMore}
          hasMore={activeScopeData.hasMore}
          onLoadMore={loadMore}
          accessToken={token}
        />
      </ScrollView>

      {showScrollTop && (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Sayfanın en üstüne çık"
          style={styles.scrollTopButton}
          activeOpacity={0.8}
          onPress={() => {
            scrollViewRef.current?.scrollTo({
              y: 0,
              animated: true,
            });
          }}
        >
          <Text style={styles.scrollTopText}>↑</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: Layout.screenPadding,
    paddingTop: Layout.homeContentTop,
    paddingBottom: Layout.homeContentBottom,
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.background,
  },
  text: {
    marginTop: Spacing.md,
    color: Colors.textSecondary,
  },
  scrollTopButton: {
    position: "absolute",
    left: Layout.screenPadding,
    bottom: Layout.screenPadding,
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(219, 234, 254, 0.88)",
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  scrollTopText: {
    fontSize: 25,
    fontWeight: "700",
    lineHeight: 29,
    color: Colors.primary,
  },
});
