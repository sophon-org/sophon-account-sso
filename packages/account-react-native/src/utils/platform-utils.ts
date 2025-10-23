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
      setTimeout(callBack, androidTimeout ?? 30);
    },
  });
}
