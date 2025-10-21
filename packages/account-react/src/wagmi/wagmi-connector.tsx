import { createSophonConnector } from '@sophon-labs/account-connector';
import { useEffect, useMemo } from 'react';
import { useConfig } from 'wagmi';
import { useSophonContext } from '../hooks/useSophonContext';
import { WagmiSophonSync } from './wagmi-sync-sophon';

export const SophonWagmiConnector = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const config = useConfig();
  const { partnerId, authServerUrl, chainId, updateConnector, communicator } =
    useSophonContext();
  const connector = useMemo(() => {
    return createSophonConnector(
      chainId,
      partnerId,
      authServerUrl,
      communicator,
    );
  }, [partnerId, chainId, authServerUrl, communicator]);

  const internalConnector = useMemo(() => {
    return config._internal.connectors.setup(connector);
  }, [config, connector]);

  useEffect(() => {
    updateConnector(internalConnector);
    config._internal.connectors.setState(
      internalConnector ? [internalConnector] : [],
    );
  }, [config, internalConnector, updateConnector]);

  return (
    <WagmiSophonSync connector={internalConnector}>{children}</WagmiSophonSync>
  );
};
