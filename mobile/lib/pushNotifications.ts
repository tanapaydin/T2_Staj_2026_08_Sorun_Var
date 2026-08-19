import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import {
  registerPushToken,
  unregisterPushToken,
} from "./api";

const PUSH_TOKEN_KEY = "SORUN_VAR_PUSH_TOKEN";

export async function ensurePushPermission(): Promise<void> {
  if (Platform.OS === "web") {
    throw new Error("Push bildirimleri web ortamında kullanılamaz.");
  }

  const permissions = await Notifications.getPermissionsAsync();
  let permissionStatus = permissions.status;

  if (permissionStatus !== "granted" && permissions.canAskAgain === false) {
    throw new Error("Bildirim izinlerinizi açmanız gerekiyor.");
  }

  if (permissionStatus !== "granted") {
    const requested = await Notifications.requestPermissionsAsync();
    permissionStatus = requested.status;

    if (permissionStatus !== "granted" && requested.canAskAgain === false) {
      throw new Error("Bildirim izinlerinizi açmanız gerekiyor.");
    }
  }

  if (permissionStatus !== "granted") {
    throw new Error("Bildirim izni verilmedi.");
  }
}

if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export async function syncPushSubscription(
  accessToken: string,
  enabled: boolean,
  latitude?: number,
  longitude?: number
): Promise<void> {
  if (Platform.OS === "web") return;

  const existingToken = await AsyncStorage.getItem(PUSH_TOKEN_KEY);

  if (!enabled) {
    if (existingToken) {
      await unregisterPushToken(accessToken, existingToken);
      await AsyncStorage.removeItem(PUSH_TOKEN_KEY);
    }
    return;
  }

  await ensurePushPermission();

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("nearby-reports", {
      name: "Yakındaki sorunlar",
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: "default",
    });
  }

  const pushToken = (await Notifications.getExpoPushTokenAsync()).data;
  await registerPushToken(accessToken, pushToken, latitude, longitude);
  await AsyncStorage.setItem(PUSH_TOKEN_KEY, pushToken);
}