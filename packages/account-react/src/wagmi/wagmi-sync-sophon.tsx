import { useCallback, useEffect, useRef } from 'react';
import { type Connector, useConnect, useDisconnect } from 'wagmi';
import { useSophonAccount } from '../hooks';

export interface WagmiSophonSyncProps {
  children: React.ReactNode;
  connector?: Connector;
}

export const WagmiSophonSync = ({
  children,
  connector,
}: WagmiSophonSyncProps) => {
  const { account } = useSophonAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const lastConnectedAddress = useRef<string | null | undefined>(undefined);

  const wagmiDisconnect = useCallback(() => {
    disconnect();
    lastConnectedAddress.current = null;
  }, [disconnect]);

  const wagmiConnect = useCallback(
    (connector: Connector, walletId: string) => {
      lastConnectedAddress.current = walletId;
      connect({ connector });
    },
    [connect],
  );

  const sync = useCallback(() => {
    // Wait until the connector is initialized
    if (!connector) return;

    if (!account?.address) {
      wagmiDisconnect();
      return;
    }

    const walletId = `${connector.id}-${account.address}`;
    // nothing new, just ignore
    if (walletId === lastConnectedAddress.current) {
      return;
    }

    // other wallet connected, then disconnect
    if (lastConnectedAddress.current) {
      wagmiDisconnect();
    }

    wagmiConnect(connector, walletId);
  }, [account, connector, wagmiDisconnect, wagmiConnect]);

  useEffect(() => {
    console.debug(`Syncing sophon account with wagmi: ${account?.address}`);
    sync();
  }, [sync, account]);

  return <>{children}</>;
};
