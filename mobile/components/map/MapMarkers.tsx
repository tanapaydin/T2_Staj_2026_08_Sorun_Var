import React from "react";
import { Platform, View, StyleSheet } from "react-native";

import { Report } from "../../types/report";
import { getMarkerColor } from "../../utils/map";
import { AppText } from "../common";
import { Colors } from "../../theme";

let Marker: any = View;

if (Platform.OS !== "web") {
  const maps = require("react-native-maps");
  Marker = maps.Marker;
}

type Props = {
  reports: Report[];
  onSelectReport: (report: Report) => void;
  onSelectCity: (city: { name: string; count: number }) => void;
  latitudeDelta: number;
};

export default function MapMarkers({
  reports,
  onSelectReport,
  onSelectCity,
  latitudeDelta,
}: Props) {
  if (Platform.OS === "web") return null;

  // Yakın zoom: normal markerlar
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
            pinColor={getMarkerColor(report.category)}
            onPress={() => onSelectReport(report)}
          />
        ))}
      </>
    );
  }

  // Uzak zoom: şehir bazlı özet markerlar
  const cityGroups = groupReportsByCity(reports);

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
            onSelectCity({
              name: city.name,
              count: city.count,
            })
          }
        >
          <View style={styles.clusterContainer}>
            <View style={styles.clusterInner}>
              <AppText
                variant="bodyMedium"
                color="#FFFFFF"
                style={styles.clusterText}
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

function groupReportsByCity(reports: Report[]) {
  const groups: Record<
    string,
    {
      name: string;
      latitude: number;
      longitude: number;
      count: number;
    }
  > = {};

  for (const report of reports) {
    const city = detectCity(report.latitude, report.longitude);

    if (!groups[city]) {
      groups[city] = {
        name: city,
        latitude: report.latitude,
        longitude: report.longitude,
        count: 0,
      };
    }

    groups[city].count += 1;
  }

  return Object.values(groups);
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

const styles = StyleSheet.create({
  clusterContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,

    backgroundColor: Colors.primary,

    justifyContent: "center",
    alignItems: "center",

    borderWidth: 2,
    borderColor: "#FFFFFF",

    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.22,
    shadowRadius: 4,

    elevation: 5,
  },

  clusterInner: {
    width: 30,
    height: 30,
    borderRadius: 15,

    justifyContent: "center",
    alignItems: "center",

    backgroundColor: "rgba(255,255,255,0.10)",
  },

  clusterText: {
    fontSize: 14,
    fontWeight: "800",
  },
});