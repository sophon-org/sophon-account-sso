import { createClient } from '@dynamic-labs/client';
import { ReactNativeExtension } from '@dynamic-labs/react-native-extension';
import { ViemExtension } from '@dynamic-labs/viem-extension';

export const dynamicClient = createClient({
  environmentId: '767555fd-deac-4852-bdf2-ec4442697ea7',
  appLogoUrl: 'https://demo.dynamic.xyz/favicon-32x32.png',
  appName: 'Sophon Account',
})
  .extend(ReactNativeExtension())
  .extend(ViemExtension());
