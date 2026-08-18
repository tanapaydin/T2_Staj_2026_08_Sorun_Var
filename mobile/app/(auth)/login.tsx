import { useState } from "react";
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
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { login } from "../../lib/auth";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const isValidEmail = (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleLogin = async () => {
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail) {
      Alert.alert("Hata", "Lütfen e-posta girin.");
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      Alert.alert("Hata", "Lütfen geçerli bir e-posta adresi girin.");
      return;
    }

    if (!trimmedPassword) {
      Alert.alert("Hata", "Lütfen şifre girin.");
      return;
    }

    setLoading(true);
    try {
      await login(trimmedEmail, trimmedPassword);
      router.replace("/(tabs)/map");
    } catch (error) {
      Alert.alert("Giriş Başarısız", error instanceof Error ? error.message : "Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthBackground>
      <View style={styles.form}>
        <Text style={styles.title}>Giriş Yap</Text>
        <Text style={styles.subtitle}>Hesabınızla giriş yaparak raporlarınıza erişin.</Text>

        <TextInput
          style={styles.input}
          placeholder="E-posta"
          placeholderTextColor="#94A3B8"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <View style={styles.passwordContainer}>
          <TextInput
            style={[styles.input, styles.passwordInput]}
            placeholder="Şifre"
            placeholderTextColor="#94A3B8"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <Pressable
            accessibilityLabel={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
            style={styles.toggleButton}
            onPress={() => setShowPassword((prev) => !prev)}
          >
            <Ionicons
              name={showPassword ? "eye-off" : "eye"}
              size={22}
              color="#64748B"
            />
          </Pressable>
        </View>

        <Pressable style={styles.button} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Giriş Yap</Text>}
        </Pressable>

        <Pressable onPress={() => router.push("/(auth)/register")}> 
          <Text style={styles.linkText}>Hesabınız yok mu? Kayıt Ol</Text>
        </Pressable>

        <Pressable onPress={() => router.replace("/(tabs)/map")}>
          <Text style={styles.guestText}>Misafir olarak devam et</Text>
        </Pressable>
      </View>
    </AuthBackground>
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
    color: "#475569",
    marginBottom: 28,
    textAlign: "center",
  },
  input: {
    width: "100%",
    backgroundColor: "white",
    borderColor: "#CBD5E1",
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
    color: "#0F172A",
  },
  button: {
    width: "100%",
    backgroundColor: "#1D4ED8",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 18,
  },
  buttonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },
  passwordContainer: {
    width: "100%",
    justifyContent: "center",
    marginBottom: 16,
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
  linkText: {
    color: "#2563EB",
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
  },
  guestText: {
    color: "#475569",
    textAlign: "center",
  },
});

