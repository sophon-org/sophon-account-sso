import {
  SophonContextProvider,
  SophonWagmiConnector,
  SophonWagmiProvider,
} from '@sophon-labs/account-react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { sophonTestnet } from 'viem/chains';

const queryClient = new QueryClient();

export const Web3Provider = ({ children }: { children: React.ReactNode }) => {
  const insets = useSafeAreaInsets();
  return (
    <SophonContextProvider
      chainId={sophonTestnet.id}
      partnerId="123b216c-678e-4611-af9a-2d5b7b061258"
      insets={insets}
      locale="en"

      // dataScopes={[DataScopes.email, DataScopes.apple]}
      // requestedCapabilities={[Capabilities.WALLET_CONNECT]}
    >
      <SophonWagmiProvider>
        <QueryClientProvider client={queryClient}>
          <SophonWagmiConnector>{children}</SophonWagmiConnector>
        </QueryClientProvider>
      </SophonWagmiProvider>
    </SophonContextProvider>
  );
};
