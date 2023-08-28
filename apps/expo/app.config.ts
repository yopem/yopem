//TODO:  move supabase url to env

import type { ExpoConfig } from "@expo/config";

const SUPABASE_URL = "https://adjyugldzlayoraomrla.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkanl1Z2xkemxheW9yYW9tcmxhIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NzgzOTcyNzksImV4cCI6MTk5Mzk3MzI3OX0.X4idYW4GaAM3N9Jn5WP7GLVmp77OVJTEoNKncXmjntA";
if (typeof SUPABASE_URL !== "string" || typeof SUPABASE_ANON_KEY !== "string") {
  throw new Error("Missing Supabase URL or anonymous key");
}

const defineConfig = (): ExpoConfig => ({
  name: "expo",
  slug: "expo",
  scheme: "expo",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  splash: {
    image: "./assets/icon.png",
    resizeMode: "contain",
    backgroundColor: "#1F104A",
  },
  updates: {
    fallbackToCacheTimeout: 0,
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "your.bundle.identifier",
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/icon.png",
      backgroundColor: "#1F104A",
    },
  },
  // extra: {
  //   eas: {
  //     projectId: "your-eas-project-id",
  //   },
  // },
  experiments: {
    tsconfigPaths: true,
    typedRoutes: true,
  },
  plugins: [
    "expo-router",
    "expo-apple-authentication",
    "./expo-plugins/with-modify-gradle.js",
  ],
});

export default defineConfig;
