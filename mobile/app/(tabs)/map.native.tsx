import { useEffect, useRef, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { Platform, StyleSheet, View, ActivityIndicator } from "react-native";

import { useReports } from "../../hooks/useReports";
import CitySummaryCard from "../../components/map/CitySummaryCard";

import {
  AppCard,
  AppText,
} from "../../components/common";

import {
  Colors,
  MapTokens,
  Spacing,
} from "../../theme";

import {
  fetchLocationSuggestions,
  LocationSuggestion,
} from "../../lib/api";

import { Report } from "../../types/report";

import FilterModal from "../../components/map/FilterModal";
import MapMarkers, {
  CityClusterDetails,
} from "../../components/map/MapMarkers";
import ReportCard from "../../components/map/ReportCard";
import SearchBar from "../../components/map/SearchBar";
import MapControls from "../../components/map/MapControls";
import { useUserLocation } from "../../hooks/useUserLocation";
import { useMapCityFilter } from "../../hooks/useMapCityFilter";

const isWeb = Platform.OS === "web";

let MapView: any = View;
let Marker: any = View;
let Circle: any = View;

if (!isWeb) {
  MapView = require("react-native-map-clustering").default;
  const ReactNativeMaps = require("react-native-maps");
  Marker = ReactNativeMaps.Marker;
  Circle = ReactNativeMaps.Circle;
}

export default function MapScreen() {
  const mapRef = useRef<any>(null);

  const {
    reportId,
    latitude: reportLatitude,
    longitude: reportLongitude,
  } = useLocalSearchParams<{
    reportId?: string;
    latitude?: string;
    longitude?: string;
  }>();

  const { userLocation, currentCity } =
    useUserLocation();
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [selectedCity, setSelectedCity] =
    useState<CityClusterDetails | null>(null);
  const [region, setRegion] = useState({
    latitude: 39.925,
    longitude: 32.8369,
    latitudeDelta: 1.2,
    longitudeDelta: 1.2, 
  });
  const {
    reports,
    loading,
    applyFilters: applyReportFilters,
    resetFilters: resetReportFilters,
  } = useReports();

  const {
    cityFilterMode,
    visibleReports,
    showSearchAreaButton,
    handleSearchCity,
    handleRegionCity,
    showSearchArea,
    showCurrentCity,
    showAllCities,
  } = useMapCityFilter(reports, currentCity);

  useEffect(() => {
    if (!reportId) {
      return;
    }

    const report = visibleReports.find(
      (item) => String(item.id) === String(reportId)
    );

    if (report) {
      setSelectedCity(null);
      setSelectedReport(report);
    }
  }, [reportId, visibleReports]);

  const [filterVisible, setFilterVisible] = useState(false);

  const [categoryFilter, setCategoryFilter] = useState("all");

  const [resolvedFilter, setResolvedFilter] = useState<
    boolean | undefined
  >(undefined);

  const [dateFilter, setDateFilter] = useState<
    "today" | "7d" | "30d" | undefined
  >(undefined);

  const [priorityFilter, setPriorityFilter] = useState<
    "high" | "medium" | "low" | undefined
  >(undefined);

  useEffect(() => {
    if (!userLocation || isWeb) return;

    if (reportLatitude && reportLongitude){
      return;
    }

    const timer = setTimeout(() => {
      mapRef.current?.animateToRegion(
        {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.04,
          longitudeDelta: 0.04,
        },
        2000
      );
    }, 300);

    return () => clearTimeout(timer);
  }, [
    userLocation,
    reportLatitude,
    reportLongitude,
  ]);

  useEffect(() => {
    if (
      isWeb ||
      !reportLatitude ||
      !reportLongitude
    ) {
      return;
    }

    const latitude = Number(reportLatitude);
    const longitude = Number(reportLongitude);

    if (
      Number.isNaN(latitude) ||
      Number.isNaN(longitude)
    ) {
      return;
    }

    const timer = setTimeout(() => {
      mapRef.current?.animateToRegion(
        {
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        800
      );
    }, 400);

    return () => clearTimeout(timer);
  }, [
    reportLatitude,
    reportLongitude,
  ]);

  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (search.trim().length < 2) {
        setSuggestions([]);
        return;
      }

      try {
        const data = await fetchLocationSuggestions(search);
        setSuggestions(data);
      } catch (error) {
        console.log(error);
      }
    }, 250);

    return () => clearTimeout(timeout);
  }, [search]);

  function selectSuggestion(item: LocationSuggestion) {
    setSearch(item.name);
    setSuggestions([]);

    const city = detectCity(item.latitude, item.longitude);
    handleSearchCity(city);

    if (!isWeb) {
      mapRef.current?.animateToRegion(
        {
          latitude: item.latitude,
          longitude: item.longitude,
          latitudeDelta: 0.08,
          longitudeDelta: 0.08,
        },
        600
      );
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
  function detectCity(lat: number, lon: number) {
    // Ankara
    if (
      lat > 39.5 &&
      lat < 40.2 &&
      lon > 32.4 &&
      lon < 33.2
    ) {
      return "Ankara";
    }

    // İstanbul
    if (
      lat > 40.8 &&
      lat < 41.3 &&
      lon > 28.5 &&
      lon < 29.5
    ) {
      return "İstanbul";
    }

    // İzmir
    if (
      lat > 38.2 &&
      lat < 38.6 &&
      lon > 26.8 &&
      lon < 27.4
    ) {
      return "İzmir";
    }

    return "Diğer";
  }

  async function applyFilters() {
    setFilterVisible(false);

    await applyReportFilters({
      category: categoryFilter,
      resolved: resolvedFilter,
      priority: priorityFilter,
      date: dateFilter,
      sort: "newest",
    });
  }

  async function resetFilters() {
    setCategoryFilter("all");
    setResolvedFilter(undefined);
    setDateFilter(undefined);
    setPriorityFilter(undefined);

    setFilterVisible(false);

    await resetReportFilters();
  }

  return (
    <View style={styles.container}>
      {/* Arama */}
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
        onShowSearchArea={showSearchArea}
        isSearchMode={cityFilterMode === "search"}
        onShowCurrentCity={showCurrentCity}
        onOpenFilters={() => setFilterVisible(true)}
      />

      {/* Harita */}
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
          initialRegion={region}
          onRegionChangeComplete={(
            newRegion: {
              latitude: number;
              longitude: number;
              latitudeDelta: number;
              longitudeDelta: number;
            }
          ) => {
            setRegion(newRegion);

            const city = detectCity(
              newRegion.latitude,
              newRegion.longitude
            );

            handleRegionCity(city);
          }}
        >
          <MapMarkers
            reports={visibleReports}
            onSelectReport={(report) => {
              setSelectedCity(null);
              setSelectedReport(report);
            }}
            onSelectCity={(city) => {
              setSelectedReport(null);
              setSelectedCity(city);
            }}
            latitudeDelta={region.latitudeDelta}
          />

          {userLocation && (
            <>
              <Circle
                center={userLocation}
                radius={45}
                strokeWidth={2}
                strokeColor="rgba(37, 99, 235, 0.65)"
                fillColor="rgba(37, 99, 235, 0.18)"
              />
              <Marker
                coordinate={userLocation}
                tracksViewChanges={false}
              >
                <View
                  style={{
                    width: MapTokens.userMarkerSize,
                    height: MapTokens.userMarkerSize,
                    borderRadius: MapTokens.userMarkerSize / 2,
                    backgroundColor: Colors.primary,
                    borderWidth: MapTokens.userMarkerBorderWidth,
                    borderColor: Colors.textInverse,
                  }}
                />
              </Marker>
            </>
          )}
        </MapView>
      )}

      {/* Loading */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator
            size="large"
            color={Colors.primary}
          />

          <AppText
            variant="bodyMedium"
            color={Colors.textSecondary}
            style={styles.loadingText}
          >
            Raporlar yükleniyor...
          </AppText>
        </View>
      )}

      {/* Filtre Modal */}
      <FilterModal
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}

        cityFilterMode={cityFilterMode}
        onShowCurrentCity={showCurrentCity}
        onShowAllCities={showAllCities}

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

      {/* Seçilen rapor */}
      <ReportCard
        report={selectedReport}
        onClose={() => setSelectedReport(null)}
        onGoToLocation={() => {
          if (!selectedReport) return;

          mapRef.current?.animateToRegion(
            {
              latitude: selectedReport.latitude,
              longitude: selectedReport.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            },
            800
          );
        }}
      />
      <CitySummaryCard
        city={selectedCity}
        onClose={() => setSelectedCity(null)}
      />
    </View>
  );
  
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  map: {
    flex: 1,
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
    marginTop: 12,
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
