import { Platform } from "react-native";

export function getApiUrl(path: string): string {
  // Priority 1: Use explicit API URL from env (for APK/production builds)
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  if (apiUrl) {
    console.log(`[API] Using EXPO_PUBLIC_API_URL: ${apiUrl}${path}`);
    return `${apiUrl}${path}`;
  }

  // Priority 2: Web development
  if (Platform.OS === "web") {
    const webUrl = `http://localhost:3000${path}`;
    console.log(`[API] Using web development URL: ${webUrl}`);
    return webUrl;
  }

  // Priority 3: Replit domain (if available)
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  if (domain) {
    const replitUrl = `https://${domain}${path}`;
    console.log(`[API] Using Replit domain: ${replitUrl}`);
    return replitUrl;
  }

  // Fallback: Android emulator
  const fallbackUrl = `http://10.0.2.2:3000${path}`;
  console.log(`[API] Using Android emulator fallback: ${fallbackUrl}`);
  return fallbackUrl;
}
