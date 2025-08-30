import type { EIP1193Provider } from '@sophon-labs/account-eip6963';
import type { BrowserProvider, Signer } from 'zksync-ethers';

export type Chain = {
  id: number;
  name: null | string;
  rpcUrl: null | string;
  blockExplorerUrl?: string;
  unsupported?: true;
};

export interface EthereumContextValue {
  account:
    | { isConnected: true; address: string }
    | { isConnected: false; address: null };
  network: Chain | null;
  connect: (
    ethereumProvider?: unknown,
    accountAddress?: string,
  ) => Promise<void>;
  disconnect: () => void;
  provider: EIP1193Provider | null;
  signer: Signer | null;
  browserProvider: BrowserProvider | null;
}

declare global {
  interface Window {
    ethereum: unknown;
  }
}
