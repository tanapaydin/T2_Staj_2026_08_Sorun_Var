import { useEffect, useState } from "react";
import {
  fetchAllReports,
  ReportFilters,
} from "../lib/api";
import { Report } from "../types/report";

export function useReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  async function loadReports(
    filters?: ReportFilters
  ) {
    try {
      setLoading(true);

      setReports(await fetchAllReports(filters));
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  async function applyFilters(filters: ReportFilters) {
    await loadReports(filters);
  }

  async function resetFilters() {
    await loadReports();
  }

  return {
    reports,
    loading,
    loadReports,
    applyFilters,
    resetFilters,
  };
}
