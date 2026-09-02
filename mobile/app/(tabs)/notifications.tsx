import React, { useCallback, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";

import {
  AppNotification,
  fetchFollowedReports,
  fetchNotifications,
  fetchReport,
  followReport,
  markNotificationRead,
  unfollowReport,
} from "../../lib/api";
import { Report } from "../../types/report";
import { ReportDetailModal } from "../../components/reports/ReportDetailModal";

function formatNotificationTime(createdAt: string): string {
  const created = new Date(createdAt);
  const now = new Date();

  const diffMs = now.getTime() - created.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) {
    return "Az önce";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} dk önce`;
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    return `${diffHours} saat önce`;
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (
    created.getDate() === yesterday.getDate() &&
    created.getMonth() === yesterday.getMonth() &&
    created.getFullYear() === yesterday.getFullYear()
  ) {
    return "Dün";
  }

  return created.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
    year:
      created.getFullYear() !== now.getFullYear()
        ? "numeric"
        : undefined,
  });
}

export default function Screen() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [followedReportIds, setFollowedReportIds] = useState<string[]>([]);
  const [detailFollowingLoading, setDetailFollowingLoading] = useState(false);

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchNotifications();
      setNotifications(data);
    } catch (error) {
      console.error("Bildirimler yüklenemedi:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [loadNotifications])
  );

  const handleNotificationPress = async (
    notification: AppNotification
  ) => {
    console.log("BİLDİRİME BASILDI:", notification);

    try {
      if (!notification.is_read) {
        await markNotificationRead(notification.id);

        setNotifications((current) =>
          current.map((item) =>
            item.id === notification.id
              ? { ...item, is_read: true }
              : item
          )
        );
      }

      if (!notification.report_id) {
        return;
      }

      console.log(
        "BİLDİRİM RAPORU AÇILIYOR:",
        notification.report_id
      );

      const authJson = await AsyncStorage.getItem("SORUN_VAR_AUTH");

      if (!authJson) {
        console.error("AUTH BULUNAMADI.");
        return;
      }

      const auth = JSON.parse(authJson);

      const [report, followedReports] = await Promise.all([
        fetchReport(notification.report_id),
        fetchFollowedReports(auth.access_token),
      ]);

      setFollowedReportIds(
        followedReports.map((item) => item.id)
      );

      setSelectedReport(report);
    } catch (error) {
      console.error("Bildirim raporu açılamadı:", error);
    }
  };

  const handleToggleDetailFollow = async () => {
    if (!selectedReport) return;

    try {
      const authJson = await AsyncStorage.getItem("SORUN_VAR_AUTH");

      if (!authJson) {
        console.error("AUTH BULUNAMADI.");
        return;
      }

      const auth = JSON.parse(authJson);

      const isFollowing = followedReportIds.includes(
        selectedReport.id
      );

      setDetailFollowingLoading(true);

      const result = isFollowing
        ? await unfollowReport(
            selectedReport.id,
            auth.access_token
          )
        : await followReport(
            selectedReport.id,
            auth.access_token
          );

      setSelectedReport((current) =>
        current
          ? {
              ...current,
              follower_count: result.follower_count,
            }
          : current
      );

      setFollowedReportIds((current) => {
        if (result.following) {
          return current.includes(selectedReport.id)
            ? current
            : [...current, selectedReport.id];
        }

        return current.filter(
          (id) => id !== selectedReport.id
        );
      });
    } catch (error) {
      console.error(
        "BİLDİRİM TAKİP HATASI:",
        error
      );
    } finally {
      setDetailFollowingLoading(false);
    }
  };

  const unreadCount = notifications.filter(
    (notification) => !notification.is_read
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

        {loading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="small" />
            <Text style={styles.emptyText}>
              Bildirimler yükleniyor...
            </Text>
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>
              Henüz bildirimin yok
            </Text>

            <Text style={styles.emptyText}>
              Yeni bir bildirim geldiğinde burada göreceksin.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {notifications.map((notification) => (
              <TouchableOpacity
                key={notification.id}
                activeOpacity={0.8}
                onPress={() =>
                  handleNotificationPress(notification)
                }
                style={[
                  styles.notificationCard,
                  !notification.is_read && styles.unreadCard,
                ]}
              >
                <View style={styles.notificationContent}>
                  <View style={styles.notificationTop}>
                    <Text style={styles.notificationTitle}>
                      {notification.title}
                    </Text>

                    {!notification.is_read && (
                      <View style={styles.unreadDot} />
                    )}
                  </View>

                  <Text style={styles.message}>
                    {notification.message}
                  </Text>

                  <Text style={styles.time}>
                    {formatNotificationTime(
                      notification.created_at
                    )}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
      <ReportDetailModal
        visible={Boolean(selectedReport)}
        report={selectedReport}
        following={
          selectedReport
            ? followedReportIds.includes(selectedReport.id)
            : false
        }
        followingLoading={detailFollowingLoading}
        onClose={() => setSelectedReport(null)}
        onToggleFollow={handleToggleDetailFollow}
      />

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

  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 30,
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#172033",
    marginTop: 12,
  },

  emptyText: {
    fontSize: 14,
    color: "#687386",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
});
