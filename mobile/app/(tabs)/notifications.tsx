import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const notifications = [
  {
    id: "1",
    title: "Yakınınızda yeni sorun",
    message: "Çevrenizde yeni bir sorun bildirildi.",
    time: "Az önce",
    unread: true,
  },
  {
    id: "3",
    title: "Raporunuz güncellendi",
    message: "Oluşturduğunuz raporun durumu güncellendi.",
    time: "Dün",
    unread: false,
  },
];

export default function Screen() {
  const unreadCount = notifications.filter(
    (notification) => notification.unread
  ).length;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Bildirimler</Text>

            <Text style={styles.subtitle}>
              {unreadCount > 0
                ? `${unreadCount} okunmamış bildirimin var.`
                : "Tüm bildirimlerin okundu."}
            </Text>
          </View>

          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>

        <View style={styles.list}>
          {notifications.map((notification) => (
            <TouchableOpacity
              key={notification.id}
              activeOpacity={0.8}
              style={[
                styles.notificationCard,
                notification.unread && styles.unreadCard,
              ]}
            >
              <View style={styles.notificationContent}>
                <View style={styles.notificationTop}>
                  <Text style={styles.notificationTitle}>
                    {notification.title}
                  </Text>

                  {notification.unread && (
                    <View style={styles.unreadDot} />
                  )}
                </View>

                <Text style={styles.message}>
                  {notification.message}
                </Text>

                <Text style={styles.time}>
                  {notification.time}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8FA",
  },

  content: {
    padding: 22,
    paddingBottom: 40,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },

  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#172033",
  },

  subtitle: {
    fontSize: 14,
    color: "#687386",
    marginTop: 6,
  },

  badge: {
    minWidth: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#315EE8",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 9,
  },

  badgeText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },

  list: {
    gap: 12,
  },

  notificationCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E8EBF0",
    padding: 18,
  },

  unreadCard: {
    borderColor: "#D9E2FF",
  },

  notificationContent: {
    flex: 1,
  },

  notificationTop: {
    flexDirection: "row",
    alignItems: "center",
  },

  notificationTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: "#172033",
  },

  unreadDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#315EE8",
    marginLeft: 8,
  },

  message: {
    fontSize: 14,
    lineHeight: 20,
    color: "#687386",
    marginTop: 6,
  },

  time: {
    fontSize: 12,
    color: "#9AA2AF",
    marginTop: 9,
  },
});