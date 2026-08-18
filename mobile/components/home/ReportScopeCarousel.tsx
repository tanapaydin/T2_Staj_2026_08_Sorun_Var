import { ScrollView, StyleSheet, Text, View } from "react-native";

import { CategoryStatistics } from "../../lib/api";
import { Colors, HomeTokens, Typography } from "../../theme";
import CategoryChart from "./CategoryChart";

type ReportScopeCarouselProps = {
  width: number;
  activePage: number;
  onPageChange: (page: number) => void;
  totalCategories: CategoryStatistics[];
  totalReports: number;
  city: string | null;
  cityCategories: CategoryStatistics[];
  cityReports: number;
  municipality: string | null;
  municipalityCategories: CategoryStatistics[];
  municipalityReports: number;
};

export default function ReportScopeCarousel({
  width,
  activePage,
  onPageChange,
  totalCategories,
  totalReports,
  city,
  cityCategories,
  cityReports,
  municipality,
  municipalityCategories,
  municipalityReports,
}: ReportScopeCarouselProps) {
  return (
    <View style={styles.section}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        onMomentumScrollEnd={({ nativeEvent }) => {
          onPageChange(Math.round(nativeEvent.contentOffset.x / width));
        }}
      >
        <ScopePage
          width={width}
          title="Tüm Raporlar"
          subtitle="Bildirimlerin kategorilere göre dağılımı"
          categories={totalCategories}
          total={totalReports}
        />
        <ScopePage
          width={width}
          title={city ? `${city} Raporları` : "Bulunduğunuz İl"}
          subtitle={
            city
              ? "Bulunduğunuz ildeki bildirimlerin dağılımı"
              : "Konumunuza erişildiğinde ilinizin verileri gösterilecek"
          }
          categories={cityCategories}
          total={cityReports}
        />
        <ScopePage
          width={width}
          title={
            municipality
              ? `${municipality} Belediyesi`
              : "Bulunduğunuz Belediye"
          }
          subtitle={
            municipality
              ? "Bulunduğunuz belediyedeki bildirimlerin dağılımı"
              : "Konumunuza erişildiğinde belediye verileri gösterilecek"
          }
          categories={municipalityCategories}
          total={municipalityReports}
        />
      </ScrollView>

      <View style={styles.indicators} accessibilityLabel="Rapor görünümü sayfaları">
        {[0, 1, 2].map((page) => (
          <View
            key={page}
            style={[
              styles.indicator,
              activePage === page && styles.indicatorActive,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

type ScopePageProps = {
  width: number;
  title: string;
  subtitle: string;
  categories: CategoryStatistics[];
  total: number;
};

function ScopePage({ width, title, subtitle, categories, total }: ScopePageProps) {
  return (
    <View style={[styles.page, { width }]}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      <CategoryChart categories={categories} total={total} />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: HomeTokens.sectionMarginBottom,
  },
  page: {
    paddingHorizontal: 1,
  },
  header: {
    marginBottom: HomeTokens.sectionHeaderMarginBottom,
  },
  title: {
    ...Typography.sectionTitle,
    color: Colors.text,
  },
  subtitle: {
    ...Typography.label,
    color: Colors.textMuted,
    marginTop: 4,
  },
  indicators: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: HomeTokens.pageIndicatorGap,
    marginTop: HomeTokens.pageIndicatorMarginTop,
  },
  indicator: {
    width: HomeTokens.pageIndicatorSize,
    height: HomeTokens.pageIndicatorSize,
    borderRadius: HomeTokens.pageIndicatorSize / 2,
    backgroundColor: Colors.border,
  },
  indicatorActive: {
    backgroundColor: Colors.primary,
  },
});
