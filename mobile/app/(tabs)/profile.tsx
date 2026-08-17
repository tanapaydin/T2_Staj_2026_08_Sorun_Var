import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { AuthResponse, clearAuthData, getAuthData } from "../../lib/auth";

export default function ProfileScreen() {
  const router = useRouter();
  const [auth, setAuth] = useState<AuthResponse | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    getAuthData()
      .then(setAuth)
      .finally(() => setCheckingAuth(false));
  }, []);

  const handleLogout = async () => {
    await clearAuthData();
    router.replace("/");
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
      <View style={styles.panel}>
        <Text style={styles.title}>Profil</Text>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {auth.user.name.trim().charAt(0).toUpperCase()}
          </Text>
        </View>

        <Text style={styles.name}>{auth.user.name}</Text>
        <Text style={styles.email}>{auth.user.email}</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Rol</Text>
          <Text style={styles.infoValue}>{auth.user.role}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>E-posta durumu</Text>
          <Text style={styles.infoValue}>
            {auth.user.email_verified ? "Doğrulandı" : "Doğrulanmadı"}
          </Text>
        </View>

        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Çıkış Yap</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
  },
  panel: {
    flex: 1,
    justifyContent: "center",
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
    marginBottom: 24,
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
});
