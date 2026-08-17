import React from "react";
import { StyleSheet, View } from "react-native";

import { Report } from "../../types/report";
import { getCategoryLabel } from "../../utils/map";

import {
  AppButton,
  AppCard,
  AppText,
} from "../common";

import {
  Colors,
  Spacing,
} from "../../theme";

type Props = {
  report: Report | null;
  onClose: () => void;
  onGoToLocation?: () => void;
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
  onClose,
  onGoToLocation,
}: Props) {
  if (!report) return null;

  const reportDetails = report as Report & {
    description?: string;
    city?: string;
    municipality?: string;
    district?: string;
    neighborhood?: string;
    address?: string;
    created_at?: string;
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

  return (
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
      </View>

      {/* ACTIONS */}
      <View style={styles.actions}>
        {onGoToLocation && (
          <AppButton
            title="Şikayetin Konumuna Git"
            onPress={onGoToLocation}
            style={styles.locationButton}
          />
        )}

        <AppButton
          title="Kapat"
          variant="secondary"
          onPress={onClose}
          style={styles.closeButton}
        />
      </View>
    </AppCard>
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

    elevation: 8,
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
    gap: 8,
  },

  locationButton: {
    marginTop: Spacing.xs,
  },

  closeButton: {
    marginTop: 0,
  },
});