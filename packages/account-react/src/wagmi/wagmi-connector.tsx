import { sophonSsoConnector } from '@sophon-labs/account-connector';
import { useEffect, useMemo } from 'react';
import { useConfig } from 'wagmi';
import { useSophonContext } from '../hooks';

export const SophonWagmiConnector = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const config = useConfig();
  const { partnerId, authServerUrl, network, updateConnector, communicator } =
    useSophonContext();
  const connector = useMemo(() => {
    return sophonSsoConnector(partnerId, network, {
      authServerUrl,
      communicator,
    });
  }, [partnerId, network, authServerUrl, communicator]);

  const internalConnector = useMemo(() => {
    return config._internal.connectors.setup(connector);
  }, [config, connector]);

  useEffect(() => {
    updateConnector(internalConnector);
    config._internal.connectors.setState(
      internalConnector ? [internalConnector] : [],
    );
  }, [config, internalConnector, updateConnector]);

  return <>{children}</>;
};
