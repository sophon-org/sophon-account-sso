import { Platform } from 'react-native';

export const execFunctionByPlatform = (platformFunctions: {
  ios?: () => void;
  android?: () => void;
}) => {
  if (Platform.OS === 'ios' && platformFunctions.ios) {
    platformFunctions.ios();
  } else if (Platform.OS === 'android' && platformFunctions.android) {
    platformFunctions.android();
  }
};

export function execTimeoutActionByPlatform(
  callBack: () => void,
  {
    iosTimeout,
    androidTimeout,
    platforms = ['ios', 'android'],
  }: {
    iosTimeout?: number;
    androidTimeout?: number;
    platforms?: string[];
  } = {},
) {
  return execFunctionByPlatform({
    ios: () => {
      if (!platforms.includes('ios')) return;
      setTimeout(callBack, iosTimeout ?? 0);
    },
    android: () => {
      if (!platforms.includes('android')) return;
      setTimeout(callBack, androidTimeout ?? 50);
    },
  });
}

const BASE_WIDTH = 408;

export function scaleWithBoxInput(
  screenWidth: number,
  min: number = 30,
  max: number = 48,
): number {
  const availableWidth = Math.max(screenWidth, 0);
  const scaleFactor = availableWidth / BASE_WIDTH;
  const scaled = scaleFactor * max;
  return Math.min(Math.max(scaled, min), max);
}
