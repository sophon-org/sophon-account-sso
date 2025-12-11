import { AccountServerURL, type ChainId } from '@sophon-labs/account-core';
import { createSophonEIP1193Provider } from '@sophon-labs/account-provider';
import { sophonTestnet } from 'viem/chains';
import { SophonEIP6963Metadata } from './constants';
import { announceEip6963Provider } from './eip6963';

export function createSophonEIP6963Emitter(
  chainId: ChainId = sophonTestnet.id,
  partnerId?: string,
  accountServerUrl: string = AccountServerURL[chainId],
) {
  // Skip on server-side
  if (typeof window === 'undefined') {
    return;
  }

  // Create the provider
  const provider = createSophonEIP1193Provider(
    chainId,
    partnerId,
    accountServerUrl,
  );

  // Announce it via EIP-6963
  announceEip6963Provider({
    info: {
      ...SophonEIP6963Metadata[chainId],
    },
    provider,
  });

  console.log(
    `Sophon EIP-6963 provider announced for chainId ${chainId} and url ${accountServerUrl}`,
  );
}
