import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Colors, Layout, MapTokens, Radius, Shadows, Spacing, Typography } from "../../theme";
import { AppButton, AppText } from "../common";

type MapControlsProps = {
  showSearchAreaButton: boolean;
  onShowSearchArea: () => void;
  searchAreaDisabled: boolean;
  searchAreaLoading: boolean;
  onOpenFilters: () => void;
  onOpenSummary: () => void;
};

export default function MapControls({
  showSearchAreaButton,
  onShowSearchArea,
  searchAreaDisabled,
  searchAreaLoading,
  onOpenFilters,
  onOpenSummary,
}: MapControlsProps) {
  return (
    <>
      {showSearchAreaButton && (
        <View style={styles.searchAreaContainer} pointerEvents="box-none">
          <Pressable
            disabled={searchAreaDisabled || searchAreaLoading}
            onPress={onShowSearchArea}
            style={[
              styles.searchAreaButton,
              (searchAreaDisabled || searchAreaLoading) &&
                styles.searchAreaButtonDisabled,
            ]}
          >
            <AppText
              variant="bodyMedium"
              color={Colors.textInverse}
              style={styles.searchAreaText}
            >
              {searchAreaLoading
                ? "Aranıyor..."
                : searchAreaDisabled
                ? "Aramak için yakınlaşın"
                : "Bu bölgede ara"}
            </AppText>
          </Pressable>
        </View>
      )}

      <View style={styles.filterBar} pointerEvents="box-none">
        <View style={styles.controlColumn}>
          <AppButton
            title="Filtre"
            variant="secondary"
            onPress={onOpenFilters}
            style={styles.filterButton}
          />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Harita genel özetini aç"
            onPress={onOpenSummary}
            style={styles.summaryButton}
          >
            <Ionicons
              name="stats-chart"
              size={19}
              color={Colors.primary}
            />
          </Pressable>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  searchAreaContainer: {
    position: "absolute",
    top: Layout.mapSearchAreaTop,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 18,
    ...Shadows.lg,
  },
  searchAreaButton: {
    backgroundColor: Colors.primary,
    borderRadius: MapTokens.searchAreaRadius,
    paddingHorizontal: MapTokens.searchAreaPaddingHorizontal,
    paddingVertical: MapTokens.searchAreaPaddingVertical,
    minHeight: MapTokens.searchAreaMinHeight,
    justifyContent: "center",
    alignItems: "center",
    ...Shadows.md,
  },
  searchAreaButtonDisabled: {
    backgroundColor: Colors.textMuted,
    opacity: 0.9,
  },
  searchAreaText: {
    ...Typography.meta,
    fontWeight: "800",
  },
  filterBar: {
    position: "absolute",
    top: Layout.mapFilterTop,
    left: Layout.mapSideInset,
    width: 96,
    zIndex: 18,
  },
  controlColumn: {
    alignItems: "center",
    alignSelf: "flex-start",
  },
  filterButton: {
    alignSelf: "flex-start",
  },
  summaryButton: {
    width: 40,
    height: 40,
    marginTop: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: Colors.overlayLight,
    borderWidth: 1,
    borderColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.md,
  },
});
