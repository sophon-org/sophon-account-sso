import { useMemo } from 'react';
import { WagmiProvider } from 'wagmi';

import { createMobileConfig } from './create-mobile-config';

export const SophonWagmiProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const config = useMemo(() => {
    return createMobileConfig({});
  }, []);

  return <WagmiProvider config={config}>{children}</WagmiProvider>;
};
