import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

import {
  AppButton,
  AppCard,
  AppText,
} from "../common";

import {
  Colors,
  Spacing,
} from "../../theme";

// ============================================================
// TYPES
// ============================================================

type CityDistrictStat = {
  district: string;
  count: number;
};

type CityCategoryStat = {
  category: string;
  count: number;
};

type CitySummary = {
  name: string;
  count: number;
  latitude: number;
  longitude: number;
  districts: CityDistrictStat[];
  categories: CityCategoryStat[];
};

type Props = {
  city: CitySummary | null;
  onClose: () => void;
};

// ============================================================
// CATEGORY LABELS
// ============================================================

const categoryLabels: Record<
  string,
  string
> = {
  road: "Yol",
  trash: "Çöp",
  waste: "Çöp",
  lighting: "Aydınlatma",
  construction: "İnşaat",
  water: "Su",
  park: "Park",
  traffic: "Trafik",
  noise: "Gürültü",
  animal: "Hayvan",
  other: "Diğer",
};

// ============================================================
// COMPONENT
// ============================================================

export default function CitySummaryCard({
  city,
  onClose,
}: Props) {
  const [districtsExpanded, setDistrictsExpanded] =
    useState(false);

  if (!city) {
    return null;
  }

  return (
    <AppCard style={styles.container}>
      {/* ======================================================
          HEADER
      ====================================================== */}

      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <AppText
            variant="title"
            style={styles.title}
            numberOfLines={1}
          >
            {city.name}
          </AppText>

          <AppText
            variant="bodyMedium"
            color={Colors.textSecondary}
            style={styles.subtitle}
          >
            Şikayet özeti
          </AppText>
        </View>

        {/* TOPLAM SAYI */}

        <View style={styles.totalBadge}>
          <AppText
            style={styles.totalBadgeNumber}
          >
            {city.count}
          </AppText>

          <AppText
            style={styles.totalBadgeLabel}
          >
            bildirim
          </AppText>
        </View>

        {/* KAPAT */}

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onClose}
          style={styles.closeButton}
        >
          <AppText
            style={styles.closeButtonText}
          >
            ×
          </AppText>
        </TouchableOpacity>
      </View>

      {/* ======================================================
          SCROLLABLE CONTENT
      ====================================================== */}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={
          styles.scrollContent
        }
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled
        bounces={false}
      >
        {/* ====================================================
            İLÇELER
        ==================================================== */}

        {city.districts.length > 0 && (
          <View style={styles.section}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() =>
                setDistrictsExpanded(
                  (current) => !current
                )
              }
              style={
                styles.sectionHeaderButton
              }
            >
              <View
                style={
                  styles.sectionHeaderLeft
                }
              >
                <AppText
                  variant="bodyMedium"
                  style={
                    styles.sectionTitle
                  }
                >
                  İlçelere Göre
                </AppText>

                <View
                  style={
                    styles.sectionCountBadge
                  }
                >
                  <AppText
                    style={
                      styles.sectionCountText
                    }
                  >
                    {city.districts.length}
                  </AppText>
                </View>
              </View>

              <AppText
                style={
                  styles.expandIcon
                }
              >
                {districtsExpanded
                  ? "⌃"
                  : "⌄"}
              </AppText>
            </TouchableOpacity>

            {districtsExpanded && (
              <View
                style={
                  styles.statsList
                }
              >
                {city.districts.map(
                  (item) => (
                    <View
                      key={
                        item.district
                      }
                      style={
                        styles.statRow
                      }
                    >
                      <View
                        style={
                          styles.statLeft
                        }
                      >
                        <View
                          style={
                            styles.districtDot
                          }
                        />

                        <AppText
                          variant="bodyMedium"
                          color={
                            Colors.textSecondary
                          }
                          numberOfLines={1}
                          style={
                            styles.statName
                          }
                        >
                          {item.district}
                        </AppText>
                      </View>

                      <AppText
                        variant="bodyMedium"
                        style={
                          styles.statCount
                        }
                      >
                        {item.count}
                      </AppText>
                    </View>
                  )
                )}
              </View>
            )}
          </View>
        )}

        {/* ====================================================
            KATEGORİLER
        ==================================================== */}

        {city.categories.length > 0 && (
          <View style={styles.section}>
            <AppText
              variant="bodyMedium"
              style={
                styles.sectionTitle
              }
            >
              Kategorilere Göre
            </AppText>

            <View
              style={
                styles.statsList
              }
            >
              {city.categories.map(
                (item) => (
                  <View
                    key={
                      item.category
                    }
                    style={
                      styles.statRow
                    }
                  >
                    <View
                      style={
                        styles.statLeft
                      }
                    >
                      <View
                        style={
                          styles.categoryDot
                        }
                      />

                      <AppText
                        variant="bodyMedium"
                        color={
                          Colors.textSecondary
                        }
                        numberOfLines={1}
                        style={
                          styles.statName
                        }
                      >
                        {getCategoryLabel(
                          item.category
                        )}
                      </AppText>
                    </View>

                    <AppText
                      variant="bodyMedium"
                      style={
                        styles.statCount
                      }
                    >
                      {item.count}
                    </AppText>
                  </View>
                )
              )}
            </View>
          </View>
        )}

        {/* ====================================================
            VERİ YOK
        ==================================================== */}

        {city.count === 0 && (
          <AppText
            variant="bodyMedium"
            color={
              Colors.textSecondary
            }
            style={
              styles.emptyText
            }
          >
            Bu şehir için bildirim
            bulunmuyor.
          </AppText>
        )}
      </ScrollView>

      {/* ======================================================
          KAPAT BUTONU
      ====================================================== */}

      <AppButton
        title="Kapat"
        onPress={onClose}
        style={styles.button}
      />
    </AppCard>
  );
}

// ============================================================
// HELPERS
// ============================================================

function getCategoryLabel(
  category: string
) {
  return (
    categoryLabels[category] ??
    category
  );
}

// ============================================================
// STYLES
// ============================================================

const styles =
  StyleSheet.create({
    container: {
      position: "absolute",

      bottom: 20,
      left: 20,
      right: 20,

      maxHeight: "70%",

      padding: 16,
    },

    header: {
      flexDirection: "row",
      alignItems: "center",

      marginBottom:
        Spacing.md,

      paddingBottom:
        Spacing.md,

      borderBottomWidth: 1,
      borderBottomColor:
        "#E2E8F0",
    },

    headerTitleContainer: {
      flex: 1,

      marginRight: 10,
    },

    title: {
      marginBottom: 2,
    },

    subtitle: {
      fontSize: 12,
    },

    totalBadge: {
      minWidth: 58,
      paddingHorizontal: 8,
      paddingVertical: 7,

      borderRadius: 13,

      backgroundColor:
        "#EEF3FF",

      justifyContent:
        "center",

      alignItems:
        "center",

      marginRight: 8,
    },

    totalBadgeNumber: {
      color:
        Colors.primary,

      fontSize: 19,
      fontWeight: "800",
    },

    totalBadgeLabel: {
      color:
        Colors.primary,

      fontSize: 9,
      fontWeight: "700",

      marginTop: 1,
    },

    closeButton: {
      width: 34,
      height: 34,

      borderRadius: 17,

      backgroundColor:
        "#F1F5F9",

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    closeButtonText: {
      color: "#475569",
      fontSize: 25,
      lineHeight: 27,
      fontWeight: "500",
    },

    scrollView: {
      flexGrow: 0,
    },

    scrollContent: {
      paddingBottom:
        Spacing.sm,
    },

    section: {
      marginBottom:
        Spacing.lg,
    },

    sectionHeaderButton: {
      flexDirection: "row",

      alignItems: "center",

      justifyContent:
        "space-between",

      minHeight: 42,

      paddingHorizontal: 10,
      paddingVertical: 8,

      borderRadius: 12,

      backgroundColor:
        "#F8FAFC",

      borderWidth: 1,
      borderColor:
        "#E2E8F0",
    },

    sectionHeaderLeft: {
      flexDirection: "row",
      alignItems: "center",

      flex: 1,
    },

    sectionTitle: {
      fontSize: 14,
      fontWeight: "800",
    },

    sectionCountBadge: {
      marginLeft: 8,

      minWidth: 22,
      height: 22,

      borderRadius: 11,

      backgroundColor:
        "#E2E8F0",

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    sectionCountText: {
      color: "#475569",
      fontSize: 10,
      fontWeight: "800",
    },

    expandIcon: {
      color:
        "#64748B",

      fontSize: 20,
      fontWeight: "700",

      marginLeft: 8,
    },

    statsList: {
      marginTop: 8,

      gap: 7,
    },

    statRow: {
      minHeight: 36,

      flexDirection: "row",

      alignItems:
        "center",

      justifyContent:
        "space-between",

      paddingHorizontal: 10,
      paddingVertical: 7,

      borderRadius: 10,

      backgroundColor:
        "#F8FAFC",
    },

    statLeft: {
      flexDirection: "row",
      alignItems: "center",

      flex: 1,

      marginRight: 10,
    },

    statName: {
      flex: 1,
      fontSize: 13,
    },

    districtDot: {
      width: 7,
      height: 7,

      borderRadius: 4,

      marginRight: 8,

      backgroundColor:
        Colors.primary,
    },

    categoryDot: {
      width: 7,
      height: 7,

      borderRadius: 4,

      marginRight: 8,

      backgroundColor:
        "#64748B",
    },

    statCount: {
      fontSize: 13,
      fontWeight: "800",

      color:
        "#0F172A",
    },

    emptyText: {
      textAlign: "center",

      paddingVertical:
        Spacing.lg,
    },

    button: {
      marginTop:
        Spacing.md,
    },
  });