import type { EIP6963ProviderDetail } from './types';

/**
 * Announce the provider to the window object according to the EIP-6963 specification.
 * Only works on the client side, because of window object dependency.
 *
 * @see https://eips.ethereum.org/EIPS/eip-6963
 * @param provider - The provider to announce.
 */
export function announceEip6963Provider(provider: EIP6963ProviderDetail) {
  if (typeof window === 'undefined') {
    return;
  }

  const announceEvent = new CustomEvent('eip6963:announceProvider', {
    detail: Object.freeze(provider),
  });

  window.dispatchEvent(announceEvent);

  window.addEventListener('eip6963:requestProvider', () => {
    window.dispatchEvent(announceEvent);
  });
}
