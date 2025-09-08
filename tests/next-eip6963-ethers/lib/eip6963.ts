import type { EIP1193Provider } from '@sophon-labs/account-eip6963';

export const getSophonEIP6963Connector = async (timeout = 1000) => {
  const providerPromise = new Promise<EIP1193Provider>((resolve, reject) => {
    const handleProviderAnnouncement = (
      // biome-ignore lint/suspicious/noExplicitAny: dynamic testing
      event: any,
    ) => {
      if (event.type === 'eip6963:announceProvider') {
        console.log('🔍 EIP-6963 provider announcement received:', event);
        const { info, provider } = event.detail;
        const isSophon = info.rdns.startsWith('xyz.sophon.');

        if (isSophon) {
          console.log('✅ Sophon EIP-6963 provider discovered:', info.name);
          window.removeEventListener(
            'eip6963:announceProvider',
            handleProviderAnnouncement,
          );
          resolve(provider);
        }
      }

      setTimeout(() => {
        window.removeEventListener(
          'eip6963:announceProvider',
          handleProviderAnnouncement,
        );
        reject(new Error('Timeout waiting for EIP-6963 provider'));
      }, timeout);
    };

    // Listen for provider announcements
    console.log('🔍 Listening for EIP-6963 provider announcements');
    window.addEventListener(
      'eip6963:announceProvider',
      handleProviderAnnouncement,
    );
  });

  window.dispatchEvent(new Event('eip6963:requestProvider'));
  const provider = await providerPromise;
  return provider;
};
