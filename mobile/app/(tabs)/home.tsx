import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  fetchReports,
  fetchStatistics,
  fetchCategoryStatistics,
  ReportStatistics,
  CategoryStatistics,
} from "../../lib/api";
import { Report } from "../../types/report";

const categoryLabels: Record<string, string> = {
  road: "Yol",
  trash: "Çöp",
  lighting: "Aydınlatma",
  construction: "İnşaat",
  water: "Su",
  park: "Park",
  traffic: "Trafik",
  noise: "Gürültü",
  animal: "Hayvan",
  other: "Diğer",
};

const categoryColors: Record<string, string> = {
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
};

export default function HomeScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [stats, setStats] = useState<ReportStatistics | null>(null);
  const [categories, setCategories] = useState<CategoryStatistics[]>([]);
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [statistics, categoryStats, reportList] =
        await Promise.all([
          fetchStatistics(),
          fetchCategoryStatistics(),
          fetchReports(),
        ]);

      setStats(statistics);
      setCategories(categoryStats);
      setReports(reportList);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function onRefresh() {
    setRefreshing(true);
    loadData();
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>
          Veriler yükleniyor...
        </Text>
      </View>
    );
  }

  const maxCategoryCount =
    categories.length > 0
      ? Math.max(...categories.map((c) => c.count))
      : 1;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      }
    >
      {/* Başlık */}
      <View style={styles.header}>
        <Text style={styles.title}>Sorun Var</Text>
        <Text style={styles.subtitle}>
          Belediye İstatistikleri
        </Text>
      </View>

      {/* İstatistik Kartları */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>
            Toplam Bildirim
          </Text>
          <Text style={styles.statValue}>
            {stats?.total_reports ?? 0}
          </Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>
            Çözülen
          </Text>
          <Text style={styles.statValue}>
            {stats?.resolved_reports ?? 0}
          </Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>
            Bekleyen
          </Text>
          <Text style={styles.statValue}>
            {stats?.pending_reports ?? 0}
          </Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>
            Ortalama İlerleme
          </Text>
          <Text style={styles.statValue}>
            %{stats?.average_progress ?? 0}
          </Text>
        </View>
      </View>

      {/* Kategori Dağılımı */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Kategori Dağılımı
        </Text>

        {categories.map((category) => (
          <View
            key={category.category}
            style={styles.categoryRow}
          >
            <Text style={styles.categoryLabel}>
              {categoryLabels[category.category] ??
                category.category}
            </Text>

            <View style={styles.barContainer}>
              <View
                style={[
                  styles.bar,
                  {
                    width: `${(category.count / maxCategoryCount) * 100}%`,
                    backgroundColor:
                      categoryColors[category.category] ??
                      "#475569",
                  },
                ]}
              />
            </View>

            <Text style={styles.categoryCount}>
              {category.count}
            </Text>
          </View>
        ))}
      </View>

      {/* Son Bildirilen Sorunlar */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Son Bildirilen Sorunlar
        </Text>

        {reports.map((report) => (
          <TouchableOpacity
            key={report.id}
            style={styles.reportCard}
            activeOpacity={0.8}
          >
            <View style={styles.reportHeader}>
              <View
                style={[
                  styles.categoryBadge,
                  {
                    backgroundColor:
                      categoryColors[report.category] ??
                      "#475569",
                  },
                ]}
              >
                <Text style={styles.categoryBadgeText}>
                  {categoryLabels[report.category] ??
                    report.category}
                </Text>
              </View>

              <Text style={styles.reportStatus}>
                {report.status}
              </Text>
            </View>

            <Text style={styles.reportTitle}>
              {report.title}
            </Text>

            <View style={styles.reportFooter}>
              <Text style={styles.reportPriority}>
                Öncelik: {report.priority}
              </Text>

              <Text style={styles.reportViews}>
                {report.view_count} görüntülenme
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  content: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },

  loadingText: {
    marginTop: 12,
    color: "#475569",
    fontWeight: "600",
  },

  header: {
    marginBottom: 24,
  },

  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#0F172A",
  },

  subtitle: {
    marginTop: 4,
    fontSize: 16,
    color: "#64748B",
  },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 28,
  },

  statCard: {
    width: "48%",
    backgroundColor: "white",
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    elevation: 3,
  },

  statLabel: {
    color: "#64748B",
    fontSize: 14,
    fontWeight: "600",
  },

  statValue: {
    marginTop: 8,
    fontSize: 28,
    fontWeight: "800",
    color: "#0F172A",
  },

  section: {
    marginBottom: 28,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 16,
  },

  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  categoryLabel: {
    width: 90,
    fontSize: 14,
    color: "#334155",
    fontWeight: "600",
  },

  barContainer: {
    flex: 1,
    height: 10,
    backgroundColor: "#E2E8F0",
    borderRadius: 999,
    overflow: "hidden",
    marginHorizontal: 10,
  },

  bar: {
    height: "100%",
    borderRadius: 999,
  },

  categoryCount: {
    width: 32,
    textAlign: "right",
    color: "#475569",
    fontWeight: "700",
  },

  reportCard: {
    backgroundColor: "white",
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    elevation: 3,
  },

  reportHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },

  categoryBadgeText: {
    color: "white",
    fontWeight: "700",
    fontSize: 12,
  },

  reportStatus: {
    color: "#64748B",
    fontWeight: "600",
    textTransform: "capitalize",
  },

  reportTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 12,
  },

  reportFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  reportPriority: {
    color: "#475569",
    fontWeight: "600",
  },

  reportViews: {
    color: "#64748B",
    fontWeight: "600",
  },
});