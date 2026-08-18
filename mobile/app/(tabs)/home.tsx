import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";
import HomeHero from "../../components/home/HomeHero";
import ReportScopeCarousel from "../../components/home/ReportScopeCarousel";
import TopStatisticsCard from "../../components/home/TopStatisticsCard";
import ResolutionCard from "../../components/home/ResolutionCards";
import RecentReports from "../../components/home/RecentReports";
import { Colors, Layout, Spacing } from "../../theme";
import { fetchAllReports, fetchCategoryStatistics, fetchReports, fetchStatistics, CategoryStatistics, ReportStatistics } from "../../lib/api";
import { getAuthData } from "../../lib/auth";
import { Report } from "../../types/report";
import { useUserLocation } from "../../hooks/useUserLocation";

const PAGE_SIZE = 10;

function normalizeMunicipality(value: string | null | undefined) {
  return value
    ?.trim()
    .toLocaleLowerCase("tr-TR")
    .replace(/\s+belediyesi$/u, "")
    .trim();
}

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const { currentCity, currentMunicipality } = useUserLocation();
  const scrollViewRef = useRef<ScrollView>(null);
  const [activeOverviewPage, setActiveOverviewPage] = useState(0);
  const [loading, setLoading] = useState(true); const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false); const [hasMore, setHasMore] = useState(true);
  const [reports, setReports] = useState<Report[]>([]); const [allReports, setAllReports] = useState<Report[]>([]);
  const [stats, setStats] = useState<ReportStatistics | null>(null); const [categories, setCategories] = useState<CategoryStatistics[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [cityReports, setCityReports] = useState<Report[]>([]);
  const [municipalityReports, setMunicipalityReports] = useState<Report[]>([]);
  const [showScrollTop, setShowScrollTop] = useState(false);
  useEffect(() => {
    let active = true;

    async function loadLocationReports() {
      if (!currentCity) {
        setCityReports([]);
        setMunicipalityReports([]);
        return;
      }

      try {
        const cityData = await fetchAllReports({
          city: currentCity,
          sort: "newest",
        });

        const municipality = normalizeMunicipality(currentMunicipality);
        const municipalityData = municipality
          ? await fetchAllReports({
              city: currentCity,
              district: currentMunicipality!,
              sort: "newest",
            })
          : [];

        if (active) {
          setCityReports(cityData);
          setMunicipalityReports(municipalityData);
        }
      } catch (error) {
        console.log("Location reports error:", error);
        if (active) {
          setCityReports([]);
          setMunicipalityReports([]);
        }
      }
    }

    void loadLocationReports();

    return () => {
      active = false;
    };
  }, [currentCity, currentMunicipality]);
  const activeReports = activeOverviewPage === 0 ? allReports : activeOverviewPage === 1 ? cityReports : municipalityReports;
  const visibleReports = activeOverviewPage === 0 ? reports : activeOverviewPage === 1 ? cityReports : municipalityReports;
  const resolved = activeReports.filter((report) => report.progress === 100).length;
  const pending = activeReports.length - resolved;
  const rate = activeReports.length ? resolved / activeReports.length * 100 : 0;

  async function load() {
    try {
      const [summary, categoryData, firstPage, locationData] = await Promise.all([fetchStatistics(), fetchCategoryStatistics(), fetchReports({skip:0,limit:PAGE_SIZE,sort:"newest"}), fetchAllReports({sort:"newest"})]);
      setStats(summary); setCategories(categoryData); setReports(firstPage); setAllReports(locationData); setHasMore(firstPage.length >= PAGE_SIZE);
    } catch (error) { console.log("Home data error:", error); }
    finally { setLoading(false); setRefreshing(false); }
  }
  useEffect(() => { void load(); void getAuthData().then((data) => setToken(data?.access_token ?? null)); }, []);
  async function loadMore() { if (loadingMore || !hasMore) return; setLoadingMore(true); try { const next = await fetchReports({skip:reports.length,limit:PAGE_SIZE,sort:"newest"}); setReports((items) => [...items,...next]); setHasMore(next.length >= PAGE_SIZE); } finally { setLoadingMore(false); } }
  if (loading) return <View style={styles.loading}><ActivityIndicator size="large" color={Colors.primary}/><Text style={styles.text}>Veriler yükleniyor...</Text></View>;
  return <View style={styles.screen}><ScrollView ref={scrollViewRef} style={styles.scroll} contentContainerStyle={styles.content} scrollEventThrottle={16} onScroll={({nativeEvent}) => setShowScrollTop(nativeEvent.contentOffset.y > 320)} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />} onMomentumScrollEnd={({nativeEvent}) => { const d=nativeEvent.contentSize.height-(nativeEvent.layoutMeasurement.height+nativeEvent.contentOffset.y); if(d<100) void loadMore(); }}>
    <HomeHero totalReports={stats?.total_reports ?? 0} resolutionRate={rate}/>
    <TopStatisticsCard totalReports={activeReports.length} resolvedReports={resolved} pendingReports={pending} averageProgress={activeReports.length ? activeReports.reduce((sum, report) => sum + report.progress, 0) / activeReports.length : 0}/>
    <ReportScopeCarousel width={width - 40} activePage={activeOverviewPage} onPageChange={setActiveOverviewPage} totalCategories={categories} totalReports={stats?.total_reports ?? 0} city={currentCity} cityCategories={countCategories(cityReports)} cityReports={cityReports.length} municipality={currentMunicipality} municipalityCategories={countCategories(municipalityReports)} municipalityReports={municipalityReports.length}/>
    <ResolutionCard resolutionRate={rate} resolvedReports={resolved} pendingReports={pending}/>
    <RecentReports reports={visibleReports} activeOverviewPage={activeOverviewPage} currentCity={currentCity} currentMunicipality={currentMunicipality} loadingMore={loadingMore} hasMore={hasMore} onLoadMore={loadMore} accessToken={token}/>
  </ScrollView>{showScrollTop && <TouchableOpacity accessibilityRole="button" accessibilityLabel="Sayfanın en üstüne çık" style={styles.scrollTopButton} activeOpacity={0.8} onPress={() => scrollViewRef.current?.scrollTo({y:0,animated:true})}><Text style={styles.scrollTopText}>↑</Text></TouchableOpacity>}</View>;
}
const styles=StyleSheet.create({screen:{flex:1,backgroundColor:Colors.background},scroll:{flex:1},content:{padding:Layout.screenPadding,paddingTop:Layout.homeContentTop,paddingBottom:Layout.homeContentBottom},loading:{flex:1,alignItems:"center",justifyContent:"center",backgroundColor:Colors.background},text:{marginTop:Spacing.md,color:Colors.textSecondary},scrollTopButton:{position:"absolute",left:Layout.screenPadding,bottom:Layout.screenPadding,width:46,height:46,borderRadius:23,alignItems:"center",justifyContent:"center",backgroundColor:"rgba(219, 234, 254, 0.88)",borderWidth:1,borderColor:Colors.primary},scrollTopText:{fontSize:25,fontWeight:"700",lineHeight:29,color:Colors.primary}});
function countCategories(reports: Report[]) { const counts = new Map<string, number>(); reports.forEach((report) => counts.set(report.category, (counts.get(report.category) ?? 0) + 1)); return Array.from(counts, ([category, count]) => ({ category, count })); }
