import { API_CONFIG } from "../config/api";
import { Report } from "../types/report";

// --------------------------------------------------
// REPORT FILTERS
// --------------------------------------------------

export type ReportFilters = {
  category?: string;
  resolved?: boolean;
  priority?: "high" | "medium" | "low";
  date?: "today" | "7d" | "30d";
  sort?: "newest" | "oldest" | "most_viewed";

  skip?: number;
  limit?: number;
};

// --------------------------------------------------
// FETCH REPORTS
// --------------------------------------------------

export async function fetchReports(
  filters?: ReportFilters
): Promise<Report[]> {
  const params = new URLSearchParams();

  // --------------------------------------------------
  // Filters
  // --------------------------------------------------

  if (
    filters?.category &&
    filters.category !== "all"
  ) {
    params.append(
      "category",
      filters.category
    );
  }

  if (filters?.resolved !== undefined) {
    params.append(
      "resolved",
      String(filters.resolved)
    );
  }

  if (filters?.priority) {
    params.append(
      "priority",
      filters.priority
    );
  }

  if (filters?.date) {
    params.append(
      "date",
      filters.date
    );
  }

  if (filters?.sort) {
    params.append(
      "sort",
      filters.sort
    );
  }

  // --------------------------------------------------
  // Pagination
  // --------------------------------------------------

  if (filters?.skip !== undefined) {
    params.append(
      "skip",
      String(filters.skip)
    );
  }

  if (filters?.limit !== undefined) {
    params.append(
      "limit",
      String(filters.limit)
    );
  }

  // --------------------------------------------------
  // URL
  // --------------------------------------------------

  const queryString =
    params.toString();

  const url =
    `${API_CONFIG.BASE_URL}/reports` +
    (
      queryString
        ? `?${queryString}`
        : ""
    );

  console.log(
    "FETCH REPORTS:",
    url
  );

  // --------------------------------------------------
  // Request
  // --------------------------------------------------

  const response = await fetch(url);

  if (!response.ok) {
    const errorText =
      await response.text();

    console.log(
      "FETCH REPORTS ERROR:",
      response.status,
      errorText
    );

    throw new Error(
      `Failed to fetch reports: ${response.status}`
    );
  }

  const data: Report[] =
    await response.json();

  console.log(
    "FETCH REPORTS RESULT:",
    data.length
  );

  return data;
}

// --------------------------------------------------
// LOCATION SEARCH
// --------------------------------------------------

export async function searchLocation(
  query: string
) {
  const response = await fetch(
    `${API_CONFIG.BASE_URL}/reports/search?query=${encodeURIComponent(
      query
    )}`
  );

  if (!response.ok) {
    const errorText =
      await response.text();

    console.log(
      "LOCATION SEARCH ERROR:",
      response.status,
      errorText
    );

    throw new Error(
      `Location search failed: ${response.status}`
    );
  }

  return response.json();
}

// --------------------------------------------------
// LOCATION SUGGESTIONS
// --------------------------------------------------

export type LocationSuggestion = {
  name: string;
  latitude: number;
  longitude: number;
};

export async function fetchLocationSuggestions(
  query: string
): Promise<LocationSuggestion[]> {
  if (query.trim().length < 2) {
    return [];
  }

  const response = await fetch(
    `${API_CONFIG.BASE_URL}/reports/search/suggestions?query=${encodeURIComponent(
      query
    )}`
  );

  if (!response.ok) {
    const errorText =
      await response.text();

    console.log(
      "LOCATION SUGGESTIONS ERROR:",
      response.status,
      errorText
    );

    throw new Error(
      `Failed to fetch location suggestions: ${response.status}`
    );
  }

  const data: LocationSuggestion[] =
    await response.json();

  return data;
}

// --------------------------------------------------
// STATISTICS
// --------------------------------------------------

export type ReportStatistics = {
  total_reports: number;
  resolved_reports: number;
  pending_reports: number;
  average_progress: number;
  resolution_rate: number;
};

export async function fetchStatistics(): Promise<ReportStatistics> {
  const url =
    `${API_CONFIG.BASE_URL}/reports/statistics`;

  console.log(
    "FETCH STATISTICS:",
    url
  );

  const response =
    await fetch(url);

  if (!response.ok) {
    const errorText =
      await response.text();

    console.log(
      "FETCH STATISTICS ERROR:",
      response.status,
      errorText
    );

    throw new Error(
      `Failed to fetch statistics: ${response.status}`
    );
  }

  const data: ReportStatistics =
    await response.json();

  console.log(
    "STATISTICS RESULT:",
    data
  );

  return data;
}

// --------------------------------------------------
// CATEGORY STATISTICS
// --------------------------------------------------

export type CategoryStatistics = {
  category: string;
  count: number;
};

export async function fetchCategoryStatistics(): Promise<
  CategoryStatistics[]
> {
  const url =
    `${API_CONFIG.BASE_URL}/reports/statistics/category`;

  console.log(
    "FETCH CATEGORY STATISTICS:",
    url
  );

  const response =
    await fetch(url);

  if (!response.ok) {
    const errorText =
      await response.text();

    console.log(
      "FETCH CATEGORY STATISTICS ERROR:",
      response.status,
      errorText
    );

    throw new Error(
      `Failed to fetch category statistics: ${response.status}`
    );
  }

  const data: CategoryStatistics[] =
    await response.json();

  console.log(
    "CATEGORY STATISTICS RESULT:",
    data
  );

  return data;
}
