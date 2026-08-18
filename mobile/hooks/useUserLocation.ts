import { useEffect, useState } from "react";
import { Alert, Linking, Platform } from "react-native";
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
      try {
        const { status } =
          await Location.requestForegroundPermissionsAsync();

        if (status !== "granted") {
          // Ask the user to enable permissions in settings
          Alert.alert(
            "Konum izni gerekli",
            "Uygulama konum bilgisine ihtiyaç duyuyor. Lütfen ayarlardan konum izni verin.",
            [
              { text: "İptal", style: "cancel" },
              {
                text: "Ayarlar",
                onPress: () => Linking.openSettings(),
              },
            ]
          );
          return;
        }

        // Check whether device location services are enabled
        let providerOk = true;
        try {
          if (Location.hasServicesEnabledAsync) {
            providerOk = await Location.hasServicesEnabledAsync();
          }
        } catch (_) {
          // ignore - some platforms may not implement
          providerOk = true;
        }

        if (!providerOk) {
          Alert.alert(
            "Konum servisleri kapalı",
            "Cihazınızın konum servisleri kapalı. Lütfen GPS/Location'u açın.",
            [{ text: "Tamam" }]
          );
          return;
        }

        // Try to get a fresh position, fallback to last known position
        let location = null;
        try {
          location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
        } catch (err) {
          try {
            location = await Location.getLastKnownPositionAsync();
          } catch (err2) {
            console.warn("Konum alınamadı:", err, err2);
            return;
          }
        }

        if (!location) return;

        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        let address = null;
        try {
          const res = await Location.reverseGeocodeAsync({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
          address = res[0];
        } catch (e) {
          // ignore reverse geocode errors
          address = null;
        }

        // Türkiye'de `region` il bilgisini taşır. Ters geocoding sonucu
        // kullanılamazsa mevcut koordinat tabanlı çözüm yedek olarak kalır.
        setCurrentCity(
          address?.region ??
            detectCity(location.coords.latitude, location.coords.longitude)
        );

        setCurrentMunicipality(
          address?.subregion ?? address?.city ?? address?.district ?? null
        );
      } catch (err) {
        console.error("useUserLocation error:", err);
      }
    })();
  }, []);

  return {
    userLocation,
    currentCity,
    currentMunicipality,
  };
}

