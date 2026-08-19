import { StyleSheet, Text, View } from "react-native";

export default function MapWebFallback() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Harita</Text>
      <Text style={styles.text}>
        Web sürümünde harita görünümü için mobil cihaz veya yerel native ortam gereklidir.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 12,
  },
  text: {
    fontSize: 16,
    color: "#475569",
    textAlign: "center",
  },
});

