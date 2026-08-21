import { Platform, View } from "react-native";

import { Report } from "../../types/report";
import { getMarkerColor } from "../../utils/map";

let Marker: any = View;

if (Platform.OS !== "web") {
  Marker = require("react-native-maps").Marker;
}

/**
 * Marker dizisini doğrudan ClusteredMapView'a verir. Araya bir React bileşeni
 * girerse cluster kütüphanesi Markerların coordinate prop'unu göremez.
 */
export function createMapMarkers(
  reports: Report[],
  onSelectReport: (report: Report) => void
) {
  if (Platform.OS === "web") {
    return [];
  }

  return reports.map((report) => (
    <Marker
      key={report.id}
      coordinate={{
        latitude: report.latitude,
        longitude: report.longitude,
      }}
      pinColor={getMarkerColor(report.category)}
      tracksViewChanges={false}
      onPress={() => onSelectReport(report)}
    />
  ));
}
