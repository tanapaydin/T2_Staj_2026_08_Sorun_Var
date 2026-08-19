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
import { SafeAreaView } from "react-native-safe-area-context";
import AuthBackground from "../../components/auth/AuthBackground";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { register } from "../../lib/auth";

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const isValidEmail = (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleRegister = async () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedName) {
      Alert.alert("Hata", "Lütfen adınızı girin.");
      return;
    }

    if (!trimmedEmail) {
      Alert.alert("Hata", "Lütfen e-posta girin.");
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      Alert.alert("Hata", "Lütfen geçerli bir e-posta adresi girin.");
      return;
    }

    if (!trimmedPassword) {
      Alert.alert("Hata", "Lütfen şifrenizi girin.");
      return;
    }

    if (trimmedPassword.length < 8) {
      Alert.alert("Hata", "Şifre en az 8 karakter olmalıdır.");
      return;
    }

    const missingRequirements: string[] = [];
    if (!/[A-Z]/.test(trimmedPassword)) {
      missingRequirements.push("en az bir büyük harf");
    }
    if (!/[a-z]/.test(trimmedPassword)) {
      missingRequirements.push("en az bir küçük harf");
    }
    if (!/[0-9]/.test(trimmedPassword)) {
      missingRequirements.push("en az bir rakam");
    }
    if (!/[^A-Za-z0-9]/.test(trimmedPassword)) {
      missingRequirements.push("en az bir özel karakter");
    }

    if (missingRequirements.length > 0) {
      Alert.alert(
        "Hata",
        `Şifrenizde ${missingRequirements.join(", ")} bulunmalıdır.`
      );
      return;
    }

    setLoading(true);
    try {
      await register(trimmedName, trimmedEmail, trimmedPassword);
      router.replace("/(tabs)/map");
    } catch (error) {
      Alert.alert("Kayıt Başarısız", error instanceof Error ? error.message : "Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthBackground>
      <View style={styles.form}>
        <Text style={styles.title}>Kayıt Ol</Text>
        <Text style={styles.subtitle}>Hesap oluşturarak raporlarınızı takip edin.</Text>

        <TextInput
          style={styles.input}
          placeholder="Ad Soyad"
          placeholderTextColor="#334155"
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.input}
          placeholder="E-posta"
          placeholderTextColor="#334155"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <View style={styles.passwordContainer}>
          <TextInput
            style={[styles.input, styles.passwordInput]}
            placeholder="Şifre"
            placeholderTextColor="#334155"
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

        <Pressable style={styles.button} onPress={handleRegister} disabled={loading}>
          {loading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Kayıt Ol</Text>}
        </Pressable>

        <Pressable onPress={() => router.push("/(auth)/login")}> 
          <Text style={styles.linkText}>Zaten hesabın var mı? Giriş Yap</Text>
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
    marginBottom: 16,
    color: "#0F172A",
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
    color: "#000000",
    fontWeight: "800",
    textAlign: "center",
  },
});

