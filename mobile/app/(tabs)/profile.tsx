import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { AuthResponse, clearAuthData, getAuthData } from "../../lib/auth";
import { fetchFollowedReports } from "../../lib/api";
import { Report } from "../../types/report";
import { statusLabels } from "../../constants/report";

const PROFILE_SETTINGS_KEY = "SORUN_VAR_PROFILE_SETTINGS";

const roleLabels: Record<string, string> = {
  citizen: "Vatandaş",
  municipality: "Belediye",
  admin: "Yönetici",
};

type ProfileSettings = {
  notifications: boolean;
  emailUpdates: boolean;
  locationAlerts: boolean;
  privateProfile: boolean;
};

export default function ProfileScreen() {
  const router = useRouter();
  const [auth, setAuth] = useState<AuthResponse | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [followedReports, setFollowedReports] = useState<Report[]>([]);
  const [loadingFollowed, setLoadingFollowed] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftEmail, setDraftEmail] = useState("");
  const [settings, setSettings] = useState<ProfileSettings>({
    notifications: true,
    emailUpdates: true,
    locationAlerts: false,
    privateProfile: true,
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const rawSettings = await AsyncStorage.getItem(PROFILE_SETTINGS_KEY);
        if (rawSettings) {
          const savedSettings = JSON.parse(rawSettings) as Partial<ProfileSettings>;
          setSettings((current) => ({ ...current, ...savedSettings }));
        }
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
          loadSettings();
          return;
        }

        setFollowedReports([]);
        setLoadingFollowed(false);
      })
      .finally(() => setCheckingAuth(false));
  }, []);

  const handleLogout = async () => {
    await clearAuthData();
    setAuth(null);
    setFollowedReports([]);
    router.replace("/");
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
              setAuth(null);
              router.replace("/");
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

  const toggleSetting = (key: keyof ProfileSettings) => {
    setSettings((current) => {
      const nextValue = {
        ...current,
        [key]: !current[key],
      };

      AsyncStorage.setItem(PROFILE_SETTINGS_KEY, JSON.stringify(nextValue)).catch(
        (error) => console.log("SAVE PROFILE SETTINGS ERROR:", error)
      );

      return nextValue;
    });
  };

  const initials = auth?.user?.name?.trim()?.charAt(0)?.toUpperCase() || "U";

  const handleEditProfile = () => {
    if (!auth) return;
    setDraftName(auth.user.name);
    setDraftEmail(auth.user.email);
    setIsEditingProfile(true);
  };

  const handleSaveProfile = async () => {
    if (!auth) return;

    const nextName = draftName.trim();
    const nextEmail = draftEmail.trim();

    if (!nextName) {
      Alert.alert("Hata", "Ad alanı boş olamaz.");
      return;
    }

    if (!nextEmail) {
      Alert.alert("Hata", "E-posta alanı boş olamaz.");
      return;
    }

    const updatedAuth = {
      ...auth,
      user: {
        ...auth.user,
        name: nextName,
        email: nextEmail,
      },
    };

    await AsyncStorage.setItem("SORUN_VAR_AUTH", JSON.stringify(updatedAuth));
    setAuth(updatedAuth);
    setIsEditingProfile(false);
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
      <SafeAreaView style={styles.container}>
        <View style={styles.panel}>
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
          <Text style={styles.title}>Profil</Text>

          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>

            <Text style={styles.name}>{auth.user.name}</Text>
            <Text style={styles.email}>{auth.user.email}</Text>

            {!isEditingProfile && (
              <Pressable style={styles.editButton} onPress={handleEditProfile}>
                <Text style={styles.editButtonText}>Profili Düzenle</Text>
              </Pressable>
            )}
          </View>

          {isEditingProfile && (
            <View style={styles.editCard}>
              <Text style={styles.sectionTitle}>Profili Güncelle</Text>

              <Text style={styles.inputLabel}>Ad Soyad</Text>
              <TextInput
                value={draftName}
                onChangeText={setDraftName}
                style={styles.input}
                placeholder="Adınız"
                placeholderTextColor="#94A3B8"
              />

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
                  onPress={() => setIsEditingProfile(false)}
                >
                  <Text style={styles.secondaryActionText}>İptal</Text>
                </Pressable>

                <Pressable style={styles.primaryAction} onPress={handleSaveProfile}>
                  <Text style={styles.primaryActionText}>Kaydet</Text>
                </Pressable>
              </View>
            </View>
          )}

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

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Takip edilen problemler</Text>

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
              followedReports.slice(0, 4).map((report) => (
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

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ayarlar</Text>

            {[
              {
                key: "notifications",
                label: "Bildirimler",
                hint: "Cihazda kaydedilir; anlık bildirimler henüz etkin değil",
              },
              {
                key: "emailUpdates",
                label: "E-posta güncellemeleri",
                hint: "Cihazda kaydedilir; e-posta gönderimi henüz etkin değil",
              },
              {
                key: "locationAlerts",
                label: "Konum bildirimleri",
                hint: "Cihazda kaydedilir; yakın sorun uyarıları henüz etkin değil",
              },
              {
                key: "privateProfile",
                label: "Gizlilik modu",
                hint: "Cihazda kaydedilir; profil görünürlüğü henüz değişmiyor",
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
          </View>

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
  },
  panel: {
    flex: 1,
    padding: 24,
  },
  title: {
    color: "#0F172A",
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 8,
  },
  subtitle: {
    color: "#475569",
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
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
