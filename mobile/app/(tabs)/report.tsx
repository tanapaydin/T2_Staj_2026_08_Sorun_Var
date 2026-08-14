import { useEffect, useState } from "react";
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


import {
  createReport,
  fetchLocationSuggestions,
  LocationSuggestion,
} from "../../lib/api";
import { AuthResponse, getAuthData } from "../../lib/auth";

const categories = [
  { label: "Yol", value: "road" },
  { label: "Aydınlatma", value: "lighting" },
  { label: "Çöp", value: "waste" },
  { label: "Su", value: "water" },
  { label: "Park", value: "park" },
  { label: "Diğer", value: "other" },
];

export default function ReportScreen() {
  const router = useRouter();
  const [auth, setAuth] = useState<AuthResponse | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searching, setSearching] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("road");
  const [locationQuery, setLocationQuery] = useState("");
  const [selectedLocation, setSelectedLocation] =
    useState<LocationSuggestion | null>(null);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);

  useEffect(() => {
    getAuthData()
      .then(setAuth)
      .finally(() => setCheckingAuth(false));
  }, []);

  const handleSearchLocation = async () => {
    const query = locationQuery.trim();

    if (query.length < 2) {
      Alert.alert("Hata", "Lütfen en az 2 karakter girin.");
      return;
    }

    setSearching(true);
    try {
      const results = await fetchLocationSuggestions(query);
      setSuggestions(results);

      if (results.length === 0) {
        Alert.alert("Konum bulunamadı", "Başka bir mahalle veya ilçe deneyin.");
      }
    } catch (error) {
      Alert.alert(
        "Konum Arama Başarısız",
        error instanceof Error ? error.message : "Bir hata oluştu."
      );
    } finally {
      setSearching(false);
    }
  };

  const handleSubmit = async () => {
    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();

    if (!auth) {
      Alert.alert("Giriş gerekli", "Rapor oluşturmak için giriş yapmalısınız.");
      return;
    }

    if (!trimmedTitle) {
      Alert.alert("Hata", "Lütfen başlık girin.");
      return;
    }

    if (!trimmedDescription) {
      Alert.alert("Hata", "Lütfen açıklama girin.");
      return;
    }

    if (!selectedLocation) {
      Alert.alert("Hata", "Lütfen rapor konumunu seçin.");
      return;
    }

    setSubmitting(true);
    try {
      await createReport(
        {
          title: trimmedTitle,
          description: trimmedDescription,
          category,
          latitude: selectedLocation.latitude,
          longitude: selectedLocation.longitude,
        },
        auth.access_token
      );

      setTitle("");
      setDescription("");
      setLocationQuery("");
      setSelectedLocation(null);
      setSuggestions([]);

      Alert.alert("Rapor Oluşturuldu", "Bildiriminiz başarıyla kaydedildi.");
      router.replace("/(tabs)/map");
    } catch (error) {
      Alert.alert(
        "Rapor Gönderilemedi",
        error instanceof Error ? error.message : "Bir hata oluştu."
      );
    } finally {
      setSubmitting(false);
    }
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
        <View style={styles.authPanel}>
          <Text style={styles.title}>Rapor oluşturmak için giriş yapın</Text>
          <Text style={styles.subtitle}>
            Misafir olarak haritayı ve açık raporları görüntüleyebilirsiniz.
            Yeni bildirim oluşturmak için hesabınızla devam edin.
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
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Yeni Bildirim</Text>
        <Text style={styles.subtitle}>
          Belediyeye iletmek istediğiniz sorunu kısa ve net şekilde paylaşın.
        </Text>

        <Text style={styles.label}>Başlık</Text>
        <TextInput
          style={styles.input}
          placeholder="Örn. Kırık kaldırım taşı"
          placeholderTextColor="#94A3B8"
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.label}>Kategori</Text>
        <View style={styles.categoryGrid}>
          {categories.map((item) => (
            <Pressable
              key={item.value}
              style={[
                styles.categoryButton,
                category === item.value && styles.categoryButtonActive,
              ]}
              onPress={() => setCategory(item.value)}
            >
              <Text
                style={[
                  styles.categoryButtonText,
                  category === item.value && styles.categoryButtonTextActive,
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Konum</Text>
        <View style={styles.searchRow}>
          <TextInput
            style={[styles.input, styles.searchInput]}
            placeholder="Mahalle, ilçe veya belediye ara"
            placeholderTextColor="#94A3B8"
            value={locationQuery}
            onChangeText={(value) => {
              setLocationQuery(value);
              setSelectedLocation(null);
            }}
          />
          <Pressable
            style={styles.searchButton}
            onPress={handleSearchLocation}
            disabled={searching}
          >
            {searching ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.searchButtonText}>Ara</Text>
            )}
          </Pressable>
        </View>

        {suggestions.map((suggestion) => (
          <Pressable
            key={`${suggestion.name}-${suggestion.latitude}-${suggestion.longitude}`}
            style={[
              styles.suggestion,
              selectedLocation?.name === suggestion.name &&
                styles.suggestionActive,
            ]}
            onPress={() => {
              setSelectedLocation(suggestion);
              setLocationQuery(suggestion.name);
            }}
          >
            <Text style={styles.suggestionText}>{suggestion.name}</Text>
          </Pressable>
        ))}

        <Text style={styles.label}>Açıklama</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Sorunu, konumu ve aciliyetini açıklayın."
          placeholderTextColor="#94A3B8"
          multiline
          value={description}
          onChangeText={setDescription}
        />

        <Pressable
          style={[styles.primaryButton, submitting && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.primaryButtonText}>Raporu Gönder</Text>
          )}
        </Pressable>
      </ScrollView>
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
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  authPanel: {
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
  label: {
    color: "#334155",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
  },
  input: {
    width: "100%",
    backgroundColor: "white",
    borderColor: "#CBD5E1",
    borderRadius: 12,
    borderWidth: 1,
    color: "#0F172A",
    fontSize: 15,
    marginBottom: 16,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: "top",
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  categoryButton: {
    backgroundColor: "white",
    borderColor: "#CBD5E1",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  categoryButtonActive: {
    backgroundColor: "#DBEAFE",
    borderColor: "#2563EB",
  },
  categoryButtonText: {
    color: "#475569",
    fontWeight: "700",
  },
  categoryButtonTextActive: {
    color: "#1D4ED8",
  },
  searchRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  searchInput: {
    flex: 1,
  },
  searchButton: {
    alignItems: "center",
    backgroundColor: "#2563EB",
    borderRadius: 12,
    justifyContent: "center",
    marginBottom: 16,
    minHeight: 46,
    paddingHorizontal: 18,
  },
  searchButtonText: {
    color: "white",
    fontWeight: "800",
  },
  suggestion: {
    backgroundColor: "white",
    borderColor: "#E2E8F0",
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    padding: 12,
  },
  suggestionActive: {
    backgroundColor: "#EFF6FF",
    borderColor: "#2563EB",
  },
  suggestionText: {
    color: "#334155",
    fontWeight: "600",
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
  disabledButton: {
    opacity: 0.7,
  },
});
