import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="home" options={{ title: "Ana Sayfa" }} />
      <Tabs.Screen name="map" options={{ title: "Harita" }} />
      <Tabs.Screen name="report" options={{ title: "Bildir" }} />
      <Tabs.Screen name="notifications" options={{ title: "Bildirimler" }} />
      <Tabs.Screen name="profile" options={{ title: "Profil" }} />
    </Tabs>
  );
}