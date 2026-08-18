export const Colors = {
  // Brand
  primary: "#2563EB",
  primaryDark: "#1D4ED8",
  primaryLight: "#DBEAFE",

  // Status
  success: "#86C99E",
  warning: "#F2C96D",
  danger: "#FCA5A5",
  info: "#93C5FD",

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

  // Overlays and map controls
  overlay: "rgba(15, 23, 42, 0.40)",
  overlayLight: "rgba(255, 255, 255, 0.82)",
  overlayLoading: "rgba(255, 255, 255, 0.80)",
  shadow: "#000000",
  transparent: "transparent",

  // Home
  heroBackground: "#E8F1FF",
  heroText: "#1E3A5F",
  heroDivider: "#BFDBFE",

  // Category colors
  category: {
    road: "#FCA5A5",
    trash: "#86EFAC",
    lighting: "#FCD34D",
    construction: "#CBD5E1",
    water: "#93C5FD",
    park: "#A7F3D0",
    traffic: "#C4B5FD",
    noise: "#F9A8D4",
    animal: "#D6B48A",
    other: "#94A3B8",
  },

  // Priority colors
  priority: {
    high: "#FCA5A5",
    medium: "#FCD34D",
    low: "#86EFAC",
  },

  // Stat cards
  statCard: {
    blue: "#F0F6FF",
    green: "#F0FDF4",
    orange: "#FFFBEB",
    purple: "#F5F3FF",
  },

  // Resolution
  resolution: {
    text: "#4D8B68",
    track: "#E8F5EC",
    fill: "#86C99E",
  },
} as const;

export type ColorKey = keyof typeof Colors;
