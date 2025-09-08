import { SophonContextProvider } from '@sophon-labs/account-react-native';

export const Web3Provider = ({ children }: { children: React.ReactNode }) => {
  return (
    <SophonContextProvider
      network="testnet"
      // authServerUrl="http://localhost:3000"
      partnerId="123b216c-678e-4611-af9a-2d5b7b061258"
    >
      {children}
    </SophonContextProvider>
  );
};
