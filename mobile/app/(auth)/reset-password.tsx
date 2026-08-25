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
import { Ionicons } from "@expo/vector-icons";
import { forgotPassword, resetPassword } from "../../lib/auth";

const CODE_EXPIRY_SECONDS = 3 * 60;

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const email = params.email ?? "";

  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

  const handleSubmit = async () => {
    const trimmedCode = code.trim();

    if (!email) {
      Alert.alert("Hata", "E-posta bilgisi bulunamadı.");
      return;
    }

    if (!trimmedCode) {
      Alert.alert("Hata", "Lütfen doğrulama kodunu girin.");
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

    setLoading(true);
    try {
      await resetPassword(email, trimmedCode, newPassword);
      Alert.alert("Başarılı", "Şifreniz güncellendi. Şimdi giriş yapabilirsiniz.");
      router.replace("/(auth)/login");
    } catch (error) {
      Alert.alert("Hata", error instanceof Error ? error.message : "Bir hata oluştu.");
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
      await forgotPassword(email);
      setSecondsLeft(CODE_EXPIRY_SECONDS);
      setCode("");
      Alert.alert("Kod Gönderildi", "Yeni şifre sıfırlama kodu e-posta adresinize gönderildi.");
    } catch (error) {
      Alert.alert("Hata", error instanceof Error ? error.message : "Kod tekrar gönderilemedi.");
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthBackground>
      <View style={styles.form}>
        <Text style={styles.title}>Şifreni Sıfırla</Text>
        <Text style={styles.subtitle}>
          {email} adresine gönderilen kodu ve yeni şifrenizi girin.
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

        <View style={styles.passwordContainer}>
          <TextInput
            style={[styles.input, styles.passwordInput]}
            placeholder="Yeni Şifre"
            placeholderTextColor="#334155"
            secureTextEntry={!showNewPassword}
            autoCapitalize="none"
            value={newPassword}
            onChangeText={setNewPassword}
          />
          <Pressable
            accessibilityLabel={showNewPassword ? "Şifreyi gizle" : "Şifreyi göster"}
            style={styles.toggleButton}
            onPress={() => setShowNewPassword((prev) => !prev)}
          >
            <Ionicons name={showNewPassword ? "eye-off" : "eye"} size={22} color="#64748B" />
          </Pressable>
        </View>

        <View style={styles.passwordContainer}>
          <TextInput
            style={[styles.input, styles.passwordInput]}
            placeholder="Yeni Şifre (Tekrar)"
            placeholderTextColor="#334155"
            secureTextEntry={!showConfirmPassword}
            autoCapitalize="none"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          <Pressable
            accessibilityLabel={showConfirmPassword ? "Şifreyi gizle" : "Şifreyi göster"}
            style={styles.toggleButton}
            onPress={() => setShowConfirmPassword((prev) => !prev)}
          >
            <Ionicons name={showConfirmPassword ? "eye-off" : "eye"} size={22} color="#64748B" />
          </Pressable>
        </View>

        <Pressable style={styles.button} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Şifreyi Güncelle</Text>}
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
  },
  timerText: {
    color: "#475569",
    fontWeight: "700",
    marginBottom: 20,
    textAlign: "center",
  },
  passwordContainer: {
    width: "100%",
    justifyContent: "center",
    marginBottom: 12,
  },
  passwordInput: {
    marginBottom: 0,
    paddingRight: 52,
  },
  toggleButton: {
    alignItems: "center",
    height: 46,
    justifyContent: "center",
    position: "absolute",
    right: 8,
    width: 44,
  },
  button: {
    width: "100%",
    backgroundColor: "#1D4ED8",
    borderColor: "#000000",
    borderWidth: 2,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
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
