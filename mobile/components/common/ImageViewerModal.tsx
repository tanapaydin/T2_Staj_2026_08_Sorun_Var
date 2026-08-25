import { useEffect, useState } from "react";
import {
  FlatList,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ReportImageSource } from "../../constants/reportImages";
import ReportImage from "./ReportImage";

type Props = {
  visible: boolean;
  images: ReportImageSource[];
  category?: string | null;
  initialIndex?: number;
  onClose: () => void;
  embedded?: boolean;
};

export default function ImageViewerModal({
  visible,
  images,
  category,
  initialIndex = 0,
  onClose,
  embedded = false,
}: Props) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const safeTop = Math.max(insets.top, 16);
  const safeBottom = Math.max(insets.bottom, 12);
  const safeInitialIndex = Math.min(
    Math.max(initialIndex, 0),
    Math.max(images.length - 1, 0)
  );
  const [activeIndex, setActiveIndex] = useState(safeInitialIndex);

  useEffect(() => {
    if (visible) {
      setActiveIndex(safeInitialIndex);
    }
  }, [safeInitialIndex, visible]);

  function handleScrollEnd(
    event: NativeSyntheticEvent<NativeScrollEvent>
  ) {
    setActiveIndex(
      Math.round(event.nativeEvent.contentOffset.x / width)
    );
  }

  const viewerContent = (
    <View
      style={[
        styles.container,
        embedded && styles.embeddedContainer,
      ]}
    >
      <View
        style={[
          styles.header,
          {
            height: 58 + safeTop,
            paddingTop: safeTop,
            paddingLeft: Math.max(insets.left, 18),
            paddingRight: Math.max(insets.right, 18),
          },
        ]}
      >
        <Text style={styles.counter}>
          {images.length > 0
            ? `${activeIndex + 1} / ${images.length}`
            : "Görsel"}
        </Text>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Görseli kapat"
          activeOpacity={0.8}
          style={styles.closeButton}
          onPress={onClose}
        >
          <Text style={styles.closeText}>×</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        key={`${visible}-${safeInitialIndex}-${images.length}`}
        data={images}
        horizontal
        pagingEnabled
        initialScrollIndex={safeInitialIndex}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
        keyExtractor={(_, index) => String(index)}
        renderItem={({ item }) => (
          <View style={[styles.imagePage, { width }]}>
            <ReportImage
              image={item}
              category={category}
              style={styles.image}
              resizeMode="contain"
            />
          </View>
        )}
      />

      {images.length > 1 && (
        <Text style={[styles.hint, { paddingBottom: safeBottom }]}>
          Diğer görseller için kaydırın
        </Text>
      )}
    </View>
  );

  if (embedded) {
    return visible ? viewerContent : null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      animationType="fade"
      onRequestClose={onClose}
    >
      {viewerContent}
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(2, 6, 23, 0.98)",
  },
  embeddedContainer: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 1000,
    elevation: 1000,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  counter: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.14)",
  },
  closeText: {
    color: "#FFFFFF",
    fontSize: 30,
    lineHeight: 32,
    fontWeight: "400",
  },
  imagePage: {
    flex: 1,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  hint: {
    color: "rgba(255, 255, 255, 0.72)",
    fontSize: 12,
    textAlign: "center",
    paddingVertical: 14,
  },
});
