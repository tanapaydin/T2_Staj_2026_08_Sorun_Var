import { useCallback, useRef, useState } from "react";

import {
  fetchMapReports,
  MapReportFilters,
} from "../lib/api";
import { Report } from "../types/report";

export function useMapReports() {
  const requestIdRef = useRef(0);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [maxResults, setMaxResults] = useState(500);

  const loadReports = useCallback(async (filters: MapReportFilters) => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setLoading(true);

    try {
      const result = await fetchMapReports(filters);

      if (requestId === requestIdRef.current) {
        setReports(result.reports);
        setHasMore(result.has_more);
        setMaxResults(result.max_results);
      }

      return result;
    } catch (error) {
      console.log("MAP REPORTS ERROR:", error);

      if (requestId === requestIdRef.current) {
        setHasMore(false);
      }

      return null;
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  return {
    reports,
    loading,
    hasMore,
    maxResults,
    loadReports,
  };
}
