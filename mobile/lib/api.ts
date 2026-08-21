import { API_CONFIG } from "../config/api";
import { Report } from "../types/report";
import { getAuthData } from "./auth";

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------

export type ReportFilters = {
  category?: string;
  resolved?: boolean;
  priority?: "high" | "medium" | "low";
  date?: "today" | "7d" | "30d";
  sort?: "newest" | "oldest" | "most_viewed";
  city?: string;
  district?: string;

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
  city: string;
  municipality: string;
  latitude: number;
  longitude: number;
};

export type MapBounds = {
  north: number;
  south: number;
  east: number;
  west: number;
};

export type MapReportFilters = Pick<
  ReportFilters,
  "category" | "resolved" | "priority" | "date" | "city" | "district"
> & {
  bounds?: MapBounds;
  limit?: number;
};

export type MapReportResponse = {
  reports: Report[];
  has_more: boolean;
  max_results: number;
};

export type MapOverview = {
  total_reports: number;
  cities: Array<{
    city: string;
    count: number;
    districts: Array<{
      district: string;
      count: number;
    }>;
  }>;
  categories: CategoryStatistics[];
};

export type NotificationSettings = {
  push_notifications: boolean;
  location_notifications: boolean;
  email_notifications: boolean;
};

export type ProfileUpdate = {
  name?: string;
  email?: string;
  avatar_url?: string | null;
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

export type ScopeStatistics = ReportStatistics & {
  categories: CategoryStatistics[];
};

export type StatisticsPeriod =
  | "all"
  | "month"
  | "week";

export type TopStatistics = {
  top_category: {
    category: string;
    count: number;
  } | null;

  top_city: {
    city: string;
    count: number;
  } | null;

  priority_counts: {
    high: number;
    medium: number;
    low: number;
  };
};

// ---------------------------------------------------------------------------
// HELPER
// ---------------------------------------------------------------------------

async function getAuthHeaders(): Promise<Record<string, string>> {
  const auth = await getAuthData();

  return auth?.access_token
    ? { Authorization: `Bearer ${auth.access_token}` }
    : {};
}

async function parseError(
  response: Response
): Promise<string> {
  try {
    const data = await response.json();
    const detail = data?.detail;

    if (typeof detail === "string") {
      return detail;
    }

    if (Array.isArray(detail)) {
      const messages = detail
        .map((item) => {
          if (!item || typeof item !== "object") {
            return null;
          }

          const message =
            typeof item.msg === "string"
              ? item.msg
              : "Geçersiz değer.";

          const field = Array.isArray(item.loc)
            ? item.loc
                .filter((part: unknown) => part !== "body")
                .join(" → ")
            : "";

          return field ? `${field}: ${message}` : message;
        })
        .filter((message): message is string => Boolean(message));

      if (messages.length > 0) {
        return messages.join("\n");
      }
    }

    if (typeof data?.message === "string") {
      return data.message;
    }

    return "İşlem başarısız oldu.";
  } catch {
    return "İşlem başarısız oldu.";
  }
}

export async function fetchNotificationSettings(
  accessToken: string
): Promise<NotificationSettings> {
  const response = await fetch(`${API_CONFIG.BASE_URL}/users/me/notifications`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return response.json();
}

export async function updateProfile(
  accessToken: string,
  profile: ProfileUpdate
) {
  const response = await fetch(`${API_CONFIG.BASE_URL}/users/me`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(profile),
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return response.json();
}

export async function updatePassword(
  accessToken: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const response = await fetch(`${API_CONFIG.BASE_URL}/users/me/password`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
    }),
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }
}

export async function updateNotificationSettings(
  accessToken: string,
  settings: Partial<NotificationSettings>
): Promise<NotificationSettings> {
  const response = await fetch(`${API_CONFIG.BASE_URL}/users/me/notifications`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(settings),
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return response.json();
}

export async function registerPushToken(
  accessToken: string,
  token: string,
  latitude?: number,
  longitude?: number
): Promise<void> {
  const response = await fetch(`${API_CONFIG.BASE_URL}/users/me/push-token`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      token,
      ...(latitude !== undefined ? { latitude } : {}),
      ...(longitude !== undefined ? { longitude } : {}),
    }),
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }
}

export async function unregisterPushToken(
  accessToken: string,
  token: string
): Promise<void> {
  const response = await fetch(
    `${API_CONFIG.BASE_URL}/users/me/push-token?token=${encodeURIComponent(token)}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) {
    throw new Error(await parseError(response));
  }
}

// ---------------------------------------------------------------------------
// FETCH REPORTS
// ---------------------------------------------------------------------------

export async function fetchReport(reportId: string) {
  const response = await fetch(
    `${API_CONFIG.BASE_URL}/reports/${reportId}`,
    {
      headers: await getAuthHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return response.json();
}

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

  if (filters?.city) {
    params.append("city", filters.city);
  }

  if (filters?.district) {
    params.append("district", filters.district);
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

  const response = await fetch(url, {
    headers: await getAuthHeaders(),
  });

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

export async function createReport(data: CreateReportInput) {
  const response = await fetch(
    `${API_CONFIG.BASE_URL}/reports/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(await getAuthHeaders()),
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return response.json();
}

export type AiReportAnalysis = {
  description?: string;
  category?: string;
};

export async function analyzeReportPhotos(
  photos: string[],
  selectedCategories: string[]
): Promise<AiReportAnalysis> {
  if (photos.length === 0) {
    throw new Error("Analiz için en az bir fotoğraf gerekli.");
  }

  const formData = new FormData();
  formData.append("image", {
    uri: photos[0],
    name: "report-photo.jpg",
    type: "image/jpeg",
  } as any);
  formData.append("selected_categories", selectedCategories.join(","));

  const response = await fetch(
    `${API_CONFIG.BASE_URL}/ai/analyze-image`,
    {
      method: "POST",
      headers: {
        ...(await getAuthHeaders()),
      },
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return response.json();
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

export async function fetchMapReports(
  filters?: MapReportFilters
): Promise<MapReportResponse> {
  const params = new URLSearchParams();

  if (filters?.bounds) {
    params.append("north", String(filters.bounds.north));
    params.append("south", String(filters.bounds.south));
    params.append("east", String(filters.bounds.east));
    params.append("west", String(filters.bounds.west));
  }

  if (filters?.city) {
    params.append("city", filters.city);
  }

  if (filters?.district) {
    params.append("district", filters.district);
  }

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

  params.append("limit", String(filters?.limit ?? 500));

  const url = `${API_CONFIG.BASE_URL}/reports/map?${params.toString()}`;

  console.log("FETCH MAP REPORTS:", url);

  const response = await fetch(url, {
    headers: await getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  const data: MapReportResponse = await response.json();

  console.log(
    "FETCH MAP REPORTS RESULT:",
    data.reports.length,
    "HAS MORE:",
    data.has_more
  );

  return data;
}

export async function fetchMapOverview(): Promise<MapOverview> {
  const url = `${API_CONFIG.BASE_URL}/reports/map/summary`;

  console.log("FETCH MAP OVERVIEW:", url);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return response.json();
}

// ---------------------------------------------------------------------------
// SCOPE STATISTICS
// ---------------------------------------------------------------------------

export async function fetchScopeStatistics(
  filters?: Pick<ReportFilters, "city" | "district">
): Promise<ScopeStatistics> {
  const params = new URLSearchParams();

  if (filters?.city) {
    params.append("city", filters.city);
  }

  if (filters?.district) {
    params.append("district", filters.district);
  }

  const queryString = params.toString();
  const url =
    `${API_CONFIG.BASE_URL}/reports/statistics/scope` +
    (queryString ? `?${queryString}` : "");

  console.log("FETCH SCOPE STATISTICS:", url);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return response.json();
}

// ---------------------------------------------------------------------------
// REPORT FOLLOW
// ---------------------------------------------------------------------------

export type FollowResponse = {
  following: boolean;
  follower_count: number;
};

export async function followReport(
  reportId: string,
  accessToken: string
): Promise<FollowResponse> {
  const response = await fetch(
    `${API_CONFIG.BASE_URL}/reports/${reportId}/follow`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const message = await parseError(response);

    console.log(
      "FOLLOW REPORT ERROR:",
      response.status,
      message
    );

    throw new Error(message);
  }

  return response.json();
}

export async function unfollowReport(
  reportId: string,
  accessToken: string
): Promise<FollowResponse> {
  const response = await fetch(
    `${API_CONFIG.BASE_URL}/reports/${reportId}/follow`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const message = await parseError(response);

    console.log(
      "UNFOLLOW REPORT ERROR:",
      response.status,
      message
    );

    throw new Error(message);
  }

  return response.json();
}

// ---------------------------------------------------------------------------
// FOLLOWED REPORTS
// ---------------------------------------------------------------------------

export async function fetchFollowedReports(
  accessToken: string
): Promise<Report[]> {
  const response = await fetch(
    `${API_CONFIG.BASE_URL}/users/me/following`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const message = await parseError(response);

    console.log(
      "FETCH FOLLOWED REPORTS ERROR:",
      response.status,
      message
    );

    throw new Error(message);
  }

  const data: Report[] = await response.json();

  console.log(
    "FETCH FOLLOWED REPORTS RESULT:",
    data.length
  );

  return data;
}

// ---------------------------------------------------------------------------
// TOP STATISTICS
// ---------------------------------------------------------------------------

export async function fetchTopStatistics(
  period: StatisticsPeriod
): Promise<TopStatistics> {
  const url =
    `${API_CONFIG.BASE_URL}/reports/statistics/top` +
    `?period=${period}`;

  console.log(
    "FETCH TOP STATISTICS:",
    url
  );

  const response = await fetch(url);

  if (!response.ok) {
    const message =
      await parseError(response);

    console.log(
      "TOP STATISTICS ERROR:",
      response.status,
      message
    );

    throw new Error(message);
  }

  const data: TopStatistics =
    await response.json();

  console.log(
    "TOP STATISTICS RESULT:",
    data
  );

  return data;
}

// ---------------------------------------------------------------------------
// DELETE ACCOUNT
// ---------------------------------------------------------------------------

export async function deleteAccount(accessToken: string): Promise<void> {
  const url = `${API_CONFIG.BASE_URL}/users/me`;

  console.log("DELETE ACCOUNT:", url);

  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok && response.status !== 204) {
    const message = await parseError(response);
    console.log("DELETE ACCOUNT ERROR:", response.status, message);
    throw new Error(message);
  }

  console.log("DELETE ACCOUNT SUCCESS");
}
