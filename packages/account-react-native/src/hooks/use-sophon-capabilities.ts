import { useMemo } from 'react';
import { Capabilities } from '../lib/capabilities';
import { useSophonContext } from './use-sophon-context';

export const useSophonCapabilities = () => {
  const { capabilities } = useSophonContext();

  const isWalletConnectEnabled = useMemo(() => {
    return capabilities.includes(Capabilities.WALLET_CONNECT);
  }, [capabilities]);

  return {
    capabilities,
    isWalletConnectEnabled,
  };
};
