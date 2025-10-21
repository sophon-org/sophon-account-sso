import {
  AccountAuthAPIURL,
  type ChainId,
  SophonIcon,
} from '@sophon-labs/account-core';
import { createSophonEIP1193Provider } from '@sophon-labs/account-provider';
import { sophon, sophonTestnet } from 'viem/chains';
import { announceEip6963Provider } from './eip6963';

export function createSophonEIP6963Emitter(
  chainId: ChainId = sophonTestnet.id,
  partnerId?: string,
  authServerUrl: string = AccountAuthAPIURL[chainId],
) {
  // Skip on server-side
  if (typeof window === 'undefined') {
    return;
  }

  // Create the provider
  const provider = createSophonEIP1193Provider(
    chainId,
    partnerId,
    authServerUrl,
  );

  // Announce it via EIP-6963
  announceEip6963Provider({
    info: {
      uuid: chainId === sophon.id ? 'sophon' : `sophon-testnet`,
      name: chainId === sophon.id ? 'Sophon Account' : 'Sophon Account Test',
      icon: SophonIcon[chainId],
      rdns:
        chainId === sophon.id
          ? 'xyz.sophon.account'
          : `xyz.sophon.staging.account`,
    },
    provider,
  });

  console.log(
    `Sophon EIP-6963 provider announced for chainId ${chainId} and url ${authServerUrl}`,
  );
}
