import { createClient } from '@dynamic-labs/client';
import { ReactNativeExtension } from '@dynamic-labs/react-native-extension';

export const dynamicClient = createClient({
  environmentId: 'de970e83-79d8-40ba-80fb-697bfa73f3ed',
  // Optional:
  appLogoUrl: 'https://demo.dynamic.xyz/favicon-32x32.png',
  appName: 'Sophon Demo',
}).extend(ReactNativeExtension());
