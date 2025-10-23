import { DataScopes, sophonOSTestnet } from '@sophon-labs/account-core';
import {
  Capabilities,
  SophonContextProvider,
} from '@sophon-labs/account-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const Web3Provider = ({ children }: { children: React.ReactNode }) => {
  const insets = useSafeAreaInsets();
  return (
    <SophonContextProvider
      chainId={sophonOSTestnet.id}
      partnerId="123b216c-678e-4611-af9a-2d5b7b061258"
      insets={insets}
      dataScopes={[DataScopes.email, DataScopes.apple]}
      requestedCapabilities={[Capabilities.WALLET_CONNECT]}
    >
      {children}
    </SophonContextProvider>
  );
};
