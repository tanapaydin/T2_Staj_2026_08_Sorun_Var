import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,


  Platform,

  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
} from "react-native";

import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { CameraView, useCameraPermissions } from "expo-camera";
import * as Location from "expo-location";

import type { MapPressEvent } from "react-native-maps";
// import MapView from "react-native-maps";

import {
  createReport,
  fetchReports,
  analyzeReportPhotos,
} from "../../lib/api";

import type { Report } from "../../types/report";
import { AuthResponse, getAuthData } from "../../lib/auth";

const isWeb = Platform.OS === "web";

let MapView: any = View;
let Marker: any = View;
let Circle: any = View;

if (!isWeb) {
  const ReactNativeMaps = require("react-native-maps");
  MapView = ReactNativeMaps.default;
  Marker = ReactNativeMaps.Marker;
  Circle = ReactNativeMaps.Circle;
}

type UserLocation = {
  latitude: number;
  longitude: number;
};

type Category = {
  id: string;
  label: string;
  icon: string;
};

const MAX_PHOTOS = 6;
const MAX_LOCATION_DISTANCE = 500;

const categories: Category[] = [
  { id: "road", label: "Yol", icon: "🛣️" },
  { id: "trash", label: "Çöp", icon: "🗑️" },
  { id: "lighting", label: "Aydınlatma", icon: "💡" },
  { id: "construction", label: "İnşaat", icon: "🏗️" },
  { id: "water", label: "Su", icon: "💧" },
  { id: "park", label: "Park", icon: "🌳" },
  { id: "traffic", label: "Trafik", icon: "🚦" },
  { id: "noise", label: "Gürültü", icon: "🔊" },
  { id: "animal", label: "Hayvan", icon: "🐕" },
  { id: "other", label: "Diğer", icon: "•" },
];

function calculateDistance(
  first: UserLocation,
  second: UserLocation
) {
  const earthRadius = 6371000;

  const lat1 = (first.latitude * Math.PI) / 180;
  const lat2 = (second.latitude * Math.PI) / 180;

  const deltaLat =
    ((second.latitude - first.latitude) * Math.PI) / 180;

  const deltaLon =
    ((second.longitude - first.longitude) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) *
      Math.sin(deltaLat / 2) +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(deltaLon / 2) *
      Math.sin(deltaLon / 2);

  const c =
    2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadius * c;
}

export default function ReportScreen() {
  const [permission, requestPermission] =
    useCameraPermissions();
  const router = useRouter();
  const [auth, setAuth] = useState<AuthResponse | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const cameraRef = useRef<CameraView>(null);

  const [cameraOpen, setCameraOpen] = useState(false);
  const [previewUri, setPreviewUri] =
    useState<string | null>(null);

  const [photos, setPhotos] = useState<string[]>([]);

  const [description, setDescription] = useState("");

  const [categoriesSelected, setCategoriesSelected] =
    useState<string[]>([]);

  const [location, setLocation] =
    useState<UserLocation | null>(null);

  const [originalLocation, setOriginalLocation] =
    useState<UserLocation | null>(null);

  const [loadingLocation, setLoadingLocation] =
    useState(false);

  const [mapOpen, setMapOpen] = useState(false);

  const [selectedMapLocation, setSelectedMapLocation] =
    useState<UserLocation | null>(null);

  const [sending, setSending] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [oldReportsOpen, setOldReportsOpen] = useState(false);
  const [oldReports, setOldReports] = useState<Report[]>([]);
  const [loadingOldReports, setLoadingOldReports] = useState(false);

  /*
   * Uygulama rapor ekranına geldiğinde
   * kullanıcının gerçek konumunu otomatik al.
   */
  useEffect(() => {
    getAuthData()
      .then((data) => {
        setAuth(data);
        if (data) {
          getCurrentLocation();
        }
      })
      .finally(() => setCheckingAuth(false));
  }, []);

  const getCurrentLocation = async () => {
    try {
      setLoadingLocation(true);

      const permissionResult =
        await Location.requestForegroundPermissionsAsync();

      if (permissionResult.status !== "granted") {
        setLoadingLocation(false);

        Alert.alert(
          "Konum İzni",
          "Rapor oluşturmak için konum iznine izin vermen gerekiyor."
        );

        return;
      }

      const servicesEnabled =
        await Location.hasServicesEnabledAsync();

      if (!servicesEnabled) {
        setLoadingLocation(false);

        Alert.alert(
          "Konum Servisi Kapalı",
          "iPhone'da Ayarlar > Gizlilik ve Güvenlik > Konum Servisleri bölümünden konum servislerini aç."
        );

        return;
      }

      let currentLocation: UserLocation | null = null;

      try {
        const current =
          await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });

        currentLocation = {
          latitude: current.coords.latitude,
          longitude: current.coords.longitude,
        };
      } catch {
        // GPS hemen konum vermezse son bilinen konumu kullanmayı dene.
        const lastKnown =
          await Location.getLastKnownPositionAsync({
            maxAge: 5 * 60 * 1000,
            requiredAccuracy: 1000,
          });

        if (lastKnown) {
          currentLocation = {
            latitude: lastKnown.coords.latitude,
            longitude: lastKnown.coords.longitude,
          };
        }
      }

      if (!currentLocation) {
        setLoadingLocation(false);

        Alert.alert(
          "Konum Hatası",
          "Konum alınamadı. iPhone'da konum servislerini ve Expo Go için konum iznini kontrol edip tekrar dene."
        );

        return;
      }

      setLocation(currentLocation);
      setOriginalLocation(currentLocation);
      setLoadingLocation(false);
    } catch (error) {
      setLoadingLocation(false);

      Alert.alert(
        "Konum Hatası",
        "Konum alınamadı. Konum servislerini ve uygulama iznini kontrol edip tekrar dene."
      );
    }
  };

  const openReport = async () => {
    // Yeni rapor akışına girerken eski raporlar modalı kesinlikle kapalı olsun.
    setOldReportsOpen(false);
    setLoadingOldReports(false);
    setOldReports([]);

    if (!permission?.granted) {
      const result = await requestPermission();

      if (!result.granted) {
        Alert.alert(
          "Kamera İzni",
          "Rapor oluşturmak için kamera iznine izin vermen gerekiyor."
        );

        return;
      }
    }

    // Konum daha önce alınamadıysa tekrar dene.
    if (!originalLocation) {
      await getCurrentLocation();
    }

    setPreviewUri(null);
    setCameraOpen(true);
  };

  const takePhoto = async () => {
    if (!cameraRef.current) return;

    if (photos.length >= MAX_PHOTOS) {
      Alert.alert(
        "Fotoğraf Limiti",
        "En fazla 6 fotoğraf çekebilirsin."
      );

      return;
    }

    try {
      const photo =
        await cameraRef.current.takePictureAsync({
          quality: 0.8,
        });

      if (photo?.uri) {
        setPreviewUri(photo.uri);
      }
    } catch {
      Alert.alert(
        "Hata",
        "Fotoğraf çekilemedi."
      );
    }
  };

  const usePhoto = () => {
    if (!previewUri) return;

    const photoUri = previewUri;

    // Fotoğraf kullanıldığı anda eski rapor ekranını kapat.
    setOldReportsOpen(false);
    setLoadingOldReports(false);

    setPreviewUri(null);
    setCameraOpen(false);

    setPhotos((current) => {
      if (current.length >= MAX_PHOTOS) {
        return current;
      }

      return [...current, photoUri];
    });
  };

  const retakePhoto = () => {
    setPreviewUri(null);
  };

  const removePhoto = (index: number) => {
    const updatedPhotos = photos.filter(
      (_, i) => i !== index
    );

    setPhotos(updatedPhotos);

    /*
     * Son fotoğraf silindiyse
     * rapor ekranının başlangıcına dön.
     */
    if (updatedPhotos.length === 0) {
      setDescription("");
      setCategoriesSelected([]);
      setLocation(null);
      setOriginalLocation(null);
      setSelectedMapLocation(null);
      setPreviewUri(null);
      setCameraOpen(false);
    }
  };

  const addPhoto = async () => {
    if (photos.length >= MAX_PHOTOS) {
      Alert.alert(
        "Fotoğraf Limiti",
        "En fazla 6 fotoğraf çekebilirsin."
      );

      return;
    }

    if (!permission?.granted) {
      const result = await requestPermission();

      if (!result.granted) {
        return;
      }
    }

    setPreviewUri(null);
    setCameraOpen(true);
  };

  const toggleCategory = (id: string) => {
    setCategoriesSelected((current) => {
      if (current.includes(id)) {
        return current.filter(
          (categoryId) => categoryId !== id
        );
      }

      return [...current, id];
    });
  };

  /*
   * Haritada bir noktaya basıldığında çalışır.
   *
   * Seçilen nokta mevcut konumdan 500 metre
   * uzaktaysa kabul edilmez.
   */
  const handleMapPress = (
    event: MapPressEvent
  ) => {
    if (!originalLocation) return;

    const pressedLocation = {
      latitude: event.nativeEvent.coordinate.latitude,
      longitude:
        event.nativeEvent.coordinate.longitude,
    };

    const distance = calculateDistance(
      originalLocation,
      pressedLocation
    );

    if (distance > MAX_LOCATION_DISTANCE) {
      Alert.alert(
        "Konum Uzak",
        "Seçtiğin konum mevcut konumundan en fazla 500 metre uzakta olabilir."
      );

      return;
    }

    setSelectedMapLocation(pressedLocation);
  };

  const confirmMapLocation = () => {
    if (!selectedMapLocation) {
      Alert.alert(
        "Konum Seçilmedi",
        "Haritadan bir konum seç."
      );

      return;
    }

    setLocation(selectedMapLocation);
    setMapOpen(false);
  };

  const resetToCurrentLocation = () => {
    if (!originalLocation) return;

    setLocation(originalLocation);
    setSelectedMapLocation(null);
  };

  const closeOldReports = () => {
    setOldReportsOpen(false);
    setLoadingOldReports(false);
  };

  const openOldReports = async () => {
    // Eski raporlar yalnızca bu butondan açılır.
    // Fotoğraf kullanma akışından kesinlikle çağrılmaz.
    setOldReportsOpen(true);
    setLoadingOldReports(true);
    setOldReports([]);

    try {
      const reports = await fetchReports({
        sort: "newest",
      });

      setOldReports(Array.isArray(reports) ? reports : []);
    } catch (error) {
      setOldReportsOpen(false);
      setOldReports([]);

      const message =
        error instanceof Error
          ? error.message
          : "Eski raporlar yüklenemedi.";

      Alert.alert("Hata", message);
    } finally {
      setLoadingOldReports(false);
    }
  };
const fillWithAI = async () => {
  if (photos.length === 0) {
    Alert.alert(
      "Fotoğraf Gerekli",
      "Önce en az bir fotoğraf yüklemelisin."
    );
    return;
  }

  try {
    setAiLoading(true);

    const result = await analyzeReportPhotos(
      photos,
      categoriesSelected
    );

    if (result?.description) {
      setDescription(result.description);
    }

    /*
     * Kullanıcı kategori seçmemişse
     * AI'nın önerdiği kategoriyi kullan.
     *
     * Kullanıcı zaten kategori seçmişse
     * mevcut kategorilere dokunma.
     */
    if (
      categoriesSelected.length === 0 &&
      result?.category
    ) {
      setCategoriesSelected([
        result.category,
      ]);
    }

    Alert.alert(
      "Tamamlandı",
      "Yapay zeka fotoğrafı analiz ederek raporu doldurdu."
    );
  } catch (error) {
    console.error(
      "AI ANALİZ HATASI:",
      error
    );

    Alert.alert(
      "Yapay Zeka Hatası",
      error instanceof Error
        ? error.message
        : "Fotoğraf analiz edilemedi."
    );
  } finally {
    setAiLoading(false);
  }
};
  const submitReport = async () => {
    if (photos.length === 0) {
      Alert.alert(
        "Fotoğraf Gerekli",
        "En az bir fotoğraf çekmelisin."
      );

      return;
    }

    if (categoriesSelected.length === 0) {
      Alert.alert(
        "Kategori Gerekli",
        "Lütfen en az bir kategori seç."
      );

      return;
    }

    if (!description.trim()) {
      Alert.alert(
        "Açıklama Gerekli",
        "Lütfen sorun hakkında bir açıklama yaz."
      );

      return;
    }

    if (!location) {
      Alert.alert(
        "Konum Gerekli",
        "Lütfen konumunu al."
      );

      return;
    }

    /*
     * Son güvenlik kontrolü.
     *
     * Kullanıcı konumu değiştirmişse bile
     * backend'e göndermeden önce 500 metre
     * sınırını tekrar kontrol ediyoruz.
     */
    if (originalLocation) {
      const finalDistance = calculateDistance(
        originalLocation,
        location
      );

      if (finalDistance > MAX_LOCATION_DISTANCE) {
        Alert.alert(
          "Konum Geçersiz",
          "Seçtiğin konum mevcut konumundan 500 metreden fazla uzakta."
        );

        return;
      }
    }

    try {
      setSending(true);

      const auth = await getAuthData();

      if (!auth?.access_token) {
        throw new Error("Rapor göndermek için giriş yapmalısın.");
      }

      await createReport({
        title: description.trim().slice(0, 100),
        category: categoriesSelected[0],
        description: description.trim(),
        latitude: location.latitude,
        longitude: location.longitude,
      }, auth.access_token);

      setSending(false);

      Alert.alert(
        "Başarılı",
        "Raporun başarıyla oluşturuldu.",
        [
          {
            text: "Tamam",
            onPress: () => {
              setPhotos([]);
              setDescription("");
              setCategoriesSelected([]);
              setLocation(null);
              setOriginalLocation(null);
              setSelectedMapLocation(null);
              setPreviewUri(null);
              setCameraOpen(false);
              setOldReportsOpen(false);
              setLoadingOldReports(false);
              setOldReports([]);
            },
          },
        ]
      );
    } catch (error) {
      setSending(false);

      const message =
        error instanceof Error
          ? error.message
          : "Rapor oluşturulamadı.";

      Alert.alert("Hata", message);
    }
  };

  if (checkingAuth) {
    return (
      <SafeAreaView style={styles.guestContainer}>
        <ActivityIndicator color="#315EE8" />
      </SafeAreaView>
    );
  }

  if (!auth) {
    return (
      <SafeAreaView style={styles.guestContainer}>
        <View style={styles.guestPanel}>
          <Text style={styles.guestTitle}>Bildirmek için giriş yapın</Text>
          <Text style={styles.guestSubtitle}>
            Misafir olarak sorunları görüntüleyebilirsiniz. Yeni bir sorun
            bildirmek için hesabınıza giriş yapmanız gerekir.
          </Text>

          <TouchableOpacity
            style={styles.guestPrimaryButton}
            onPress={() => router.push("/(auth)/login")}
          >
            <Text style={styles.guestPrimaryButtonText}>Giriş Yap</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.guestSecondaryButton}
            onPress={() => router.push("/(auth)/register")}
          >
            <Text style={styles.guestSecondaryButtonText}>Kayıt Ol</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  /*
   * KAMERA
   */
  if (cameraOpen) {
    return (
      <SafeAreaView style={styles.cameraContainer}>
        {!previewUri ? (
          <>
            <View style={styles.cameraHeader}>
              <TouchableOpacity
                onPress={() =>
                  setCameraOpen(false)
                }
                style={styles.backButton}
              >
                <Text style={styles.backText}>
                  ‹
                </Text>
              </TouchableOpacity>

              <Text style={styles.cameraTitle}>
                Fotoğraf Çek
              </Text>

              <View style={styles.counter}>
                <Text style={styles.counterText}>
                  {photos.length}/6
                </Text>
              </View>
            </View>

            <CameraView
              ref={cameraRef}
              style={styles.camera}
              facing="back"
            />

            <View style={styles.cameraBottom}>
              <Text style={styles.cameraInfo}>
                Sorunun fotoğrafını çek
              </Text>

              <TouchableOpacity
                onPress={takePhoto}
                style={styles.captureButton}
              >
                <View
                  style={styles.captureInner}
                />
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <View style={styles.cameraHeader}>
              <TouchableOpacity
                onPress={retakePhoto}
                style={styles.backButton}
              >
                <Text style={styles.backText}>
                  ‹
                </Text>
              </TouchableOpacity>

              <Text style={styles.cameraTitle}>
                Fotoğraf
              </Text>

              <View style={{ width: 40 }} />
            </View>

            <Image
              source={{ uri: previewUri }}
              style={styles.preview}
              resizeMode="contain"
            />

            <View style={styles.previewBottom}>
              <TouchableOpacity
                style={styles.retakeButton}
                onPress={retakePhoto}
              >
                <Text style={styles.retakeText}>
                  Tekrar Çek
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.useButton}
                onPress={usePhoto}
              >
                <Text style={styles.useText}>
                  Fotoğrafı Kullan
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </SafeAreaView>
    );
  }

  /*
   * ESKİ RAPORLAR
   *
   * Bu ekran ana rapor akışından ayrı tutuluyor.
   * Böylece fotoğraf kullanılırken kesinlikle açılmaz.
   */
  if (oldReportsOpen && !cameraOpen) {
    return (
      <SafeAreaView style={styles.oldReportsContainer}>
        <View style={styles.oldReportsHeader}>
          <TouchableOpacity
            onPress={closeOldReports}
            style={styles.mapBackButton}
          >
            <Text style={styles.mapBackText}>‹</Text>
          </TouchableOpacity>

          <Text style={styles.oldReportsTitle}>
            Eski Raporlar
          </Text>

          <View style={{ width: 40 }} />
        </View>

        {loadingOldReports ? (
          <View style={styles.oldReportsEmpty}>
            <Text style={styles.oldReportsEmptyText}>
              Raporlar yükleniyor...
            </Text>
          </View>
        ) : oldReports.length === 0 ? (
          <View style={styles.oldReportsEmpty}>
            <Text style={styles.oldReportsEmptyTitle}>
              Henüz raporun yok
            </Text>

            <Text style={styles.oldReportsEmptyText}>
              Oluşturduğun raporlar burada görünecek.
            </Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.oldReportsList}
            showsVerticalScrollIndicator={false}
          >
            {oldReports.map((report) => (
              <View
                key={report.id}
                style={styles.oldReportCard}
              >
                <View style={styles.oldReportTop}>
                  <Text style={styles.oldReportTitle}>
                    {report.title}
                  </Text>

                  <Text style={styles.oldReportStatus}>
                    {report.status === "resolved"
                      ? "Çözüldü"
                      : report.progress > 0
                      ? `%${report.progress}`
                      : "Bekliyor"}
                  </Text>
                </View>

                <Text style={styles.oldReportCategory}>
                  {report.category}
                </Text>

                <Text style={styles.oldReportDate}>
                  {new Date(
                    report.created_at
                  ).toLocaleDateString("tr-TR")}
                </Text>

                <View style={styles.progressBackground}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.min(
                          report.progress,
                          100
                        )}%`,
                      },
                    ]}
                  />
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </SafeAreaView>
    );
  }

  /*
   * RAPOR BAŞLANGIÇ EKRANI
   */
  if (photos.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.home}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>
            Bildir
          </Text>

          <Text style={styles.subtitle}>
            Çevrende gördüğün sorunları bildir.
          </Text>

          <TouchableOpacity
            style={styles.createCard}
            onPress={openReport}
          >
            <View style={styles.plusCircle}>
              <Text style={styles.plus}>
                +
              </Text>
            </View>

            <View style={styles.createInfo}>
              <Text style={styles.createTitle}>
                Rapor Oluştur
              </Text>

              <Text style={styles.createSubtitle}>
                Yeni bir sorun bildir
              </Text>
            </View>

            <Text style={styles.arrow}>
              ›
            </Text>
          </TouchableOpacity>

          <View style={styles.oldSection}>
            <Text style={styles.sectionTitle}>
              Eski Raporlar
            </Text>

            <Text style={styles.sectionSubtitle}>
              Daha önce oluşturduğun raporları görüntüle.
            </Text>

            <TouchableOpacity
              style={styles.oldButton}
              onPress={openOldReports}
            >
              <Text style={styles.oldButtonText}>
                Eski Raporları Görüntüle
              </Text>

              <Text style={styles.oldArrow}>
                →
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  /*
   * HARİTA MODALI
   */
  return (
    <>
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.form}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.formHeader}>
            <TouchableOpacity
              onPress={() => {
                setPhotos([]);
                setDescription("");
                setCategoriesSelected([]);
                setLocation(null);
                setOriginalLocation(null);
                setSelectedMapLocation(null);
                setPreviewUri(null);
                setCameraOpen(false);
                setOldReportsOpen(false);
                setLoadingOldReports(false);
                setOldReports([]);
              }}
            >
              <Text style={styles.cancel}>
                ‹ Geri
              </Text>
            </TouchableOpacity>

            <Text style={styles.formTitle}>
              Rapor Oluştur
            </Text>

            <View style={{ width: 50 }} />
          </View>

          <Text style={styles.formSection}>
            Fotoğraflar
          </Text>

          <Text style={styles.formHint}>
            1 ile 6 arasında fotoğraf ekleyebilirsin.
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.photoList}
          >
            {photos.map((uri, index) => (
              <View
                key={`${uri}-${index}`}
                style={styles.photoWrapper}
              >
                <Image
                  source={{ uri }}
                  style={styles.thumbnail}
                />

                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() =>
                    removePhoto(index)
                  }
                >
                  <Text style={styles.deleteText}>
                    ×
                  </Text>
                </TouchableOpacity>

                <View style={styles.number}>
                  <Text style={styles.numberText}>
                    {index + 1}
                  </Text>
                </View>
              </View>
            ))}

            {photos.length < MAX_PHOTOS && (
              <TouchableOpacity
                style={styles.addPhoto}
                onPress={addPhoto}
              >
                <Text style={styles.addPlus}>
                  +
                </Text>

                <Text style={styles.addText}>
                  Fotoğraf Çek
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          <Text style={styles.formSection}>
            Sorunun Kategorisi
          </Text>

          <Text style={styles.formHint}>
            Bir veya birden fazla kategori seçebilirsin.
          </Text>

          <View style={styles.categoryGrid}>
            {categories.map((item) => {
              const selected =
                categoriesSelected.includes(
                  item.id
                );

              return (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.8}
                  style={[
                    styles.categoryCard,
                    selected &&
                      styles.categoryCardSelected,
                  ]}
                  onPress={() =>
                    toggleCategory(item.id)
                  }
                >
                  <Text style={styles.categoryIcon}>
                    {item.icon}
                  </Text>

                  <Text
                    style={[
                      styles.categoryText,
                      selected &&
                        styles.categoryTextSelected,
                    ]}
                  >
                    {item.label}
                  </Text>

                  {selected && (
                    <View
                      style={styles.checkCircle}
                    >
                      <Text
                        style={styles.checkText}
                      >
                        ✓
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.descriptionHeader}>
  <Text style={styles.formSection}>
    Sorunun Açıklaması
  </Text>
</View>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Sorunu açıklayın..."
            placeholderTextColor="#999"
            multiline
            textAlignVertical="top"
            style={styles.input}
          />

          <TouchableOpacity
            style={styles.aiButton}
            onPress={fillWithAI}
            disabled={aiLoading}
          >
            {aiLoading ? (
              <ActivityIndicator
                size="small"
                color="#FFFFFF"
              />
            ) : (
              <Text style={styles.aiButtonText}>
                ✨ Yapay Zeka ile Doldur
              </Text>
            )}
          </TouchableOpacity>

          <Text style={styles.formSection}>
            Konum
          </Text>

          <Text style={styles.formHint}>
            Sorunun bulunduğu konumu işaretleyebilirsin.
          </Text>

          <View style={styles.locationCard}>
            <Text style={styles.locationIcon}>
              📍
            </Text>

            <View style={styles.locationInfo}>
              <Text style={styles.locationTitle}>
                {loadingLocation
                  ? "Konum alınıyor..."
                  : location
                  ? "Konum Alındı"
                  : "Konum alınamadı"}
              </Text>

              {location && (
                <Text style={styles.coordinates}>
                  {location.latitude.toFixed(6)},{" "}
                  {location.longitude.toFixed(6)}
                </Text>
              )}
            </View>
          </View>

          <TouchableOpacity
            style={styles.changeLocationButton}
            onPress={() => {
              if (!originalLocation) {
                Alert.alert(
                  "Konum Bekleniyor",
                  "Önce mevcut konumunun alınmasını bekle."
                );

                return;
              }

              setSelectedMapLocation(
                location &&
                  location !== originalLocation
                  ? location
                  : null
              );

              setMapOpen(true);
            }}
          >
            <Text style={styles.changeLocationIcon}>
              🗺️
            </Text>

            <View style={{ flex: 1 }}>
              <Text
                style={
                  styles.changeLocationTitle
                }
              >
                Konumu Değiştir
              </Text>

              <Text
                style={
                  styles.changeLocationSubtitle
                }
              >
                En fazla 500 metre yakınından seçebilirsin.
              </Text>
            </View>

            <Text style={styles.locationArrow}>
              ›
            </Text>
          </TouchableOpacity>

          {location &&
            originalLocation &&
            calculateDistance(
              originalLocation,
              location
            ) > 1 && (
              <TouchableOpacity
                style={styles.resetLocationButton}
                onPress={resetToCurrentLocation}
              >
                <Text
                  style={styles.resetLocationText}
                >
                  Mevcut konuma geri dön
                </Text>
              </TouchableOpacity>
            )}

          <TouchableOpacity
            style={[
              styles.submitButton,
              sending &&
                styles.disabledButton,
            ]}
            onPress={submitReport}
            disabled={sending}
          >
            <Text style={styles.submitText}>
              {sending
                ? "Gönderiliyor..."
                : "Bildir"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>

      <Modal
        visible={mapOpen}
        animationType="slide"
        onRequestClose={() =>
          setMapOpen(false)
        }
      >
        <SafeAreaView style={styles.mapContainer}>
          <View style={styles.mapHeader}>
            <TouchableOpacity
              onPress={() =>
                setMapOpen(false)
              }
              style={styles.mapBackButton}
            >
              <Text style={styles.mapBackText}>
                ‹
              </Text>
            </TouchableOpacity>

            <View>
              <Text style={styles.mapTitle}>
                Konumu Değiştir
              </Text>

              <Text style={styles.mapSubtitle}>
                Mavi çember içinde bir nokta seç
              </Text>
            </View>

            <View style={{ width: 40 }} />
          </View>

          {originalLocation && (
            <MapView
              style={styles.map}
              initialRegion={{
                latitude:
                  originalLocation.latitude,
                longitude:
                  originalLocation.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              onPress={handleMapPress}
              showsUserLocation
              showsMyLocationButton
            >
              <Circle
                center={{
                  latitude:
                    originalLocation.latitude,
                  longitude:
                    originalLocation.longitude,
                }}
                radius={MAX_LOCATION_DISTANCE}
                strokeWidth={2}
                strokeColor="#315EE8"
                fillColor="#315EE820"
              />

              <Marker
                coordinate={{
                  latitude:
                    originalLocation.latitude,
                  longitude:
                    originalLocation.longitude,
                }}
                title="Mevcut Konum"
                description="Başlangıç konumun"
              />

              {selectedMapLocation && (
                <Marker
                  coordinate={
                    selectedMapLocation
                  }
                  title="Seçilen Konum"
                  pinColor="#315EE8"
                />
              )}
            </MapView>
          )}

          <View style={styles.mapBottom}>
            <Text style={styles.mapInstruction}>
              Sorunun bulunduğu noktaya harita üzerinden
              dokun.
            </Text>

            <Text style={styles.mapDistance}>
              Maksimum mesafe: 500 metre
            </Text>

            {selectedMapLocation &&
              originalLocation && (
                <Text style={styles.selectedDistance}>
                  Seçilen nokta:{" "}
                  {Math.round(
                    calculateDistance(
                      originalLocation,
                      selectedMapLocation
                    )
                  )}{" "}
                  metre
                </Text>
              )}

            <TouchableOpacity
              style={[
                styles.confirmLocationButton,
                !selectedMapLocation &&
                  styles.disabledButton,
              ]}
              onPress={confirmMapLocation}
              disabled={!selectedMapLocation}
            >
              <Text
                style={
                  styles.confirmLocationText
                }
              >
                Bu Konumu Kullan
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8FA",
  },

  guestContainer: {
    flex: 1,
    backgroundColor: "#F7F8FA",
    justifyContent: "center",
    padding: 24,
  },

  guestPanel: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E8EBF0",
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
  },

  guestTitle: {
    color: "#172033",
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
  },

  guestSubtitle: {
    color: "#687386",
    fontSize: 15,
    lineHeight: 22,
    marginTop: 10,
    textAlign: "center",
  },

  guestPrimaryButton: {
    alignItems: "center",
    backgroundColor: "#315EE8",
    borderRadius: 12,
    marginTop: 24,
    paddingVertical: 14,
  },

  guestPrimaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },

  guestSecondaryButton: {
    alignItems: "center",
    borderColor: "#315EE8",
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 12,
    paddingVertical: 14,
  },

  guestSecondaryButtonText: {
    color: "#315EE8",
    fontSize: 16,
    fontWeight: "800",
  },

  home: {
    padding: 24,
    paddingBottom: 40,
  },

  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#172033",
    marginTop: 10,
  },

  subtitle: {
    fontSize: 16,
    color: "#687386",
    marginTop: 8,
  },

  createCard: {
    marginTop: 28,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E8EBF0",
  },

  plusCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#315EE8",
    justifyContent: "center",
    alignItems: "center",
  },

  plus: {
    color: "#FFFFFF",
    fontSize: 34,
  },

  createInfo: {
    flex: 1,
    marginLeft: 16,
  },

  createTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#172033",
  },

  createSubtitle: {
    fontSize: 14,
    color: "#7B8494",
    marginTop: 5,
  },

  arrow: {
    fontSize: 32,
    color: "#A2A9B5",
  },

  oldSection: {
    marginTop: 42,
  },

  sectionTitle: {
    fontSize: 21,
    fontWeight: "700",
    color: "#172033",
  },

  sectionSubtitle: {
    fontSize: 14,
    color: "#7B8494",
    marginTop: 6,
  },

  oldButton: {
    marginTop: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E8EBF0",
  },

  oldButtonText: {
    flex: 1,
    color: "#315EE8",
    fontSize: 16,
    fontWeight: "600",
  },

  oldArrow: {
    color: "#315EE8",
    fontSize: 22,
  },

  cameraContainer: {
    flex: 1,
    backgroundColor: "#000000",
  },

  camera: {
    flex: 1,
  },

  cameraHeader: {
    height: 70,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#000000",
  },

  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
  },

  backText: {
    color: "#FFFFFF",
    fontSize: 40,
    fontWeight: "300",
  },

  cameraTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },

  counter: {
    minWidth: 40,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#333333",
    justifyContent: "center",
    alignItems: "center",
  },

  counterText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },

  cameraBottom: {
    backgroundColor: "#000000",
    alignItems: "center",
    paddingTop: 16,
    paddingBottom: 30,
  },

  cameraInfo: {
    color: "#FFFFFF",
    marginBottom: 18,
    fontSize: 15,
  },

  captureButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 5,
    borderColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },

  captureInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "#FFFFFF",
  },

  preview: {
    flex: 1,
    width: "100%",
    backgroundColor: "#000000",
  },

  previewBottom: {
    backgroundColor: "#000000",
    padding: 20,
    gap: 12,
  },

  retakeButton: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },

  retakeText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },

  useButton: {
    height: 54,
    borderRadius: 14,
    backgroundColor: "#315EE8",
    justifyContent: "center",
    alignItems: "center",
  },

  useText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  form: {
    padding: 22,
    paddingBottom: 50,
  },

  formHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  cancel: {
    color: "#315EE8",
    fontSize: 16,
    fontWeight: "600",
  },

  formTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#172033",
  },

  formSection: {
    fontSize: 18,
    fontWeight: "700",
    color: "#172033",
    marginTop: 20,
  },

  formHint: {
    fontSize: 13,
    color: "#7B8494",
    marginTop: 5,
  },

  photoList: {
    marginTop: 14,
  },

  photoWrapper: {
    width: 110,
    height: 110,
    marginRight: 12,
    borderRadius: 14,
    overflow: "hidden",
  },

  thumbnail: {
    width: "100%",
    height: "100%",
  },

  deleteButton: {
    position: "absolute",
    right: 6,
    top: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#000000AA",
    justifyContent: "center",
    alignItems: "center",
  },

  deleteText: {
    color: "#FFFFFF",
    fontSize: 22,
  },

  number: {
    position: "absolute",
    left: 6,
    bottom: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#315EE8",
    justifyContent: "center",
    alignItems: "center",
  },

  numberText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },

  addPhoto: {
    width: 110,
    height: 110,
    borderRadius: 14,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#D9DEE7",
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },

  addPlus: {
    color: "#315EE8",
    fontSize: 30,
  },

  addText: {
    color: "#315EE8",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 4,
  },

  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 14,
  },

  categoryCard: {
    width: "48%",
    minHeight: 76,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E0E4EA",
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
  },

  categoryCardSelected: {
    borderColor: "#315EE8",
    backgroundColor: "#EEF3FF",
    borderWidth: 2,
  },

  categoryIcon: {
    fontSize: 25,
    width: 36,
    textAlign: "center",
  },

  categoryText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "600",
    color: "#172033",
  },

  categoryTextSelected: {
    color: "#315EE8",
    fontWeight: "700",
  },

  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#315EE8",
    justifyContent: "center",
    alignItems: "center",
  },

  checkText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },

  descriptionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },

  aiButton: {
    backgroundColor: "#315EE8",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 20,
  },

  aiButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  aiText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },

  input: {
    marginTop: 12,
    minHeight: 140,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E0E4EA",
    padding: 15,
    fontSize: 15,
    color: "#172033",
  },

  locationCard: {
    marginTop: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E4EA",
  },

  locationIcon: {
    fontSize: 25,
  },

  locationInfo: {
    flex: 1,
    marginLeft: 12,
  },

  locationTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#172033",
  },

  coordinates: {
    fontSize: 12,
    color: "#7B8494",
    marginTop: 3,
  },

  changeLocationButton: {
    marginTop: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#315EE8",
  },

  changeLocationIcon: {
    fontSize: 24,
    marginRight: 12,
  },

  changeLocationTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#315EE8",
  },

  changeLocationSubtitle: {
    fontSize: 12,
    color: "#7B8494",
    marginTop: 3,
  },

  locationArrow: {
    fontSize: 28,
    color: "#A2A9B5",
  },

  resetLocationButton: {
    marginTop: 10,
    alignItems: "center",
    padding: 10,
  },

  resetLocationText: {
    color: "#315EE8",
    fontSize: 14,
    fontWeight: "600",
  },

  submitButton: {
    height: 56,
    borderRadius: 16,
    backgroundColor: "#315EE8",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 30,
  },

  disabledButton: {
    opacity: 0.5,
  },

  submitText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
  },

  oldReportsContainer: {
    flex: 1,
    backgroundColor: "#F7F8FA",
  },

  oldReportsHeader: {
    height: 76,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E8EBF0",
  },

  oldReportsTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#172033",
  },

  oldReportsList: {
    padding: 20,
    paddingBottom: 40,
  },

  oldReportCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E8EBF0",
  },

  oldReportTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  oldReportTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: "#172033",
    marginRight: 10,
  },

  oldReportStatus: {
    fontSize: 12,
    fontWeight: "700",
    color: "#315EE8",
  },

  oldReportCategory: {
    fontSize: 13,
    color: "#687386",
    marginTop: 7,
  },

  oldReportDate: {
    fontSize: 12,
    color: "#9AA2AF",
    marginTop: 6,
  },

  progressBackground: {
    height: 7,
    borderRadius: 4,
    backgroundColor: "#E8EBF0",
    overflow: "hidden",
    marginTop: 12,
  },

  progressFill: {
    height: "100%",
    backgroundColor: "#315EE8",
    borderRadius: 4,
  },

  oldReportsEmpty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },

  oldReportsEmptyTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#172033",
  },

  oldReportsEmptyText: {
    fontSize: 14,
    color: "#7B8494",
    textAlign: "center",
    marginTop: 8,
  },

  mapContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  mapHeader: {
    height: 76,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E8EBF0",
  },

  mapBackButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
  },

  mapBackText: {
    fontSize: 40,
    color: "#172033",
    fontWeight: "300",
  },

  mapTitle: {
    textAlign: "center",
    fontSize: 18,
    fontWeight: "800",
    color: "#172033",
  },

  mapSubtitle: {
    textAlign: "center",
    fontSize: 12,
    color: "#7B8494",
    marginTop: 3,
  },

  map: {
    flex: 1,
  },

  mapBottom: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    paddingBottom: 28,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
  },

  mapInstruction: {
    fontSize: 15,
    color: "#172033",
    fontWeight: "600",
    textAlign: "center",
  },

  mapDistance: {
    fontSize: 13,
    color: "#7B8494",
    textAlign: "center",
    marginTop: 5,
  },

  selectedDistance: {
    fontSize: 13,
    color: "#315EE8",
    fontWeight: "700",
    textAlign: "center",
    marginTop: 6,
  },

  confirmLocationButton: {
    height: 54,
    borderRadius: 15,
    backgroundColor: "#315EE8",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 15,
  },

  confirmLocationText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
});
