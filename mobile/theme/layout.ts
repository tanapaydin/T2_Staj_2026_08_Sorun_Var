import { Radius } from "./radius";
import { Spacing } from "./spacing";

export const Layout = {
  screenPadding: Spacing.xl,
  homeContentTop: 48,
  homeContentBottom: Spacing.section,
  mapSearchTop: 55,
  mapFilterTop: 120,
  mapSearchAreaTop: 170,
  mapSideInset: Spacing.xl,
} as const;

export const HomeTokens = {
  heroRadius: 28,
  heroPadding: Spacing.xxl,
  heroStatsMarginTop: Spacing.xxl,
  heroDividerHeight: 42,
  heroDividerMargin: Spacing.xxl,
  sectionMarginBottom: 28,
  sectionHeaderMarginBottom: 14,
  pageIndicatorSize: 7,
  pageIndicatorGap: 7,
  pageIndicatorMarginTop: 14,
  scrollToTopSize: 46,
} as const;

export const MapTokens = {
  userMarkerSize: 18,
  userMarkerBorderWidth: 3,
  searchAreaRadius: Radius.lg + 2,
  searchAreaPaddingHorizontal: 15,
  searchAreaPaddingVertical: 9,
  searchAreaMinHeight: 36,
  searchModeHeight: 40,
  searchModePaddingLeft: 14,
  searchModePaddingRight: 10,
} as const;
