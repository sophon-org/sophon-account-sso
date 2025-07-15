import React, { createContext, useState, useMemo, useRef } from 'react';
import { SophonModal } from './webview';
import type WebView from 'react-native-webview';
import { createWalletProvider } from './wallet-provider';
import { FlowController } from './flow-controller';
import type { WalletProvider } from 'zksync-sso';

export const SophonAccountContext = createContext<{
  user: any;
  setUser: (user: any) => void;
  isModalVisible: boolean;
  hideModal: () => void;
  showModal: () => void;
  flow: typeof FlowController;
  walletProvider: WalletProvider | null;
}>({
  user: null,
  setUser: () => {},
  isModalVisible: false,
  hideModal: () => {},
  showModal: () => {},
  flow: FlowController,
  walletProvider: null,
});

export const SophonAccountProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [user, setUser] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const webViewRef = useRef<WebView>(null);
  const flow = useMemo(() => FlowController.init(webViewRef), [webViewRef]);
  const walletProvider = useMemo(() => createWalletProvider(flow), [flow]);

  const contextValue = useMemo(
    () => ({
      user,
      setUser,
      isModalVisible,
      hideModal: () => setIsModalVisible(false),
      showModal: () => setIsModalVisible(true),
      walletProvider,
      flow,
    }),
    [user, setUser, isModalVisible, setIsModalVisible, walletProvider, flow]
  );

  return (
    <SophonAccountContext.Provider value={contextValue}>
      <SophonModal style={{ flex: 1 }} webViewRef={webViewRef} />
      {children}
    </SophonAccountContext.Provider>
  );
};
