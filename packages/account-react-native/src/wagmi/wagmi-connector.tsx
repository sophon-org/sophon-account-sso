import { createSophonConnector } from '@sophon-labs/account-connector';
import { useEffect, useMemo } from 'react';
import { useConfig } from 'wagmi';
import { useSophonAccount, useSophonContext } from '../hooks';
import { MobileCommunicator } from '../provider/mobile-communicator';
import { WagmiSophonSync } from './wagmi-sync-sophon';

export const SophonWagmiConnector = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const config = useConfig();
  const { chainId, partnerId, authServerUrl, provider } = useSophonContext();
  const { isConnected } = useSophonAccount();
  const connector = useMemo(() => {
    if (!partnerId || !provider || !isConnected) return undefined;
    return createSophonConnector(
      chainId,
      partnerId,
      authServerUrl,
      new MobileCommunicator(),
      provider,
    );
  }, [chainId, partnerId, authServerUrl, provider, isConnected]);

  const internalConnector = useMemo(() => {
    if (!connector) return undefined;
    return config._internal.connectors.setup(connector);
  }, [config, connector]);

  useEffect(() => {
    if (internalConnector) {
      config._internal.connectors.setState([internalConnector]);
    } else {
      config._internal.connectors.setState([]);
    }
  }, [config, internalConnector]);

  return (
    <WagmiSophonSync connector={internalConnector}>{children}</WagmiSophonSync>
  );
};
