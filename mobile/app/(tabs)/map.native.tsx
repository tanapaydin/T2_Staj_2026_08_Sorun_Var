import { useEffect, useRef, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import FilterModal from "../../components/map/FilterModal";
import MapControls from "../../components/map/MapControls";
import { createMapMarkers } from "../../components/map/MapMarkers";
import MapOverviewCard from "../../components/map/MapOverviewCard";
import ReportCard from "../../components/map/ReportCard";
import SearchBar from "../../components/map/SearchBar";
import { AppCard, AppText } from "../../components/common";
import { useMapReports } from "../../hooks/useMapReports";
import { useUserLocation } from "../../hooks/useUserLocation";
import {
  fetchLocationSuggestions,
  fetchMapOverview,
  fetchReport,
  LocationSuggestion,
  MapBounds,
  MapOverview,
  MapReportFilters,
} from "../../lib/api";
import { Colors, MapTokens, Spacing } from "../../theme";
import { Report } from "../../types/report";

const isWeb = Platform.OS === "web";
const MAX_AREA_LATITUDE_DELTA = 0.5;
const MAX_AREA_LONGITUDE_DELTA = 0.8;
const AREA_REQUEST_WINDOW_MS = 5000;
const MAX_AREA_REQUESTS_PER_WINDOW = 5;
const CLUSTER_MAX_ZOOM = 16;
const CLUSTER_RADIUS = 60;
const DEFAULT_MAP_RESULT_LIMIT = 500;
const DETAILED_MAP_RESULT_LIMIT = 1000;
const DETAILED_LATITUDE_DELTA = 0.02;
const DETAILED_LONGITUDE_DELTA = 0.03;

let MapView: any = View;
let Marker: any = View;

if (!isWeb) {
  MapView = require("react-native-map-clustering").default;
  Marker = require("react-native-maps").Marker;
}

type MapRegion = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

type MapScope =
  | {
      type: "municipality";
      city: string;
      district: string;
    }
  | {
      type: "bounds";
      bounds: MapBounds;
      limit?: number;
    };

type MapContentFilters = Pick<
  MapReportFilters,
  "category" | "resolved" | "priority" | "date"
>;

const initialRegion: MapRegion = {
  latitude: 39.925,
  longitude: 32.8369,
  latitudeDelta: 1.2,
  longitudeDelta: 1.2,
};

type MapClusterRenderData = {
  id: number | string;
  geometry: { coordinates: [number, number] };
  properties: {
    point_count: number;
    point_count_abbreviated?: number | string;
  };
  onPress: () => void;
};

function renderMapCluster(cluster: MapClusterRenderData) {
  const count = cluster.properties.point_count;
  const size = count >= 200 ? 72 : count >= 50 ? 64 : count >= 10 ? 56 : 48;
  const coreSize = size - (count >= 50 ? 14 : 10);
  const backgroundColor =
    count >= 200
      ? "#1E40AF"
      : count >= 50
        ? Colors.primaryDark
        : count >= 10
          ? Colors.primary
          : "#3B82F6";

  return (
    <Marker
      key={`report-cluster-${cluster.id}`}
      coordinate={{
        longitude: cluster.geometry.coordinates[0],
        latitude: cluster.geometry.coordinates[1],
      }}
      anchor={{ x: 0.5, y: 0.5 }}
      style={{ zIndex: count + 1 }}
      tracksViewChanges={false}
      onPress={cluster.onPress}
    >
      <View
        style={[
          styles.clusterHalo,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      >
        <View
          style={[
            styles.clusterCore,
            {
              width: coreSize,
              height: coreSize,
              borderRadius: coreSize / 2,
              backgroundColor,
            },
          ]}
        >
          <View style={styles.clusterHighlight} />
          <Text style={styles.clusterCount}>
            {cluster.properties.point_count_abbreviated ?? count}
          </Text>
        </View>
      </View>
    </Marker>
  );
}

export default function MapScreen() {
  const mapRef = useRef<any>(null);
  const handledReportIdRef = useRef<string | null>(null);
  const ignoreRegionChangesUntilRef = useRef(Date.now() + 1000);
  const preserveExternalScopeRef = useRef(false);
  const activeScopeRef = useRef<MapScope | null>(null);
  const initialMunicipalityKeyRef = useRef<string | null>(null);
  const areaRequestTimesRef = useRef<number[]>([]);

  const {
    reportId,
    latitude: reportLatitude,
    longitude: reportLongitude,
  } = useLocalSearchParams<{
    reportId?: string;
    latitude?: string;
    longitude?: string;
  }>();

  const {
    userLocation,
    currentCity,
    currentMunicipality,
  } = useUserLocation();
  const {
    reports,
    loading,
    hasMore,
    maxResults,
    loadReports,
  } = useMapReports();

  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [region, setRegion] = useState<MapRegion>(initialRegion);
  const [showSearchAreaButton, setShowSearchAreaButton] = useState(false);
  const [showAreaLimitNotice, setShowAreaLimitNotice] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [summaryVisible, setSummaryVisible] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [mapOverview, setMapOverview] = useState<MapOverview | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [resolvedFilter, setResolvedFilter] = useState<boolean | undefined>();
  const [dateFilter, setDateFilter] = useState<
    "today" | "7d" | "30d" | undefined
  >();
  const [priorityFilter, setPriorityFilter] = useState<
    "high" | "medium" | "low" | undefined
  >();

  const areaSearchDisabled =
    region.latitudeDelta > MAX_AREA_LATITUDE_DELTA ||
    region.longitudeDelta > MAX_AREA_LONGITUDE_DELTA;
  const foregroundPanelOpen = Boolean(
    selectedReport ||
      filterVisible ||
      summaryVisible
  );

  function currentFilters(): MapContentFilters {
    return {
      category: categoryFilter,
      resolved: resolvedFilter,
      priority: priorityFilter,
      date: dateFilter,
    };
  }

  async function loadScope(
    scope: MapScope,
    filters: MapContentFilters = currentFilters()
  ) {
    activeScopeRef.current = scope;
    setShowAreaLimitNotice(scope.type === "bounds");

    return loadReports(scopeWithFilters(scope, filters));
  }

  useEffect(() => {
    if (
      reportId ||
      preserveExternalScopeRef.current ||
      !currentCity ||
      !currentMunicipality
    ) {
      return;
    }

    const district = normalizeMunicipality(currentMunicipality);

    if (!district) {
      return;
    }

    const key = `${currentCity}|${district}`;

    if (initialMunicipalityKeyRef.current === key) {
      return;
    }

    initialMunicipalityKeyRef.current = key;
    setShowSearchAreaButton(false);
    void loadScope({
      type: "municipality",
      city: currentCity,
      district,
    });
  }, [currentCity, currentMunicipality, loadReports, reportId]);

  useEffect(() => {
    if (
      !userLocation ||
      isWeb ||
      reportId ||
      preserveExternalScopeRef.current
    ) {
      return;
    }

    const timer = setTimeout(() => {
      const nextRegion = {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.04,
        longitudeDelta: 0.04,
      };

      ignoreRegionChangesUntilRef.current = Date.now() + 2400;
      setRegion(nextRegion);
      mapRef.current?.animateToRegion(nextRegion, 2000);
    }, 300);

    return () => clearTimeout(timer);
  }, [reportId, userLocation]);

  useEffect(() => {
    if (!reportId) {
      handledReportIdRef.current = null;
      return;
    }

    const requestedReportId = String(reportId);

    if (handledReportIdRef.current === requestedReportId) {
      return;
    }

    handledReportIdRef.current = requestedReportId;
    preserveExternalScopeRef.current = true;

    void (async () => {
      try {
        const report = (await fetchReport(requestedReportId)) as Report;
        const latitude = Number(reportLatitude ?? report.latitude);
        const longitude = Number(reportLongitude ?? report.longitude);

        if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
          return;
        }

        const nextRegion: MapRegion = {
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        const scope: MapScope = {
          type: "bounds",
          bounds: getBounds(nextRegion),
          limit: DETAILED_MAP_RESULT_LIMIT,
        };

        setSelectedReport(report);
        setShowSearchAreaButton(false);
        setCategoryFilter("all");
        setResolvedFilter(undefined);
        setDateFilter(undefined);
        setPriorityFilter(undefined);
        ignoreRegionChangesUntilRef.current = Date.now() + 1200;
        setRegion(nextRegion);
        mapRef.current?.animateToRegion(nextRegion, 800);
        await loadScope(scope, {});
      } catch (error) {
        console.log("OPEN MAP REPORT ERROR:", error);
        handledReportIdRef.current = null;
        preserveExternalScopeRef.current = false;
      }
    })();
  }, [loadReports, reportId, reportLatitude, reportLongitude]);

  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (search.trim().length < 2) {
        setSuggestions([]);
        return;
      }

      try {
        setSuggestions(await fetchLocationSuggestions(search));
      } catch (error) {
        console.log("MAP LOCATION SUGGESTIONS ERROR:", error);
      }
    }, 250);

    return () => clearTimeout(timeout);
  }, [search]);

  function closeSelectedReport() {
    setSelectedReport(null);
    router.setParams({ reportId: undefined });
  }

  function selectSuggestion(item: LocationSuggestion) {
    const district = normalizeMunicipality(item.municipality);

    setSearch(item.name);
    setSuggestions([]);
    setSelectedReport(null);
    setShowSearchAreaButton(false);
    preserveExternalScopeRef.current = false;

    if (item.city && district) {
      void loadScope({
        type: "municipality",
        city: item.city,
        district,
      });
    }

    if (!isWeb) {
      const nextRegion: MapRegion = {
        latitude: item.latitude,
        longitude: item.longitude,
        latitudeDelta: 0.08,
        longitudeDelta: 0.08,
      };

      ignoreRegionChangesUntilRef.current = Date.now() + 1000;
      setRegion(nextRegion);
      mapRef.current?.animateToRegion(nextRegion, 600);
    }
  }

  function clearSearch() {
    setSearch("");
    setSuggestions([]);
  }

  function searchFirstSuggestion() {
    if (suggestions.length > 0) {
      selectSuggestion(suggestions[0]);
    }
  }

  async function searchVisibleArea() {
    if (areaSearchDisabled || loading) {
      return;
    }

    const now = Date.now();
    const recentRequests = areaRequestTimesRef.current.filter(
      (requestTime) => now - requestTime < AREA_REQUEST_WINDOW_MS
    );

    if (recentRequests.length >= MAX_AREA_REQUESTS_PER_WINDOW) {
      areaRequestTimesRef.current = recentRequests;
      Alert.alert(
        "Biraz bekleyin",
        "Bu bölgede arama işlemini 5 saniyede en fazla 5 kez yapabilirsiniz."
      );
      return;
    }

    areaRequestTimesRef.current = [...recentRequests, now];
    setShowSearchAreaButton(false);
    setSelectedReport(null);

    await loadScope({
      type: "bounds",
      bounds: getBounds(region),
      limit: isDetailedRegion(region)
        ? DETAILED_MAP_RESULT_LIMIT
        : DEFAULT_MAP_RESULT_LIMIT,
    });
  }

  async function applyFilters() {
    setFilterVisible(false);

    if (activeScopeRef.current) {
      await loadScope(activeScopeRef.current);
    }
  }

  async function resetFilters() {
    const clearedFilters: MapContentFilters = {};

    setCategoryFilter("all");
    setResolvedFilter(undefined);
    setDateFilter(undefined);
    setPriorityFilter(undefined);
    setFilterVisible(false);

    if (activeScopeRef.current) {
      await loadScope(activeScopeRef.current, clearedFilters);
    }
  }

  async function openMapSummary() {
    setSummaryVisible(true);
    setSummaryLoading(true);

    try {
      setMapOverview(await fetchMapOverview());
    } catch (error) {
      console.log("MAP OVERVIEW ERROR:", error);
      Alert.alert("Özet yüklenemedi", "Harita özeti şu anda alınamıyor.");
    } finally {
      setSummaryLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      {!foregroundPanelOpen && (
        <>
          <SearchBar
            search={search}
            setSearch={setSearch}
            suggestions={suggestions}
            onSelectSuggestion={selectSuggestion}
            onSearch={searchFirstSuggestion}
            onClear={clearSearch}
          />

          <MapControls
            showSearchAreaButton={showSearchAreaButton}
            onShowSearchArea={searchVisibleArea}
            searchAreaDisabled={areaSearchDisabled}
            searchAreaLoading={loading}
            onOpenFilters={() => setFilterVisible(true)}
            onOpenSummary={openMapSummary}
          />
        </>
      )}

      {isWeb ? (
        <View style={[styles.map, styles.webFallback]}>
          <AppCard style={styles.webCard}>
            <AppText
              variant="title"
              color={Colors.primary}
              style={styles.webFallbackTitle}
            >
              Harita webde kullanılamıyor
            </AppText>
            <AppText
              variant="body"
              color={Colors.textSecondary}
              style={styles.webFallbackText}
            >
              Bu özellik yalnızca mobil cihazlarda desteklenir.
            </AppText>
          </AppCard>
        </View>
      ) : (
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={initialRegion}
          clusteringEnabled
          radius={CLUSTER_RADIUS}
          extent={512}
          minPoints={2}
          maxZoom={CLUSTER_MAX_ZOOM}
          tracksViewChanges={false}
          renderCluster={renderMapCluster}
          spiralEnabled={false}
          edgePadding={{ top: 80, left: 80, right: 80, bottom: 140 }}
          onRegionChangeComplete={(newRegion: MapRegion) => {
            setRegion(newRegion);

            if (Date.now() < ignoreRegionChangesUntilRef.current) {
              return;
            }

            setShowSearchAreaButton(true);
          }}
        >
          {createMapMarkers(reports, setSelectedReport)}

          {userLocation && (
            <Marker
              coordinate={userLocation}
              tracksViewChanges={false}
              cluster={false}
            >
              <View style={styles.userMarker} />
            </Marker>
          )}
        </MapView>
      )}

      {(showAreaLimitNotice || hasMore) && !foregroundPanelOpen && (
        <AppText style={styles.areaLimitNotice}>
          {hasMore
            ? `${maxResults}'den fazla sonuç var. İlk ${maxResults} sonuç gösteriliyor; devamını görmek için yakınlaşın.`
            : `Aynı anda en fazla ${maxResults} sonuç gösterilebilmektedir.`}
        </AppText>
      )}

      {loading && !foregroundPanelOpen && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <AppText
            variant="bodyMedium"
            color={Colors.textSecondary}
            style={styles.loadingText}
          >
            Raporlar yükleniyor...
          </AppText>
        </View>
      )}

      <FilterModal
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        resolvedFilter={resolvedFilter}
        setResolvedFilter={setResolvedFilter}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        priorityFilter={priorityFilter}
        setPriorityFilter={setPriorityFilter}
        onApply={applyFilters}
        onReset={resetFilters}
      />

      <MapOverviewCard
        visible={summaryVisible}
        overview={mapOverview}
        loading={summaryLoading}
        onClose={() => setSummaryVisible(false)}
      />

      {selectedReport && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Açık kartı kapat"
          style={styles.panelBackdrop}
          onPress={closeSelectedReport}
        />
      )}

      <ReportCard report={selectedReport} onClose={closeSelectedReport} />
    </View>
  );
}

function normalizeMunicipality(value: string | null | undefined) {
  return value
    ?.trim()
    .replace(/\s+belediyesi$/iu, "")
    .trim();
}

function getBounds(region: MapRegion): MapBounds {
  return {
    north: Math.min(90, region.latitude + region.latitudeDelta / 2),
    south: Math.max(-90, region.latitude - region.latitudeDelta / 2),
    east: Math.min(180, region.longitude + region.longitudeDelta / 2),
    west: Math.max(-180, region.longitude - region.longitudeDelta / 2),
  };
}

function isDetailedRegion(region: MapRegion) {
  return (
    region.latitudeDelta <= DETAILED_LATITUDE_DELTA &&
    region.longitudeDelta <= DETAILED_LONGITUDE_DELTA
  );
}

function scopeWithFilters(
  scope: MapScope,
  filters: MapContentFilters
): MapReportFilters {
  if (scope.type === "municipality") {
    return {
      ...filters,
      city: scope.city,
      district: scope.district,
    };
  }

  return {
    ...filters,
    bounds: scope.bounds,
    limit: scope.limit,
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  clusterHalo: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(59, 130, 246, 0.22)",
  },
  clusterCore: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.94)",
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 7,
  },
  clusterHighlight: {
    position: "absolute",
    top: 5,
    left: 9,
    width: 10,
    height: 4,
    borderRadius: 3,
    backgroundColor: "rgba(255, 255, 255, 0.28)",
    transform: [{ rotate: "-18deg" }],
  },
  clusterCount: {
    color: Colors.textInverse,
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: -0.4,
    textAlign: "center",
    textShadowColor: "rgba(15, 23, 42, 0.22)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  panelBackdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 40,
    backgroundColor: "rgba(15, 23, 42, 0.18)",
  },
  userMarker: {
    width: MapTokens.userMarkerSize,
    height: MapTokens.userMarkerSize,
    borderRadius: MapTokens.userMarkerSize / 2,
    backgroundColor: Colors.primary,
    borderWidth: MapTokens.userMarkerBorderWidth,
    borderColor: Colors.textInverse,
  },
  areaLimitNotice: {
    position: "absolute",
    right: Spacing.lg,
    bottom: Spacing.lg,
    maxWidth: 210,
    color: Colors.textSecondary,
    fontSize: 10,
    lineHeight: 13,
    fontWeight: "500",
    textAlign: "right",
    zIndex: 17,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.overlayLoading,
  },
  loadingText: {
    marginTop: Spacing.md,
  },
  webFallback: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xxl,
    backgroundColor: Colors.background,
  },
  webCard: {
    width: "100%",
  },
  webFallbackTitle: {
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  webFallbackText: {
    textAlign: "center",
    lineHeight: 22,
  },
});
