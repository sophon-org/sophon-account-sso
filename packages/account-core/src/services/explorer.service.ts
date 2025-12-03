import type { Address } from 'viem';
import { CHAIN_CONTRACTS, type ChainId, ExplorerAPIURL } from '../constants';
import type { ExplorerTokenInfo } from '../types';

export const ExplorerService = {
  getTokenBalance: async (
    chainId: ChainId,
    address: Address,
    contractAddress: string,
  ): Promise<string | null> => {
    const response = await fetch(
      `${ExplorerAPIURL[chainId]}/api?module=account&action=tokenbalance&contractaddress=${contractAddress}&address=${address}`,
    );

    if (!response.ok) {
      console.log('ERROR', response.status, response.statusText);
      const content = await response.text();
      console.log('ERROR', content);
      throw new Error(`Failed to get token balance by owner: ${content}`);
    }
    return (await response.json())?.result ?? null;
  },

  getTokenFromAddress: async (
    chainId: ChainId,
  ): Promise<ExplorerTokenInfo | null> => {
    const address = CHAIN_CONTRACTS[chainId].passkey;
    const response = await fetch(
      `${ExplorerAPIURL[chainId]}/api?module=token&action=tokeninfo&contractaddress=${address}`,
    );
    if (!response.ok) {
      console.log('ERROR', response.status, response.statusText);
      const content = await response.text();
      console.log('ERROR', content);
      throw new Error(`Failed to get token from address: ${content}`);
    }
    return (await response.json())?.result?.[0] ?? null;
  },
};
