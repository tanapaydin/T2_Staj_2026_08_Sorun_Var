import {
  ActivityIndicator,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useState, useEffect } from "react";
import { router } from "expo-router";

import { Report } from "../../types/report";
import {
  categoryLabels,
  priorityLabels,
  statusLabels,
} from "../../constants/report";
import { Colors } from "../../theme/colors";
import {
  fetchFollowedReports,
  followReport,
  unfollowReport,
} from "../../lib/api";

type RecentReportsProps = {
  reports: Report[];
  activeOverviewPage: number;
  currentCity: string | null;
  currentMunicipality: string | null;
  loadingMore: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  accessToken: string | null;
};

type ReportWithOptionalDetails = Report & {
  description?: string;
  city?: string | null;
  municipality?: string | null;
  district?: string | null;
  neighborhood?: string | null;
  address?: string | null;
  location_name?: string;
  image_urls?: string[];
};

const categoryExampleImages: Record<string, string[]> = {
  road: [
    "https://loremflickr.com/900/600/pothole,road?lock=101",
    "https://loremflickr.com/900/600/damaged,road?lock=102",
  ],

  lighting: [
    "https://loremflickr.com/900/600/broken,streetlight?lock=201",
    "https://loremflickr.com/900/600/street,lamp,night?lock=202",
  ],

  trash: [
    "https://loremflickr.com/900/600/overflowing,trash?lock=301",
    "https://loremflickr.com/900/600/garbage,street?lock=302",
  ],

  traffic: [
    "https://loremflickr.com/900/600/traffic,jam,city?lock=401",
    "https://loremflickr.com/900/600/city,traffic?lock=402",
  ],

  construction: [
    "https://loremflickr.com/900/600/road,construction?lock=501",
    "https://loremflickr.com/900/600/city,construction?lock=502",
  ],

  water: [
    "https://loremflickr.com/900/600/flooded,street?lock=601",
    "https://loremflickr.com/900/600/water,leak,street?lock=602",
  ],

  park: [
    "https://loremflickr.com/900/600/dirty,park?lock=701",
    "https://loremflickr.com/900/600/park,maintenance?lock=702",
  ],

  noise: [
    "https://loremflickr.com/900/600/noisy,street,city?lock=801",
    "https://loremflickr.com/900/600/city,crowd?lock=802",
  ],

  animal: [
    "https://loremflickr.com/900/600/stray,dog,city?lock=901",
    "https://loremflickr.com/900/600/stray,cat,street?lock=902",
  ],

  other: [
    "https://loremflickr.com/900/600/city,problem?lock=1001",
    "https://loremflickr.com/900/600/street,problem?lock=1002",
  ],
};

export default function RecentReports({
  reports,
  activeOverviewPage,
  currentCity,
  currentMunicipality,
  loadingMore,
  hasMore,
  onLoadMore,
  accessToken,
}: RecentReportsProps) {
  const [selectedReport, setSelectedReport] =
    useState<ReportWithOptionalDetails | null>(null);

  const [followingReports, setFollowingReports] =
    useState<Record<string, boolean>>({});

  const [followerCounts, setFollowerCounts] =
    useState<Record<string, number>>({});

  const [followingLoading, setFollowingLoading] =
    useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadFollowingReports() {
      if (!accessToken) {
        if (active) {
          setFollowingReports({});
          setFollowerCounts({});
        }

        return;
      }

      try {
        const followedReports =
          await fetchFollowedReports(
            accessToken
          );

        if (!active) {
          return;
        }

        const followingMap: Record<
          string,
          boolean
        > = {};

        const countsMap: Record<
          string,
          number
        > = {};

        followedReports.forEach((report) => {
          followingMap[report.id] = true;

          countsMap[report.id] =
            report.follower_count ?? 0;
        });

        setFollowingReports(
          followingMap
        );

        setFollowerCounts(
          countsMap
        );
      } catch (error) {
        console.log(
          "LOAD FOLLOWED REPORTS ERROR:",
          error
        );
      }
    }

    loadFollowingReports();

    return () => {
      active = false;
    };
  }, [accessToken]);

  const subtitle =
    activeOverviewPage === 0
      ? "En son eklenen bildirimler"
      : activeOverviewPage === 1
      ? currentCity
        ? `${currentCity} ilindeki en son bildirimler`
        : "Konum izni verildiğinde ilinizdeki bildirimler gösterilecek"
      : activeOverviewPage === 2
      ? currentMunicipality
        ? `${currentMunicipality} belediyesindeki en son bildirimler`
        : "Konum izni verildiğinde belediyenizdeki bildirimler gösterilecek"
      : "";

  function getDescription(
    report: ReportWithOptionalDetails
  ) {
    if (report.description?.trim()) {
      return report.description;
    }

    return "Bu bildirim için henüz açıklama bulunmuyor.";
  }

  function getLocationSummary(
    report: ReportWithOptionalDetails
  ) {
    const city = report.city?.trim();
    const district = report.district?.trim();

    if (city && district) {
      return `${city} · ${district}`;
    }

    if (city) {
      return city;
    }

    if (district) {
      return district;
    }

    if (report.location_name?.trim()) {
      return report.location_name;
    }

    return `${report.latitude.toFixed(
      5
    )}, ${report.longitude.toFixed(5)}`;
  }

  function getLocationDetails(
    report: ReportWithOptionalDetails
  ) {
    const parts: string[] = [];

    if (report.neighborhood?.trim()) {
      parts.push(
        report.neighborhood.trim()
      );
    }

    if (report.address?.trim()) {
      parts.push(
        report.address.trim()
      );
    }

    if (parts.length > 0) {
      return parts.join("\n");
    }

    return "Detaylı adres bilgisi bulunmuyor.";
  }

  function getCoordinates(
    report: ReportWithOptionalDetails
  ) {
    return `${report.latitude.toFixed(
      5
    )} · ${report.longitude.toFixed(5)}`;
  }

  function getImages(
    report: ReportWithOptionalDetails
  ) {
    if (
      Array.isArray(report.image_urls) &&
      report.image_urls.length > 0
    ) {
      return report.image_urls;
    }

    return (
      categoryExampleImages[report.category] ??
      categoryExampleImages.other
    );
  }

  function renderImagePreview(
    report: ReportWithOptionalDetails
  ) {
    const images = getImages(report);

    if (images.length === 0) {
      return null;
    }

    const visibleImages = images.slice(0, 2);

    const remainingCount = Math.max(
      images.length - 2,
      0
    );

    return (
      <View style={styles.imagePreview}>
        {/* İkinci fotoğraf arkada */}
        {visibleImages.length > 1 && (
          <View style={styles.previewBack}>
            <Image
              source={{
                uri: visibleImages[1],
              }}
              style={styles.previewBackImage}
            />

            {remainingCount > 0 && (
              <View
                style={styles.previewCountBadge}
              >
                <Text
                  style={styles.previewCountText}
                >
                  +{remainingCount}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Ana fotoğraf */}
        <View style={styles.previewFront}>
          <Image
            source={{
              uri: visibleImages[0],
            }}
            style={styles.previewFrontImage}
          />
        </View>
      </View>
    );
  }

  async function toggleFollow(report: Report) {
    if (!accessToken) {
      console.log(
        "FOLLOW ERROR: Kullanıcı giriş yapmamış."
      );
      return;
    }

    const isFollowing =
      followingReports[report.id] ?? false;

    try {
      setFollowingLoading(report.id);

      const result = isFollowing
        ? await unfollowReport(
            report.id,
            accessToken
          )
        : await followReport(
            report.id,
            accessToken
          );

      setFollowingReports((current) => ({
        ...current,
        [report.id]: result.following,
      }));

      setFollowerCounts((current) => ({
        ...current,
        [report.id]: result.follower_count,
      }));
    } catch (error) {
      console.log(
        "FOLLOW TOGGLE ERROR:",
        error
      );
    } finally {
      setFollowingLoading(null);
    }
  }

  function getFollowerCount(report: Report) {
    return (
      followerCounts[report.id] ??
      report.follower_count ??
      0
    );
  }

  function goToReport(report: Report) {
    setSelectedReport(null);

    router.push({
      pathname: "/(tabs)/map",
      params: {
        reportId: String(report.id),
        latitude: String(report.latitude),
        longitude: String(report.longitude),
      },
    });
  }

  return (
    <>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              Son Bildirilen Sorunlar
            </Text>

            <Text style={styles.sectionSubtitle}>
              {subtitle}
            </Text>
          </View>
        </View>

        {reports.map((report) => {
          const typedReport =
            report as ReportWithOptionalDetails;

          const priorityColor =
            Colors.priority[
              report.priority as keyof typeof Colors.priority
            ] ?? Colors.textMuted;

          const categoryColor =
            Colors.category[
              report.category as keyof typeof Colors.category
            ] ?? Colors.category.other;

          const isFollowing =
            followingReports[report.id] ?? false;

          const isFollowingLoading =
            followingLoading === report.id;

          return (
            <View
              key={report.id}
              style={styles.reportCard}
            >
              {/* DETAY ALANI */}
              <TouchableOpacity
                activeOpacity={0.82}
                onPress={() =>
                  setSelectedReport(
                    typedReport
                  )
                }
              >
                <View
                  style={styles.reportTopRow}
                >
                  <View
                    style={styles.categoryBadge}
                  >
                    <View
                      style={[
                        styles.categoryBadgeDot,
                        {
                          backgroundColor:
                            categoryColor,
                        },
                      ]}
                    />

                    <Text
                      style={
                        styles.categoryBadgeText
                      }
                    >
                      {categoryLabels[
                        report.category
                      ] ?? report.category}
                    </Text>
                  </View>

                  <View
                    style={styles.statusContainer}
                  >
                    <View
                      style={[
                        styles.statusDot,
                        {
                          backgroundColor:
                            report.status ===
                            "resolved"
                              ? Colors.success
                              : report.status ===
                                "in_progress"
                              ? Colors.warning
                              : Colors.border,
                        },
                      ]}
                    />

                    <Text
                      style={styles.reportStatus}
                    >
                      {statusLabels[
                        report.status
                      ] ?? report.status}
                    </Text>
                  </View>
                </View>

                <Text
                  style={styles.reportTitle}
                  numberOfLines={2}
                >
                  {report.title}
                </Text>

                {/* FOTOĞRAF ÖNİZLEMESİ */}
                {renderImagePreview(
                  typedReport
                )}

                {/* KISA KONUM */}
                <View
                  style={styles.reportLocationRow}
                >
                  <Text
                    style={styles.reportLocationIcon}
                  >
                    📍
                  </Text>

                  <Text
                    style={styles.reportLocationText}
                    numberOfLines={1}
                  >
                    {getLocationSummary(
                      typedReport
                    )}
                  </Text>
                </View>

                <View
                  style={styles.reportFooter}
                >
                  <View
                    style={
                      styles.priorityContainer
                    }
                  >
                    <View
                      style={[
                        styles.priorityDot,
                        {
                          backgroundColor:
                            priorityColor,
                        },
                      ]}
                    />

                    <Text
                      style={
                        styles.reportPriority
                      }
                    >
                      Öncelik:{" "}
                      {priorityLabels[
                        report.priority
                      ] ??
                        report.priority}
                    </Text>
                  </View>

                  <View
                    style={styles.reportStats}
                  >
                    <Text
                      style={styles.reportViews}
                    >
                      {report.view_count} görüntülenme
                    </Text>

                    <Text
                      style={styles.followCount}
                    >
                      {getFollowerCount(
                        report
                      )}{" "}
                      takipçi
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>

              {/* TAKİP BUTONU */}
              <TouchableOpacity
                style={[
                  styles.followButton,
                  isFollowing &&
                    styles.followingButton,
                ]}
                activeOpacity={0.85}
                disabled={isFollowingLoading}
                onPress={() =>
                  toggleFollow(report)
                }
              >
                {isFollowingLoading ? (
                  <ActivityIndicator
                    size="small"
                    color={
                      isFollowing
                        ? "#64748B"
                        : Colors.primary
                    }
                  />
                ) : (
                  <Text
                    style={[
                      styles.followButtonText,
                      isFollowing &&
                        styles.followingButtonText,
                    ]}
                  >
                    {isFollowing
                      ? "Takip Ediliyor ✓"
                      : "Takip Et"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          );
        })}

        {loadingMore && (
          <View
            style={styles.loadMoreContainer}
          >
            <ActivityIndicator
              size="small"
              color={Colors.primary}
            />

            <Text
              style={styles.loadMoreText}
            >
              Daha fazla bildirim yükleniyor...
            </Text>
          </View>
        )}

        {!hasMore &&
          activeOverviewPage === 0 &&
          reports.length > 0 && (
            <View
              style={styles.endContainer}
            >
              <Text style={styles.endText}>
                Tüm bildirimler gösteriliyor.
              </Text>
            </View>
          )}
      </View>

      {/* RAPOR DETAY MODALI */}
      <Modal
        visible={Boolean(selectedReport)}
        transparent
        animationType="slide"
        onRequestClose={() =>
          setSelectedReport(null)
        }
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {selectedReport && (
              <>
                <View style={styles.modalHeader}>
                  <Text
                    style={styles.modalTitle}
                  >
                    Bildirim Detayı
                  </Text>

                  <TouchableOpacity
                    onPress={() =>
                      setSelectedReport(null)
                    }
                    style={styles.closeButton}
                  >
                    <Text
                      style={styles.closeButtonText}
                    >
                      ×
                    </Text>
                  </TouchableOpacity>
                </View>

                <View
                  style={
                    styles.modalCategoryRow
                  }
                >
                  <View
                    style={styles.categoryBadge}
                  >
                    <View
                      style={[
                        styles.categoryBadgeDot,
                        {
                          backgroundColor:
                            Colors.category[
                              selectedReport.category as keyof typeof Colors.category
                            ] ??
                            Colors.category
                              .other,
                        },
                      ]}
                    />

                    <Text
                      style={
                        styles.categoryBadgeText
                      }
                    >
                      {categoryLabels[
                        selectedReport.category
                      ] ??
                        selectedReport.category}
                    </Text>
                  </View>

                  <View
                    style={styles.statusContainer}
                  >
                    <View
                      style={[
                        styles.statusDot,
                        {
                          backgroundColor:
                            selectedReport.status ===
                            "resolved"
                              ? Colors.success
                              : selectedReport.status ===
                                "in_progress"
                              ? Colors.warning
                              : Colors.border,
                        },
                      ]}
                    />

                    <Text
                      style={styles.reportStatus}
                    >
                      {statusLabels[
                        selectedReport.status
                      ] ??
                        selectedReport.status}
                    </Text>
                  </View>
                </View>

                <Text
                  style={
                    styles.modalReportTitle
                  }
                >
                  {selectedReport.title}
                </Text>

                <Text
                  style={styles.detailLabel}
                >
                  Açıklama
                </Text>

                <Text
                  style={
                    styles.descriptionText
                  }
                >
                  {getDescription(
                    selectedReport
                  )}
                </Text>

                {/* DETAYLI KONUM */}
                <Text
                  style={styles.detailLabel}
                >
                  Konum
                </Text>

                <View
                  style={styles.locationBox}
                >
                  <Text
                    style={styles.locationIcon}
                  >
                    📍
                  </Text>

                  <View
                    style={
                      styles.locationContent
                    }
                  >
                    <Text
                      style={
                        styles.locationSummary
                      }
                    >
                      {getLocationSummary(
                        selectedReport
                      )}
                    </Text>

                    {selectedReport.neighborhood?.trim() && (
                      <Text
                        style={
                          styles.locationNeighborhood
                        }
                      >
                        {selectedReport.neighborhood.trim()}
                      </Text>
                    )}

                    <Text
                      style={
                        styles.locationDetails
                      }
                    >
                      {getLocationDetails(
                        selectedReport
                      )}
                    </Text>

                    <Text
                      style={
                        styles.locationCoordinates
                      }
                    >
                      {getCoordinates(
                        selectedReport
                      )}
                    </Text>
                  </View>
                </View>

                <View
                  style={styles.metaRow}
                >
                  <View
                    style={styles.metaItem}
                  >
                    <Text
                      style={
                        styles.metaLabel
                      }
                    >
                      Öncelik
                    </Text>

                    <Text
                      style={
                        styles.metaValue
                      }
                    >
                      {priorityLabels[
                        selectedReport.priority
                      ] ??
                        selectedReport.priority}
                    </Text>
                  </View>

                  <View
                    style={styles.metaItem}
                  >
                    <Text
                      style={
                        styles.metaLabel
                      }
                    >
                      Görüntülenme
                    </Text>

                    <Text
                      style={
                        styles.metaValue
                      }
                    >
                      {
                        selectedReport.view_count
                      }
                    </Text>
                  </View>

                  <View
                    style={styles.metaItem}
                  >
                    <Text
                      style={
                        styles.metaLabel
                      }
                    >
                      Takipçi
                    </Text>

                    <Text
                      style={
                        styles.metaValue
                      }
                    >
                      {getFollowerCount(
                        selectedReport
                      )}
                    </Text>
                  </View>
                </View>

                <Text
                  style={styles.detailLabel}
                >
                  Görseller
                </Text>

                <View
                  style={styles.imageRow}
                >
                  {getImages(
                    selectedReport
                  )
                    .slice(0, 2)
                    .map(
                      (
                        image,
                        index
                      ) => (
                        <Image
                          key={`${image}-${index}`}
                          source={{
                            uri: image,
                          }}
                          style={
                            styles.reportImage
                          }
                        />
                      )
                    )}
                </View>

                {/* MODAL TAKİP */}
                <TouchableOpacity
                  style={[
                    styles.modalFollowButton,
                    followingReports[
                      selectedReport.id
                    ] &&
                      styles.modalFollowingButton,
                  ]}
                  activeOpacity={0.85}
                  disabled={
                    followingLoading ===
                    selectedReport.id
                  }
                  onPress={() =>
                    toggleFollow(
                      selectedReport
                    )
                  }
                >
                  {followingLoading ===
                  selectedReport.id ? (
                    <ActivityIndicator
                      size="small"
                      color={
                        followingReports[
                          selectedReport.id
                        ]
                          ? "#64748B"
                          : Colors.primary
                      }
                    />
                  ) : (
                    <Text
                      style={[
                        styles.modalFollowButtonText,
                        followingReports[
                          selectedReport.id
                        ] &&
                          styles.modalFollowingButtonText,
                      ]}
                    >
                      {followingReports[
                        selectedReport.id
                      ]
                        ? "Takip Ediliyor ✓"
                        : "Şikayeti Takip Et"}
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={
                    styles.goToButton
                  }
                  activeOpacity={0.85}
                  onPress={() =>
                    goToReport(
                      selectedReport
                    )
                  }
                >
                  <Text
                    style={
                      styles.goToButtonText
                    }
                  >
                    Şikayete Git
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 28,
  },

  sectionHeader: {
    marginBottom: 14,
  },

  sectionTitle: {
    fontSize: 21,
    fontWeight: "800",
    color: "#0F172A",
  },

  sectionSubtitle: {
    marginTop: 4,
    color: "#64748B",
    fontSize: 13,
  },

  /* REPORT CARD */

  reportCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 17,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#b5b7ba",
    elevation: 2,
  },

  reportTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 11,
  },

  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  categoryBadgeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },

  categoryBadgeText: {
    color: "#475569",
    fontSize: 11,
    fontWeight: "700",
  },

  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },

  reportStatus: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "600",
  },

  reportTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A",
    lineHeight: 22,
    marginBottom: 9,
  },

  /* FOTOĞRAF ÖNİZLEMESİ */

  imagePreview: {
    height: 108,
    width: "100%",
    position: "relative",
    marginBottom: 13,
  },

  previewBack: {
    position: "absolute",
    right: 2,
    top: 4,
    width: "72%",
    height: 96,
    borderRadius: 16,
    overflow: "hidden",
    opacity: 0.55,
    transform: [
      {
        translateX: 8,
      },
      {
        translateY: -2,
      },
    ],
  },

  previewBackImage: {
    width: "100%",
    height: "100%",
  },

  previewFront: {
    position: "absolute",
    left: 0,
    top: 0,
    width: "72%",
    height: 100,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#E2E8F0",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  previewFrontImage: {
    width: "100%",
    height: "100%",
  },

  previewCountBadge: {
    position: "absolute",
    right: 8,
    bottom: 8,
    minWidth: 30,
    height: 30,
    paddingHorizontal: 8,
    borderRadius: 15,
    backgroundColor:
      "rgba(15, 23, 42, 0.72)",
    alignItems: "center",
    justifyContent: "center",
  },

  previewCountText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },

  /* LOCATION */

  reportLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 13,
  },

  reportLocationIcon: {
    fontSize: 13,
    marginRight: 6,
  },

  reportLocationText: {
    flex: 1,
    color: "#64748B",
    fontSize: 12,
    fontWeight: "600",
  },

  /* FOOTER */

  reportFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  priorityContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  priorityDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },

  reportPriority: {
    color: "#475569",
    fontSize: 12,
    fontWeight: "600",
  },

  reportStats: {
    alignItems: "flex-end",
  },

  reportViews: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "600",
  },

  followCount: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 3,
  },

  followButton: {
    marginTop: 14,
    minHeight: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  followingButton: {
    backgroundColor: "#F1F5F9",
    borderColor: "#E2E8F0",
  },

  followButtonText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: "800",
  },

  followingButtonText: {
    color: "#475569",
  },

  /* LOAD MORE */

  loadMoreContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },

  loadMoreText: {
    marginTop: 8,
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: "600",
  },

  endContainer: {
    alignItems: "center",
    paddingVertical: 16,
  },

  endText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: "600",
  },

  /* MODAL */

  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor:
      "rgba(15, 23, 42, 0.40)",
  },

  modalCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    maxHeight: "88%",
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
  },

  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },

  closeButtonText: {
    color: "#475569",
    fontSize: 25,
    lineHeight: 27,
    fontWeight: "600",
  },

  modalCategoryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  modalReportTitle: {
    fontSize: 22,
    lineHeight: 29,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 18,
  },

  detailLabel: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    marginBottom: 6,
  },

  descriptionText: {
    color: "#334155",
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 18,
  },

  locationBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: 12,
    marginBottom: 18,
  },

  locationIcon: {
    fontSize: 18,
    marginRight: 9,
    marginTop: 1,
  },

  locationContent: {
    flex: 1,
  },

  locationSummary: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "800",
  },

  locationNeighborhood: {
    color: "#475569",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 3,
  },

  locationDetails: {
    color: "#475569",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },

  locationCoordinates: {
    color: "#94A3B8",
    fontSize: 10,
    marginTop: 5,
  },

  metaRow: {
    flexDirection: "row",
    marginBottom: 18,
  },

  metaItem: {
    flex: 1,
  },

  metaLabel: {
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "700",
  },

  metaValue: {
    color: "#334155",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 4,
  },

  imageRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 18,
  },

  reportImage: {
    flex: 1,
    height: 130,
    borderRadius: 16,
    backgroundColor: "#E2E8F0",
  },

  modalFollowButton: {
    minHeight: 48,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },

  modalFollowingButton: {
    backgroundColor: "#F1F5F9",
    borderColor: "#E2E8F0",
  },

  modalFollowButtonText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: "800",
  },

  modalFollowingButtonText: {
    color: "#475569",
  },

  goToButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    minHeight: 52,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
  },

  goToButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
});