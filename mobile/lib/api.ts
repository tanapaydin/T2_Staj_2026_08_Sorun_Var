import { API_CONFIG } from "../config/api";
import { Report } from "../types/report";

export type ReportFilters = {
  category?: string;
  resolved?: boolean;
  priority?: "high" | "medium" | "low";
  date?: "today" | "7d" | "30d";
  sort?: "newest" | "oldest" | "most_viewed";
};

export type CreateReportInput = {
  title: string;
  description: string;
  category: string;
  latitude: number;
  longitude: number;
};

async function parseError(response: Response) {
  try {
    const data = await response.json();
    return data?.detail || data?.message || "İşlem başarısız oldu.";
  } catch {
    return "İşlem başarısız oldu.";
  }
}

export async function fetchReports(
  filters?: ReportFilters
): Promise<Report[]> {
  const params = new URLSearchParams();

  if (filters?.category && filters.category !== "all") {
    params.append("category", filters.category);
  }

  if (filters?.resolved !== undefined) {
    params.append("resolved", String(filters.resolved));
  }

  if (filters?.priority) {
    params.append("priority", filters.priority);
  }

  if (filters?.date) {
    params.append("date", filters.date);
  }

  if (filters?.sort) {
    params.append("sort", filters.sort);
  }

  const url = params.toString()
    ? `${API_CONFIG.BASE_URL}/reports?${params.toString()}`
    : `${API_CONFIG.BASE_URL}/reports`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to fetch reports");
  }

  return response.json();
}

export async function createReport(
  input: CreateReportInput,
  accessToken: string
): Promise<Report> {
  const response = await fetch(`${API_CONFIG.BASE_URL}/reports`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const message = await parseError(response);
    throw new Error(message);
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
