import { View, Text, Pressable, StyleSheet, SafeAreaView } from "react-native";
import { useRouter } from "expo-router";

export default function Index() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Sorun Var</Text>
      <Text style={styles.subtitle}>Şikayetlerinizi hızlıca bildirin ve takip edin.</Text>

      <Pressable style={styles.primaryButton} onPress={() => router.push("/(auth)/login")}> 
        <Text style={styles.buttonText}>Giriş Yap</Text>
      </Pressable>

      <Pressable style={styles.secondaryButton} onPress={() => router.push("/(auth)/register")}> 
        <Text style={styles.secondaryButtonText}>Kayıt Ol</Text>
      </Pressable>

      <Pressable style={styles.guestButton} onPress={() => router.push("/(tabs)/map")}> 
        <Text style={styles.guestButtonText}>Misafir Olarak Devam Et</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#F8FAFC",
  },
  title: {
    fontSize: 36,
    fontWeight: "800",
    color: "#1D4ED8",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#475569",
    textAlign: "center",
    marginBottom: 32,
    maxWidth: 320,
  },
  primaryButton: {
    width: "100%",
    backgroundColor: "#1D4ED8",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  secondaryButton: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#1D4ED8",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  guestButton: {
    width: "100%",
    backgroundColor: "#E2E8F0",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },
  secondaryButtonText: {
    color: "#1D4ED8",
    fontWeight: "700",
    fontSize: 16,
  },
  guestButtonText: {
    color: "#475569",
    fontWeight: "700",
    fontSize: 16,
  },
});
