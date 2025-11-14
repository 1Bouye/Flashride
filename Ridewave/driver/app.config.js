import "dotenv/config";

const sharedMapsApiKey =
  process.env.GOOGLE_MAPS_ANDROID_KEY ??
  process.env.GOOGLE_MAPS_IOS_KEY ??
  process.env.EXPO_PUBLIC_GOOGLE_CLOUD_API_KEY ??
  "";

export default {
  expo: {
    name: "Flashride Driver",
    slug: "flashride-driver",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    scheme: "flashride-driver",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.flashride.driver",
      config: sharedMapsApiKey
        ? {
            googleMapsApiKey: sharedMapsApiKey,
          }
        : undefined,
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      package: "com.flashride.driver",
      config: sharedMapsApiKey
        ? {
            googleMaps: {
              apiKey: sharedMapsApiKey,
            },
          }
        : undefined,
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    plugins: [
      "expo-router",
      [
        "expo-font",
        {
          fonts: ["./assets/fonts/TT-Octosquares-Medium.ttf"],
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      eas: {
        projectId: "6cdffa57-e0c7-4571-bbe8-7b3c97422bc2",
      },
    },
  },
};

