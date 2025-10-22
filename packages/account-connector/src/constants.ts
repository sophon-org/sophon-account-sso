import { ChainId } from '@sophon-labs/account-core';
import { sophonOS, sophonOSTestnet } from '@sophon-labs/account-core';
import { sophon, sophonTestnet } from 'viem/chains';

export interface ConnectorMetadata {
  id: string;
  name: string;
  icon: string;
  type: 'zksync-sso';
}

export const SophonConnectorMetadata: Record<ChainId, ConnectorMetadata> = {
  [sophon.id]: {
    id: 'xyz.sophon.account',
    name: 'Sophon Account',
    icon: 'https://sophon.com/favicon.ico',
    type: 'zksync-sso',
  },
  [sophonTestnet.id]: {
    id: 'xyz.sophon.staging.account',
    name: 'Sophon Account Test',
    icon: 'https://sophon.com/favicon.ico',
    type: 'zksync-sso',
  },
  [sophonOS.id]: {
    id: 'xyz.sophon.os.account',
    name: 'Sophon Account',
    icon: 'https://sophon.com/favicon.ico',
    type: 'zksync-sso',
  },
  [sophonOSTestnet.id]: {
    id: 'xyz.sophon.os.staging.account',
    name: 'Sophon Account Test',
    icon: 'https://sophon.com/favicon.ico',
    type: 'zksync-sso',
  },
};
