import { Platform } from "react-native";

const envBase = process.env.EXPO_PUBLIC_API_URL;
const defaultAndroid = "http://10.0.2.2:8000"; // Android emulator
const defaultOther = "http://10.139.45.46:8000"; // host LAN IP (fallback)

export const API_CONFIG = {
  BASE_URL: envBase || (Platform.OS === "android" ? defaultAndroid : defaultOther),
};
