import { API_CONFIG } from "../config/api";
import { Report } from "../types/report";

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------

export type ReportFilters = {
  category?: string;
  resolved?: boolean;
  priority?: "high" | "medium" | "low";
  date?: "today" | "7d" | "30d";
  sort?: "newest" | "oldest" | "most_viewed";

  // Pagination
  skip?: number;
  limit?: number;
};

export type CreateReportInput = {
  title: string;
  description: string;
  category: string;
  latitude: number;
  longitude: number;
};

export type LocationSuggestion = {
  name: string;
  latitude: number;
  longitude: number;
};

export type ReportStatistics = {
  total_reports: number;
  resolved_reports: number;
  pending_reports: number;
  average_progress: number;
  resolution_rate: number;
};

export type CategoryStatistics = {
  category: string;
  count: number;
};

// ---------------------------------------------------------------------------
// HELPER
// ---------------------------------------------------------------------------

async function parseError(
  response: Response
): Promise<string> {
  try {
    const data = await response.json();

    return (
      data?.detail ||
      data?.message ||
      "İşlem başarısız oldu."
    );
  } catch {
    return "İşlem başarısız oldu.";
  }
}

// ---------------------------------------------------------------------------
// FETCH REPORTS
// ---------------------------------------------------------------------------

export async function fetchReports(
  filters?: ReportFilters
): Promise<Report[]> {
  const params = new URLSearchParams();

  // Category
  if (
    filters?.category &&
    filters.category !== "all"
  ) {
    params.append(
      "category",
      filters.category
    );
  }

  // Resolved
  if (filters?.resolved !== undefined) {
    params.append(
      "resolved",
      String(filters.resolved)
    );
  }

  // Priority
  if (filters?.priority) {
    params.append(
      "priority",
      filters.priority
    );
  }

  // Date
  if (filters?.date) {
    params.append(
      "date",
      filters.date
    );
  }

  // Sorting
  if (filters?.sort) {
    params.append(
      "sort",
      filters.sort
    );
  }

  // Pagination
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

  const response = await fetch(url);

  if (!response.ok) {
    const message =
      await parseError(response);

    console.log(
      "FETCH REPORTS ERROR:",
      response.status,
      message
    );

    throw new Error(message);
  }

  const data: Report[] =
    await response.json();

  console.log(
    "FETCH REPORTS RESULT:",
    data.length
  );

  return data;
}

export async function fetchAllReports(
  filters?: ReportFilters
): Promise<Report[]> {
  const reports: Report[] = [];
  const limit = 50;
  let skip = 0;

  while (true) {
    const page = await fetchReports({
      ...filters,
      skip,
      limit,
    });

    reports.push(...page);

    if (page.length < limit) {
      return reports;
    }

    skip += page.length;
  }
}

// ---------------------------------------------------------------------------
// CREATE REPORT
// ---------------------------------------------------------------------------

export async function createReport(
  input: CreateReportInput,
  accessToken: string
): Promise<Report> {
  console.log(
    "CREATE REPORT:",
    input
  );

  const response = await fetch(
    `${API_CONFIG.BASE_URL}/reports`,
    {
      method: "POST",

      headers: {
        Authorization:
          `Bearer ${accessToken}`,

        "Content-Type":
          "application/json",
      },

      body: JSON.stringify(input),
    }
  );

  if (!response.ok) {
    const message =
      await parseError(response);

    console.log(
      "CREATE REPORT ERROR:",
      response.status,
      message
    );

    throw new Error(message);
  }

  const data: Report =
    await response.json();

  console.log(
    "CREATE REPORT RESULT:",
    data
  );

  return data;
}

// ---------------------------------------------------------------------------
// LOCATION SEARCH
// ---------------------------------------------------------------------------

export async function searchLocation(
  query: string
) {
  const url =
    `${API_CONFIG.BASE_URL}/reports/search` +
    `?query=${encodeURIComponent(query)}`;

  console.log(
    "SEARCH LOCATION:",
    url
  );

  const response =
    await fetch(url);

  if (!response.ok) {
    const message =
      await parseError(response);

    console.log(
      "LOCATION SEARCH ERROR:",
      response.status,
      message
    );

    throw new Error(message);
  }

  return response.json();
}

// ---------------------------------------------------------------------------
// LOCATION SUGGESTIONS
// ---------------------------------------------------------------------------

export async function fetchLocationSuggestions(
  query: string
): Promise<LocationSuggestion[]> {
  if (query.trim().length < 2) {
    return [];
  }

  const url =
    `${API_CONFIG.BASE_URL}/reports/search/suggestions` +
    `?query=${encodeURIComponent(query)}`;

  console.log(
    "FETCH LOCATION SUGGESTIONS:",
    url
  );

  const response =
    await fetch(url);

  if (!response.ok) {
    const message =
      await parseError(response);

    console.log(
      "LOCATION SUGGESTIONS ERROR:",
      response.status,
      message
    );

    throw new Error(message);
  }

  const data: LocationSuggestion[] =
    await response.json();

  return data;
}

// ---------------------------------------------------------------------------
// GENERAL STATISTICS
// ---------------------------------------------------------------------------

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
    const message =
      await parseError(response);

    console.log(
      "FETCH STATISTICS ERROR:",
      response.status,
      message
    );

    throw new Error(message);
  }

  const data: ReportStatistics =
    await response.json();

  console.log(
    "STATISTICS RESULT:",
    data
  );

  return data;
}

// ---------------------------------------------------------------------------
// CATEGORY STATISTICS
// ---------------------------------------------------------------------------

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
    const message =
      await parseError(response);

    console.log(
      "CATEGORY STATISTICS ERROR:",
      response.status,
      message
    );

    throw new Error(message);
  }

  const data: CategoryStatistics[] =
    await response.json();

  console.log(
    "CATEGORY STATISTICS RESULT:",
    data
  );

  return data;
}
