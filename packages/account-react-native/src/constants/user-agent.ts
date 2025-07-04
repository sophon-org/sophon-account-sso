import { Platform } from "react-native";

export const ANDROID_USER_AGENT = "Chrome/18.0.1025.133 Mobile Safari/535.19";

export const IOS_USER_AGENT =
  "AppleWebKit/602.1.50 (KHTML, like Gecko) CriOS/56.0.2924.75";

export const USER_AGENT =
  Platform.OS === "android" ? ANDROID_USER_AGENT : IOS_USER_AGENT;
