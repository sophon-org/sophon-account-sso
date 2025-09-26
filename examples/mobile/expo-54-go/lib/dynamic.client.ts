import { createClient } from '@dynamic-labs/client';
import { ReactNativeExtension } from '@dynamic-labs/react-native-extension';

export const dynamicClient = createClient({
  environmentId: '767555fd-deac-4852-bdf2-ec4442697ea7',
}).extend(ReactNativeExtension());
