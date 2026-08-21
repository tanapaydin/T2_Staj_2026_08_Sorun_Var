import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import AuthBackground from "../../components/auth/AuthBackground";
import { useLocalSearchParams, useRouter } from "expo-router";
import { resendVerificationCode, verifyEmail } from "../../lib/auth";

const CODE_EXPIRY_SECONDS = 3 * 60;

export default function VerifyEmailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const email = params.email ?? "";

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(CODE_EXPIRY_SECONDS);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  const formattedTime = `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, "0")}`;

  const handleVerify = async () => {
    const trimmedCode = code.trim();

    if (!email) {
      Alert.alert("Hata", "E-posta bilgisi bulunamadı.");
      return;
    }

    if (!trimmedCode) {
      Alert.alert("Hata", "Lütfen doğrulama kodunu girin.");
      return;
    }

    setLoading(true);
    try {
      await verifyEmail(email, trimmedCode);
      router.replace("/(tabs)/map");
    } catch (error) {
      Alert.alert("Doğrulama Başarısız", error instanceof Error ? error.message : "Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      Alert.alert("Hata", "E-posta bilgisi bulunamadı.");
      return;
    }

    setResending(true);
    try {
      await resendVerificationCode(email);
      setSecondsLeft(CODE_EXPIRY_SECONDS);
      setCode("");
      Alert.alert("Kod Gönderildi", "Yeni doğrulama kodu e-posta adresinize gönderildi.");
    } catch (error) {
      Alert.alert("Hata", error instanceof Error ? error.message : "Kod tekrar gönderilemedi.");
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthBackground>
      <View style={styles.form}>
        <Text style={styles.title}>E-postanı Doğrula</Text>
        <Text style={styles.subtitle}>
          {email} adresine gönderilen 6 haneli kodu girin.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Doğrulama Kodu"
          placeholderTextColor="#334155"
          keyboardType="number-pad"
          maxLength={6}
          value={code}
          onChangeText={setCode}
        />

        <Text style={styles.timerText}>
          {secondsLeft > 0 ? `Kod ${formattedTime} içinde geçersiz olacak` : "Kodun süresi doldu"}
        </Text>

        <Pressable style={styles.button} onPress={handleVerify} disabled={loading}>
          {loading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Doğrula</Text>}
        </Pressable>

        <Pressable onPress={handleResend} disabled={resending}>
          <Text style={styles.linkText}>
            {resending ? "Gönderiliyor..." : "Kodu tekrar gönder"}
          </Text>
        </Pressable>

        <Pressable onPress={() => router.replace("/(auth)/login")}>
          <Text style={styles.guestText}>Giriş ekranına dön</Text>
        </Pressable>
      </View>
    </AuthBackground>
  );
}

const styles = StyleSheet.create({
  form: {
    width: "100%",
    maxWidth: 420,
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#1D4ED8",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#172033",
    fontWeight: "600",
    marginBottom: 28,
    textAlign: "center",
  },
  input: {
    width: "100%",
    backgroundColor: "#DBEAFE",
    borderColor: "#93C5FD",
    borderWidth: 2,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    color: "#0F172A",
    textAlign: "center",
    fontSize: 20,
    letterSpacing: 6,
  },
  timerText: {
    color: "#475569",
    fontWeight: "700",
    marginBottom: 20,
    textAlign: "center",
  },
  button: {
    width: "100%",
    backgroundColor: "#1D4ED8",
    borderColor: "#000000",
    borderWidth: 2,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 18,
  },
  buttonText: {
    color: "white",
    fontWeight: "800",
    fontSize: 16,
  },
  linkText: {
    color: "#2563EB",
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
  },
  guestText: {
    color: "#000000",
    fontWeight: "800",
    textAlign: "center",
  },
});
