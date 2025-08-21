import { SophonIcon, type SophonNetworkType } from '@sophon-labs/account-core';
import { announceEip6963Provider } from './eip6963';
import { createSophonEIP1193Provider } from './provider';

export function createSophonEIP6963Emitter(
  network: SophonNetworkType = 'testnet',
) {
  // Skip on server-side
  if (typeof window === 'undefined') {
    return;
  }

  // Create the provider
  const provider = createSophonEIP1193Provider(network);

  // Announce it via EIP-6963
  announceEip6963Provider({
    info: {
      uuid: network === 'mainnet' ? 'sophon' : `sophon-testnet`,
      name: network === 'mainnet' ? 'Sophon Account' : 'Sophon Testnet Account',
      icon: SophonIcon,
      rdns: network === 'mainnet' ? 'xyz.sophon.my' : `xyz.sophon.staging.my`,
    },
    provider,
  });

  console.log(`Sophon EIP-6963 provider announced for ${network}`);
}
