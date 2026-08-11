import { useMemo, useState } from "react";

import { Report } from "../types/report";
import { filterReportsByCity } from "../utils/location";

export type CityFilterMode =
  | "current"
  | "all"
  | "search";

export function useMapCityFilter(
  reports: Report[],
  currentCity: string | null
) {
  const [cityFilterMode, setCityFilterMode] =
    useState<CityFilterMode>("current");

  const [searchedCity, setSearchedCity] =
    useState<string | null>(null);

  const [showSearchAreaButton, setShowSearchAreaButton] =
    useState(false);

  const visibleReports = useMemo(() => {
    switch (cityFilterMode) {
      case "all":
        return reports;

      case "search":
        return filterReportsByCity(
          reports,
          searchedCity
        );

      case "current":
      default:
        return filterReportsByCity(
          reports,
          currentCity
        );
    }
  }, [
    reports,
    cityFilterMode,
    currentCity,
    searchedCity,
  ]);

  function handleSearchCity(city: string) {
    setSearchedCity(city);

    // Aranan şehir mevcut filtreyle aynı değilse butonu göster
    if (
        (cityFilterMode === "current" && city !== currentCity) ||
        cityFilterMode === "all"
    ) {
        setShowSearchAreaButton(true);
    } else {
        setShowSearchAreaButton(false);
    }
    }

  function showSearchArea() {
    setCityFilterMode("search");
    setShowSearchAreaButton(false);
  }

  function showCurrentCity() {
    setCityFilterMode("current");
    setShowSearchAreaButton(false);
  }

  function showAllCities() {
    setCityFilterMode("all");
    setShowSearchAreaButton(false);
  }

  return {
    cityFilterMode,
    setCityFilterMode,

    searchedCity,
    showSearchAreaButton,

    visibleReports,

    handleSearchCity,
    showSearchArea,
    showCurrentCity,
    showAllCities,
  };
}