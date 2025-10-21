import { DataScopes } from '@sophon-labs/account-core';
import {
  Capabilities,
  SophonContextProvider,
} from '@sophon-labs/account-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { sophonTestnet } from 'viem/chains';

export const Web3Provider = ({ children }: { children: React.ReactNode }) => {
  const insets = useSafeAreaInsets();
  return (
    <SophonContextProvider
      chainId={sophonTestnet.id}
      partnerId="123b216c-678e-4611-af9a-2d5b7b061258"
      // authServerUrl="http://localhost:3000"
      insets={insets}
      dataScopes={[DataScopes.email, DataScopes.apple]}
      requestedCapabilities={[Capabilities.WALLET_CONNECT]}
    >
      {children}
    </SophonContextProvider>
  );
};
