import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { CategoryStatistics } from "../../lib/api";
import { Colors, HomeTokens, Radius, Typography } from "../../theme";
import CategoryChart from "./CategoryChart";

type ReportScopeCarouselProps = {
  width: number;
  activePage: number;
  onPageChange: (page: number) => void;
  totalCategories: CategoryStatistics[];
  totalReports: number;
  totalLoading: boolean;
  city: string | null;
  cityCategories: CategoryStatistics[];
  cityReports: number;
  cityLoading: boolean;
  municipality: string | null;
  municipalityCategories: CategoryStatistics[];
  municipalityReports: number;
  municipalityLoading: boolean;
};

export default function ReportScopeCarousel({
  width,
  activePage,
  onPageChange,
  totalCategories,
  totalReports,
  totalLoading,
  city,
  cityCategories,
  cityReports,
  cityLoading,
  municipality,
  municipalityCategories,
  municipalityReports,
  municipalityLoading,
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
          loading={totalLoading}
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
          loading={cityLoading}
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
          loading={municipalityLoading}
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
  loading: boolean;
};

function ScopePage({
  width,
  title,
  subtitle,
  categories,
  total,
  loading,
}: ScopePageProps) {
  return (
    <View style={[styles.page, { width }]}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      {loading ? (
        <View style={styles.loadingChart}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.loadingText}>İstatistikler yükleniyor...</Text>
        </View>
      ) : (
        <CategoryChart categories={categories} total={total} />
      )}
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
  loadingChart: {
    minHeight: 250,
    borderRadius: Radius.xxl,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    ...Typography.label,
    color: Colors.textMuted,
    marginTop: 10,
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
