import type { EIP6963ProviderDetail } from './types';

export function announceEip6963Provider(wallet: EIP6963ProviderDetail) {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(
    new CustomEvent('eip6963:announceProvider', {
      detail: Object.freeze(wallet),
    }),
  );

  window.addEventListener('eip6963:requestProvider', () => {
    window.dispatchEvent(
      new CustomEvent('eip6963:announceProvider', {
        detail: Object.freeze(wallet),
      }),
    );
  });
}
