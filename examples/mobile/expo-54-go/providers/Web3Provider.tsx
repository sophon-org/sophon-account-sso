import { DataScopes, sophonOSTestnet } from '@sophon-labs/account-core';
import {
  type AuthFlowConfig,
  AuthProvider,
  Capabilities,
  SophonContextProvider,
} from '@sophon-labs/account-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Define your custom auth config
const customAuthConfig: AuthFlowConfig = {
  highlight: [
    {
      type: 'socials',
      socialPriority: [
        AuthProvider.GOOGLE,
        AuthProvider.APPLE,
        AuthProvider.DISCORD,
      ],
    },
    { type: 'email' },
  ],
  showMore: [
    { type: 'wallet' },
    {
      type: 'socials',
      socialPriority: [AuthProvider.TELEGRAM, AuthProvider.TWITTER],
    },
  ],
};

export const Web3Provider = ({ children }: { children: React.ReactNode }) => {
  const insets = useSafeAreaInsets();
  return (
    <SophonContextProvider
      chainId={sophonOSTestnet.id}
      partnerId="123b216c-678e-4611-af9a-2d5b7b061258"
      insets={insets}
      locale="en"
      authConfig={customAuthConfig}
      requestedCapabilities={[Capabilities.WALLET_CONNECT]}
    >
      {children}
    </SophonContextProvider>
  );
};
