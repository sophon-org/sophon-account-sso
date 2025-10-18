import React from "react";
import { Image, type ImageStyle } from "react-native";

const Icons = {
  apple: require("../assets/icons/social-icons/apple.png"),
  twitter: require("../assets/icons/social-icons/x.png"),
  x: require("../assets/icons/social-icons/x.png"),
  discord: require("../assets/icons/social-icons/discord.png"),
  google: require("../assets/icons/social-icons/google.png"),
  telegram: require("../assets/icons/social-icons/telegram.png"),
  close: require("../assets/icons/ic-close.png"),
};

type Names = keyof typeof Icons;

interface IconProps {
  name: Names;
  size?: ImageStyle["width"];
}

export function Icon({ name, size }: IconProps) {
  const source = Icons[name];
  if (!source) return null;
  return <Image source={source} style={{ width: size, height: size }} />;
}
