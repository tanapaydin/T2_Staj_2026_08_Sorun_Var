import React from "react";
import { Modal, View, StyleSheet } from "react-native";

import {
  AppButton,
  AppChip,
  AppText,
} from "../common";

import {
  Colors,
  Radius,
  Spacing,
} from "../../theme";

type Props = {
  visible: boolean;
  onClose: () => void;

  cityFilterMode:
    | "current"
    | "all"
    | "search";

  onShowCurrentCity: () => void;
  onShowAllCities: () => void;

  categoryFilter: string;
  setCategoryFilter: (value: string) => void;

  resolvedFilter: boolean | undefined;
  setResolvedFilter: (
    value: boolean | undefined
  ) => void;

  dateFilter:
    | "today"
    | "7d"
    | "30d"
    | undefined;

  setDateFilter: (
    value:
      | "today"
      | "7d"
      | "30d"
      | undefined
  ) => void;

  priorityFilter:
    | "high"
    | "medium"
    | "low"
    | undefined;

  setPriorityFilter: (
    value:
      | "high"
      | "medium"
      | "low"
      | undefined
  ) => void;

  onApply: () => void;
  onReset: () => void;
};

export default function FilterModal({
  visible,
  onClose,

  cityFilterMode,
  onShowCurrentCity,
  onShowAllCities,

  categoryFilter,
  setCategoryFilter,

  resolvedFilter,
  setResolvedFilter,

  dateFilter,
  setDateFilter,

  priorityFilter,
  setPriorityFilter,

  onApply,
  onReset,
}: Props) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.filterSheet}>
          <AppText
            variant="title"
            style={{ marginBottom: Spacing.xl }}
          >
            Filtreler
          </AppText>

          {/* Şehir */}
          <AppText
            variant="heading"
            style={styles.filterSection}
          >
            Şehir
          </AppText>

          <View style={styles.filterRow}>
            <AppChip
              label="Kendi şehrim"
              selected={
                cityFilterMode === "current"
              }
              onPress={onShowCurrentCity}
            />

            <AppChip
              label="Tüm şehirler"
              selected={cityFilterMode === "all"}
              onPress={onShowAllCities}
            />
          </View>

          {/* Kategori */}
          <AppText
            variant="heading"
            style={styles.filterSection}
          >
            Kategori
          </AppText>

          <View style={styles.filterRow}>
            {[
              "all",
              "road",
              "trash",
              "lighting",
              "construction",
            ].map((c) => (
              <AppChip
                key={c}
                label={
                  c === "all"
                    ? "Tümü"
                    : c === "road"
                    ? "Yol"
                    : c === "trash"
                    ? "Çöp"
                    : c === "lighting"
                    ? "Aydınlatma"
                    : "İnşaat"
                }
                selected={categoryFilter === c}
                onPress={() => setCategoryFilter(c)}
              />
            ))}
          </View>

          {/* Durum */}
          <AppText
            variant="heading"
            style={styles.filterSection}
          >
            Durum
          </AppText>

          <View style={styles.filterRow}>
            <AppChip
              label="Hepsi"
              selected={resolvedFilter === undefined}
              onPress={() =>
                setResolvedFilter(undefined)
              }
            />

            <AppChip
              label="Çözülmedi"
              selected={resolvedFilter === false}
              onPress={() =>
                setResolvedFilter(false)
              }
            />

            <AppChip
              label="Çözüldü"
              selected={resolvedFilter === true}
              onPress={() =>
                setResolvedFilter(true)
              }
            />
          </View>

          {/* Tarih */}
          <AppText
            variant="heading"
            style={styles.filterSection}
          >
            Tarih
          </AppText>

          <View style={styles.filterRow}>
            {["today", "7d", "30d"].map((d) => (
              <AppChip
                key={d}
                label={
                  d === "today"
                    ? "Bugün"
                    : d === "7d"
                    ? "7 Gün"
                    : "30 Gün"
                }
                selected={dateFilter === d}
                onPress={() =>
                  setDateFilter(d as any)
                }
              />
            ))}
          </View>

          {/* Öncelik */}
          <AppText
            variant="heading"
            style={styles.filterSection}
          >
            Öncelik
          </AppText>

          <View style={styles.filterRow}>
            <AppChip
              label="Hepsi"
              selected={priorityFilter === undefined}
              onPress={() =>
                setPriorityFilter(undefined)
              }
            />

            {["high", "medium", "low"].map((p) => (
              <AppChip
                key={p}
                label={
                  p === "high"
                    ? "Yüksek"
                    : p === "medium"
                    ? "Orta"
                    : "Düşük"
                }
                selected={priorityFilter === p}
                onPress={() =>
                  setPriorityFilter(p as any)
                }
              />
            ))}
          </View>

          {/* Butonlar */}
          <View style={styles.filterButtons}>
            <AppButton
              title="Sıfırla"
              variant="secondary"
              onPress={onReset}
              style={styles.button}
            />

            <AppButton
              title="Uygula"
              onPress={onApply}
              style={styles.button}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.35)",
  },

  filterSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xxl,
    borderTopRightRadius: Radius.xxl,
    padding: Spacing.xxl,
  },

  filterSection: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },

  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },

  filterButtons: {
    flexDirection: "row",
    marginTop: Spacing.xxl,
    gap: Spacing.md,
  },

  button: {
    flex: 1,
  },
});