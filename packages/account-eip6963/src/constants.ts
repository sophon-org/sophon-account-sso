import {
  type ChainId,
  SophonIcon,
  sophonOS,
  sophonOSTestnet,
} from '@sophon-labs/account-core';
import { sophon, sophonTestnet } from 'viem/chains';

export interface EIP6963Metadata {
  uuid: string;
  name: string;
  icon: string;
  rdns: string;
}

export const SophonEIP6963Metadata: Record<ChainId, EIP6963Metadata> = {
  [sophon.id]: {
    uuid: 'sophon',
    name: 'Sophon Account',
    icon: SophonIcon[sophon.id],
    rdns: 'xyz.sophon.account',
  },
  [sophonTestnet.id]: {
    uuid: 'sophon-testnet',
    name: 'Sophon Account Test',
    icon: SophonIcon[sophonTestnet.id],
    rdns: 'xyz.sophon.staging.account',
  },
  [sophonOS.id]: {
    uuid: 'sophon-os',
    name: 'Sophon Account',
    icon: SophonIcon[sophonOS.id],
    rdns: 'xyz.sophon.os.account',
  },
  [sophonOSTestnet.id]: {
    uuid: 'sophon-os-testnet',
    name: 'Sophon Account Test',
    icon: SophonIcon[sophonOSTestnet.id],
    rdns: 'xyz.sophon.os.staging.account',
  },
};
