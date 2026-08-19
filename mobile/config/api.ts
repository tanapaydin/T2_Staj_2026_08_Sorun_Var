import { Platform } from "react-native";

const envBase = process.env.EXPO_PUBLIC_API_URL?.trim();

const defaultWeb = "http://localhost:8000";
const defaultAndroid = "http://10.0.2.2:8000";
const defaultNativeFallback = "http://127.0.0.1:8000";

const getDefaultApiUrl = () => {
  if (Platform.OS === "android") return defaultAndroid;
  if (Platform.OS === "ios") return defaultWeb;
  return defaultWeb;
};

export const API_CONFIG = {
  BASE_URL:
    envBase ||
    (Platform.OS === "android" ? defaultAndroid : defaultWeb) ||
    defaultNativeFallback,
};
