import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Linking,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";

import { AuthResponse, clearAuthData, getAuthData } from "../../lib/auth";
import {
  fetchFollowedReports,
  fetchNotificationSettings,
  updateProfile,
  updatePassword,
  updateNotificationSettings,
  unfollowReport,
  requestEmailChange,
  confirmEmailChange,
} from "../../lib/api";
import { Report } from "../../types/report";
import { categoryLabels, statusLabels } from "../../constants/report";
import {
  ensurePushPermission,
  syncPushSubscription,
} from "../../lib/pushNotifications";

const roleLabels: Record<string, string> = {
  citizen: "Vatandaş",
  municipality: "Belediye",
  admin: "Yönetici",
};

const EMAIL_CODE_EXPIRY_SECONDS = 3 * 60;

type ProfileSettings = {
  push_notifications: boolean;
  location_notifications: boolean;
  email_notifications: boolean;
};

export default function ProfileScreen() {
  const router = useRouter();
  const [auth, setAuth] = useState<AuthResponse | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [followedReports, setFollowedReports] = useState<Report[]>([]);
  const [loadingFollowed, setLoadingFollowed] = useState(true);
  const [showAllFollowed, setShowAllFollowed] = useState(false);
  const [followedStatusFilter, setFollowedStatusFilter] = useState("all");
  const [followedCategoryFilter, setFollowedCategoryFilter] = useState("all");
  const [followedDateFilter, setFollowedDateFilter] = useState("all");
  const [showFollowedFilters, setShowFollowedFilters] = useState(false);
  const [unfollowingId, setUnfollowingId] = useState<string | null>(null);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [showEmailSettings, setShowEmailSettings] = useState(false);
  const [emailSettingsView, setEmailSettingsView] = useState<"menu" | "email" | "email-code" | "password">("menu");
  const [savingEmail, setSavingEmail] = useState(false);
  const [pendingNewEmail, setPendingNewEmail] = useState("");
  const [emailChangeCode, setEmailChangeCode] = useState("");
  const [confirmingEmailChange, setConfirmingEmailChange] = useState(false);
  const [resendingEmailCode, setResendingEmailCode] = useState(false);
  const [emailCodeSecondsLeft, setEmailCodeSecondsLeft] = useState(0);
  const [showAccountInfo, setShowAccountInfo] = useState(false);
  const [draftCurrentPassword, setDraftCurrentPassword] = useState("");
  const [draftNewPassword, setDraftNewPassword] = useState("");
  const [draftConfirmPassword, setDraftConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftEmail, setDraftEmail] = useState("");
  const [draftAvatarUrl, setDraftAvatarUrl] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [settings, setSettings] = useState<ProfileSettings>({
    push_notifications: false,
    location_notifications: false,
    email_notifications: false,
  });

  useEffect(() => {
    const loadSettings = async (accessToken: string) => {
      try {
        const savedSettings = await fetchNotificationSettings(accessToken);
        setSettings(savedSettings);
      } catch (error) {
        console.log("LOAD PROFILE SETTINGS ERROR:", error);
      }
    };

    getAuthData()
      .then((data) => {
        setAuth(data);

        if (data) {
          setDraftName(data.user.name);
          setDraftEmail(data.user.email);

          fetchFollowedReports(data.access_token)
            .then(setFollowedReports)
            .catch((error) => {
              console.log("FETCH FOLLOWED REPORTS ERROR:", error);
              setFollowedReports([]);
            })
            .finally(() => setLoadingFollowed(false));
          loadSettings(data.access_token);
          return;
        }

        setFollowedReports([]);
        setLoadingFollowed(false);
      })
      .finally(() => setCheckingAuth(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      getAuthData().then((data) => {
        if (!active || !data) return;

        fetchFollowedReports(data.access_token)
          .then((reports) => {
            if (active) setFollowedReports(reports);
          })
          .catch((error) => {
            console.log("REFRESH FOLLOWED REPORTS ERROR:", error);
          });
      });

      return () => {
        active = false;
      };
    }, [])
  );

  useEffect(() => {
    if (emailCodeSecondsLeft <= 0) return;
    const timer = setInterval(() => {
      setEmailCodeSecondsLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [emailCodeSecondsLeft]);

  const matchesDateFilter = (report: Report, filter: string) => {
    if (filter === "all") return true;

    const reference = report.followed_at || report.created_at;
    if (!reference) return true;

    const referenceDate = new Date(reference);
    const now = new Date();
    const diffDays = (now.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24);

    if (filter === "today") return diffDays < 1;
    if (filter === "week") return diffDays < 7;
    if (filter === "month") return diffDays < 30;

    return true;
  };

  const handleUnfollowReport = (report: Report) => {
    if (!auth) return;

    Alert.alert(
      "Takibi Bırak",
      `"${report.title}" adlı sorunu takipten çıkarmak istediğinize emin misiniz?`,
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Takibi Bırak",
          style: "destructive",
          onPress: async () => {
            try {
              setUnfollowingId(report.id);
              await unfollowReport(report.id, auth.access_token);
              setFollowedReports((current) =>
                current.filter((item) => item.id !== report.id)
              );
            } catch (error) {
              Alert.alert(
                "Takip bırakılamadı",
                error instanceof Error ? error.message : "Lütfen tekrar deneyin."
              );
            } finally {
              setUnfollowingId(null);
            }
          },
        },
      ]
    );
  };

  const handleLogout = async () => {
    Alert.alert(
      "Çıkış Yap",
      "Hesabınızdan çıkış yapmak istediğinize emin misiniz?",
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Çıkış Yap",
          style: "destructive",
          onPress: async () => {
            await clearAuthData();
            setAuth(null);
            setFollowedReports([]);
            router.replace("/");
          },
        },
      ]
    );
  };

  const handleDeleteAccount = async () => {
    if (!auth) return;

    Alert.alert(
      "Hesabı Sil",
      "Hesabınızı kalıcı olarak silmek istediğinize emin misiniz? Tüm raporlarınız ve yorumlarınız silinecektir.",
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: async () => {
            try {
              setDeleting(true);
              const { deleteAccount } = await import("../../lib/api");
              await deleteAccount(auth.access_token);
              await clearAuthData();
              setFollowedReports([]);
              router.dismissTo("/(auth)/login");
              setAuth(null);
            } catch (err) {
              console.log("DELETE ACCOUNT ERROR", err);
              Alert.alert("Hata", String(err));
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const toggleSetting = async (key: keyof ProfileSettings) => {
    if (!auth) return;

    const nextValue = !settings[key];
    setSettings((current) => ({ ...current, [key]: nextValue }));

    try {
      const nextSettings = { ...settings, [key]: nextValue };
      let latitude: number | undefined;
      let longitude: number | undefined;

      if (key === "push_notifications" && nextValue) {
        await ensurePushPermission();
      }

      if (key === "location_notifications" && nextValue) {
        const locationPermission =
          await Location.requestForegroundPermissionsAsync();
        if (locationPermission.status !== "granted") {
          throw new Error(
            locationPermission.canAskAgain === false
              ? "Konum izinlerinizi açmanız gerekiyor."
              : "Konum izni verilmedi."
          );
        }

        await ensurePushPermission();

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        latitude = location.coords.latitude;
        longitude = location.coords.longitude;
      }

      const savedSettings = await updateNotificationSettings(auth.access_token, {
        [key]: nextValue,
      });
      setSettings((current) => ({ ...current, ...savedSettings }));

      if (key === "push_notifications" || key === "location_notifications") {
        try {
          if (nextSettings.push_notifications || nextSettings.location_notifications) {
            await syncPushSubscription(
              auth.access_token,
              true,
              latitude,
              longitude
            );
          } else {
            await syncPushSubscription(auth.access_token, false);
          }
        } catch (notificationError) {
          Alert.alert(
            "Ayar kaydedildi",
            notificationError instanceof Error
              ? notificationError.message
              : "Cihaz bildirimleri henüz etkinleştirilemedi."
          );
          console.log("PUSH SUBSCRIPTION ERROR:", notificationError);
        }
      }
    } catch (error) {
      setSettings((current) => ({ ...current, [key]: !nextValue }));
      const message =
        error instanceof Error
          ? error.message
          : "Ayar kaydedilemedi. Lütfen tekrar deneyin.";
      const needsSettings =
        message.includes("izinlerinizi açmanız gerekiyor") ||
        message.includes("web ortamında");

      Alert.alert(
        needsSettings ? "İzin gerekli" : "Bildirim ayarları",
        message,
        needsSettings
          ? [
              { text: "İptal", style: "cancel" },
              { text: "Ayarlar", onPress: () => Linking.openSettings() },
            ]
          : undefined
      );
      console.log("SAVE PROFILE SETTINGS ERROR:", error);
    }
  };

  const initials = auth?.user?.name?.trim()?.charAt(0)?.toUpperCase() || "U";

  const handleEditProfile = () => {
    if (!auth) return;
    setDraftName(auth.user.name);
    setDraftAvatarUrl(auth.user.avatar_url ?? null);
    setIsEditingProfile(true);
  };

  const chooseProfilePhoto = async (source: "camera" | "gallery") => {
    const result = source === "camera"
      ? await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.7,
          base64: true,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.7,
          base64: true,
        });

    if (!result.canceled && result.assets[0]?.base64) {
      setDraftAvatarUrl(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const openPhotoOptions = () => {
    Alert.alert("Profil fotoğrafı", "Fotoğraf seçin", [
      { text: "İptal", style: "cancel" },
      { text: "Galeriden seç", onPress: () => chooseProfilePhoto("gallery") },
      { text: "Kamera ile çek", onPress: () => chooseProfilePhoto("camera") },
    ]);
  };

  const handleSaveProfile = async () => {
    if (!auth) return;

    const nextName = draftName.trim();

    if (!nextName) {
      Alert.alert("Hata", "Ad alanı boş olamaz.");
      return;
    }

    try {
      setSavingProfile(true);
      const updatedUser = await updateProfile(auth.access_token, {
        name: nextName,
        avatar_url: draftAvatarUrl,
      });
      const updatedAuth = { ...auth, user: updatedUser };
      await AsyncStorage.setItem("SORUN_VAR_AUTH", JSON.stringify(updatedAuth));
      setAuth(updatedAuth);
      setIsEditingProfile(false);
    } catch (error) {
      Alert.alert(
        "Profil güncellenemedi",
        error instanceof Error ? error.message : "Lütfen tekrar deneyin."
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const getPasswordRequirementError = (value: string) => {
    if (new TextEncoder().encode(value).length > 72) {
      return "Şifre en fazla 72 byte olabilir.";
    }

    const missing: string[] = [];
    if (!/[A-Z]/.test(value)) missing.push("büyük harf");
    if (!/[a-z]/.test(value)) missing.push("küçük harf");
    if (!/[0-9]/.test(value)) missing.push("rakam");
    if (!/[^A-Za-z0-9]/.test(value)) missing.push("özel karakter");

    if (missing.length > 0) {
      return `Şifrenizde en az bir ${missing.join(", en az bir ")} bulunmalıdır.`;
    }

    return null;
  };

  const handleEditEmail = () => {
    if (!auth) return;
    setDraftEmail(auth.user.email);
    setDraftCurrentPassword("");
    setDraftNewPassword("");
    setDraftConfirmPassword("");
    setEmailSettingsView("menu");
    setShowEmailSettings(true);
  };

  const closeEmailSettings = () => {
    setShowEmailSettings(false);
    setEmailSettingsView("menu");
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setPendingNewEmail("");
    setEmailChangeCode("");
    setEmailCodeSecondsLeft(0);
  };

  const requestEmailChangeCode = async (nextEmail: string) => {
    if (!auth) return;

    try {
      setSavingEmail(true);
      await requestEmailChange(auth.access_token, nextEmail);
      setPendingNewEmail(nextEmail);
      setEmailChangeCode("");
      setEmailCodeSecondsLeft(EMAIL_CODE_EXPIRY_SECONDS);
      setEmailSettingsView("email-code");
    } catch (error) {
      Alert.alert(
        "Kod gönderilemedi",
        error instanceof Error ? error.message : "Lütfen tekrar deneyin."
      );
    } finally {
      setSavingEmail(false);
    }
  };

  const handleSaveEmail = () => {
    if (!auth) return;

    const nextEmail = draftEmail.trim();

    if (!nextEmail) {
      Alert.alert("Hata", "E-posta alanı boş olamaz.");
      return;
    }

    if (!isValidEmail(nextEmail)) {
      Alert.alert("Hata", "Lütfen geçerli bir e-posta adresi girin.");
      return;
    }

    if (nextEmail.toLowerCase() === auth.user.email.toLowerCase()) {
      Alert.alert("Hata", "Yeni e-posta mevcut e-postanızla aynı.");
      return;
    }

    Alert.alert(
      "E-postayı Değiştir",
      `E-posta adresinizi "${nextEmail}" olarak değiştirmek üzeresiniz. Onaylıyor musunuz?`,
      [
        { text: "Vazgeç", style: "cancel" },
        { text: "Onayla", onPress: () => requestEmailChangeCode(nextEmail) },
      ]
    );
  };

  const handleConfirmEmailChange = async () => {
    if (!auth) return;

    const trimmedCode = emailChangeCode.trim();
    if (!trimmedCode) {
      Alert.alert("Hata", "Lütfen doğrulama kodunu girin.");
      return;
    }

    try {
      setConfirmingEmailChange(true);
      const updatedAuth = await confirmEmailChange(auth.access_token, trimmedCode);
      await AsyncStorage.setItem("SORUN_VAR_AUTH", JSON.stringify(updatedAuth));
      setAuth(updatedAuth);
      setPendingNewEmail("");
      setEmailChangeCode("");
      setEmailSettingsView("menu");
      Alert.alert("Başarılı", "E-posta adresiniz güncellendi.");
    } catch (error) {
      Alert.alert(
        "E-posta güncellenemedi",
        error instanceof Error ? error.message : "Lütfen tekrar deneyin."
      );
    } finally {
      setConfirmingEmailChange(false);
    }
  };

  const handleResendEmailChangeCode = async () => {
    if (!auth || !pendingNewEmail) return;

    try {
      setResendingEmailCode(true);
      await requestEmailChange(auth.access_token, pendingNewEmail);
      setEmailCodeSecondsLeft(EMAIL_CODE_EXPIRY_SECONDS);
      setEmailChangeCode("");
      Alert.alert("Kod Gönderildi", "Yeni doğrulama kodu e-posta adresinize gönderildi.");
    } catch (error) {
      Alert.alert("Hata", error instanceof Error ? error.message : "Kod tekrar gönderilemedi.");
    } finally {
      setResendingEmailCode(false);
    }
  };

  const savePassword = async (currentPassword: string, newPassword: string) => {
    if (!auth) return;

    try {
      setSavingPassword(true);
      await updatePassword(auth.access_token, currentPassword, newPassword);
      setDraftCurrentPassword("");
      setDraftNewPassword("");
      setDraftConfirmPassword("");
      setEmailSettingsView("menu");
      Alert.alert("Başarılı", "Şifreniz güncellendi.");
    } catch (error) {
      Alert.alert(
        "Şifre güncellenemedi",
        error instanceof Error ? error.message : "Lütfen tekrar deneyin."
      );
    } finally {
      setSavingPassword(false);
    }
  };

  const handleSavePassword = () => {
    if (!auth) return;

    const currentPassword = draftCurrentPassword.trim();
    const newPassword = draftNewPassword.trim();
    const confirmPassword = draftConfirmPassword.trim();

    if (!currentPassword) {
      Alert.alert("Hata", "Mevcut şifrenizi girin.");
      return;
    }

    const passwordError = getPasswordRequirementError(newPassword);
    if (passwordError) {
      Alert.alert("Hata", passwordError);
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Hata", "Yeni şifreler eşleşmiyor.");
      return;
    }

    Alert.alert(
      "Şifreyi Değiştir",
      "Şifrenizi değiştirmek üzeresiniz. Onaylıyor musunuz?",
      [
        { text: "Vazgeç", style: "cancel" },
        { text: "Onayla", onPress: () => savePassword(currentPassword, newPassword) },
      ]
    );
  };

  if (checkingAuth) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator color="#2563EB" />
      </SafeAreaView>
    );
  }

  if (!auth) {
    return (
      <SafeAreaView style={styles.centered}>
        <View style={styles.guestPanel}>
          <Text style={styles.title}>Profil için giriş yapın</Text>
          <Text style={styles.subtitle}>
            Misafir olarak gezmeye devam edebilirsiniz. Profil bilgileri ve
            hesap işlemleri için giriş yapmanız gerekir.
          </Text>

          <Pressable
            style={styles.primaryButton}
            onPress={() => router.push("/(auth)/login")}
          >
            <Text style={styles.primaryButtonText}>Giriş Yap</Text>
          </Pressable>

          <Pressable
            style={styles.secondaryButton}
            onPress={() => router.push("/(auth)/register")}
          >
            <Text style={styles.secondaryButtonText}>Kayıt Ol</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.panel}>
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              {auth.user.avatar_url ? (
                <Image source={{ uri: auth.user.avatar_url }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>{initials}</Text>
              )}
            </View>

            <Text style={styles.name}>{auth.user.name}</Text>
            <Text style={styles.email}>{auth.user.email}</Text>

            {!isEditingProfile && (
              <Pressable style={styles.editButton} onPress={handleEditProfile}>
                <Text style={styles.editButtonText}>Profili Düzenle</Text>
              </Pressable>
            )}
          </View>

          <Modal
            visible={isEditingProfile}
            animationType="fade"
            transparent
            onRequestClose={() => setIsEditingProfile(false)}
          >
            <View style={styles.centeredModalOverlay}>
              <View style={styles.centeredModalCard}>
                <ScrollView showsVerticalScrollIndicator={false}>
                  <Text style={styles.sectionTitle}>Profili Güncelle</Text>

                  <View style={styles.photoEditRow}>
                    <View style={styles.editAvatar}>
                      {draftAvatarUrl ? (
                        <Image source={{ uri: draftAvatarUrl }} style={styles.editAvatarImage} />
                      ) : (
                        <Text style={styles.editAvatarText}>{initials}</Text>
                      )}
                    </View>
                    <View style={styles.photoActions}>
                      <Pressable style={styles.photoButton} onPress={openPhotoOptions}>
                        <Text style={styles.photoButtonText}>Fotoğrafı değiştir</Text>
                      </Pressable>
                      {draftAvatarUrl && (
                        <Pressable onPress={() => setDraftAvatarUrl(null)}>
                          <Text style={styles.removePhotoText}>Fotoğrafı kaldır</Text>
                        </Pressable>
                      )}
                    </View>
                  </View>

                  <Text style={styles.inputLabel}>Ad Soyad</Text>
                  <TextInput
                    value={draftName}
                    onChangeText={setDraftName}
                    style={styles.input}
                    placeholder="Adınız"
                    placeholderTextColor="#94A3B8"
                  />

                  <View style={styles.editActions}>
                    <Pressable
                      style={[styles.secondaryAction, styles.cancelAction]}
                      onPress={() => setIsEditingProfile(false)}
                    >
                      <Text style={styles.secondaryActionText}>İptal</Text>
                    </Pressable>

                    <Pressable style={styles.primaryAction} onPress={handleSaveProfile} disabled={savingProfile}>
                      {savingProfile ? <ActivityIndicator color="white" /> : <Text style={styles.primaryActionText}>Kaydet</Text>}
                    </Pressable>
                  </View>
                </ScrollView>
              </View>
            </View>
          </Modal>

          <View style={styles.section}>
            <Pressable
              style={styles.followedHeader}
              onPress={() => {
                if (followedReports.length === 0) return;
                setFollowedStatusFilter("all");
                setFollowedCategoryFilter("all");
                setFollowedDateFilter("all");
                setShowFollowedFilters(false);
                setShowAllFollowed(true);
              }}
              disabled={followedReports.length === 0}
            >
              <Text style={styles.sectionTitle}>Takip edilen problemler</Text>
              <Text style={styles.followedCount}>{followedReports.length}</Text>
            </Pressable>

            {loadingFollowed ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator color="#2563EB" />
              </View>
            ) : followedReports.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyTitle}>Henüz takip ettiğiniz sorun yok</Text>
                <Text style={styles.emptyText}>
                  Ana ekrandan bir sorunu takip ederek burada görünmesini sağlayabilirsiniz.
                </Text>
              </View>
            ) : (
              followedReports.slice(0, 3).map((report) => (
                <Pressable
                  key={report.id}
                  style={styles.reportCard}
                  onPress={() => router.push({ pathname: "/(tabs)/home" })}
                >
                  <View style={styles.reportHeader}>
                    <Text style={styles.reportTitle} numberOfLines={1}>
                      {report.title}
                    </Text>
                    <Text style={styles.reportStatus}>
                      {statusLabels[report.status] || report.status}
                    </Text>
                  </View>

                  <Text style={styles.reportMeta}>
                    {report.city || "Konum bilinmiyor"} • {report.follower_count || 0} takip
                  </Text>
                </Pressable>
              ))
            )}
          </View>

          <Modal
            visible={showAllFollowed}
            animationType="slide"
            onRequestClose={() => setShowAllFollowed(false)}
          >
            <SafeAreaView style={styles.followedModal}>
              <View style={styles.followedModalHeader}>
                <Text style={styles.followedModalTitle}>
                  Takip edilen problemler ({followedReports.length})
                </Text>
                <Pressable
                  style={styles.followedCloseButton}
                  onPress={() => setShowAllFollowed(false)}
                >
                  <Text style={styles.followedCloseText}>Kapat</Text>
                </Pressable>
              </View>

              <ScrollView
                contentContainerStyle={styles.followedModalList}
                showsVerticalScrollIndicator={false}
              >
                <Pressable
                  style={styles.followedFilterToggle}
                  onPress={() => setShowFollowedFilters((prev) => !prev)}
                >
                  <View style={styles.followedFilterToggleLeft}>
                    <Ionicons name="filter" size={16} color="#1D4ED8" />
                    <Text style={styles.followedFilterToggleText}>Filtrele</Text>
                    {(followedStatusFilter !== "all" ||
                      followedCategoryFilter !== "all" ||
                      followedDateFilter !== "all") && (
                      <View style={styles.followedFilterBadge}>
                        <Text style={styles.followedFilterBadgeText}>
                          {
                            [followedStatusFilter, followedCategoryFilter, followedDateFilter].filter(
                              (value) => value !== "all"
                            ).length
                          }
                        </Text>
                      </View>
                    )}
                  </View>
                  <Ionicons
                    name={showFollowedFilters ? "chevron-up" : "chevron-down"}
                    size={18}
                    color="#64748B"
                  />
                </Pressable>

                {showFollowedFilters && (
                  <View style={styles.followedFilterPanel}>
                    <Text style={styles.followedFilterLabel}>Durum</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={styles.followedFilterRow}
                      contentContainerStyle={styles.followedFilterRowContent}
                    >
                      {[
                        { key: "all", label: "Tümü" },
                        ...Object.entries(statusLabels).map(([key, label]) => ({ key, label })),
                      ].map(({ key, label }) => (
                        <Pressable
                          key={key}
                          style={[
                            styles.followedFilterChip,
                            followedStatusFilter === key && styles.followedFilterChipActive,
                          ]}
                          onPress={() => setFollowedStatusFilter(key)}
                        >
                          <Text
                            style={[
                              styles.followedFilterChipText,
                              followedStatusFilter === key && styles.followedFilterChipTextActive,
                            ]}
                          >
                            {label}
                          </Text>
                        </Pressable>
                      ))}
                    </ScrollView>

                    <Text style={styles.followedFilterLabel}>Kategori</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={styles.followedFilterRow}
                      contentContainerStyle={styles.followedFilterRowContent}
                    >
                      {[
                        { key: "all", label: "Tümü" },
                        ...Object.entries(categoryLabels).map(([key, label]) => ({ key, label })),
                      ].map(({ key, label }) => (
                        <Pressable
                          key={key}
                          style={[
                            styles.followedFilterChip,
                            followedCategoryFilter === key && styles.followedFilterChipActive,
                          ]}
                          onPress={() => setFollowedCategoryFilter(key)}
                        >
                          <Text
                            style={[
                              styles.followedFilterChipText,
                              followedCategoryFilter === key && styles.followedFilterChipTextActive,
                            ]}
                          >
                            {label}
                          </Text>
                        </Pressable>
                      ))}
                    </ScrollView>

                    <Text style={styles.followedFilterLabel}>Tarih</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={styles.followedFilterRow}
                      contentContainerStyle={styles.followedFilterRowContent}
                    >
                      {[
                        { key: "all", label: "Tümü" },
                        { key: "today", label: "Bugün" },
                        { key: "week", label: "Bu Hafta" },
                        { key: "month", label: "Bu Ay" },
                      ].map(({ key, label }) => (
                        <Pressable
                          key={key}
                          style={[
                            styles.followedFilterChip,
                            followedDateFilter === key && styles.followedFilterChipActive,
                          ]}
                          onPress={() => setFollowedDateFilter(key)}
                        >
                          <Text
                            style={[
                              styles.followedFilterChipText,
                              followedDateFilter === key && styles.followedFilterChipTextActive,
                            ]}
                          >
                            {label}
                          </Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {followedReports
                  .filter((report) => followedStatusFilter === "all" || report.status === followedStatusFilter)
                  .filter((report) => followedCategoryFilter === "all" || report.category === followedCategoryFilter)
                  .filter((report) => matchesDateFilter(report, followedDateFilter))
                  .map((report) => (
                  <View key={report.id} style={styles.reportCard}>
                    <Pressable
                      onPress={() => {
                        setShowAllFollowed(false);
                        router.push({ pathname: "/(tabs)/home" });
                      }}
                    >
                      <View style={styles.reportHeader}>
                        <Text style={styles.reportTitle} numberOfLines={1}>
                          {report.title}
                        </Text>
                        <Text style={styles.reportStatus}>
                          {statusLabels[report.status] || report.status}
                        </Text>
                      </View>
                      <Text style={styles.reportMeta}>
                        {report.city || "Konum bilinmiyor"} • {report.follower_count || 0} takip
                      </Text>
                    </Pressable>

                    <Pressable
                      style={styles.unfollowButton}
                      disabled={unfollowingId === report.id}
                      onPress={() => handleUnfollowReport(report)}
                    >
                      {unfollowingId === report.id ? (
                        <ActivityIndicator size="small" color="#DC2626" />
                      ) : (
                        <Text style={styles.unfollowButtonText}>Takibi Bırak</Text>
                      )}
                    </Pressable>
                  </View>
                ))}
              </ScrollView>
            </SafeAreaView>
          </Modal>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ayarlar</Text>

            <Pressable
              style={styles.settingRow}
              onPress={() => setShowNotificationSettings(true)}
            >
              <View style={styles.settingTextWrap}>
                <Text style={styles.settingLabel}>Bildirim Ayarları</Text>
                <Text style={styles.settingHint}>
                  Anlık, yakınlık ve e-posta bildirim tercihlerinizi yönetin
                </Text>
              </View>
            </Pressable>

            <Pressable style={styles.settingRow} onPress={handleEditEmail}>
              <View style={styles.settingTextWrap}>
                <Text style={styles.settingLabel}>E-posta ve Şifre Ayarları</Text>
                <Text style={styles.settingHint}>{auth.user.email}</Text>
              </View>
            </Pressable>
          </View>

          <View style={styles.section}>
            <Pressable
              style={styles.settingRow}
              onPress={() => setShowAccountInfo(true)}
            >
              <View style={styles.settingTextWrap}>
                <Text style={styles.settingLabel}>Hesap Bilgisi</Text>
                <Text style={styles.settingHint}>Rol ve e-posta durumunuzu görüntüleyin</Text>
              </View>
            </Pressable>
          </View>

          <Modal
            visible={showAccountInfo}
            animationType="fade"
            transparent
            onRequestClose={() => setShowAccountInfo(false)}
          >
            <View style={styles.centeredModalOverlay}>
              <View style={styles.centeredModalCard}>
                <View style={styles.followedModalHeader}>
                  <Text style={styles.followedModalTitle}>Hesap Bilgisi</Text>
                  <Pressable
                    style={styles.followedCloseButton}
                    onPress={() => setShowAccountInfo(false)}
                  >
                    <Text style={styles.followedCloseText}>Kapat</Text>
                  </Pressable>
                </View>

                <ScrollView
                  contentContainerStyle={styles.followedModalList}
                  showsVerticalScrollIndicator={false}
                >
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Rol</Text>
                    <Text style={styles.infoValue}>
                      {roleLabels[auth.user.role] || auth.user.role}
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>E-posta durumu</Text>
                    <Text style={styles.infoValue}>
                      {auth.user.email_verified ? "Doğrulandı" : "Doğrulanmadı"}
                    </Text>
                  </View>
                </ScrollView>
              </View>
            </View>
          </Modal>

          <Modal
            visible={showEmailSettings}
            animationType="fade"
            transparent
            onRequestClose={closeEmailSettings}
          >
            <View style={styles.centeredModalOverlay}>
              <View style={styles.centeredModalCard}>
                <View style={styles.followedModalHeader}>
                  {emailSettingsView === "menu" ? (
                    <Text style={styles.followedModalTitle}>E-posta ve Şifre Ayarları</Text>
                  ) : (
                    <Pressable
                      style={styles.backButton}
                      onPress={() => setEmailSettingsView("menu")}
                    >
                      <Ionicons name="chevron-back" size={20} color="#1D4ED8" />
                      <Text style={styles.backButtonText}>Geri</Text>
                    </Pressable>
                  )}
                  <Pressable
                    style={styles.followedCloseButton}
                    onPress={closeEmailSettings}
                  >
                    <Text style={styles.followedCloseText}>Kapat</Text>
                  </Pressable>
                </View>

                <ScrollView
                  contentContainerStyle={styles.followedModalList}
                  showsVerticalScrollIndicator={false}
                >
                {emailSettingsView === "menu" && (
                  <>
                    <Pressable
                      style={styles.settingRow}
                      onPress={() => setEmailSettingsView("email")}
                    >
                      <View style={styles.settingTextWrap}>
                        <Text style={styles.settingLabel}>E-posta Değiştir</Text>
                        <Text style={styles.settingHint}>{auth.user.email}</Text>
                      </View>
                    </Pressable>

                    <Pressable
                      style={styles.settingRow}
                      onPress={() => setEmailSettingsView("password")}
                    >
                      <View style={styles.settingTextWrap}>
                        <Text style={styles.settingLabel}>Şifre Değiştir</Text>
                        <Text style={styles.settingHint}>Hesap şifrenizi güncelleyin</Text>
                      </View>
                    </Pressable>
                  </>
                )}

                {emailSettingsView === "email" && (
                  <>
                    <Text style={styles.settingGroupTitle}>E-posta</Text>
                    <Text style={styles.inputLabel}>E-posta</Text>
                    <TextInput
                      value={draftEmail}
                      onChangeText={setDraftEmail}
                      style={styles.input}
                      placeholder="ornek@email.com"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      placeholderTextColor="#94A3B8"
                    />

                    <View style={styles.editActions}>
                      <Pressable
                        style={[styles.secondaryAction, styles.cancelAction]}
                        onPress={() => {
                          setDraftEmail(auth.user.email);
                          setEmailSettingsView("menu");
                        }}
                      >
                        <Text style={styles.secondaryActionText}>İptal</Text>
                      </Pressable>

                      <Pressable style={styles.primaryAction} onPress={handleSaveEmail} disabled={savingEmail}>
                        {savingEmail ? <ActivityIndicator color="white" /> : <Text style={styles.primaryActionText}>Kod Gönder</Text>}
                      </Pressable>
                    </View>
                  </>
                )}

                {emailSettingsView === "email-code" && (
                  <>
                    <Text style={styles.settingGroupTitle}>E-posta Doğrulama</Text>
                    <Text style={styles.settingHint}>
                      {pendingNewEmail} adresine gönderilen 6 haneli kodu girin.
                    </Text>

                    <Text style={styles.inputLabel}>Doğrulama Kodu</Text>
                    <TextInput
                      value={emailChangeCode}
                      onChangeText={setEmailChangeCode}
                      style={styles.input}
                      placeholder="123456"
                      keyboardType="number-pad"
                      maxLength={6}
                      placeholderTextColor="#94A3B8"
                    />

                    <Text style={styles.emailCodeTimerText}>
                      {emailCodeSecondsLeft > 0
                        ? `Kod ${Math.floor(emailCodeSecondsLeft / 60)}:${String(emailCodeSecondsLeft % 60).padStart(2, "0")} içinde geçersiz olacak`
                        : "Kodun süresi doldu"}
                    </Text>

                    <View style={styles.editActions}>
                      <Pressable
                        style={[styles.secondaryAction, styles.cancelAction]}
                        onPress={() => {
                          setPendingNewEmail("");
                          setEmailChangeCode("");
                          setEmailSettingsView("menu");
                        }}
                      >
                        <Text style={styles.secondaryActionText}>İptal</Text>
                      </Pressable>

                      <Pressable
                        style={styles.primaryAction}
                        onPress={handleConfirmEmailChange}
                        disabled={confirmingEmailChange}
                      >
                        {confirmingEmailChange ? (
                          <ActivityIndicator color="white" />
                        ) : (
                          <Text style={styles.primaryActionText}>Doğrula</Text>
                        )}
                      </Pressable>
                    </View>

                    <Pressable onPress={handleResendEmailChangeCode} disabled={resendingEmailCode}>
                      <Text style={styles.emailCodeResendText}>
                        {resendingEmailCode ? "Gönderiliyor..." : "Kodu tekrar gönder"}
                      </Text>
                    </Pressable>
                  </>
                )}

                {emailSettingsView === "password" && (
                  <>
                    <Text style={styles.settingGroupTitle}>Şifre</Text>
                    <Text style={styles.inputLabel}>Mevcut Şifre</Text>
                    <View style={styles.passwordContainer}>
                      <TextInput
                        value={draftCurrentPassword}
                        onChangeText={setDraftCurrentPassword}
                        style={[styles.input, styles.passwordInput]}
                        placeholder="Mevcut şifreniz"
                        secureTextEntry={!showCurrentPassword}
                        autoCapitalize="none"
                        placeholderTextColor="#94A3B8"
                      />
                      <Pressable
                        accessibilityLabel={showCurrentPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                        style={styles.toggleButton}
                        onPress={() => setShowCurrentPassword((prev) => !prev)}
                      >
                        <Ionicons
                          name={showCurrentPassword ? "eye-off" : "eye"}
                          size={20}
                          color="#64748B"
                        />
                      </Pressable>
                    </View>

                    <Text style={styles.inputLabel}>Yeni Şifre</Text>
                    <View style={styles.passwordContainer}>
                      <TextInput
                        value={draftNewPassword}
                        onChangeText={setDraftNewPassword}
                        style={[styles.input, styles.passwordInput]}
                        placeholder="Yeni şifreniz"
                        secureTextEntry={!showNewPassword}
                        autoCapitalize="none"
                        placeholderTextColor="#94A3B8"
                      />
                      <Pressable
                        accessibilityLabel={showNewPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                        style={styles.toggleButton}
                        onPress={() => setShowNewPassword((prev) => !prev)}
                      >
                        <Ionicons
                          name={showNewPassword ? "eye-off" : "eye"}
                          size={20}
                          color="#64748B"
                        />
                      </Pressable>
                    </View>

                    <Text style={styles.inputLabel}>Yeni Şifre (Tekrar)</Text>
                    <View style={styles.passwordContainer}>
                      <TextInput
                        value={draftConfirmPassword}
                        onChangeText={setDraftConfirmPassword}
                        style={[styles.input, styles.passwordInput]}
                        placeholder="Yeni şifrenizi tekrar girin"
                        secureTextEntry={!showConfirmPassword}
                        autoCapitalize="none"
                        placeholderTextColor="#94A3B8"
                      />
                      <Pressable
                        accessibilityLabel={showConfirmPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                        style={styles.toggleButton}
                        onPress={() => setShowConfirmPassword((prev) => !prev)}
                      >
                        <Ionicons
                          name={showConfirmPassword ? "eye-off" : "eye"}
                          size={20}
                          color="#64748B"
                        />
                      </Pressable>
                    </View>

                    <View style={styles.editActions}>
                      <Pressable
                        style={[styles.secondaryAction, styles.cancelAction]}
                        onPress={() => {
                          setDraftCurrentPassword("");
                          setDraftNewPassword("");
                          setDraftConfirmPassword("");
                          setEmailSettingsView("menu");
                        }}
                      >
                        <Text style={styles.secondaryActionText}>İptal</Text>
                      </Pressable>

                      <Pressable style={styles.primaryAction} onPress={handleSavePassword} disabled={savingPassword}>
                        {savingPassword ? <ActivityIndicator color="white" /> : <Text style={styles.primaryActionText}>Kaydet</Text>}
                      </Pressable>
                    </View>
                  </>
                )}
                </ScrollView>
              </View>
            </View>
          </Modal>

          <Modal
            visible={showNotificationSettings}
            animationType="fade"
            transparent
            onRequestClose={() => setShowNotificationSettings(false)}
          >
            <View style={styles.centeredModalOverlay}>
              <View style={styles.centeredModalCard}>
                <View style={styles.followedModalHeader}>
                  <Text style={styles.followedModalTitle}>Bildirim Ayarları</Text>
                  <Pressable
                    style={styles.followedCloseButton}
                    onPress={() => setShowNotificationSettings(false)}
                  >
                    <Text style={styles.followedCloseText}>Kapat</Text>
                  </Pressable>
                </View>

                <ScrollView
                  contentContainerStyle={styles.followedModalList}
                  showsVerticalScrollIndicator={false}
                >
                  <Text style={styles.settingGroupTitle}>Bildirimler</Text>
                  {[
                    {
                      key: "push_notifications",
                      label: "Anlık bildirimler",
                      hint: "Takip ettiğiniz sorunların durum güncellemeleri",
                    },
                    {
                      key: "location_notifications",
                      label: "Yakındaki sorunlar",
                      hint: "Konumunuza yakın yeni sorunlar için uyarılar",
                    },
                  ].map(({ key, label, hint }) => {
                    const isEnabled = settings[key as keyof typeof settings];

                    return (
                      <Pressable
                        key={key}
                        style={styles.settingRow}
                        onPress={() => toggleSetting(key as keyof typeof settings)}
                      >
                        <View style={styles.settingTextWrap}>
                          <Text style={styles.settingLabel}>{label}</Text>
                          <Text style={styles.settingHint}>{hint}</Text>
                        </View>

                        <View style={[styles.toggle, isEnabled && styles.toggleActive]}>
                          <View
                            style={[styles.toggleThumb, isEnabled && styles.toggleThumbActive]}
                          />
                        </View>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            </View>
          </Modal>

          <Pressable
            style={styles.logoutButton}
            onPress={handleLogout}
            disabled={deleting}
          >
            <Text style={styles.logoutButtonText}>Çıkış Yap</Text>
          </Pressable>

          <Pressable
            style={styles.deleteButton}
            onPress={handleDeleteAccount}
            disabled={deleting}
          >
            {deleting ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.deleteButtonText}>Hesabı Sil</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollContent: {
    paddingBottom: 30,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
    padding: 24,
  },
  panel: {
    flex: 1,
    padding: 24,
  },
  guestPanel: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E8EBF0",
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignSelf: "stretch",
  },
  title: {
    color: "#0F172A",
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    color: "#475569",
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
    textAlign: "center",
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  editButton: {
    alignItems: "center",
    backgroundColor: "#E0F2FE",
    borderRadius: 10,
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  editButtonText: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "700",
  },
  editCard: {
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 18,
    padding: 16,
  },
  inputLabel: {
    color: "#475569",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: "white",
    borderColor: "#CBD5E1",
    borderRadius: 10,
    borderWidth: 1,
    color: "#0F172A",
    fontSize: 15,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  editActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },
  secondaryAction: {
    alignItems: "center",
    borderRadius: 10,
    flex: 1,
    paddingVertical: 12,
  },
  cancelAction: {
    backgroundColor: "#E2E8F0",
  },
  secondaryActionText: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "700",
  },
  primaryAction: {
    alignItems: "center",
    backgroundColor: "#2563EB",
    borderRadius: 10,
    flex: 1,
    paddingVertical: 12,
  },
  primaryActionText: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
  },
  avatar: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "#DBEAFE",
    borderRadius: 36,
    height: 72,
    justifyContent: "center",
    marginBottom: 16,
    width: 72,
  },
  avatarText: {
    color: "#1D4ED8",
    fontSize: 30,
    fontWeight: "800",
  },
  avatarImage: {
    borderRadius: 36,
    height: 72,
    width: 72,
  },
  photoEditRow: {
    alignItems: "center",
    flexDirection: "row",
    marginBottom: 8,
  },
  editAvatar: {
    alignItems: "center",
    backgroundColor: "#DBEAFE",
    borderRadius: 32,
    height: 64,
    justifyContent: "center",
    overflow: "hidden",
    width: 64,
  },
  editAvatarImage: {
    height: 64,
    width: 64,
  },
  editAvatarText: {
    color: "#1D4ED8",
    fontSize: 24,
    fontWeight: "800",
  },
  photoActions: {
    flex: 1,
    marginLeft: 14,
  },
  photoButton: {
    alignSelf: "flex-start",
    backgroundColor: "#E0F2FE",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  photoButtonText: {
    color: "#0F172A",
    fontSize: 13,
    fontWeight: "700",
  },
  removePhotoText: {
    color: "#DC2626",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 8,
  },
  name: {
    color: "#0F172A",
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
  },
  email: {
    color: "#475569",
    fontSize: 15,
    marginTop: 4,
    textAlign: "center",
  },
  infoRow: {
    alignItems: "center",
    backgroundColor: "white",
    borderColor: "#E2E8F0",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    padding: 14,
  },
  infoLabel: {
    color: "#64748B",
    fontWeight: "700",
  },
  infoValue: {
    color: "#0F172A",
    fontWeight: "800",
  },
  section: {
    backgroundColor: "white",
    borderColor: "#E2E8F0",
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 18,
    padding: 16,
  },
  sectionTitle: {
    color: "#0F172A",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 12,
  },
  followedHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  followedCount: {
    backgroundColor: "#DBEAFE",
    borderRadius: 999,
    color: "#1D4ED8",
    fontSize: 14,
    fontWeight: "800",
    minWidth: 30,
    overflow: "hidden",
    paddingHorizontal: 9,
    paddingVertical: 4,
    textAlign: "center",
  },
  followedModal: {
    backgroundColor: "#F8FAFC",
    flex: 1,
    padding: 24,
  },
  centeredModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  centeredModalCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 20,
    padding: 20,
    width: "100%",
    maxWidth: 440,
    maxHeight: "80%",
  },
  followedModalHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  followedModalTitle: {
    color: "#0F172A",
    flex: 1,
    fontSize: 22,
    fontWeight: "800",
    marginRight: 12,
  },
  followedCloseButton: {
    backgroundColor: "#E2E8F0",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  followedCloseText: {
    color: "#0F172A",
    fontSize: 13,
    fontWeight: "800",
  },
  backButton: {
    alignItems: "center",
    flexDirection: "row",
    flex: 1,
  },
  backButtonText: {
    color: "#1D4ED8",
    fontSize: 15,
    fontWeight: "700",
    marginLeft: 2,
  },
  emailCodeTimerText: {
    color: "#475569",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 4,
  },
  emailCodeResendText: {
    color: "#2563EB",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 14,
    textAlign: "center",
  },
  passwordContainer: {
    justifyContent: "center",
    marginBottom: 0,
    width: "100%",
  },
  passwordInput: {
    paddingRight: 48,
  },
  toggleButton: {
    alignItems: "center",
    height: 44,
    justifyContent: "center",
    position: "absolute",
    right: 4,
    width: 40,
  },
  followedModalList: {
    paddingBottom: 24,
  },
  followedFilterToggle: {
    alignItems: "center",
    backgroundColor: "white",
    borderColor: "#E2E8F0",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  followedFilterToggleLeft: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  followedFilterToggleText: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "700",
  },
  followedFilterBadge: {
    alignItems: "center",
    backgroundColor: "#2563EB",
    borderRadius: 999,
    justifyContent: "center",
    minWidth: 20,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  followedFilterBadgeText: {
    color: "white",
    fontSize: 11,
    fontWeight: "800",
  },
  followedFilterPanel: {
    marginBottom: 4,
  },
  followedFilterLabel: {
    color: "#0F172A",
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 8,
  },
  followedFilterRow: {
    marginBottom: 14,
  },
  followedFilterRowContent: {
    gap: 8,
    paddingRight: 8,
  },
  followedFilterChip: {
    backgroundColor: "white",
    borderColor: "#E2E8F0",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  followedFilterChipActive: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },
  followedFilterChipText: {
    color: "#475569",
    fontSize: 13,
    fontWeight: "700",
  },
  followedFilterChipTextActive: {
    color: "white",
  },
  unfollowButton: {
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    borderRadius: 10,
    marginTop: 10,
    paddingVertical: 10,
  },
  unfollowButtonText: {
    color: "#DC2626",
    fontSize: 13,
    fontWeight: "700",
  },
  settingGroupTitle: {
    color: "#2563EB",
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 2,
    textTransform: "uppercase",
  },
  loadingBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  emptyBox: {
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  emptyTitle: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 6,
  },
  emptyText: {
    color: "#64748B",
    fontSize: 13,
    lineHeight: 18,
  },
  reportCard: {
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    padding: 12,
  },
  reportHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  reportTitle: {
    color: "#0F172A",
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    marginRight: 10,
  },
  reportStatus: {
    color: "#2563EB",
    fontSize: 11,
    fontWeight: "700",
  },
  reportMeta: {
    color: "#64748B",
    fontSize: 12,
  },
  settingRow: {
    alignItems: "center",
    borderColor: "#E2E8F0",
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  settingTextWrap: {
    flex: 1,
    marginRight: 12,
  },
  settingLabel: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "700",
  },
  settingHint: {
    color: "#64748B",
    fontSize: 12,
    marginTop: 2,
  },
  toggle: {
    alignItems: "center",
    backgroundColor: "#CBD5E1",
    borderRadius: 999,
    height: 28,
    justifyContent: "center",
    paddingHorizontal: 2,
    width: 50,
  },
  toggleActive: {
    backgroundColor: "#2563EB",
  },
  toggleDisabled: {
    opacity: 0.55,
  },
  toggleThumb: {
    backgroundColor: "white",
    borderRadius: 999,
    height: 22,
    marginLeft: -12,
    width: 22,
  },
  toggleThumbActive: {
    marginLeft: 12,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#2563EB",
    borderRadius: 12,
    paddingVertical: 15,
  },
  primaryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "800",
  },
  secondaryButton: {
    alignItems: "center",
    borderColor: "#2563EB",
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 12,
    paddingVertical: 15,
  },
  secondaryButtonText: {
    color: "#2563EB",
    fontSize: 16,
    fontWeight: "800",
  },
  logoutButton: {
    alignItems: "center",
    backgroundColor: "#DC2626",
    borderRadius: 12,
    marginTop: 18,
    paddingVertical: 15,
  },
  logoutButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "800",
  },
  deleteButton: {
    alignItems: "center",
    backgroundColor: "#7F1D1D",
    borderRadius: 12,
    marginTop: 12,
    paddingVertical: 14,
  },
  deleteButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "800",
  },
});
