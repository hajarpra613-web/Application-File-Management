import { Platform } from "react-native";

export function getApiUrl(path: string): string {
  // Priority 1: Use explicit API URL from env (for APK/production builds)
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  if (apiUrl) {
    return `${apiUrl}${path}`;
  }

  // Priority 2: Web development
  if (Platform.OS === "web") {
    return `http://localhost:3000${path}`;
  }

  // Priority 3: Replit domain (if available)
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  if (domain) {
    return `https://${domain}${path}`;
  }

  // Fallback: Android emulator
  return `http://10.0.2.2:3000${path}`;
}
