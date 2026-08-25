import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";

import {
  fetchFollowedReports,
  followReport,
  unfollowReport,
} from "../../lib/api";
import { getReportImages } from "../../constants/reportImages";
import { Report } from "../../types/report";
import { getCategoryLabel } from "../../utils/map";

import {
  AppButton,
  AppCard,
  AppText,
  ImageViewerModal,
  ReportImage,
} from "../common";

import {
  Colors,
  Spacing,
} from "../../theme";

type Props = {
  report: Report | null;
  accessToken: string | null;
  onClose: () => void;
};

function getPriorityLabel(priority?: string) {
  switch (priority) {
    case "high":
      return "Yüksek";
    case "medium":
      return "Orta";
    case "low":
      return "Düşük";
    default:
      return "Belirtilmemiş";
  }
}

function getStatusLabel(status?: string) {
  switch (status) {
    case "resolved":
      return "Çözüldü";
    case "in_progress":
      return "İşlemde";
    case "pending":
      return "Bekliyor";
    default:
      return status ?? "Belirtilmemiş";
  }
}

function getStatusColor(status?: string) {
  switch (status) {
    case "resolved":
      return Colors.success;
    case "in_progress":
      return Colors.warning;
    case "pending":
      return "#94A3B8";
    default:
      return "#94A3B8";
  }
}

export default function ReportCard({
  report,
  accessToken,
  onClose,
}: Props) {
  const [imageViewerIndex, setImageViewerIndex] =
    useState<number | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingLoading, setFollowingLoading] = useState(false);
  const [followStatusLoading, setFollowStatusLoading] = useState(false);

  useEffect(() => {
    let active = true;

    setImageViewerIndex(null);
    setFollowerCount(report?.follower_count ?? 0);
    setIsFollowing(false);

    if (!report || !accessToken) {
      setFollowStatusLoading(false);
      return () => {
        active = false;
      };
    }

    setFollowStatusLoading(true);

    void fetchFollowedReports(accessToken)
      .then((followedReports) => {
        if (active) {
          setIsFollowing(
            followedReports.some((item) => item.id === report.id)
          );
        }
      })
      .catch((error) => {
        console.log("LOAD MAP FOLLOW STATUS ERROR:", error);
      })
      .finally(() => {
        if (active) {
          setFollowStatusLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [accessToken, report?.id]);

  async function toggleFollow() {
    if (!report) {
      return;
    }

    if (!accessToken) {
      Alert.alert(
        "Giriş Yapmalısınız",
        "Bir sorunu takip edebilmek için giriş yapmanız veya kayıt olmanız gerekiyor.",
        [
          { text: "Vazgeç", style: "cancel" },
          {
            text: "Kayıt Ol",
            onPress: () => router.push("/(auth)/register"),
          },
          {
            text: "Giriş Yap",
            onPress: () => router.push("/(auth)/login"),
          },
        ]
      );
      return;
    }

    try {
      setFollowingLoading(true);

      const result = isFollowing
        ? await unfollowReport(report.id, accessToken)
        : await followReport(report.id, accessToken);

      setIsFollowing(result.following);
      setFollowerCount(result.follower_count);
    } catch (error) {
      Alert.alert(
        "Takip işlemi tamamlanamadı",
        error instanceof Error ? error.message : "Lütfen tekrar deneyin."
      );
    } finally {
      setFollowingLoading(false);
    }
  }

  if (!report) return null;

  const reportDetails = report as Report & {
    description?: string;
    city?: string;
    municipality?: string;
    district?: string;
    neighborhood?: string;
    address?: string;
    created_at?: string;
    image_urls?: string[];
  };

  const description =
    reportDetails.description?.trim() ||
    "Bu bildirim için açıklama bulunmuyor.";

  const city =
    reportDetails.city?.trim() ||
    "İl bilgisi yok";

  const municipality =
    reportDetails.municipality?.trim() ||
    "Belediye bilgisi yok";

  const district =
    reportDetails.district?.trim() ||
    "";

  const neighborhood =
    reportDetails.neighborhood?.trim() ||
    "";

  const address =
    reportDetails.address?.trim() ||
    `${report.latitude.toFixed(5)}, ${report.longitude.toFixed(5)}`;

  const statusLabel = getStatusLabel(report.status);
  const statusColor = getStatusColor(report.status);
  const images = getReportImages(
    report.category,
    reportDetails.image_urls
  );

  return (
    <>
      <AppCard style={styles.bottomCard}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.badgeRow}>
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

              <AppText
                variant="bodyMedium"
                color={Colors.textSecondary}
                style={styles.categoryText}
              >
                {getCategoryLabel(report.category)}
              </AppText>
            </View>

            <View style={styles.statusBadge}>
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor: statusColor,
                  },
                ]}
              />

              <AppText
                variant="bodyMedium"
                color={Colors.textSecondary}
                style={styles.statusText}
              >
                {statusLabel}
              </AppText>
            </View>
          </View>

          <AppText
            variant="title"
            style={styles.cardTitle}
          >
            {report.title}
          </AppText>
        </View>

        <AppButton
          title="×"
          variant="secondary"
          onPress={onClose}
          style={styles.closeIconButton}
        />
      </View>

      <View style={styles.imageRow}>
        {images.slice(0, 2).map((image, index) => (
          <TouchableOpacity
            key={String(index)}
            accessibilityRole="button"
            accessibilityLabel={`${index + 1}. görseli büyüt`}
            activeOpacity={0.88}
            style={styles.reportImageButton}
            onPress={() => setImageViewerIndex(index)}
          >
            <ReportImage
              image={image}
              category={report.category}
              style={styles.reportImage}
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* DESCRIPTION */}
      <View style={styles.section}>
        <AppText
          variant="bodyMedium"
          color={Colors.textSecondary}
          style={styles.sectionLabel}
        >
          Açıklama
        </AppText>

        <AppText
          variant="body"
          color={Colors.textSecondary}
          style={styles.description}
        >
          {description}
        </AppText>
      </View>

      {/* LOCATION */}
      <View style={styles.locationCard}>
        <View style={styles.locationIcon}>
          <AppText
            variant="bodyMedium"
            color={Colors.primary}
          >
            ●
          </AppText>
        </View>

        <View style={styles.locationContent}>
          <AppText
            variant="bodyMedium"
            style={styles.locationTitle}
          >
            Konum
          </AppText>

          <AppText
            variant="body"
            color={Colors.textSecondary}
            style={styles.locationText}
          >
            {address}
          </AppText>
        </View>
      </View>

      {/* ADMINISTRATIVE INFO */}
      <View style={styles.infoGrid}>
        <View style={styles.infoItem}>
          <AppText
            variant="bodyMedium"
            color={Colors.textSecondary}
            style={styles.infoLabel}
          >
            İl
          </AppText>

          <AppText
            variant="bodyMedium"
            style={styles.infoValue}
          >
            {city}
          </AppText>
        </View>

        <View style={styles.infoItem}>
          <AppText
            variant="bodyMedium"
            color={Colors.textSecondary}
            style={styles.infoLabel}
          >
            Belediye
          </AppText>

          <AppText
            variant="bodyMedium"
            style={styles.infoValue}
          >
            {municipality}
          </AppText>
        </View>

        {(district || neighborhood) && (
          <View style={styles.infoItem}>
            <AppText
              variant="bodyMedium"
              color={Colors.textSecondary}
              style={styles.infoLabel}
            >
              Bölge
            </AppText>

            <AppText
              variant="bodyMedium"
              style={styles.infoValue}
            >
              {[district, neighborhood]
                .filter(Boolean)
                .join(" / ")}
            </AppText>
          </View>
        )}
      </View>

      {/* META */}
      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <AppText
            variant="bodyMedium"
            color={Colors.textSecondary}
            style={styles.infoLabel}
          >
            Öncelik
          </AppText>

          <AppText
            variant="bodyMedium"
            style={styles.infoValue}
          >
            {getPriorityLabel(report.priority)}
          </AppText>
        </View>

        <View style={styles.metaItem}>
          <AppText
            variant="bodyMedium"
            color={Colors.textSecondary}
            style={styles.infoLabel}
          >
            Görüntülenme
          </AppText>

          <AppText
            variant="bodyMedium"
            style={styles.infoValue}
          >
            {report.view_count}
          </AppText>
        </View>

        <View style={styles.metaItem}>
          <AppText
            variant="bodyMedium"
            color={Colors.textSecondary}
            style={styles.infoLabel}
          >
            Takipçi
          </AppText>

          <AppText
            variant="bodyMedium"
            style={styles.infoValue}
          >
            {followerCount}
          </AppText>
        </View>
      </View>

      {/* ACTIONS */}
      <View style={styles.actions}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={
            isFollowing ? "Şikayeti takipten çıkar" : "Şikayeti takip et"
          }
          activeOpacity={0.85}
          disabled={followingLoading || followStatusLoading}
          onPress={toggleFollow}
          style={[
            styles.followButton,
            isFollowing && styles.followingButton,
            (followingLoading || followStatusLoading) && styles.disabledButton,
          ]}
        >
          {followingLoading || followStatusLoading ? (
            <ActivityIndicator
              size="small"
              color={isFollowing ? Colors.textSecondary : Colors.primary}
            />
          ) : (
            <AppText
              variant="bodyMedium"
              color={isFollowing ? Colors.textSecondary : Colors.primary}
              style={styles.followButtonText}
            >
              {isFollowing ? "Takip Ediliyor ✓" : "Şikayeti Takip Et"}
            </AppText>
          )}
        </TouchableOpacity>

        <AppButton
          title="Kapat"
          variant="secondary"
          onPress={onClose}
          style={styles.closeButton}
        />
      </View>
      </AppCard>

      <ImageViewerModal
        visible={imageViewerIndex !== null}
        images={images}
        category={report.category}
        initialIndex={imageViewerIndex ?? 0}
        onClose={() => setImageViewerIndex(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  bottomCard: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 18,

    borderRadius: 26,
    padding: 18,

    zIndex: 50,
    elevation: 20,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.18,
    shadowRadius: 10,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },

  headerContent: {
    flex: 1,
    paddingRight: 10,
  },

  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },

  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",

    backgroundColor: "#F8FAFC",

    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E2E8F0",

    paddingHorizontal: 9,
    paddingVertical: 5,
  },

  categoryDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },

  categoryText: {
    fontSize: 11,
    fontWeight: "700",
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",

    backgroundColor: "#F8FAFC",

    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E2E8F0",

    paddingHorizontal: 9,
    paddingVertical: 5,
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },

  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },

  cardTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "800",
  },

  closeIconButton: {
    width: 38,
    height: 38,
    minHeight: 38,
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
  },

  section: {
    marginBottom: 14,
  },

  sectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    marginBottom: 5,
    textTransform: "uppercase",
  },

  description: {
    fontSize: 13,
    lineHeight: 19,
  },

  locationCard: {
    flexDirection: "row",
    alignItems: "center",

    backgroundColor: "#F8FAFC",

    borderRadius: 16,
    padding: 12,

    marginBottom: 14,
  },

  locationIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#E8F0FE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  locationContent: {
    flex: 1,
  },

  locationTitle: {
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 2,
  },

  locationText: {
    fontSize: 12,
    lineHeight: 17,
  },

  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 6,
  },

  infoItem: {
    width: "50%",
    marginBottom: 12,
    paddingRight: 10,
  },

  infoLabel: {
    fontSize: 11,
    marginBottom: 3,
  },

  infoValue: {
    fontSize: 13,
    fontWeight: "700",
  },

  metaRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingTop: 12,
    marginBottom: 14,
  },

  metaItem: {
    flex: 1,
  },

  actions: {
    flexDirection: "row",
    gap: 8,
  },

  followButton: {
    flex: 1,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },

  followingButton: {
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceSecondary,
  },

  disabledButton: {
    opacity: 0.65,
  },

  followButtonText: {
    fontWeight: "800",
  },

  locationButton: {
    marginTop: Spacing.xs,
  },

  imageRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },

  reportImageButton: {
    flex: 1,
    height: 105,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: Colors.surfaceSecondary,
  },

  reportImage: {
    width: "100%",
    height: "100%",
    backgroundColor: Colors.surfaceSecondary,
  },

  closeButton: {
    flex: 1,
    marginTop: 0,
  },
});
