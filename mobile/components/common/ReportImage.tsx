import { useEffect, useState } from "react";
import { Image } from "react-native";
import type {
  ImageResizeMode,
  ImageStyle,
  StyleProp,
} from "react-native";

import {
  getCategoryReportImage,
  resolveReportImageSource,
} from "../../constants/reportImages";
import type { ReportImageSource } from "../../constants/reportImages";

type Props = {
  image: ReportImageSource;
  category?: string | null;
  style?: StyleProp<ImageStyle>;
  resizeMode?: ImageResizeMode;
};

export default function ReportImage({
  image,
  category,
  style,
  resizeMode = "cover",
}: Props) {
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    setLoadFailed(false);
  }, [image]);

  return (
    <Image
      source={
        loadFailed
          ? getCategoryReportImage(category)
          : resolveReportImageSource(image)
      }
      style={style}
      resizeMode={resizeMode}
      onError={() => setLoadFailed(true)}
    />
  );
}
