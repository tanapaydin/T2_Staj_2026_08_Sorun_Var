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

export async function login(
  email: string,
  password: string
): Promise<AuthResponse> {
  const url = `${baseUrl}/auth/login`;

  console.log("========== LOGIN START ==========");
  console.log("LOGIN URL:", url);
  console.log("LOGIN EMAIL:", email);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    console.log("LOGIN STATUS:", response.status);

    const responseText = await response.text();

    console.log("LOGIN RESPONSE:", responseText);

    if (!response.ok) {
      let message = "Giriş başarısız oldu.";

      try {
        const data = JSON.parse(responseText);
        message =
          data?.detail ||
          data?.message ||
          message;
      } catch {
        if (responseText) {
          message = responseText;
        }
      }

      throw new Error(message);
    }

    const result: AuthResponse =
      JSON.parse(responseText);

    console.log("LOGIN SUCCESS:", result);

    await saveAuthData(result);

    return result;
  } catch (error) {
    console.log("========== LOGIN ERROR ==========");
    console.log(error);

    throw error;
  }
}

export async function register(
  name: string,
  email: string,
  password: string
): Promise<AuthResponse> {
  const url = `${baseUrl}/auth/register`;

  console.log("========== REGISTER START ==========");
  console.log("REGISTER URL:", url);
  console.log("REGISTER EMAIL:", email);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        email,
        password,
      }),
    });

    console.log("REGISTER STATUS:", response.status);

    const responseText = await response.text();

    console.log("REGISTER RESPONSE:", responseText);

    if (!response.ok) {
      let message = "Kayıt başarısız oldu.";

      try {
        const data = JSON.parse(responseText);
        message =
          data?.detail ||
          data?.message ||
          message;
      } catch {
        if (responseText) {
          message = responseText;
        }
      }

      throw new Error(message);
    }

    const result: AuthResponse =
      JSON.parse(responseText);

    console.log("REGISTER SUCCESS:", result);

    await saveAuthData(result);

    return result;
  } catch (error) {
    console.log("========== REGISTER ERROR ==========");
    console.log(error);

    throw error;
  }
}

