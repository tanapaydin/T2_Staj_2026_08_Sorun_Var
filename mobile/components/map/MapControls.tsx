import { Pressable, StyleSheet, View } from "react-native";

import { Colors, Layout, MapTokens, Radius, Shadows, Spacing, Typography } from "../../theme";
import { AppButton, AppText } from "../common";

type MapControlsProps = {
  showSearchAreaButton: boolean;
  onShowSearchArea: () => void;
  isSearchMode: boolean;
  onShowCurrentCity: () => void;
  onOpenFilters: () => void;
};

export default function MapControls({
  showSearchAreaButton,
  onShowSearchArea,
  isSearchMode,
  onShowCurrentCity,
  onOpenFilters,
}: MapControlsProps) {
  return (
    <>
      {showSearchAreaButton && (
        <View style={styles.searchAreaContainer}>
          <Pressable onPress={onShowSearchArea} style={styles.searchAreaButton}>
            <AppText variant="bodyMedium" color={Colors.textInverse} style={styles.searchAreaText}>
              Bu bölgede ara
            </AppText>
          </Pressable>
        </View>
      )}

      <View style={styles.filterBar}>
        <View style={styles.filterRow}>
          <AppButton
            title="Filtre"
            variant="secondary"
            onPress={onOpenFilters}
            style={styles.filterButton}
          />

          {isSearchMode && (
            <Pressable onPress={onShowCurrentCity} style={styles.searchModeButton}>
              <AppText variant="bodyMedium" color={Colors.textSecondary} style={styles.searchModeText}>
                Bölgede arama
              </AppText>
              <AppText variant="bodyMedium" color={Colors.textSecondary} style={styles.searchModeClose}>
                ×
              </AppText>
            </Pressable>
          )}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  searchAreaContainer: {
    position: "absolute",
    top: Layout.mapSearchAreaTop,
    right: Layout.mapSideInset,
    zIndex: 1000,
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
  searchAreaText: {
    ...Typography.meta,
    fontWeight: "800",
  },
  filterBar: {
    position: "absolute",
    top: Layout.mapFilterTop,
    left: Layout.mapSideInset,
    right: Layout.mapSideInset,
    zIndex: 18,
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  filterButton: {
    alignSelf: "flex-start",
  },
  searchModeButton: {
    marginLeft: Spacing.sm,
    height: MapTokens.searchModeHeight,
    paddingLeft: MapTokens.searchModePaddingLeft,
    paddingRight: MapTokens.searchModePaddingRight,
    borderRadius: Radius.xl,
    backgroundColor: Colors.overlayLight,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: "row",
    alignItems: "center",
  },
  searchModeText: {
    ...Typography.label,
  },
  searchModeClose: {
    marginLeft: Spacing.sm,
    fontSize: Typography.heading.fontSize,
    lineHeight: 20,
  },
});
