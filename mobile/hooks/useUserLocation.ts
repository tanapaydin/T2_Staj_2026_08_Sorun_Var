import { useEffect, useState } from "react";
import * as Location from "expo-location";

import { detectCity } from "../utils/location";

export function useUserLocation() {
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const [currentCity, setCurrentCity] = useState<string | null>(null);
  const [currentMunicipality, setCurrentMunicipality] = useState<
    string | null
  >(null);

  useEffect(() => {
    (async () => {
      const { status } =
        await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") return;

      const location =
        await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      const [address] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      // Türkiye'de `region` il bilgisini taşır. Ters geocoding sonucu
      // kullanılamazsa mevcut koordinat tabanlı çözüm yedek olarak kalır.
      setCurrentCity(
        address?.region ??
          detectCity(
            location.coords.latitude,
            location.coords.longitude
          )
      );

      setCurrentMunicipality(
        address?.subregion ??
          address?.city ??
          address?.district ??
          null
      );
    })();
  }, []);

  return {
    userLocation,
    currentCity,
    currentMunicipality,
  };
}
