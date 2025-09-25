import { DataScopes } from '@sophon-labs/account-core';
import { SophonContextProvider } from '@sophon-labs/account-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const Web3Provider = ({ children }: { children: React.ReactNode }) => {
  const insets = useSafeAreaInsets();
  return (
    <SophonContextProvider
      network="testnet"
      partnerId="123b216c-678e-4611-af9a-2d5b7b061258"
      // authServerUrl="http://localhost:3000"
      dataScopes={[DataScopes.email]}
      insets={{
        top: 0,
        bottom: insets.bottom,
        left: insets.left,
        right: insets.right,
      }}
    >
      {children}
    </SophonContextProvider>
  );
};
