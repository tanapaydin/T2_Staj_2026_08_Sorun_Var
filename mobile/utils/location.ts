import { Report } from "../types/report";

export function detectCity(
  lat: number,
  lon: number
): string {
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

export function filterReportsByCity(
  reports: Report[],
  city: string | null
): Report[] {
  if (!city) return reports;

  return reports.filter((report) => {
    return (
      detectCity(
        report.latitude,
        report.longitude
      ) === city
    );
  });
}