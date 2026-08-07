import { useEffect, useRef, useState } from "react";
import {
  Platform,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  ScrollView,
} from "react-native";

const isWeb = Platform.OS === "web";
let MapView: any = View;
let Marker: any = View;

if (!isWeb) {
  const maps = require("react-native-maps");
  MapView = maps.default;
  Marker = maps.Marker;
}

import {
  fetchReports,
  fetchLocationSuggestions,
  LocationSuggestion,
} from "../../lib/api";
import { Report } from "../../types/report";

const categories = [
  { label: "Tümü", value: "all" },
  { label: "Yol", value: "road" },
  { label: "Çöp", value: "trash" },
  { label: "Aydınlatma", value: "lighting" },
  { label: "İnşaat", value: "construction" },
  { label: "Su", value: "water" },
  { label: "Park", value: "park" },
  { label: "Trafik", value: "traffic" },
  { label: "Gürültü", value: "noise" },
  { label: "Hayvan", value: "animal" },
  { label: "Diğer", value: "other" },
];

export default function MapScreen() {
  const mapRef = useRef<any>(null);

  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");

  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] =
    useState<Report | null>(null);

  useEffect(() => {
    loadReports();
  }, []);

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

  async function loadReports() {
    try {
      setLoading(true);

      const data = await fetchReports();
      setReports(data);

      if (data.length > 0 && !isWeb) {
        setTimeout(() => {
          mapRef.current?.fitToCoordinates(
            data.map((r: Report) => ({
              latitude: r.latitude,
              longitude: r.longitude,
            })),
            {
              edgePadding: {
                top: 180,
                right: 60,
                bottom: 250,
                left: 60,
              },
              animated: true,
            }
          );
        }, 300);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  const filteredReports =
    selectedCategory === "all"
      ? reports
      : reports.filter((r) => r.category === selectedCategory);

  function getMarkerColor(category: string) {
    switch (category) {
      case "road":
        return "#EF4444";
      case "trash":
        return "#22C55E";
      case "lighting":
        return "#F59E0B";
      case "construction":
        return "#64748B";
      case "water":
        return "#2563EB";
      case "park":
        return "#16A34A";
      case "traffic":
        return "#7C3AED";
      case "noise":
        return "#DB2777";
      case "animal":
        return "#92400E";
      default:
        return "#475569";
    }
  }

  function selectSuggestion(item: LocationSuggestion) {
    setSearch(item.name);
    setSuggestions([]);

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

  return (
    <View style={styles.container}>
      {/* Arama Kutusu */}
            {/* Arama Kutusu */}
      <View style={styles.searchContainer}>
        <TextInput
          placeholder="İl veya ilçe ara"
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
          returnKeyType="search"
          onSubmitEditing={searchFirstSuggestion}
        />

        {search.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={clearSearch}
          >
            <Text style={styles.clearButtonText}>✕</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.searchButton}
          onPress={searchFirstSuggestion}
        >
          <Text style={styles.searchButtonText}>Ara</Text>
        </TouchableOpacity>
      </View>

      {/* Öneriler */}
      {suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          {suggestions.map((item, index) => (
            <TouchableOpacity
              key={`${item.name}-${index}`}
              style={styles.suggestionItem}
              onPress={() => selectSuggestion(item)}
            >
              <Text style={styles.suggestionText}>
                {item.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Kategori Filtreleri */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryContainer}
        contentContainerStyle={styles.categoryContent}
      >
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.value}
            style={[
              styles.categoryChip,
              selectedCategory === cat.value &&
                styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategory(cat.value)}
          >
            <Text
              style={[
                styles.categoryChipText,
                selectedCategory === cat.value &&
                  styles.categoryChipTextActive,
              ]}
            >
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Harita */}
      {isWeb ? (
        <View style={[styles.map, styles.webFallback]}>
          <Text style={styles.webFallbackTitle}>Harita webde kullanılamıyor</Text>
          <Text style={styles.webFallbackText}>
            Bu özellik yalnızca mobil cihazlarda desteklenir.
          </Text>
        </View>
      ) : (
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={{
            latitude: 39.925,
            longitude: 32.8369,
            latitudeDelta: 0.12,
            longitudeDelta: 0.12,
          }}
        >
          {filteredReports.map((report) => (
            <Marker
              key={report.id}
              coordinate={{
                latitude: report.latitude,
                longitude: report.longitude,
              }}
              pinColor={getMarkerColor(report.category)}
              onPress={() => setSelectedReport(report)}
            />
          ))}
        </MapView>
      )}

      {/* Loading */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>
            Raporlar yükleniyor...
          </Text>
        </View>
      )}

      {/* Detay Kartı */}
      {selectedReport && (
        <View style={styles.bottomCard}>
          <Text style={styles.cardTitle}>
            {selectedReport.title}
          </Text>

          <Text style={styles.cardText}>
            Kategori: {selectedReport.category}
          </Text>

          <Text style={styles.cardText}>
            Durum: {selectedReport.status}
          </Text>

          <Text style={styles.cardText}>
            Öncelik: {selectedReport.priority}
          </Text>

          <Text style={styles.cardText}>
            Görüntülenme: {selectedReport.view_count}
          </Text>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setSelectedReport(null)}
          >
            <Text style={styles.closeText}>
              Kapat
            </Text>
          </TouchableOpacity>
        </View>
      )}
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

  searchContainer: {
  position: "absolute",
  top: 55,
  left: 20,
  right: 20,
  zIndex: 20,

  flexDirection: "row",
  alignItems: "center",

  backgroundColor: "white",
  borderRadius: 16,

  paddingHorizontal: 14,
  paddingVertical: 10,

  elevation: 6,

  shadowColor: "#000",
  shadowOffset: {
    width: 0,
    height: 3,
  },
  shadowOpacity: 0.1,
  shadowRadius: 8,
},

searchInput: {
  flex: 1,
  fontSize: 16,
  paddingVertical: 4,
},

clearButton: {
  width: 32,
  height: 32,
  borderRadius: 16,
  justifyContent: "center",
  alignItems: "center",
  marginRight: 8,
},

clearButtonText: {
  fontSize: 16,
  color: "#64748B",
  fontWeight: "700",
},

searchButton: {
  backgroundColor: "#2563EB",
  paddingHorizontal: 14,
  paddingVertical: 8,
  borderRadius: 10,
},

searchButtonText: {
  color: "white",
  fontWeight: "700",
},

  suggestionsContainer: {
    position: "absolute",
    top: 115,
    left: 20,
    right: 20,
    zIndex: 19,

    backgroundColor: "white",

    borderRadius: 16,

    overflow: "hidden",

    elevation: 6,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },

  suggestionItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },

  suggestionText: {
    fontSize: 15,
    color: "#111827",
  },

  categoryContainer: {
    position: "absolute",
    top: 120,
    left: 0,
    right: 0,
    zIndex: 18,
  },

  categoryContent: {
    paddingHorizontal: 16,
  },

  categoryChip: {
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    marginRight: 10,
    elevation: 4,
  },

  categoryChipActive: {
    backgroundColor: "#2563EB",
  },

  categoryChipText: {
    color: "#334155",
    fontWeight: "600",
  },

  categoryChipTextActive: {
    color: "white",
  },

  bottomCard: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,

    backgroundColor: "white",

    borderRadius: 20,

    padding: 20,

    elevation: 8,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },

  cardTitle: {
    fontSize: 20,

    fontWeight: "800",

    marginBottom: 10,
  },

  cardText: {
    fontSize: 15,

    marginBottom: 6,

    color: "#334155",
  },

  closeButton: {
    marginTop: 16,

    backgroundColor: "#2563EB",

    borderRadius: 12,

    paddingVertical: 12,

    alignItems: "center",
  },

  closeText: {
    color: "white",

    fontWeight: "700",

    fontSize: 15,
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

    color: "#334155",

    fontSize: 15,

    fontWeight: "600",
  },

  webFallback: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    backgroundColor: "#F8FAFC",
  },
  webFallbackTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1D4ED8",
    marginBottom: 10,
    textAlign: "center",
  },
  webFallbackText: {
    fontSize: 16,
    color: "#475569",
    textAlign: "center",
    lineHeight: 22,
  },
});