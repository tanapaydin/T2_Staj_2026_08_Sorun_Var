import { API_CONFIG } from "../config/api";
import { Report } from "../types/report";

export async function fetchReports(): Promise<Report[]> {
  const response = await fetch(`${API_CONFIG.BASE_URL}/reports`);

  if (!response.ok) {
    throw new Error("Failed to fetch reports");
  }

  return response.json();
}

export async function searchLocation(query: string) {
  const response = await fetch(
    `${API_CONFIG.BASE_URL}/reports/search?query=${encodeURIComponent(query)}`
  );

  if (!response.ok) {
    throw new Error("Location search failed");
  }

  return response.json();
}
export type LocationSuggestion = {
  name: string;
  latitude: number;
  longitude: number;
};

export async function fetchLocationSuggestions(
  query: string
): Promise<LocationSuggestion[]> {
  if (query.trim().length < 2) return [];

  const response = await fetch(
    `${API_CONFIG.BASE_URL}/reports/search/suggestions?query=${encodeURIComponent(query)}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch location suggestions");
  }

  return response.json();
}
export type ReportStatistics = {
  total_reports: number;
  resolved_reports: number;
  pending_reports: number;
  average_progress: number;
  resolution_rate: number;
};

export async function fetchStatistics(): Promise<ReportStatistics> {
  const response = await fetch(
    `${API_CONFIG.BASE_URL}/reports/statistics`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch statistics");
  }

  return response.json();
}

export type CategoryStatistics = {
  category: string;
  count: number;
};

export async function fetchCategoryStatistics(): Promise<CategoryStatistics[]> {
  const response = await fetch(
    `${API_CONFIG.BASE_URL}/reports/statistics/category`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch category statistics");
  }

  return response.json();
}