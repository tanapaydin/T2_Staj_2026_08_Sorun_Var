import React from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { Report } from "../../types/report";
import {
  categoryLabels,
  priorityLabels,
  statusLabels,
} from "../../constants/report";
import { Colors } from "../../theme/colors";
import { getReportImages } from "../../constants/reportImages";
import type { ReportImageSource } from "../../constants/reportImages";
import { ImageViewerModal, ReportImage } from "../common";

const isWeb = Platform.OS === "web";

let MapView: any = View;
let Marker: any = View;

if (!isWeb) {
  const ReactNativeMaps = require("react-native-maps");
  MapView = ReactNativeMaps.default;
  Marker = ReactNativeMaps.Marker;
}

type ReportWithOptionalDetails = Report & {
  image_urls?: string[];
};

type ReportDetailModalProps = {
  visible: boolean;
  report: ReportWithOptionalDetails | null;
  following: boolean;
  followingLoading: boolean;
  onClose: () => void;
  onToggleFollow: () => void;
};

export function ReportDetailModal({
  visible,
  report,
  following,
  followingLoading,
  onClose,
  onToggleFollow,
}: ReportDetailModalProps) {
  const [imageViewer, setImageViewer] = React.useState<{
    images: ReportImageSource[];
    initialIndex: number;
  } | null>(null);

  if (!report) {
    return null;
  }

  const images = getReportImages(
    report.category,
    report.image_urls
  );

  const locationSummary = (() => {
    const city = report.city?.trim();
    const district = report.district?.trim();

    if (city && district) return `${city} · ${district}`;
    if (city) return city;
    if (district) return district;
    if (report.address?.trim()) return report.address;
    return `${report.latitude.toFixed(5)}, ${report.longitude.toFixed(5)}`;
  })();

  const locationDetails = [
    report.neighborhood?.trim(),
    report.address?.trim(),
  ]
    .filter(Boolean)
    .join("\n");

  const goToReport = () => {
    onClose();

    router.push({
      pathname: "/(tabs)/map",
      params: {
        reportId: String(report.id),
        latitude: String(report.latitude),
        longitude: String(report.longitude),
      },
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={() => {
        if (imageViewer) {
          setImageViewer(null);
          return;
        }

        onClose();
      }}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              Bildirim Detayı
            </Text>

            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              activeOpacity={0.8}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.categoryRow}>
              <View style={styles.categoryBadge}>
                <View
                  style={[
                    styles.categoryDot,
                    {
                      backgroundColor:
                        Colors.category[
                          report.category as keyof typeof Colors.category
                        ] ?? Colors.category.other,
                    },
                  ]}
                />

                <Text style={styles.categoryText}>
                  {categoryLabels[report.category] ??
                    report.category}
                </Text>
              </View>

              <View style={styles.statusContainer}>
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor:
                        report.status === "resolved"
                          ? Colors.success
                          : report.status === "in_progress"
                          ? Colors.warning
                          : Colors.border,
                    },
                  ]}
                />

                <Text style={styles.statusText}>
                  {statusLabels[report.status] ??
                    report.status}
                </Text>
              </View>
            </View>

            <Text style={styles.title}>
              {report.title}
            </Text>

            <Text style={styles.label}>
              Açıklama
            </Text>

            <Text style={styles.description}>
              {report.description?.trim() ||
                "Bu bildirim için henüz açıklama bulunmuyor."}
            </Text>

            <Text style={styles.label}>
              Konum
            </Text>

            <View style={styles.mapPreview}>
              {isWeb ? (
                <View style={styles.mapFallback}>
                  <Ionicons
                    name="location"
                    size={30}
                    color={Colors.primary}
                  />
                </View>
              ) : (
                <MapView
                  style={styles.map}
                  initialRegion={{
                    latitude: report.latitude,
                    longitude: report.longitude,
                    latitudeDelta: 0.008,
                    longitudeDelta: 0.008,
                  }}
                  scrollEnabled={false}
                  zoomEnabled={false}
                  rotateEnabled={false}
                  pitchEnabled={false}
                  pointerEvents="none"
                >
                  <Marker
                    coordinate={{
                      latitude: report.latitude,
                      longitude: report.longitude,
                    }}
                    pinColor={Colors.primary}
                  />
                </MapView>
              )}
            </View>

            <View style={styles.locationBox}>
              <Text style={styles.locationIcon}>
                📍
              </Text>

              <View style={styles.locationContent}>
                <Text style={styles.locationSummary}>
                  {locationSummary}
                </Text>

                {locationDetails ? (
                  <Text style={styles.locationDetails}>
                    {locationDetails}
                  </Text>
                ) : null}

                <Text style={styles.coordinates}>
                  {report.latitude.toFixed(5)} ·{" "}
                  {report.longitude.toFixed(5)}
                </Text>
              </View>
            </View>

            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>
                  Öncelik
                </Text>
                <Text style={styles.metaValue}>
                  {priorityLabels[report.priority] ??
                    report.priority}
                </Text>
              </View>

              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>
                  Görüntülenme
                </Text>
                <Text style={styles.metaValue}>
                  {report.view_count}
                </Text>
              </View>

              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>
                  Takipçi
                </Text>
                <Text style={styles.metaValue}>
                  {report.follower_count ?? 0}
                </Text>
              </View>
            </View>

            {images.length > 0 && (
              <>
                <Text style={styles.label}>
                  Görseller
                </Text>

                <View style={styles.imageRow}>
                  {images.slice(0, 2).map((image, index) => (
                    <TouchableOpacity
                      key={String(index)}
                      activeOpacity={0.88}
                      style={styles.imageButton}
                      onPress={() =>
                        setImageViewer({
                          images,
                          initialIndex: index,
                        })
                      }
                    >
                      <ReportImage
                        image={image}
                        category={report.category}
                        style={styles.image}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            <TouchableOpacity
              style={[
                styles.followButton,
                following && styles.followingButton,
              ]}
              activeOpacity={0.85}
              disabled={followingLoading}
              onPress={onToggleFollow}
            >
              {followingLoading ? (
                <ActivityIndicator
                  size="small"
                  color={
                    following
                      ? "#64748B"
                      : Colors.primary
                  }
                />
              ) : (
                <Text
                  style={[
                    styles.followButtonText,
                    following &&
                      styles.followingButtonText,
                  ]}
                >
                  {following
                    ? "Takip Ediliyor ✓"
                    : "Şikayeti Takip Et"}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.goToButton}
              activeOpacity={0.85}
              onPress={goToReport}
            >
              <Text style={styles.goToButtonText}>
                Şikayete Git
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>

      <ImageViewerModal
        embedded
        visible={Boolean(imageViewer)}
        images={imageViewer?.images ?? []}
        category={report.category}
        initialIndex={imageViewer?.initialIndex ?? 0}
        onClose={() => setImageViewer(null)}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "flex-end",
  },
  card: {
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "92%",
    minHeight: "60%",
    overflow: "hidden",
  },
  header: {
    alignItems: "center",
    borderBottomColor: "#E2E8F0",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  headerTitle: {
    color: "#0F172A",
    fontSize: 20,
    fontWeight: "800",
  },
  closeButton: {
    alignItems: "center",
    justifyContent: "center",
    height: 36,
    width: 36,
  },
  closeButtonText: {
    color: "#64748B",
    fontSize: 32,
    fontWeight: "300",
    lineHeight: 34,
  },
  body: {
    flex: 1,
  },
  content: {
    padding: 18,
    paddingBottom: 32,
  },
  categoryRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  categoryBadge: {
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 999,
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  categoryDot: {
    borderRadius: 999,
    height: 9,
    marginRight: 7,
    width: 9,
  },
  categoryText: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "700",
  },
  statusContainer: {
    alignItems: "center",
    flexDirection: "row",
  },
  statusDot: {
    borderRadius: 999,
    height: 9,
    marginRight: 6,
    width: 9,
  },
  statusText: {
    color: "#475569",
    fontSize: 13,
    fontWeight: "700",
  },
  title: {
    color: "#0F172A",
    fontSize: 23,
    fontWeight: "800",
    marginBottom: 18,
  },
  label: {
    color: "#334155",
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 8,
    marginTop: 16,
  },
  description: {
    color: "#475569",
    fontSize: 15,
    lineHeight: 23,
  },
  mapPreview: {
    borderRadius: 14,
    height: 170,
    overflow: "hidden",
  },
  map: {
    flex: 1,
  },
  mapFallback: {
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    flex: 1,
    justifyContent: "center",
  },
  locationBox: {
    alignItems: "flex-start",
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    flexDirection: "row",
    marginTop: 10,
    padding: 14,
  },
  locationIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  locationContent: {
    flex: 1,
  },
  locationSummary: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "800",
  },
  locationDetails: {
    color: "#475569",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 4,
  },
  coordinates: {
    color: "#94A3B8",
    fontSize: 12,
    marginTop: 6,
  },
  metaRow: {
    borderColor: "#E2E8F0",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    marginTop: 16,
    paddingVertical: 14,
  },
  metaItem: {
    alignItems: "center",
    flex: 1,
  },
  metaLabel: {
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "700",
  },
  metaValue: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "800",
    marginTop: 4,
  },
  imageRow: {
    flexDirection: "row",
    gap: 10,
  },
  imageButton: {
    borderRadius: 14,
    flex: 1,
    height: 170,
    overflow: "hidden",
  },
  image: {
    height: "100%",
    width: "100%",
  },
  followButton: {
    alignItems: "center",
    borderColor: Colors.primary,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 20,
    minHeight: 48,
    justifyContent: "center",
  },
  followingButton: {
    backgroundColor: "#F1F5F9",
    borderColor: "#CBD5E1",
  },
  followButtonText: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: "800",
  },
  followingButtonText: {
    color: "#64748B",
  },
  goToButton: {
    alignItems: "center",
    backgroundColor: Colors.primary,
    borderRadius: 14,
    marginTop: 10,
    minHeight: 48,
    justifyContent: "center",
  },
  goToButtonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "800",
  },
});
