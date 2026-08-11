import { useEffect, useRef, useState } from "react";
import { Platform, StyleSheet, View, ActivityIndicator, Pressable } from "react-native";

import { useReports } from "../../hooks/useReports";
import CitySummaryCard from "../../components/map/CitySummaryCard";

import {
  AppButton,
  AppCard,
  AppText,
} from "../../components/common";

import {
  Colors,
  Spacing,
} from "../../theme";

import {
  fetchLocationSuggestions,
  LocationSuggestion,
} from "../../lib/api";

import { Report } from "../../types/report";

import FilterModal from "../../components/map/FilterModal";
import MapMarkers from "../../components/map/MapMarkers";
import ReportCard from "../../components/map/ReportCard";
import SearchBar from "../../components/map/SearchBar";
import { useUserLocation } from "../../hooks/useUserLocation";
import { useMapCityFilter } from "../../hooks/useMapCityFilter";

const isWeb = Platform.OS === "web";

let MapView: any = View;
let Marker: any = View;

if (!isWeb) {
  MapView = require("react-native-map-clustering").default;
  Marker = require("react-native-maps").Marker;
}

export default function MapScreen() {
  const mapRef = useRef<any>(null);

  const { userLocation, currentCity } =
    useUserLocation();
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [selectedCity, setSelectedCity] = useState<{
  name: string;
  count: number;
} | null>(null);
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
  }, [userLocation]);

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

      {showSearchAreaButton && (
        <View style={styles.searchAreaButtonContainer}>
          <AppButton
            title="Bu bölgedeki şikayetleri göster"
            onPress={showSearchArea}
          />
        </View>
      )}

      {/* Filtre */}
      <View style={styles.filterBar}>
        <View style={styles.filterRow}>
          <AppButton
            title="Filtre"
            variant="secondary"
            onPress={() => setFilterVisible(true)}
            style={styles.filterButton}
          />

          {cityFilterMode === "search" && (
            <Pressable
              onPress={showCurrentCity}
              style={styles.searchModeButton}
            >
              <AppText
                variant="bodyMedium"
                color={Colors.textSecondary}
                style={styles.searchModeText}
              >
                Bölgede arama
              </AppText>

              <AppText
                variant="bodyMedium"
                color={Colors.textSecondary}
                style={styles.searchModeClose}
              >
                ×
              </AppText>
            </Pressable>
          )}
        </View>
      </View>

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
            <Marker
              coordinate={userLocation}
              tracksViewChanges={false}
            >
              <View
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  backgroundColor: "#2563EB",
                  borderWidth: 3,
                  borderColor: "#FFFFFF",
                }}
              />
            </Marker>
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
    backgroundColor: "rgba(255,255,255,0.8)",
  },

  loadingText: {
    marginTop: 12,
  },

  webFallback: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
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
  clusterContainer: {
  width: 44,
  height: 44,
  borderRadius: 22,
  backgroundColor: Colors.primary,
  justifyContent: "center",
  alignItems: "center",
  borderWidth: 2,
  borderColor: "#FFFFFF",
},
searchAreaButtonContainer: {
  position: "absolute",
  top: 118,
  left: 20,
  right: 20,
  alignItems: "center",
  zIndex: 1000,
  elevation: 10,
},
filterBar: {
  position: "absolute",
  top: 120,
  left: 20,
  right: 20,
  zIndex: 18,
},

filterRow: {
  flexDirection: "row",
  alignItems: "center",
},

filterButton: {
  alignSelf: "flex-start",
},

searchModeButton: {
  marginLeft: 8,
  height: 40,
  paddingLeft: 14,
  paddingRight: 10,
  borderRadius: 20,
  backgroundColor: "rgba(255, 255, 255, 0.82)",
  borderWidth: 1,
  borderColor: "rgba(0, 0, 0, 0.08)",
  flexDirection: "row",
  alignItems: "center",
},

searchModeText: {
  fontSize: 13,
},

searchModeClose: {
  marginLeft: 8,
  fontSize: 18,
  lineHeight: 20,
},
});