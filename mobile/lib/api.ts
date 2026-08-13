import { API_CONFIG } from "../config/api";
import { Report } from "../types/report";
import { getAccessToken } from "./auth";

export type ReportFilters = {
  category?: string;
  resolved?: boolean;
  priority?: "high" | "medium" | "low";
  date?: "today" | "7d" | "30d";
  sort?: "newest" | "oldest" | "most_viewed";
};

async function getAuthHeaders() {
  const token = await getAccessToken();

  console.log(
    "AUTH TOKEN VAR MI:",
    token ? "EVET" : "HAYIR"
  );

  return {
    ...(token
      ? { Authorization: `Bearer ${token}` }
      : {}),
  };
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

  const response = await fetch(url, {
    headers: await getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch reports");
  }

  return response.json();
}

export async function fetchReport(reportId: string) {
  const response = await fetch(
    `${API_CONFIG.BASE_URL}/reports/${reportId}`,
    {
      headers: await getAuthHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch report");
  }

  return response.json();
}

export async function createReport(data: {
  photos: string[];
  categories: string[];
  description: string;
  latitude: number;
  longitude: number;
}) {
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
    let message = "Rapor oluşturulamadı.";

    try {
      const error = await response.json();

      message =
        error?.detail ||
        error?.message ||
        message;
    } catch {}

    throw new Error(message);
  }

  return response.json();
}

export async function searchLocation(query: string) {
  const response = await fetch(
    `${API_CONFIG.BASE_URL}/reports/search?query=${encodeURIComponent(
      query
    )}`
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
  if (query.trim().length < 2) {
    return [];
  }

  const response = await fetch(
    `${API_CONFIG.BASE_URL}/reports/search/suggestions?query=${encodeURIComponent(
      query
    )}`
  );

  if (!response.ok) {
    throw new Error(
      "Failed to fetch location suggestions"
    );
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

export async function fetchStatistics() {
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

export async function fetchCategoryStatistics(): Promise<
  CategoryStatistics[]
> {
  const response = await fetch(
    `${API_CONFIG.BASE_URL}/reports/statistics/category`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch statistics");
  }

  return response.json();
}

/**
 * Fotoğrafı Gemini AI'a gönderir.
 *
 * Kullanıcı kategori seçmişse:
 * - AI açıklama oluşturur.
 * - Kategori değiştirmez.
 *
 * Kullanıcı kategori seçmemişse:
 * - AI açıklama oluşturur.
 * - AI uygun kategori önerir.
 */
export async function analyzeReportPhotos(
  photos: string[],
  selectedCategories: string[] = []
) {
  if (photos.length === 0) {
    throw new Error(
      "Yapay zeka analizi için en az bir fotoğraf gerekli."
    );
  }

  const formData = new FormData();

  const firstPhoto = photos[0];

  formData.append("image", {
    uri: firstPhoto,
    name: "report-photo.jpg",
    type: "image/jpeg",
  } as any);

  formData.append(
    "selected_categories",
    selectedCategories.join(",")
  );

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
    let message =
      "Yapay zeka analizi başarısız.";

    try {
      const error = await response.json();

      message =
        error?.detail ||
        error?.message ||
        message;
    } catch {}

    throw new Error(message);
  }

  return response.json();
}