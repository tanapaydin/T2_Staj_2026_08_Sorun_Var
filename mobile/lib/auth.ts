import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_CONFIG } from "../config/api";

export type User = {
  id: string;
  name: string;
  email: string;
  avatar_url?: string | null;
  role: string;
  email_verified: boolean;
  created_at: string;
};

export type AuthResponse = {
  access_token: string;
  token_type: string;
  user: User;
};

const baseUrl = API_CONFIG.BASE_URL;
const STORAGE_KEY = "SORUN_VAR_AUTH";

async function parseError(response: Response) {
  try {
    const data = await response.json();
    return data?.detail || data?.message || "İşlem başarısız oldu.";
  } catch {
    return "İşlem başarısız oldu.";
  }
}

export async function saveAuthData(data: AuthResponse): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export async function getAuthData(): Promise<AuthResponse | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function clearAuthData(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${baseUrl}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const message = await parseError(response);
    throw new Error(message);
  }

  const result = await response.json();
  await saveAuthData(result);
  return result;
}

export async function register(
  name: string,
  email: string,
  password: string
): Promise<AuthResponse> {
  const response = await fetch(`${baseUrl}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, email, password }),
  });

  if (!response.ok) {
    const message = await parseError(response);
    throw new Error(message);
  }

  const result = await response.json();
  await saveAuthData(result);
  return result;
}
