import type { ImageSourcePropType } from "react-native";

export type ReportImageSource = string | ImageSourcePropType;

const categoryReportImages: Record<string, ImageSourcePropType> = {
  road: require("../assets/report-categories/road.jpg"),
  trash: require("../assets/report-categories/trash.jpg"),
  lighting: require("../assets/report-categories/lighting.jpg"),
  construction: require("../assets/report-categories/construction.jpg"),
  water: require("../assets/report-categories/water.jpg"),
  park: require("../assets/report-categories/park.jpg"),
  traffic: require("../assets/report-categories/traffic.jpg"),
  noise: require("../assets/report-categories/noise.jpg"),
  animal: require("../assets/report-categories/animal.jpg"),
  other: require("../assets/report-categories/other.jpg"),
};

export function getCategoryReportImage(
  category: string | null | undefined
): ImageSourcePropType {
  return categoryReportImages[category ?? ""] ?? categoryReportImages.other;
}

export function getReportImages(
  category: string | null | undefined,
  imageUrls?: Array<string | null | undefined>
): ReportImageSource[] {
  const validUrls = (imageUrls ?? [])
    .filter((url): url is string => typeof url === "string")
    .map((url) => url.trim())
    .filter(Boolean);

  return validUrls.length > 0
    ? validUrls
    : [getCategoryReportImage(category)];
}

export function resolveReportImageSource(
  image: ReportImageSource
): ImageSourcePropType {
  return typeof image === "string" ? { uri: image } : image;
}
