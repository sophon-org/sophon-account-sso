import { SOPHON_ICON } from './constants';
import { announceEip6963Provider } from './eip6963';
import { createSophonEIP1193Provider } from './provider';

export function createSophonEIP6963Emitter(
  network: 'mainnet' | 'testnet' = 'testnet',
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
      name: 'Sophon SSO',
      icon: SOPHON_ICON,
      rdns:
        network === 'mainnet'
          ? 'xyz.sophon.account'
          : `xyz.sophon.account-testnet`,
    },
    provider,
  });

  console.log(`Sophon EIP-6963 provider announced for ${network}`);
}
