import React from "react";
import {
  Platform,
  StyleSheet,
  View,
} from "react-native";

import { Report } from "../../types/report";
import { getMarkerColor } from "../../utils/map";
import { AppText } from "../common";
import { Colors } from "../../theme";

let Marker: any = View;

if (Platform.OS !== "web") {
  const maps = require("react-native-maps");
  Marker = maps.Marker;
}

// ============================================================
// TYPES
// ============================================================

export type CityCategoryStat = {
  category: string;
  count: number;
};

export type CityDistrictStat = {
  district: string;
  count: number;
};

export type CityClusterDetails = {
  name: string;
  count: number;
  latitude: number;
  longitude: number;
  districts: CityDistrictStat[];
  categories: CityCategoryStat[];
};

type Props = {
  reports: Report[];
  onSelectReport: (
    report: Report
  ) => void;
  onSelectCity: (
    city: CityClusterDetails
  ) => void;
  latitudeDelta: number;
};

// ============================================================
// COMPONENT
// ============================================================

export default function MapMarkers({
  reports,
  onSelectReport,
  onSelectCity,
  latitudeDelta,
}: Props) {
  if (Platform.OS === "web") {
    return null;
  }

  // ==========================================================
  // YAKIN ZOOM
  // ==========================================================
  //
  // Yakınlaşınca şehir cluster'ı yerine
  // gerçek rapor markerlarını gösteriyoruz.
  //

  if (latitudeDelta < 2.5) {
    return (
      <>
        {reports.map((report) => (
          <Marker
            key={report.id}
            coordinate={{
              latitude: report.latitude,
              longitude: report.longitude,
            }}
            pinColor={getMarkerColor(
              report.category
            )}
            onPress={() =>
              onSelectReport(report)
            }
          />
        ))}
      </>
    );
  }

  // ==========================================================
  // UZAK ZOOM
  // ==========================================================
  //
  // Uzaklaşınca şehir bazlı özet markerları
  // gösteriyoruz.
  //

  const cityGroups =
    groupReportsByCity(reports);

  return (
    <>
      {cityGroups.map((city) => (
        <Marker
          key={city.name}
          coordinate={{
            latitude: city.latitude,
            longitude: city.longitude,
          }}
          onPress={() =>
            onSelectCity(city)
          }
        >
          <View
            style={
              styles.clusterContainer
            }
          >
            <View
              style={
                styles.clusterInner
              }
            >
              <AppText
                variant="bodyMedium"
                color="#FFFFFF"
                style={
                  styles.clusterText
                }
              >
                {city.count}
              </AppText>
            </View>
          </View>
        </Marker>
      ))}
    </>
  );
}

// ============================================================
// ŞEHİR GRUPLAMA
// ============================================================

function groupReportsByCity(
  reports: Report[]
): CityClusterDetails[] {
  const groups: Record<
    string,
    CityClusterDetails
  > = {};

  for (const report of reports) {
    // --------------------------------------------------------
    // ŞEHİR
    // --------------------------------------------------------
    //
    // Artık koordinattan şehir tahmini yapmıyoruz.
    // Backend'den gelen city alanını kullanıyoruz.
    //

    const city =
      report.city?.trim() ||
      "Bilinmeyen";

    // --------------------------------------------------------
    // İLK KAYIT
    // --------------------------------------------------------

    if (!groups[city]) {
      groups[city] = {
        name: city,

        latitude:
          report.latitude,

        longitude:
          report.longitude,

        count: 0,

        districts: [],

        categories: [],
      };
    }

    const group =
      groups[city];

    // --------------------------------------------------------
    // TOPLAM RAPOR
    // --------------------------------------------------------

    group.count += 1;

    // --------------------------------------------------------
    // ŞEHİR MERKEZİ
    // --------------------------------------------------------
    //
    // Şehir marker'ı tek bir raporun konumuna değil,
    // o şehirdeki raporların ortalama koordinatına gider.
    //

    group.latitude =
      (
        group.latitude *
          (group.count - 1) +
        report.latitude
      ) /
      group.count;

    group.longitude =
      (
        group.longitude *
          (group.count - 1) +
        report.longitude
      ) /
      group.count;

    // --------------------------------------------------------
    // İLÇE
    // --------------------------------------------------------

    const district =
      report.district?.trim();

    if (district) {
      const existingDistrict =
        group.districts.find(
          (item) =>
            item.district ===
            district
        );

      if (existingDistrict) {
        existingDistrict.count += 1;
      } else {
        group.districts.push({
          district,
          count: 1,
        });
      }
    }

    // --------------------------------------------------------
    // KATEGORİ
    // --------------------------------------------------------

    const category =
      report.category?.trim();

    if (category) {
      const existingCategory =
        group.categories.find(
          (item) =>
            item.category ===
            category
        );

      if (existingCategory) {
        existingCategory.count += 1;
      } else {
        group.categories.push({
          category,
          count: 1,
        });
      }
    }
  }

  // ==========================================================
  // SIRALAMA
  // ==========================================================
  //
  // En fazla raporu olan ilçe/kategori üstte.
  //

  return Object.values(
    groups
  ).map((city) => ({
    ...city,

    districts: [
      ...city.districts,
    ].sort(
      (a, b) =>
        b.count - a.count
    ),

    categories: [
      ...city.categories,
    ].sort(
      (a, b) =>
        b.count - a.count
    ),
  }));
}

// ============================================================
// STYLES
// ============================================================

const styles =
  StyleSheet.create({
    clusterContainer: {
      width: 38,
      height: 38,
      borderRadius: 19,

      backgroundColor:
        Colors.primary,

      justifyContent:
        "center",

      alignItems:
        "center",

      borderWidth: 2,
      borderColor:
        "#FFFFFF",

      shadowColor:
        "#000000",

      shadowOffset: {
        width: 0,
        height: 2,
      },

      shadowOpacity:
        0.22,

      shadowRadius:
        4,

      elevation: 5,
    },

    clusterInner: {
      width: 30,
      height: 30,
      borderRadius: 15,

      justifyContent:
        "center",

      alignItems:
        "center",

      backgroundColor:
        "rgba(255,255,255,0.10)",
    },

    clusterText: {
      fontSize: 14,
      fontWeight: "800",
    },
  });