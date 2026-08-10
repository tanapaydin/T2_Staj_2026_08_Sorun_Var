export const Colors = {
  // Brand
  primary: "#2563EB",
  primaryDark: "#1D4ED8",
  primaryLight: "#DBEAFE",

  // Status
  success: "#22C55E",
  warning: "#F59E0B",
  danger: "#EF4444",
  info: "#0EA5E9",

  // Backgrounds
  background: "#F8FAFC",
  surface: "#FFFFFF",
  surfaceSecondary: "#F1F5F9",

  // Text
  text: "#0F172A",
  textSecondary: "#475569",
  textMuted: "#64748B",
  textInverse: "#FFFFFF",

  // Borders
  border: "#E2E8F0",
  borderLight: "#F1F5F9",

  // Map categories
  road: "#EF4444",
  trash: "#22C55E",
  lighting: "#F59E0B",
  construction: "#64748B",
  water: "#2563EB",
  park: "#16A34A",
  traffic: "#7C3AED",
  noise: "#DB2777",
  animal: "#92400E",
  other: "#475569",
} as const;

export type ColorKey = keyof typeof Colors;