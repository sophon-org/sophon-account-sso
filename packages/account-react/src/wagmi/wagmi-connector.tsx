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
  const { partnerId, authServerUrl, network } = useSophonContext();
  const connector = useMemo(() => {
    return sophonSsoConnector(partnerId, network, {
      authServerUrl,
    });
  }, [partnerId, network, authServerUrl]);

  const internalConnector = useMemo(() => {
    return config._internal.connectors.setup(connector);
  }, [config, connector]);

  useEffect(() => {
    config._internal.connectors.setState(
      internalConnector ? [internalConnector] : [],
    );
  }, [config, internalConnector]);

  return <>{children}</>;
};
